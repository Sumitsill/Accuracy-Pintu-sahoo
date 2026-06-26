import Link from "next/link";
import { ArrowRight, FlaskConical } from "lucide-react";
import dynamic from "next/dynamic";

const Hyperspeed = dynamic(() => import("@/components/Hyperspeed"), { ssr: false });

export default function Home() {
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
    </main>
  );
}
