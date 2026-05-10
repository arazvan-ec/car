/**
 * Página: Lista de Análisis
 * Tabla filtrable por marca, modelo y tipo de propulsión
 */
import { useState } from "react";
import { useApiData, type VehicleAnalysis } from "@/hooks/useApi";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DgtBadge, FuelBadge, PressRatingBar, PageHeader, EmptyState, ErrorState, SkeletonRow } from "@/components/ui-custom";
import { Search, ExternalLink } from "lucide-react";

const FUEL_TYPES = ["FHEV", "PHEV", "BEV", "MHEV", "Gasolina", "Diésel"];

export default function Analyses() {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [fuelType, setFuelType] = useState("all");

  const path = `/api/v1/analyses/?limit=100${brand ? `&brand=${encodeURIComponent(brand)}` : ""}${model ? `&model=${encodeURIComponent(model)}` : ""}${fuelType !== "all" ? `&fuel_type=${encodeURIComponent(fuelType)}` : ""}`;
  const { data, loading, error } = useApiData<VehicleAnalysis[]>(path, [brand, model, fuelType]);

  return (
    <Layout>
      <PageHeader
        title="Análisis de Vehículos"
        subtitle={`${data?.length ?? "—"} análisis guardados`}
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Marca..."
            value={brand}
            onChange={e => setBrand(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Modelo..."
            value={model}
            onChange={e => setModel(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <Select value={fuelType} onValueChange={setFuelType}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue placeholder="Propulsión" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {FUEL_TYPES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Vehículo", "Motor", "CV", "Tracción", "Propulsión", "Etiqueta", "Consumo real", "Rating prensa", "Precio", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : error ? (
                <tr><td colSpan={10}><ErrorState message={error} /></td></tr>
              ) : !data?.length ? (
                <tr><td colSpan={10}><EmptyState /></td></tr>
              ) : (
                data.map(a => (
                  <tr key={a.id} className="data-row border-b border-border last:border-0">
                    <td className="px-4 py-3 min-w-[160px]">
                      <p className="font-medium text-foreground">{a.brand} {a.model}</p>
                      <p className="text-xs text-muted-foreground">{a.trim} · {a.year}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">{a.engine}</td>
                    <td className="px-4 py-3 font-mono text-xs font-medium">{a.horsepower}</td>
                    <td className="px-4 py-3 text-xs">{a.drivetrain}</td>
                    <td className="px-4 py-3"><FuelBadge type={a.fuel_type} /></td>
                    <td className="px-4 py-3"><DgtBadge label={a.dgt_label} /></td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {a.real_consumption != null ? `${a.real_consumption} l/100` : "—"}
                    </td>
                    <td className="px-4 py-3"><PressRatingBar value={a.press_rating} /></td>
                    <td className="px-4 py-3 font-mono text-xs font-medium whitespace-nowrap">
                      {a.list_price_eur.toLocaleString("es-ES")} €
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/analyses/${a.id}`}>
                        <span className="text-primary hover:text-primary/80 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
