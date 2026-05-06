import { cn } from "@/lib/utils";

export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "text-sm", md: "text-base", lg: "text-xl" };
  return (
    <div className={cn("flex items-center gap-2 font-semibold", sizes[size])}>
      <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center">
        <span className="text-xs text-white font-bold">F</span>
      </div>
      <span className="text-text-primary">Founder<span className="text-accent-bright">OS</span></span>
    </div>
  );
}
