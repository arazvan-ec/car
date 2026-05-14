/**
 * Hook central para comunicarse con la Car Analytics API.
 * El modelo unificado solo expone Pipelines.
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

export interface PipelineRunSummary {
  id: string;
  pipeline_type: string;
  subject_type: string;
  subject_data: Record<string, unknown>;
  status: string;
  skill_version: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  steps_total: number;
  steps_completed: number;
  steps_pending: number;
  steps_stale: number;
  steps_failed: number;
}
