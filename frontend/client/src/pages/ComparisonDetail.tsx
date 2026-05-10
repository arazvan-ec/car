/**
 * Página: Detalle de Comparativa
 * Tabla de criterios con ganador por criterio y veredicto
 */
import { useRoute, Link } from "wouter";
import { useApiData, type Comparison } from "@/hooks/useApi";
import Layout from "@/components/Layout";
import { ErrorState, PageHeader } from "@/components/ui-custom";
import { ArrowLeft, Trophy, CheckCircle2, XCircle } from "lucide-react";

export default function ComparisonDetail() {
  const [, params] = useRoute("/comparisons/:id");
  const { data: c, loading, error } = useApiData<Comparison>(
    params?.id ? `/api/v1/comparisons/${params.id}` : ""
  );

  return (
    <Layout>
      <div className="mb-6">
        <Link href="/comparisons">
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Volver a comparativas
          </span>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} />
      ) : !c ? null : (
        <>
          <PageHeader
            title="Comparativa de Modelos"
            subtitle={new Date(c.created_at).toLocaleDateString("es-ES", { dateStyle: "long" })}
          />

          {/* Veredicto */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold">Ganador: {c.winner_brand} {c.winner_model}</span>
            </div>
            <p className="text-sm text-muted-foreground">{c.verdict}</p>
          </div>

          {/* Tabla de criterios */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold">Resultado por criterio</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Criterio</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Ganador</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(c.criteria_winners ?? {}).map(([criterion, winner]) => {
                    const isWinner = winner === c.winner_brand;
                    return (
                      <tr key={criterion} className="data-row border-b border-border last:border-0">
                        <td className="px-4 py-3 font-medium">{criterion}</td>
                        <td className="px-4 py-3 text-sm">{winner}</td>
                        <td className="px-4 py-3">
                          {isWinner ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Ganador global
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <XCircle className="w-3.5 h-3.5" /> Rival
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notas */}
          {c.raw_notes && (
            <div className="mt-6 rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold mb-2">Notas adicionales</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{c.raw_notes}</p>
            </div>
          )}

          {/* Links a los análisis */}
          <div className="mt-4 flex gap-3">
            <Link href={`/analyses/${c.analysis_a_id}`}>
              <span className="text-xs text-primary hover:underline">Ver análisis A →</span>
            </Link>
            <Link href={`/analyses/${c.analysis_b_id}`}>
              <span className="text-xs text-primary hover:underline">Ver análisis B →</span>
            </Link>
          </div>
        </>
      )}
    </Layout>
  );
}
