/**
 * Página: Pipelines — Lista de runs con estado de pasos
 * Diseño: Automotive Premium Light
 */
import { Link } from "wouter";
import { useApiData } from "@/hooks/useApi";
import Layout from "@/components/Layout";
import { PageHeader, EmptyState, ErrorState } from "@/components/ui-custom";
import { CheckCircle2, Clock, AlertCircle, RefreshCw, Zap, ExternalLink } from "lucide-react";

interface PipelineRun {
  id: string;
  pipeline_type: string;
  subject_type: string;
  subject_data: Record<string, unknown>;
  status: string;
  skill_version: string | null;
  created_at: string;
  updated_at: string;
  steps_total: number;
  steps_completed: number;
  steps_pending: number;
  steps_stale: number;
  steps_failed: number;
}

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

export default function Pipelines() {
  const { data: runs, loading, error } = useApiData<PipelineRun[]>(
    "/api/v1/pipelines/runs/?limit=50"
  );

  return (
    <Layout>
      <PageHeader
        title="Pipelines de Análisis"
        subtitle={`${runs?.length ?? "—"} análisis registrados`}
      />

      {error ? <ErrorState message={error} />
      : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : !runs?.length ? (
        <EmptyState message="No hay pipelines de análisis aún" />
      ) : (
        <div className="space-y-3">
          {runs.map(run => {
            const subject = run.subject_data as Record<string, string>;
            const title = [subject.brand, subject.model, subject.year, subject.trim]
              .filter(Boolean).join(" ");
            return (
              <Link key={run.id} href={`/pipelines/${run.id}`}>
                <div className="rounded-xl border border-border bg-card p-5 hover:shadow-sm transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-semibold text-sm">{title || run.subject_type}</span>
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
