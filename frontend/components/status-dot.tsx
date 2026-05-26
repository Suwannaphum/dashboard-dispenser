export function StatusDot({ online }: { online: boolean }) {
  return <span className={`h-2.5 w-2.5 rounded-full ${online ? "bg-emerald-400 shadow-[0_0_12px_#34d399]" : "bg-zinc-600"}`} />;
}
