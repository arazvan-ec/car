/**
 * Hero card para un PipelineRun de tipo `vehicle_analysis`.
 * Recoge los datos clave de varios pasos y los muestra como un panel de instrumentos.
 */
import { Car, Zap, Disc, Fuel, Trophy, Star, Tag, Shield } from "lucide-react";
import { MetricChip } from "./StepResultViews";

interface Step {
  step_type: string;
  status: string;
  structured_result: Record<string, unknown> | null;
}

interface AnalysisRunLike {
  subject_data: Record<string, unknown>;
  decision: Record<string, unknown> | null;
  steps: Step[];
}

const num = (v: unknown) => (typeof v === "number" ? v : undefined);
const str = (v: unknown) => (typeof v === "string" ? v : undefined);
const fmtEur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export function getStepData(run: AnalysisRunLike, type: string): Record<string, unknown> | null {
  return run.steps.find(s => s.step_type === type)?.structured_result ?? null;
}

export function vehicleTitle(subject: Record<string, unknown>): string {
  const s = subject as Record<string, string | number | undefined>;
  return [s.brand, s.model, s.year, s.trim].filter(Boolean).join(" ") || "Vehículo";
}

export default function AnalysisHero({ run }: { run: AnalysisRunLike }) {
  const subject = run.subject_data;
  const specs   = getStepData(run, "technical_specs");
  const cons    = getStepData(run, "real_consumption");
  const price   = getStepData(run, "market_price");
  const ncap    = getStepData(run, "ncap");
  const press   = getStepData(run, "press_review");
  const owners  = getStepData(run, "owner_opinions");
  const dec     = run.decision ?? getStepData(run, "final_decision");

  const cv      = num(specs?.horsepower);
  const cvMax   = num(specs?.max_horsepower_in_range);
  const wheels  = num(specs?.wheel_size_inches);
  const fuel    = str(specs?.fuel_type);
  const drive   = str(specs?.drivetrain);
  const real    = num(cons?.real_consumption);
  const street  = num(price?.estimated_street_price_eur);
  const stars   = num(ncap?.stars);
  const pressR  = num(press?.avg_rating) ?? num(press?.rating);
  const ownerR  = num(owners?.rating);
  const score   = num(dec?.score);

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.04] via-card to-card p-5 mb-6">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Car className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold leading-tight">{vehicleTitle(subject)}</h2>
            <p className="text-xs text-muted-foreground font-mono">
              {[str(subject.segment), str(subject.body_type), str(specs?.gearbox)].filter(Boolean).join(" · ") || "vehicle_analysis"}
            </p>
          </div>
        </div>

        {score !== undefined && (
          <div className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5">
            <Trophy className="w-4 h-4 text-amber-600" />
            <span className="text-2xl font-semibold tabular-nums text-amber-900">{score.toFixed(1)}</span>
            <span className="text-xs text-amber-700">/ 10</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        <MetricChip
          icon={Zap}
          label="Potencia"
          value={cv !== undefined ? `${cv} CV` : "—"}
          sub={cvMax !== undefined ? (cv === cvMax ? "tope de gama" : `máx. ${cvMax} CV`) : drive}
          accent={cv !== undefined && cvMax !== undefined && cv >= cvMax ? "primary" : "muted"}
        />
        <MetricChip
          icon={Disc}
          label="Llantas"
          value={wheels !== undefined ? `${wheels}"` : "—"}
          accent={wheels !== undefined && wheels >= 20 ? "primary" : "amber"}
        />
        <MetricChip icon={Fuel} label="Combustible" value={fuel ?? "—"} sub={real !== undefined ? `real ${real} L/100` : undefined} />
        <MetricChip icon={Tag} label="Precio calle" value={street !== undefined ? fmtEur(street) : "—"} accent={street !== undefined ? "primary" : "muted"} />
        <MetricChip
          icon={Shield}
          label="Euro NCAP"
          value={stars !== undefined ? `${stars}★` : "—"}
        />
        <MetricChip
          icon={Star}
          label="Prensa / Dueños"
          value={pressR !== undefined ? `${pressR.toFixed(1)}` : "—"}
          sub={ownerR !== undefined ? `dueños ${ownerR.toFixed(1)}` : undefined}
        />
      </div>

      {str(dec?.verdict) && (
        <p className="text-sm text-primary font-medium mt-4 border-l-2 border-primary/40 pl-3">{str(dec?.verdict)}</p>
      )}
    </div>
  );
}
