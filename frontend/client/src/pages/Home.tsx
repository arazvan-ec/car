/**
 * Dashboard — Car Analytics
 * Muestra: stats globales, top marcas, top propulsiones, últimos análisis
 */
import { useApiData, type Stats, type VehicleAnalysis } from "@/hooks/useApi";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Car, GitCompare, TrendingUp, Star } from "lucide-react";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import {
  StatCard, SkeletonCard, ErrorState, EmptyState,
  DgtBadge, FuelBadge, PageHeader
} from "@/components/ui-custom";

const CHART_COLORS = ["#1d4ed8", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"];

export default function Home() {
  const stats = useApiData<Stats>("/api/v1/stats/");
  const analyses = useApiData<VehicleAnalysis[]>("/api/v1/analyses/?limit=5");

  return (
    <Layout>
      <PageHeader
        title="Dashboard"
        subtitle="Resumen de análisis de vehículos generados con el skill car-configurator-preferences"
      />

      {/* ── Stats globales ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : stats.error ? (
          <div className="col-span-4"><ErrorState message={stats.error} /></div>
        ) : stats.data ? (
          <>
            <StatCard
              label="Análisis totales"
              value={stats.data.total_analyses}
              sub="vehículos analizados"
              accent
            />
            <StatCard
              label="Comparativas"
              value={stats.data.total_comparisons}
              sub="modelos comparados"
            />
            <StatCard
              label="Precio medio"
              value={stats.data.avg_price_eur
                ? `${stats.data.avg_price_eur.toLocaleString("es-ES")} €`
                : "—"}
              sub="PVP de tarifa"
            />
            <StatCard
              label="Rating prensa"
              value={stats.data.avg_press_rating
                ? `${stats.data.avg_press_rating.toFixed(1)} / 10`
                : "—"}
              sub="media de reviews"
            />
          </>
        ) : null}
      </section>

      {/* ── Gráficos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top marcas */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Car className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Marcas más analizadas</h2>
          </div>
          {stats.loading ? (
            <div className="h-40 bg-muted animate-pulse rounded" />
          ) : stats.data?.top_brands?.length ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.data.top_brands} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" tick={{ fontSize: 11, fontFamily: "DM Mono" }} />
                <YAxis type="category" dataKey="brand" tick={{ fontSize: 12 }} width={70} />
                <Tooltip
                  contentStyle={{ fontSize: 12, fontFamily: "DM Sans", borderRadius: 8 }}
                  formatter={(v: number) => [v, "análisis"]}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {stats.data.top_brands.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Sin datos de marcas aún" />
          )}
        </div>

        {/* Top propulsiones */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Tipos de propulsión</h2>
          </div>
          {stats.loading ? (
            <div className="h-40 bg-muted animate-pulse rounded" />
          ) : stats.data?.top_fuel_types?.length ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.data.top_fuel_types} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" tick={{ fontSize: 11, fontFamily: "DM Mono" }} />
                <YAxis type="category" dataKey="fuel_type" tick={{ fontSize: 12 }} width={55} />
                <Tooltip
                  contentStyle={{ fontSize: 12, fontFamily: "DM Sans", borderRadius: 8 }}
                  formatter={(v: number) => [v, "análisis"]}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {stats.data.top_fuel_types.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Sin datos de propulsión aún" />
          )}
        </div>
      </div>

      {/* ── Últimos análisis ── */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Últimos análisis</h2>
          </div>
          <Link href="/analyses">
            <span className="text-xs text-primary hover:underline font-medium">Ver todos →</span>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Vehículo", "Motor", "Tracción", "Propulsión", "Etiqueta", "Precio"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analyses.loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse border-b border-border">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 bg-muted rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : analyses.error ? (
                <tr><td colSpan={6}><ErrorState message={analyses.error} /></td></tr>
              ) : !analyses.data?.length ? (
                <tr><td colSpan={6}><EmptyState /></td></tr>
              ) : (
                analyses.data.map(a => (
                  <tr key={a.id} className="data-row border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/analyses/${a.id}`}>
                        <span className="font-medium hover:text-primary transition-colors">
                          {a.brand} {a.model}
                        </span>
                      </Link>
                      <p className="text-xs text-muted-foreground">{a.trim} · {a.year}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.horsepower} CV</td>
                    <td className="px-4 py-3 text-xs">{a.drivetrain}</td>
                    <td className="px-4 py-3"><FuelBadge type={a.fuel_type} /></td>
                    <td className="px-4 py-3"><DgtBadge label={a.dgt_label} /></td>
                    <td className="px-4 py-3 font-mono text-xs font-medium">
                      {a.list_price_eur.toLocaleString("es-ES")} €
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
