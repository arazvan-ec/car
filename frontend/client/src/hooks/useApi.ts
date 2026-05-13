/**
 * Hook central para comunicarse con la Car Analytics API.
 */
import { useState, useEffect, useCallback } from "react";

const API_URL = (import.meta.env.VITE_API_URL as string) || "";
const API_KEY = (import.meta.env.VITE_API_KEY as string) || "";

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

export function useApiData<T>(path: string, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!path) return;
    setLoading(true); setError(null);
    try { setData(await apiFetch<T>(path)); }
    catch (e) { setError(e instanceof Error ? e.message : "Error desconocido"); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}

export interface VehicleAnalysis {
  id: string; created_at: string;
  brand: string; model: string; year: number; trim: string;
  body_type: string | null; segment: string | null; country_of_manufacture: string | null;
  engine: string; drivetrain: string; fuel_type: string; horsepower: number;
  torque_nm: number | null; acceleration_0_100: number | null;
  top_speed_kmh: number | null; electric_range_km: number | null; gearbox: string | null;
  wheel_size_inches: number | null; headlights_type: string | null; adas_features: string[];
  wltp_consumption: number | null; real_consumption: number | null;
  real_consumption_source: string | null; co2_gkm: number | null; dgt_label: string;
  boot_liters: number | null; length_mm: number | null; width_mm: number | null;
  height_mm: number | null; wheelbase_mm: number | null; seats: number | null;
  list_price_eur: number; typical_discount_pct: number | null;
  estimated_street_price_eur: number | null; renting_monthly_eur: number | null;
  maintenance_cost_annual_eur: number | null;
  main_competitors: string[]; price_vs_competitors: string | null;
  competitive_advantage: string | null; competitive_disadvantage: string | null;
  euro_ncap_stars: number | null; euro_ncap_year: number | null;
  euro_ncap_adult_pct: number | null; euro_ncap_child_pct: number | null;
  euro_ncap_pedestrian_pct: number | null; euro_ncap_safety_assist_pct: number | null;
  press_rating: number | null; press_sources: string[]; press_summary: string | null;
  owner_rating: number | null; owner_rating_source: string | null;
  owner_sample_size: number | null; common_complaints: string[];
  reliability_notes: string | null; known_issues: string[];
  warranty_years: number | null; extended_warranty_available: boolean | null;
  pros: string[]; cons: string[];
  recommended_for: string[]; not_recommended_for: string[];
  ideal_use_case: string | null;
  has_daily_charging: boolean | null; skill_version: string | null;
  analyst_notes: string | null; raw_notes: string | null;
}

export interface Comparison {
  id: string; analysis_a_id: string; analysis_b_id: string;
  verdict: string; winner_brand: string; winner_model: string;
  criteria_winners: Record<string, string>;
  summary: string | null; raw_notes: string | null; created_at: string;
}

export interface Stats {
  total_analyses: number; total_comparisons: number;
  top_brands: { brand: string; count: number }[];
  top_fuel_types: { fuel_type: string; count: number }[];
  top_segments: { segment: string; count: number }[];
  avg_price_eur: number | null; avg_press_rating: number | null;
  avg_owner_rating: number | null; avg_euro_ncap_stars: number | null;
}
