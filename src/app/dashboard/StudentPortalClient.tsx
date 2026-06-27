"use client";

import React, { useState, useEffect } from "react";
import { 
  Home, FileText, ClipboardList, FileCheck, User, Menu, X,
  Bell, Target, Zap, ArrowRight, Camera, LogOut, ChevronRight, ChevronDown,
  Loader2, Eye, Award
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ProfileData {
  full_name?: string | null;
  class?: string | null;
  board?: string | null;
  role?: string | null;
  school_name?: string | null;
  batch?: string | null;
  aspiration?: string | null;
  phone?: string | null;
}

export default function StudentPortalClient({ user, profile }: { user: any, profile: ProfileData }) {
  const isProfileComplete = Boolean(
    profile?.full_name && 
    profile?.class && 
    profile?.school_name && 
    profile?.batch && 
    profile?.aspiration && 
    profile?.phone
  );

  const [activeTab, setActiveTab] = useState(isProfileComplete ? "dashboard" : "profile");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("read_notification_ids");
    if (stored) {
      setReadNotificationIds(JSON.parse(stored));
    }

    const allowedBatches = ['All Students'];
    if (profile?.class === '11') allowedBatches.push('Class 11');
    if (profile?.class === '12' || profile?.class === 'Dropper') allowedBatches.push('Class 12');
    if (profile?.aspiration === 'JEE') allowedBatches.push('IIT JEE Batch');
    if (profile?.aspiration === 'NEET') allowedBatches.push('NEET Batch');
    if (profile?.batch) allowedBatches.push(profile.batch);

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('recipient_role', 'student')
          .order('created_at', { ascending: false })
          .limit(50);

        if (data && !error) {
          const filtered = data.filter((n: any) => allowedBatches.includes(n.target_batch));
          setNotifications(filtered);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    fetchNotifications();

    const channel = supabase
      .channel('realtime-notifications-student')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'recipient_role=eq.student' },
        (payload: any) => {
          const newNotif = payload.new;
          if (allowedBatches.includes(newNotif.target_batch)) {
            setNotifications(prev => [newNotif, ...prev].slice(0, 50));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    const updated = Array.from(new Set([...readNotificationIds, ...allIds]));
    setReadNotificationIds(updated);
    localStorage.setItem("read_notification_ids", JSON.stringify(updated));
  };

  const toggleRead = (id: string) => {
    let updated;
    if (readNotificationIds.includes(id)) {
      updated = readNotificationIds.filter(x => x !== id);
    } else {
      updated = [...readNotificationIds, id];
    }
    setReadNotificationIds(updated);
    localStorage.setItem("read_notification_ids", JSON.stringify(updated));
  };

  const unreadCount = notifications.filter(n => !readNotificationIds.includes(n.id)).length;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const emailPrefix = user?.email?.split("@")[0] || "Student";
  const displayName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}&backgroundColor=0A192F`;

  const NavItem = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => {
    const isActive = activeTab === id;
    const isDisabled = !isProfileComplete && id !== "profile";

    return (
      <button
        onClick={() => { 
          if (isDisabled) {
            alert("Please complete your profile details first to unlock all features.");
            return;
          }
          setActiveTab(id); 
          setIsMobileMenuOpen(false); 
        }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative group overflow-hidden ${
          isActive 
            ? "bg-white/10 text-white" 
            : isDisabled
              ? "text-white/20 cursor-not-allowed"
              : "text-white/50 hover:bg-white/5 hover:text-white/80"
        }`}
      >
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
        )}
        <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? "text-cyan-400" : ""}`} />
        <span className="font-semibold text-sm">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-[100dvh] relative bg-slate-950 text-slate-50 font-body overflow-hidden">
      
      {/* Background Quantum Accents */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

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
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_15px_rgba(34,211,238,0.5)] flex items-center justify-center">
              <Zap className="w-4 h-4 text-slate-950" />
            </div>
            <h1 className="text-xl font-bold tracking-widest uppercase text-white">Accuracy</h1>
          </div>
          <button className="md:hidden text-white/50 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavItem id="dashboard" icon={Home} label="Dashboard" />
          <NavItem id="note" icon={FileText} label="My Notes" />
          <NavItem id="dpp" icon={ClipboardList} label="Daily Practice" />
          <NavItem id="test" icon={Target} label="Test Center" />
          <NavItem id="results" icon={Award} label="Test Results" />
          <NavItem id="profile" icon={User} label="Profile" />
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
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center justify-center"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[8px] font-black bg-cyan-500 text-slate-950 rounded-full leading-none flex items-center justify-center min-w-[15px] h-[15px]">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
                    <span className="text-sm font-bold text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-white/5 scrollbar-thin">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-white/40 text-center py-8">No notifications yet.</p>
                    ) : (
                      notifications.map(n => {
                        const isRead = readNotificationIds.includes(n.id);
                        return (
                          <div 
                            key={n.id} 
                            onClick={() => toggleRead(n.id)}
                            className={`p-4 hover:bg-white/5 transition-colors cursor-pointer text-left relative ${!isRead ? 'bg-cyan-500/[0.03]' : ''}`}
                          >
                            {!isRead && (
                              <div className="absolute top-4 left-2 w-1.5 h-1.5 rounded-full bg-cyan-500" />
                            )}
                            <div className="pl-2.5 space-y-1">
                              <p className={`text-xs font-bold leading-tight ${!isRead ? 'text-cyan-400' : 'text-white'}`}>{n.title}</p>
                              <p className="text-[11px] text-white/60 leading-normal">{n.message}</p>
                              <span className="text-[9px] text-white/30 font-mono block mt-1">
                                {new Date(n.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Avatar Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 hover:bg-white/5 p-1.5 rounded-full transition-colors"
              >
                <img src={avatarUrl} alt="Avatar" className="w-9 h-9 rounded-full bg-slate-900 border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]" />
                <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-white/5 mb-1">
                    <p className="text-sm font-bold text-white truncate">{displayName}</p>
                    <p className="text-xs text-cyan-400 truncate">{user?.email}</p>
                  </div>
                  <button 
                    onClick={() => { setActiveTab("profile"); setDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white flex items-center gap-2"
                  >
                    <User className="w-4 h-4" /> View Profile
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 pb-24 md:pb-8 max-w-6xl mx-auto w-full">
          {activeTab === "dashboard" && <DashboardView displayName={displayName} setActiveTab={setActiveTab} user={user} />}
          {activeTab === "note" && <ResourceView title="My Notes" type="note" profile={profile} icon={FileText} color="text-blue-400" />}
          {activeTab === "dpp" && <ResourceView title="Daily Practice Problems" type="dpp" profile={profile} icon={ClipboardList} color="text-cyan-400" />}
          {activeTab === "test" && <ResourceView title="Test Center" type="test" profile={profile} icon={Target} color="text-orange-400" />}
          {activeTab === "results" && <ResultsView user={user} />}
          {activeTab === "profile" && <ProfileView email={user?.email} userId={user?.id} profile={profile} avatarUrl={avatarUrl} handleLogout={handleLogout} isProfileComplete={isProfileComplete} />}
        </div>
      </main>
    </div>
  );
}

// -------------------------------------------------------------------
// Resource View (Fetches dynamically from backend)
// -------------------------------------------------------------------
function ResourceView({ title, type, profile, icon: Icon, color }: any) {
  const supabase = createClient();
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      // Determine what batches this student belongs to
      const allowedBatches = ['All Students'];
      if (profile.class === '11') allowedBatches.push('Class 11');
      if (profile.class === '12' || profile.class === 'Dropper') allowedBatches.push('Class 12');
      
      if (profile.aspiration === 'JEE') allowedBatches.push('IIT JEE Batch');
      if (profile.aspiration === 'NEET') allowedBatches.push('NEET Batch');
      
      if (profile.batch) allowedBatches.push(profile.batch);
      
      if (type === 'test') {
        const { data } = await supabase
          .from('tests')
          .select('*')
          .eq('status', 'live')
          .in('target_batch', allowedBatches)
          .order('created_at', { ascending: false });
        // Don't show DPP quizzes in the regular Test Center tab
        if (data) setResources(data.filter((t: any) => t.exam_type !== 'DPP'));
      } else if (type === 'dpp') {
        const { data: tests } = await supabase
          .from('tests')
          .select('*')
          .eq('exam_type', 'DPP')
          .eq('status', 'live')
          .in('target_batch', allowedBatches);
          
        const { data: pdfs } = await supabase
          .from('resources')
          .select('*')
          .eq('type', 'dpp')
          .in('target_batch', allowedBatches);

        // Group by title
        const map = new Map<string, any>();
        
        tests?.forEach(t => {
          const key = t.title.trim().toLowerCase();
          map.set(key, { id: t.id, title: t.title, isMerged: true, quiz: t, pdf: null, created_at: t.created_at });
        });
        
        pdfs?.forEach(p => {
          const key = p.title.trim().toLowerCase();
          if (map.has(key)) {
            map.get(key).pdf = p;
          } else {
            map.set(key, { id: p.id, title: p.title, isMerged: true, quiz: null, pdf: p, created_at: p.created_at });
          }
        });
        
        // Convert to array and sort by created_at
        const merged = Array.from(map.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setResources(merged);
      } else {
        const { data } = await supabase
          .from('resources')
          .select('*')
          .eq('type', type)
          .in('target_batch', allowedBatches)
          .order('created_at', { ascending: false });
        if (data) setResources(data);
      }
      setLoading(false);
    };
    fetchResources();
  }, [type, profile]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 p-5 md:p-6 rounded-3xl border border-white/10 mb-8">
        <div className="flex items-center gap-4">
          <div className={`p-3 bg-white/5 rounded-xl ${color}`}>
            <Icon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">{title}</h3>
            <p className="text-white/50 text-sm">Materials allocated by your faculty.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className={`w-8 h-8 animate-spin ${color}`} /></div>
      ) : resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white/5 border border-dashed border-white/10 rounded-3xl">
          <Icon className="w-12 h-12 text-white/20 mb-4" />
          <p className="text-white/50">No {title.toLowerCase()} have been allocated to you yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((res) => (
            <div key={res.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 hover:border-cyan-500/30 transition-all group relative flex flex-col justify-between">
              <div>
                <span className="px-2.5 py-1 rounded-md bg-white/10 text-white/70 text-[10px] font-bold uppercase tracking-wider mb-4 inline-block">
                  {res.isMerged ? 'DPP Module' : (res.duration !== undefined ? `${res.exam_type} • ${res.duration} Mins` : `${res.subject} • ${res.topic}`)}
                </span>
                
                <h4 className="text-lg font-bold text-white mb-6">{res.title}</h4>
              </div>

              {res.isMerged ? (
                <div className="flex flex-col gap-2 mt-auto">
                  {res.quiz && (
                    <Link 
                      href={`/exam-hall?testId=${res.quiz.id}`}
                      className="w-full py-3 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-colors font-bold text-sm flex items-center justify-center gap-2 group-hover:border-cyan-500/50 group-hover:text-cyan-400 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                    >
                      <Target className="w-4 h-4" /> Attempt Quiz
                    </Link>
                  )}
                  {res.pdf && (
                    <a 
                      href={res.pdf.link}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-colors font-bold text-sm flex items-center justify-center gap-2 group-hover:border-cyan-500/50 group-hover:text-cyan-400 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                    >
                      <Eye className="w-4 h-4" /> Download DPP PDF
                    </a>
                  )}
                </div>
              ) : res.duration !== undefined ? (
                <Link 
                  href={`/exam-hall?testId=${res.id}`}
                  className={`w-full py-3 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-colors font-bold text-sm flex items-center justify-center gap-2 group-hover:border-cyan-500/50 group-hover:text-cyan-400 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]`}
                >
                  <Target className="w-4 h-4" /> Attempt
                </Link>
              ) : (
                <a 
                  href={res.link}
                  target="_blank"
                  rel="noreferrer"
                  className={`w-full py-3 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-colors font-bold text-sm flex items-center justify-center gap-2 group-hover:border-cyan-500/50 group-hover:text-cyan-400 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]`}
                >
                  <Eye className="w-4 h-4" /> View PDF
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------------
// Dashboard View Sub-component
// -------------------------------------------------------------------
function DashboardView({ displayName, setActiveTab, user }: { displayName: string, setActiveTab: (tab: string) => void, user: any }) {
  const supabase = createClient();
  const [swot, setSwot] = useState<any>(null);

  useEffect(() => {
    const fetchSWOT = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase.from('test_results').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      
      if (data && data.length > 0) {
        let strengths: string[] = [];
        let weaknesses: string[] = [];
        let opportunities: string[] = ["Attempt more Mock Tests", "Review incorrect questions in detail"];
        let threats: string[] = ["Time management on lengthy exams", "Negative marking penalties"];
        
        data.forEach((result: any) => {
           const accuracy = result.total_questions > 0 ? (result.correct_count / result.total_questions) * 100 : 0;
           if (accuracy >= 70) strengths.push(result.title || result.exam_type);
           else if (accuracy <= 40) weaknesses.push(result.title || result.exam_type);
           else opportunities.push(`Improve speed in ${result.title || result.exam_type}`);
        });

        setSwot({
          strengths: Array.from(new Set(strengths)).slice(0, 3),
          weaknesses: Array.from(new Set(weaknesses)).slice(0, 3),
          opportunities: Array.from(new Set(opportunities)).slice(0, 3),
          threats: threats.slice(0, 2)
        });
      }
    };
    fetchSWOT();
  }, [user]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Welcome Hero */}
      <div className="relative p-6 md:p-8 rounded-3xl bg-gradient-to-br from-cyan-950/40 to-blue-900/20 border border-cyan-500/20 overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-[50px] pointer-events-none" />
        <div className="relative z-10">
          <p className="text-cyan-400 font-bold tracking-widest text-xs uppercase mb-2">Current Status: Optimal</p>
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 tracking-tight">Welcome back, {displayName}.</h2>
          <p className="text-white/60 max-w-md">Your quantum physics trajectory is looking excellent. You have 3 tasks pending today.</p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h3 className="text-lg font-bold mb-4 text-white/90 flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyan-400" /> Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <ActionCard 
            title="Solve Today's DPP" 
            desc="Kinematics & Projectile Motion" 
            icon={ClipboardList} 
            color="text-cyan-400" 
            bg="bg-cyan-400/10" 
            border="border-cyan-500/30"
            onClick={() => setActiveTab("dpp")}
          />
          <ActionCard 
            title="Take Pending Test" 
            desc="Mock Test #04 - Full Length" 
            icon={Target} 
            color="text-orange-400" 
            bg="bg-orange-400/10" 
            border="border-orange-500/30"
            onClick={() => setActiveTab("test")}
          />
          <ActionCard 
            title="View Latest Notes" 
            desc="Thermodynamics Part II" 
            icon={FileText} 
            color="text-blue-400" 
            bg="bg-blue-400/10" 
            border="border-blue-500/30"
            onClick={() => setActiveTab("note")}
          />

        </div>
      </div>

      {/* SWOT Analysis Section */}
      {swot && (
        <div className="mt-12">
          <h3 className="text-lg font-bold mb-6 text-white/90 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-400" /> Performance SWOT Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 md:p-6 hover:border-green-500/30 transition-all">
              <h4 className="text-green-400 font-bold mb-4 flex items-center gap-2">Strengths (S)</h4>
              {swot.strengths.length > 0 ? (
                <ul className="space-y-2 text-sm text-white/70">
                  {swot.strengths.map((s: string, i: number) => <li key={i} className="flex items-start gap-2"><span className="text-green-500">•</span> {s} (High Accuracy)</li>)}
                </ul>
              ) : <p className="text-sm text-white/40">Keep practicing to build your strengths.</p>}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 md:p-6 hover:border-red-500/30 transition-all">
              <h4 className="text-red-400 font-bold mb-4 flex items-center gap-2">Weaknesses (W)</h4>
              {swot.weaknesses.length > 0 ? (
                <ul className="space-y-2 text-sm text-white/70">
                  {swot.weaknesses.map((w: string, i: number) => <li key={i} className="flex items-start gap-2"><span className="text-red-500">•</span> {w} (Low Accuracy)</li>)}
                </ul>
              ) : <p className="text-sm text-white/40">No major weaknesses detected yet.</p>}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 md:p-6 hover:border-blue-500/30 transition-all">
              <h4 className="text-blue-400 font-bold mb-4 flex items-center gap-2">Opportunities (O)</h4>
              <ul className="space-y-2 text-sm text-white/70">
                {swot.opportunities.map((o: string, i: number) => <li key={i} className="flex items-start gap-2"><span className="text-blue-500">•</span> {o}</li>)}
              </ul>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 md:p-6 hover:border-orange-500/30 transition-all">
              <h4 className="text-orange-400 font-bold mb-4 flex items-center gap-2">Threats (T)</h4>
              <ul className="space-y-2 text-sm text-white/70">
                {swot.threats.map((t: string, i: number) => <li key={i} className="flex items-start gap-2"><span className="text-orange-500">•</span> {t}</li>)}
              </ul>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

function ActionCard({ title, desc, icon: Icon, color, bg, border, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`group relative p-5 md:p-6 rounded-3xl bg-white/5 border ${border} hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-[0_10px_30px_-10px_rgba(34,211,238,0.2)] cursor-pointer overflow-hidden flex flex-col items-start`}
    >
      <div className={`p-3 md:p-4 rounded-2xl ${bg} ${color} mb-4 md:mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:animate-pulse`}>
        <Icon className="w-6 h-6 md:w-8 md:h-8" />
      </div>
      <h4 className="text-lg md:text-xl font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors">{title}</h4>
      <p className="text-white/50 text-xs md:text-sm font-medium">{desc}</p>
      
      <div className="absolute bottom-5 right-5 md:bottom-6 md:right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
        <ArrowRight className={`w-5 h-5 md:w-6 md:h-6 ${color}`} />
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Profile View Sub-component
// -------------------------------------------------------------------
function ProfileView({ email, userId, profile, avatarUrl, handleLogout, isProfileComplete }: any) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    class: profile?.class || "",
    school_name: profile?.school_name || "",
    batch: profile?.batch || "",
    aspiration: profile?.aspiration || "",
    phone: profile?.phone || ""
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!formData.full_name || !formData.class || !formData.school_name || !formData.batch || !formData.aspiration || !formData.phone) {
      alert("Please fill in all the details.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('profiles').update({
      full_name: formData.full_name,
      class: formData.class,
      school_name: formData.school_name,
      batch: formData.batch,
      aspiration: formData.aspiration,
      phone: formData.phone
    }).eq('id', userId);
    
    setLoading(false);
    if (error) {
      alert("Failed to update profile. " + error.message);
    } else {
      alert("Profile updated successfully! Features are now unlocked.");
      router.refresh();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {!isProfileComplete && (
        <div className="bg-orange-500/10 border border-orange-500/50 text-orange-400 p-4 rounded-xl flex items-start gap-3">
          <Target className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">Please complete all profile details (Name, Class, School, Target, Batch, Phone) below to unlock the dashboard and other features.</p>
        </div>
      )}

      {/* Avatar Section */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative group cursor-pointer">
          <div className="absolute inset-0 bg-cyan-400 rounded-full blur-[20px] opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
          <img 
            src={avatarUrl} 
            alt="Profile Avatar" 
            className="relative w-32 h-32 rounded-full border-4 border-slate-900 bg-slate-800 object-cover shadow-2xl" 
          />
          <button className="absolute bottom-1 right-1 p-2.5 bg-cyan-500 text-slate-950 rounded-full shadow-lg hover:scale-110 transition-transform">
            <Camera className="w-4 h-4 font-bold" />
          </button>
        </div>
      </div>

      {/* Basic Details Card */}
      <div className="p-5 md:p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl space-y-5">
        <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3 mb-5">Profile Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold tracking-widest text-white/50 uppercase ml-1">Full Name *</label>
            <input 
              type="text" 
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="e.g. Rahul Sharma"
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold tracking-widest text-white/50 uppercase ml-1">Email Address</label>
            <input 
              type="email" 
              defaultValue={email}
              readOnly
              className="w-full bg-slate-950 border border-white/5 rounded-xl py-3 px-4 text-white/30 cursor-not-allowed shadow-inner"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold tracking-widest text-white/50 uppercase ml-1">Phone Number *</label>
            <input 
              type="tel" 
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. 9876543210"
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500 transition-all shadow-inner"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold tracking-widest text-white/50 uppercase ml-1">Academic Class *</label>
            <select 
              name="class"
              value={formData.class}
              onChange={handleChange}
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500 transition-all shadow-inner cursor-pointer"
            >
              <option value="">Select Class</option>
              <option value="11">Class 11</option>
              <option value="12">Class 12</option>
              <option value="Dropper">Dropper</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold tracking-widest text-white/50 uppercase ml-1">Target Aspiration *</label>
            <select 
              name="aspiration"
              value={formData.aspiration}
              onChange={handleChange}
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500 transition-all shadow-inner cursor-pointer"
            >
              <option value="">Select Target</option>
              <option value="JEE">JEE Mains & Advanced</option>
              <option value="NEET">NEET UG</option>
              <option value="Boards Only">Boards Only</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold tracking-widest text-white/50 uppercase ml-1">Batch Day & Timing *</label>
            <input 
              type="text" 
              name="batch"
              value={formData.batch}
              onChange={handleChange}
              placeholder="e.g. Mon/Wed/Fri - 5PM"
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500 transition-all shadow-inner"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold tracking-widest text-white/50 uppercase ml-1">School Name *</label>
            <input 
              type="text" 
              name="school_name"
              value={formData.school_name}
              onChange={handleChange}
              placeholder="e.g. Delhi Public School"
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500 transition-all shadow-inner"
            />
          </div>

        </div>
      </div>

      {/* Save Button */}
      <button 
        onClick={handleSave}
        disabled={loading}
        className="w-full py-4 rounded-xl bg-cyan-500 text-slate-950 font-bold text-lg hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)] flex items-center justify-center gap-2 group disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Profile Details"}
        {!loading && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
      </button>

      {/* Destructive Logout Button */}
      <div className="pt-8 border-t border-white/5">
        <button 
          onClick={handleLogout}
          className="w-full py-4 rounded-xl bg-slate-950 border border-red-500/50 text-red-500 font-bold hover:bg-red-500/10 hover:border-red-500 transition-all flex items-center justify-center gap-2 group shadow-[0_0_15px_rgba(239,68,68,0.1)]"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Log Out
        </button>
      </div>

    </div>
  );
}

// -------------------------------------------------------------------
// Test Results & Analysis View
// -------------------------------------------------------------------
function ResultsView({ user }: { user: any }) {
  const supabase = createClient();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('test_results')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (data && !error) {
          const resultsByTest: Record<string, any[]> = {};
          
          // Work on a copy sorted chronologically to assign attempt numbers
          const chronological = [...data].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          
          chronological.forEach((res) => {
            if (!resultsByTest[res.test_id]) {
              resultsByTest[res.test_id] = [];
            }
            resultsByTest[res.test_id].push(res);
            res.attempt_number = resultsByTest[res.test_id].length;
          });

          // Sort back to descending to show latest first
          const sortedResults = [...chronological].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setResults(sortedResults);
        }
      } catch (err) {
        console.error("Failed to load results", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [user]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 p-5 md:p-6 rounded-3xl border border-white/10 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/5 rounded-xl text-cyan-400">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Test Results & Analysis</h3>
            <p className="text-white/50 text-sm">Review your scores, wrong answers, and detailed explanations.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white/5 border border-dashed border-white/10 rounded-3xl">
          <Award className="w-12 h-12 text-white/20 mb-4" />
          <p className="text-white/50">You haven't completed any tests yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {results.map((res) => {
            const skipped = res.total_questions - (res.correct_count + res.incorrect_count);
            const percentage = res.total_questions > 0 
              ? ((res.correct_count / res.total_questions) * 100).toFixed(0) 
              : "0";

            return (
              <div key={res.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-cyan-500/30 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-wider">
                      Attempt {res.attempt_number}
                    </span>
                    <span className="text-xs text-white/40 font-semibold">{new Date(res.created_at).toLocaleDateString()}</span>
                  </div>

                  <h4 className="text-lg font-bold text-white mb-4 group-hover:text-cyan-300 transition-colors leading-snug">{res.title}</h4>

                  <div className="grid grid-cols-3 gap-3 mb-6 bg-slate-950/40 p-4 rounded-2xl border border-white/5 text-center">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-white/40 mb-0.5">Score</span>
                      <span className="text-base font-extrabold text-white">{res.score}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-white/40 mb-0.5">Accuracy</span>
                      <span className="text-base font-extrabold text-green-400">{percentage}%</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-white/40 mb-0.5">Type</span>
                      <span className="text-xs font-bold text-white/60 truncate block mt-0.5">{res.exam_type || "Mock"}</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-white/50 px-1 mb-6">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> {res.correct_count} Correct</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> {res.incorrect_count} Wrong</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white/20" /> {skipped} Skipped</span>
                  </div>
                </div>

                <Link 
                  href={`/exam-hall?testId=${res.test_id}&viewAnalysis=true&attempt=${res.attempt_number}`}
                  className="w-full py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-all text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.25)]"
                >
                  <Eye className="w-4 h-4" /> View Analysis & Solutions
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
