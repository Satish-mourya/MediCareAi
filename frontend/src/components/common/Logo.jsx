export default function Logo({ className = 'h-8 w-auto' }) {
  return (
    <div className="flex items-center gap-2">
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="11" fill="#146356" />
        <path
          d="M6 21H12L15 12L20 29L24 17L27 21H34"
          stroke="#F6F9F8"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-display text-lg font-bold tracking-tight text-ink">
        Medi<span className="text-teal-700">Care</span> AI
      </span>
    </div>
  );
}
