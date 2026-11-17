import { MotionEffects } from "@/components/motion-effects";

export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-fade-in">
      <MotionEffects>{children}</MotionEffects>
    </div>
  );
}
