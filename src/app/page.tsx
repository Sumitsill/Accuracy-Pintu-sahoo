"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, FlaskConical, Download, Smartphone, X, Share, Info } from "lucide-react";
import dynamic from "next/dynamic";

const Hyperspeed = dynamic(() => import("@/components/Hyperspeed"), { ssr: false });

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function Home() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const checkStandalone = () => {
      const isMapStandalone = window.matchMedia("(display-mode: standalone)").matches;
      // @ts-ignore
      const isNavStandalone = window.navigator.standalone === true;
      setIsStandalone(isMapStandalone || isNavStandalone);
    };

    // Check if device is iOS
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent;
      const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
      setIsIOS(isIOSDevice);
    };

    checkStandalone();
    checkIOS();

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Trigger the browser's install prompt
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsStandalone(true);
      }
    } else {
      // If prompt not available (iOS or unsupported browser), show instructions
      setShowInstallModal(true);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden bg-transparent text-neutral">
      <div className="fixed inset-0 -z-10 w-full h-full bg-[#0a192f]">
        <Hyperspeed
          effectOptions={{
            distortion: 'turbulentDistortion',
            length: 400,
            roadWidth: 10,
            islandWidth: 2,
            lanesPerRoad: 4,
            fov: 90,
            fovSpeedUp: 150,
            speedUp: 2,
            carLightsFade: 0.4,
            totalSideLightSticks: 20,
            lightPairsPerRoadWay: 40,
            shoulderLinesWidthPercentage: 0.05,
            brokenLinesWidthPercentage: 0.1,
            brokenLinesLengthPercentage: 0.5,
            lightStickWidth: [0.12, 0.5],
            lightStickHeight: [1.3, 1.7],
            movingAwaySpeed: [60, 80],
            movingCloserSpeed: [-120, -160],
            carLightsLength: [12, 80],
            carLightsRadius: [0.05, 0.14],
            carWidthPercentage: [0.3, 0.5],
            carShiftX: [-0.8, 0.8],
            carFloorSeparation: [0, 5],
            colors: {
              roadColor: 0x080808,
              islandColor: 0x0a0a0a,
              background: 0x0a192f,
              shoulderLines: 0xffffff,
              brokenLines: 0xffffff,
              leftCars: [0xff8a00, 0xffa500, 0xff5500],
              rightCars: [0x00f2ff, 0x00aaff, 0xffffff],
              sticks: 0x00f2ff,
            }
          }}
        />
      </div>

      {/* Install App Button in Top Right */}
      {!isStandalone && (
        <button
          onClick={handleInstallClick}
          className="absolute top-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-dark/40 hover:bg-dark/80 border border-white/10 hover:border-secondary/50 rounded-xl text-white/70 hover:text-white transition-all shadow-lg backdrop-blur-md group animate-in fade-in slide-in-from-top-4 duration-500 font-headline"
        >
          <Download className="w-4 h-4 text-secondary group-hover:scale-110 transition-transform" />
          <span className="text-sm font-bold tracking-wide">Download App</span>
        </button>
      )}
      
      <div className="z-10 flex flex-col items-center text-center max-w-lg w-full">
        <div className="mb-6 p-4 rounded-2xl glassmorphism border-secondary/30 relative group mt-10 md:mt-0">
          <div className="absolute inset-0 bg-secondary/20 rounded-2xl blur-md group-hover:bg-secondary/30 transition-all duration-500" />
          <FlaskConical className="w-10 h-10 text-secondary relative z-10" />
        </div>
        
        <p className="text-secondary font-semibold tracking-[0.2em] text-sm mb-2 uppercase drop-shadow-md">Precision Learning</p>
        <h1 className="text-5xl font-bold mb-2 font-headline tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">ACCURACY</h1>
        <p className="text-lg text-white/90 font-medium">By Pintu Sahoo</p>
        
        {/* Transparent spacer to let the 3D atom show through clearly */}
        <div className="h-64 sm:h-[350px] w-full" aria-hidden="true" />
        
        <h2 className="text-2xl font-bold mb-3 drop-shadow-md">Welcome to the Frontier</h2>
        <p className="text-white/80 mb-10 leading-relaxed text-sm max-w-sm drop-shadow-sm">
          Master physics with a high-fidelity environment designed for high-achievers.
        </p>
        
        <div className="w-full flex flex-col gap-4">
          <Link 
            href="/login?role=student" 
            className="w-full py-4 px-6 rounded-xl bg-secondary text-primary font-bold text-lg flex items-center justify-center gap-2 hover:bg-secondary/90 transition-all duration-300 shadow-[0_0_20px_rgba(0,242,255,0.4)] hover:shadow-[0_0_30px_rgba(0,242,255,0.6)] hover:-translate-y-1 backdrop-blur-sm"
          >
            Student Login / Sign Up <ArrowRight className="w-5 h-5" />
          </Link>
          <Link 
            href="/login?role=admin" 
            className="w-full py-4 px-6 rounded-xl bg-transparent border border-tertiary/50 text-tertiary font-bold text-lg flex items-center justify-center gap-2 hover:bg-tertiary/10 transition-all duration-300 shadow-[0_0_10px_rgba(255,138,0,0.1)] hover:-translate-y-1 backdrop-blur-sm"
          >
            Admin Login / Sign Up <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
        
        <div className="flex gap-6 mt-10 text-white/50 text-xs font-mono drop-shadow-md">
           <span className="flex items-center gap-1">▣ v2.4.0</span>
           <span className="flex items-center gap-1">⚙ QUANTUM_READY</span>
        </div>
      </div>

      {/* Custom Install Guide Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glassmorphism rounded-3xl p-6 sm:p-8 border border-white/10 max-w-md w-full relative overflow-hidden shadow-2xl backdrop-blur-xl bg-dark/60 animate-in zoom-in-95 duration-300">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-secondary/10 rounded-full blur-[60px] pointer-events-none" />
            
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center p-3.5 bg-secondary/10 rounded-full mb-3 border border-secondary/20 shadow-[0_0_20px_rgba(0,242,255,0.15)]">
                <Smartphone className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1 font-headline">Install Accuracy App</h3>
              <p className="text-white/50 text-xs font-medium">Operate Accuracy directly from your home screen</p>
            </div>

            <div className="space-y-4 text-sm text-white/80">
              {isIOS ? (
                <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="font-semibold text-secondary flex items-center gap-1.5">
                    <Info className="w-4 h-4" /> Safari on iOS Instructions:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-xs text-white/70 font-mono">
                    <li>Tap the <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white/10 text-white"><Share className="w-3.5 h-3.5 inline" /> Share</span> button in the browser.</li>
                    <li>Scroll down and select <span className="text-white font-bold">Add to Home Screen</span>.</li>
                    <li>Tap <span className="text-secondary font-bold">Add</span> in the top right.</li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="font-semibold text-secondary flex items-center gap-1.5">
                    <Info className="w-4 h-4" /> Chrome / Edge Instructions:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-xs text-white/70 font-mono">
                    <li>Click the browser menu <span className="font-bold">(three dots/lines)</span> in the top right.</li>
                    <li>Select <span className="text-white font-bold">Save and share</span> or <span className="text-white font-bold">Apps</span>.</li>
                    <li>Click <span className="text-secondary font-bold">Install Accuracy</span> or <span className="text-secondary font-bold">Install page as app</span>.</li>
                  </ol>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowInstallModal(false)}
              className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-secondary to-blue-500 text-primary font-bold hover:opacity-90 transition-all shadow-[0_0_15px_rgba(0,242,255,0.3)]"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
