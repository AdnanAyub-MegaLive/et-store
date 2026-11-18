"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { Download, Search, ShieldCheck } from "lucide-react";
import type { HomeContent } from "@/lib/home-content-schema";

// Icons and colours stay fixed; titles and text come from admin → Home page.
const LOOK = [
  { icon: Search, color: "from-violet-500 to-fuchsia-500" },
  { icon: ShieldCheck, color: "from-pink-500 to-orange-400" },
  { icon: Download, color: "from-cyan-400 to-emerald-400" },
];
const N = LOOK.length;
type Content = HomeContent["howItWorks"];
const Ctx = createContext<Content | null>(null);
function useContent() {
  const c = useContext(Ctx);
  if (!c) throw new Error("HowItWorks content missing");
  return c;
}
function useSteps() {
  return useContent().steps.slice(0, N).map((s, i) => ({ ...s, ...LOOK[i] }));
}
const FADE = 0.12; // portion of progress used to cross-fade between steps

/** Progress window for step i, padded so neighbours overlap and cross-fade. */
function range(i: number): [number, number, number, number] {
  const start = i / N;
  const end = (i + 1) / N;
  return [start - FADE / 2, start + FADE / 2, end - FADE / 2, end + FADE / 2];
}

function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setDesktop(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return desktop;
}

function StepText({ i, progress }: { i: number; progress: MotionValue<number> }) {
  const [a, b, c, d] = range(i);
  const first = i === 0, last = i === N - 1;
  const opacity = useTransform(progress, [a, b, c, d], [first ? 1 : 0.35, 1, 1, last ? 1 : 0.35]);
  const x = useTransform(progress, [a, b, c, d], [0, 8, 8, last ? 8 : 0]);
  const dot = useTransform(progress, [a, b], [first ? 1 : 0.6, 1]);
  const s = useSteps()[i];
  return (
    <motion.div style={{ opacity, x }} className="relative">
      <motion.span style={{ scale: dot }} className={`absolute -left-[38px] top-0.5 grid size-5 place-items-center rounded-full bg-gradient-to-br ${s.color} text-[10px] font-bold text-white shadow-[0_0_0_4px_#10101c]`}>
        {i + 1}
      </motion.span>
      <h3 className="text-lg font-semibold">{s.title}</h3>
      <p className="mt-1 text-sm leading-6 text-white/60">{s.text}</p>
    </motion.div>
  );
}

function StepVisual({ i, progress }: { i: number; progress: MotionValue<number> }) {
  const [a, b, c, d] = range(i);
  const first = i === 0, last = i === N - 1;
  const opacity = useTransform(progress, [a, b, c, d], [first ? 1 : 0, 1, 1, last ? 1 : 0]);
  const y = useTransform(progress, [a, b, c, d], [first ? 0 : 60, 0, 0, last ? 0 : -60]);
  const scale = useTransform(progress, [a, b, c, d], [first ? 1 : 0.9, 1, 1, last ? 1 : 0.9]);
  const rotate = useTransform(progress, [a, b, c, d], [first ? 0 : 4, 0, 0, last ? 0 : -4]);
  const s = useSteps()[i];
  return (
    <motion.div
      style={{ opacity, y, scale, rotate }}
      className="absolute inset-0 flex flex-col items-center justify-center gap-5 rounded-[18px] border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur"
    >
      <span className={`grid size-20 place-items-center rounded-3xl bg-gradient-to-br ${s.color} shadow-[0_20px_40px_-12px_rgba(236,72,153,0.5)]`}>
        <s.icon className="size-9 text-white" />
      </span>
      <p className="text-xs font-semibold tracking-[2px] text-white/50">STEP {i + 1} OF {N}</p>
      <p className="text-2xl font-semibold">{s.title}</p>
      <p className="max-w-xs text-center text-sm text-white/70">{s.text}</p>
    </motion.div>
  );
}

function Shell({ children, visual }: { children: React.ReactNode; visual?: React.ReactNode }) {
  const content = useContent();
  return (
    <section className="relative grid w-full items-center gap-12 overflow-hidden rounded-[18px] bg-[#10101c] p-8 dark:border dark:border-white/10 text-on-brand sm:p-12 lg:min-h-[500px] lg:grid-cols-2">
      <div aria-hidden className="aurora-blob -left-20 -top-20 size-72 bg-fuchsia-600/30" />
      <div aria-hidden className="aurora-blob -bottom-24 right-10 size-72 bg-cyan-500/20 [animation-delay:-8s]" />
      <div className="relative">
        {content.eyebrow && <p className="text-sm font-semibold tracking-[1.4px] text-brand-soft/70">{content.eyebrow}</p>}
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.75px]">{content.title}</h2>
        {children}
      </div>
      {visual}
    </section>
  );
}

/** Scroll-driven walkthrough: the section sticks while a spring-smoothed progress cross-fades the steps. */
export function HowItWorks({ content }: { content: Content }) {
  return (
    <Ctx.Provider value={content}>
      <HowItWorksInner />
    </Ctx.Provider>
  );
}

function HowItWorksInner() {
  const STEPS = useSteps();
  const desktop = useIsDesktop();
  const reduced = useReducedMotion();
  // Mobile, tablet and reduced-motion visitors get a calm static list.
  if (desktop && !reduced) return <AnimatedHowItWorks />;
  {
    return (
      <div className="mt-24 w-full">
        <Shell>
          <div className="mt-10 flex flex-col gap-8">
            {STEPS.map((s, i) => (
              <div key={i} className="flex gap-4">
                <span className={`grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${s.color}`}><s.icon className="size-5" /></span>
                <div>
                  <h3 className="text-lg font-semibold">{i + 1}. {s.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-white/60">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </Shell>
      </div>
    );
  }
}

/** Own component so useScroll only runs once its target element is actually mounted. */
function AnimatedHowItWorks() {
  const STEPS = useSteps();
  const wrap = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start start", "end end"] });
  // Spring smoothing removes the jitter of raw scroll steps (mouse wheels, trackpads).
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.6, restDelta: 0.0005 });
  const bar = useTransform(progress, [0, 1], [0, 1]);

  return (
    // Tall wrapper = scroll distance; the inner section is sticky while it plays.
    <div ref={wrap} className="relative mt-24 h-[260vh] w-full">
      <div className="sticky top-[max(6rem,calc(50vh-250px))]">
        <Shell
          visual={
            <div className="relative h-80 [perspective:900px]">
              {STEPS.map((s, i) => <StepVisual key={i} i={i} progress={progress} />)}
            </div>
          }
        >
          <div className="relative mt-10 flex flex-col gap-9 pl-10">
            <span className="absolute bottom-3 left-[9px] top-3 w-0.5 rounded bg-white/10" />
            <motion.span style={{ scaleY: bar }} className="absolute bottom-3 left-[9px] top-3 w-0.5 origin-top rounded bg-gradient-to-b from-violet-400 via-pink-400 to-cyan-300" />
            {STEPS.map((s, i) => <StepText key={i} i={i} progress={progress} />)}
          </div>
        </Shell>
      </div>
    </div>
  );
}
