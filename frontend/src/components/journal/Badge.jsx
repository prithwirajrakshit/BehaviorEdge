export function OutcomeBadge({ outcome }) {
  const styles = {
    Win: "bg-[#dcfce7] dark:bg-[#14532d] text-[#15803d] dark:text-[#4ade80] border border-[#86efac] dark:border-[#166534] px-2 py-0.5 text-xs font-semibold rounded-full",
    Loss: "bg-[#fee2e2] dark:bg-[#7f1d1d] text-[#dc2626] dark:text-[#f87171] border border-[#fca5a5] dark:border-[#991b1b] px-2 py-0.5 text-xs font-semibold rounded-full",
    Breakeven: "bg-[#f1f5f9] dark:bg-[#262626] text-[#475569] dark:text-[#d4d4d4] border border-[#cbd5e1] dark:border-[#404040] px-2 py-0.5 text-xs font-semibold rounded-full",
    Running: "bg-[#dbeafe] dark:bg-[#1e3a8a] text-[#1d4ed8] dark:text-[#60a5fa] border border-[#93c5fd] dark:border-[#1e40af] px-2 py-0.5 text-xs font-semibold rounded-full"
  };
  return <span className={styles[outcome] || styles.Running}>{outcome}</span>;
}
export function DirectionBadge({ direction }) {
  const styles = {
    Long: "bg-[#dcfce7] dark:bg-green-500/10 text-[#15803d] dark:text-green-400 border border-[#86efac] dark:border-green-500/20 px-2 py-0.5 text-xs font-medium rounded",
    Short: "bg-[#fee2e2] dark:bg-red-500/10 text-[#dc2626] dark:text-red-400 border border-[#fca5a5] dark:border-red-500/20 px-2 py-0.5 text-xs font-medium rounded"
  };
  return <span className={styles[direction]}>{direction}</span>;
}
export function SessionBadge({ session }) {
  if (!session) {
    return <span className="text-gray-400 dark:text-gray-600 font-sans text-xs">—</span>;
  }
  const styles = {
    London: "bg-[#f3e8ff] dark:bg-purple-500/10 text-[#7e22ce] dark:text-purple-400 border border-[#d8b4fe] dark:border-purple-500/20 px-1.5 py-0.5 text-[11px] font-mono rounded",
    "New York": "bg-[#dbeafe] dark:bg-blue-500/10 text-[#1d4ed8] dark:text-blue-400 border border-[#93c5fd] dark:border-blue-500/20 px-1.5 py-0.5 text-[11px] font-mono rounded",
    Asia: "bg-[#f1f5f9] dark:bg-neutral-500/10 text-[#475569] dark:text-neutral-400 border border-[#cbd5e1] dark:border-neutral-500/20 px-1.5 py-0.5 text-[11px] font-mono rounded",
    "London-NY Overlap": "bg-[#fce7f3] dark:bg-pink-500/10 text-[#be185d] dark:text-pink-400 border border-[#fbcfe8] dark:border-pink-500/20 px-1.5 py-0.5 text-[11px] font-mono rounded"
  };
  return <span className={styles[session]}>{session}</span>;
}
