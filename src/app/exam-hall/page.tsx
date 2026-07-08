"use client";

import React, { useState, useEffect, useCallback, Suspense, useRef } from "react";
import {
  AlertTriangle, Clock, ChevronRight, CheckCircle2,
  AlertCircle, XCircle, SkipForward, Loader2, Target,
  LayoutGrid, ShieldAlert, Lock, Monitor, Check, UploadCloud
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
  const lastViolationTimeRef = useRef<number>(0);
  const [userId, setUserId] = useState<string>("");
  const [attemptNumber, setAttemptNumber] = useState<number>(1);
  
  // Post Exam State
  const [testCompleted, setTestCompleted] = useState(false);
  const [showSolutions, setShowSolutions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // PDF Answer Sheet Upload States for Boards
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfUploadStep, setPdfUploadStep] = useState(false);
  const [scoreResult, setScoreResult] = useState<any>({
    score: 0,
    total: 0,
    correct: 0,
    incorrect: 0,
    attempted: 0,
    rank: 1,
    percentile: "100.0",
    totalStudents: 1,
    subjectStats: {}
  });

  // Data State
  const [testDetails, setTestDetails] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activeSubject, setActiveSubject] = useState<string>("");
  const [activeSectionTab, setActiveSectionTab] = useState<string>("Section A");

  // Tracks user responses: { question_id: selected_option_id }
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [userName, setUserName] = useState<string>("");
  const [userProfile, setUserProfile] = useState<any>(null);

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
          .select(`id, text, image_url, subject, section, explanation, marks, negative_marks, question_type, question_number, options(id, text, is_correct, option_letter)`)
          .eq('test_id', testData.id)
          .order('question_number', { ascending: true });

        if (qError) throw qError;
        
        // Sort options inside each question by option_letter (e.g. A, B, C, D)
        const formattedQuestions = (qData || []).map((q: any) => {
          const sortedOptions = [...(q.options || [])].sort((a: any, b: any) => {
            const letterA = a.option_letter || "";
            const letterB = b.option_letter || "";
            return letterA.localeCompare(letterB);
          });
          return {
            ...q,
            options: sortedOptions
          };
        });

        setQuestions(formattedQuestions);
        
        // Determine User Role and Profile Info for Results
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          const { data: profile } = await supabase.from('profiles').select('role, full_name, email, batch').eq('id', user.id).single();
          const userIsAdmin = profile?.role === 'admin';
          setIsAdmin(userIsAdmin);
          setUserName(profile?.full_name || profile?.email || user.email || "Student");
          setUserProfile(profile);

          // Check if student has already submitted results for this test
          if (!userIsAdmin) {
            const { data: existingResults } = await supabase
              .from('test_results')
              .select('*')
              .eq('user_id', user.id)
              .eq('test_id', testData.id)
              .order('created_at', { ascending: true });

            const attemptCount = existingResults ? existingResults.length : 0;
            
            // Check if student is requesting to view test analysis for a completed attempt
            const viewAnalysis = searchParams.get('viewAnalysis') === 'true';
            const requestedAttempt = parseInt(searchParams.get('attempt') || '1', 10);

            if (viewAnalysis && existingResults && existingResults.length > 0) {
              const selectedResult = existingResults[requestedAttempt - 1] || existingResults[existingResults.length - 1];

              // Restore saved responses from database for this attempt
              const { data: savedResponsesData } = await supabase
                .from('user_responses')
                .select('question_id, selected_option_id, is_correct')
                .eq('user_id', user.id)
                .eq('test_id', testData.id)
                .eq('attempt_number', requestedAttempt);

              const loadedResponses: Record<string, string> = {};
              const subjectStats: Record<string, any> = {};

              // Initialize subject stats for all questions
              formattedQuestions.forEach((q: any) => {
                const sub = q.subject || "Physics";
                if (!subjectStats[sub]) {
                  subjectStats[sub] = { score: 0, correct: 0, incorrect: 0, total: 0, attempted: 0 };
                }
                subjectStats[sub].total++;
              });

              savedResponsesData?.forEach((r: any) => {
                if (r.selected_option_id) {
                  loadedResponses[r.question_id] = r.selected_option_id;

                  // Calculate subject stats
                  const q = formattedQuestions.find((x: any) => x.id === r.question_id);
                  if (q) {
                    const sub = q.subject || "Physics";
                    const qMarks = q.marks !== undefined && q.marks !== null ? q.marks : 4;
                    const qNeg = q.negative_marks !== undefined && q.negative_marks !== null ? q.negative_marks : 1;

                    if (subjectStats[sub]) {
                      subjectStats[sub].attempted++;
                      if (r.is_correct) {
                        subjectStats[sub].score += qMarks;
                        subjectStats[sub].correct++;
                      } else {
                        subjectStats[sub].score -= qNeg;
                        subjectStats[sub].incorrect++;
                      }
                    }
                  }
                }
              });

              setResponses(loadedResponses);

              // Fetch rank and percentile stats
              const rankInfo = await fetchRankAndPercentile(testData.id, selectedResult.score, user.id);

              setScoreResult({
                score: selectedResult.score,
                total: formattedQuestions.length,
                attempted: savedResponsesData?.length || 0,
                correct: selectedResult.correct_count,
                incorrect: selectedResult.incorrect_count,
                rank: rankInfo?.rank || 1,
                percentile: rankInfo?.percentile || "100.0",
                totalStudents: rankInfo?.totalStudents || 1,
                subjectStats
              });

              setAttemptNumber(requestedAttempt);
              setShowInstructions(false);
              setExamActive(false);
              setTestCompleted(true);
            } else if (attemptCount >= 2) {
              setAlreadySubmitted(true);
            } else {
              const currentAttempt = attemptCount + 1;
              setAttemptNumber(currentAttempt);

              // Restore saved responses from localStorage first, fallback to database
              const savedKey = `exam_responses_${user.id}_${testData.id}_attempt_${currentAttempt}`;
              const savedResponses = localStorage.getItem(savedKey);
              if (savedResponses) {
                try {
                  setResponses(JSON.parse(savedResponses));
                } catch (e) {
                  console.error("Failed to parse saved responses", e);
                }
              } else {
                const { data: savedResponsesData, error: loadResponsesError } = await supabase
                  .from('user_responses')
                  .select('question_id, selected_option_id')
                  .eq('user_id', user.id)
                  .eq('test_id', testData.id)
                  .eq('attempt_number', currentAttempt);

                if (savedResponsesData && !loadResponsesError) {
                  const loadedResponses: Record<string, string> = {};
                  savedResponsesData.forEach((r: any) => {
                    if (r.selected_option_id) {
                      loadedResponses[r.question_id] = r.selected_option_id;
                    }
                  });
                  setResponses(loadedResponses);
                  // Cache it in localStorage
                  localStorage.setItem(savedKey, JSON.stringify(loadedResponses));
                }
              }

              // Restore saved remaining time from localStorage if present
              const savedTimeKey = `exam_time_${user.id}_${testData.id}_attempt_${currentAttempt}`;
              const savedTime = localStorage.getItem(savedTimeKey);
              if (savedTime) {
                const parsedTime = parseInt(savedTime, 10);
                if (!isNaN(parsedTime) && parsedTime > 0) {
                  setTimeLeft(parsedTime);
                }
              }
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
  }, [searchParams, supabase]);


  // Autosave remaining time to localStorage when it changes
  useEffect(() => {
    if (userId && testDetails && examActive && !testCompleted) {
      const savedTimeKey = `exam_time_${userId}_${testDetails.id}_attempt_${attemptNumber}`;
      localStorage.setItem(savedTimeKey, timeLeft.toString());
    }
  }, [timeLeft, userId, testDetails, examActive, testCompleted, attemptNumber]);

  // -------------------------------------------------------------
  // Subject Handling & Dynamic Accents
  // -------------------------------------------------------------
  const getSubjectActiveStyle = (sub: string) => {
    const normalized = sub.toLowerCase();
    if (normalized.includes("physic")) {
      return "border-blue-500/40 bg-blue-500/10 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.25)]";
    }
    if (normalized.includes("chemist")) {
      return "border-purple-500/40 bg-purple-500/10 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.25)]";
    }
    if (normalized.includes("botany")) {
      return "border-green-500/40 bg-green-500/10 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.25)]";
    }
    if (normalized.includes("zoology")) {
      return "border-orange-500/40 bg-orange-500/10 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.25)]";
    }
    if (normalized.includes("math") || normalized.includes("mathematic")) {
      return "border-rose-500/40 bg-rose-500/10 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.25)]";
    }
    if (normalized.includes("biolog")) {
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]";
    }
    return "border-cyan-500/40 bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.25)]";
  };

  const getSubjectDotColor = (sub: string) => {
    const normalized = sub.toLowerCase();
    if (normalized.includes("physic")) return "bg-blue-400";
    if (normalized.includes("chemist")) return "bg-purple-400";
    if (normalized.includes("botany")) return "bg-green-400";
    if (normalized.includes("zoology")) return "bg-orange-400";
    if (normalized.includes("math") || normalized.includes("mathematic")) return "bg-rose-400";
    if (normalized.includes("biolog")) return "bg-emerald-400";
    return "bg-cyan-400";
  };

  // Synchronize activeSubject and activeSectionTab with the current question index
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      const currentQ = questions[currentQuestionIndex];
      const sub = currentQ?.subject || "Physics";
      const sec = currentQ?.section || "Section A";
      if (sub && sub !== activeSubject) {
        setActiveSubject(sub);
      }
      if (sec && sec !== activeSectionTab) {
        setActiveSectionTab(sec);
      }
    }
  }, [currentQuestionIndex, questions, activeSubject, activeSectionTab]);

  // -------------------------------------------------------------
  // Anti-Cheat Engine: Tab Switching & Minimizing Detection
  // -------------------------------------------------------------
  const saveViolationToDB = async (violationType: string, actionTaken: string) => {
    try {
      if (!userId || !testDetails || isAdmin) return;

      await supabase.from('exam_violations').insert([{
        user_id: userId,
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
      if (!userId || !testDetails || isAdmin) return;

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
        user_id: userId,
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

    // Throttle violations to prevent double-triggering (e.g. blur + visibilitychange + fullscreenchange in a single switch)
    const now = Date.now();
    if (now - lastViolationTimeRef.current < 2000) {
      console.log("Ignored duplicate violation within cooldown period:", type);
      return;
    }
    lastViolationTimeRef.current = now;

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
      setSubmitting(true);
      try {
        await finalSubmitToDB(true);
        setTestCompleted(true);
      } catch (err) {
        console.error(err);
      } finally {
        setSubmitting(false);
      }
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
      setSubmitting(true);
      finalSubmitToDB().then(() => {
        setTestCompleted(true);
        setSubmitting(false);
      }).catch((err) => {
        console.error(err);
        setSubmitting(false);
      });
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
  const handleSelectOption = async (optionId: string) => {
    const q = questions[currentQuestionIndex];
    if (!q) return;
    const qId = q.id;

    // Check choice limit for Section B questions (JEE Main: 5, NEET: 10)
    const isSectionB = q.section === "Section B";
    if (isSectionB) {
      let limit = 999;
      if (testDetails?.exam_type === "JEE Main") {
        limit = 5;
      } else if (testDetails?.exam_type === "NEET") {
        limit = 10;
      }
      
      const subjectQuestions = questions.filter(x => x.subject === q.subject && x.section === "Section B");
      const attemptedCount = subjectQuestions.filter(x => !!responses[x.id] && x.id !== qId).length;
      
      if (attemptedCount >= limit) {
        alert(`Limit Reached: You can only attempt a maximum of ${limit} questions in ${q.subject} Section B. Please clear your response on another question to answer this one.`);
        return;
      }
    }
    
    // Save to responses state and localStorage immediately
    setResponses(prev => {
      const nextResponses = { ...prev, [qId]: optionId };
      if (userId && testDetails) {
        const savedKey = `exam_responses_${userId}_${testDetails.id}_attempt_${attemptNumber}`;
        localStorage.setItem(savedKey, JSON.stringify(nextResponses));
      }
      return nextResponses;
    });

    if (!isAdmin && userId && testDetails) {
      const opt = q.options.find((o: any) => o.id === optionId);
      const isCorrect = opt?.is_correct || false;

      // Delete existing response for this question/attempt to avoid duplicate rows
      await supabase.from('user_responses')
        .delete()
        .eq('user_id', userId)
        .eq('test_id', testDetails.id)
        .eq('question_id', qId)
        .eq('attempt_number', attemptNumber);

      // Insert new response
      await supabase.from('user_responses').insert({
        user_id: userId,
        test_id: testDetails.id,
        question_id: qId,
        selected_option_id: optionId,
        is_correct: isCorrect,
        attempt_number: attemptNumber
      });
    }
  };

  const handleTextResponseChange = async (textVal: string) => {
    const q = questions[currentQuestionIndex];
    if (!q) return;
    const qId = q.id;

    // Save to responses state and localStorage immediately
    setResponses(prev => {
      const nextResponses = { ...prev, [qId]: textVal };
      if (userId && testDetails) {
        const savedKey = `exam_responses_${userId}_${testDetails.id}_attempt_${attemptNumber}`;
        localStorage.setItem(savedKey, JSON.stringify(nextResponses));
      }
      return nextResponses;
    });

    if (!isAdmin && userId && testDetails) {
      // Delete existing response for this question/attempt to avoid duplicate rows
      await supabase.from('user_responses')
        .delete()
        .eq('user_id', userId)
        .eq('test_id', testDetails.id)
        .eq('question_id', qId)
        .eq('attempt_number', attemptNumber);

      // Insert new response
      await supabase.from('user_responses').insert({
        user_id: userId,
        test_id: testDetails.id,
        question_id: qId,
        text_response: textVal,
        is_correct: null,
        attempt_number: attemptNumber
      });
    }
  };

  const handleClearResponse = async () => {
    const q = questions[currentQuestionIndex];
    if (!q) return;
    const qId = q.id;
    
    // Clear from responses state and localStorage immediately
    setResponses(prev => {
      const nextResponses = { ...prev };
      delete nextResponses[qId];
      if (userId && testDetails) {
        const savedKey = `exam_responses_${userId}_${testDetails.id}_attempt_${attemptNumber}`;
        localStorage.setItem(savedKey, JSON.stringify(nextResponses));
      }
      return nextResponses;
    });

    if (!isAdmin && userId && testDetails) {
      await supabase.from('user_responses')
        .delete()
        .eq('user_id', userId)
        .eq('test_id', testDetails.id)
        .eq('question_id', qId)
        .eq('attempt_number', attemptNumber);
    }
  };

  const handleSaveAndNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      
      const nextQ = questions[nextIndex];
      const nextSub = nextQ?.subject || "Physics";
      const nextSec = nextQ?.section || "Section A";
      if (nextSub && nextSub !== activeSubject) {
        setActiveSubject(nextSub);
      }
      if (nextSec && nextSec !== activeSectionTab) {
        setActiveSectionTab(nextSec);
      }
    }
  };

  const handleSubjectChange = (sub: string) => {
    setActiveSubject(sub);
    // Select the first question of Section A if exists, otherwise first question of that subject
    let firstIdx = questions.findIndex(q => (q.subject || "Physics") === sub && (q.section || "Section A") === "Section A");
    if (firstIdx === -1) {
      firstIdx = questions.findIndex(q => (q.subject || "Physics") === sub);
    }
    if (firstIdx !== -1) {
      setCurrentQuestionIndex(firstIdx);
      const sec = questions[firstIdx]?.section || "Section A";
      setActiveSectionTab(sec);
    }
  };

  const handleSectionTabChange = (sec: string) => {
    setActiveSectionTab(sec);
    const firstIdx = questions.findIndex(q => (q.subject || "Physics") === activeSubject && (q.section || "Section A") === sec);
    if (firstIdx !== -1) {
      setCurrentQuestionIndex(firstIdx);
    }
  };

  const fetchRankAndPercentile = async (testId: string, currentScore: number, currentUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('test_results')
        .select('user_id, score')
        .eq('test_id', testId);

      if (error) throw error;

      // Group by user_id and take their max score (so each student is counted once)
      const userBestScores: Record<string, number> = {};
      data?.forEach((r: any) => {
        if (userBestScores[r.user_id] === undefined || r.score > userBestScores[r.user_id]) {
          userBestScores[r.user_id] = r.score;
        }
      });

      // Ensure current user is in userBestScores
      if (userBestScores[currentUserId] === undefined || currentScore > userBestScores[currentUserId]) {
        userBestScores[currentUserId] = currentScore;
      }

      const scores = Object.values(userBestScores) as number[];
      // Sort scores in descending order
      scores.sort((a, b) => b - a);

      const totalStudents = scores.length;
      
      // Calculate rank (1-based index of currentScore)
      const rank = scores.indexOf(currentScore) + 1;

      // Calculate percentile: (number of students with score <= currentScore) / totalStudents * 100
      const scoresLessThanOrEqual = scores.filter(s => s <= currentScore).length;
      const percentile = totalStudents > 0 ? ((scoresLessThanOrEqual / totalStudents) * 100).toFixed(1) : "100.0";

      return { rank, totalStudents, percentile };
    } catch (err) {
      console.error("Error fetching rank and percentile:", err);
      return null;
    }
  };

  const finalSubmitToDB = async (isViolationSubmit = false, answerSheetUrl?: string) => {
    try {
      if (!userId || !testDetails) return;

      let score = 0;
      let correctCount = 0;
      let incorrectCount = 0;
      
      // Compute subject-wise scores
      const subjectStats: Record<string, { score: number; correct: number; incorrect: number; total: number; attempted: number }> = {};
      
      // Initialize subject stats for all questions
      questions.forEach(q => {
        const sub = q.subject || "Physics";
        if (!subjectStats[sub]) {
          subjectStats[sub] = { score: 0, correct: 0, incorrect: 0, total: 0, attempted: 0 };
        }
        subjectStats[sub].total++;
      });

      const recordsToInsert = Object.entries(responses).map(([qId, val]) => {
        const q = questions.find(x => x.id === qId);
        const sub = q?.subject || "Physics";
        const qType = q?.question_type || "MCQ";
        const isMCQOrAR = qType === "MCQ" || qType === "AssertionReason";

        if (subjectStats[sub]) {
          subjectStats[sub].attempted++;
        }

        if (isMCQOrAR) {
          const opt = q?.options.find((o: any) => o.id === val);
          const isCorrect = opt?.is_correct || false;
          const qMarks = q?.marks !== undefined && q?.marks !== null ? q.marks : 4;
          const qNeg = q?.negative_marks !== undefined && q?.negative_marks !== null ? q.negative_marks : 1;

          if (isCorrect) {
            score += qMarks;
            correctCount++;
            if (subjectStats[sub]) {
              subjectStats[sub].score += qMarks;
              subjectStats[sub].correct++;
            }
          } else {
            score -= qNeg;
            incorrectCount++;
            if (subjectStats[sub]) {
              subjectStats[sub].score -= qNeg;
              subjectStats[sub].incorrect++;
            }
          }

          return {
            user_id: userId,
            test_id: testDetails.id,
            question_id: qId,
            selected_option_id: val,
            text_response: null,
            is_correct: isCorrect
          };
        } else {
          // Subjective / Objective text responses (graded manually)
          return {
            user_id: userId,
            test_id: testDetails.id,
            question_id: qId,
            selected_option_id: null,
            text_response: val,
            is_correct: null
          };
        }
      });

      const isBoard = testDetails.exam_type === 'Boards';
      const insertResultsPromise = !isAdmin ? supabase.from('test_results').insert([{
         user_id: userId,
         test_id: testDetails.id,
         score: isBoard ? 0 : score,
         total_questions: questions.length,
         correct_count: isBoard ? 0 : correctCount,
         incorrect_count: isBoard ? 0 : incorrectCount,
         exam_type: testDetails.exam_type,
         title: testDetails.title,
         answer_sheet_url: answerSheetUrl || null,
         is_graded: !isBoard
      }]) : Promise.resolve(null);

      const reportStatus = isViolationSubmit 
        ? 'submitted_due_to_violation' 
        : violationCount === 1 
          ? 'warned' 
          : 'normal';
      
      const integrityReportPromise = !isAdmin 
        ? createIntegrityReport(violationCount, reportStatus)
        : Promise.resolve(null);

      const syncResponsesPromise = !isAdmin ? (async () => {
        // Delete any temporary autosaved responses to prepare for clean insertion
        await supabase.from('user_responses')
          .delete()
          .eq('user_id', userId)
          .eq('test_id', testDetails.id)
          .eq('attempt_number', attemptNumber);

        // Insert final answers with attempt_number
        if (recordsToInsert.length > 0) {
          const recordsWithAttempt = recordsToInsert.map(r => ({
            ...r,
            attempt_number: attemptNumber
          }));
          await supabase.from('user_responses').insert(recordsWithAttempt);
        }
      })() : Promise.resolve(null);

      const rankInfoPromise = fetchRankAndPercentile(testDetails.id, score, userId);

      const insertNotificationPromise = !isAdmin ? supabase.from('notifications').insert([{
         recipient_role: 'admin',
         title: testDetails.exam_type === "DPP Quiz" ? "New DPP Quiz Submission" : "New Test Submission",
         message: isBoard
           ? `${userProfile?.full_name || userProfile?.email || "Student"} (${userProfile?.batch || "Unassigned"}) submitted Board Exam "${testDetails.title || "Exam"}" (Pending Grading).`
           : `${userProfile?.full_name || userProfile?.email || "Student"} (${userProfile?.batch || "Unassigned"}) completed "${testDetails.title || "Exam"}" with a score of ${score}.`,
         type: testDetails.exam_type === "DPP Quiz" ? "dpp_submit" : "test_submit",
         target_batch: userProfile?.batch || "Unassigned"
      }]) : Promise.resolve(null);

      // Only await critical database actions (inserting results and rank calculation) to show the score summary card.
      // Other background tasks (syncing responses, reporting integrity, notifying admin) will run asynchronously in the background.
      const [_, rankInfo] = await Promise.all([
        insertResultsPromise,
        rankInfoPromise
      ]);

      // Fire and forget the background operations, catching any errors so they don't block/crash the submission process.
      (async () => {
        try {
          if (integrityReportPromise) await integrityReportPromise;
        } catch (err) {
          console.error("Error saving integrity report in background:", err);
        }
      })();

      (async () => {
        try {
          if (syncResponsesPromise) await syncResponsesPromise;
        } catch (err) {
          console.error("Error syncing responses in background:", err);
        }
      })();

      (async () => {
        try {
          if (insertNotificationPromise) await insertNotificationPromise;
        } catch (err) {
          console.error("Error sending admin notification in background:", err);
        }
      })();

      setScoreResult({
        score: isBoard ? 0 : score,
        total: questions.length,
        attempted: recordsToInsert.length,
        correct: isBoard ? 0 : correctCount,
        incorrect: isBoard ? 0 : incorrectCount,
        rank: rankInfo?.rank || 1,
        percentile: rankInfo?.percentile || "100.0",
        totalStudents: rankInfo?.totalStudents || 1,
        subjectStats,
        answer_sheet_url: answerSheetUrl || null,
        is_graded: !isBoard
      });

      // Clear localStorage autosaved answers and remaining time
      const savedKey = `exam_responses_${userId}_${testDetails.id}_attempt_${attemptNumber}`;
      const savedTimeKey = `exam_time_${userId}_${testDetails.id}_attempt_${attemptNumber}`;
      localStorage.removeItem(savedKey);
      localStorage.removeItem(savedTimeKey);
    } catch (err) {
      console.error("Submission failed", err);
    }
  };

  const manualSubmit = async () => {
    if (testDetails?.exam_type === 'Boards') {
      if (!confirm("Are you sure you want to submit? You will be directed to upload your handwritten answer sheet PDF.")) return;
      setExamActive(false);
      setPdfUploadStep(true);
    } else {
      if (!confirm("Are you sure you want to submit your test?")) return;
      setSubmitting(true);
      setExamActive(false);
      try {
        await finalSubmitToDB();
        setTestCompleted(true);
      } catch (err) {
        console.error(err);
        alert("Submission failed. Please try again.");
      } finally {
        setSubmitting(false);
      }
    }
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

  if (pdfUploadStep) {
    const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        if (file.type !== "application/pdf") {
          alert("Please select a valid PDF file.");
          return;
        }
        setPdfFile(file);
      }
    };

    const handleUploadAndSubmit = async () => {
      if (!pdfFile) {
        alert("Please select your PDF answer sheet first.");
        return;
      }
      setPdfUploading(true);
      try {
        const fileName = `answers/${userId}_${testDetails.id}_${Date.now()}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from('resources')
          .upload(fileName, pdfFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('resources')
          .getPublicUrl(fileName);

        // Submit the exam with the publicUrl
        setSubmitting(true);
        setPdfUploadStep(false);
        await finalSubmitToDB(false, publicUrl);
        setTestCompleted(true);
      } catch (err: any) {
        console.error("Error uploading PDF answer sheet:", err);
        alert("Failed to upload PDF answer sheet: " + err.message);
      } finally {
        setPdfUploading(false);
        setSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-body animate-in fade-in">
        <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center space-y-6">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px]" />
          
          <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mb-2 mx-auto border border-cyan-500/30">
            <UploadCloud className="w-10 h-10 text-cyan-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-white">Upload Answer Sheet</h2>
          <p className="text-white/60 text-xs md:text-sm leading-relaxed">
            Please upload your handwritten or typed answer key sheet as a <strong>PDF file</strong> to complete your exam submission.
          </p>

          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center py-6 border border-dashed border-white/20 hover:border-cyan-500/50 rounded-2xl cursor-pointer bg-slate-950/60 text-center text-xs text-white/50 hover:text-white transition-colors relative">
              {pdfFile ? (
                <div className="space-y-2 p-2">
                  <p className="text-cyan-400 font-bold truncate max-w-[280px]">📄 {pdfFile.name}</p>
                  <p className="text-[10px] text-white/30">{(pdfFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-medium text-white/70">Click to select PDF answer key</p>
                  <p className="text-[10px] text-white/30">File must be in PDF format</p>
                </div>
              )}
              <input 
                type="file" 
                accept="application/pdf" 
                onChange={handlePdfFileChange} 
                className="hidden" 
                disabled={pdfUploading}
              />
            </label>

            <button
              onClick={handleUploadAndSubmit}
              disabled={pdfUploading || !pdfFile}
              className={`w-full py-4 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2 ${
                pdfUploading || !pdfFile
                  ? "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                  : "bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]"
              }`}
            >
              {pdfUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Uploading Sheet...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" /> Upload & Submit Exam
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-body animate-in fade-in">
        <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden flex flex-col items-center justify-center gap-4">
          <div className="absolute inset-0 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mb-2" />
          <h2 className="text-xl font-bold text-white tracking-wide">Submitting Your Exam</h2>
          <p className="text-white/50 text-xs md:text-sm leading-relaxed max-w-xs">
            Securing response sheets, verifying integrity, and calculating subject-wise statistics. Please do not close or reload this window.
          </p>
        </div>
      </div>
    );
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
            You have already completed both attempts for this examination. Further attempts are strictly prohibited.
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-4 font-body animate-in fade-in">
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 md:p-6 text-white font-body relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-[20%] right-[-10%] w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[10%] left-[-10%] w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Core Container */}
        <div className="max-w-2xl w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(0,242,255,0.1)] relative overflow-hidden z-10 mx-4 animate-in fade-in zoom-in-95 duration-500">
          
          {/* Header Banner - High Tech Lock Indicator */}
          <div className="flex items-center justify-between bg-cyan-950/30 border border-cyan-500/20 px-4 py-2.5 rounded-2xl mb-8">
            <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-cyan-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              SECURE BROWSER LOCK ACTIVE
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/50 bg-slate-900 border border-white/5 px-2.5 py-1 rounded-md font-mono">
              <Lock className="w-3 h-3 text-cyan-400" /> STRICT_MODE
            </div>
          </div>

          <div className="flex flex-col items-center text-center">
            {/* Exam Badge Icon */}
            <div className="w-16 h-16 bg-gradient-to-tr from-cyan-400/20 to-blue-600/20 border-2 border-cyan-400/30 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
              <ShieldAlert className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400 mb-2 tracking-tight">
              {testDetails.title}
            </h1>
            
            <div className="flex items-center gap-3 mb-8">
              <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-white/70 text-xs font-bold uppercase tracking-wider">
                {testDetails.exam_type}
              </span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold">
                <Clock className="w-3.5 h-3.5" /> {testDetails.duration} Minutes
              </span>
              {!isAdmin && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="px-3 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                    Attempt {attemptNumber} / 2
                  </span>
                </>
              )}
            </div>
            
            {/* Rich Instructions Area */}
            <div className="w-full bg-slate-950/70 border border-white/5 rounded-2xl p-5 md:p-6 text-left mb-8 space-y-6">
              <div>
                <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4.5 h-4.5 text-orange-400" /> Exam Rules & Guidelines
                </h3>
                <ul className="space-y-4 text-white/70 text-xs md:text-sm">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 p-0.5 rounded bg-orange-500/10 border border-orange-500/20 shrink-0">
                      <Monitor className="w-4 h-4 text-orange-400" />
                    </span>
                    <span>
                      <strong>Strict Monitoring:</strong> Switching tabs, minimizing the window, or exiting fullscreen will register as a security violation.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 p-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 shrink-0">
                      <Lock className="w-4 h-4 text-cyan-400" />
                    </span>
                    <span>
                      <strong>System Lockout:</strong> You are allowed exactly <strong>one warning</strong>. A second visibility or window violation will trigger an immediate auto-submission.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 p-0.5 rounded bg-red-500/10 border border-red-500/20 shrink-0">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    </span>
                    <span>
                      <strong>Shortcut Restrictions:</strong> Screenshot commands, DevTools shortcuts (`F12`), right-clicks, and copy/paste are completely disabled.
                    </span>
                  </li>
                </ul>
              </div>
              
              {/* Security Pre-requisites Checklist */}
              <div className="pt-4 border-t border-white/5">
                <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">System Checks</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-green-400">
                    <Check className="w-4 h-4 bg-green-500/10 border border-green-500/20 p-0.5 rounded-full shrink-0" /> Fullscreen Support
                  </div>
                  <div className="flex items-center gap-2 text-green-400">
                    <Check className="w-4 h-4 bg-green-500/10 border border-green-500/20 p-0.5 rounded-full shrink-0" /> Anti-Cheat Hooked
                  </div>
                </div>
              </div>
            </div>

            {!isLive && isAdmin && (
               <p className="text-orange-400 font-bold mb-4 bg-orange-500/10 px-4 py-2.5 rounded-xl border border-orange-500/20 text-xs md:text-sm animate-pulse">
                 ⚠️ Preview Mode: This test is a DRAFT and isn't available to students yet.
               </p>
             )}
            
            {/* Start Button */}
            <button 
              onClick={startExam}
              disabled={!canStart}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-extrabold text-lg hover:opacity-95 transition-all shadow-[0_0_30px_rgba(0,242,255,0.35)] hover:shadow-[0_0_40px_rgba(0,242,255,0.5)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2 group hover:-translate-y-0.5 transform duration-300"
            >
              {canStart ? (
                <>
                  {isAdmin ? "Preview Exam" : "I Understand, Begin Exam"}
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              ) : "Test is not live yet"}
            </button>
            
            <Link href="/dashboard" className="mt-5 text-white/45 hover:text-white/80 text-xs font-semibold tracking-wide transition-colors flex items-center gap-1">
              Cancel & Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (testCompleted && !showSolutions) {
    const skipped = scoreResult.total - scoreResult.attempted;
    const maxScore = questions.reduce((sum, q) => sum + (q.marks !== undefined && q.marks !== null ? q.marks : 4), 0);
    const percentage = maxScore > 0 ? ((scoreResult.score / maxScore) * 100).toFixed(1) : "0.0";
    const isBoard = testDetails?.exam_type === 'Boards';
    
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 md:p-6 text-white font-body animate-in fade-in">
        <div className="max-w-2xl w-full bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-left space-y-6">
           <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-green-500/10 rounded-full blur-[80px] pointer-events-none" />
           
           <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-2 border-b border-white/10 pb-6 text-center sm:text-left">
             <div className="w-14 h-14 md:w-16 md:h-16 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
               <CheckCircle2 className="w-7 h-7 md:w-8 md:h-8 text-green-400" />
             </div>
             <div>
               <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                 {isBoard ? "Exam Submitted Successfully" : "Result Summary Card"}
               </h2>
               <p className="text-white/50 text-xs md:text-sm font-medium tracking-wide">
                 {isBoard ? "Your answer sheet PDF has been uploaded." : "Test Submitted Successfully!"}
               </p>
             </div>
           </div>
           
           <div className="space-y-4 text-sm">
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

             {isBoard ? (
               <div className="bg-slate-950/60 p-6 rounded-2xl border border-white/5 text-center space-y-3">
                 <p className="text-white/80 text-sm leading-relaxed font-medium">
                   Thank you! Since this is a <strong>Board Level Examination</strong>, your score is not calculated automatically.
                 </p>
                 <p className="text-white/50 text-xs leading-relaxed">
                   Your uploaded PDF answer sheet has been stored securely in your attempt record. Your teacher/administrator will evaluate your answers manually and assign your final grade.
                 </p>
                 {scoreResult.answer_sheet_url && (
                   <div className="pt-2">
                     <a 
                       href={scoreResult.answer_sheet_url} 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 underline"
                     >
                       📄 View Uploaded Answer Sheet
                     </a>
                   </div>
                 )}
               </div>
             ) : (
               <>
                 {/* Rank and Percentile Block */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="bg-gradient-to-tr from-cyan-500/10 to-blue-600/10 p-4 rounded-xl border border-cyan-500/20 flex flex-col items-center justify-center text-center">
                     <p className="text-cyan-400 text-[10px] md:text-xs font-bold uppercase mb-1">Your Rank</p>
                     <p className="text-xl md:text-2xl font-black text-white">#{scoreResult.rank} <span className="text-xs text-white/40">out of {scoreResult.totalStudents}</span></p>
                   </div>
                   <div className="bg-gradient-to-tr from-purple-500/10 to-pink-600/10 p-4 rounded-xl border border-purple-500/20 flex flex-col items-center justify-center text-center">
                     <p className="text-purple-400 text-[10px] md:text-xs font-bold uppercase mb-1">Percentile Score</p>
                     <p className="text-xl md:text-2xl font-black text-white">{scoreResult.percentile}%</p>
                   </div>
                 </div>

                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                   <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col items-center justify-center text-center">
                     <p className="text-white/50 text-[10px] md:text-xs font-bold uppercase mb-1">Attempted</p>
                     <p className="text-lg md:text-xl font-bold text-white">{scoreResult.attempted} <span className="text-xs text-white/30">/ {scoreResult.total}</span></p>
                   </div>
                   <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/20 flex flex-col items-center justify-center text-center">
                     <p className="text-green-500/50 text-[10px] md:text-xs font-bold uppercase mb-1">Correct</p>
                     <p className="text-lg md:text-xl font-bold text-green-400">{scoreResult.correct}</p>
                   </div>
                   <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/20 flex flex-col items-center justify-center text-center">
                     <p className="text-red-500/50 text-[10px] md:text-xs font-bold uppercase mb-1">Wrong</p>
                     <p className="text-lg md:text-xl font-bold text-red-400">{scoreResult.incorrect}</p>
                   </div>
                   <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col items-center justify-center text-center">
                     <p className="text-white/50 text-[10px] md:text-xs font-bold uppercase mb-1">Skipped</p>
                     <p className="text-lg md:text-xl font-bold text-white/50">{skipped}</p>
                   </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                   <div className="bg-orange-500/5 p-4 rounded-xl border border-orange-500/20 flex flex-col items-center justify-center text-center">
                     <p className="text-orange-500/50 text-[10px] md:text-xs font-bold uppercase mb-1">Final Score</p>
                     <p className="text-lg md:text-xl font-bold text-orange-400">{scoreResult.score} <span className="text-xs text-orange-400/50">/ {maxScore}</span></p>
                   </div>
                   <div className="bg-cyan-500/5 p-4 rounded-xl border border-cyan-500/20 flex flex-col items-center justify-center text-center">
                     <p className="text-cyan-500/50 text-[10px] md:text-xs font-bold uppercase mb-1">Percentage</p>
                     <p className="text-lg md:text-xl font-bold text-cyan-400">{percentage}%</p>
                   </div>
                   <div className="bg-slate-950 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
                     <p className="text-white/40 text-[10px] md:text-xs font-bold uppercase mb-1">Date Attempted</p>
                     <p className="text-sm md:text-base font-bold text-white/85">{new Date().toLocaleDateString()}</p>
                   </div>
                 </div>

                 {/* Subject Wise breakdown visualizer */}
                 {scoreResult.subjectStats && Object.keys(scoreResult.subjectStats).length > 0 && (
                   <div className="space-y-3 pt-4 border-t border-white/10">
                     <p className="text-white/40 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-2">Subject-wise Breakdown</p>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       {Object.entries(scoreResult.subjectStats).map(([sub, stat]: any) => {
                         const subColors: Record<string, string> = {
                           Physics: "from-blue-500/10 to-cyan-500/5 border-blue-500/25 text-blue-400",
                           Chemistry: "from-purple-500/10 to-indigo-500/5 border-purple-500/25 text-purple-400",
                           Botany: "from-green-500/10 to-emerald-500/5 border-green-500/25 text-green-400",
                           Zoology: "from-orange-500/10 to-amber-500/5 border-orange-500/25 text-orange-400"
                         };
                         const col = subColors[sub] || "from-slate-500/10 to-slate-500/5 border-slate-500/25 text-slate-400";
                         return (
                           <div key={sub} className={`bg-gradient-to-br ${col} p-3 rounded-xl border flex flex-col justify-between`}>
                             <div className="flex justify-between items-center mb-1">
                               <span className="font-bold text-xs text-white">{sub}</span>
                               <span className="text-xs font-mono font-bold text-white/80">{stat.score} Marks</span>
                             </div>
                             <div className="grid grid-cols-3 gap-1 text-[9px] text-white/50 text-center font-mono">
                               <div>
                                 <span className="block text-[8px] uppercase font-bold text-white/30">Correct</span>
                                 <span className="text-green-400 font-bold">{stat.correct}</span>
                               </div>
                               <div>
                                 <span className="block text-[8px] uppercase font-bold text-white/30">Wrong</span>
                                 <span className="text-red-400 font-bold">{stat.incorrect}</span>
                               </div>
                               <div>
                                 <span className="block text-[8px] uppercase font-bold text-white/30">Accuracy</span>
                                 <span className="text-white font-bold">{stat.attempted > 0 ? ((stat.correct / stat.attempted) * 100).toFixed(0) : "0"}%</span>
                               </div>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 )}
               </>
             )}
           </div>
 
           <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 border-t border-white/10 pt-6">
             {!isBoard && (
               <button onClick={() => setShowSolutions(true)} className="w-full sm:flex-1 py-3.5 md:py-4 rounded-xl bg-white/10 text-white font-bold text-base md:text-lg hover:bg-white/20 transition-colors border border-white/10">
                 Review Answers
               </button>
             )}
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
          
          {/* Subject Navigation Tabs */}
          {questions.length > 0 && (
            <div className="flex-shrink-0 bg-slate-900 border-b border-white/10 px-4 md:px-6 py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide z-10">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                {Array.from(new Set(questions.map(q => q.subject || "Physics"))).map((sub) => {
                  const isActive = activeSubject === sub;
                  const totalSubQ = questions.filter(q => (q.subject || "Physics") === sub).length;
                  const answeredSubQ = questions.filter(q => (q.subject || "Physics") === sub && !!responses[q.id]).length;
                  const activeStyle = getSubjectActiveStyle(sub);
                  
                  return (
                    <button
                      key={sub}
                      onClick={() => handleSubjectChange(sub)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold border transition-all duration-300 shrink-0 ${
                        isActive 
                          ? activeStyle 
                          : "border-white/5 bg-slate-950/40 text-white/50 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${getSubjectDotColor(sub)} ${isActive ? 'animate-pulse' : 'opacity-65'}`} />
                      <span>{sub}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isActive 
                          ? "bg-white/15 text-white" 
                          : "bg-white/5 text-white/40"
                      }`}>
                        {answeredSubQ}/{totalSubQ}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section Navigation Tabs */}
          {questions.length > 0 && questions.some(q => q.section === "Section B") && (
            <div className="flex-shrink-0 bg-[#0c1322] border-b border-white/5 px-4 md:px-6 py-2.5 flex items-center justify-between z-10 select-none">
              <div className="flex items-center gap-2">
                {["Section A", "Section B"].map(sec => {
                  const isActive = activeSectionTab === sec;
                  const totalSecQ = questions.filter(q => (q.subject || "Physics") === activeSubject && (q.section || "Section A") === sec).length;
                  const answeredSecQ = questions.filter(q => (q.subject || "Physics") === activeSubject && (q.section || "Section A") === sec && !!responses[q.id]).length;
                  
                  if (totalSecQ === 0) return null;
                  
                  return (
                    <button
                      key={sec}
                      onClick={() => handleSectionTabChange(sec)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-300 ${
                        isActive 
                          ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]" 
                          : "border-transparent text-white/50 hover:text-white"
                      }`}
                    >
                      {sec === "Section A" ? "Section A (Mandatory)" : "Section B (Choice-based)"}
                      <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isActive ? "bg-cyan-500/20 text-cyan-400" : "bg-white/5 text-white/40"
                      }`}>
                        {answeredSecQ}/{totalSecQ}
                      </span>
                    </button>
                  );
                })}
              </div>

              {activeSectionTab === "Section B" && (
                <div className="hidden sm:flex items-center gap-2 text-[10px] md:text-xs text-orange-400 font-bold bg-orange-500/5 px-3 py-1.5 rounded-lg border border-orange-500/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                  <span>
                    Attempted {questions.filter(q => q.subject === activeSubject && q.section === "Section B" && !!responses[q.id]).length} / {testDetails?.exam_type === "JEE Main" ? 5 : 10}
                  </span>
                </div>
              )}
            </div>
          )}

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
                    <div className="flex items-center gap-2 mb-3">
                      {currentQ.subject && (
                        <span className="px-2.5 py-0.5 rounded-md border text-xs font-bold bg-white/5 border-white/10 text-cyan-400">
                          {currentQ.subject}
                        </span>
                      )}
                      <span className="text-xs text-white/40 font-mono">
                        +{currentQ.marks !== undefined ? currentQ.marks : 4} / -{currentQ.negative_marks !== undefined ? currentQ.negative_marks : 1} Marks
                      </span>
                    </div>
                    {currentQ.image_url && (
                      <div className="mb-6 rounded-xl overflow-hidden border border-white/10 bg-white/5 max-w-2xl">
                        <img src={currentQ.image_url} alt="Question Diagram" className="w-full h-auto object-contain max-h-96" />
                      </div>
                    )}
                    <p className="text-lg leading-relaxed text-white/90 whitespace-pre-wrap font-medium">
                      {currentQ.text}
                    </p>
                  </div>

                  {/* Options Grid */}
                  <div className="space-y-4">
                    {currentQ.question_type && ["Objective", "Subjective2M", "Subjective3M", "Subjective5M", "CaseStudy"].includes(currentQ.question_type) ? (
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-white/50 uppercase ml-1 block">Write your response here</label>
                        <textarea
                          value={responses[currentQ.id] || ""}
                          disabled={showSolutions}
                          onChange={e => handleTextResponseChange(e.target.value)}
                          className="w-full bg-slate-900/60 border border-white/10 hover:border-cyan-500/50 rounded-2xl p-5 text-white text-base md:text-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-medium resize-y h-44 placeholder-white/20"
                          placeholder="Type your explanation, calculation, or final answer here..."
                        />
                      </div>
                    ) : (
                      currentQ.options.map((opt: any, optIdx: number) => {
                        const isSelected = selectedOptionId === opt.id;
                        const isCorrectAnswer = opt.is_correct;
                        
                        let optionClasses = "bg-white/5 border-white/10 hover:border-cyan-500/50";
                        let textColor = "text-white/80";
                        let suffix = null;

                        if (showSolutions) {
                          if (isCorrectAnswer) {
                            optionClasses = "bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)]";
                            textColor = "text-emerald-400 font-bold";
                            suffix = (
                              <span className="px-2.5 py-0.5 rounded-full text-xs bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1 shrink-0">
                                <CheckCircle2 className="w-4 h-4" /> Correct Answer
                              </span>
                            );
                          } else if (isSelected && !isCorrectAnswer) {
                            optionClasses = "bg-rose-500/10 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.15)]";
                            textColor = "text-rose-400 font-bold";
                            suffix = (
                              <span className="px-2.5 py-0.5 rounded-full text-xs bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold flex items-center gap-1 shrink-0">
                                <XCircle className="w-4 h-4" /> Your Choice (Incorrect)
                              </span>
                            );
                          } else {
                            optionClasses = "bg-slate-900/30 border-white/5 opacity-40 text-white/40 cursor-not-allowed";
                            textColor = "text-white/50";
                          }
                        } else if (isSelected) {
                          optionClasses = "bg-cyan-500/10 border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.2)]";
                          textColor = "text-cyan-400 font-semibold";
                        }

                        const letter = opt.option_letter || String.fromCharCode(65 + optIdx);

                        return (
                          <label
                            key={opt.id}
                            className={`flex items-start p-3 md:p-5 rounded-2xl border transition-all duration-200 group ${showSolutions ? 'cursor-default' : 'cursor-pointer'} ${optionClasses}`}
                          >
                            <input
                              type="radio"
                              name={`question-${currentQ.id}`}
                              className="hidden"
                              checked={isSelected}
                              disabled={showSolutions}
                              onChange={() => handleSelectOption(opt.id)}
                            />
                            <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full border flex items-center justify-center flex-shrink-0 text-[10px] md:text-xs font-bold transition-all mr-3 md:mr-4 mt-0.5 ${
                              showSolutions
                                ? isSelected
                                  ? isCorrectAnswer
                                    ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                                    : 'bg-rose-500 border-rose-500 text-slate-950 shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                                  : isCorrectAnswer
                                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                    : 'bg-white/5 border-white/10 text-white/45'
                                : isSelected
                                  ? 'bg-cyan-500 border-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.4)]'
                                  : 'bg-white/5 border-white/10 text-white/45'
                            }`}>
                              {letter}
                            </div>
                            <div className="flex-1 flex flex-col sm:flex-row sm:items-start justify-between gap-2 md:gap-3 min-w-0">
                              <span className={`text-sm md:text-base font-medium break-words whitespace-normal leading-relaxed text-left flex-1 ${textColor}`} title={opt.text}>
                                {opt.text}
                              </span>
                              {suffix}
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>

                  {/* Explanation Section */}
                  {showSolutions && currentQ.explanation && (
                    <div className="mt-6 p-5 rounded-2xl bg-slate-900 border border-white/10 border-l-4 border-l-cyan-400 animate-in fade-in duration-300 shadow-inner">
                      <h4 className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-2.5 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Explanation & Solution Path
                      </h4>
                      <p className="text-sm text-white/85 leading-relaxed whitespace-pre-wrap font-medium">
                        {currentQ.explanation}
                      </p>
                    </div>
                  )}
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
            {activeSubject && (
              <div className="mb-4 text-xs font-bold uppercase tracking-wider text-cyan-400 flex flex-col gap-1 border-b border-white/5 pb-2">
                <div className="flex justify-between items-center">
                  <span>{activeSubject}</span>
                  <span className="font-mono text-white/50 text-[10px]">
                    {questions.filter(q => (q.subject || "Physics") === activeSubject && !!responses[q.id]).length} / {questions.filter(q => (q.subject || "Physics") === activeSubject).length} Solved
                  </span>
                </div>
                {questions.some(q => q.section === "Section B") && (
                  <div className="text-[10px] text-white/40 font-medium">
                    {activeSectionTab} Questions
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-5 gap-3">
              {questions.map((q, idx) => {
                // Filter to show only questions of the active subject
                if ((q.subject || "Physics") !== activeSubject) return null;

                // Filter by section if sections exist
                const hasSections = questions.some(x => x.subject === activeSubject && x.section === "Section B");
                if (hasSections && (q.section || "Section A") !== activeSectionTab) return null;

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
