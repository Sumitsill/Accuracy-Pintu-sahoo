import React from "react";
import Link from "next/link";
import { MailCheck, ArrowRight } from "lucide-react";

export default function VerifyEmail() {
  return (
    <main 
      className="flex min-h-screen flex-col items-center justify-center p-6 text-neutral font-body relative bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: "url('/physics-bg.jpg.png')" }}
    >
      <div className="absolute inset-0 bg-primary/80 backdrop-blur-[5px] -z-20" />
      
      <div className="w-full max-w-md z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="glassmorphism rounded-3xl p-10 border border-white/10 text-center relative shadow-2xl backdrop-blur-xl bg-dark/60 flex flex-col items-center">
          <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-6 border border-orange-500/30">
            <MailCheck className="w-10 h-10 text-orange-500" />
          </div>
          
          <h1 className="text-2xl font-bold mb-4 text-white">Account Initialized</h1>
          
          <p className="text-white/60 mb-8 leading-relaxed">
            Please check your inbox to verify your email address before logging in.
            If you don't see it, be sure to check your spam folder.
          </p>

          <Link 
            href="/login"
            className="w-full py-4 bg-[#1a2332] border border-orange-500 rounded-lg text-orange-500 font-bold hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-2 group"
          >
            Return to Login
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </main>
  );
}
