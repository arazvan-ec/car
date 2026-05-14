/**
 * Dashboard — Car Analytics
 * Stats derivados de los pipelines unificados.
 */
import { useApiData, type PipelineRunSummary } from "@/hooks/useApi";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Car, GitCompare, TrendingUp, Workflow } from "lucide-react";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import {
  StatCard, SkeletonCard, ErrorState, EmptyState, PageHeader,
} from "@/components/ui-custom";

const CHART_COLORS = ["#1d4ed8", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"];

function countBy<T>(items: T[], key: (t: T) => string | undefined): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    if (!k) continue;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

export default function Home() {
  const { data: runs, loading, error } = useApiData<PipelineRunSummary[]>(
    "/api/v1/pipelines/runs/?limit=100"
  );

  const analyses = runs?.filter(r => r.pipeline_type === "vehicle_analysis") ?? [];
  const comparisons = runs?.filter(r => r.pipeline_type === "vehicle_comparison") ?? [];
  const completed = runs?.filter(r => r.status === "completed").length ?? 0;
  const topBrands = countBy(analyses, r => (r.subject_data as Record<string, string>).brand).slice(0, 5);
  const topFuels = countBy(analyses, r => (r.subject_data as Record<string, string>).fuel_type).slice(0, 5);
  const recent = (runs ?? []).slice(0, 5);

  return (
    <Layout>
      <PageHeader
        title="Dashboard"
        subtitle="Resumen de pipelines de análisis generados con el skill car-configurator-preferences"
      />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : error ? (
          <div className="col-span-4"><ErrorState message={error} /></div>
        ) : (
          <>
            <StatCard label="Análisis" value={analyses.length} sub="vehículos analizados" accent />
            <StatCard label="Comparativas" value={comparisons.length} sub="head-to-head" />
            <StatCard label="Pipelines totales" value={runs?.length ?? 0} sub="todos los runs" />
            <StatCard label="Completados" value={completed} sub={`${runs?.length ?? 0} totales`} />
          </>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Car className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Marcas más analizadas</h2>
          </div>
          {loading ? (
            <div className="h-40 bg-muted animate-pulse rounded" />
          ) : topBrands.length ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topBrands} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" tick={{ fontSize: 11, fontFamily: "DM Mono" }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={70} />
                <Tooltip
                  contentStyle={{ fontSize: 12, fontFamily: "DM Sans", borderRadius: 8 }}
                  formatter={(v: number) => [v, "análisis"]}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {topBrands.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Sin datos de marcas aún" />
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Tipos de propulsión</h2>
          </div>
          {loading ? (
            <div className="h-40 bg-muted animate-pulse rounded" />
          ) : topFuels.length ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topFuels} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" tick={{ fontSize: 11, fontFamily: "DM Mono" }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={55} />
                <Tooltip
                  contentStyle={{ fontSize: 12, fontFamily: "DM Sans", borderRadius: 8 }}
                  formatter={(v: number) => [v, "análisis"]}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {topFuels.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Sin datos de propulsión aún" />
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Workflow className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Últimos pipelines</h2>
          </div>
          <Link href="/analyses">
            <span className="text-xs text-primary hover:underline font-medium">Ver análisis →</span>
          </Link>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}
          </div>
        ) : !recent.length ? <EmptyState />
        : (
          <ul className="divide-y divide-border">
            {recent.map(r => {
              const s = r.subject_data as Record<string, string>;
              const title = r.pipeline_type === "vehicle_comparison"
                ? "Comparativa"
                : [s.brand, s.model, s.year, s.trim].filter(Boolean).join(" ") || r.subject_type;
              const href = r.pipeline_type === "vehicle_comparison"
                ? `/comparisons/${r.id}`
                : `/analyses/${r.id}`;
              return (
                <li key={r.id}>
                  <Link href={href}>
                    <div className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors cursor-pointer gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {r.pipeline_type === "vehicle_comparison"
                          ? <GitCompare className="w-4 h-4 text-primary shrink-0" />
                          : <Car className="w-4 h-4 text-primary shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{title}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {r.pipeline_type} · {r.steps_completed}/{r.steps_total} pasos
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded border shrink-0 ${
                        r.status === "completed" ? "bg-green-50 text-green-700 border-green-200" :
                        r.status === "stale" ? "bg-orange-50 text-orange-700 border-orange-200" :
                        r.status === "failed" ? "bg-red-50 text-red-700 border-red-200" :
                        "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>{r.status}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Layout>
  );
}
