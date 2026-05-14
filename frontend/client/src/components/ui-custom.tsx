/**
 * Componentes UI específicos del dominio Car Analytics
 * Diseño: Automotive Premium Light
 */
import { cn } from "@/lib/utils";
import { AlertCircle, Inbox } from "lucide-react";

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 animate-pulse">
      <div className="h-3 w-24 bg-muted rounded mb-3" />
      <div className="h-8 w-16 bg-muted rounded mb-2" />
      <div className="h-2 w-32 bg-muted rounded" />
    </div>
  );
}

export function EmptyState({ message = "No hay datos disponibles" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Inbox className="w-10 h-10 text-muted-foreground/40 mb-3" />
      <p className="text-sm text-muted-foreground">{message}</p>
      <p className="text-xs text-muted-foreground/60 mt-1">Los datos aparecerán aquí cuando el skill realice análisis</p>
    </div>
  );
}

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

export function PageHeader({ title, subtitle, children }: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 flex-wrap mb-8">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground break-words">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1 break-words">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}

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
