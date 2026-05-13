/**
 * Layout principal — Automotive Premium Light
 * Sidebar oscuro (slate-900) + área de contenido clara (off-white)
 */
import { Link, useLocation } from "wouter";
import {
  BarChart3,
  Car,
  GitCompare,
  LayoutDashboard,
  Activity,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analyses", label: "Análisis", icon: Car },
  { href: "/comparisons", label: "Comparativas", icon: GitCompare },
  { href: "/stats", label: "Estadísticas", icon: BarChart3 },
  { href: "/pipelines", label: "Pipelines", icon: Workflow },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Sidebar ── */}
      <aside className="hidden md:flex w-60 flex-col fixed inset-y-0 left-0 z-50"
             style={{ background: "var(--color-sidebar)" }}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-sidebar-border">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-sidebar-foreground leading-none">Car Analytics</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-mono uppercase tracking-wider">Dashboard</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = location === href || (href !== "/" && location.startsWith(href));
            return (
              <Link key={href} href={href}>
                <span className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-sidebar-border">
          <p className="text-[10px] text-muted-foreground font-mono">v1.0 · car-configurator-skill</p>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 h-14 flex items-center px-4 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm">Car Analytics</span>
        </div>
        <nav className="ml-auto flex gap-1">
          {NAV.map(({ href, icon: Icon }) => (
            <Link key={href} href={href}>
              <span className={cn(
                "p-2 rounded-md transition-colors",
                (location === href || (href !== "/" && location.startsWith(href)))
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}>
                <Icon className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </nav>
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 md:pl-60 pt-14 md:pt-0">
        <div className="min-h-screen p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
