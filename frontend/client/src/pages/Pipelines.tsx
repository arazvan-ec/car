/**
 * Página: Pipelines — Lista filtrable por tipo (análisis o comparativa).
 */
import { Link } from "wouter";
import { useApiData, type PipelineRunSummary } from "@/hooks/useApi";
import Layout from "@/components/Layout";
import { PageHeader, EmptyState, ErrorState } from "@/components/ui-custom";
import {
  CheckCircle2, Clock, AlertCircle, RefreshCw, ExternalLink, GitCompare, Car,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  completed: { label: "Completado",    color: "text-green-600 bg-green-50 border-green-200",  icon: CheckCircle2 },
  pending:   { label: "Pendiente",     color: "text-amber-600 bg-amber-50 border-amber-200",  icon: Clock },
  running:   { label: "En ejecución",  color: "text-blue-600 bg-blue-50 border-blue-200",     icon: RefreshCw },
  stale:     { label: "Desactualizado",color: "text-orange-600 bg-orange-50 border-orange-200",icon: AlertCircle },
  failed:    { label: "Fallido",       color: "text-red-600 bg-red-50 border-red-200",        icon: AlertCircle },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${cfg.color}`}>
      <Icon className="w-3 h-3" />
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
            <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : !runs?.length ? (
        <EmptyState message={`No hay ${filter === "vehicle_comparison" ? "comparativas" : "pipelines"} aún`} />
      ) : (
        <div className="space-y-3">
          {runs.map(run => {
            const subject = run.subject_data as Record<string, string>;
            const title = run.pipeline_type === "vehicle_comparison"
              ? "Comparativa"
              : [subject.brand, subject.model, subject.year, subject.trim].filter(Boolean).join(" ") || run.subject_type;
            const Icon = run.pipeline_type === "vehicle_comparison" ? GitCompare : Car;
            return (
              <Link key={run.id} href={`${detailBase}/${run.id}`}>
                <div className="rounded-xl border border-border bg-card p-5 hover:shadow-sm transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-semibold text-sm">{title}</span>
                        <StatusBadge status={run.status} />
                        {run.skill_version && (
                          <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded border border-border">
                            {run.skill_version}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mb-3">
                        {run.pipeline_type} · {new Date(run.created_at).toLocaleDateString("es-ES")}
                      </p>
                      <ProgressBar
                        completed={run.steps_completed}
                        total={run.steps_total}
                        stale={run.steps_stale}
                        failed={run.steps_failed}
                      />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono font-semibold text-foreground">
                        {run.steps_completed}/{run.steps_total}
                      </p>
                      <p className="text-[10px] text-muted-foreground">pasos</p>
                      {run.steps_stale > 0 && (
                        <p className="text-[10px] text-orange-500 mt-0.5">{run.steps_stale} stale</p>
                      )}
                      <ExternalLink className="w-3 h-3 text-muted-foreground mt-1 ml-auto" />
                    </div>
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
