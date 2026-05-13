/**
 * Página: Detalle de Análisis — modelo enriquecido con todos los campos
 */
import { useRoute, Link } from "wouter";
import { useApiData, type VehicleAnalysis } from "@/hooks/useApi";
import Layout from "@/components/Layout";
import { DgtBadge, FuelBadge, StarRating, PressRatingBar, ErrorState, PageHeader } from "@/components/ui-custom";
import { ArrowLeft, Zap, Shield, Gauge, Euro, Users, Trophy, CheckCircle2, XCircle, AlertTriangle, Info, Ruler } from "lucide-react";

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4"><Icon className="w-4 h-4 text-primary" /><h2 className="text-sm font-semibold">{title}</h2></div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex items-start justify-between py-2 border-b border-border last:border-0 gap-4">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0 w-44">{label}</span>
      <span className="text-sm text-right font-mono">{value}</span>
    </div>
  );
}

function Tags({ items, color = "default" }: { items: string[]; color?: "green"|"red"|"amber"|"blue"|"default" }) {
  if (!items?.length) return null;
  const cls = { green:"bg-green-50 text-green-700 border-green-200", red:"bg-red-50 text-red-700 border-red-200", amber:"bg-amber-50 text-amber-700 border-amber-200", blue:"bg-blue-50 text-blue-700 border-blue-200", default:"bg-muted text-muted-foreground border-border" }[color];
  return <div className="flex flex-wrap gap-1.5 mt-1">{items.map((item, i) => <span key={i} className={`text-xs px-2 py-0.5 rounded border ${cls}`}>{item}</span>)}</div>;
}

function NcapBar({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null;
  const color = value >= 80 ? "bg-green-500" : value >= 60 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">{label}</span><span className="font-mono font-medium">{value}%</span></div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden"><div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} /></div>
    </div>
  );
}

export default function AnalysisDetail() {
  const [, params] = useRoute("/analyses/:id");
  const { data: a, loading, error } = useApiData<VehicleAnalysis>(params?.id ? `/api/v1/analyses/${params.id}` : "");

  return (
    <Layout>
      <div className="mb-6">
        <Link href="/analyses"><span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-3.5 h-3.5" /> Volver a análisis</span></Link>
      </div>

      {loading ? <div className="space-y-4">{Array.from({length:4}).map((_,i)=><div key={i} className="h-36 bg-muted animate-pulse rounded-xl"/>)}</div>
      : error ? <ErrorState message={error} />
      : !a ? null : (
        <>
          <PageHeader title={`${a.brand} ${a.model}`} subtitle={`${a.trim} · ${a.year}${a.segment ? ` · ${a.segment}` : ""}`}>
            <DgtBadge label={a.dgt_label} />
            <FuelBadge type={a.fuel_type} />
            {a.skill_version && <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded font-mono border border-border">{a.skill_version}</span>}
          </PageHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">

              <Section icon={Zap} title="Motorización y Dinámica">
                <Row label="Motor" value={a.engine} />
                <Row label="Potencia" value={`${a.horsepower} CV`} />
                <Row label="Par motor" value={a.torque_nm ? `${a.torque_nm} Nm` : null} />
                <Row label="Tracción" value={a.drivetrain} />
                <Row label="Cambio" value={a.gearbox} />
                <Row label="0–100 km/h" value={a.acceleration_0_100 ? `${a.acceleration_0_100} s` : null} />
                <Row label="Vel. máxima" value={a.top_speed_kmh ? `${a.top_speed_kmh} km/h` : null} />
                <Row label="Autonomía eléctrica" value={a.electric_range_km ? `${a.electric_range_km} km` : null} />
                <Row label="Llantas" value={a.wheel_size_inches ? `${a.wheel_size_inches}"` : null} />
                <Row label="Faros" value={a.headlights_type} />
                <Row label="Carga diaria" value={a.has_daily_charging === null ? null : a.has_daily_charging ? "Sí" : "No"} />
                {a.adas_features?.length > 0 && <div className="pt-2"><p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">ADAS de serie</p><Tags items={a.adas_features} color="blue" /></div>}
              </Section>

              <Section icon={Gauge} title="Eficiencia y Emisiones">
                <Row label="Consumo WLTP" value={a.wltp_consumption ? `${a.wltp_consumption} l/100km` : null} />
                <Row label="Consumo real" value={a.real_consumption ? `${a.real_consumption} l/100km${a.real_consumption_source ? ` (${a.real_consumption_source})` : ""}` : null} />
                {a.wltp_consumption && a.real_consumption && <Row label="Diferencia vs WLTP" value={<span className="text-amber-600">+{((a.real_consumption - a.wltp_consumption) / a.wltp_consumption * 100).toFixed(0)}%</span>} />}
                <Row label="CO₂" value={a.co2_gkm ? `${a.co2_gkm} g/km` : null} />
                <Row label="Etiqueta DGT" value={<DgtBadge label={a.dgt_label} />} />
              </Section>

              {(a.boot_liters || a.length_mm || a.seats) && (
                <Section icon={Ruler} title="Dimensiones y Practicidad">
                  <Row label="Maletero" value={a.boot_liters ? `${a.boot_liters} l` : null} />
                  <Row label="Plazas" value={a.seats} />
                  <Row label="Longitud" value={a.length_mm ? `${(a.length_mm/1000).toFixed(2)} m` : null} />
                  <Row label="Anchura" value={a.width_mm ? `${(a.width_mm/1000).toFixed(2)} m` : null} />
                  <Row label="Altura" value={a.height_mm ? `${(a.height_mm/1000).toFixed(2)} m` : null} />
                  <Row label="Batalla" value={a.wheelbase_mm ? `${(a.wheelbase_mm/1000).toFixed(2)} m` : null} />
                  <Row label="Fabricación" value={a.country_of_manufacture} />
                </Section>
              )}

              <Section icon={Euro} title="Precio y Mercado">
                <Row label="PVP de tarifa" value={<span className="text-lg font-semibold">{a.list_price_eur.toLocaleString("es-ES")} €</span>} />
                <Row label="Descuento típico" value={a.typical_discount_pct ? `${a.typical_discount_pct}%` : null} />
                <Row label="Precio real estimado" value={a.estimated_street_price_eur ? `${a.estimated_street_price_eur.toLocaleString("es-ES")} €` : null} />
                <Row label="Renting orientativo" value={a.renting_monthly_eur ? `${a.renting_monthly_eur.toLocaleString("es-ES")} €/mes` : null} />
                <Row label="Mantenimiento anual" value={a.maintenance_cost_annual_eur ? `${a.maintenance_cost_annual_eur.toLocaleString("es-ES")} €` : null} />
              </Section>

              {(a.main_competitors?.length > 0 || a.competitive_advantage) && (
                <Section icon={Trophy} title="Posicionamiento Competitivo">
                  <Row label="Precio vs. competencia" value={a.price_vs_competitors === "mas_barato" ? <span className="text-green-600">Más barato</span> : a.price_vs_competitors === "mas_caro" ? <span className="text-red-500">Más caro</span> : a.price_vs_competitors === "precio_similar" ? "Precio similar" : null} />
                  {a.main_competitors?.length > 0 && <div className="pt-2"><p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Competidores directos</p><Tags items={a.main_competitors} /></div>}
                  {a.competitive_advantage && <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100"><p className="text-xs font-semibold text-green-700 mb-0.5">Ventaja principal</p><p className="text-xs text-green-800">{a.competitive_advantage}</p></div>}
                  {a.competitive_disadvantage && <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-100"><p className="text-xs font-semibold text-red-700 mb-0.5">Desventaja principal</p><p className="text-xs text-red-800">{a.competitive_disadvantage}</p></div>}
                </Section>
              )}

              {(a.pros?.length > 0 || a.cons?.length > 0) && (
                <Section icon={CheckCircle2} title="Pros y Contras">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {a.pros?.length > 0 && <div><p className="text-xs font-semibold text-green-600 mb-2">Puntos fuertes</p>{a.pros.map((p,i)=><div key={i} className="flex items-start gap-2 py-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0"/><span className="text-xs">{p}</span></div>)}</div>}
                    {a.cons?.length > 0 && <div><p className="text-xs font-semibold text-red-500 mb-2">Puntos débiles</p>{a.cons.map((c,i)=><div key={i} className="flex items-start gap-2 py-1"><XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0"/><span className="text-xs">{c}</span></div>)}</div>}
                  </div>
                </Section>
              )}

              {(a.recommended_for?.length > 0 || a.not_recommended_for?.length > 0 || a.ideal_use_case) && (
                <Section icon={Users} title="Perfil de Usuario">
                  {a.ideal_use_case && <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100"><p className="text-xs font-semibold text-blue-700 mb-0.5">Caso de uso ideal</p><p className="text-xs text-blue-800">{a.ideal_use_case}</p></div>}
                  {a.recommended_for?.length > 0 && <div className="mb-3"><p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Recomendado para</p><Tags items={a.recommended_for} color="green" /></div>}
                  {a.not_recommended_for?.length > 0 && <div><p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">No recomendado para</p><Tags items={a.not_recommended_for} color="red" /></div>}
                </Section>
              )}

              {(a.raw_notes || a.analyst_notes) && (
                <Section icon={Info} title="Notas del Análisis">
                  {a.analyst_notes && <div className="mb-3"><p className="text-xs font-semibold text-muted-foreground mb-1">Notas internas</p><p className="text-xs text-muted-foreground whitespace-pre-wrap">{a.analyst_notes}</p></div>}
                  {a.raw_notes && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.raw_notes}</p>}
                </Section>
              )}
            </div>

            <div className="space-y-5">
              <Section icon={Shield} title="Seguridad Euro NCAP">
                <div className="mb-3"><p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Puntuación global</p><StarRating value={a.euro_ncap_stars} />{a.euro_ncap_year && <p className="text-xs text-muted-foreground mt-1">Test {a.euro_ncap_year}</p>}</div>
                <NcapBar label="Adultos" value={a.euro_ncap_adult_pct} />
                <NcapBar label="Niños" value={a.euro_ncap_child_pct} />
                <NcapBar label="Peatones" value={a.euro_ncap_pedestrian_pct} />
                <NcapBar label="Asistencia" value={a.euro_ncap_safety_assist_pct} />
              </Section>

              <Section icon={Trophy} title="Valoración de Prensa">
                <PressRatingBar value={a.press_rating} />
                {a.press_summary && <p className="text-xs text-muted-foreground mt-3 italic">"{a.press_summary}"</p>}
                {a.press_sources?.length > 0 && <div className="mt-3 flex flex-wrap gap-1">{a.press_sources.map(s=><span key={s} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded font-mono border border-border">{s}</span>)}</div>}
              </Section>

              {(a.owner_rating !== null || a.common_complaints?.length > 0) && (
                <Section icon={Users} title="Opinión de Propietarios">
                  {a.owner_rating !== null && <div className="mb-3"><PressRatingBar value={a.owner_rating} />{a.owner_rating_source && <p className="text-xs text-muted-foreground mt-1">Fuente: {a.owner_rating_source}{a.owner_sample_size ? ` (${a.owner_sample_size} opiniones)` : ""}</p>}</div>}
                  {a.common_complaints?.length > 0 && <div><p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Quejas frecuentes</p>{a.common_complaints.map((c,i)=><div key={i} className="flex items-start gap-2 py-1"><AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0"/><span className="text-xs">{c}</span></div>)}</div>}
                </Section>
              )}

              {(a.reliability_notes || a.known_issues?.length > 0 || a.warranty_years) && (
                <Section icon={Shield} title="Fiabilidad y Garantía">
                  <Row label="Garantía" value={a.warranty_years ? `${a.warranty_years} años` : null} />
                  <Row label="Garantía ext." value={a.extended_warranty_available === null ? null : a.extended_warranty_available ? "Disponible" : "No disponible"} />
                  {a.reliability_notes && <p className="text-xs text-muted-foreground mt-2">{a.reliability_notes}</p>}
                  {a.known_issues?.length > 0 && <div className="mt-3"><p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Problemas conocidos</p><Tags items={a.known_issues} color="amber" /></div>}
                </Section>
              )}

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Metadatos</p>
                <p className="text-xs text-muted-foreground font-mono">ID: {a.id.slice(0,8)}…</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(a.created_at).toLocaleDateString("es-ES", {dateStyle:"long"})}</p>
                {a.skill_version && <p className="text-xs text-muted-foreground mt-1 font-mono">{a.skill_version}</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
