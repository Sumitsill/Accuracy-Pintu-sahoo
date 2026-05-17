"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import {
  AlertTriangle, Clock, ChevronRight, CheckCircle2,
  AlertCircle, XCircle, SkipForward, Loader2, Target
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
  const [isAdmin, setIsAdmin] = useState(false);
  
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
          setIsAdmin(profile?.role === 'admin');
          setUserName(profile?.full_name || profile?.email || user.email || "Student");
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
  const autoSubmitTest = useCallback(async () => {
    if (!examActive) return;
    setExamActive(false);
    setViolationDetected(true);
    await finalSubmitToDB();
  }, [examActive, responses, testDetails]);

  useEffect(() => {
    if (!examActive) return;
    const handleVisibilityChange = () => document.hidden && autoSubmitTest();
    const handleBlur = () => autoSubmitTest();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [examActive, autoSubmitTest]);

  // -------------------------------------------------------------
  // Ticking Clock Engine
  // -------------------------------------------------------------
  useEffect(() => {
    if (!examActive) return;
    if (timeLeft <= 0) {
      setExamActive(false);
      alert("Time is up! Your test has been automatically submitted.");
      finalSubmitToDB().then(() => setTestCompleted(true));
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, examActive, router]);

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

  const finalSubmitToDB = async () => {
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
    setShowInstructions(false);
    setExamActive(true);
  };

  // -------------------------------------------------------------
  // UI Rendering
  // -------------------------------------------------------------
  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-cyan-400" /></div>;
  }

  if (violationDetected) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-4 font-body animate-in fade-in">
        <div className="absolute inset-0 bg-red-600/10" />
        <div className="max-w-md w-full bg-slate-900 border-2 border-red-500 rounded-3xl p-8 relative z-10 shadow-[0_0_50px_rgba(239,68,68,0.3)] flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Violation Detected</h2>
          <p className="text-white/70 mb-8">
            You navigated away from the exam window or switched tabs. Strict anti-cheat protocols are in place. Your test has been <strong>automatically submitted</strong>.
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
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" /> Do not switch tabs or minimize the window. Doing so will automatically submit your exam.</li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" /> Ensure you have a stable internet connection before beginning.</li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" /> The timer cannot be paused once started.</li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" /> Correct answers award <span className="text-green-400 font-bold">+4</span> marks. Incorrect answers incur a penalty of <span className="text-red-400 font-bold">-1</span> mark.</li>
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-body">
        <div className="max-w-2xl w-full bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-left">
           <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-green-500/10 rounded-full blur-[80px]" />
           
           <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-6">
             <div className="w-16 h-16 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center">
               <CheckCircle2 className="w-8 h-8 text-green-400" />
             </div>
             <div>
               <h2 className="text-3xl font-bold text-white mb-1">Result Summary Card</h2>
               <p className="text-white/50 text-sm font-medium tracking-wide">Test Submitted Successfully!</p>
             </div>
           </div>
           
           <div className="space-y-4 mb-8 text-sm">
             <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-950 p-4 rounded-xl border border-white/5">
                 <p className="text-white/40 text-xs font-bold uppercase mb-1">Student Name</p>
                 <p className="text-cyan-400 font-bold text-lg truncate">{userName}</p>
               </div>
               <div className="bg-slate-950 p-4 rounded-xl border border-white/5">
                 <p className="text-white/40 text-xs font-bold uppercase mb-1">Exam Title</p>
                 <p className="text-white font-bold text-lg truncate">{testDetails?.title}</p>
               </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col items-center justify-center text-center">
                 <p className="text-white/50 text-xs font-bold uppercase mb-1">Attempted</p>
                 <p className="text-2xl font-bold text-white">{scoreResult.attempted} <span className="text-sm text-white/30">/ {scoreResult.total}</span></p>
               </div>
               <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/20 flex flex-col items-center justify-center text-center">
                 <p className="text-green-500/50 text-xs font-bold uppercase mb-1">Correct</p>
                 <p className="text-2xl font-bold text-green-400">{scoreResult.correct}</p>
               </div>
               <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/20 flex flex-col items-center justify-center text-center">
                 <p className="text-red-500/50 text-xs font-bold uppercase mb-1">Wrong</p>
                 <p className="text-2xl font-bold text-red-400">{scoreResult.incorrect}</p>
               </div>
               <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col items-center justify-center text-center">
                 <p className="text-white/50 text-xs font-bold uppercase mb-1">Skipped</p>
                 <p className="text-2xl font-bold text-white/50">{skipped}</p>
               </div>
             </div>

             <div className="grid grid-cols-3 gap-4">
               <div className="bg-orange-500/5 p-4 rounded-xl border border-orange-500/20 flex flex-col items-center justify-center text-center">
                 <p className="text-orange-500/50 text-xs font-bold uppercase mb-1">Final Score</p>
                 <p className="text-2xl font-bold text-orange-400">{scoreResult.score} <span className="text-sm text-orange-400/50">/ {maxScore}</span></p>
               </div>
               <div className="bg-cyan-500/5 p-4 rounded-xl border border-cyan-500/20 flex flex-col items-center justify-center text-center">
                 <p className="text-cyan-500/50 text-xs font-bold uppercase mb-1">Percentage</p>
                 <p className="text-2xl font-bold text-cyan-400">{percentage}%</p>
               </div>
               <div className="bg-slate-950 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
                 <p className="text-white/40 text-xs font-bold uppercase mb-1">Date Attempted</p>
                 <p className="text-xl font-bold text-white/80">{new Date().toLocaleDateString()}</p>
               </div>
             </div>
           </div>

           <div className="flex gap-4 border-t border-white/10 pt-6">
             <button onClick={() => setShowSolutions(true)} className="flex-1 py-4 rounded-xl bg-white/10 text-white font-bold text-lg hover:bg-white/20 transition-colors border border-white/10">
               Review Answers
             </button>
             <Link href="/dashboard" className="flex-1 py-4 flex items-center justify-center rounded-xl bg-cyan-500 text-slate-950 font-bold text-lg hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(34,211,238,0.4)] block">
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
      <header className="flex-shrink-0 bg-slate-900 border-b border-white/10 px-6 py-4 flex justify-between items-center z-20">
        <div>
          <h1 className="text-xl font-bold tracking-widest uppercase text-white">Accuracy Exam Hall</h1>
          <p className="text-cyan-400 text-xs font-bold mt-1">{testDetails?.title || "Mock Test"}</p>
        </div>

        {/* Persistent Header */}
        <div className="flex items-center gap-3 bg-slate-950 border border-white/10 px-6 py-3 rounded-xl shadow-inner">
          {showSolutions ? (
            <span className="text-green-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Solution Mode</span>
          ) : (
            <>
              <Clock className={`w-5 h-5 ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`} />
              <span className={`text-2xl font-bold tracking-widest font-mono ${timeLeft < 300 ? 'text-red-500' : 'text-white'}`}>
                {formatTime(timeLeft)}
              </span>
            </>
          )}
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left Side: Question Display */}
        <main className="flex-1 flex flex-col h-full border-r border-white/10 relative">
          <div className="flex-1 p-8 overflow-y-auto scrollbar-hide">
            <div className="max-w-4xl mx-auto">
              {questions.length === 0 ? (
                <div className="text-center text-white/50 py-20">No questions available for this test.</div>
              ) : (
                <>
                  {/* Question Header */}
                  <div className="flex justify-between items-end border-b border-white/5 pb-4 mb-8">
                    <h2 className="text-2xl font-bold text-white">Question {currentQuestionIndex + 1}</h2>
                    <div className="flex gap-4 text-sm font-bold">
                      <span className="text-green-400 bg-green-400/10 px-3 py-1 rounded-md">+4 Marks</span>
                      <span className="text-red-400 bg-red-400/10 px-3 py-1 rounded-md">-1 Mark</span>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="prose prose-invert max-w-none mb-12">
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
                          className={`flex items-center p-5 rounded-2xl border transition-all duration-200 group ${showSolutions ? 'cursor-default' : 'cursor-pointer'} ${optionClasses}`}
                        >
                          <input
                            type="radio"
                            name={`question-${currentQ.id}`}
                            className="hidden"
                            checked={isSelected}
                            disabled={showSolutions}
                            onChange={() => handleSelectOption(opt.id)}
                          />
                          <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center flex-shrink-0 transition-colors ${indicatorColor}`}>
                            {isSelected && !showSolutions && <div className="w-3 h-3 rounded-full bg-cyan-400" />}
                            {showSolutions && isSelected && <div className="w-2 h-2 rounded-full bg-slate-900" />}
                          </div>
                          <span className={`text-lg font-medium flex-1 ${textColor}`}>
                            {opt.text}
                          </span>
                          {suffix}
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <footer className="flex-shrink-0 bg-slate-900 border-t border-white/10 p-6 flex justify-between items-center z-20">
            {!showSolutions ? (
              <button
                onClick={handleClearResponse}
                className="px-6 py-3 rounded-xl border border-white/20 text-white/70 font-bold hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
              >
                <XCircle className="w-5 h-5" /> Clear Response
              </button>
            ) : (
              <Link href="/dashboard" className="px-6 py-3 rounded-xl border border-cyan-500/50 text-cyan-400 font-bold hover:bg-cyan-500/10 transition-colors">
                Back to Dashboard
              </Link>
            )}
            <button
              onClick={handleSaveAndNext}
              className="px-8 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold text-lg hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(34,211,238,0.4)] flex items-center gap-2"
            >
              {showSolutions ? "Next Question" : "Save & Next"} <SkipForward className="w-5 h-5" />
            </button>
          </footer>
        </main>

        {/* Right Side: Question Palette */}
        <aside className="w-80 bg-slate-900 flex flex-col">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-bold text-white mb-4">Question Palette</h3>
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
                    onClick={() => setCurrentQuestionIndex(idx)}
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
                className="w-full py-4 rounded-xl bg-green-500 text-slate-950 font-bold text-lg hover:bg-green-400 transition-colors flex items-center justify-center gap-2"
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
