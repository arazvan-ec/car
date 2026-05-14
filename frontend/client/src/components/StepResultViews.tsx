/**
 * Vistas visuales (UX/UI) para el `structured_result` de cada step_type.
 * Sustituyen al volcado JSON crudo en la página de detalle.
 */
import { ReactNode } from "react";
import {
  Gauge, Zap, Fuel, Ruler, Shield, Star, Users, Tag, Trophy, TrendingUp,
  Sparkles, Check, X, Disc, Lightbulb, Cog, Calendar,
} from "lucide-react";

type Json = Record<string, unknown> | null | undefined;

const num = (v: unknown) => (typeof v === "number" ? v : undefined);
const str = (v: unknown) => (typeof v === "string" ? v : undefined);
const arr = (v: unknown) => (Array.isArray(v) ? v : []);
const bool = (v: unknown) => (typeof v === "boolean" ? v : undefined);

// ── Primitivas reutilizables ──────────────────────────────────────────────────

export function MetricChip({
  icon: Icon, label, value, sub, accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: "primary" | "green" | "amber" | "red" | "muted";
}) {
  const ring =
    accent === "primary" ? "border-primary/30 bg-primary/5" :
    accent === "green"   ? "border-green-200 bg-green-50"   :
    accent === "amber"   ? "border-amber-200 bg-amber-50"   :
    accent === "red"     ? "border-red-200 bg-red-50"       :
                           "border-border bg-card";
  const ic =
    accent === "primary" ? "text-primary" :
    accent === "green"   ? "text-green-600" :
    accent === "amber"   ? "text-amber-600" :
    accent === "red"     ? "text-red-600" :
                           "text-muted-foreground";
  return (
    <div className={`rounded-lg border p-3 flex items-start gap-2.5 ${ring}`}>
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${ic}`} />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
        <p className="text-base font-semibold tabular-nums text-foreground leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function StarRow({ stars }: { stars: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${stars} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= stars ? "fill-amber-400 text-amber-500" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

function Bar({ value, max = 100, color = "bg-primary" }: { value: number; max?: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="w-full h-1.5 bg-border/60 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function DgtBadge({ label }: { label?: string }) {
  if (!label) return null;
  const cls =
    /0|cero/i.test(label) ? "badge-cero" :
    /eco/i.test(label)    ? "badge-eco" :
    /c\b/i.test(label)    ? "badge-c" :
    /b\b/i.test(label)    ? "badge-b" :
                            "bg-muted text-muted-foreground border border-border";
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${cls}`}>{label}</span>;
}

function ListChips({ items, tone = "muted" }: { items: string[]; tone?: "good" | "bad" | "muted" }) {
  if (!items.length) return null;
  const cls =
    tone === "good" ? "bg-green-50 text-green-700 border border-green-200" :
    tone === "bad"  ? "bg-red-50 text-red-700 border border-red-200" :
                      "bg-muted text-muted-foreground border border-border";
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it, i) => (
        <span key={i} className={`text-[11px] px-2 py-0.5 rounded ${cls}`}>{it}</span>
      ))}
    </div>
  );
}

// ── Vistas por step_type ──────────────────────────────────────────────────────

function TechnicalSpecsView({ data }: { data: Json }) {
  if (!data) return null;
  const d = data as Record<string, unknown>;
  const cv = num(d.horsepower);
  const cvMax = num(d.max_horsepower_in_range);
  const wheels = num(d.wheel_size_inches);
  const wheelsAvail = arr(d.available_wheel_sizes) as number[];
  const isTopEngine = bool(d.engine_chosen_is_top) ?? (cv !== undefined && cvMax !== undefined && cv >= cvMax);
  const isTopWheels = wheels !== undefined && (wheels >= 20 || wheels === Math.max(...(wheelsAvail.length ? wheelsAvail : [wheels])));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <MetricChip
          icon={Zap}
          label="Potencia"
          value={cv !== undefined ? `${cv} CV` : "—"}
          sub={cvMax !== undefined ? `máx. modelo: ${cvMax} CV` : undefined}
          accent={isTopEngine ? "primary" : "muted"}
        />
        <MetricChip
          icon={Gauge}
          label="Par"
          value={num(d.torque_nm) !== undefined ? `${d.torque_nm} Nm` : "—"}
          sub={str(d.drivetrain)}
        />
        <MetricChip
          icon={Disc}
          label="Llantas"
          value={wheels !== undefined ? `${wheels}"` : "—"}
          sub={wheelsAvail.length ? `disp.: ${wheelsAvail.join("/")}"` : undefined}
          accent={isTopWheels ? "primary" : "amber"}
        />
        <MetricChip
          icon={Cog}
          label="Cambio / Combustible"
          value={str(d.gearbox) ?? "—"}
          sub={str(d.fuel_type)}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <MetricChip icon={TrendingUp} label="0–100 km/h" value={num(d.acceleration_0_100) !== undefined ? `${d.acceleration_0_100} s` : "—"} />
        <MetricChip icon={TrendingUp} label="V. máx." value={num(d.top_speed_kmh) !== undefined ? `${d.top_speed_kmh} km/h` : "—"} />
        <MetricChip icon={Ruler} label="Maletero" value={num(d.boot_liters) !== undefined ? `${d.boot_liters} L` : "—"} sub={num(d.seats) !== undefined ? `${d.seats} plazas` : undefined} />
        <MetricChip
          icon={Fuel}
          label="CO₂ / DGT"
          value={num(d.co2_gkm) !== undefined ? `${d.co2_gkm} g/km` : "—"}
          sub={undefined}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {str(d.dgt_label) && <><span className="font-medium">Etiqueta:</span><DgtBadge label={str(d.dgt_label)} /></>}
        {str(d.headlights_type) && (
          <span className="inline-flex items-center gap-1">
            <Lightbulb className="w-3 h-3" /> {str(d.headlights_type)}
          </span>
        )}
        {num(d.length_mm) !== undefined && (
          <span className="font-mono">{num(d.length_mm)}×{num(d.width_mm)}×{num(d.height_mm)} mm</span>
        )}
      </div>

      {arr(d.adas_features).length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
            <Shield className="w-3 h-3" /> ADAS de serie
          </p>
          <ListChips items={arr(d.adas_features) as string[]} tone="good" />
        </div>
      )}
    </div>
  );
}

function RealConsumptionView({ data }: { data: Json }) {
  if (!data) return null;
  const d = data as Record<string, unknown>;
  const real = num(d.real_consumption);
  const wltp = num(d.wltp_consumption);
  const dev = num(d.deviation_pct);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <MetricChip icon={Fuel} label="Consumo real" value={real !== undefined ? `${real} L/100` : "—"} sub={str(d.source)} accent="primary" />
        <MetricChip icon={Fuel} label="WLTP" value={wltp !== undefined ? `${wltp} L/100` : "—"} />
        <MetricChip
          icon={TrendingUp}
          label="Desviación"
          value={dev !== undefined ? `${dev > 0 ? "+" : ""}${dev}%` : "—"}
          accent={dev !== undefined && dev > 15 ? "amber" : "muted"}
        />
        <MetricChip icon={Tag} label="Condiciones" value={str(d.test_conditions) ?? "—"} />
      </div>
    </div>
  );
}

function PressReviewView({ data }: { data: Json }) {
  if (!data) return null;
  const d = data as Record<string, unknown>;
  const avg = num(d.avg_rating) ?? num(d.rating);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {avg !== undefined && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
            <Star className="w-4 h-4 fill-primary text-primary" />
            <span className="text-xl font-semibold tabular-nums text-primary">{avg.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">/ 10</span>
          </div>
        )}
        {str(d.source) && <span className="text-xs text-muted-foreground font-mono">fuente principal: {str(d.source)}</span>}
      </div>

      {str(d.verdict) && (
        <p className="text-sm text-foreground italic border-l-2 border-primary/40 pl-3">“{str(d.verdict)}”</p>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {arr(d.pros).length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-wider text-green-700 font-medium mb-1.5">Pros</p>
            <ul className="space-y-1">
              {(arr(d.pros) as string[]).map((p, i) => (
                <li key={i} className="text-xs flex items-start gap-1.5"><Check className="w-3 h-3 mt-0.5 text-green-600 shrink-0" />{p}</li>
              ))}
            </ul>
          </div>
        )}
        {arr(d.cons).length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-wider text-red-700 font-medium mb-1.5">Contras</p>
            <ul className="space-y-1">
              {(arr(d.cons) as string[]).map((c, i) => (
                <li key={i} className="text-xs flex items-start gap-1.5"><X className="w-3 h-3 mt-0.5 text-red-500 shrink-0" />{c}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function NcapView({ data }: { data: Json }) {
  if (!data) return null;
  const d = data as Record<string, unknown>;
  const stars = num(d.stars) ?? 0;
  const cats: { label: string; key: string }[] = [
    { label: "Adulto",       key: "adult_pct" },
    { label: "Niño",         key: "child_pct" },
    { label: "Peatón",       key: "pedestrian_pct" },
    { label: "Asistencias",  key: "safety_assist_pct" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <StarRow stars={stars} />
        <span className="text-sm font-semibold">{stars}/5</span>
        {num(d.year) !== undefined && (
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Test {num(d.year)}
          </span>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {cats.map(c => {
          const v = num(d[c.key]);
          return (
            <div key={c.key} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{c.label}</span>
                <span className="font-mono font-semibold">{v !== undefined ? `${v}%` : "—"}</span>
              </div>
              <Bar value={v ?? 0} color={
                v === undefined ? "bg-muted" :
                v >= 85 ? "bg-green-500" :
                v >= 70 ? "bg-amber-500" :
                          "bg-red-500"
              } />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OwnerOpinionsView({ data }: { data: Json }) {
  if (!data) return null;
  const d = data as Record<string, unknown>;
  const rating = num(d.rating);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {rating !== undefined && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-xl font-semibold tabular-nums text-primary">{rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">/ 10</span>
          </div>
        )}
        {num(d.sample_size) !== undefined && (
          <span className="text-xs text-muted-foreground">{d.sample_size as number} opiniones</span>
        )}
      </div>
      {arr(d.sources).length > 0 && <ListChips items={arr(d.sources) as string[]} tone="muted" />}
      <div className="grid sm:grid-cols-2 gap-3">
        {arr(d.common_praises).length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-wider text-green-700 font-medium mb-1.5">Lo mejor</p>
            <ListChips items={arr(d.common_praises) as string[]} tone="good" />
          </div>
        )}
        {arr(d.common_complaints).length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-wider text-red-700 font-medium mb-1.5">Quejas comunes</p>
            <ListChips items={arr(d.common_complaints) as string[]} tone="bad" />
          </div>
        )}
      </div>
    </div>
  );
}

function MarketPriceView({ data }: { data: Json }) {
  if (!data) return null;
  const d = data as Record<string, unknown>;
  const fmt = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      <MetricChip icon={Tag} label="PVP lista" value={num(d.list_price_eur) !== undefined ? fmt(d.list_price_eur as number) : "—"} />
      <MetricChip
        icon={Tag}
        label="Precio calle"
        value={num(d.estimated_street_price_eur) !== undefined ? fmt(d.estimated_street_price_eur as number) : "—"}
        sub={num(d.typical_discount_pct) !== undefined ? `-${d.typical_discount_pct}% típico` : undefined}
        accent="primary"
      />
      <MetricChip icon={Tag} label="Renting/mes" value={num(d.renting_monthly_eur) !== undefined ? fmt(d.renting_monthly_eur as number) : "—"} />
      <MetricChip icon={Tag} label="Mantenimiento/año" value={num(d.maintenance_annual_eur) !== undefined ? fmt(d.maintenance_annual_eur as number) : "—"} />
    </div>
  );
}

function CompetitiveView({ data }: { data: Json }) {
  if (!data) return null;
  const d = data as Record<string, unknown>;
  return (
    <div className="space-y-3">
      {arr(d.main_competitors).length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Competidores directos</p>
          <ListChips items={arr(d.main_competitors) as string[]} tone="muted" />
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        {str(d.advantage) && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3">
            <p className="text-[11px] uppercase tracking-wider text-green-700 font-medium mb-1 flex items-center gap-1">
              <Check className="w-3 h-3" /> Ventaja
            </p>
            <p className="text-xs text-green-900">{str(d.advantage)}</p>
          </div>
        )}
        {str(d.disadvantage) && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-[11px] uppercase tracking-wider text-red-700 font-medium mb-1 flex items-center gap-1">
              <X className="w-3 h-3" /> Desventaja
            </p>
            <p className="text-xs text-red-900">{str(d.disadvantage)}</p>
          </div>
        )}
      </div>
      {str(d.price_vs_competitors) && (
        <p className="text-xs text-muted-foreground">
          Posicionamiento de precio: <span className="font-mono text-foreground">{str(d.price_vs_competitors)}</span>
        </p>
      )}
    </div>
  );
}

function FinalDecisionView({ data }: { data: Json }) {
  if (!data) return null;
  const d = data as Record<string, unknown>;
  const recommended = bool(d.recommended);
  const score = num(d.score);
  const completeness = num(d.completeness_score);
  const breakdown = (d.completeness_breakdown ?? {}) as Record<string, boolean>;
  const breakdownLabels: Record<string, string> = {
    max_power: "Motor más potente",
    wheels_20: 'Llantas 20"',
    top_trim: "Acabado tope",
    awd: "Tracción AWD",
    matrix_led: "LED matricial",
    full_adas: "ADAS completo",
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {recommended !== undefined && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border inline-flex items-center gap-1 ${
            recommended ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
          }`}>
            {recommended ? <><Check className="w-3.5 h-3.5" /> Recomendado</> : <><X className="w-3.5 h-3.5" /> No recomendado</>}
          </span>
        )}
        {score !== undefined && (
          <div className="inline-flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-2xl font-semibold tabular-nums">{score.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">/ 10 global</span>
          </div>
        )}
        {completeness !== undefined && (
          <div className="inline-flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-lg font-semibold tabular-nums text-primary">{completeness.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">/ 10 completitud</span>
          </div>
        )}
      </div>

      {(str(d.recommended_trim) || str(d.recommended_engine) || num(d.recommended_wheels_inches) !== undefined) && (
        <div className="rounded-lg border border-border bg-muted/20 p-3 grid sm:grid-cols-3 gap-2 text-xs">
          {str(d.recommended_trim) && (
            <div><span className="text-muted-foreground">Acabado: </span><span className="font-semibold">{str(d.recommended_trim)}</span></div>
          )}
          {str(d.recommended_engine) && (
            <div><span className="text-muted-foreground">Motor: </span><span className="font-semibold">{str(d.recommended_engine)}</span></div>
          )}
          {num(d.recommended_wheels_inches) !== undefined && (
            <div><span className="text-muted-foreground">Llantas: </span><span className="font-semibold">{d.recommended_wheels_inches as number}"</span></div>
          )}
        </div>
      )}

      {Object.keys(breakdown).length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Ejes del skill</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(breakdownLabels).map(([k, label]) => {
              if (!(k in breakdown)) return null;
              const ok = breakdown[k];
              return (
                <span key={k} className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border ${
                  ok ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                }`}>
                  {ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}{label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {str(d.reasoning) && (
        <p className="text-xs text-foreground border-l-2 border-primary/40 pl-3 italic">{str(d.reasoning)}</p>
      )}
      {str(d.verdict) && (
        <p className="text-sm font-semibold text-primary">{str(d.verdict)}</p>
      )}
    </div>
  );
}

// ── Router por step_type ──────────────────────────────────────────────────────

const VIEWS: Record<string, (p: { data: Json }) => ReactNode> = {
  technical_specs:      TechnicalSpecsView,
  real_consumption:     RealConsumptionView,
  press_review:         PressReviewView,
  ncap:                 NcapView,
  owner_opinions:       OwnerOpinionsView,
  market_price:         MarketPriceView,
  competitive_analysis: CompetitiveView,
  final_decision:       FinalDecisionView,
};

export function StepResultView({ stepType, data }: { stepType: string; data: Json }) {
  if (!data || !Object.keys(data).length) return null;
  const View = VIEWS[stepType];
  if (View) return <View data={data} />;
  // Fallback genérico: tarjetas con pares clave/valor
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {Object.entries(data).map(([k, v]) => (
        <div key={k} className="rounded border border-border bg-card p-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</p>
          <p className="text-xs font-mono break-words">{typeof v === "object" ? JSON.stringify(v) : String(v)}</p>
        </div>
      ))}
    </div>
  );
}
