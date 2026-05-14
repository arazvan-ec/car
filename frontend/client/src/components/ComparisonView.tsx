/**
 * Vista de detalle para PipelineRun tipo `vehicle_comparison`.
 * Carga los análisis individuales referenciados en subject_data.vehicles[]
 * y los muestra como tarjetas side-by-side + tabla comparativa de specs clave.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Car, Trophy, ArrowRight, ExternalLink, Crown, Zap, Disc, Fuel, Tag, Shield, Star } from "lucide-react";
import { getStepData, vehicleTitle } from "./AnalysisHero";
import { ErrorState } from "./ui-custom";

const API_URL = (import.meta.env.VITE_API_URL as string) || "";
const API_KEY = (import.meta.env.VITE_API_KEY as string) || "";

interface PipelineStep {
  step_type: string;
  status: string;
  structured_result: Record<string, unknown> | null;
}
interface PipelineRunLike {
  id: string;
  subject_data: Record<string, unknown>;
  decision: Record<string, unknown> | null;
  steps: PipelineStep[];
}

const num = (v: unknown) => (typeof v === "number" ? v : undefined);
const str = (v: unknown) => (typeof v === "string" ? v : undefined);
const fmtEur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

async function fetchRun(id: string): Promise<PipelineRunLike> {
  const res = await fetch(`${API_URL}/api/v1/pipelines/runs/${id}`, {
    headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

function usePipelineRuns(ids: string[]) {
  const [runs, setRuns] = useState<PipelineRunLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!ids.length) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true); setError(null);
    Promise.all(ids.map(fetchRun))
      .then(rs => { if (!cancelled) setRuns(rs); })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : "Error"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);
  return { runs, loading, error };
}

// ── Tabla side-by-side ───────────────────────────────────────────────────────

type Row = {
  label: string;
  icon: React.ElementType;
  values: (string | undefined)[];
  winnerIdx?: number;     // índice del coche que gana este eje
};

function buildRows(runs: PipelineRunLike[]): Row[] {
  const specs   = runs.map(r => getStepData(r, "technical_specs"));
  const cons    = runs.map(r => getStepData(r, "real_consumption"));
  const price   = runs.map(r => getStepData(r, "market_price"));
  const ncap    = runs.map(r => getStepData(r, "ncap"));
  const press   = runs.map(r => getStepData(r, "press_review"));
  const owners  = runs.map(r => getStepData(r, "owner_opinions"));

  const argmax = (vals: (number | undefined)[]) => {
    let bestI = -1; let best = -Infinity;
    vals.forEach((v, i) => { if (v !== undefined && v > best) { best = v; bestI = i; } });
    return bestI === -1 ? undefined : bestI;
  };
  const argmin = (vals: (number | undefined)[]) => {
    let bestI = -1; let best = Infinity;
    vals.forEach((v, i) => { if (v !== undefined && v < best) { best = v; bestI = i; } });
    return bestI === -1 ? undefined : bestI;
  };

  const cv      = specs.map(s => num(s?.horsepower));
  const torque  = specs.map(s => num(s?.torque_nm));
  const wheels  = specs.map(s => num(s?.wheel_size_inches));
  const accel   = specs.map(s => num(s?.acceleration_0_100));
  const boot    = specs.map(s => num(s?.boot_liters));
  const realC   = cons.map(c => num(c?.real_consumption));
  const street  = price.map(p => num(p?.estimated_street_price_eur));
  const stars   = ncap.map(n => num(n?.stars));
  const adultS  = ncap.map(n => num(n?.adult_pct));
  const pressR  = press.map(p => num(p?.avg_rating) ?? num(p?.rating));
  const ownerR  = owners.map(o => num(o?.rating));

  return [
    { label: "Potencia",         icon: Zap,    values: cv.map(v => v !== undefined ? `${v} CV` : undefined),                 winnerIdx: argmax(cv) },
    { label: "Par",              icon: Zap,    values: torque.map(v => v !== undefined ? `${v} Nm` : undefined),             winnerIdx: argmax(torque) },
    { label: "Llantas",          icon: Disc,   values: wheels.map(v => v !== undefined ? `${v}"` : undefined),               winnerIdx: argmax(wheels) },
    { label: "0–100 km/h",       icon: Zap,    values: accel.map(v => v !== undefined ? `${v} s` : undefined),               winnerIdx: argmin(accel) },
    { label: "Maletero",         icon: Tag,    values: boot.map(v => v !== undefined ? `${v} L` : undefined),                winnerIdx: argmax(boot) },
    { label: "Consumo real",     icon: Fuel,   values: realC.map(v => v !== undefined ? `${v} L/100` : undefined),           winnerIdx: argmin(realC) },
    { label: "Precio calle",     icon: Tag,    values: street.map(v => v !== undefined ? fmtEur(v) : undefined),             winnerIdx: argmin(street) },
    { label: "Euro NCAP",        icon: Shield, values: stars.map(v => v !== undefined ? `${v}★` : undefined),                winnerIdx: argmax(stars) },
    { label: "NCAP adulto",      icon: Shield, values: adultS.map(v => v !== undefined ? `${v}%` : undefined),               winnerIdx: argmax(adultS) },
    { label: "Nota prensa",      icon: Star,   values: pressR.map(v => v !== undefined ? v.toFixed(1) : undefined),          winnerIdx: argmax(pressR) },
    { label: "Nota dueños",      icon: Star,   values: ownerR.map(v => v !== undefined ? v.toFixed(1) : undefined),          winnerIdx: argmax(ownerR) },
  ];
}

function VehicleColumnHeader({
  run, isWinner,
}: { run: PipelineRunLike; isWinner: boolean }) {
  const title = vehicleTitle(run.subject_data);
  const score = num(run.decision?.score) ?? num(getStepData(run, "final_decision")?.score);
  return (
    <div className={`rounded-xl border p-3 ${isWinner ? "border-amber-300 bg-amber-50" : "border-border bg-card"}`}>
      <div className="flex items-center gap-2 mb-1">
        {isWinner ? <Crown className="w-4 h-4 text-amber-500" /> : <Car className="w-4 h-4 text-primary" />}
        <p className="text-sm font-semibold truncate">{title}</p>
      </div>
      <div className="flex items-center justify-between">
        {score !== undefined ? (
          <span className="inline-flex items-center gap-1 text-xs">
            <Trophy className="w-3 h-3 text-amber-500" />
            <span className="font-semibold tabular-nums">{score.toFixed(1)}</span>
            <span className="text-muted-foreground">/10</span>
          </span>
        ) : <span className="text-xs text-muted-foreground">sin score</span>}
        <Link href={`/analyses/${run.id}`}>
          <span className="text-xs text-primary inline-flex items-center gap-0.5 hover:underline">
            análisis <ExternalLink className="w-3 h-3" />
          </span>
        </Link>
      </div>
    </div>
  );
}

export default function ComparisonView({ run }: { run: PipelineRunLike }) {
  const vehiclesMeta = (run.subject_data.vehicles as Array<{ analysis_run_id?: string }> | undefined) ?? [];
  const ids = vehiclesMeta.map(v => v.analysis_run_id).filter((x): x is string => !!x);

  const { runs: analyses, loading, error } = usePipelineRuns(ids);

  const winnerId = str(run.decision?.winner_analysis_run_id);
  const axisWinners = (run.decision?.axis_winners ?? {}) as Record<string, string>;
  const ranking = (run.decision?.ranking ?? []) as Array<{ analysis_run_id: string; score?: number; completeness_score?: number }>;

  // ── Caso: comparativa sin referencias a análisis ──
  if (!ids.length) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-4">
        <p className="text-sm text-amber-900 font-medium mb-1">Comparativa sin análisis vinculados</p>
        <p className="text-xs text-amber-700">
          Esta comparativa no referencia <span className="font-mono">analysis_run_id</span> en{" "}
          <span className="font-mono">subject_data.vehicles</span>. Sigue el flujo del skill v2.1:
          ejecuta primero un <span className="font-mono">vehicle_analysis</span> para cada coche.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {ids.map(id => <div key={id} className="h-24 bg-muted animate-pulse rounded-xl" />)}
      </div>
    );
  }
  if (error) return <ErrorState message={`No se pudieron cargar los análisis vinculados: ${error}`} />;
  if (!analyses.length) return null;

  const rows = buildRows(analyses);

  return (
    <>
      {/* Cabeceras con coche + score */}
      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: `120px repeat(${analyses.length}, minmax(0,1fr))` }}>
        <div /> {/* hueco para columna de labels */}
        {analyses.map(a => (
          <VehicleColumnHeader key={a.id} run={a} isWinner={winnerId === a.id} />
        ))}
      </div>

      {/* Tabla side-by-side */}
      <div className="rounded-xl border border-border bg-card overflow-hidden mb-6">
        {rows.map((row, ri) => {
          const Icon = row.icon;
          return (
            <div
              key={row.label}
              className="grid items-center"
              style={{ gridTemplateColumns: `120px repeat(${analyses.length}, minmax(0,1fr))` }}
            >
              <div className={`px-3 py-2.5 text-xs text-muted-foreground flex items-center gap-1.5 ${ri > 0 ? "border-t border-border" : ""}`}>
                <Icon className="w-3 h-3" />{row.label}
              </div>
              {row.values.map((v, i) => {
                const isWin = row.winnerIdx === i && v !== undefined;
                return (
                  <div
                    key={i}
                    className={`px-3 py-2.5 text-sm tabular-nums font-medium ${ri > 0 ? "border-t border-border" : ""} ${
                      isWin ? "bg-primary/5 text-primary" : "text-foreground"
                    } ${i < analyses.length - 1 ? "border-r border-border" : ""}`}
                  >
                    {v ?? <span className="text-muted-foreground/60">—</span>}
                    {isWin && <span className="ml-1 text-[10px] uppercase tracking-wider text-primary/80">mejor</span>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Ranking + ejes */}
      {(ranking.length > 0 || Object.keys(axisWinners).length > 0) && (
        <div className="grid lg:grid-cols-2 gap-4 mb-6">
          {ranking.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
                <Trophy className="w-3 h-3" /> Ranking final
              </p>
              <ol className="space-y-2">
                {ranking.map((r, i) => {
                  const a = analyses.find(x => x.id === r.analysis_run_id);
                  if (!a) return null;
                  return (
                    <li key={r.analysis_run_id} className={`flex items-center justify-between gap-2 rounded-lg border p-2 ${
                      i === 0 ? "border-amber-200 bg-amber-50" : "border-border bg-card"
                    }`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                          i === 0 ? "bg-amber-200 text-amber-900" : "bg-muted text-muted-foreground"
                        }`}>{i + 1}</span>
                        <span className="text-sm font-medium truncate">{vehicleTitle(a.subject_data)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs tabular-nums">
                        {r.score !== undefined && <span><span className="text-muted-foreground">score </span><span className="font-semibold">{r.score.toFixed(1)}</span></span>}
                        {r.completeness_score !== undefined && <span><span className="text-muted-foreground">compl. </span><span className="font-semibold text-primary">{r.completeness_score.toFixed(1)}</span></span>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {Object.keys(axisWinners).length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
                <ArrowRight className="w-3 h-3" /> Quién gana cada eje
              </p>
              <div className="space-y-1.5">
                {Object.entries(axisWinners).map(([axis, winId]) => {
                  const winner = analyses.find(a => a.id === winId);
                  return (
                    <div key={axis} className="flex items-center justify-between text-xs">
                      <span className="capitalize text-muted-foreground">{axis.replace(/_/g, " ")}</span>
                      <span className="font-medium">{winner ? vehicleTitle(winner.subject_data) : "—"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {str(run.decision?.reasoning) && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-6">
          <p className="text-xs uppercase tracking-wider text-primary font-medium mb-1.5">Razonamiento</p>
          <p className="text-sm text-foreground italic">{str(run.decision?.reasoning)}</p>
        </div>
      )}
    </>
  );
}
