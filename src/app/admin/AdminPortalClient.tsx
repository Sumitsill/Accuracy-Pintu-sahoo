"use client";

import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, Users, BookOpen, PenTool, Target, 
  Bell, Zap, LogOut, ChevronDown, Menu,
  Search, Eye, Send, Upload, Plus, MoreVertical, X, Loader2, FileUp, Trash2
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
// Student Management View
// -------------------------------------------------------------------
function StudentManagementView() {
  const supabase = createClient();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedBatch, setSelectedBatch] = useState("All Batches");

  useEffect(() => {
    const fetchStudentsAndSwot = async () => {
      setLoading(true);
      
      // Fetch ALL test results first to guarantee we catch active test-takers
      const { data: resultsData } = await supabase.from('test_results').select('*');
      
      if (resultsData && resultsData.length > 0) {
        // Extract unique student IDs from test results
        const uniqueUserIds = Array.from(new Set(resultsData.map(r => r.user_id)));
        
        // Attempt to fetch profile info for these users
        const { data: profilesData } = await supabase.from('profiles').select('*').in('id', uniqueUserIds);
        
        const studentsWithSwot = uniqueUserIds.map(userId => {
           const studentResults = resultsData.filter(r => r.user_id === userId);
           const profile = profilesData?.find(p => p.id === userId) || {};
           
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
             id: userId,
             email: profile.email || `No Email Provided`,
             full_name: profile.full_name || null,
             class: profile.class || 'N/A',
             board: profile.board || 'N/A',
             aspiration: profile.aspiration || profile.board || 'Not Set',
             batch: profile.batch || 'Unassigned',
             total_tests: studentResults.length,
             test_history: studentResults,
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
        setStudents(studentsWithSwot);
      } else {
        // Fallback: no tests taken yet, fetch all students
        const { data: profilesData } = await supabase.from('profiles').select('*').eq('role', 'student');
        if (profilesData && profilesData.length > 0) {
          setStudents(profilesData.map(p => ({
             id: p.id,
             email: p.email || `No Email Provided`,
             full_name: p.full_name || null,
             class: p.class || 'N/A',
             board: p.board || 'N/A',
             aspiration: p.aspiration || p.board || 'Not Set',
             batch: p.batch || 'Unassigned',
             total_tests: 0,
             test_history: [],
             full_swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
             strengths: [],
             weaknesses: []
          })));
        } else {
          setStudents([]);
        }
      }
      setLoading(false);
    };
    fetchStudentsAndSwot();
  }, []);

  const uniqueBatches = Array.from(new Set(students.map(s => s.batch).filter(b => b && b !== 'Unassigned')));
  const filteredStudents = selectedBatch === "All Batches" ? students : students.filter(s => s.batch === selectedBatch);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2"><Users className="w-5 h-5 text-orange-500" /> Student Roster & Analytics</h3>
          
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-orange-500 transition-all cursor-pointer shadow-inner min-w-[200px]"
          >
            <option value="All Batches">All Batches</option>
            {uniqueBatches.map(b => (
              <option key={String(b)} value={String(b)}>{String(b)}</option>
            ))}
          </select>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex justify-center p-12 text-white/50">No students found in the selected batch.</div>
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
                    <tr key={s.id} onClick={() => setSelectedStudent(s)} className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
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
                  onClick={() => setSelectedStudent(s)}
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
                    onClick={(e) => { e.stopPropagation(); setSelectedStudent(s); }}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 p-5 md:p-8">
            <button 
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 md:top-6 md:right-6 p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-2xl font-bold text-white mb-1">Student Report Card</h2>
            <div className="flex flex-col gap-1 mb-6">
              <p className="text-cyan-400 font-medium text-lg">{selectedStudent.full_name || selectedStudent.email}</p>
              <div className="flex items-center flex-wrap gap-2 text-xs md:text-sm text-white/50 mt-1">
                <span className="font-mono bg-white/5 px-2 py-0.5 rounded break-all">ID: {selectedStudent.id}</span>
                <span className="hidden sm:inline">•</span>
                <span className="bg-white/5 px-2 py-0.5 rounded">Class {selectedStudent.class}</span>
                <span className="hidden sm:inline">•</span>
                <span className="text-orange-400 font-bold bg-orange-500/10 px-2 py-0.5 rounded">{selectedStudent.aspiration}</span>
                <span className="hidden sm:inline">•</span>
                <span className="text-green-400 font-medium bg-green-500/10 px-2 py-0.5 rounded">{selectedStudent.batch}</span>
              </div>
            </div>

            <h3 className="text-lg font-bold mb-4 text-white/90 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-400" /> Performance SWOT Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h4 className="text-green-400 font-bold mb-3">Strengths (S)</h4>
                <ul className="text-sm text-white/70 space-y-1">
                  {selectedStudent.full_swot.strengths.length > 0 ? selectedStudent.full_swot.strengths.map((x: string, i: number) => <li key={i}>• {x}</li>) : <li>Keep practicing to build strengths.</li>}
                </ul>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h4 className="text-red-400 font-bold mb-3">Weaknesses (W)</h4>
                <ul className="text-sm text-white/70 space-y-1">
                  {selectedStudent.full_swot.weaknesses.length > 0 ? selectedStudent.full_swot.weaknesses.map((x: string, i: number) => <li key={i}>• {x}</li>) : <li>No major weaknesses.</li>}
                </ul>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h4 className="text-blue-400 font-bold mb-3">Opportunities (O)</h4>
                <ul className="text-sm text-white/70 space-y-1">
                  {selectedStudent.full_swot.opportunities.map((x: string, i: number) => <li key={i}>• {x}</li>)}
                </ul>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h4 className="text-orange-400 font-bold mb-3">Threats (T)</h4>
                <ul className="text-sm text-white/70 space-y-1">
                  {selectedStudent.full_swot.threats.map((x: string, i: number) => <li key={i}>• {x}</li>)}
                </ul>
              </div>
            </div>

            <h3 className="text-lg font-bold mb-4 text-white/90 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" /> Test History
            </h3>
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden overflow-x-auto">
               <table className="w-full text-left text-sm min-w-[500px]">
                 <thead className="bg-white/5 border-b border-white/10 text-white/50">
                   <tr>
                     <th className="p-3 font-medium">Test Title</th>
                     <th className="p-3 font-medium text-center">Score</th>
                     <th className="p-3 font-medium text-center">Correct/Total</th>
                     <th className="p-3 font-medium text-right">Date</th>
                   </tr>
                 </thead>
                 <tbody>
                   {selectedStudent.test_history.map((test: any) => (
                     <tr key={test.id} className="border-b border-white/5 hover:bg-white/5">
                       <td className="p-3 text-white/80">{test.title || test.exam_type}</td>
                       <td className="p-3 text-center font-bold text-cyan-400">{test.score}</td>
                       <td className="p-3 text-center text-white/50">{test.correct_count} / {test.total_questions}</td>
                       <td className="p-3 text-right text-white/50">{new Date(test.created_at).toLocaleDateString()}</td>
                     </tr>
                   ))}
                   {selectedStudent.test_history.length === 0 && (
                     <tr><td colSpan={4} className="p-4 text-center text-white/30">No tests taken yet.</td></tr>
                   )}
                 </tbody>
               </table>
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
