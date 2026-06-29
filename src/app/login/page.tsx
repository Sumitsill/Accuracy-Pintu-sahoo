"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Rocket, AlertOctagon, Atom, Magnet, Orbit, Globe, Zap, Loader2, User, BookOpen, Home } from "lucide-react";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") === "admin" ? "admin" : "student";
  
  const [role, setRole] = useState<"student" | "admin">(defaultRole);
  const supabase = createClient();
  
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [unverifiedAlert, setUnverifiedAlert] = useState(false);
  const [view, setView] = useState<"login" | "forgot">("login");
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setGlobalError(null);
    setUnverifiedAlert(false);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      if (error.message.includes("Email not confirmed")) {
        setUnverifiedAlert(true);
      } else {
        setGlobalError(error.message);
      }
      await supabase.auth.signOut();
      return;
    }

    router.refresh();
    router.replace("/dashboard");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    
    setResetLoading(true);
    setResetStatus(null);
    
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    setResetLoading(false);
    if (error) {
      setResetStatus({ type: "error", message: error.message });
    } else {
      setResetStatus({
        type: "success",
        message: "A password reset link has been sent to your email address.",
      });
      setResetEmail("");
    }
  };

  return (
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
        <p className="text-white/50 text-sm mt-3 font-semibold">Master the Laws of the Universe</p>
      </div>
      
      {unverifiedAlert && view === "login" && (
        <div className="mb-6 p-5 bg-red-900/40 border border-red-500/50 rounded-2xl flex flex-col items-center text-center gap-3 shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-in slide-in-from-top-4 backdrop-blur-md">
          <div className="p-3 bg-red-500/20 rounded-full">
            <AlertOctagon className="w-8 h-8 text-red-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-400 mb-1">Verification Required</h3>
            <p className="text-red-200/70 text-sm">
              Verification pending. Please check your email and click the verification link before logging in.
            </p>
          </div>
        </div>
      )}

      <div className="glassmorphism rounded-3xl p-6 sm:p-8 border border-white/10 relative overflow-hidden shadow-2xl backdrop-blur-xl bg-dark/40">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-tertiary/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10">
          
          {view === "login" ? (
            <>
              {/* Role Selector Tabs */}
              <div className="flex p-1 bg-dark/50 rounded-xl mb-6 border border-white/5">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    role === "student" 
                      ? "bg-secondary/20 text-secondary border border-secondary/30 shadow-[0_0_10px_rgba(0,242,255,0.2)]" 
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  <User className="w-4 h-4" /> Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    role === "admin" 
                      ? "bg-tertiary/20 text-tertiary border border-tertiary/30 shadow-[0_0_10px_rgba(255,138,0,0.2)]" 
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  <BookOpen className="w-4 h-4" /> Admin
                </button>
              </div>

              <h2 className="text-2xl font-bold mb-1 text-white">
                {role === "student" ? "Student Portal" : "Admin Portal"}
              </h2>
              <p className="text-white/50 mb-8 text-sm">Enter your coordinates to begin.</p>

              {globalError && !unverifiedAlert && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm backdrop-blur-sm">
                  <p>{globalError}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold tracking-widest text-white/50 uppercase font-label ml-1">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-secondary to-tertiary rounded-xl blur-[2px] opacity-0 group-focus-within:opacity-50 transition-opacity" />
                    <div className="relative flex items-center">
                      <Mail className="absolute left-4 w-5 h-5 text-white/40 group-focus-within:text-secondary transition-colors" />
                      <input
                        type="email"
                        {...register("email")}
                        placeholder={role === "student" ? "student@academy.com" : "admin@academy.com"}
                        className={`w-full bg-dark/60 border ${errors.email ? 'border-red-500' : 'border-white/10'} rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-secondary/50 focus:bg-dark/80 transition-all shadow-inner`}
                      />
                    </div>
                  </div>
                  {errors.email && <p className="text-red-400 text-xs ml-1 mt-1">{errors.email.message}</p>}
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-bold tracking-widest text-white/50 uppercase font-label">Password</label>
                    <button
                      type="button"
                      onClick={() => setView("forgot")}
                      className="text-[10px] font-bold tracking-wider text-secondary/80 hover:text-secondary transition-colors uppercase"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-tertiary to-secondary rounded-xl blur-[2px] opacity-0 group-focus-within:opacity-50 transition-opacity" />
                    <div className="relative flex items-center">
                      <Lock className="absolute left-4 w-5 h-5 text-white/40 group-focus-within:text-secondary transition-colors" />
                      <input
                        type="password"
                        {...register("password")}
                        placeholder="••••••••"
                        className={`w-full bg-dark/60 border ${errors.password ? 'border-red-500' : 'border-white/10'} rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-secondary/50 focus:bg-dark/80 transition-all shadow-inner`}
                      />
                    </div>
                  </div>
                  {errors.password && <p className="text-red-400 text-xs ml-1 mt-1">{errors.password.message}</p>}
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-8 py-4 rounded-xl bg-gradient-to-r from-secondary to-blue-500 text-primary font-bold text-lg hover:opacity-90 transition-all shadow-[0_0_20px_rgba(0,242,255,0.4)] hover:shadow-[0_0_30px_rgba(0,242,255,0.6)] hover:-translate-y-0.5 relative overflow-hidden group/btn disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Authenticating...</> : (
                      <>
                        Login to Terminal <Rocket className="w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                      </>
                    )}
                  </span>
                </button>
                
                <div className="relative flex items-center py-5">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink-0 mx-4 text-white/30 text-[10px] uppercase tracking-widest font-bold">New {role}?</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>
                
                <Link
                  href={`/register?role=${role}`}
                  className="w-full py-3.5 rounded-xl bg-dark/30 border border-tertiary/40 text-tertiary font-bold hover:bg-tertiary/10 hover:border-tertiary hover:shadow-[0_0_15px_rgba(255,138,0,0.2)] transition-all flex items-center justify-center gap-2 group/init"
                >
                  <Orbit className="w-5 h-5 group-hover/init:rotate-180 transition-transform duration-700" /> Sign Up / Initialize
                </Link>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-1 text-white">Reset Password</h2>
              <p className="text-white/50 mb-6 text-sm">Enter your registered email to receive a recovery link.</p>

              {resetStatus && (
                <div className={`mb-6 p-4 rounded-xl text-sm backdrop-blur-sm border ${
                  resetStatus.type === "success" 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}>
                  <p>{resetStatus.message}</p>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold tracking-widest text-white/50 uppercase font-label ml-1">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-secondary to-tertiary rounded-xl blur-[2px] opacity-0 group-focus-within:opacity-50 transition-opacity" />
                    <div className="relative flex items-center">
                      <Mail className="absolute left-4 w-5 h-5 text-white/40 group-focus-within:text-secondary transition-colors" />
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="your-email@example.com"
                        className="w-full bg-dark/60 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-secondary/50 focus:bg-dark/80 transition-all shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-secondary to-blue-500 text-primary font-bold text-lg hover:opacity-90 transition-all shadow-[0_0_20px_rgba(0,242,255,0.4)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  <span className="flex items-center justify-center gap-2">
                    {resetLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Dispatching...</> : "Send Recovery Link"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setView("login");
                    setResetStatus(null);
                  }}
                  className="w-full py-3 rounded-xl bg-dark/30 border border-white/10 text-white/70 font-bold hover:bg-white/10 hover:border-white/20 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  Back to Login
                </button>
              </form>
            </>
          )}
          
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-dark/40 hover:bg-dark/80 border border-white/10 hover:border-secondary/50 rounded-xl text-white/70 hover:text-white transition-all shadow-lg backdrop-blur-md group animate-in fade-in slide-in-from-top-4 duration-500"
      >
        <Home className="w-4 h-4 group-hover:text-secondary transition-colors" />
        <span className="text-sm font-bold tracking-wide">Home</span>
      </Link>
      
      {mounted && (
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
          <Atom className="absolute top-[15%] left-[10%] w-24 h-24 text-secondary/20 animate-[spin_20s_linear_infinite]" />
          <Magnet className="absolute bottom-[20%] left-[15%] w-16 h-16 text-tertiary/20 animate-bounce" style={{ animationDuration: '4s' }} />
          <Orbit className="absolute top-[25%] right-[12%] w-32 h-32 text-white/10 animate-[spin_30s_linear_infinite]" />
          <Globe className="absolute bottom-[15%] right-[20%] w-20 h-20 text-secondary/20" />
          <Zap className="absolute top-[40%] left-[5%] w-12 h-12 text-tertiary/30 animate-pulse" />
        </div>
      )}
      
      <Suspense fallback={<div className="text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
