import { NavLink, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export function AppShell() {
  return (
    <div className="min-h-screen bg-page">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded-control focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <span className="text-base font-semibold text-primary">FormBoundary</span>
            <nav aria-label="Main">
              <NavLink
                to="/forms"
                className={({ isActive }) =>
                  `rounded-control px-2 py-1 text-sm ${isActive ? 'bg-page font-medium' : 'text-muted hover:text-ink'}`
                }
              >
                Forms
              </NavLink>
            </nav>
          </div>
          {/* Real sign-out is wired on Day 13 (auth) */}
          <Button variant="ghost" disabled>
            Sign out
          </Button>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
