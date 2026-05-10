/**
 * Página: Estadísticas de Negocio
 * Gráficos detallados de marcas, propulsiones, precios y ratings
 */
import { useApiData, type Stats } from "@/hooks/useApi";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import Layout from "@/components/Layout";
import { StatCard, SkeletonCard, ErrorState, EmptyState, PageHeader } from "@/components/ui-custom";

const COLORS = ["#1d4ed8", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe"];

export default function StatsPage() {
  const { data, loading, error } = useApiData<Stats>("/api/v1/stats/");

  return (
    <Layout>
      <PageHeader
        title="Estadísticas"
        subtitle="Métricas agregadas del motor de análisis"
      />

      {error ? (
        <ErrorState message={error} />
      ) : (
        <>
          {/* KPIs */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            ) : data ? (
              <>
                <StatCard label="Análisis totales" value={data.total_analyses} accent />
                <StatCard label="Comparativas" value={data.total_comparisons} />
                <StatCard
                  label="Precio medio"
                  value={data.avg_price_eur ? `${data.avg_price_eur.toLocaleString("es-ES")} €` : "—"}
                />
                <StatCard
                  label="Rating prensa"
                  value={data.avg_press_rating ? `${data.avg_press_rating.toFixed(1)}/10` : "—"}
                />
              </>
            ) : null}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Marcas — barras */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold mb-4">Marcas más analizadas</h2>
              {loading ? (
                <div className="h-64 bg-muted animate-pulse rounded" />
              ) : !data?.top_brands?.length ? (
                <EmptyState message="Sin datos" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.top_brands} layout="vertical" margin={{ left: 8, right: 24 }}>
                    <XAxis type="number" tick={{ fontSize: 11, fontFamily: "DM Mono" }} />
                    <YAxis type="category" dataKey="brand" tick={{ fontSize: 12 }} width={75} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, fontFamily: "DM Sans", borderRadius: 8, border: "1px solid #e2e8f0" }}
                      formatter={(v: number) => [v, "análisis"]}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {data.top_brands.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Propulsiones — pie */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold mb-4">Distribución por propulsión</h2>
              {loading ? (
                <div className="h-64 bg-muted animate-pulse rounded" />
              ) : !data?.top_fuel_types?.length ? (
                <EmptyState message="Sin datos" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={data.top_fuel_types}
                      dataKey="count"
                      nameKey="fuel_type"
                      cx="50%"
                      cy="45%"
                      outerRadius={90}
                      label={({ fuel_type, percent }) =>
                        `${fuel_type} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {data.top_fuel_types.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ fontSize: 12, fontFamily: "DM Sans", borderRadius: 8, border: "1px solid #e2e8f0" }}
                      formatter={(v: number) => [v, "análisis"]}
                    />
                    <Legend
                      formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
