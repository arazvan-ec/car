/**
 * Página: Lista de Comparativas
 * Historial de comparativas con veredicto y ganador
 */
import { useApiData, type Comparison } from "@/hooks/useApi";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import { PageHeader, EmptyState, ErrorState, SkeletonRow } from "@/components/ui-custom";
import { Trophy, ExternalLink } from "lucide-react";

export default function Comparisons() {
  const { data, loading, error } = useApiData<Comparison[]>("/api/v1/comparisons/?limit=50");

  return (
    <Layout>
      <PageHeader
        title="Comparativas"
        subtitle={`${data?.length ?? "—"} comparativas guardadas`}
      />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Fecha", "Ganador", "Veredicto", "Criterios ganados", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              ) : error ? (
                <tr><td colSpan={5}><ErrorState message={error} /></td></tr>
              ) : !data?.length ? (
                <tr><td colSpan={5}><EmptyState message="No hay comparativas aún" /></td></tr>
              ) : (
                data.map(c => {
                  const criteriaEntries = Object.entries(c.criteria_winners ?? {});
                  const winnerCriteria = criteriaEntries.filter(([, v]) => v === c.winner_brand).length;
                  return (
                    <tr key={c.id} className="data-row border-b border-border last:border-0">
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">
                        {new Date(c.created_at).toLocaleDateString("es-ES")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-3.5 h-3.5 text-amber-400" />
                          <span className="font-semibold text-foreground">{c.winner_brand} {c.winner_model}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-xs text-muted-foreground line-clamp-2">{c.verdict}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {criteriaEntries.slice(0, 4).map(([k, v]) => (
                            <span key={k} className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${
                              v === c.winner_brand
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-muted text-muted-foreground border-border"
                            }`}>
                              {k}
                            </span>
                          ))}
                          {criteriaEntries.length > 4 && (
                            <span className="text-[10px] text-muted-foreground">+{criteriaEntries.length - 4}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{winnerCriteria}/{criteriaEntries.length} criterios</p>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/comparisons/${c.id}`}>
                          <span className="text-primary hover:text-primary/80 transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
