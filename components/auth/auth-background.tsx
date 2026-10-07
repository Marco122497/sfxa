/** Soft mesh backdrop for auth and splash screens. */
export function AuthBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden bg-background"
    >
      <div className="absolute -top-24 -left-16 size-[28rem] rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute top-1/3 -right-24 size-[22rem] rounded-full bg-[color:var(--chum-amber)]/15 blur-3xl" />
      <div className="absolute -bottom-32 left-1/3 size-[26rem] rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,color-mix(in_srgb,var(--background)_35%,transparent))]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,var(--background)_88%)]" />
    </div>
  );
}
