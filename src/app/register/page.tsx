"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, AlertCircle, Loader2, ArrowLeft, User, BookOpen } from "lucide-react";
import Link from "next/link";

const registerSchema = z
  .object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") === "admin" ? "admin" : "student";
  
  const [role, setRole] = useState<"student" | "admin">(defaultRole);
  const [academicClass, setAcademicClass] = useState<"11" | "12">("12"); // Default to 12
  
  const supabase = createClient();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setGlobalError(null);

    const allowedAdminEmails = ["sumitsill2605@gmail.com", "sg.swapnanil.72@gmail.com"];
    
    if (role === "admin" && !allowedAdminEmails.includes(data.email.toLowerCase().trim())) {
      setGlobalError("Access Denied: Your email is not authorized for Admin access.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          role: role,
          class: role === "student" ? academicClass : null,
        }
      },
    });

    if (error) {
      setGlobalError(error.message);
    } else {
      router.push("/verify-email");
    }
  };

  return (
    <div className="w-full max-w-md z-10 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center mb-6 flex flex-col items-center">
        <h1 className="text-4xl font-bold font-headline tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-orange-400 to-white drop-shadow-md mb-2">
          ACCURACY
        </h1>
        <p className="text-white/50 text-sm font-semibold">Master the Laws of the Universe</p>
      </div>
      
      <div className="glassmorphism rounded-3xl p-8 border border-white/10 relative shadow-2xl backdrop-blur-xl bg-dark/60">
        
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
          {role === "student" ? "Student Sign Up" : "Admin Sign Up"}
        </h2>
        <p className="text-white/50 mb-6 text-sm">Enter your coordinates to initialize.</p>

        {globalError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{globalError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold tracking-widest text-white/50 uppercase ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="email"
                placeholder={role === "student" ? "student@accuracy.com" : "admin@accuracy.com"}
                {...register("email")}
                className={`w-full bg-dark/60 border ${errors.email ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-orange-500 transition-all`}
              />
            </div>
            {errors.email && <p className="text-red-400 text-xs ml-1 mt-1">{errors.email.message}</p>}
          </div>
          
          {/* Academic Class (Only for Students) */}
          {role === "student" && (
            <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-bold tracking-widest text-white/50 uppercase ml-1">Academic Class</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setAcademicClass("11")}
                  className={`flex-1 py-3 rounded-xl border font-bold transition-all ${
                    academicClass === "11" 
                      ? "bg-secondary/10 border-secondary text-secondary shadow-[0_0_10px_rgba(0,242,255,0.2)]" 
                      : "bg-dark/50 border-white/10 text-white/50 hover:bg-white/5"
                  }`}
                >
                  Class 11
                </button>
                <button
                  type="button"
                  onClick={() => setAcademicClass("12")}
                  className={`flex-1 py-3 rounded-xl border font-bold transition-all ${
                    academicClass === "12" 
                      ? "bg-secondary/10 border-secondary text-secondary shadow-[0_0_10px_rgba(0,242,255,0.2)]" 
                      : "bg-dark/50 border-white/10 text-white/50 hover:bg-white/5"
                  }`}
                >
                  Class 12
                </button>
              </div>
            </div>
          )}

          {/* Password */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold tracking-widest text-white/50 uppercase ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="password"
                placeholder="••••••••"
                {...register("password")}
                className={`w-full bg-dark/60 border ${errors.password ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-orange-500 transition-all`}
              />
            </div>
            {errors.password && <p className="text-red-400 text-xs ml-1 mt-1">{errors.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold tracking-widest text-white/50 uppercase ml-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                className={`w-full bg-dark/60 border ${errors.confirmPassword ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-orange-500 transition-all`}
              />
            </div>
            {errors.confirmPassword && <p className="text-red-400 text-xs ml-1 mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-6 py-4 bg-[#1a2332] border border-orange-500 rounded-lg text-orange-500 font-bold hover:bg-[#1a2332]/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
            ) : (
              "Initialize New Account"
            )}
          </button>
          
          <div className="mt-6 text-center">
            <Link href={`/login?role=${role}`} className="inline-flex items-center gap-2 text-white/50 hover:text-white text-xs uppercase tracking-widest font-bold transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Register() {
  return (
    <main 
      className="flex min-h-screen flex-col items-center justify-center p-6 text-neutral font-body relative bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: "url('/physics-bg.jpg.png')" }}
    >
      <div className="absolute inset-0 bg-primary/80 backdrop-blur-[3px] -z-20" />
      <Suspense fallback={<div className="text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}
