import { MotionEffects } from "@/components/motion-effects";
import { AuroraBackground } from "@/components/aurora";

// Re-mounts on every navigation, so each page gets a fresh fade-in and its own Motion effects.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-fade-in relative isolate">
      <AuroraBackground />
      <MotionEffects>{children}</MotionEffects>
    </div>
  );
}

