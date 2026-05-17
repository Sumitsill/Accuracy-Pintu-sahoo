"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, ArrowRight, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function VerifySuccess() {
  const [mounted, setMounted] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserEmail(data.user.email ?? null);
      }
    };
    getUser();
  }, []);

  return (
    <main 
      className="flex min-h-screen flex-col items-center justify-center p-6 text-neutral font-body relative bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: "url('/physics-bg.jpg.png')" }}
    >
      <div className="absolute inset-0 bg-primary/90 backdrop-blur-md -z-20" />
      
      <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-green-500/20 rounded-full blur-[100px] -z-10 pointer-events-none mix-blend-screen" />
      
      {mounted && (
        <div className="w-full max-w-md z-10 animate-in fade-in zoom-in-95 duration-700">
          <div className="glassmorphism rounded-3xl p-10 border border-green-500/30 relative shadow-[0_0_50px_rgba(34,197,94,0.15)] backdrop-blur-xl bg-dark/60 text-center flex flex-col items-center">
            
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-20 animate-pulse" />
              <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center relative z-10">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
              <Sparkles className="w-6 h-6 text-green-300 absolute -top-2 -right-2 animate-bounce" />
            </div>

            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-green-500 mb-3 tracking-tight">
              Verification Complete
            </h1>
            
            <p className="text-white/70 mb-8 leading-relaxed">
              Your email address <strong className="text-white">{userEmail || "has been"}</strong> successfully verified. Your account is now fully active and ready to explore the universe of physics.
            </p>

            <Link 
              href="/dashboard"
              className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-slate-950 font-bold text-lg hover:opacity-90 transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
            >
              Continue to Dashboard <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link href="/login" className="mt-6 text-sm font-bold text-white/40 hover:text-white transition-colors underline decoration-white/20 underline-offset-4">
              Return to Login Screen
            </Link>
          </div>
        </div>
      )}
      
      {!mounted && (
        <div className="text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>
      )}
    </main>
  );
}
