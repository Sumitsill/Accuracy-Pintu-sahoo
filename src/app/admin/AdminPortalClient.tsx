"use client";

import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, Users, BookOpen, PenTool, Target, 
  Bell, Zap, LogOut, ChevronDown, Menu,
  Search, Eye, Send, Upload, Plus, MoreVertical, X, Loader2, FileUp, Trash2,
  ShieldAlert, AlertTriangle, CheckCircle, Mail, Phone, Award, GraduationCap
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminPortalClient({ user, profile }: { user: any, profile: any }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const emailPrefix = user?.email?.split("@")[0] || "Admin";
  const displayName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}&backgroundColor=1A0B05`;

  const NavItem = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => {
    const isActive = activeTab === id;
    return (
      <button 
        onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative group overflow-hidden ${
          isActive 
            ? "bg-white/10 text-white" 
            : "text-white/50 hover:bg-white/5 hover:text-white/80"
        }`}
      >
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
        )}
        <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? "text-orange-500" : ""}`} />
        <span className="font-semibold text-sm">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-[100dvh] relative bg-slate-950 text-slate-50 font-body overflow-hidden">
      
      {/* Background Fiery Accents */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed md:relative w-64 flex-shrink-0 h-full bg-slate-900 md:bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col z-50 transition-transform duration-300 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-600 shadow-[0_0_15px_rgba(249,115,22,0.5)] flex items-center justify-center">
              <Zap className="w-4 h-4 text-slate-950" />
            </div>
            <h1 className="text-xl font-bold tracking-widest uppercase text-white">Accuracy Admin</h1>
          </div>
          <button className="md:hidden text-white/50 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Command Center" />
          <NavItem id="students" icon={Users} label="Student Management" />
          <NavItem id="note" icon={BookOpen} label="Notes Management" />
          <NavItem id="dpp" icon={PenTool} label="DPP Management" />
          <NavItem id="test" icon={Target} label="Test Center" />
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto z-10 scrollbar-hide relative">
        
        {/* Top Header */}
        <header className="px-4 py-4 md:px-8 md:py-6 flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur-md z-30 border-b border-white/5">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 -ml-2 text-white/50 hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold tracking-tight capitalize text-white">
              {activeTab.replace("-", " ")}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-white/50 hover:text-white transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.8)] border border-slate-950" />
            </button>
            
            {/* Avatar Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 hover:bg-white/5 p-1.5 rounded-full transition-colors"
              >
                <img src={avatarUrl} alt="Avatar" className="w-9 h-9 rounded-full bg-slate-900 border border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.2)]" />
                <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-white/5 mb-1">
                    <p className="text-sm font-bold text-white truncate">{displayName}</p>
                    <p className="text-xs text-orange-400 truncate">{user?.email}</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Eject Session
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
          {activeTab === "dashboard" && <AdminDashboardView displayName={displayName} setActiveTab={setActiveTab} />}
          {activeTab === "students" && <StudentManagementView />}
          {activeTab === "note" && <ResourceManagementView title="Notes Management" icon={BookOpen} action="Upload New Notes PDF" type="note" />}
          {activeTab === "dpp" && <ResourceManagementView title="DPP Management" icon={PenTool} action="Upload New DPP PDF" type="dpp" />}
          {activeTab === "test" && <ResourceManagementView title="Test Center Management" icon={Target} action="Create New Test" type="test" isTest />}
        </div>
      </main>
    </div>
  );
}

// -------------------------------------------------------------------
// Dashboard View Sub-component
// -------------------------------------------------------------------
function AdminDashboardView({ displayName, setActiveTab }: { displayName: string, setActiveTab: (tab: string) => void }) {
  const [stats, setStats] = useState({ students: 0, tests: 0, resources: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient();
      const { count: studentCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: testCount } = await supabase.from('tests').select('*', { count: 'exact', head: true });
      const { count: resourceCount } = await supabase.from('resources').select('*', { count: 'exact', head: true });
      
      setStats({
        students: studentCount || 0,
        tests: testCount || 0,
        resources: resourceCount || 0
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Welcome Banner */}
      <div className="relative p-6 md:p-10 rounded-3xl bg-gradient-to-br from-[#1A0B05] via-[#2D1405] to-[#1A0B05] border border-orange-500/20 overflow-hidden shadow-2xl group">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-orange-500/20 transition-all duration-700" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-red-500/10 rounded-full blur-[60px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
            <p className="text-orange-500 font-bold tracking-widest text-[10px] uppercase">System Status: Optimal</p>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-100 to-orange-400 mb-4 tracking-tight">
            Command Center, {displayName}.
          </h2>
          <p className="text-white/60 max-w-xl text-sm md:text-base leading-relaxed">
            Welcome to your administrative hub. Oversee student progression, manage learning resources, and deploy comprehensive tests from this unified interface.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* System Overview */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500" /> System Overview
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-5 md:p-6 relative overflow-hidden group hover:border-orange-500/30 transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
              <Users className="w-8 h-8 text-blue-400 mb-4" />
              <p className="text-3xl font-black text-white mb-1">
                {loading ? <Loader2 className="w-6 h-6 animate-spin text-white/20" /> : stats.students}
              </p>
              <p className="text-xs text-white/40 font-bold uppercase tracking-wider">Registered Students</p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-5 md:p-6 relative overflow-hidden group hover:border-orange-500/30 transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
              <Target className="w-8 h-8 text-purple-400 mb-4" />
              <p className="text-3xl font-black text-white mb-1">
                {loading ? <Loader2 className="w-6 h-6 animate-spin text-white/20" /> : stats.tests}
              </p>
              <p className="text-xs text-white/40 font-bold uppercase tracking-wider">Active Tests & DPPs</p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-5 md:p-6 relative overflow-hidden group hover:border-orange-500/30 transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
              <BookOpen className="w-8 h-8 text-green-400 mb-4" />
              <p className="text-3xl font-black text-white mb-1">
                {loading ? <Loader2 className="w-6 h-6 animate-spin text-white/20" /> : stats.resources}
              </p>
              <p className="text-xs text-white/40 font-bold uppercase tracking-wider">Learning Materials</p>
            </div>

          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-orange-500" /> Quick Actions
          </h3>
          <div className="flex flex-col gap-3">
            
            <button onClick={() => setActiveTab('test')} className="flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-800/80 border border-white/5 hover:border-orange-500/30 rounded-xl transition-all group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
                  <Plus className="w-5 h-5 text-orange-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">Create New Test</p>
                  <p className="text-xs text-white/40">Launch a new mock exam</p>
                </div>
              </div>
            </button>

            <button onClick={() => setActiveTab('dpp')} className="flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-800/80 border border-white/5 hover:border-cyan-500/30 rounded-xl transition-all group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                  <Upload className="w-5 h-5 text-cyan-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">Upload DPP</p>
                  <p className="text-xs text-white/40">Publish practice problems</p>
                </div>
              </div>
            </button>

            <button onClick={() => setActiveTab('students')} className="flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-800/80 border border-white/5 hover:border-green-500/30 rounded-xl transition-all group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                  <Eye className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">Student Analytics</p>
                  <p className="text-xs text-white/40">View performance SWOT</p>
                </div>
              </div>
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Question Response Review Section (Decoupled helper component)
// -------------------------------------------------------------------
function QuestionReviewSection({ questions, loading }: { questions: any[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-2" />
        <span className="text-sm text-white/50">Fetching student responses...</span>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-6 text-white/40 text-sm">
        No questions found or recorded responses for this test.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
          Question-by-Question Response Review
        </h4>
        <span className="text-xs text-white/50 font-mono">
          {questions.length} Questions
        </span>
      </div>
      
      <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin">
        {questions.map((q, idx) => {
          let borderGlow = "border-white/5 bg-slate-900";
          if (q.hasResponded) {
            borderGlow = q.isCorrect 
              ? "border-green-500/30 bg-slate-900/60 shadow-[0_0_15px_rgba(34,197,94,0.02)]" 
              : "border-red-500/30 bg-slate-900/60 shadow-[0_0_15px_rgba(239,68,68,0.02)]";
          }

          return (
            <div key={q.id} className={`p-5 rounded-2xl border transition-all space-y-4 ${borderGlow}`}>
              <div className="flex justify-between items-start gap-3 flex-wrap">
                <span className="text-xs font-extrabold text-white/40 uppercase tracking-wider">
                  Question {idx + 1}
                </span>
                
                {q.hasResponded ? (
                  q.isCorrect ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 flex items-center gap-1 border border-green-500/20">
                      <CheckCircle className="w-3 h-3" /> Correct
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 flex items-center gap-1 border border-red-500/20">
                      <AlertTriangle className="w-3 h-3" /> Incorrect
                    </span>
                  )
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                    Unanswered
                  </span>
                )}
              </div>

              <p className="text-sm font-semibold text-white/95 leading-relaxed whitespace-pre-wrap">
                {q.text}
              </p>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {q.options.map((opt: any, optIdx: number) => {
                  const isSelected = opt.id === q.selectedOptionId;
                  const isCorrectOpt = opt.is_correct;

                  let cardStyles = "bg-slate-950/40 border-white/5 text-white/60";
                  let indicator = null;

                  if (isSelected) {
                    if (isCorrectOpt) {
                      cardStyles = "bg-green-500/10 border-green-500/30 text-green-400 font-bold shadow-[0_0_10px_rgba(34,197,94,0.1)]";
                      indicator = (
                        <span className="text-[9px] font-extrabold uppercase text-green-400 bg-green-500/15 px-2 py-0.5 rounded-full border border-green-500/20">
                          Selected Correct
                        </span>
                      );
                    } else {
                      cardStyles = "bg-red-500/10 border-red-500/30 text-red-400 font-bold shadow-[0_0_10px_rgba(239,68,68,0.1)]";
                      indicator = (
                        <span className="text-[9px] font-extrabold uppercase text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full border border-red-500/20">
                          Selected Wrong
                        </span>
                      );
                    }
                  } else if (isCorrectOpt) {
                    cardStyles = "bg-green-500/5 border-green-500/20 text-green-400/80 font-bold";
                    indicator = (
                      <span className="text-[9px] font-extrabold uppercase text-green-400/80 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/10">
                        Correct Answer
                      </span>
                    );
                  }

                  return (
                    <div key={opt.id} className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${cardStyles}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isSelected 
                            ? isCorrectOpt ? 'bg-green-500 text-slate-950' : 'bg-red-500 text-slate-950'
                            : isCorrectOpt ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-white/40 border border-white/10'
                        }`}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="truncate" title={opt.text}>{opt.text}</span>
                      </div>
                      {indicator && <div className="shrink-0 ml-2">{indicator}</div>}
                    </div>
                  );
                })}
              </div>

              {/* Add Explanation content in Admin View if available */}
              {q.explanation && (
                <div className="mt-3 p-4 bg-slate-950/80 border border-white/5 rounded-xl border-l-2 border-l-cyan-500 text-xs">
                  <span className="font-bold text-cyan-400 uppercase tracking-widest block mb-1">Explanation & Solutions</span>
                  <p className="text-white/60 leading-relaxed whitespace-pre-wrap">{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Student Management View
// -------------------------------------------------------------------
function StudentManagementView() {
  const supabase = createClient();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedBatch, setSelectedBatch] = useState("All Batches");
  const [selectedClass, setSelectedClass] = useState("All Classes");
  const [selectedExam, setSelectedExam] = useState("All Exams");

  // Subject-wise stats state
  const [subjectStatsByTest, setSubjectStatsByTest] = useState<Record<string, Record<string, any>>>({});
  const [loadingStudentStats, setLoadingStudentStats] = useState(false);
  const [selectedStatsTestKey, setSelectedStatsTestKey] = useState<string>("");

  const loadStudentStats = async (student: any) => {
    if (!student || !student.test_history || student.test_history.length === 0) {
      setSubjectStatsByTest({});
      return;
    }
    
    setLoadingStudentStats(true);
    try {
      const testIds = Array.from(new Set(student.test_history.map((t: any) => t.test_id))) as string[];
      
      // Fetch all questions for these tests
      const { data: questionsData, error: qError } = await supabase
        .from('questions')
        .select('id, test_id, subject, marks, negative_marks')
        .in('test_id', testIds);
        
      if (qError) throw qError;
      
      // Fetch all responses for this student and these tests
      const { data: responsesData, error: rError } = await supabase
        .from('user_responses')
        .select('test_id, question_id, selected_option_id, is_correct, attempt_number')
        .eq('user_id', student.id)
        .in('test_id', testIds);
        
      if (rError) throw rError;
      
      const statsByTestAttempt: Record<string, Record<string, { score: number; correct: number; incorrect: number; total: number; attempted: number }>> = {};
      
      // Initialize subject stats for all questions in all attempts
      questionsData?.forEach((q: any) => {
        const sub = q.subject || "Physics";
        const attemptsForTest = student.test_history
          .filter((t: any) => t.test_id === q.test_id)
          .map((t: any) => t.attempt_number);
          
        attemptsForTest.forEach((attemptNum: number) => {
          const groupKey = `${q.test_id}_${attemptNum}`;
          if (!statsByTestAttempt[groupKey]) {
            statsByTestAttempt[groupKey] = {};
          }
          if (!statsByTestAttempt[groupKey][sub]) {
            statsByTestAttempt[groupKey][sub] = { score: 0, correct: 0, incorrect: 0, total: 0, attempted: 0 };
          }
          statsByTestAttempt[groupKey][sub].total++;
        });
      });
      
      // Add data from actual user responses
      responsesData?.forEach((r: any) => {
        const attemptNum = r.attempt_number || 1;
        const groupKey = `${r.test_id}_${attemptNum}`;
        const q = questionsData?.find((x: any) => x.id === r.question_id);
        if (r.selected_option_id && q) {
          const sub = q.subject || "Physics";
          const qMarks = q.marks !== undefined && q.marks !== null ? q.marks : 4;
          const qNeg = q.negative_marks !== undefined && q.negative_marks !== null ? q.negative_marks : 1;
          
          if (!statsByTestAttempt[groupKey]) {
            statsByTestAttempt[groupKey] = {};
          }
          if (!statsByTestAttempt[groupKey][sub]) {
            statsByTestAttempt[groupKey][sub] = { score: 0, correct: 0, incorrect: 0, total: 0, attempted: 0 };
          }
          
          statsByTestAttempt[groupKey][sub].attempted++;
          if (r.is_correct) {
            statsByTestAttempt[groupKey][sub].score += qMarks;
            statsByTestAttempt[groupKey][sub].correct++;
          } else {
            statsByTestAttempt[groupKey][sub].score -= qNeg;
            statsByTestAttempt[groupKey][sub].incorrect++;
          }
        }
      });
      
      setSubjectStatsByTest(statsByTestAttempt);
    } catch (err) {
      console.error("Failed to load student subject statistics:", err);
    } finally {
      setLoadingStudentStats(false);
    }
  };

  const handleSelectStudent = (student: any) => {
    setSelectedStudent(student);
    setExpandedTestId(null);
    setExpandedTestQuestions([]);
    if (student) {
      loadStudentStats(student);
      if (student.test_history && student.test_history.length > 0) {
        const latest = student.test_history[0];
        setSelectedStatsTestKey(`${latest.test_id}_${latest.attempt_number}`);
      } else {
        setSelectedStatsTestKey("");
      }
    } else {
      setSubjectStatsByTest({});
      setSelectedStatsTestKey("");
    }
  };

  // Dynamic Question-by-Question Response Review State
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [expandedTestQuestions, setExpandedTestQuestions] = useState<any[]>([]);
  const [loadingReview, setLoadingReview] = useState(false);

  const handleToggleReview = async (studentId: string, testId: string) => {
    if (expandedTestId === testId) {
      setExpandedTestId(null);
      setExpandedTestQuestions([]);
      return;
    }
    
    setExpandedTestId(testId);
    setLoadingReview(true);
    setExpandedTestQuestions([]);
    
    try {
      // 1. Fetch questions and options for this test
      const { data: questionsData, error: qError } = await supabase
        .from('questions')
        .select('id, text, explanation, options(id, text, is_correct)')
        .eq('test_id', testId)
        .order('created_at', { ascending: true });
        
      if (qError) throw qError;
      
      // 2. Fetch student user responses for this test
      const { data: responsesData, error: rError } = await supabase
        .from('user_responses')
        .select('question_id, selected_option_id, is_correct')
        .eq('user_id', studentId)
        .eq('test_id', testId);
        
      if (rError) throw rError;
      
      // 3. Map responses to questions
      const mappedQuestions = (questionsData || []).map((q: any) => {
        const userResp = (responsesData || []).find((r: any) => r.question_id === q.id);
        return {
          id: q.id,
          text: q.text,
          explanation: q.explanation,
          options: q.options || [],
          selectedOptionId: userResp?.selected_option_id || null,
          isCorrect: userResp?.is_correct || false,
          hasResponded: !!userResp
        };
      });
      
      setExpandedTestQuestions(mappedQuestions);
    } catch (err) {
      console.error("Failed to load test responses review:", err);
    } finally {
      setLoadingReview(false);
    }
  };

  useEffect(() => {
    const fetchStudentsAndSwot = async () => {
      setLoading(true);
      try {
        // 1. Fetch all student profiles
        const { data: profilesData } = await supabase.from('profiles').select('*').eq('role', 'student');
        
        if (profilesData && profilesData.length > 0) {
          const studentIds = profilesData.map(p => p.id);
          
          // 2. Fetch all test results, integrity reports, and violations for these students in parallel
          const [resultsRes, integrityRes, violationsRes] = await Promise.all([
            supabase.from('test_results').select('*').in('user_id', studentIds),
            supabase.from('exam_integrity_reports').select('*').in('user_id', studentIds),
            supabase.from('exam_violations').select('*').in('user_id', studentIds)
          ]);
          
          const resultsData = resultsRes.data || [];
          const integrityData = integrityRes.data || [];
          const violationsData = violationsRes.data || [];
          
          const studentsWithDetails = profilesData.map(profile => {
             const rawStudentResults = resultsData.filter(r => r.user_id === profile.id);
             const studentIntegrity = integrityData.filter(r => r.user_id === profile.id);
             const studentViolations = violationsData.filter(r => r.user_id === profile.id);
             
             // Sort chronologically to assign attempt numbers
             const resultsByTest: Record<string, any[]> = {};
             const chronological = [...rawStudentResults].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
             chronological.forEach((res) => {
               if (!resultsByTest[res.test_id]) {
                 resultsByTest[res.test_id] = [];
               }
               resultsByTest[res.test_id].push(res);
               res.attempt_number = resultsByTest[res.test_id].length;
             });

             // Sort descending for display
             const studentResults = [...chronological].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
             
             let strengths: string[] = [];
             let weaknesses: string[] = [];
             let opportunities: string[] = ["Attempt more Mock Tests", "Review incorrect questions in detail"];
             let threats: string[] = ["Time management on lengthy exams", "Negative marking penalties"];
             
             studentResults.forEach((result: any) => {
               const accuracy = result.total_questions > 0 ? (result.correct_count / result.total_questions) * 100 : 0;
               if (accuracy >= 70) strengths.push(result.title || result.exam_type);
               else if (accuracy <= 40) weaknesses.push(result.title || result.exam_type);
               else opportunities.push(`Improve speed in ${result.title || result.exam_type}`);
             });

             return {
               id: profile.id,
               email: profile.email || `No Email Provided`,
               full_name: profile.full_name || null,
               class: profile.class || 'N/A',
               board: profile.board || 'N/A',
               aspiration: profile.aspiration || profile.board || 'Not Set',
               batch: profile.batch || 'Unassigned',
               school_name: profile.school_name || 'Not Provided',
               phone: profile.phone || 'Not Provided',
               total_tests: studentResults.length,
               test_history: studentResults,
               integrity_reports: studentIntegrity,
               violations: studentViolations,
               full_swot: {
                 strengths: Array.from(new Set(strengths)).slice(0, 3),
                 weaknesses: Array.from(new Set(weaknesses)).slice(0, 3),
                 opportunities: Array.from(new Set(opportunities)).slice(0, 3),
                 threats: threats.slice(0, 2)
               },
               strengths: Array.from(new Set(strengths)).slice(0, 2),
               weaknesses: Array.from(new Set(weaknesses)).slice(0, 2)
             };
          });
          
          setStudents(studentsWithDetails);
        } else {
          setStudents([]);
        }
      } catch (err) {
        console.error("Error fetching student details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentsAndSwot();
  }, []);

  const handleAllowReattempt = async (studentId: string, testId: string) => {
    if (!confirm("Are you sure you want to allow this user to re-attempt the test? This will delete their violations, integrity reports, and test results for this exam.")) {
      return;
    }

    try {
      // 1. Delete test results
      const { error: resultsError } = await supabase
        .from('test_results')
        .delete()
        .eq('user_id', studentId)
        .eq('test_id', testId);

      if (resultsError) throw resultsError;

      // 2. Delete integrity reports
      const { error: integrityError } = await supabase
        .from('exam_integrity_reports')
        .delete()
        .eq('user_id', studentId)
        .eq('test_id', testId);

      if (integrityError) throw integrityError;

      // 3. Delete violations
      const { error: violationsError } = await supabase
        .from('exam_violations')
        .delete()
        .eq('user_id', studentId)
        .eq('test_id', testId);

      if (violationsError) throw violationsError;

      // 4. Delete user responses
      const { error: responsesError } = await supabase
        .from('user_responses')
        .delete()
        .eq('user_id', studentId)
        .eq('test_id', testId);

      if (responsesError) throw responsesError;

      alert("Success! The student can now re-attempt the test.");
      
      // Update local state by removing the test from the active selection
      setStudents(prevStudents => {
        const updated = prevStudents.map(student => {
          if (student.id !== studentId) return student;
          
          const newTestHistory = student.test_history.filter((t: any) => t.test_id !== testId);
          const newIntegrity = student.integrity_reports.filter((r: any) => r.test_id !== testId);
          const newViolations = student.violations.filter((v: any) => v.test_id !== testId);
          
          // Recompute SWOT strengths and weaknesses
          let strengths: string[] = [];
          let weaknesses: string[] = [];
          let opportunities: string[] = ["Attempt more Mock Tests", "Review incorrect questions in detail"];
          let threats: string[] = ["Time management on lengthy exams", "Negative marking penalties"];
          
          newTestHistory.forEach((result: any) => {
            const accuracy = result.total_questions > 0 ? (result.correct_count / result.total_questions) * 100 : 0;
            if (accuracy >= 70) strengths.push(result.title || result.exam_type);
            else if (accuracy <= 40) weaknesses.push(result.title || result.exam_type);
            else opportunities.push(`Improve speed in ${result.title || result.exam_type}`);
          });

          const updatedStudent = {
            ...student,
            total_tests: newTestHistory.length,
            test_history: newTestHistory,
            integrity_reports: newIntegrity,
            violations: newViolations,
            full_swot: {
              strengths: Array.from(new Set(strengths)).slice(0, 3),
              weaknesses: Array.from(new Set(weaknesses)).slice(0, 3),
              opportunities: Array.from(new Set(opportunities)).slice(0, 3),
              threats: threats.slice(0, 2)
            },
            strengths: Array.from(new Set(strengths)).slice(0, 2),
            weaknesses: Array.from(new Set(weaknesses)).slice(0, 2)
          };

          // Also update selectedStudent state if it's the current student
          setSelectedStudent((prevSelected: any) => {
            if (prevSelected && prevSelected.id === studentId) {
              if (newTestHistory.length > 0) {
                const latest = newTestHistory[0];
                setSelectedStatsTestKey(`${latest.test_id}_${latest.attempt_number}`);
              } else {
                setSelectedStatsTestKey("");
              }
              return updatedStudent;
            }
            return prevSelected;
          });

          return updatedStudent;
        });
        return updated;
      });

    } catch (err: any) {
      console.error("Failed to allow re-attempt:", err);
      alert(`Error: ${err.message || "Failed to allow re-attempt"}`);
    }
  };

  const uniqueBatches = Array.from(new Set(students.map(s => s.batch).filter(b => b && b !== 'Unassigned')));
  const uniqueClasses = Array.from(new Set(students.map(s => String(s.class || '')).filter(c => c && c !== 'N/A' && c !== 'undefined' && c !== 'null')));
  const uniqueExams = Array.from(new Set(students.map(s => s.aspiration).filter(e => e && e !== 'Not Set' && e !== 'N/A')));

  const filteredStudents = students.filter(s => {
    const matchesBatch = selectedBatch === "All Batches" || s.batch === selectedBatch;
    const matchesClass = selectedClass === "All Classes" || String(s.class) === selectedClass;
    const matchesExam = selectedExam === "All Exams" || s.aspiration === selectedExam;
    return matchesBatch && matchesClass && matchesExam;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
        <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2"><Users className="w-5 h-5 text-orange-500" /> Student Roster & Analytics</h3>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Batch Filter */}
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-orange-500 transition-all cursor-pointer shadow-inner min-w-[150px]"
            >
              <option value="All Batches">All Batches</option>
              {uniqueBatches.map(b => (
                <option key={String(b)} value={String(b)}>{String(b)}</option>
              ))}
            </select>

            {/* Class Filter */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-orange-500 transition-all cursor-pointer shadow-inner min-w-[120px]"
            >
              <option value="All Classes">All Classes</option>
              {uniqueClasses.map(c => (
                <option key={String(c)} value={String(c)}>Class {String(c)}</option>
              ))}
            </select>

            {/* Exam Filter */}
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-orange-500 transition-all cursor-pointer shadow-inner min-w-[120px]"
            >
              <option value="All Exams">All Exams</option>
              {uniqueExams.map(e => (
                <option key={String(e)} value={String(e)}>{String(e)}</option>
              ))}
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex justify-center p-12 text-white/50">No students found matching the selected filters.</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-widest">
                    <th className="p-4 font-bold">Student Details</th>
                    <th className="p-4 font-bold">Class & Aspiration</th>
                    <th className="p-4 font-bold">Tests Taken</th>
                    <th className="p-4 font-bold">Top Strengths</th>
                    <th className="p-4 font-bold text-red-400">Weaknesses</th>
                    <th className="p-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(s => (
                    <tr key={s.id} onClick={() => handleSelectStudent(s)} className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                      <td className="p-4">
                        <div className="font-medium text-white">{s.full_name || s.email}</div>
                        <div className="text-xs text-white/50 font-mono mt-1">ID: {s.id.substring(0,8)}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-white/80 font-medium">Class {s.class}</div>
                        <div className="text-xs text-cyan-400 font-bold tracking-wide mt-1">{s.aspiration}</div>
                        <div className="text-[10px] text-orange-400 font-medium mt-1">{s.batch}</div>
                      </td>
                      <td className="p-4 text-orange-400 font-bold text-lg">{s.total_tests}</td>
                      <td className="p-4 text-green-400/80 text-sm font-medium">{s.strengths.length > 0 ? s.strengths.join(', ') : '-'}</td>
                      <td className="p-4 text-red-400/80 text-sm font-medium">{s.weaknesses.length > 0 ? s.weaknesses.join(', ') : '-'}</td>
                      <td className="p-4 text-right">
                        <button className="text-xs bg-white/5 hover:bg-white/10 text-white py-1.5 px-3 rounded-lg transition-colors border border-white/10">Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {filteredStudents.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => handleSelectStudent(s)}
                  className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-orange-500/30 transition-all space-y-4 cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-white text-base">{s.full_name || s.email}</div>
                      <div className="text-xs text-white/40 font-mono mt-0.5">ID: {s.id.substring(0,8)}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs bg-orange-500/10 text-orange-400 px-2.5 py-1 rounded-md font-bold block">
                        {s.total_tests} {s.total_tests === 1 ? 'Test' : 'Tests'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/40 p-3 rounded-xl border border-white/5">
                    <div>
                      <span className="text-white/40 block mb-0.5">Class</span>
                      <span className="text-white/80 font-bold">Class {s.class}</span>
                    </div>
                    <div>
                      <span className="text-white/40 block mb-0.5">Aspiration</span>
                      <span className="text-cyan-400 font-bold">{s.aspiration}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-white/40 block mb-0.5">Batch</span>
                      <span className="text-orange-400 font-medium">{s.batch}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-white/40 font-semibold">Strengths:</span>
                      <span className="text-green-400 font-medium text-right truncate max-w-[200px]" title={s.strengths.join(', ')}>
                        {s.strengths.length > 0 ? s.strengths.join(', ') : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40 font-semibold">Weaknesses:</span>
                      <span className="text-red-400 font-medium text-right truncate max-w-[200px]" title={s.weaknesses.join(', ')}>
                        {s.weaknesses.length > 0 ? s.weaknesses.join(', ') : '-'}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); handleSelectStudent(s); }}
                    className="w-full text-center py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold text-sm rounded-xl transition-colors border border-white/10"
                  >
                    View Detailed Report Card
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Detailed Student Report Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#0f172a] border border-white/10 rounded-[2rem] w-full max-w-4xl h-[95vh] md:h-[90vh] flex flex-col shadow-[0_0_50px_rgba(249,115,22,0.15)] relative overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Modal Ambient Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-orange-600/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-red-600/10 rounded-full blur-[80px] pointer-events-none" />

            {/* Modal Header (Sticky) */}
            <div className="p-5 md:p-6 pb-4 border-b border-white/10 flex justify-between items-start shrink-0 relative z-10 bg-slate-900/40 backdrop-blur-md">
              <div>
                <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-500 text-[10px] font-bold uppercase tracking-wider mb-2 inline-block">
                  Student Profile Report
                </span>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-2 leading-none">
                  {selectedStudent.full_name || "Roster Student"}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
                  <span className="font-mono bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                    ID: {selectedStudent.id.substring(0,8)}
                  </span>
                  <span className="hidden sm:inline text-white/30">•</span>
                  <span className="bg-white/5 px-2.5 py-0.5 rounded-md border border-white/10 font-semibold text-white/70">
                    Class {selectedStudent.class}
                  </span>
                  <span className="hidden sm:inline text-white/30">•</span>
                  <span className="text-cyan-400 font-bold bg-cyan-500/10 px-2.5 py-0.5 rounded-md border border-cyan-500/20">
                    {selectedStudent.aspiration}
                  </span>
                  <span className="hidden sm:inline text-white/30">•</span>
                  <span className="text-orange-400 font-medium bg-orange-500/10 px-2.5 py-0.5 rounded-md border border-orange-500/20">
                    {selectedStudent.batch}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => { handleSelectStudent(null); }}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-8 scrollbar-thin relative z-10">
              
              {/* Student Personal details Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-white/20 transition-colors">
                  <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email Address</span>
                  <span className="text-white text-sm font-semibold truncate block" title={selectedStudent.email}>{selectedStudent.email}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-white/20 transition-colors">
                  <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Phone Number</span>
                  <span className="text-white text-sm font-semibold truncate block">{selectedStudent.phone || "Not Provided"}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-white/20 transition-colors">
                  <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1"><Award className="w-3.5 h-3.5" /> Educational Board</span>
                  <span className="text-white text-sm font-semibold truncate block">{selectedStudent.board || "Not Provided"}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-white/20 transition-colors">
                  <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> School / College</span>
                  <span className="text-white text-sm font-semibold truncate block" title={selectedStudent.school_name}>{selectedStudent.school_name || "Not Provided"}</span>
                </div>
              </div>

              {/* Subject-Wise Exam/Quiz Analysis Card */}
              {selectedStudent.test_history && selectedStudent.test_history.length > 0 && (
                <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Target className="w-5 h-5 text-cyan-400" /> Subject-Wise Exam / Quiz Analysis
                    </h3>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/40 font-medium">Select Exam:</span>
                      <select
                        value={selectedStatsTestKey}
                        onChange={(e) => setSelectedStatsTestKey(e.target.value)}
                        className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500 transition-all cursor-pointer shadow-inner max-w-[280px] truncate"
                      >
                        {selectedStudent.test_history.map((test: any) => {
                          const testKey = `${test.test_id}_${test.attempt_number}`;
                          return (
                            <option key={testKey} value={testKey}>
                              {test.title || test.exam_type} (Attempt {test.attempt_number})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                  
                  {loadingStudentStats ? (
                    <div className="flex items-center gap-3 py-6 justify-center text-white/40 text-sm">
                      <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                      <span>Computing subject breakdowns...</span>
                    </div>
                  ) : !selectedStatsTestKey || !subjectStatsByTest[selectedStatsTestKey] ? (
                    <div className="flex items-center gap-3 py-6 justify-center text-white/40 text-sm">
                      <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                      <span>Computing subject breakdowns...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(subjectStatsByTest[selectedStatsTestKey]).map(([sub, stat]: any) => {
                        const accuracy = stat.attempted > 0 ? ((stat.correct / stat.attempted) * 100).toFixed(0) : "0";
                        return (
                          <div key={sub} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-cyan-500/30 transition-colors flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2.5">
                              <span className="text-sm font-bold text-white">{sub}</span>
                              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                {stat.score} Marks
                              </span>
                            </div>
                            <div className="space-y-1.5 text-xs text-white/50 pt-2 border-t border-white/5">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] uppercase text-white/40 font-semibold">Attempted</span>
                                <span className="text-cyan-400 font-bold">{stat.attempted} / {stat.total}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] uppercase text-white/40 font-semibold">Correct</span>
                                <span className="text-green-400 font-bold">{stat.correct}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] uppercase text-white/40 font-semibold">Wrong</span>
                                <span className="text-red-400 font-bold">{stat.incorrect}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] uppercase text-white/40 font-semibold">Unattended</span>
                                <span className="text-amber-500 font-bold">{stat.total - stat.attempted}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] uppercase text-white/40 font-semibold">Accuracy</span>
                                <span className="text-white font-bold">{accuracy}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Performance SWOT Analysis */}
              <div className="space-y-4">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-400" /> Performance SWOT Analysis
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/25 rounded-2xl p-4 hover:border-emerald-500/40 transition-colors">
                    <h4 className="text-emerald-400 font-bold mb-2.5 flex items-center gap-1.5 text-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" /> Strengths (S)
                    </h4>
                    <ul className="text-xs text-white/70 space-y-1">
                      {selectedStudent.full_swot.strengths.length > 0 ? selectedStudent.full_swot.strengths.map((x: string, i: number) => <li key={i} className="flex items-start gap-1.5"><span>•</span> {x}</li>) : <li>Keep practicing to build strengths.</li>}
                    </ul>
                  </div>
                  <div className="bg-gradient-to-br from-rose-500/10 to-rose-500/5 border border-rose-500/25 rounded-2xl p-4 hover:border-rose-500/40 transition-colors">
                    <h4 className="text-rose-400 font-bold mb-2.5 flex items-center gap-1.5 text-sm">
                      <span className="w-2 h-2 rounded-full bg-rose-400" /> Weaknesses (W)
                    </h4>
                    <ul className="text-xs text-white/70 space-y-1">
                      {selectedStudent.full_swot.weaknesses.length > 0 ? selectedStudent.full_swot.weaknesses.map((x: string, i: number) => <li key={i} className="flex items-start gap-1.5"><span>•</span> {x}</li>) : <li>No weaknesses recorded.</li>}
                    </ul>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/25 rounded-2xl p-4 hover:border-blue-500/40 transition-colors">
                    <h4 className="text-blue-400 font-bold mb-2.5 flex items-center gap-1.5 text-sm">
                      <span className="w-2 h-2 rounded-full bg-blue-400" /> Opportunities (O)
                    </h4>
                    <ul className="text-xs text-white/70 space-y-1">
                      {selectedStudent.full_swot.opportunities.map((x: string, i: number) => <li key={i} className="flex items-start gap-1.5"><span>•</span> {x}</li>)}
                    </ul>
                  </div>
                  <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/25 rounded-2xl p-4 hover:border-amber-500/40 transition-colors">
                    <h4 className="text-amber-400 font-bold mb-2.5 flex items-center gap-1.5 text-sm">
                      <span className="w-2 h-2 rounded-full bg-amber-400" /> Threats (T)
                    </h4>
                    <ul className="text-xs text-white/70 space-y-1">
                      {selectedStudent.full_swot.threats.map((x: string, i: number) => <li key={i} className="flex items-start gap-1.5"><span>•</span> {x}</li>)}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Exam Security & Integrity Section */}
              <div className="space-y-4">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-500" /> Exam Security & Integrity Analysis
                </h3>
                
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                  {(!selectedStudent.violations || selectedStudent.violations.length === 0) && (!selectedStudent.integrity_reports || selectedStudent.integrity_reports.length === 0) ? (
                    <div className="flex items-center gap-3 text-green-400 text-sm">
                      <CheckCircle className="w-5 h-5 shrink-0" />
                      <span>No security violations detected. Candidate has maintained full browser compliance.</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Integrity report summary */}
                      {selectedStudent.integrity_reports && selectedStudent.integrity_reports.length > 0 && (
                        <div className="grid grid-cols-1 gap-3">
                          {selectedStudent.integrity_reports.map((rep: any) => (
                            <div key={rep.id} className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 text-xs md:text-sm">
                              <div className="flex justify-between items-center mb-2.5 gap-2 flex-wrap">
                                <span className="font-bold text-white/80">Session Security Report</span>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    rep.status === 'normal' 
                                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                      : rep.status === 'warned'
                                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  }`}>
                                    Status: {rep.status.replace(/_/g, ' ')}
                                  </span>
                                  {(rep.status === 'submitted_due_to_violation' || rep.status === 'warned') && (
                                    <button
                                      onClick={() => handleAllowReattempt(selectedStudent.id, rep.test_id)}
                                      className="px-2.5 py-1 text-[10px] font-bold uppercase bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg border border-red-500/30 transition-all cursor-pointer shadow-sm"
                                    >
                                      Allow Re-attempt
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-white/70 leading-relaxed font-medium">{rep.violation_summary}</p>
                              {rep.device_info && (
                                <div className="text-[10px] text-white/40 mt-2 font-mono">
                                  Device: {rep.device_info.platform || "Unknown"} | {rep.device_info.screenWidth}x{rep.device_info.screenHeight}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Violations detail list */}
                      {selectedStudent.violations && selectedStudent.violations.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Individual Security Breaches ({selectedStudent.violations.length})</p>
                          <div className="bg-slate-950/40 rounded-2xl border border-white/5 overflow-hidden overflow-x-auto">
                            <table className="w-full text-left text-xs min-w-[500px]">
                              <thead className="bg-white/5 border-b border-white/10 text-white/50">
                                <tr>
                                  <th className="p-3 font-bold">Violation Type</th>
                                  <th className="p-3 font-bold text-center">Action Taken</th>
                                  <th className="p-3 font-bold text-right">Time Detected</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedStudent.violations.map((v: any) => (
                                  <tr key={v.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-3 text-white/80 font-semibold flex items-center gap-1.5">
                                      <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                                      {v.violation_type}
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        v.action_taken.includes("Warning") ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'
                                      }`}>
                                        {v.action_taken}
                                      </span>
                                    </td>
                                    <td className="p-3 text-right text-white/40 font-mono">
                                      {new Date(v.timestamp).toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Test History Section */}
              <div className="space-y-4">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-cyan-400" /> Test History
                </h3>
                
                {/* Desktop Test History Table */}
                <div className="hidden md:block bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 border-b border-white/10 text-white/50">
                      <tr>
                        <th className="p-4 font-bold">Test Title</th>
                        <th className="p-4 font-bold text-center">Score</th>
                        <th className="p-4 font-bold text-center">Correct/Total</th>
                        <th className="p-4 font-bold text-center">Date</th>
                        <th className="p-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudent.test_history.map((test: any) => {
                        const isExpanded = expandedTestId === test.test_id;
                        const testKey = `${test.test_id}_${test.attempt_number}`;
                        const stats = subjectStatsByTest[testKey];
                        
                        return (
                          <React.Fragment key={test.id}>
                            <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="p-4">
                                <div className="text-white font-semibold">{test.title || test.exam_type}</div>
                                <div className="flex flex-wrap gap-2 items-center mt-1">
                                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase tracking-wider">
                                    Attempt {test.attempt_number}
                                  </span>
                                  {/* Subject pill scores */}
                                  {stats && Object.entries(stats).map(([sub, stat]: any) => (
                                    <span key={sub} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/50">
                                      {sub}: <span className="text-cyan-400">{stat.score}</span>
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="p-4 text-center font-black text-cyan-400 text-lg">{test.score}</td>
                              <td className="p-4 text-center text-white/60 font-semibold">{test.correct_count} / {test.total_questions}</td>
                              <td className="p-4 text-center text-white/50 font-medium">{new Date(test.created_at).toLocaleDateString()}</td>
                              <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleToggleReview(selectedStudent.id, test.test_id)}
                                    className={`text-xs font-bold py-2 px-4 rounded-xl border transition-all ${
                                      isExpanded
                                        ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                                        : "bg-white/5 hover:bg-white/10 text-white/80 border-white/10"
                                    }`}
                                  >
                                    {isExpanded ? "Hide Review" : "Review Answers"}
                                  </button>
                                  <button
                                    onClick={() => handleAllowReattempt(selectedStudent.id, test.test_id)}
                                    className="text-xs font-bold py-2 px-4 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20 hover:border-red-500/30 transition-all cursor-pointer"
                                  >
                                    Allow Re-attempt
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr>
                                <td colSpan={5} className="p-5 bg-slate-950/60 border-b border-white/10">
                                  {stats && (
                                    <div className="mb-6 bg-slate-900/80 p-5 rounded-2xl border border-white/5 space-y-4">
                                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                        <Target className="w-4 h-4 text-cyan-400" /> Subject-Wise Score Analysis for this Test
                                      </h4>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {Object.entries(stats).map(([sub, stat]: any) => {
                                          const accuracy = stat.attempted > 0 ? ((stat.correct / stat.attempted) * 100).toFixed(0) : "0";
                                          return (
                                            <div key={sub} className="p-4 bg-white/5 border border-white/5 rounded-xl flex flex-col justify-between">
                                              <div className="flex justify-between items-center mb-2.5">
                                                <span className="text-xs font-bold text-white">{sub}</span>
                                                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                                  {stat.score} Marks
                                                </span>
                                              </div>
                                              <div className="space-y-1.5 text-xs text-white/50 pt-2 border-t border-white/5">
                                                <div className="flex justify-between items-center">
                                                  <span className="uppercase text-white/30 text-[9px] font-semibold">Attempted</span>
                                                  <span className="text-cyan-400 font-bold">{stat.attempted} / {stat.total}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                  <span className="uppercase text-white/30 text-[9px] font-semibold">Correct</span>
                                                  <span className="text-green-400 font-bold">{stat.correct}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                  <span className="uppercase text-white/30 text-[9px] font-semibold">Wrong</span>
                                                  <span className="text-red-400 font-bold">{stat.incorrect}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                  <span className="uppercase text-white/30 text-[9px] font-semibold">Unattended</span>
                                                  <span className="text-amber-500 font-bold">{stat.total - stat.attempted}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                  <span className="uppercase text-white/30 text-[9px] font-semibold">Accuracy</span>
                                                  <span className="text-white font-bold">{accuracy}%</span>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  <QuestionReviewSection 
                                    questions={expandedTestQuestions} 
                                    loading={loadingReview} 
                                  />
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                      {selectedStudent.test_history.length === 0 && (
                        <tr><td colSpan={5} className="p-8 text-center text-white/30">No tests taken yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Test History Cards (Responsive) */}
                <div className="md:hidden space-y-4">
                  {selectedStudent.test_history.map((test: any) => {
                    const isExpanded = expandedTestId === test.test_id;
                    const testKey = `${test.test_id}_${test.attempt_number}`;
                    const stats = subjectStatsByTest[testKey];
                    
                    return (
                      <div key={test.id} className="bg-[#1e293b]/40 border border-white/10 rounded-3xl p-4 space-y-4 hover:border-orange-500/30 transition-colors">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h4 className="text-sm font-bold text-white leading-snug">{test.title || test.exam_type}</h4>
                            <span className="inline-block px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase tracking-wider mt-1.5">
                              Attempt {test.attempt_number}
                            </span>
                          </div>
                          <span className="text-[10px] text-white/40 font-semibold">{new Date(test.created_at).toLocaleDateString()}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/40 p-3 rounded-xl border border-white/5 text-center">
                          <div>
                            <span className="text-white/40 block mb-0.5 uppercase font-bold text-[9px] tracking-wider">Score</span>
                            <span className="text-cyan-400 font-extrabold text-base">{test.score}</span>
                          </div>
                          <div>
                            <span className="text-white/40 block mb-0.5 uppercase font-bold text-[9px] tracking-wider">Correct/Total</span>
                            <span className="text-white font-extrabold text-sm">{test.correct_count} / {test.total_questions}</span>
                          </div>
                        </div>

                        {/* Subject pill scores */}
                        {stats && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {Object.entries(stats).map(([sub, stat]: any) => (
                              <span key={sub} className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950/60 border border-white/5 text-white/50 flex-1 text-center">
                                {sub}: <span className="text-cyan-400 font-extrabold">{stat.score}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleReview(selectedStudent.id, test.test_id)}
                            className={`flex-1 py-2 rounded-xl border font-bold text-xs transition-all ${
                              isExpanded
                                ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                                : "bg-white/5 hover:bg-white/10 text-white/80 border-white/10"
                            }`}
                          >
                            {isExpanded ? "Hide Review" : "Review Answers"}
                          </button>
                          <button
                            onClick={() => handleAllowReattempt(selectedStudent.id, test.test_id)}
                            className="flex-1 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20 font-bold text-xs transition-all cursor-pointer text-center"
                          >
                            Re-attempt
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="pt-3 border-t border-white/5 mt-3 space-y-4">
                            {stats && (
                              <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-3">
                                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                                  <Target className="w-3.5 h-3.5 text-cyan-400" /> Subject-Wise Analysis
                                </h4>
                                <div className="grid grid-cols-1 gap-2">
                                  {Object.entries(stats).map(([sub, stat]: any) => {
                                    const accuracy = stat.attempted > 0 ? ((stat.correct / stat.attempted) * 100).toFixed(0) : "0";
                                    return (
                                      <div key={sub} className="p-3 bg-white/5 border border-white/5 rounded-xl flex flex-col justify-between">
                                        <div className="flex justify-between items-center mb-2">
                                          <span className="text-xs font-bold text-white">{sub}</span>
                                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                            {stat.score} Marks
                                          </span>
                                        </div>
                                        <div className="space-y-1.5 text-xs text-white/50 pt-1.5 border-t border-white/5">
                                          <div className="flex justify-between items-center">
                                            <span className="uppercase text-white/30 text-[9px] font-semibold">Attempted</span>
                                            <span className="text-cyan-400 font-bold">{stat.attempted} / {stat.total}</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="uppercase text-white/30 text-[9px] font-semibold">Correct</span>
                                            <span className="text-green-400 font-bold">{stat.correct}</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="uppercase text-white/30 text-[9px] font-semibold">Wrong</span>
                                            <span className="text-red-400 font-bold">{stat.incorrect}</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="uppercase text-white/30 text-[9px] font-semibold">Unattended</span>
                                            <span className="text-amber-500 font-bold">{stat.total - stat.attempted}</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="uppercase text-white/30 text-[9px] font-semibold">Accuracy</span>
                                            <span className="text-white font-bold">{accuracy}%</span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            <QuestionReviewSection 
                              questions={expandedTestQuestions} 
                              loading={loadingReview} 
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {selectedStudent.test_history.length === 0 && (
                    <div className="p-8 text-center text-white/30 bg-white/5 rounded-3xl border border-white/10">No tests taken yet.</div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------------
// Resource Management View (Notes & DPPs PDF Uploads + Tests)
// -------------------------------------------------------------------
function ResourceManagementView({ title, icon: Icon, action, type, isTest = false }: any) {
  const router = useRouter();
  const supabase = createClient();
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Form State
  const [formTitle, setFormTitle] = useState("");
  const [formSubject, setFormSubject] = useState("Physics");
  const [formTopic, setFormTopic] = useState("");
  const [formBatch, setFormBatch] = useState("All Students");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch from DB
  const fetchResources = async () => {
    setLoading(true);
    if (isTest) {
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setResources(data);
    } else {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('type', type)
        .order('created_at', { ascending: false });
      if (data) setResources(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchResources();
  }, [type]);

  // Handle Action Button Click
  const handleActionClick = () => {
    if (isTest) {
      router.push("/admin/create-test");
    } else {
      setIsModalOpen(true);
    }
  };

  // Upload PDF & Insert to DB
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile) {
      alert("Please select a PDF file to upload.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 1. Generate unique file name and path
      const fileExt = pdfFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${type}s/${fileName}`;

      // 2. Upload to Supabase Storage Bucket
      const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(filePath, pdfFile);

      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resources')
        .getPublicUrl(filePath);

      // 4. Save to Database Record
      const { error: dbError } = await supabase.from('resources').insert([
        {
          title: formTitle,
          subject: formSubject,
          topic: formTopic,
          link: publicUrl,
          target_batch: formBatch,
          type: type
        }
      ]);

      if (dbError) throw dbError;

      // Success
      setIsModalOpen(false);
      setFormTitle(""); setFormTopic(""); setPdfFile(null);
      fetchResources(); // Refresh list

    } catch (error: any) {
      alert("Error uploading file: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Resource
  const handleDelete = async (id: string, link: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete this ${type}? It will be instantly removed for all students.`);
    if (!confirmDelete) return;

    try {
      if (isTest) {
        // Delete test
        const { error: dbError } = await supabase.from('tests').delete().eq('id', id);
        if (dbError) throw dbError;
      } else {
        // 1. Delete the database record (this instantly removes it from the Student dashboard)
        const { error: dbError } = await supabase.from('resources').delete().eq('id', id);
        if (dbError) throw dbError;

        // 2. Cleanup: Delete the physical file from the Supabase Storage Bucket
        if (link && link.includes('/public/resources/')) {
          const filePath = link.split('/public/resources/')[1]; // extracts "notes/filename.pdf"
          if (filePath) {
            await supabase.storage.from('resources').remove([filePath]);
          }
        }
      }

      // Refresh list
      fetchResources();
    } catch (error: any) {
      alert("Error deleting resource: " + error.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 p-5 md:p-6 rounded-3xl border border-white/10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-500/20 text-orange-500 rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.3)]">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <p className="text-white/50 text-sm">Manage, upload, and allocate resources.</p>
          </div>
        </div>

        <button 
          onClick={handleActionClick}
          className="w-full md:w-auto py-3 px-6 rounded-xl bg-orange-500 text-slate-950 font-bold hover:bg-orange-400 transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2"
        >
          {isTest ? <Target className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
          {action}
        </button>
      </div>

      {/* Grid View */}
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
      ) : resources.length === 0 ? (
        <div className="p-12 text-center text-white/40 border border-dashed border-white/10 rounded-3xl">
          No resources found. Click '{action}' to add some.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((res) => (
            <div key={res.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-orange-500/30 transition-all group relative flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="px-2.5 py-1 rounded-md bg-white/10 text-white/70 text-[10px] font-bold uppercase tracking-wider">
                    {isTest ? `${res.exam_type} • ${res.duration} Mins` : `${res.subject} • ${res.topic}`}
                  </span>
                </div>
                
                <h4 className="text-lg font-bold text-white mb-2">{res.title}</h4>
                
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Assigned To:</span>
                    <span className="text-orange-400 font-medium">{res.target_batch}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Date:</span>
                    <span className="text-white/80">{new Date(res.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!isTest && (
                  <a 
                    href={res.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 rounded-lg border border-orange-500/20 text-orange-400 hover:bg-orange-500/10 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" /> View PDF
                  </a>
                )}
                {isTest && (
                  <div className="flex w-full gap-2">
                    <button 
                      onClick={async () => {
                        const newStatus = res.status === 'live' ? 'draft' : 'live';
                        const { error } = await supabase.from('tests').update({ status: newStatus }).eq('id', res.id);
                        if (!error) fetchResources();
                      }}
                      className={`flex-1 py-2.5 rounded-lg border text-sm font-bold flex items-center justify-center transition-colors ${res.status === 'live' ? 'border-green-500/20 text-green-400 hover:bg-green-500/10' : 'border-orange-500/20 text-orange-400 hover:bg-orange-500/10'}`}
                    >
                      {res.status === 'live' ? '● Live' : '○ Make Live'}
                    </button>
                    <Link 
                      href={`/exam-hall?testId=${res.id}`}
                      className="flex-1 py-2.5 rounded-lg border border-orange-500/20 text-orange-400 hover:bg-orange-500/10 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
                    >
                      <Target className="w-4 h-4" /> Preview
                    </Link>
                  </div>
                )}
                <button
                  onClick={() => handleDelete(res.id, res.link)}
                  className="px-4 py-2.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-300 transition-colors flex items-center justify-center group"
                  title="Delete Resource"
                >
                  <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* UPLOAD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111623] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 font-body mx-4">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#151a28]">
              <h3 className="text-lg font-bold text-white truncate pr-4">{action}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white transition-colors flex-shrink-0"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleUpload} className="p-5 sm:p-6 space-y-4 bg-[#111623]">
              <div>
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider block mb-1.5">Title</label>
                <input required type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} className="w-full bg-[#0a0d14] border border-white/10 focus:border-orange-500 rounded-xl py-3 px-4 text-sm text-white outline-none transition-colors shadow-inner" placeholder="e.g. Thermodynamics Part 1" />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider block mb-1.5">Subject</label>
                  <input required type="text" value={formSubject} onChange={e => setFormSubject(e.target.value)} className="w-full bg-[#0a0d14] border border-white/10 focus:border-orange-500 rounded-xl py-3 px-4 text-sm text-white outline-none transition-colors shadow-inner" />
                </div>
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider block mb-1.5">Topic</label>
                  <input required type="text" value={formTopic} onChange={e => setFormTopic(e.target.value)} className="w-full bg-[#0a0d14] border border-white/10 focus:border-orange-500 rounded-xl py-3 px-4 text-sm text-white outline-none transition-colors shadow-inner" placeholder="e.g. Heat" />
                </div>
              </div>
              
              <div className="pt-1">
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider block mb-1.5">Upload PDF File</label>
                <label className="mt-1 flex flex-col items-center justify-center w-full h-32 border border-dashed border-white/20 rounded-xl cursor-pointer bg-[#0a0d14]/80 hover:bg-[#0a0d14] hover:border-orange-500/50 transition-all group shadow-inner">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                    <FileUp className="w-6 h-6 text-white/40 group-hover:text-orange-500 mb-3 transition-colors" />
                    <p className="mb-1 text-sm text-white/50 group-hover:text-white/80 transition-colors">
                      <span className="font-bold text-orange-500">Click to upload</span>
                      <span className="hidden sm:inline"> or drag and drop</span>
                    </p>
                    <p className="text-xs text-white/30 font-medium">PDF (MAX. 50MB)</p>
                  </div>
                  <input 
                    required 
                    type="file" 
                    accept="application/pdf" 
                    onChange={e => setPdfFile(e.target.files ? e.target.files[0] : null)} 
                    className="hidden" 
                  />
                </label>
                {pdfFile && (
                  <p className="text-xs text-green-400 font-bold mt-2 ml-1 truncate max-w-full">Selected: {pdfFile.name}</p>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider block mb-1.5">Target Batch</label>
                <div className="relative">
                  <select value={formBatch} onChange={e => setFormBatch(e.target.value)} className="w-full appearance-none bg-[#0a0d14] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-orange-500 outline-none transition-colors shadow-inner font-bold">
                    <option>All Students</option>
                    <option>Class 11</option>
                    <option>Class 12</option>
                    <option>IIT JEE Batch</option>
                    <option>NEET Batch</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <button disabled={isSubmitting} type="submit" className="w-full py-3.5 mt-2 rounded-xl bg-orange-500 text-slate-950 font-bold hover:bg-orange-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Uploading PDF...</> : "Publish PDF to Database"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
