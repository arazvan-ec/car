/**
 * Componente: Reviews de Prensa — sección expandible en AnalysisDetail
 * Muestra cada review con URL, puntuación, pros/contras y texto completo expandible
 */
import { useState } from "react";
import { useApiData } from "@/hooks/useApi";
import { ExternalLink, ChevronDown, ChevronUp, CheckCircle2, XCircle, Star } from "lucide-react";

interface PressReview {
  id: string;
  analysis_id: string;
  source: string;
  url: string;
  rating: number | null;
  title: string | null;
  author: string | null;
  published_date: string | null;
  summary: string | null;
  full_text: string | null;
  pros: string[];
  cons: string[];
  verdict: string | null;
  created_at: string;
}

const SOURCE_COLORS: Record<string, string> = {
  km77:       "bg-blue-50 text-blue-700 border-blue-200",
  Motor1:     "bg-red-50 text-red-700 border-red-200",
  CarWow:     "bg-orange-50 text-orange-700 border-orange-200",
  AutoBild:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  SuperMotor: "bg-green-50 text-green-700 border-green-200",
  CarMagazine:"bg-purple-50 text-purple-700 border-purple-200",
};

function RatingDot({ value }: { value: number | null }) {
  if (value === null) return null;
  const color = value >= 8 ? "text-green-500" : value >= 6 ? "text-amber-400" : "text-red-400";
  return (
    <span className={`flex items-center gap-1 text-sm font-mono font-semibold ${color}`}>
      <Star className="w-3.5 h-3.5 fill-current" />
      {value.toFixed(1)}
    </span>
  );
}

function ReviewCard({ review }: { review: PressReview }) {
  const [expanded, setExpanded] = useState(false);
  const sourceColor = SOURCE_COLORS[review.source] ?? "bg-muted text-muted-foreground border-border";

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${sourceColor}`}>
              {review.source}
            </span>
            <RatingDot value={review.rating} />
            {review.published_date && (
              <span className="text-xs text-muted-foreground font-mono">{review.published_date}</span>
            )}
          </div>
          {review.title && (
            <p className="text-sm font-medium text-foreground leading-snug">{review.title}</p>
          )}
          {review.author && (
            <p className="text-xs text-muted-foreground mt-0.5">por {review.author}</p>
          )}
        </div>
        <a
          href={review.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-primary hover:text-primary/80 transition-colors mt-0.5"
          title="Ver fuente original"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Summary */}
      {review.summary && (
        <div className="px-4 pb-3">
          <p className="text-xs text-muted-foreground italic">"{review.summary}"</p>
        </div>
      )}

      {/* Pros & Cons */}
      {(review.pros?.length > 0 || review.cons?.length > 0) && (
        <div className="px-4 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {review.pros?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wider mb-1">Puntos fuertes</p>
              {review.pros.map((p, i) => (
                <div key={i} className="flex items-start gap-1.5 py-0.5">
                  <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-xs">{p}</span>
                </div>
              ))}
            </div>
          )}
          {review.cons?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wider mb-1">Puntos débiles</p>
              {review.cons.map((c, i) => (
                <div key={i} className="flex items-start gap-1.5 py-0.5">
                  <XCircle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                  <span className="text-xs">{c}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Verdict */}
      {review.verdict && (
        <div className="px-4 pb-3">
          <p className="text-xs font-medium text-foreground border-l-2 border-primary pl-2">
            {review.verdict}
          </p>
        </div>
      )}

      {/* Full text toggle */}
      {review.full_text && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-4 py-2.5 border-t border-border text-xs text-muted-foreground hover:bg-muted/30 transition-colors"
          >
            <span>{expanded ? "Ocultar texto completo" : "Ver texto completo guardado"}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {expanded && (
            <div className="px-4 pb-4 pt-2 border-t border-border bg-muted/20">
              <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed font-mono">
                {review.full_text}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function PressReviewsSection({ analysisId }: { analysisId: string }) {
  const { data: reviews, loading } = useApiData<PressReview[]>(
    `/api/v1/analyses/${analysisId}/reviews/`
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
      </div>
    );
  }

  if (!reviews?.length) {
    return (
      <p className="text-xs text-muted-foreground italic">
        No hay reviews de prensa guardadas para este análisis.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-muted-foreground">{reviews.length} review{reviews.length !== 1 ? "s" : ""} guardada{reviews.length !== 1 ? "s" : ""}</p>
        <p className="text-xs text-muted-foreground">
          Media: <span className="font-mono font-medium text-foreground">
            {reviews.filter(r => r.rating !== null).length > 0
              ? (reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.filter(r => r.rating !== null).length).toFixed(1)
              : "—"
            }/10
          </span>
        </p>
      </div>
      {reviews.map(review => <ReviewCard key={review.id} review={review} />)}
    </div>
  );
}
