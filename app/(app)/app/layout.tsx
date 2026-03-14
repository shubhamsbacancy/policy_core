/**
 * Pass-through layout for /app segment. The protected AppShell is already
 * provided by (app)/layout.tsx; do not nest it again or content renders twice.
 */
export default function AppSegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
