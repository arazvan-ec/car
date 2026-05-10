/**
 * Hook central para comunicarse con la Car Analytics API.
 * La URL base y la API Key se leen de variables de entorno Vite.
 * En desarrollo: crear client/.env.local con VITE_API_URL y VITE_API_KEY.
 * En Railway: configurar como variables de entorno del servicio frontend.
 */
import { useState, useEffect, useCallback } from "react";

const API_URL = (import.meta.env.VITE_API_URL as string) || "";
const API_KEY = (import.meta.env.VITE_API_KEY as string) || "";

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "X-API-Key": API_KEY,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

export function useApiData<T>(path: string, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<T>(path);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}

// ── Tipos de la API ───────────────────────────────────────────────────────────

export interface VehicleAnalysis {
  id: string;
  brand: string;
  model: string;
  year: number;
  trim: string;
  engine: string;
  drivetrain: string;
  fuel_type: string;
  horsepower: number;
  wheel_size_inches: number | null;
  headlights_type: string | null;
  wltp_consumption: number | null;
  real_consumption: number | null;
  dgt_label: string;
  list_price_eur: number;
  euro_ncap_stars: number | null;
  euro_ncap_adult_pct: number | null;
  press_rating: number | null;
  press_sources: string[];
  pros: string[];
  cons: string[];
  reliability_notes: string | null;
  has_daily_charging: boolean | null;
  raw_notes: string | null;
  created_at: string;
}

export interface Comparison {
  id: string;
  analysis_a_id: string;
  analysis_b_id: string;
  verdict: string;
  winner_brand: string;
  winner_model: string;
  criteria_winners: Record<string, string>;
  raw_notes: string | null;
  created_at: string;
}

export interface Stats {
  total_analyses: number;
  total_comparisons: number;
  top_brands: { brand: string; count: number }[];
  top_fuel_types: { fuel_type: string; count: number }[];
  avg_price_eur: number | null;
  avg_press_rating: number | null;
}
