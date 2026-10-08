/** Slanted-square vector backdrop for the login and splash screens. */
export function AuthBackground() {
  const cols = 18;
  const rows = 22;
  const size = 5.2;
  const gap = 1.1;
  const step = size + gap;
  const originX = -6;
  const originY = -8;

  const squares = Array.from({ length: rows * cols }, (_, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    return {
      key: `sq-${i}`,
      x: originX + col * step,
      y: originY + row * step,
      size,
    };
  });

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_8%_-8%,_rgb(70_95_255_/_0.1),_transparent_52%),radial-gradient(80%_60%_at_100%_100%,_rgb(122_90_248_/_0.08),_transparent_48%)] dark:bg-[radial-gradient(120%_80%_at_8%_-8%,_rgb(117_146_255_/_0.14),_transparent_52%),radial-gradient(80%_60%_at_100%_100%,_rgb(155_138_251_/_0.1),_transparent_48%)]" />

      <svg
        className="absolute -inset-[24%] size-[148%] text-primary/10 dark:text-primary/20"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <g transform="rotate(-22 50 50)">
          {squares.map((square) => (
            <rect
              key={square.key}
              x={square.x}
              y={square.y}
              width={square.size}
              height={square.size}
              stroke="currentColor"
              strokeWidth="0.12"
            />
          ))}
        </g>
      </svg>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_22%,_var(--background)_95%)]" />
    </div>
  );
}
