/** Shared GradeChum-inspired theme for app shell, auth, and user surfaces. */
export function ChumTheme({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`chum-app student-chum w-full min-w-0 ${className}`}>
      {children}
    </div>
  );
}
