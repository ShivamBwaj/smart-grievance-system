import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
                <rect x="4" y="4" width="24" height="5" rx="1.5" fill="currentColor" opacity="0.7" />
                <rect x="11" y="11" width="10" height="4" rx="1" fill="currentColor" opacity="0.5" />
                <rect x="12" y="17" width="8" height="4" rx="1" fill="#c2703e" opacity="0.4" />
                <rect x="13" y="23" width="6" height="4" rx="1" fill="#c2703e" opacity="0.7" />
              </svg>
              <span className="text-sm font-medium text-muted-foreground" style={{ fontFamily: "var(--font-display)" }}>
                CivicLens
              </span>
            </Link>
            <p className="text-xs text-muted">&copy; 2026 CivicLens · GCC Chennai</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/citizen" className="text-xs text-muted hover:text-muted-foreground transition-colors">
              Intake
            </Link>
            <Link href="/ops" className="text-xs text-muted hover:text-muted-foreground transition-colors">
              Ops
            </Link>
            <span className="text-xs text-muted">BT1P1 · VITISH&apos;26</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
