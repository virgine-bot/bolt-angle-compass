export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <polygon points="16,2 28.1,9 28.1,23 16,30 3.9,23 3.9,9" className="fill-foreground" />
      <circle cx="16" cy="16" r="5" className="fill-none stroke-primary" strokeWidth="2.5" />
      <line x1="16" y1="16" x2="16" y2="6" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
