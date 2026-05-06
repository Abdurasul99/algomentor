/**
 * Auth layout — standalone, no sidebar.
 * The root layout's AppShellWrapper detects /auth/* routes and skips
 * rendering the sidebar/topbar, so children are rendered directly.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
