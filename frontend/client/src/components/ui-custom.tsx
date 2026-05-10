/**
 * Componentes UI específicos del dominio Car Analytics
 * Diseño: Automotive Premium Light
 */
import { cn } from "@/lib/utils";
import { Star, AlertCircle, Inbox } from "lucide-react";

// ── DGT Label Badge ───────────────────────────────────────────────────────────
const DGT_COLORS: Record<string, string> = {
  ECO:  "bg-green-50 text-green-700 border-green-200 ring-green-100",
  CERO: "bg-blue-50 text-blue-700 border-blue-200 ring-blue-100",
  C:    "bg-yellow-50 text-yellow-700 border-yellow-200 ring-yellow-100",
  B:    "bg-orange-50 text-orange-700 border-orange-200 ring-orange-100",
};

export function DgtBadge({ label }: { label: string }) {
  const colors = DGT_COLORS[label?.toUpperCase()] ?? "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold font-mono border tracking-wider", colors)}>
      {label}
    </span>
  );
}

// ── Fuel Type Badge ───────────────────────────────────────────────────────────
const FUEL_COLORS: Record<string, string> = {
  FHEV:     "bg-emerald-50 text-emerald-700 border-emerald-200",
  PHEV:     "bg-teal-50 text-teal-700 border-teal-200",
  BEV:      "bg-sky-50 text-sky-700 border-sky-200",
  MHEV:     "bg-lime-50 text-lime-700 border-lime-200",
  Gasolina: "bg-amber-50 text-amber-700 border-amber-200",
  Diésel:   "bg-stone-50 text-stone-600 border-stone-200",
};

export function FuelBadge({ type }: { type: string }) {
  const colors = FUEL_COLORS[type] ?? "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border", colors)}>
      {type}
    </span>
  );
}

// ── Star Rating ───────────────────────────────────────────────────────────────
export function StarRating({ value, max = 5 }: { value: number | null; max?: number }) {
  if (value === null) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn("w-3 h-3", i < value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")}
        />
      ))}
      <span className="ml-1 text-xs font-mono text-muted-foreground">{value}/{max}</span>
    </span>
  );
}

// ── Press Rating Bar ──────────────────────────────────────────────────────────
export function PressRatingBar({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground text-xs">—</span>;
  const pct = (value / 10) * 100;
  const color = value >= 8 ? "bg-green-500" : value >= 6 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono font-medium">{value.toFixed(1)}</span>
    </div>
  );
}

// ── Skeleton Card ─────────────────────────────────────────────────────────────
export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 animate-pulse">
      <div className="h-3 w-24 bg-muted rounded mb-3" />
      <div className="h-8 w-16 bg-muted rounded mb-2" />
      <div className="h-2 w-32 bg-muted rounded" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-muted rounded w-full" />
        </td>
      ))}
    </tr>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ message = "No hay datos disponibles" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Inbox className="w-10 h-10 text-muted-foreground/40 mb-3" />
      <p className="text-sm text-muted-foreground">{message}</p>
      <p className="text-xs text-muted-foreground/60 mt-1">Los datos aparecerán aquí cuando Manus realice análisis</p>
    </div>
  );
}

// ── Error State ───────────────────────────────────────────────────────────────
export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertCircle className="w-10 h-10 text-destructive/60 mb-3" />
      <p className="text-sm font-medium text-destructive">Error al cargar datos</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs">{message}</p>
      <p className="text-xs text-muted-foreground/60 mt-2">Verifica que VITE_API_URL y VITE_API_KEY están configuradas</p>
    </div>
  );
}

// ── Page Header ───────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, children }: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, accent = false }: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-xl border p-5 transition-shadow hover:shadow-sm",
      accent ? "border-primary/20 bg-primary/5" : "border-border bg-card"
    )}>
      <p className="stat-label">{label}</p>
      <p className={cn("stat-value mt-1.5", accent && "text-primary")}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}
