from __future__ import annotations

import csv
import json
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
INPUT_CSV = ROOT / "observation-data" / "ebird-data-260408-culled.csv"
STYLE_ROOT = ROOT / "mapbox-project" / "style-ornithology_v1.1.0"
DATA_DIR = STYLE_ROOT / "data"
OUTPUT_GEOJSON = DATA_DIR / "ebird-location-activity.geojson"
OUTPUT_STYLE = STYLE_ROOT / "style.json"

STYLE_NAME = "ornithology-field-atlas_v1.1.0"
MAX_LABEL_LENGTH = 42


@dataclass
class LocationSummary:
    location_id: str
    location: str
    state_province: str
    county: str
    latitude: float
    longitude: float
    submission_ids: set[str] = field(default_factory=set)
    common_names: set[str] = field(default_factory=set)
    observation_rows: int = 0
    first_date: str | None = None
    last_date: str | None = None

    def add_row(self, row: dict[str, str]) -> None:
        self.submission_ids.add(row["Submission ID"])
        self.common_names.add(row["Common Name"])
        self.observation_rows += 1

        observed_on = row["Date"]
        if self.first_date is None or observed_on < self.first_date:
            self.first_date = observed_on
        if self.last_date is None or observed_on > self.last_date:
            self.last_date = observed_on

    @property
    def visits_count(self) -> int:
        return len(self.submission_ids)

    @property
    def unique_species_count(self) -> int:
        return len(self.common_names)

    @property
    def short_location(self) -> str:
        if len(self.location) <= MAX_LABEL_LENGTH:
            return self.location
        return f"{self.location[: MAX_LABEL_LENGTH - 3].rstrip()}..."


def read_location_summaries() -> list[LocationSummary]:
    by_location: dict[str, LocationSummary] = {}

    with INPUT_CSV.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            location_id = row["Location ID"]
            summary = by_location.get(location_id)
            if summary is None:
                summary = LocationSummary(
                    location_id=location_id,
                    location=row["Location"],
                    state_province=row["State/Province"],
                    county=row["County"],
                    latitude=float(row["Latitude"]),
                    longitude=float(row["Longitude"]),
                )
                by_location[location_id] = summary

            summary.add_row(row)

    return sorted(
        by_location.values(),
        key=lambda item: (-item.visits_count, -item.observation_rows, item.location),
    )


def build_geojson(summaries: list[LocationSummary]) -> dict:
    max_visits = max(summary.visits_count for summary in summaries)
    max_observation_rows = max(summary.observation_rows for summary in summaries)
    max_unique_species = max(summary.unique_species_count for summary in summaries)

    features = []
    for summary in summaries:
        visit_share = round(summary.visits_count / max_visits, 4)
        observation_share = round(summary.observation_rows / max_observation_rows, 4)
        species_share = round(summary.unique_species_count / max_unique_species, 4)
        activity_score = round((visit_share + observation_share) / 2, 4)

        features.append(
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [summary.longitude, summary.latitude],
                },
                "properties": {
                    "location_id": summary.location_id,
                    "location": summary.location,
                    "location_short": summary.short_location,
                    "state_province": summary.state_province,
                    "county": summary.county,
                    "visits_count": summary.visits_count,
                    "species_observation_count": summary.observation_rows,
                    "unique_species_count": summary.unique_species_count,
                    "visit_share": visit_share,
                    "observation_share": observation_share,
                    "species_share": species_share,
                    "activity_score": activity_score,
                    "first_observed_on": summary.first_date,
                    "last_observed_on": summary.last_date,
                },
            }
        )

    return {
        "type": "FeatureCollection",
        "metadata": {
            "generated_from": str(INPUT_CSV.relative_to(ROOT)).replace("\\", "/"),
            "generated_at": datetime.now(UTC).replace(microsecond=0).isoformat(),
            "location_count": len(features),
            "max_visits_count": max_visits,
            "max_species_observation_count": max_observation_rows,
            "max_unique_species_count": max_unique_species,
        },
        "features": features,
    }


def build_style(geojson: dict) -> dict:
    bbox = feature_collection_bbox(geojson)
    center = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2]

    return {
        "version": 8,
        "name": STYLE_NAME,
        "metadata": {
            "ornithology:generated_from": str(INPUT_CSV.relative_to(ROOT)).replace("\\", "/"),
            "ornithology:generated_at": datetime.now(UTC).replace(microsecond=0).isoformat(),
            "ornithology:location_count": len(geojson["features"]),
            "ornithology:heat_metric": "activity_score = average(visit_share, observation_share)",
            "ornithology:visit_metric": "visits_count = unique Submission ID count by Location ID",
            "ornithology:observation_metric": "species_observation_count = total CSV rows by Location ID",
        },
        "center": [round(center[0], 6), round(center[1], 6)],
        "zoom": 1.45,
        "bearing": 0,
        "pitch": 0,
        "projection": {"name": "globe"},
        "glyphs": "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
        "imports": [
            {
                "id": "basemap",
                "url": "mapbox://styles/mapbox/standard",
                "config": {
                    "theme": "faded",
                    "lightPreset": "dawn",
                    "showPointOfInterestLabels": False,
                    "showRoadLabels": False,
                    "showTransitLabels": False,
                    "showPedestrianRoads": False,
                    "showAdminBoundaries": False,
                    "show3dObjects": False,
                    "colorLand": "#f7f3e8",
                    "colorWater": "#a7cfc6",
                    "colorGreenspace": "#d8e7c2",
                    "colorRoads": "#ddd4c6",
                },
            }
        ],
        "sources": {
            "ornithology-location-activity": {
                "type": "geojson",
                "data": geojson,
            }
        },
        "layers": [
            {
                "id": "ornithology-location-activity-heat",
                "type": "heatmap",
                "slot": "middle",
                "source": "ornithology-location-activity",
                "maxzoom": 9,
                "paint": {
                    "heatmap-weight": [
                        "interpolate",
                        ["linear"],
                        ["get", "activity_score"],
                        0,
                        0,
                        1,
                        1,
                    ],
                    "heatmap-intensity": [
                        "interpolate",
                        ["linear"],
                        ["zoom"],
                        0,
                        0.7,
                        5,
                        1.5,
                        9,
                        2.6,
                    ],
                    "heatmap-color": [
                        "interpolate",
                        ["linear"],
                        ["heatmap-density"],
                        0,
                        "rgba(247,243,232,0)",
                        0.18,
                        "#d8e7c2",
                        0.38,
                        "#9fc98d",
                        0.58,
                        "#4e9b73",
                        0.78,
                        "#f1b24a",
                        1,
                        "#cc5a2d",
                    ],
                    "heatmap-radius": [
                        "interpolate",
                        ["linear"],
                        ["zoom"],
                        0,
                        10,
                        4,
                        18,
                        9,
                        34,
                    ],
                    "heatmap-opacity": [
                        "interpolate",
                        ["linear"],
                        ["zoom"],
                        6,
                        0.95,
                        9,
                        0,
                    ],
                },
            },
            {
                "id": "ornithology-location-activity-points",
                "type": "circle",
                "slot": "middle",
                "source": "ornithology-location-activity",
                "minzoom": 7,
                "paint": {
                    "circle-radius": [
                        "interpolate",
                        ["linear"],
                        ["zoom"],
                        7,
                        [
                            "interpolate",
                            ["linear"],
                            ["get", "visits_count"],
                            1,
                            5,
                            17,
                            18,
                        ],
                        12,
                        [
                            "interpolate",
                            ["linear"],
                            ["get", "visits_count"],
                            1,
                            8,
                            17,
                            30,
                        ],
                    ],
                    "circle-color": [
                        "interpolate",
                        ["linear"],
                        ["get", "species_observation_count"],
                        1,
                        "#f7f3e8",
                        10,
                        "#d8e7c2",
                        25,
                        "#7cb17a",
                        60,
                        "#3d8f73",
                        139,
                        "#cc5a2d",
                    ],
                    "circle-stroke-color": [
                        "interpolate",
                        ["linear"],
                        ["get", "visits_count"],
                        1,
                        "#5e7a6b",
                        17,
                        "#3b3027",
                    ],
                    "circle-stroke-width": [
                        "interpolate",
                        ["linear"],
                        ["zoom"],
                        7,
                        1,
                        12,
                        2,
                    ],
                    "circle-opacity": [
                        "interpolate",
                        ["linear"],
                        ["zoom"],
                        7,
                        0,
                        8,
                        0.92,
                    ],
                    "circle-emissive-strength": 0.9,
                },
            },
            {
                "id": "ornithology-location-activity-labels",
                "type": "symbol",
                "slot": "top",
                "source": "ornithology-location-activity",
                "minzoom": 8,
                "filter": [
                    "any",
                    [">=", ["get", "visits_count"], 3],
                    [">=", ["get", "species_observation_count"], 15],
                ],
                "layout": {
                    "text-field": [
                        "concat",
                        ["get", "location_short"],
                        "\n",
                        "Visits ",
                        ["to-string", ["get", "visits_count"]],
                        " | Obs ",
                        ["to-string", ["get", "species_observation_count"]],
                    ],
                    "text-size": [
                        "interpolate",
                        ["linear"],
                        ["zoom"],
                        8,
                        11,
                        12,
                        13,
                    ],
                    "text-anchor": "top",
                    "text-offset": [0, 1.2],
                    "text-max-width": 16,
                },
                "paint": {
                    "text-color": "#2d241f",
                    "text-halo-color": "rgba(247,243,232,0.95)",
                    "text-halo-width": 1.25,
                    "text-halo-blur": 0.6,
                },
            },
        ],
    }


def feature_collection_bbox(geojson: dict) -> tuple[float, float, float, float]:
    coordinates = [feature["geometry"]["coordinates"] for feature in geojson["features"]]
    longitudes = [coord[0] for coord in coordinates]
    latitudes = [coord[1] for coord in coordinates]
    return min(longitudes), min(latitudes), max(longitudes), max(latitudes)


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")


def main() -> None:
    summaries = read_location_summaries()
    geojson = build_geojson(summaries)
    style = build_style(geojson)

    write_json(OUTPUT_GEOJSON, geojson)
    write_json(OUTPUT_STYLE, style)

    print(f"Wrote {OUTPUT_GEOJSON.relative_to(ROOT)}")
    print(f"Wrote {OUTPUT_STYLE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
