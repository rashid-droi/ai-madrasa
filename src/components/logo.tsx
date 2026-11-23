export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const box = size === "lg" ? "h-12 w-12 rounded-2xl" : "h-9 w-9 rounded-xl";
  const icon = size === "lg" ? "h-6 w-6" : "h-5 w-5";
  return (
    <span className={`inline-flex items-center justify-center bg-brand-600 text-white ${box}`}>
      {/* open book */}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={icon} aria-hidden>
        <path d="M2 5.5C4.5 4 8 4 12 6c4-2 7.5-2 10-.5V19c-2.5-1.5-6-1.5-10 .5-4-2-7.5-2-10-.5V5.5Z" strokeLinejoin="round" />
        <path d="M12 6v13.5" />
      </svg>
    </span>
  );
}
