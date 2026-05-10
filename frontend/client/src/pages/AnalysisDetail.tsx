/**
 * Página: Detalle de Análisis
 * Ficha completa de un vehículo analizado
 */
import { useRoute, Link } from "wouter";
import { useApiData, type VehicleAnalysis } from "@/hooks/useApi";
import Layout from "@/components/Layout";
import { DgtBadge, FuelBadge, StarRating, PressRatingBar, ErrorState, PageHeader } from "@/components/ui-custom";
import { ArrowLeft, CheckCircle2, XCircle, Zap, Shield, Gauge, Euro } from "lucide-react";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider w-40 shrink-0">{label}</span>
      <span className="text-sm text-right font-mono">{value ?? "—"}</span>
    </div>
  );
}

export default function AnalysisDetail() {
  const [, params] = useRoute("/analyses/:id");
  const { data: a, loading, error } = useApiData<VehicleAnalysis>(
    params?.id ? `/api/v1/analyses/${params.id}` : ""
  );

  return (
    <Layout>
      <div className="mb-6">
        <Link href="/analyses">
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Volver a análisis
          </span>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} />
      ) : !a ? null : (
        <>
          <PageHeader
            title={`${a.brand} ${a.model}`}
            subtitle={`${a.trim} · ${a.year}`}
          >
            <DgtBadge label={a.dgt_label} />
            <FuelBadge type={a.fuel_type} />
          </PageHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda: datos técnicos */}
            <div className="lg:col-span-2 space-y-6">

              {/* Motorización y dinámica */}
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold">Motorización y Dinámica</h2>
                </div>
                <InfoRow label="Motor" value={a.engine} />
                <InfoRow label="Potencia" value={`${a.horsepower} CV`} />
                <InfoRow label="Tracción" value={a.drivetrain} />
                <InfoRow label="Propulsión" value={<FuelBadge type={a.fuel_type} />} />
                <InfoRow label="Llantas" value={a.wheel_size_inches ? `${a.wheel_size_inches}"` : null} />
                <InfoRow label="Faros" value={a.headlights_type} />
                <InfoRow label="Carga diaria" value={
                  a.has_daily_charging === null ? "—" :
                  a.has_daily_charging ? "Sí" : "No"
                } />
              </div>

              {/* Eficiencia */}
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Gauge className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold">Eficiencia</h2>
                </div>
                <InfoRow label="Consumo WLTP" value={a.wltp_consumption ? `${a.wltp_consumption} l/100km` : null} />
                <InfoRow label="Consumo real" value={a.real_consumption ? `${a.real_consumption} l/100km` : null} />
                {a.wltp_consumption && a.real_consumption && (
                  <InfoRow label="Diferencia" value={
                    <span className="text-amber-600">
                      +{((a.real_consumption - a.wltp_consumption) / a.wltp_consumption * 100).toFixed(0)}% vs WLTP
                    </span>
                  } />
                )}
                <InfoRow label="Etiqueta DGT" value={<DgtBadge label={a.dgt_label} />} />
              </div>

              {/* Precio */}
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Euro className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold">Precio</h2>
                </div>
                <InfoRow label="PVP de tarifa" value={
                  <span className="text-lg font-semibold text-foreground">
                    {a.list_price_eur.toLocaleString("es-ES")} €
                  </span>
                } />
              </div>
            </div>

            {/* Columna derecha: valoraciones y notas */}
            <div className="space-y-6">

              {/* Seguridad */}
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold">Seguridad</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Euro NCAP</p>
                    <StarRating value={a.euro_ncap_stars} />
                  </div>
                  {a.euro_ncap_adult_pct != null && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Adultos</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${a.euro_ncap_adult_pct}%` }} />
                        </div>
                        <span className="text-xs font-mono">{a.euro_ncap_adult_pct}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Rating prensa */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold mb-3">Valoración de Prensa</h2>
                <PressRatingBar value={a.press_rating} />
                {a.press_sources?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {a.press_sources.map(s => (
                      <span key={s} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded font-mono">{s}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Pros & Cons */}
              {(a.pros?.length > 0 || a.cons?.length > 0) && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <h2 className="text-sm font-semibold mb-3">Pros & Contras</h2>
                  {a.pros?.length > 0 && (
                    <div className="mb-3">
                      {a.pros.map((p, i) => (
                        <div key={i} className="flex items-start gap-2 py-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                          <span className="text-xs">{p}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {a.cons?.length > 0 && (
                    <div>
                      {a.cons.map((c, i) => (
                        <div key={i} className="flex items-start gap-2 py-1">
                          <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                          <span className="text-xs">{c}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notas */}
              {a.reliability_notes && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Fiabilidad</p>
                  <p className="text-xs text-amber-800">{a.reliability_notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Notas raw */}
          {a.raw_notes && (
            <div className="mt-6 rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold mb-2">Notas del análisis</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.raw_notes}</p>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
