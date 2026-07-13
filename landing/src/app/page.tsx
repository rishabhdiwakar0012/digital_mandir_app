"use client";

import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform, type Variants, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Download, Activity, Trophy, Play, CheckCircle2,
  PhoneOff, Library, Flame, ChevronRight, ArrowRight,
  Timer, RotateCcw, Settings, Music, Volume2, Hand, Star, Users, BookOpen, Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRef, useState, useEffect } from 'react';

/* ============================================
   ANIMATION VARIANTS
============================================ */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 20 } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

/* ============================================
   MANTRAS DATA
============================================ */
const MANTRAS = [
  "हरे राम हरे राम राम राम हरे हरे हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे",
  "ॐ हनुमते नमः",
  "ॐ नमः शिवाय",
  "ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्",
  "ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्। उर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय माऽमृतात्॥",
  "ॐ गं गणपतये नमः",
];

function GentleMantraMarquee({ direction = "left", speed = 40, className = "", mantras }: { direction?: "left" | "right", speed?: number, className?: string, mantras: string[] }) {
  const repeated = [...mantras, ...mantras, ...mantras, ...mantras, ...mantras];
  return (
    <div className={`overflow-hidden flex whitespace-nowrap pointer-events-none select-none w-full opacity-100 ${className}`}>
      <motion.div
        animate={{ x: direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"] }}
        transition={{ repeat: Infinity, ease: "linear", duration: speed }}
        className="flex items-center gap-16 min-w-max pr-16"
      >
        {repeated.map((mantra, i) => (
          <span
            key={i}
            className="font-medium text-[#FF9933]/25 tracking-[0.25em] text-lg sm:text-2xl drop-shadow-[0_0_15px_rgba(255,153,51,0.2)]"
          >
            {mantra}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ============================================
   MAIN PAGE
============================================ */

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.15], ["0%", "20%"]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#FAFAF9] text-[#1C1917] font-sans overflow-x-hidden selection:bg-[#FF9933]/30">

      {/* === LUXURY BACKGROUND EFFECTS === */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Massive, ultra-soft Saffron blurs mimicking ambient light on dark */}
        <div className="absolute top-[-20%] left-[-10%] w-[1000px] h-[1000px] rounded-full bg-[#FF9933]/[0.15] blur-[180px] animate-mesh-pan"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] rounded-full bg-[#FFCC80]/[0.12] blur-[150px] animate-mesh-pan" style={{ animationDelay: '5s' }}></div>
        <div className="absolute top-[40%] left-[60%] w-[600px] h-[600px] rounded-full bg-[#E68A2E]/[0.15] blur-[120px] animate-mesh-pan" style={{ animationDelay: '10s' }}></div>
        {/* Subtle noise for texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      {/* === ELEGANT HEADER === */}
      <header className="fixed top-0 z-50 w-full pt-4">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-5xl h-14 flex items-center justify-between glass-pill-light px-6 rounded-full">
            <motion.div
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF9933] to-[#FFCC80] flex items-center justify-center shadow-[0_0_15px_rgba(255,153,51,0.3)]">
                <div className="w-6 h-6 rounded-full bg-[#FAFAF9] flex items-center justify-center">
                  <Image src="/splash-icon.png" alt="Logo" width={14} height={14} className="object-contain drop-shadow-sm brightness-110" />
                </div>
              </div>
              <span className="text-sm font-bold tracking-tight text-[#1C1917]">DigitalMandir</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
              className="flex items-center gap-8"
            >
              <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium text-[#57534E]">
                <Link href="#philosophy" className="hover:text-[#1C1917] hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all duration-300">Design</Link>
                <Link href="#sanctuary" className="hover:text-[#1C1917] hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all duration-300">Sanctuary</Link>
              </nav>
              <Link
                href="#sanctuary"
                className="group relative flex h-9 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FF9933] to-[#FFCC80] px-6 text-[13px] font-bold text-[#1C1917] transition-all shadow-[0_4px_15px_rgba(255,153,51,0.25)] hover:shadow-[0_8px_25px_rgba(255,153,51,0.4)] hover:-translate-y-0.5"
              >
                <span>Download</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="relative z-10 w-full flex flex-col items-center">

        {/* ============================================
            HERO SECTION - SOFT DARK HIGH VISIBILITY
        ============================================ */}
        <section className="relative min-h-[100svh] w-full flex flex-col items-center justify-center pt-24 pb-12 overflow-hidden border-b border-black/[0.04]">

          {/* HIGH VISIBILITY Ambient Mantras */}
          <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0 z-0 flex flex-col justify-evenly pointer-events-none opacity-80">
            <GentleMantraMarquee direction="left" speed={160} mantras={MANTRAS} />
            <GentleMantraMarquee direction="right" speed={200} mantras={MANTRAS} />
            <GentleMantraMarquee direction="left" speed={140} mantras={MANTRAS} />
            <GentleMantraMarquee direction="right" speed={220} mantras={MANTRAS} />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#FAFAF9_80%)] z-10"></div>
          </motion.div>

          <div className="container mx-auto px-6 relative z-20 flex flex-col items-center text-center mt-8">
            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="max-w-4xl mx-auto flex flex-col items-center">

              <motion.div variants={fadeUp} className="mb-10 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFFFFF]/80 backdrop-blur-md border border-[#FF9933]/20 shadow-[0_0_20px_rgba(255,153,51,0.1)]">
                <Sparkles className="w-4 h-4 text-[#FF9933]" />
                <span className="text-xs font-semibold tracking-wider text-[#FFCC80] uppercase">Pure Devotion Awaits</span>
              </motion.div>

              <motion.h1 variants={fadeUp} className="mb-8">
                <span className="block font-serif text-6xl md:text-8xl lg:text-[7.5rem] font-bold tracking-tighter leading-[1.05] text-[#1C1917] drop-shadow-xl">
                  Discover your
                </span>
                <span className="block font-serif text-6xl md:text-8xl lg:text-[7.5rem] font-bold tracking-tighter leading-[1] text-gradient-saffron animate-gradient-x mt-2 drop-shadow-[0_0_30px_rgba(255,153,51,0.3)]">
                  inner peace.
                </span>
              </motion.h1>

              <motion.p variants={fadeUp} className="text-lg md:text-2xl text-[#57534E] max-w-2xl mx-auto font-medium leading-relaxed mb-14 drop-shadow-md">
                A serene, distraction-free companion for offline Digital Mandir. Beautifully crafted to keep your focus exactly where it belongs.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto">
                <Link
                  href="#sanctuary"
                  className="group relative flex h-16 w-full sm:w-auto items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#FF9933] to-[#E68A2E] px-12 text-lg font-bold text-[#1C1917] transition-all shadow-[0_10px_30px_rgba(255,153,51,0.25)] hover:shadow-[0_15px_40px_rgba(255,153,51,0.4)] hover:-translate-y-1"
                >
                  Download Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="#philosophy"
                  className="group flex h-16 w-full sm:w-auto items-center justify-center gap-3 rounded-full bg-[#FFFFFF] border border-[#1C1917]/10 px-10 text-lg font-medium text-[#1C1917] transition-all hover:bg-[#F5F5F4] hover:border-[#1C1917]/20 shadow-lg"
                >
                  <Play className="w-4 h-4 text-[#FF9933]" />
                  <span>The Philosophy</span>
                </Link>
              </motion.div>

            </motion.div>
          </div>
        </section>

        {/* ============================================
            THE PHILOSOPHY (Dark Luxury Cards)
        ============================================ */}
        <section id="philosophy" className="w-full py-32 md:py-48 relative border-b border-black/[0.04]">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#FF9933]/[0.05] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

          <div className="container mx-auto px-6 max-w-7xl">

            <motion.div
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8 }}
              className="text-center mb-20"
            >
              <h2 className="font-serif text-5xl md:text-7xl font-bold tracking-tighter text-[#1C1917] mb-6 drop-shadow-lg">
                Designed for clarity.
              </h2>
              <p className="text-xl text-[#57534E] max-w-2xl mx-auto font-medium">
                We stripped away the noise. What remains is a perfectly balanced, elegant interface that feels like a breath of fresh air.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">

              {/* Card 1 */}
              <motion.div
                initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.8 }}
                className="luxury-card-light rounded-3xl p-10 flex flex-col group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#FF9933]/15 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-14 h-14 rounded-full bg-[#FAFAF9] border border-[#FF9933]/30 flex items-center justify-center mb-8 shadow-[0_0_15px_rgba(255,153,51,0.15)] group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(255,153,51,0.3)] transition-all duration-500">
                  <Activity strokeWidth={1.5} className="w-6 h-6 text-[#FFCC80]" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-4 text-[#1C1917]">Absolute Focus.</h3>
                <p className="text-[#57534E] leading-relaxed text-lg">
                  Every interface element is intentionally minimal. Subtle haptic feedback grounds you precisely in the present moment.
                </p>
              </motion.div>

              {/* Card 2 */}
              <motion.div
                initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.8, delay: 0.1 }}
                className="luxury-card-light rounded-3xl p-10 flex flex-col group relative overflow-hidden mt-0 md:mt-12"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#FF9933]/15 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-14 h-14 rounded-full bg-[#FAFAF9] border border-[#FF9933]/30 flex items-center justify-center mb-8 shadow-[0_0_15px_rgba(255,153,51,0.15)] group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(255,153,51,0.3)] transition-all duration-500">
                  <Flame strokeWidth={1.5} className="w-6 h-6 text-[#FFCC80]" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-4 text-[#1C1917]">Quiet Consistency.</h3>
                <p className="text-[#57534E] leading-relaxed text-lg">
                  Beautiful, hyper-minimal heatmaps and streaks celebrate your dedication smoothly without the pressure of loud notifications.
                </p>
              </motion.div>

              {/* Card 3 */}
              <motion.div
                initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.8, delay: 0.2 }}
                className="luxury-card-light rounded-3xl p-10 flex flex-col group relative overflow-hidden mt-0 md:-mt-12"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#FF9933]/15 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-14 h-14 rounded-full bg-[#FAFAF9] border border-[#FF9933]/30 flex items-center justify-center mb-8 shadow-[0_0_15px_rgba(255,153,51,0.15)] group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(255,153,51,0.3)] transition-all duration-500">
                  <PhoneOff strokeWidth={1.5} className="w-6 h-6 text-[#FFCC80]" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-4 text-[#1C1917]">Always Present.</h3>
                <p className="text-[#57534E] leading-relaxed text-lg">
                  Architected to function perfectly entirely disconnected. Your sanctuary travels with you, untethered from the chaotic grid.
                </p>
              </motion.div>

            </div>
          </div>
        </section>

        {/* ============================================
            THE SANCTUARY (MOCKUP SHOWCASE)
        ============================================ */}
        <section id="sanctuary" className="w-full py-32 md:py-48 relative overflow-hidden bg-[#FAFAF9]">

          <div className="container mx-auto px-6 max-w-6xl relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

              {/* Left: Text Content */}
              <motion.div
                initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
                className="flex-1 max-w-xl"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#FFFFFF] border border-[#FF9933]/30 shadow-[0_0_20px_rgba(255,153,51,0.15)] mb-8">
                  <Heart className="w-6 h-6 text-[#FFCC80]" />
                </div>

                <h2 className="font-serif text-5xl md:text-6xl font-bold tracking-tighter text-[#1C1917] mb-8 leading-[1.1] drop-shadow-md">
                  An oasis of <br />
                  <span className="text-gradient-saffron font-serif">serenity.</span>
                </h2>

                <p className="text-xl text-[#57534E] font-medium leading-relaxed mb-10">
                  Experience a beautifully visualized interface that respects your time. A warm, native feel designed exclusively to elevate your devotion.
                </p>

                <ul className="space-y-6">
                  {[
                    'Tactile, real-world rudraksha physics',
                    'Zero distractions. Absolute purity.',
                    'Deep, warm native UI rendering',
                    'Always entirely local and secure'
                  ].map((item, i) => (
                    <motion.li
                      initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 * i, duration: 0.5 }}
                      key={i}
                      className="flex items-center gap-4 text-[#1C1917] font-semibold text-lg"
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#FF9933]/20 border border-[#FF9933]/30 shadow-[0_0_10px_rgba(255,153,51,0.2)]">
                        <CheckCircle2 className="w-4 h-4 text-[#FFCC80]" />
                      </div>
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              {/* Right: Phone Mockup (PRESERVED) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }} whileInView={{ opacity: 1, scale: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1, type: "spring", stiffness: 40 }}
                className="flex-[0.8] w-full relative flex justify-center lg:justify-end"
              >
                {/* Intense Warm Glow behind phone complementing the dark background */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[750px] bg-[radial-gradient(ellipse,rgba(255,153,51,0.2)_0%,transparent_60%)] blur-3xl pointer-events-none animate-pulse-saffron"></div>

                <div className="relative z-10 hover:-translate-y-2 transition-transform duration-700 ease-out shadow-[0_0_60px_rgba(255,153,51,0.15)] rounded-[3.5rem]">
                  <MantraJaapMockup />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

      </main>

      {/* ============================================
          EDITORIAL DARK FOOTER
      ============================================ */}
      <footer className="w-full pt-32 pb-12 bg-[#FAFAF9] relative overflow-hidden border-t border-black/[0.04]">
        {/* Top elegant line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[1px] bg-gradient-to-r from-transparent via-[#FF9933]/30 to-transparent"></div>

        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-center text-center mb-32">
            <motion.h2
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
              className="font-serif text-5xl md:text-7xl font-bold tracking-tighter text-[#1C1917] mb-10 drop-shadow-xl"
            >
              Begin your practice.
            </motion.h2>
            <Link
              href="#sanctuary"
              className="group flex h-16 items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#FF9933] to-[#E68A2E] px-14 text-lg font-bold text-[#1C1917] transition-all shadow-[0_10px_30px_rgba(255,153,51,0.25)] hover:shadow-[0_15px_40px_rgba(255,153,51,0.4)] hover:-translate-y-1"
            >
              <span>Download Free</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="flex flex-col border-t border-black/[0.05] pt-10">
            {/* Mid Top: Brand & Credits */}
            <div className="flex flex-col items-center justify-center mb-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF9933] to-[#FFCC80] flex items-center justify-center shadow-[0_0_15px_rgba(255,153,51,0.3)]">
                  <div className="w-6 h-6 rounded-full bg-[#FAFAF9] flex items-center justify-center">
                    <Image src="/splash-icon.png" alt="Logo" width={14} height={14} className="object-contain drop-shadow-sm brightness-110" />
                  </div>
                </div>
                <span className="text-lg font-bold tracking-tight text-[#1C1917]">DigitalMandir</span>
              </div>
              <div className="flex items-center gap-2 text-[#FF9933]">
                <span className="text-[10px] md:text-xs font-medium uppercase tracking-widest opacity-80">Designed & Developed by</span>
                <span className="font-[var(--font-playfair)] font-bold text-lg tracking-wide relative">
                  Zlaark
                  <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-[#FF9933]/40 rounded-full"></span>
                </span>
              </div>
            </div>

            {/* Bottom: Copyright & Links */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
              <p className="text-[#57534E] text-sm font-medium order-2 md:order-1">
                © {new Date().getFullYear()} DigitalMandir. Built with devotion.
              </p>

              <div className="flex items-center gap-6 md:gap-8 text-sm font-medium text-[#57534E] order-1 md:order-2">
                <Link href="#" className="hover:text-[#1C1917] transition-colors">Twitter</Link>
                <Link href="/privacy-policy" className="hover:text-[#1C1917] transition-colors">Privacy</Link>
                <Link href="#" className="hover:text-[#1C1917] transition-colors">Terms</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ============================================
   MANTRA JAAP MOCKUP (PRESERVED — DO NOT MODIFY)
============================================ */

function MantraJaapMockup() {
  const [count, setCount] = useState(0);
  const [round, setRound] = useState(1);
  const BEAD_COUNT = 32;
  const BEAD_SIZE = 40;

  // Stadium / Capsule shape parameters (matching frontend proportions)
  // Phone mockup is 300x640, using ~82% width and ~80% height like frontend
  const MALA_WIDTH = 240;
  const MALA_HEIGHT = 500;
  const CORNER_RADIUS = MALA_WIDTH / 2; // 130
  const STRAIGHT_LENGTH = MALA_HEIGHT - MALA_WIDTH; // 260
  const PERIMETER = 2 * STRAIGHT_LENGTH + 2 * Math.PI * CORNER_RADIUS;
  const DIST_PER_BEAD = PERIMETER / BEAD_COUNT;

  // Stadium perimeter position (exact same algorithm as frontend Mala.tsx)
  const getStadiumPosition = (d: number) => {
    let dist = ((d % PERIMETER) + PERIMETER) % PERIMETER;
    const halfStraight = STRAIGHT_LENGTH / 2;
    const centerY_top = -halfStraight;
    const centerY_bottom = halfStraight;
    const topSemiLen = (Math.PI * CORNER_RADIUS) / 2;
    const bottomSemiLen = Math.PI * CORNER_RADIUS;

    if (dist < topSemiLen) {
      const angle = -Math.PI / 2 + (dist / CORNER_RADIUS);
      return { x: CORNER_RADIUS * Math.cos(angle), y: centerY_top + CORNER_RADIUS * Math.sin(angle) };
    }
    dist -= topSemiLen;
    if (dist < STRAIGHT_LENGTH) {
      return { x: CORNER_RADIUS, y: centerY_top + dist };
    }
    dist -= STRAIGHT_LENGTH;
    if (dist < bottomSemiLen) {
      const angle = dist / CORNER_RADIUS;
      return { x: CORNER_RADIUS * Math.cos(angle), y: centerY_bottom + CORNER_RADIUS * Math.sin(angle) };
    }
    dist -= bottomSemiLen;
    if (dist < STRAIGHT_LENGTH) {
      return { x: -CORNER_RADIUS, y: centerY_bottom - dist };
    }
    dist -= STRAIGHT_LENGTH;
    const angle = Math.PI + (dist / CORNER_RADIUS);
    return { x: CORNER_RADIUS * Math.cos(angle), y: centerY_top + CORNER_RADIUS * Math.sin(angle) };
  };

  const getBeadPosition = (index: number, currentCount: number) => {
    const effectiveDist = (index - currentCount) * DIST_PER_BEAD;
    return getStadiumPosition(effectiveDist);
  };

  const handleTap = () => {
    setCount(prev => {
      const newCount = prev + 1;
      if (newCount > 0 && newCount % BEAD_COUNT === 0) {
        setRound(r => r + 1);
      }
      return newCount;
    });
  };

  const currentBead = count % BEAD_COUNT;

  return (
    <div className="w-[300px] h-[640px] rounded-[3.5rem] border-[10px] border-[#1a1a1a] bg-[#FFF8F0] shadow-2xl relative overflow-hidden ring-1 ring-white/10 flex flex-col items-center transform transition-transform duration-700 hover:scale-[1.02]">
      {/* Notch */}
      <div className="absolute top-0 w-36 h-7 bg-[#1a1a1a] rounded-b-3xl z-50"></div>

      {/* Decorative Mandala Corner Patterns (top-right & bottom-left) */}
      <img src="/mandala.webp" alt="" className="absolute -top-14 -right-14 w-48 h-48 opacity-25 pointer-events-none z-[1]" style={{ filter: 'sepia(1) hue-rotate(15deg) saturate(2) brightness(0.8)' }} />
      <img src="/mandala.webp" alt="" className="absolute -bottom-14 -left-14 w-48 h-48 opacity-25 pointer-events-none z-[1]" style={{ filter: 'sepia(1) hue-rotate(15deg) saturate(2) brightness(0.8)' }} />

      {/* Screen content */}
      <div className="w-full h-full pt-12 px-0 flex flex-col relative z-20">

        {/* Main Content Area */}
        <div className="flex-1 relative flex flex-col items-center w-full">

          {/* Center Dashboard Card */}
          <div className="absolute top-[22%] left-1/2 -translate-x-1/2 w-[75%] max-w-[220px] bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] border-t-[3px] border-[#FFCC80] overflow-hidden z-30 flex flex-col">
            <div className="flex items-center h-[46px] border-b border-[#E0E0E0]">
              <div className="flex-1 flex justify-center items-center h-full border-r border-[#E0E0E0] text-[#585858]">
                <Timer className="w-5 h-5" />
              </div>
              <div className="flex-[1.5] flex flex-col items-center justify-center h-full border-r border-[#E0E0E0]">
                <div className="flex items-baseline gap-1">
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={currentBead}
                      initial={{ y: -5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 5, opacity: 0 }}
                      className="text-xl font-bold text-[#222] leading-none"
                    >
                      {currentBead}
                    </motion.span>
                  </AnimatePresence>
                  <span className="text-[10px] text-[#999] font-medium">of {BEAD_COUNT}</span>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setCount(0); setRound(1); }}
                className="flex-1 flex justify-center items-center h-full text-[#585858] hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
            <div className="py-5 px-3 flex items-center justify-center">
              <h2 className="text-lg font-medium text-[#222] text-center leading-relaxed">" ॐ 'हनुमते नमः "</h2>
            </div>
          </div>

          {/* Controls (Music / Settings / Volume) */}
          <div className="absolute top-[55%] flex items-center justify-center gap-3 w-full z-30">
            <div className="w-10 h-10 rounded-xl bg-white shadow-[0_2px_3px_rgba(0,0,0,0.15)] flex items-center justify-center text-[#8D6E63] cursor-pointer hover:scale-105 transition-transform"><Music className="w-5 h-5" /></div>
            <div className="w-14 h-14 rounded-2xl bg-white shadow-[0_3px_4px_rgba(0,0,0,0.2)] flex items-center justify-center text-[#555] cursor-pointer scale-110 z-10"><Settings className="w-7 h-7" /></div>
            <div className="w-10 h-10 rounded-xl bg-white shadow-[0_2px_3px_rgba(0,0,0,0.15)] flex items-center justify-center text-[#8D6E63] cursor-pointer hover:scale-105 transition-transform"><Volume2 className="w-5 h-5" /></div>
          </div>

          {/* Tap Button */}
          <div className="absolute bottom-[30px] w-full flex justify-center items-center z-30">
            <motion.button
              onClick={handleTap}
              whileTap={{ scale: 0.92 }}
              className="relative w-[70px] h-[70px] rounded-full border-4 border-[#FFE082] bg-[#FFF8E1] shadow-[0_2px_5px_rgba(0,0,0,0.25)] flex items-center justify-center hover:scale-105 transition-transform"
            >
              <div className="w-[52px] h-[52px] rounded-full bg-white shadow-sm flex items-center justify-center relative overflow-hidden group">
                <motion.div
                  key={count}
                  initial={false}
                  animate={{ scale: [1, 1.3, 1], opacity: [0, 0.4, 0] }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 bg-[#FF9933]/20 rounded-full pointer-events-none"
                />
                <Hand className="w-7 h-7 text-[#FF9933] group-hover:scale-110 transition-transform" />
              </div>
            </motion.button>
            <motion.div animate={{ scale: [1, 1.4], opacity: [0.4, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute w-[70px] h-[70px] rounded-full bg-[#FFCC80]/40 blur-sm pointer-events-none"></motion.div>
          </div>
        </div>
      </div>

      {/* Mala Bead Ring - Stadium Shape with Real Rudraksha Images */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {Array.from({ length: BEAD_COUNT }).map((_, i) => {
          const { x, y } = getBeadPosition(i, count);
          return (
            <motion.div
              key={i}
              initial={false}
              animate={{ x, y }}
              transition={{ type: "spring", stiffness: 100, damping: 18 }}
              className="absolute"
              style={{ width: BEAD_SIZE, height: BEAD_SIZE, left: '50%', top: '50%', marginLeft: -BEAD_SIZE / 2, marginTop: -BEAD_SIZE / 2 }}
            >
              <img
                src="/rudraksha.webp"
                alt=""
                className="w-full h-full object-contain drop-shadow-md"
                draggable={false}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
