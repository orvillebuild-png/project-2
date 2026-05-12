import { cn } from "@/lib/utils";

const tones = {
  green: "bg-[#edf7f0] text-moss",
  amber: "bg-[#fff5df] text-amber",
  coral: "bg-[#fff0ed] text-coral",
  gray: "bg-field text-muted"
};

export function Badge({
  children,
  tone = "gray"
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
}) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone])}>
      {children}
    </span>
  );
}
