"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Lock, Rocket, Loader2, AlertOctagon, Atom, Home, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ResetPassword() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Quick check: make sure the user actually has an active session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Invalid or expired session. Please request a new password reset link.");
      }
    };
    checkSession();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      // Auto redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    }
  };

  return (
    <main 
      className="flex min-h-screen flex-col items-center justify-center p-6 text-neutral font-body relative bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: "url('/physics-bg.jpg.png')" }}
    >
      <div className="absolute inset-0 bg-primary/80 backdrop-blur-[3px] -z-20" />
      
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px] -z-10 pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-tertiary/20 rounded-full blur-[120px] -z-10 pointer-events-none mix-blend-screen" />
      
      {/* Home Button */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-dark/40 hover:bg-dark/80 border border-white/10 hover:border-secondary/50 rounded-xl text-white/70 hover:text-white transition-all shadow-lg backdrop-blur-md group"
      >
        <Home className="w-4 h-4 group-hover:text-secondary transition-colors" />
        <span className="text-sm font-bold tracking-wide">Home</span>
      </Link>
      
      {mounted && (
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
          <Atom className="absolute top-[15%] left-[10%] w-24 h-24 text-secondary/20 animate-[spin_20s_linear_infinite]" />
          <OrbitIcon className="absolute top-[25%] right-[12%] w-32 h-32 text-white/10 animate-[spin_30s_linear_infinite]" />
        </div>
      )}
      
      <div className="w-full max-w-md z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="inline-flex items-center justify-center p-4 bg-white/5 rounded-full mb-4 border border-white/10 shadow-[0_0_30px_rgba(0,242,255,0.2)]">
            <Atom className="w-10 h-10 text-secondary animate-[spin_10s_linear_infinite]" />
          </div>
          <h1 className="text-4xl font-bold font-headline tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-secondary to-white drop-shadow-md mb-2">
            ACCURACY
          </h1>
          <p className="text-secondary/80 font-medium tracking-widest text-xs uppercase flex items-center gap-2">
            <span className="w-8 h-px bg-secondary/50"></span>
            By Pintu Sahoo
            <span className="w-8 h-px bg-secondary/50"></span>
          </p>
        </div>

        <div className="glassmorphism rounded-3xl p-6 sm:p-8 border border-white/10 relative overflow-hidden shadow-2xl backdrop-blur-xl bg-dark/40">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-tertiary/10 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="relative z-10 font-headline">
            {success ? (
              <div className="text-center py-6 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-500">
                <div className="p-4 bg-emerald-500/20 rounded-full border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-white">Password Updated!</h2>
                <p className="text-emerald-200/80 text-sm max-w-xs">
                  Your credentials have been successfully updated. Redirecting you to your control center...
                </p>
                <Loader2 className="w-6 h-6 text-secondary animate-spin mt-4" />
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-1 text-white">Set New Password</h2>
                <p className="text-white/50 mb-8 text-sm">Update your access key to restore security.</p>

                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm backdrop-blur-sm flex gap-2 items-start">
                    <AlertOctagon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-widest text-white/50 uppercase font-label ml-1">New Password</label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-secondary to-tertiary rounded-xl blur-[2px] opacity-0 group-focus-within:opacity-50 transition-opacity" />
                      <div className="relative flex items-center">
                        <Lock className="absolute left-4 w-5 h-5 text-white/40 group-focus-within:text-secondary transition-colors" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-dark/60 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-secondary/50 focus:bg-dark/80 transition-all shadow-inner"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-widest text-white/50 uppercase font-label ml-1">Confirm Password</label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-tertiary to-secondary rounded-xl blur-[2px] opacity-0 group-focus-within:opacity-50 transition-opacity" />
                      <div className="relative flex items-center">
                        <Lock className="absolute left-4 w-5 h-5 text-white/40 group-focus-within:text-secondary transition-colors" />
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-dark/60 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-secondary/50 focus:bg-dark/80 transition-all shadow-inner"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || error !== null}
                    className="w-full mt-8 py-4 rounded-xl bg-gradient-to-r from-secondary to-blue-500 text-primary font-bold text-lg hover:opacity-90 transition-all shadow-[0_0_20px_rgba(0,242,255,0.4)] hover:shadow-[0_0_30px_rgba(0,242,255,0.6)] hover:-translate-y-0.5 relative overflow-hidden group/btn disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Calibrating...</> : (
                        <>
                          Update Password <Rocket className="w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                        </>
                      )}
                    </span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function OrbitIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M3 16a9 9 0 0 1 18-8" />
      <path d="M21 8a9 9 0 0 1-18 8" />
    </svg>
  );
}
