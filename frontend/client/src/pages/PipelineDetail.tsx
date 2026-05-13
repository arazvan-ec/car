/**
 * Página: Detalle de PipelineRun
 * Muestra todos los pasos, sus fuentes y el historial de versiones de caché
 */
import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useApiData } from "@/hooks/useApi";
import Layout from "@/components/Layout";
import { PageHeader, ErrorState } from "@/components/ui-custom";
import {
  ArrowLeft, CheckCircle2, Clock, AlertCircle, RefreshCw,
  ChevronDown, ChevronUp, ExternalLink, Database, History,
  Zap, FileText
} from "lucide-react";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface CacheEntry {
  id: string; version: number; is_current: boolean;
  structured_data: Record<string, unknown> | null;
  raw_content: string | null; notes: string | null; created_at: string;
}

interface DataSource {
  id: string; source_name: string; source_url: string; fetched_at: string;
  current_version: number | null; total_versions: number;
  current_cache: CacheEntry | null;
}

interface PipelineStep {
  id: string; step_type: string; status: string;
  structured_result: Record<string, unknown> | null;
  error_message: string | null; depends_on: string[];
  started_at: string | null; completed_at: string | null; created_at: string;
  sources_count: number; data_sources: DataSource[];
}

interface PipelineRun {
  id: string; pipeline_type: string; subject_type: string;
  subject_data: Record<string, unknown>; status: string;
  skill_version: string | null; notes: string | null;
  created_at: string; updated_at: string;
  steps_total: number; steps_completed: number; steps_pending: number;
  steps_stale: number; steps_failed: number;
  steps: PipelineStep[]; decision: Record<string, unknown> | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_ICON: Record<string, React.ElementType> = {
  completed: CheckCircle2, pending: Clock,
  running: RefreshCw, stale: AlertCircle, failed: AlertCircle,
};
const STATUS_COLOR: Record<string, string> = {
  completed: "text-green-600", pending: "text-amber-500",
  running: "text-blue-500", stale: "text-orange-500", failed: "text-red-500",
};

const STEP_LABELS: Record<string, string> = {
  technical_specs:      "Ficha Técnica",
  real_consumption:     "Consumo Real",
  press_review:         "Reviews de Prensa",
  ncap:                 "Euro NCAP",
  owner_opinions:       "Opinión Propietarios",
  market_price:         "Precio de Mercado",
  competitive_analysis: "Análisis Competitivo",
  final_decision:       "Decisión Final",
};

// ── Componentes ───────────────────────────────────────────────────────────────

function SourceCard({ source }: { source: DataSource }) {
  const [showRaw, setShowRaw] = useState(false);
  const cache = source.current_cache;

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground bg-primary/10 text-primary px-2 py-0.5 rounded font-mono">
            {source.source_name}
          </span>
          {cache && (
            <span className="text-[10px] text-muted-foreground font-mono">
              v{cache.version} · {source.total_versions} versión{source.total_versions !== 1 ? "es" : ""}
            </span>
          )}
        </div>
        <a href={source.source_url} target="_blank" rel="noopener noreferrer"
           className="text-primary hover:text-primary/80 transition-colors">
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {cache?.structured_data && (
        <div className="mb-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Datos extraídos</p>
          <pre className="text-[10px] font-mono bg-card rounded p-2 overflow-x-auto border border-border text-foreground">
            {JSON.stringify(cache.structured_data, null, 2)}
          </pre>
        </div>
      )}

      {cache?.raw_content && (
        <>
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {showRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showRaw ? "Ocultar" : "Ver"} texto completo guardado
          </button>
          {showRaw && (
            <pre className="mt-2 text-[10px] font-mono bg-card rounded p-2 overflow-x-auto border border-border text-muted-foreground whitespace-pre-wrap max-h-64">
              {cache.raw_content}
            </pre>
          )}
        </>
      )}

      {cache?.notes && (
        <p className="text-[10px] text-muted-foreground italic mt-1">Nota: {cache.notes}</p>
      )}
    </div>
  );
}

function StepCard({ step }: { step: PipelineStep }) {
  const [expanded, setExpanded] = useState(step.status !== "pending");
  const Icon = STATUS_ICON[step.status] ?? Clock;
  const color = STATUS_COLOR[step.status] ?? "text-muted-foreground";

  return (
    <div className={`rounded-xl border bg-card overflow-hidden ${
      step.status === "completed" ? "border-green-200" :
      step.status === "failed" ? "border-red-200" :
      step.status === "stale" ? "border-orange-200" : "border-border"
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-4 h-4 ${color} ${step.status === "running" ? "animate-spin" : ""}`} />
          <div className="text-left">
            <p className="text-sm font-semibold">{STEP_LABELS[step.step_type] ?? step.step_type}</p>
            <p className="text-xs text-muted-foreground font-mono">{step.step_type}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {step.sources_count > 0 && (
            <span className="text-xs text-muted-foreground font-mono">
              <Database className="w-3 h-3 inline mr-1" />{step.sources_count} fuente{step.sources_count !== 1 ? "s" : ""}
            </span>
          )}
          {step.depends_on.length > 0 && (
            <span className="text-[10px] text-muted-foreground hidden sm:block">
              deps: {step.depends_on.join(", ")}
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
          {step.error_message && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-xs font-semibold text-red-700 mb-0.5">Error</p>
              <p className="text-xs text-red-800 font-mono">{step.error_message}</p>
            </div>
          )}

          {step.structured_result && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <FileText className="w-3 h-3" /> Resultado procesado
              </p>
              <pre className="text-[10px] font-mono bg-muted/30 rounded p-3 overflow-x-auto border border-border text-foreground">
                {JSON.stringify(step.structured_result, null, 2)}
              </pre>
            </div>
          )}

          {step.data_sources.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Database className="w-3 h-3" /> Fuentes de datos
              </p>
              <div className="space-y-2">
                {step.data_sources.map(source => (
                  <SourceCard key={source.id} source={source} />
                ))}
              </div>
            </div>
          )}

          {step.completed_at && (
            <p className="text-[10px] text-muted-foreground font-mono">
              Completado: {new Date(step.completed_at).toLocaleString("es-ES")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function PipelineDetail() {
  const [, params] = useRoute("/pipelines/:id");
  const { data: run, loading, error } = useApiData<PipelineRun>(
    params?.id ? `/api/v1/pipelines/runs/${params.id}` : ""
  );

  const subject = run?.subject_data as Record<string, string> | undefined;
  const title = subject
    ? [subject.brand, subject.model, subject.year, subject.trim].filter(Boolean).join(" ")
    : "Pipeline";

  return (
    <Layout>
      <div className="mb-6">
        <Link href="/pipelines">
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Volver a pipelines
          </span>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : error ? <ErrorState message={error} />
      : !run ? null : (
        <>
          <PageHeader title={title} subtitle={`${run.pipeline_type} · ${run.steps_completed}/${run.steps_total} pasos completados`}>
            <span className={`text-xs font-medium px-2 py-1 rounded border ${
              run.status === "completed" ? "bg-green-50 text-green-700 border-green-200" :
              run.status === "stale" ? "bg-orange-50 text-orange-700 border-orange-200" :
              run.status === "failed" ? "bg-red-50 text-red-700 border-red-200" :
              "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
              {run.status}
            </span>
          </PageHeader>

          {/* Decisión final */}
          {run.decision && (
            <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">Decisión Final</h2>
              </div>
              <pre className="text-xs font-mono text-foreground whitespace-pre-wrap">
                {JSON.stringify(run.decision, null, 2)}
              </pre>
            </div>
          )}

          {/* Pasos del pipeline */}
          <div className="space-y-3">
            {run.steps.map(step => <StepCard key={step.id} step={step} />)}
          </div>

          {/* Metadatos */}
          <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <History className="w-3 h-3" /> Metadatos del run
            </p>
            <p className="text-xs font-mono text-muted-foreground">ID: {run.id}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Creado: {new Date(run.created_at).toLocaleString("es-ES")}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Actualizado: {new Date(run.updated_at).toLocaleString("es-ES")}
            </p>
            {run.skill_version && (
              <p className="text-xs font-mono text-muted-foreground mt-0.5">{run.skill_version}</p>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}
