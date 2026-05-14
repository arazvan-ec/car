"""
Export de entidades legacy (VehicleAnalysis, PressReview, Comparison) a JSON.

Pensado como salvaguarda antes de la migración Alembic `drop_legacy_entities`,
que borra estas tablas en favor del modelo unificado basado en PipelineRun.

Uso:
    API_URL=https://carr-production.up.railway.app \
    API_KEY=<tu-api-key> \
    python api/scripts/export_legacy.py [output_dir]

Si no se pasa output_dir, escribe en ./legacy_export_YYYYMMDD/.
Genera tres JSON:
    - analyses.json       VehicleAnalysis completos
    - press_reviews.json  PressReview agrupados por analysis_id
    - comparisons.json    Comparison completos
"""
import json
import os
import sys
import urllib.request
from datetime import datetime
from pathlib import Path


def fetch(url: str, key: str) -> list[dict]:
    req = urllib.request.Request(url, headers={"X-API-Key": key})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def main() -> int:
    api_url = os.environ.get("API_URL")
    api_key = os.environ.get("API_KEY")
    if not api_url or not api_key:
        print("Faltan API_URL y/o API_KEY", file=sys.stderr)
        return 1

    out_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(f"legacy_export_{datetime.utcnow():%Y%m%d}")
    out_dir.mkdir(parents=True, exist_ok=True)

    analyses = fetch(f"{api_url}/api/v1/analyses/", api_key)
    (out_dir / "analyses.json").write_text(json.dumps(analyses, indent=2, ensure_ascii=False))
    print(f"  · analyses.json       {len(analyses)} registros")

    reviews_by_analysis = {}
    for analysis in analyses:
        reviews = fetch(f"{api_url}/api/v1/analyses/{analysis['id']}/reviews/", api_key)
        if reviews:
            reviews_by_analysis[analysis["id"]] = reviews
    (out_dir / "press_reviews.json").write_text(json.dumps(reviews_by_analysis, indent=2, ensure_ascii=False))
    total_reviews = sum(len(v) for v in reviews_by_analysis.values())
    print(f"  · press_reviews.json  {total_reviews} reviews")

    comparisons = fetch(f"{api_url}/api/v1/comparisons/", api_key)
    (out_dir / "comparisons.json").write_text(json.dumps(comparisons, indent=2, ensure_ascii=False))
    print(f"  · comparisons.json    {len(comparisons)} registros")

    print(f"\nExportación completa en: {out_dir.resolve()}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
