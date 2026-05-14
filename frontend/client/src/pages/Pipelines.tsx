/**
 * Página: Pipelines — Lista filtrable por tipo (análisis o comparativa).
 * UX/UI: tarjetas con preview de specs clave, badges de progreso y estado,
 * y resumen compacto para comparativas (coches incluidos).
 */
import { Link } from "wouter";
import { useApiData, type PipelineRunSummary } from "@/hooks/useApi";
import Layout from "@/components/Layout";
import { PageHeader, EmptyState, ErrorState } from "@/components/ui-custom";
import {
  CheckCircle2, Clock, AlertCircle, RefreshCw, GitCompare, Car,
  Zap, Disc, Fuel, Tag, ChevronRight,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  completed: { label: "Completado",    color: "text-green-700 bg-green-50 border-green-200",  icon: CheckCircle2 },
  pending:   { label: "Pendiente",     color: "text-amber-700 bg-amber-50 border-amber-200",  icon: Clock },
  running:   { label: "En ejecución",  color: "text-blue-700 bg-blue-50 border-blue-200",     icon: RefreshCw },
  stale:     { label: "Desactualizado",color: "text-orange-700 bg-orange-50 border-orange-200",icon: AlertCircle },
  failed:    { label: "Fallido",       color: "text-red-700 bg-red-50 border-red-200",        icon: AlertCircle },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${cfg.color}`}>
      <Icon className={`w-3 h-3 ${status === "running" ? "animate-spin" : ""}`} />
      {cfg.label}
    </span>
  );
}

function ProgressBar({ completed, total, stale, failed }: { completed: number; total: number; stale: number; failed: number }) {
  if (total === 0) return null;
  const completedPct = (completed / total) * 100;
  const stalePct = (stale / total) * 100;
  const failedPct = (failed / total) * 100;
  return (
    <div className="w-full h-1.5 bg-border rounded-full overflow-hidden flex">
      <div className="h-full bg-green-500 transition-all" style={{ width: `${completedPct}%` }} />
      <div className="h-full bg-orange-400 transition-all" style={{ width: `${stalePct}%` }} />
      <div className="h-full bg-red-400 transition-all" style={{ width: `${failedPct}%` }} />
    </div>
  );
}

function MetaChip({ icon: Icon, value }: { icon: React.ElementType; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
      <Icon className="w-3 h-3" />{value}
    </span>
  );
}

function SubjectPreview({ run }: { run: PipelineRunSummary }) {
  const s = run.subject_data as Record<string, unknown>;
  if (run.pipeline_type === "vehicle_comparison") {
    const vehicles = (s.vehicles as Array<{ brand?: string; model?: string; trim?: string }> | undefined) ?? [];
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <MetaChip icon={GitCompare} value={`${vehicles.length} coches`} />
        {vehicles.slice(0, 3).map((v, i) => (
          <span key={i} className="text-[11px] text-muted-foreground">
            {[v.brand, v.model, v.trim].filter(Boolean).join(" ") || "coche"}
            {i < Math.min(vehicles.length, 3) - 1 ? " · " : ""}
          </span>
        ))}
        {vehicles.length > 3 && <span className="text-[11px] text-muted-foreground">+{vehicles.length - 3}</span>}
      </div>
    );
  }
  const fuel = typeof s.fuel_type === "string" ? s.fuel_type : undefined;
  const cv = typeof s.horsepower === "number" ? s.horsepower : undefined;
  const wheels = typeof s.wheel_size_inches === "number" ? s.wheel_size_inches : undefined;
  const price = typeof s.list_price_eur === "number" ? s.list_price_eur :
                typeof s.estimated_street_price_eur === "number" ? s.estimated_street_price_eur : undefined;
  const segment = typeof s.segment === "string" ? s.segment : undefined;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {segment && <MetaChip icon={Car} value={segment} />}
      {cv !== undefined && <MetaChip icon={Zap} value={`${cv} CV`} />}
      {wheels !== undefined && <MetaChip icon={Disc} value={`${wheels}"`} />}
      {fuel && <MetaChip icon={Fuel} value={fuel} />}
      {price !== undefined && (
        <MetaChip icon={Tag} value={new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(price)} />
      )}
    </div>
  );
}

type Filter = "all" | "vehicle_analysis" | "vehicle_comparison";

const TITLES: Record<Filter, { title: string; subtitle: (n: number) => string }> = {
  all:                 { title: "Pipelines",    subtitle: n => `${n} runs registrados` },
  vehicle_analysis:    { title: "Análisis",     subtitle: n => `${n} vehículos analizados` },
  vehicle_comparison:  { title: "Comparativas", subtitle: n => `${n} comparativas` },
};

export default function PipelinesPage({ filter = "all", basePath }: { filter?: Filter; basePath?: string }) {
  const queryParam = filter === "all" ? "" : `&pipeline_type=${filter}`;
  const { data: runs, loading, error } = useApiData<PipelineRunSummary[]>(
    `/api/v1/pipelines/runs/?limit=100${queryParam}`
  );

  const meta = TITLES[filter];
  const detailBase = basePath ?? "/pipelines";

  return (
    <Layout>
      <PageHeader
        title={meta.title}
        subtitle={meta.subtitle(runs?.length ?? 0)}
      />

      {error ? <ErrorState message={error} />
      : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : !runs?.length ? (
        <EmptyState message={`No hay ${filter === "vehicle_comparison" ? "comparativas" : "pipelines"} aún`} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {runs.map(run => {
            const subject = run.subject_data as Record<string, string>;
            const title = run.pipeline_type === "vehicle_comparison"
              ? "Comparativa"
              : [subject.brand, subject.model, subject.year, subject.trim].filter(Boolean).join(" ") || run.subject_type;
            const Icon = run.pipeline_type === "vehicle_comparison" ? GitCompare : Car;
            return (
              <Link key={run.id} href={`${detailBase}/${run.id}`}>
                <div className="group rounded-xl border border-border bg-card p-4 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{title}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          {new Date(run.created_at).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={run.status} />
                  </div>

                  <div className="mb-3">
                    <SubjectPreview run={run} />
                  </div>

                  <div className="flex items-center gap-2 mb-1.5">
                    <ProgressBar
                      completed={run.steps_completed}
                      total={run.steps_total}
                      stale={run.steps_stale}
                      failed={run.steps_failed}
                    />
                    <p className="text-[11px] font-mono font-semibold text-foreground tabular-nums shrink-0">
                      {run.steps_completed}/{run.steps_total}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="font-mono">{run.skill_version ?? run.pipeline_type}</span>
                    <span className="inline-flex items-center gap-0.5 group-hover:text-primary transition-colors">
                      Ver detalle <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Layout>
  );
}

export function Analyses()    { return <PipelinesPage filter="vehicle_analysis"   basePath="/analyses" />; }
export function Comparisons() { return <PipelinesPage filter="vehicle_comparison" basePath="/comparisons" />; }
