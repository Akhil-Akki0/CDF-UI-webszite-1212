/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Wind, Sliders, X, Check, Cpu, ChevronRight } from 'lucide-react';

const VIDEO_URL = '/videos/robot_4k.mp4';
const FALLBACK_VIDEO_URL = '/videos/robot_clean.mp4';

// 4 Meaningful Aerodynamics Chapters directly inspired by Apollo & Supersonic flight
const CHAPTERS = [
  {
    id: 1,
    kicker: 'AI-POWERED FLUID DYNAMICS // 2026 EDITION',
    leadIn: 'Simulate the',
    wordLeft: 'FL',
    wordRight: 'OW',
    description:
      'Fifty years of computational fluid physics distilled into real-time neural operators. Simulate boundary layers, turbulent kinetic energy, and pressure fields at supersonic speeds without physical wind tunnels.',
    metrics: [
      { label: 'AIRSPEED', value: 'Mach 0.84 // 288 m/s' },
      { label: 'REYNOLDS', value: 'Re = 4.2 × 10⁶' },
      { label: 'RESIDUAL', value: '1.4 × 10⁻⁶' },
    ],
    cta: 'EXPLORE WORKBENCH',
    airfoil: 'NACA 0012',
  },
  {
    id: 2,
    kicker: 'DIGITAL WIND TUNNEL // CONSERVATION LAWS',
    leadIn: 'Governing the',
    wordLeft: 'AE',
    wordRight: 'RO',
    description:
      'Industrial boundary layers computed instantaneously through Fourier Neural Operators (FNO). Eliminate multi-week wind tunnel prototyping cycles with sub-second aerodynamic polar predictions.',
    metrics: [
      { label: 'LIFT/DRAG', value: 'L/D = 18.6 Max' },
      { label: 'PRESSURE', value: 'Δp = 101.3 kPa' },
      { label: 'GRID CELLS', value: '4.8M Hexahedral' },
    ],
    cta: 'INSPECT EQUATIONS',
    airfoil: 'SUPERCRITICAL SC(2)-0714',
  },
  {
    id: 3,
    kicker: 'NEURAL OPERATOR & SOLVER ENGINE',
    leadIn: 'Command the',
    wordLeft: 'WI',
    wordRight: 'ND',
    description:
      'K-Omega SST turbulence closure accelerated by tensor cores. Predict wake vortex detachment, buffet onset, and pressure drag with empirical aerodynamic validation across high angles of attack.',
    metrics: [
      { label: 'VORTEX YAW', value: '14.2° Detached' },
      { label: 'INFERENCE', value: '4.2 ms / Polar' },
      { label: 'TURB K.E.', value: 'k = 0.85 m²/s²' },
    ],
    cta: 'VIEW STREAMLINES',
    airfoil: 'DELTA WING VORTEX',
  },
  {
    id: 4,
    kicker: 'STANDARDIZED CDF WORKFLOW PIPELINE',
    leadIn: 'Mastering',
    wordLeft: 'FLI',
    wordRight: 'GHT',
    description:
      'An end-to-end aerodynamic certification pipeline: automated surface mesh healing, boundary condition validation, residual convergence tracking, and instant OpenFOAM solver export.',
    metrics: [
      { label: 'CERTIFICATION', value: 'FAA FAR-25' },
      { label: 'SOLVER FORMAT', value: 'OpenFOAM' },
      { label: 'DATA STREAM', value: 'HDF5 / VTK' },
    ],
    cta: 'EXPORT OPENFOAM',
    airfoil: 'SUPERSONIC WEDGE',
  },
];

export default function App() {
  const [videoSrc, setVideoSrc] = useState<string>(VIDEO_URL);
  const [activeSection, setActiveSection] = useState<number>(1);
  const [workbenchOpen, setWorkbenchOpen] = useState<boolean>(false);
  const [aoa, setAoa] = useState<number>(4);
  const [airspeed, setAirspeed] = useState<number>(240);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [walkProgress, setWalkProgress] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const simCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const targetTimeRef = useRef<number>(0);
  const isSeekingRef = useRef<boolean>(false);
  const activeSectionRef = useRef<number>(1);

  // Smooth seeking queue for scrubbing video without frame drops
  const processSeekQueue = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration || Number.isNaN(video.duration)) {
      isSeekingRef.current = false;
      return;
    }

    if (Math.abs(video.currentTime - targetTimeRef.current) > 0.02) {
      isSeekingRef.current = true;
      video.currentTime = targetTimeRef.current;
    } else {
      isSeekingRef.current = false;
    }
  }, []);

  const onSeeked = useCallback(() => {
    processSeekQueue();
  }, [processSeekQueue]);

  const updateProgress = useCallback((progress: number) => {
    const video = videoRef.current;
    if (!video || !video.duration || Number.isNaN(video.duration)) return;

    const clampedProgress = Math.max(0, Math.min(1, progress));
    setWalkProgress(clampedProgress);
    targetTimeRef.current = clampedProgress * video.duration;

    let nextSection = 1;
    if (clampedProgress >= 0.75) nextSection = 4;
    else if (clampedProgress >= 0.50) nextSection = 3;
    else if (clampedProgress >= 0.25) nextSection = 2;

    if (activeSectionRef.current !== nextSection) {
      activeSectionRef.current = nextSection;
      setActiveSection(nextSection);
    }

    if (!isSeekingRef.current) {
      isSeekingRef.current = true;
      video.currentTime = targetTimeRef.current;
    }
  }, []);

  // Scroll and wheel driven character walk
  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      const progress = window.scrollY / maxScroll;
      updateProgress(progress);
    };

    const handleWheel = (e: WheelEvent) => {
      const video = videoRef.current;
      if (!video || !video.duration || Number.isNaN(video.duration)) return;

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll > 0) {
        requestAnimationFrame(handleScroll);
      } else {
        const delta = e.deltaY;
        const timeDelta = (delta / 700) * video.duration;
        const newTime = Math.max(0, Math.min(video.duration, targetTimeRef.current + timeDelta));
        targetTimeRef.current = newTime;
        if (!isSeekingRef.current) {
          isSeekingRef.current = true;
          video.currentTime = newTime;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [updateProgress]);

  const scrollToSection = (sec: number) => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const targetY = ((sec - 1) / 3) * maxScroll;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
    updateProgress((sec - 1) / 3);
  };

  const scrollToNextSection = () => {
    const next = activeSection === 4 ? 1 : activeSection + 1;
    scrollToSection(next);
  };

  // Interactive Wind Tunnel Canvas Simulation inside Workbench Modal
  useEffect(() => {
    if (!workbenchOpen) return;
    const canvas = simCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const numParticles = 70;
    const particles: { x: number; y: number; vx: number; vy: number; life: number }[] = [];

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: 4 + Math.random() * 3,
        vy: 0,
        life: Math.random() * 100,
      });
    }

    const renderSim = () => {
      ctx.fillStyle = 'rgba(8, 12, 20, 0.35)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width * 0.45;
      const cy = canvas.height * 0.5;
      const chord = 180;
      const rad = (aoa * Math.PI) / 180;

      // Draw aerodynamic airfoil geometry
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-rad);

      ctx.beginPath();
      ctx.moveTo(-chord / 2, 0);
      ctx.bezierCurveTo(-chord / 4, -30, chord / 4, -30, chord / 2, 0);
      ctx.bezierCurveTo(chord / 4, 15, -chord / 4, 15, -chord / 2, 0);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#38BDF8';
      ctx.stroke();

      // Leading edge stagnation point glow
      ctx.beginPath();
      ctx.arc(-chord / 2, 0, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#F97316';
      ctx.fill();

      ctx.restore();

      // Streamline particles
      ctx.lineWidth = 1.5;
      for (const p of particles) {
        p.x += (airspeed / 50) * p.vx;
        
        const dx = p.x - cx;
        const dy = p.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 100) {
          const normalY = dy / (dist + 0.1);
          p.y += normalY * (aoa > 0 ? -1.8 : 1.8) * 2;
        }

        if (p.x > canvas.width) {
          p.x = 0;
          p.y = Math.random() * canvas.height;
        }

        ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 + 0.5 * Math.sin(p.life * 0.1)})`;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 3, p.y);
        ctx.stroke();
        p.life++;
      }

      animId = requestAnimationFrame(renderSim);
    };

    renderSim();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [workbenchOpen, aoa, airspeed]);

  const currentChapter = CHAPTERS[activeSection - 1] || CHAPTERS[0];

  const aeroCoeffs = useMemo(() => {
    const cl = (2 * Math.PI * (aoa + 2) * (Math.PI / 180)).toFixed(3);
    const cd = (0.012 + 0.04 * Math.pow((aoa * Math.PI) / 180, 2)).toFixed(3);
    const ld = (parseFloat(cl) / (parseFloat(cd) || 0.001)).toFixed(1);
    const liftN = ((0.5 * 1.225 * Math.pow(airspeed, 2) * 1.8 * parseFloat(cl)) / 1000).toFixed(1);
    return { cl, cd, ld, liftN };
  }, [aoa, airspeed]);

  const handleCopyOpenFoam = () => {
    navigator.clipboard.writeText(`application simpleFoam;\nstartTime 0;\nendTime 1000;\nInflowVelocity = ${airspeed} m/s;\nAlpha = ${aoa} deg;\nTurbulence = k-omega SST;`);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <div className="relative w-full min-h-screen text-white select-none overflow-x-hidden font-body">
      {/* 
        Full-Screen 4K Video Background
        Clean, sharp, watermark-free, pristine video
      */}
      <video
        ref={videoRef}
        src={videoSrc}
        muted
        playsInline
        preload="auto"
        onSeeked={onSeeked}
        onError={() => {
          if (videoSrc !== FALLBACK_VIDEO_URL) {
            setVideoSrc(FALLBACK_VIDEO_URL);
          }
        }}
        onLoadedMetadata={() => {
          const video = videoRef.current;
          if (video) {
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
            video.currentTime = progress * video.duration;
            targetTimeRef.current = video.currentTime;
          }
        }}
        className="fixed inset-0 w-full h-full object-cover pointer-events-none"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          objectPosition: 'center',
        }}
      />

      {/* 
        TOP-RIGHT BRANDING:
        "and at the top right corner you can add a ring platform It's enough"
      */}
      <div className="fixed top-7 right-7 sm:top-9 sm:right-12 z-20 flex items-center gap-2.5 text-white pointer-events-auto">
        <span className="w-2.5 h-2.5 rounded-full border border-[#38BDF8] bg-[#38BDF8]/40 shadow-[0_0_10px_#38BDF8] animate-pulse" />
        <span className="font-mono text-xs sm:text-sm font-bold tracking-[0.22em] uppercase text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
          RIM Platform
        </span>
      </div>

      {/* 
        MIDDLE-RIGHT SCROLL NAVIGATION:
        "and at the middle right side I do what they say the school alleviation something like that"
      */}
      <nav 
        className="fixed right-5 sm:right-9 top-1/2 -translate-y-1/2 z-20 flex flex-col items-end gap-3.5 pointer-events-auto"
        aria-label="Scroll navigation"
      >
        {CHAPTERS.map((ch) => {
          const isAct = activeSection === ch.id;
          const word = `${ch.wordLeft}${ch.wordRight}`;
          return (
            <button
              key={ch.id}
              onClick={() => scrollToSection(ch.id)}
              className="group flex items-center gap-2.5 py-1 cursor-pointer transition-all focus:outline-none"
              aria-label={`Jump to ${word}`}
            >
              <span className={`text-[11px] font-mono tracking-widest uppercase transition-all duration-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ${
                isAct
                  ? 'text-[#F97316] font-bold opacity-100 translate-x-0'
                  : 'text-white/40 group-hover:text-white/80 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0'
              }`}>
                {word}
              </span>
              <span className={`rounded-full transition-all duration-300 ${
                isAct
                  ? 'w-3 h-3 bg-[#F97316] ring-4 ring-[#F97316]/30 shadow-[0_0_12px_#F97316]'
                  : 'w-2 h-2 bg-white/40 group-hover:bg-white/80 group-hover:scale-125'
              }`} />
            </button>
          );
        })}
      </nav>

      {/* 
        TOP-LEFT LEAD-IN TYPOGRAPHY (Directly from Apollo "Return to the" Abstract)
        Completely transparent, zero black bars or backgrounds!
      */}
      <div className="fixed top-10 sm:top-14 left-6 sm:left-14 lg:left-20 z-10 pointer-events-none flex flex-col items-start">
        {/* Kicker */}
        <div className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.28em] text-white/80 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] mb-1">
          {currentChapter.kicker}
        </div>

        {/* Italic Serif Lead-in */}
        <div className="text-3xl sm:text-5xl md:text-6xl font-serif italic text-[#F97316] drop-shadow-[0_4px_16px_rgba(249,115,22,0.7)] tracking-wide">
          {currentChapter.leadIn}
        </div>
      </div>

      {/* 
        MONUMENTAL DISPLAY TEXT WITH PRECISE, SAFE CHARACTER CLEARANCE:
        - Character center in video is at ~57.3%, left edge ~46.3%, right edge ~68.4%
        - Left wing ends cleanly at 43.5% (right-[56.5%]), leaving 2.8% safe clearance
        - Right wing starts cleanly at 70.5% (left-[70.5%]), leaving 2.1% safe clearance
        - Close to the character without touching or overlapping!
        - Subtle walk parallax shift moves naturally with the character's footsteps!
      */}
      <div 
        className="fixed inset-0 pointer-events-none z-10 overflow-hidden"
        aria-hidden="true"
      >
        {/* Left Wing of Monumental Word */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 right-[56.5%] select-none transition-transform duration-300 ease-out flex items-center justify-end"
          style={{
            transform: `translate(${walkProgress * 10}px, -50%)`,
          }}
        >
          <span 
            className="text-[100px] sm:text-[150px] md:text-[200px] lg:text-[250px] xl:text-[290px] font-black tracking-normal text-white leading-none inline-block drop-shadow-[0_0_50px_rgba(255,255,255,0.7)] text-right"
            style={{
              fontFamily: 'Impact, "Helvetica Neue", "Arial Black", sans-serif',
              textShadow: '0 0 50px rgba(255,255,255,0.4), 0 10px 40px rgba(0,0,0,0.95)',
            }}
          >
            {currentChapter.wordLeft}
          </span>
        </div>

        {/* Right Wing of Monumental Word */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 left-[70.5%] select-none transition-transform duration-300 ease-out flex items-center justify-start"
          style={{
            transform: `translate(${walkProgress * 10}px, -50%)`,
          }}
        >
          <span 
            className="text-[100px] sm:text-[150px] md:text-[200px] lg:text-[250px] xl:text-[290px] font-black tracking-normal text-white leading-none inline-block drop-shadow-[0_0_50px_rgba(255,255,255,0.7)] text-left"
            style={{
              fontFamily: 'Impact, "Helvetica Neue", "Arial Black", sans-serif',
              textShadow: '0 0 50px rgba(255,255,255,0.4), 0 10px 40px rgba(0,0,0,0.95)',
            }}
          >
            {currentChapter.wordRight}
          </span>
        </div>
      </div>

      {/* Aerodynamic wind tunnel streamline ribbons drifting across the scene */}
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden opacity-35" aria-hidden="true">
        <div className="absolute top-[38%] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent animate-streamline-1" />
        <div className="absolute top-[48%] left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#F97316] to-transparent animate-streamline-2" />
        <div className="absolute top-[58%] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent animate-streamline-3" />
      </div>

      {/* 
        MIDDLE-LEFT CORNER EDITORIAL TEXT (COMPLETELY TRANSPARENT, NO BLACK CARDS/BACKGROUNDS)
        "if there is any small text present make a place the matter middle left corner"
        "I want the text to be transplant then I don't want any background to be used in this website"
      */}
      <aside 
        className="fixed left-6 sm:left-14 lg:left-20 bottom-12 sm:bottom-16 z-20 max-w-[340px] sm:max-w-md pointer-events-auto"
        aria-label="Editorial chapter details"
      >
        <div className="flex flex-col items-start gap-1">
          
          {/* Transparent Editorial Narrative Paragraph (Zero background box!) */}
          <p className="text-xs sm:text-sm lg:text-[14.5px] text-white/95 leading-relaxed font-normal drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] mb-3">
            {currentChapter.description}
          </p>

          {/* Transparent Telemetry Readouts (No background container!) */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 py-1 mb-4">
            {currentChapter.metrics.map((m, idx) => (
              <div key={idx} className="flex items-center gap-1.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">
                <span className="text-[10px] font-mono tracking-wider text-white/60 uppercase">
                  {m.label}:
                </span>
                <span className="text-[11px] sm:text-xs font-mono font-semibold text-white">
                  {m.value}
                </span>
              </div>
            ))}
          </div>

          {/* Corner-Bracketed Action Button directly on transparent backdrop */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setWorkbenchOpen(true)}
              className="relative px-5 py-2.5 uppercase tracking-widest text-xs font-bold text-white hover:bg-white hover:text-black border border-white/60 transition-all duration-200 cursor-pointer group flex items-center gap-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
            >
              {/* Corner Bracket Accents from the Abstract */}
              <span className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white pointer-events-none group-hover:scale-125 transition-transform" />
              <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white pointer-events-none group-hover:scale-125 transition-transform" />
              <span>{currentChapter.cta}</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={scrollToNextSection}
              className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-white/80 hover:text-white transition-all cursor-pointer drop-shadow-md hover:underline"
            >
              NEXT STEP →
            </button>
          </div>

        </div>
      </aside>

      {/* 
        Scroll Track: 
        500vh container driving the character walk and animated text transitions
      */}
      <div 
        className="relative w-full h-[500vh] pointer-events-none" 
        aria-hidden="true" 
      />

      {/* 
        INTERACTIVE CDF WORKBENCH MODAL
        Opens when clicking "EXPLORE WORKBENCH"
      */}
      {workbenchOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="workbench-modal-title"
        >
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0C121D] border border-white/20 rounded-xl p-6 sm:p-8 shadow-2xl text-white">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/15">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-sky-500/20 text-[#38BDF8] border border-sky-500/40">
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="workbench-modal-title" className="text-lg sm:text-xl font-bold tracking-tight text-white">
                    RIM CDF Aerodynamics Workbench // Diagnostics
                  </h2>
                  <p className="text-xs text-white/60 font-mono">
                    Fourier Neural Operator (FNO) Real-Time Wind Tunnel Solver
                  </p>
                </div>
              </div>

              <button
                onClick={() => setWorkbenchOpen(false)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Interactive Wind Tunnel Simulation Canvas */}
            <div className="mt-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#38BDF8]" />
                  2D Real-Time Potential Flow Streamlines &amp; Pressure Isobars
                </span>
                <span className="text-xs font-mono text-[#F97316] font-bold">
                  {currentChapter.airfoil} · AoA: {aoa}°
                </span>
              </div>

              <div className="relative w-full h-56 sm:h-72 rounded-lg overflow-hidden border border-white/15 bg-[#05080E] shadow-inner">
                <canvas
                  ref={simCanvasRef}
                  width={800}
                  height={320}
                  className="w-full h-full object-cover"
                />

                <div className="absolute top-3 left-3 flex flex-wrap gap-2 text-[10px] font-mono pointer-events-none">
                  <span className="bg-black/70 px-2.5 py-1 rounded border border-white/15 text-[#38BDF8]">
                    LIFT: {aeroCoeffs.liftN} kN
                  </span>
                  <span className="bg-black/70 px-2.5 py-1 rounded border border-white/15 text-white">
                    C_L: {aeroCoeffs.cl}
                  </span>
                  <span className="bg-black/70 px-2.5 py-1 rounded border border-white/15 text-white">
                    C_D: {aeroCoeffs.cd}
                  </span>
                  <span className="bg-black/70 px-2.5 py-1 rounded border border-white/15 text-[#F97316]">
                    L/D: {aeroCoeffs.ld}
                  </span>
                </div>
              </div>
            </div>

            {/* Slider Parameter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6 p-4 rounded-lg bg-black/40 border border-white/10">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-white/70">Angle of Attack (α)</span>
                  <span className="text-[#38BDF8] font-bold">{aoa}°</span>
                </div>
                <input
                  type="range"
                  min="-6"
                  max="18"
                  step="1"
                  value={aoa}
                  onChange={(e) => setAoa(Number(e.target.value))}
                  className="w-full accent-[#38BDF8] cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-white/70">Inflow Airspeed (U∞)</span>
                  <span className="text-[#F97316] font-bold">{airspeed} m/s</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="400"
                  step="10"
                  value={airspeed}
                  onChange={(e) => setAirspeed(Number(e.target.value))}
                  className="w-full accent-[#F97316] cursor-pointer"
                />
              </div>
            </div>

            {/* OpenFOAM Case Dict Exporter */}
            <div className="mt-6 p-4 rounded-lg bg-black/40 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-white/80 flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-[#38BDF8]" />
                  OpenFOAM system/controlDict Configuration Generator
                </span>

                <button
                  onClick={handleCopyOpenFoam}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold bg-white/10 hover:bg-white text-white hover:text-black border border-white/30 transition-all cursor-pointer"
                >
                  {copiedNotification ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>COPIED!</span>
                    </>
                  ) : (
                    <>
                      <span>COPY DICT</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-3 rounded bg-black/60 font-mono text-[11px] text-emerald-400/90 overflow-x-auto border border-white/10 max-h-32">
{`application     simpleFoam;
startTime       0;
endTime         1000;
deltaT          1;
// Inflow Velocity = ${airspeed} m/s, Alpha = ${aoa} deg
// Turbulence Model: k-omega SST with FNO boundary layer initialization`}
              </pre>
            </div>

            {/* Close footer */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setWorkbenchOpen(false)}
                className="px-6 py-2.5 rounded font-mono text-xs font-bold uppercase tracking-wider bg-white text-black hover:bg-white/90 transition-all cursor-pointer"
              >
                CLOSE WORKBENCH
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
