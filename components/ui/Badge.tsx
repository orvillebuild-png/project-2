import { cn } from "@/lib/utils";

const tones = {
  green: "bg-[#dcf8ea] text-[#13734a]",
  amber: "bg-[#fff0b9] text-[#735400]",
  coral: "bg-[#ffe1da] text-coral",
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
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[0.7rem] font-semibold", tones[tone])}>
      {children}
    </span>
  );
}
