"use client";

import React, { useState, useEffect } from "react";
import { GraduationCap, User, BookOpen, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Onboarding() {
  const [role, setRole] = useState<"student" | "admin">("student");
  const [academicClass, setAcademicClass] = useState("12");
  const [board, setBoard] = useState("CBSE");
  const [aspiration, setAspiration] = useState("JEE");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
        
        // Check if already initialized to prevent bypassing
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_initialized, role")
          .eq("id", user.id)
          .single();
          
        if (profile?.is_initialized) {
          router.push(profile.role === "admin" ? "/admin" : "/dashboard");
        } else {
          setInitializing(false);
        }
      }
    };
    fetchUser();
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError(null);

    // Update the profile record
    const { error: updateError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id, // Primary key
        email: user.email,
        role: role,
        class: role === "student" ? academicClass : null,
        board: role === "student" ? board : null,
        aspiration: role === "student" ? aspiration : null,
        is_initialized: true,
        updated_at: new Date().toISOString(),
      });

    if (updateError) {
      console.error("Update error:", updateError);
      setError("Failed to initialize profile. Please ensure the 'profiles' table exists and has proper permissions.");
      setLoading(false);
      return;
    }

    // Also optionally update auth user metadata
    await supabase.auth.updateUser({
      data: {
        role,
        class: academicClass,
        board,
        aspiration,
      }
    });

    router.refresh(); // Refresh to trigger middleware
    router.push(role === "admin" ? "/admin" : "/dashboard");
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary text-secondary">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-primary text-neutral font-body relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-tertiary/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-headline tracking-tight mb-2">Almost There</h1>
          <p className="text-white/60">Let's initialize your profile to customize your experience.</p>
        </div>

        <div className="glassmorphism rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {/* Role Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold tracking-widest text-white/50 uppercase font-label">Account Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all duration-300 ${
                    role === "student" 
                      ? "bg-secondary/10 border-secondary text-secondary shadow-[0_0_15px_rgba(0,242,255,0.2)]" 
                      : "bg-dark/50 border-white/10 text-white/50 hover:bg-white/5 hover:border-white/20"
                  }`}
                >
                  <User className="w-6 h-6" />
                  <span className="font-bold text-sm">Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all duration-300 ${
                    role === "admin" 
                      ? "bg-secondary/10 border-secondary text-secondary shadow-[0_0_15px_rgba(0,242,255,0.2)]" 
                      : "bg-dark/50 border-white/10 text-white/50 hover:bg-white/5 hover:border-white/20"
                  }`}
                >
                  <BookOpen className="w-6 h-6" />
                  <span className="font-bold text-sm">Admin/Teacher</span>
                </button>
              </div>
            </div>

            {/* Student Specific Fields */}
            {role === "student" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold tracking-widest text-white/50 uppercase font-label">Academic Class</label>
                  <div className="flex gap-3">
                    {["11", "12"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAcademicClass(c)}
                        className={`flex-1 py-3 rounded-xl border font-bold transition-all ${
                          academicClass === c 
                            ? "bg-secondary text-primary border-secondary shadow-[0_0_10px_rgba(0,242,255,0.3)]" 
                            : "bg-dark/50 border-white/10 text-white/50 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        Class {c}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold tracking-widest text-white/50 uppercase font-label">Educational Board</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <select
                      value={board}
                      onChange={(e) => setBoard(e.target.value)}
                      className="w-full bg-dark/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white font-medium appearance-none focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 transition-all cursor-pointer"
                    >
                      <option value="CBSE">CBSE (Central Board)</option>
                      <option value="ISC">ISC (Indian School Certificate)</option>
                      <option value="WB">WB Board (State Board)</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 mt-4">
                  <label className="text-xs font-bold tracking-widest text-white/50 uppercase font-label">Target Aspiration</label>
                  <div className="flex gap-3">
                    {["JEE", "NEET", "Boards Only"].map((asp) => (
                      <button
                        key={asp}
                        type="button"
                        onClick={() => setAspiration(asp)}
                        className={`flex-1 py-3 rounded-xl border font-bold transition-all text-sm ${
                          aspiration === asp 
                            ? "bg-orange-500/20 text-orange-400 border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]" 
                            : "bg-dark/50 border-white/10 text-white/50 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {asp}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-8 py-4 rounded-xl bg-gradient-to-r from-secondary to-blue-500 text-primary font-bold text-lg hover:opacity-90 transition-all shadow-[0_0_20px_rgba(0,242,255,0.3)] flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Enter Portal
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
