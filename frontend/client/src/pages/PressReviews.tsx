/**
 * Componente: Reviews de Prensa
 * - `PressReviewsCarousel`: carrusel para el sidebar de AnalysisDetail (swipe en móvil).
 * - `PressReviewsSection`: lista vertical (mantenida por compatibilidad).
 */
import { useEffect, useState } from "react";
import { useApiData } from "@/hooks/useApi";
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Star,
  Newspaper,
} from "lucide-react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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

function sourceColor(source: string) {
  return SOURCE_COLORS[source] ?? "bg-muted text-muted-foreground border-border";
}

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

function ReviewCard({ review, compact = false }: { review: PressReview; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const cls = sourceColor(review.source);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden h-full flex flex-col">
      <div className="flex items-start justify-between p-3 sm:p-4 gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${cls}`}>
              {review.source}
            </span>
            <RatingDot value={review.rating} />
          </div>
          {review.title && (
            <p className={`${compact ? "text-xs" : "text-sm"} font-medium text-foreground leading-snug line-clamp-3`}>
              {review.title}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
            {review.author && <span className="truncate">{review.author}</span>}
            {review.author && review.published_date && <span>·</span>}
            {review.published_date && <span className="font-mono">{review.published_date}</span>}
          </div>
        </div>
        <a
          href={review.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-primary hover:text-primary/80 transition-colors p-1 -m-1"
          title="Ver fuente original"
          aria-label="Abrir fuente original"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {review.summary && (
        <div className="px-3 sm:px-4 pb-3">
          <p className="text-xs text-muted-foreground italic line-clamp-4">"{review.summary}"</p>
        </div>
      )}

      {(review.pros?.length > 0 || review.cons?.length > 0) && (
        <div className="px-3 sm:px-4 pb-3 grid grid-cols-1 gap-3">
          {review.pros?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wider mb-1">Puntos fuertes</p>
              {review.pros.slice(0, compact ? 3 : undefined).map((p, i) => (
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
              {review.cons.slice(0, compact ? 3 : undefined).map((c, i) => (
                <div key={i} className="flex items-start gap-1.5 py-0.5">
                  <XCircle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                  <span className="text-xs">{c}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {review.verdict && (
        <div className="px-3 sm:px-4 pb-3">
          <p className="text-xs font-medium text-foreground border-l-2 border-primary pl-2 line-clamp-4">
            {review.verdict}
          </p>
        </div>
      )}

      {review.full_text && (
        <div className="mt-auto">
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-full flex items-center justify-between px-3 sm:px-4 py-3 border-t border-border text-xs text-muted-foreground hover:bg-muted/30 active:bg-muted/50 transition-colors"
          >
            <span>{expanded ? "Ocultar texto completo" : "Ver texto completo"}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {expanded && (
            <div className="px-3 sm:px-4 pb-4 pt-2 border-t border-border bg-muted/20 max-h-72 overflow-y-auto">
              <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed font-mono">
                {review.full_text}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function averageRating(reviews: PressReview[]): number | null {
  const rated = reviews.filter(r => r.rating !== null);
  if (rated.length === 0) return null;
  return rated.reduce((sum, r) => sum + (r.rating ?? 0), 0) / rated.length;
}

export function PressReviewsCarousel({
  analysisId,
  pressSummary,
}: {
  analysisId: string;
  pressSummary?: string | null;
}) {
  const { data: reviews, loading } = useApiData<PressReview[]>(
    `/api/v1/analyses/${analysisId}/reviews/`
  );
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    api.on("reInit", () => {
      setCount(api.scrollSnapList().length);
      setCurrent(api.selectedScrollSnap());
    });
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (loading) {
    return <div className="h-56 bg-muted animate-pulse rounded-xl" />;
  }

  if (!reviews?.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-2">
          <Newspaper className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Reviews de Prensa</h2>
        </div>
        <p className="text-xs text-muted-foreground italic">
          No hay reviews de prensa guardadas para este análisis.
        </p>
      </div>
    );
  }

  const avg = averageRating(reviews);

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Reviews de Prensa</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</span>
          {avg !== null && (
            <>
              <span>·</span>
              <span>
                Media <span className="font-mono font-medium text-foreground">{avg.toFixed(1)}/10</span>
              </span>
            </>
          )}
        </div>
      </div>

      {pressSummary && (
        <p className="text-xs text-muted-foreground italic mb-3 line-clamp-3">"{pressSummary}"</p>
      )}

      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: false, containScroll: "trimSnaps" }}
        className="w-full"
      >
        <CarouselContent className="-ml-2">
          {reviews.map(review => (
            <CarouselItem key={review.id} className="pl-2 basis-full">
              <ReviewCard review={review} compact />
            </CarouselItem>
          ))}
        </CarouselContent>

        {reviews.length > 1 && (
          <div className="flex items-center justify-between mt-3">
            <CarouselPrevious
              className="static translate-y-0 h-8 w-8"
              aria-label="Review anterior"
            />
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Páginas">
              {Array.from({ length: count }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => api?.scrollTo(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === current ? "w-5 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground/40"
                  }`}
                  aria-label={`Ir a review ${i + 1}`}
                  aria-current={i === current}
                />
              ))}
            </div>
            <CarouselNext
              className="static translate-y-0 h-8 w-8"
              aria-label="Review siguiente"
            />
          </div>
        )}
      </Carousel>
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

  const avg = averageRating(reviews);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-muted-foreground">
          {reviews.length} review{reviews.length !== 1 ? "s" : ""} guardada{reviews.length !== 1 ? "s" : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          Media: <span className="font-mono font-medium text-foreground">
            {avg !== null ? `${avg.toFixed(1)}/10` : "—"}
          </span>
        </p>
      </div>
      {reviews.map(review => <ReviewCard key={review.id} review={review} />)}
    </div>
  );
}
