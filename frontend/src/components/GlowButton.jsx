export default function GlowButton({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 border hover:scale-105 min-w-[120px] text-base font-light px-8 py-3 border-green-500 bg-neutral-800 text-white hover:bg-neutral-700 hover:text-white shadow-[0_0_15px_rgba(34,197,94,0.5)] hover:shadow-[0_0_20px_rgba(34,197,94,0.7)] transition-all duration-300"
    >
      {children}
    </button>
  );
}
