"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import {
  AlertTriangle, Clock, ChevronRight, CheckCircle2,
  AlertCircle, XCircle, SkipForward, Loader2, Target,
  LayoutGrid
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function SecureExamHallContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [examActive, setExamActive] = useState(false);
  const [violationDetected, setViolationDetected] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10800);
  const [loading, setLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showPalette, setShowPalette] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Anti-Cheat & Secure Mode States
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [lastViolationType, setLastViolationType] = useState("");
  
  // Post Exam State
  const [testCompleted, setTestCompleted] = useState(false);
  const [showSolutions, setShowSolutions] = useState(false);
  const [scoreResult, setScoreResult] = useState({ score: 0, total: 0, correct: 0, incorrect: 0, attempted: 0 });

  // Data State
  const [testDetails, setTestDetails] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Tracks user responses: { question_id: selected_option_id }
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [userName, setUserName] = useState<string>("");

  // -------------------------------------------------------------
  // Data Fetching
  // -------------------------------------------------------------
  useEffect(() => {
    const fetchTest = async () => {
      setLoading(true);
      try {
        const testId = searchParams.get('testId');
        
        let testData, testError;
        
        if (testId) {
          const { data, error } = await supabase.from('tests').select('*').eq('id', testId).single();
          testData = data;
          testError = error;
        } else {
          const { data, error } = await supabase.from('tests').select('*').order('created_at', { ascending: false }).limit(1).single();
          testData = data;
          testError = error;
        }

        if (testError || !testData) throw new Error("No tests found");
        setTestDetails(testData);
        setTimeLeft(testData.duration * 60);

        // Fetch Questions with Options
        const { data: qData, error: qError } = await supabase
          .from('questions')
          .select(`id, text, image_url, options(id, text, is_correct)`)
          .eq('test_id', testData.id)
          .order('created_at', { ascending: true });

        if (qError) throw qError;
        setQuestions(qData || []);
        
        // Determine User Role and Profile Info for Results
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('role, full_name, email').eq('id', user.id).single();
          const userIsAdmin = profile?.role === 'admin';
          setIsAdmin(userIsAdmin);
          setUserName(profile?.full_name || profile?.email || user.email || "Student");

          // Check if student has already submitted results for this test
          if (!userIsAdmin) {
            const { data: existingResult } = await supabase
              .from('test_results')
              .select('id')
              .eq('user_id', user.id)
              .eq('test_id', testData.id)
              .maybeSingle();

            if (existingResult) {
              setAlreadySubmitted(true);
            }
          }
        }
      } catch (err) {
        console.error(err);
        alert("Failed to load test data.");
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, []);

  // -------------------------------------------------------------
  // Anti-Cheat Engine: Tab Switching & Minimizing Detection
  // -------------------------------------------------------------
  const saveViolationToDB = async (violationType: string, actionTaken: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !testDetails || isAdmin) return;

      await supabase.from('exam_violations').insert([{
        user_id: user.id,
        test_id: testDetails.id,
        violation_type: violationType,
        action_taken: actionTaken
      }]);
    } catch (err) {
      console.error("Failed to log violation to DB:", err);
    }
  };

  const createIntegrityReport = async (totalViolations: number, status: 'normal' | 'warned' | 'submitted_due_to_violation') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !testDetails || isAdmin) return;

      const summary = totalViolations === 0 
        ? "No violations recorded. Candidate followed all security procedures."
        : totalViolations === 1 
          ? `One violation recorded: ${lastViolationType || "Leaving screen"}. Candidate was warned.`
          : `Candidate locked out due to multiple violations. Last violation: ${lastViolationType || "Leaving screen"}.`;

      const deviceInfo = {
        userAgent: navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        language: navigator.language,
        platform: navigator.platform
      };

      await supabase.from('exam_integrity_reports').insert([{
        user_id: user.id,
        test_id: testDetails.id,
        total_violations: totalViolations,
        violation_summary: summary,
        status: status,
        device_info: deviceInfo
      }]);
    } catch (err) {
      console.error("Failed to save integrity report to DB:", err);
    }
  };

  const triggerViolation = useCallback(async (type: string) => {
    if (!examActive || testCompleted) return;

    // Log violation locally
    const currentCount = violationCount + 1;
    setViolationCount(currentCount);
    setLastViolationType(type);

    // Save violation log to database asynchronously
    saveViolationToDB(type, currentCount === 1 ? "Issued Warning" : "Auto-Submitted Exam");

    if (currentCount === 1) {
      // First violation: Pause exam and show warning modal
      setShowWarningModal(true);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } else if (currentCount >= 2) {
      // Second violation: Auto submit
      setShowWarningModal(false);
      setExamActive(false);
      setViolationDetected(true);
      
      // Save final answers and integrity report
      await finalSubmitToDB(true);
      setTestCompleted(true);
    }
  }, [examActive, violationCount, testCompleted]);

  // Tab & Window Monitor
  useEffect(() => {
    if (!examActive || showWarningModal || testCompleted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation("Tab Switched / Hidden Window");
      }
    };

    const handleBlur = () => {
      triggerViolation("Lost Focus / Switched Application");
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !showWarningModal && !testCompleted) {
        triggerViolation("Exited Fullscreen Mode");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [examActive, triggerViolation, showWarningModal, testCompleted]);

  // Keyboard, Mouse, and Shortcut Restrictions
  useEffect(() => {
    if (!examActive || showWarningModal || testCompleted) return;

    const preventDefaultAction = (e: Event) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const ctrlKey = e.ctrlKey || e.metaKey;
      const shiftKey = e.shiftKey;

      let isSuspicious = false;
      let reason = "";

      // Disable F12 (Inspect Element)
      if (key === "F12") {
        isSuspicious = true;
        reason = "Inspect Element (F12) attempt";
      }

      // Disable Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+Shift+J, Ctrl+U
      if (ctrlKey && shiftKey && (key === "I" || key === "C" || key === "J" || key === "i" || key === "c" || key === "j")) {
        isSuspicious = true;
        reason = "Developer Tools attempt";
      }
      if (ctrlKey && (key === "U" || key === "u")) {
        isSuspicious = true;
        reason = "View Source (Ctrl+U) attempt";
      }

      // Disable Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A
      if (ctrlKey && (key === "C" || key === "c")) {
        isSuspicious = true;
        reason = "Copy attempt (Ctrl+C)";
      }
      if (ctrlKey && (key === "V" || key === "v")) {
        isSuspicious = true;
        reason = "Paste attempt (Ctrl+V)";
      }
      if (ctrlKey && (key === "X" || key === "x")) {
        isSuspicious = true;
        reason = "Cut attempt (Ctrl+X)";
      }
      if (ctrlKey && (key === "A" || key === "a")) {
        isSuspicious = true;
        reason = "Select All attempt (Ctrl+A)";
      }

      // Disable Print Screen, Alt + Print Screen
      if (key === "PrintScreen") {
        isSuspicious = true;
        reason = "Print Screen / Screenshot attempt";
        if (navigator.clipboard) {
          navigator.clipboard.writeText("").catch(() => {});
        }
      }

      // Detect macOS screenshot combinations: Cmd + Shift + 3, Cmd + Shift + 4
      if (ctrlKey && shiftKey && (key === "3" || key === "4")) {
        isSuspicious = true;
        reason = "macOS Screenshot shortcut attempt";
      }

      // Win + Shift + S
      if (ctrlKey && shiftKey && (key === "S" || key === "s")) {
        isSuspicious = true;
        reason = "Snipping tool / Screenshot shortcut attempt";
      }

      if (isSuspicious) {
        e.preventDefault();
        e.stopPropagation();
        triggerViolation(reason);
      }
    };

    document.addEventListener("contextmenu", preventDefaultAction);
    document.addEventListener("copy", preventDefaultAction);
    document.addEventListener("cut", preventDefaultAction);
    document.addEventListener("paste", preventDefaultAction);
    document.addEventListener("selectstart", preventDefaultAction);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", preventDefaultAction);
      document.removeEventListener("copy", preventDefaultAction);
      document.removeEventListener("cut", preventDefaultAction);
      document.removeEventListener("paste", preventDefaultAction);
      document.removeEventListener("selectstart", preventDefaultAction);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [examActive, triggerViolation, showWarningModal, testCompleted]);

  // -------------------------------------------------------------
  // Ticking Clock Engine
  // -------------------------------------------------------------
  useEffect(() => {
    if (!examActive || showWarningModal) return;
    if (timeLeft <= 0) {
      setExamActive(false);
      alert("Time is up! Your test has been automatically submitted.");
      finalSubmitToDB().then(() => setTestCompleted(true));
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, examActive, showWarningModal, router]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // -------------------------------------------------------------
  // Handlers & Submission
  // -------------------------------------------------------------
  const handleSelectOption = (optionId: string) => {
    const qId = questions[currentQuestionIndex].id;
    setResponses(prev => ({ ...prev, [qId]: optionId }));
  };

  const handleClearResponse = () => {
    const qId = questions[currentQuestionIndex].id;
    const newRes = { ...responses };
    delete newRes[qId];
    setResponses(newRes);
  };

  const handleSaveAndNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const finalSubmitToDB = async (isViolationSubmit = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !testDetails) return;

      let score = 0;
      let correctCount = 0;
      let incorrectCount = 0;

      const recordsToInsert = Object.entries(responses).map(([qId, optId]) => {
        const q = questions.find(x => x.id === qId);
        const opt = q?.options.find((o: any) => o.id === optId);
        const isCorrect = opt?.is_correct || false;
        
        if (isCorrect) {
          score += 4;
          correctCount++;
        } else {
          score -= 1;
          incorrectCount++;
        }

        return {
          user_id: user.id,
          test_id: testDetails.id,
          question_id: qId,
          selected_option_id: optId,
          is_correct: isCorrect
        };
      });

      setScoreResult({
        score,
        total: questions.length,
        attempted: recordsToInsert.length,
        correct: correctCount,
        incorrect: incorrectCount
      });

      if (!isAdmin) {
        await supabase.from('test_results').insert([{
           user_id: user.id,
           test_id: testDetails.id,
           score,
           total_questions: questions.length,
           correct_count: correctCount,
           incorrect_count: incorrectCount,
           exam_type: testDetails.exam_type,
           title: testDetails.title
        }]);

        const reportStatus = isViolationSubmit 
          ? 'submitted_due_to_violation' 
          : violationCount === 1 
            ? 'warned' 
            : 'normal';
        
        await createIntegrityReport(violationCount, reportStatus);
      }

      if (recordsToInsert.length > 0 && !isAdmin) {
        await supabase.from('user_responses').insert(recordsToInsert);
      }
    } catch (err) {
      console.error("Submission failed", err);
    }
  };

  const manualSubmit = async () => {
    if (!confirm("Are you sure you want to submit your test?")) return;
    setExamActive(false);
    await finalSubmitToDB();
    setTestCompleted(true);
  };

  const startExam = () => {
    if (!isAdmin && testDetails?.status !== 'live') {
      alert("This exam is not live yet.");
      return;
    }
    
    // Request Fullscreen
    const docEl = document.documentElement;
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen()
        .then(() => {
          setShowInstructions(false);
          setExamActive(true);
        })
        .catch((err) => {
          alert("Fullscreen mode is required to begin this examination. Please allow fullscreen permission.");
        });
    } else {
      setShowInstructions(false);
      setExamActive(true);
    }
  };

  const handleResume = () => {
    const docEl = document.documentElement;
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen()
        .then(() => {
          setShowWarningModal(false);
        })
        .catch(() => {
          alert("Fullscreen mode is required to resume this examination.");
        });
    } else {
      setShowWarningModal(false);
    }
  };

  // -------------------------------------------------------------
  // UI Rendering
  // -------------------------------------------------------------
  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-cyan-400" /></div>;
  }

  if (alreadySubmitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-body animate-in fade-in">
        <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px]" />
          <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mb-6 mx-auto border border-cyan-500/30">
            <Target className="w-10 h-10 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Attempt Locked</h2>
          <p className="text-white/60 mb-8 text-sm leading-relaxed">
            You have already completed and submitted this examination. Multiple attempts are strictly prohibited.
          </p>
          <Link href="/dashboard" className="w-full py-4 rounded-xl bg-cyan-500 text-slate-950 font-bold text-lg hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(34,211,238,0.4)] block">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (showWarningModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 font-body animate-in fade-in">
        <div className="max-w-md w-full bg-slate-900 border-2 border-orange-500 rounded-3xl p-8 relative z-10 shadow-[0_0_50px_rgba(239,68,68,0.3)] flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-6 border border-orange-500/30">
            <AlertTriangle className="w-10 h-10 text-orange-500 animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Security Warning</h2>
          <p className="text-white/70 text-sm mb-4 leading-relaxed">
            Leaving the exam window, switching tabs, exiting fullscreen, or using unauthorized shortcuts is strictly prohibited.
          </p>
          <div className="bg-slate-950 p-4 rounded-xl border border-white/5 w-full text-left mb-8">
            <p className="text-xs text-white/40 uppercase font-bold tracking-wider mb-1">Violation Logged</p>
            <p className="text-orange-400 font-bold text-sm">{lastViolationType || "Leaving screen area"}</p>
          </div>
          <p className="text-red-400 font-bold text-sm mb-6 uppercase tracking-wider animate-pulse">
            ⚠️ One more violation will automatically submit your test.
          </p>
          <button 
            onClick={handleResume}
            className="w-full py-4 rounded-xl bg-orange-500 text-slate-950 font-bold text-lg hover:bg-orange-400 transition-colors shadow-[0_0_20px_rgba(249,115,22,0.4)]"
          >
            I Understand, Resume Exam
          </button>
        </div>
      </div>
    );
  }

  if (violationDetected) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-4 font-body animate-in fade-in">
        <div className="absolute inset-0 bg-red-600/10" />
        <div className="max-w-md w-full bg-slate-900 border-2 border-red-500 rounded-3xl p-8 relative z-10 shadow-[0_0_50px_rgba(239,68,68,0.3)] flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Violation Lockout</h2>
          <p className="text-white/70 mb-8 text-sm leading-relaxed">
            You navigated away from the exam window or switched tabs multiple times. Strict anti-cheat protocols are in place. Your test has been <strong>automatically submitted</strong>.
          </p>
          <Link href="/dashboard" className="w-full py-4 rounded-xl bg-red-500 text-white font-bold text-lg hover:bg-red-600 transition-colors shadow-[0_0_20px_rgba(239,68,68,0.4)]">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (showInstructions && testDetails) {
    const isLive = testDetails.status === 'live';
    const canStart = isAdmin || isLive;
    
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-body">
        <div className="max-w-2xl w-full bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px]" />
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <Target className="w-16 h-16 text-cyan-400 mb-6" />
            <h1 className="text-3xl font-bold mb-2">{testDetails.title}</h1>
            <p className="text-white/50 mb-8 uppercase tracking-widest text-sm font-bold">{testDetails.exam_type} • {testDetails.duration} Mins</p>
            
            <div className="w-full bg-slate-950 rounded-2xl p-6 text-left mb-8 border border-white/5">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-orange-400" /> Exam Instructions</h3>
              <ul className="space-y-3 text-white/70 text-sm">
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" /> <strong>Monitored Environment:</strong> This test is strictly monitored. Leaving the exam window, taking screenshots, or recording the screen is prohibited.</li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" /> <strong>Fullscreen Mode:</strong> The exam will run in fullscreen. Exiting fullscreen, switching tabs, or losing window focus counts as a violation.</li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" /> <strong>Violation Limits:</strong> The first violation will trigger a warning. The second violation will instantly submit your exam.</li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" /> <strong>Action Restrictions:</strong> Copying, pasting, right-clicking, and inspector keys are disabled.</li>
              </ul>
            </div>

            {!isLive && isAdmin && (
               <p className="text-orange-400 font-bold mb-4 bg-orange-500/10 px-4 py-2 rounded-lg">You are previewing a DRAFT test. Students cannot access it yet.</p>
             )}
            
            <button 
              onClick={startExam}
              disabled={!canStart}
              className="w-full py-4 rounded-xl bg-cyan-500 text-slate-950 font-bold text-lg hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {canStart ? (isAdmin ? "Preview Exam" : "I Understand, Begin Exam") : "Test is not live yet"}
            </button>
            
            <Link href="/dashboard" className="mt-4 text-white/50 hover:text-white text-sm transition-colors">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (testCompleted && !showSolutions) {
    const skipped = scoreResult.total - scoreResult.attempted;
    const maxScore = scoreResult.total * 4;
    const percentage = maxScore > 0 ? ((scoreResult.score / maxScore) * 100).toFixed(1) : "0.0";
    
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 md:p-6 text-white font-body">
        <div className="max-w-2xl w-full bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-left">
           <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-green-500/10 rounded-full blur-[80px] pointer-events-none" />
           
           <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6 border-b border-white/10 pb-6 text-center sm:text-left">
             <div className="w-14 h-14 md:w-16 md:h-16 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
               <CheckCircle2 className="w-7 h-7 md:w-8 md:h-8 text-green-400" />
             </div>
             <div>
               <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">Result Summary Card</h2>
               <p className="text-white/50 text-xs md:text-sm font-medium tracking-wide">Test Submitted Successfully!</p>
             </div>
           </div>
           
           <div className="space-y-4 mb-8 text-sm">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="bg-slate-950 p-4 rounded-xl border border-white/5">
                 <p className="text-white/40 text-[10px] md:text-xs font-bold uppercase mb-1">Student Name</p>
                 <p className="text-cyan-400 font-bold text-base md:text-lg break-words">{userName}</p>
               </div>
               <div className="bg-slate-950 p-4 rounded-xl border border-white/5">
                 <p className="text-white/40 text-[10px] md:text-xs font-bold uppercase mb-1">Exam Title</p>
                 <p className="text-white font-bold text-base md:text-lg break-words">{testDetails?.title}</p>
               </div>
             </div>

             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
               <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col items-center justify-center text-center">
                 <p className="text-white/50 text-[10px] md:text-xs font-bold uppercase mb-1">Attempted</p>
                 <p className="text-xl md:text-2xl font-bold text-white">{scoreResult.attempted} <span className="text-xs md:text-sm text-white/30">/ {scoreResult.total}</span></p>
               </div>
               <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/20 flex flex-col items-center justify-center text-center">
                 <p className="text-green-500/50 text-[10px] md:text-xs font-bold uppercase mb-1">Correct</p>
                 <p className="text-xl md:text-2xl font-bold text-green-400">{scoreResult.correct}</p>
               </div>
               <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/20 flex flex-col items-center justify-center text-center">
                 <p className="text-red-500/50 text-[10px] md:text-xs font-bold uppercase mb-1">Wrong</p>
                 <p className="text-xl md:text-2xl font-bold text-red-400">{scoreResult.incorrect}</p>
               </div>
               <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col items-center justify-center text-center">
                 <p className="text-white/50 text-[10px] md:text-xs font-bold uppercase mb-1">Skipped</p>
                 <p className="text-xl md:text-2xl font-bold text-white/50">{skipped}</p>
               </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
               <div className="bg-orange-500/5 p-4 rounded-xl border border-orange-500/20 flex flex-col items-center justify-center text-center">
                 <p className="text-orange-500/50 text-[10px] md:text-xs font-bold uppercase mb-1">Final Score</p>
                 <p className="text-xl md:text-2xl font-bold text-orange-400">{scoreResult.score} <span className="text-xs md:text-sm text-orange-400/50">/ {maxScore}</span></p>
               </div>
               <div className="bg-cyan-500/5 p-4 rounded-xl border border-cyan-500/20 flex flex-col items-center justify-center text-center">
                 <p className="text-cyan-500/50 text-[10px] md:text-xs font-bold uppercase mb-1">Percentage</p>
                 <p className="text-xl md:text-2xl font-bold text-cyan-400">{percentage}%</p>
               </div>
               <div className="bg-slate-950 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
                 <p className="text-white/40 text-[10px] md:text-xs font-bold uppercase mb-1">Date Attempted</p>
                 <p className="text-base md:text-lg font-bold text-white/80">{new Date().toLocaleDateString()}</p>
               </div>
             </div>
           </div>

           <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 border-t border-white/10 pt-6">
             <button onClick={() => setShowSolutions(true)} className="w-full sm:flex-1 py-3.5 md:py-4 rounded-xl bg-white/10 text-white font-bold text-base md:text-lg hover:bg-white/20 transition-colors border border-white/10">
               Review Answers
             </button>
             <Link href="/dashboard" className="w-full sm:flex-1 py-3.5 md:py-4 flex items-center justify-center rounded-xl bg-cyan-500 text-slate-950 font-bold text-base md:text-lg hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(34,211,238,0.4)]">
               Back to Dashboard
             </Link>
           </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];
  const selectedOptionId = currentQ ? responses[currentQ.id] : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50 font-body select-none">

      {/* Top Header */}
      <header className="flex-shrink-0 bg-slate-900 border-b border-white/10 px-4 py-3 md:px-6 md:py-4 flex justify-between items-center z-20">
        <div className="min-w-0 flex-1 mr-3">
          <h1 className="text-lg md:text-xl font-bold tracking-widest uppercase text-white truncate">Accuracy Exam Hall</h1>
          <p className="text-cyan-400 text-xs font-bold mt-0.5 truncate">{testDetails?.title || "Mock Test"}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Palette Toggle Button for Mobile */}
          {!showInstructions && !showSolutions && (
            <button
              onClick={() => setShowPalette(true)}
              className="lg:hidden p-2.5 rounded-xl bg-slate-950 border border-white/10 text-cyan-400 hover:bg-slate-900 transition-colors flex items-center justify-center"
              title="Show Palette"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          )}

          {/* Persistent Header */}
          <div className="flex items-center gap-2 md:gap-3 bg-slate-950 border border-white/10 px-3 md:px-6 py-2 md:py-3 rounded-xl shadow-inner">
            {showSolutions ? (
              <span className="text-green-400 font-bold uppercase tracking-widest text-xs md:text-sm flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4"/> Solution Mode</span>
            ) : (
              <>
                <Clock className={`w-4 h-4 md:w-5 md:h-5 ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`} />
                <span className={`text-lg md:text-2xl font-bold tracking-widest font-mono ${timeLeft < 300 ? 'text-red-500' : 'text-white'}`}>
                  {formatTime(timeLeft)}
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left Side: Question Display */}
        <main className="flex-1 flex flex-col h-full lg:border-r border-white/10 relative min-w-0">
          <div className="flex-1 p-4 md:p-8 overflow-y-auto scrollbar-hide">
            <div className="max-w-4xl mx-auto">
              {questions.length === 0 ? (
                <div className="text-center text-white/50 py-20">No questions available for this test.</div>
              ) : (
                <>
                  {/* Question Header */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 border-b border-white/5 pb-4 mb-8">
                    <h2 className="text-xl md:text-2xl font-bold text-white">Question {currentQuestionIndex + 1}</h2>
                    <div className="flex gap-3 text-xs md:text-sm font-bold">
                      <span className="text-green-400 bg-green-400/10 px-2.5 py-1 rounded-md">+4 Marks</span>
                      <span className="text-red-400 bg-red-400/10 px-2.5 py-1 rounded-md">-1 Mark</span>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="prose prose-invert max-w-none mb-8 md:mb-12">
                    {currentQ.image_url && (
                      <div className="mb-6 rounded-xl overflow-hidden border border-white/10 bg-white/5 max-w-2xl">
                        <img src={currentQ.image_url} alt="Question Diagram" className="w-full h-auto object-contain max-h-96" />
                      </div>
                    )}
                    <p className="text-lg leading-relaxed text-white/90 whitespace-pre-wrap">
                      {currentQ.text}
                    </p>
                  </div>

                  {/* Options Grid */}
                  <div className="space-y-4">
                    {currentQ.options.map((opt: any) => {
                      const isSelected = selectedOptionId === opt.id;
                      const isCorrectAnswer = opt.is_correct;
                      
                      let optionClasses = "bg-white/5 border-white/10 hover:border-cyan-500/50";
                      let indicatorColor = "border-white/30 group-hover:border-cyan-500/50";
                      let textColor = "text-white/80";

                      let suffix = null;

                      if (showSolutions) {
                        if (isCorrectAnswer) {
                          optionClasses = "bg-green-500/20 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]";
                          indicatorColor = "border-green-400 bg-green-400";
                          textColor = "text-green-400 font-bold";
                          suffix = <span className="ml-auto flex items-center gap-1 text-green-400 text-sm font-bold"><CheckCircle2 className="w-5 h-5"/> Correct Answer</span>;
                        } else if (isSelected && !isCorrectAnswer) {
                          optionClasses = "bg-red-500/20 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]";
                          indicatorColor = "border-red-400 bg-red-400";
                          textColor = "text-red-400 font-bold";
                          suffix = <span className="ml-auto flex items-center gap-1 text-red-400 text-sm font-bold"><XCircle className="w-5 h-5"/> Your Choice</span>;
                        } else {
                          optionClasses = "bg-white/5 border-white/10 opacity-50 grayscale";
                          textColor = "text-white/50";
                        }
                      } else if (isSelected) {
                        optionClasses = "bg-cyan-500/10 border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.2)]";
                        indicatorColor = "border-cyan-400";
                        textColor = "text-cyan-400";
                      }

                      return (
                        <label
                          key={opt.id}
                          className={`flex items-start p-4 md:p-5 rounded-2xl border transition-all duration-200 group ${showSolutions ? 'cursor-default' : 'cursor-pointer'} ${optionClasses}`}
                        >
                          <input
                            type="radio"
                            name={`question-${currentQ.id}`}
                            className="hidden"
                            checked={isSelected}
                            disabled={showSolutions}
                            onChange={() => handleSelectOption(opt.id)}
                          />
                          <div className={`w-6 h-6 rounded-full border-2 mr-4 mt-0.5 flex items-center justify-center flex-shrink-0 transition-colors ${indicatorColor}`}>
                            {isSelected && !showSolutions && <div className="w-3 h-3 rounded-full bg-cyan-400" />}
                            {showSolutions && isSelected && <div className="w-2 h-2 rounded-full bg-slate-900" />}
                          </div>
                          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className={`text-base md:text-lg font-medium ${textColor}`}>
                              {opt.text}
                            </span>
                            {suffix}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <footer className="flex-shrink-0 bg-slate-900 border-t border-white/10 p-4 md:p-6 flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between items-center z-20">
            {!showSolutions ? (
              <div className="flex gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <button
                  onClick={handleClearResponse}
                  className="flex-1 sm:flex-none px-4 md:px-6 py-2.5 md:py-3 rounded-xl border border-white/20 text-white/70 font-bold hover:bg-white/5 hover:text-white transition-colors flex items-center justify-center gap-1.5 text-sm md:text-base"
                >
                  <XCircle className="w-4.5 h-4.5 md:w-5 md:h-5" /> Clear Response
                </button>
                {/* Submit button visible in footer on mobile/tablet only */}
                <button
                  onClick={manualSubmit}
                  className="lg:hidden flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-green-500 text-slate-950 font-bold hover:bg-green-400 transition-colors flex items-center justify-center gap-1.5 text-sm shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                >
                  <CheckCircle2 className="w-4.5 h-4.5" /> Submit Exam
                </button>
              </div>
            ) : (
              <Link href="/dashboard" className="w-full sm:w-auto px-5 md:px-6 py-2.5 md:py-3 rounded-xl border border-cyan-500/50 text-cyan-400 font-bold hover:bg-cyan-500/10 transition-colors text-sm md:text-base flex items-center justify-center">
                Back to Dashboard
              </Link>
            )}
            <button
              onClick={handleSaveAndNext}
              className="w-full sm:w-auto px-6 md:px-8 py-2.5 md:py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold text-base md:text-lg hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(34,211,238,0.4)] flex items-center justify-center gap-2"
            >
              {showSolutions ? "Next Question" : "Save & Next"} <SkipForward className="w-4.5 h-4.5 md:w-5 md:h-5" />
            </button>
          </footer>
        </main>

        {/* Backdrop for mobile drawer */}
        {showPalette && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
            onClick={() => setShowPalette(false)}
          />
        )}

        {/* Right Side: Question Palette */}
        <aside
          className={`fixed inset-y-0 right-0 z-40 w-80 bg-slate-900 flex flex-col border-l lg:border-l-0 border-white/10 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:z-0 ${
            showPalette ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="p-6 border-b border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Question Palette</h3>
              <button
                onClick={() => setShowPalette(false)}
                className="lg:hidden text-white/50 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs font-bold text-white/70">
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-cyan-500" /> Answered</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-white/10 border border-white/20" /> Not Visited</div>
            </div>
          </div>

          <div className="p-6 flex-1 overflow-y-auto scrollbar-hide">
            <div className="grid grid-cols-5 gap-3">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentQuestionIndex;
                const isAnswered = !!responses[q.id];

                let stateClass = "bg-white/5 border border-white/10 text-white/50";
                if (isAnswered) stateClass = "bg-cyan-500 text-slate-950 border-none font-extrabold shadow-[0_0_10px_rgba(34,211,238,0.4)]";

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentQuestionIndex(idx);
                      setShowPalette(false); // Close drawer on selection on mobile
                    }}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${stateClass} ${isCurrent ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110" : "hover:bg-white/10"
                      }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {!showSolutions && (
            <div className="p-6 border-t border-white/10">
              <button
                onClick={manualSubmit}
                className="w-full py-4 rounded-xl bg-green-500 text-slate-950 font-bold text-lg hover:bg-green-400 transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
              >
                <CheckCircle2 className="w-5 h-5" /> Submit Exam
              </button>
            </div>
          )}
        </aside>

      </div>
    </div>
  );
}

export default function SecureExamHall() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0f18] flex items-center justify-center text-white flex-col gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        <p className="font-bold text-white/50 tracking-widest uppercase">Initializing Exam Environment...</p>
      </div>
    }>
      <SecureExamHallContent />
    </Suspense>
  );
}
