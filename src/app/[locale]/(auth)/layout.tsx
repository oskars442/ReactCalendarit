export const dynamic = "force-dynamic";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // No header, no footer, no container — let the page be full-bleed
  return <>{children}</>;
}
