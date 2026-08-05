import json
from datetime import UTC, datetime

import pytest

from app.models import StoredFile


SAMPLE_PAYLOAD = {
    "latitude": 12.97,
    "longitude": 77.59,
    "timezone": "Asia/Kolkata",
    "daily_units": {
        "temperature_2m_max": "°C",
        "temperature_2m_min": "°C",
    },
    "daily": {
        "time": ["2025-01-01"],
        "temperature_2m_max": [28.1],
        "temperature_2m_min": [17.4],
        "apparent_temperature_max": [27.6],
        "apparent_temperature_min": [16.9],
    },
}


class FakeWeatherClient:
    def __init__(self, payload: bytes = json.dumps(SAMPLE_PAYLOAD).encode()) -> None:
        self.payload = payload
        self.calls = []

    async def fetch_daily(self, *args):
        self.calls.append(args)
        return self.payload


class FakeStorage:
    def __init__(self) -> None:
        self.uploads: list[tuple[str, bytes]] = []
        self.files: list[StoredFile] = []
        self.content = SAMPLE_PAYLOAD
        self.missing = False

    async def put_json(self, name: str, payload: bytes) -> None:
        self.uploads.append((name, payload))

    async def list_files(self) -> list[StoredFile]:
        return self.files

    async def get_json(self, _name: str):
        if self.missing:
            raise FileNotFoundError
        return self.content


def test_store_weather_data_preserves_provider_payload(
    client, override_dependencies
) -> None:
    weather = FakeWeatherClient()
    storage = FakeStorage()
    override_dependencies(weather, storage)

    response = client.post(
        "/store-weather-data",
        json={
            "latitude": 12.97,
            "longitude": 77.59,
            "start_date": "2025-01-01",
            "end_date": "2025-01-31",
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["file"].startswith(
        "weather_12.97_77.59_2025-01-01_2025-01-31_"
    )
    assert storage.uploads == [(response.json()["file"], weather.payload)]
    assert len(weather.calls) == 1


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("latitude", -90.01),
        ("latitude", 90.01),
        ("longitude", -180.01),
        ("longitude", 180.01),
        ("start_date", "not-a-date"),
    ],
)
def test_store_rejects_invalid_fields(
    client, override_dependencies, field, value
) -> None:
    weather = FakeWeatherClient()
    storage = FakeStorage()
    override_dependencies(weather, storage)
    body = {
        "latitude": 12.97,
        "longitude": 77.59,
        "start_date": "2025-01-01",
        "end_date": "2025-01-10",
    }
    body[field] = value

    response = client.post("/store-weather-data", json=body)

    assert response.status_code == 400
    assert response.json()["status"] == "error"
    assert weather.calls == []


@pytest.mark.parametrize(
    ("start_date", "end_date", "message"),
    [
        ("2025-02-01", "2025-01-31", "start_date must be on or before end_date"),
        ("2025-01-01", "2025-02-01", "date range cannot exceed 31 days"),
    ],
)
def test_store_rejects_invalid_date_ranges(
    client, override_dependencies, start_date, end_date, message
) -> None:
    weather = FakeWeatherClient()
    storage = FakeStorage()
    override_dependencies(weather, storage)

    response = client.post(
        "/store-weather-data",
        json={
            "latitude": 0,
            "longitude": 0,
            "start_date": start_date,
            "end_date": end_date,
        },
    )

    assert response.status_code == 400
    assert response.json() == {"status": "error", "message": message}


def test_list_weather_files(client, override_dependencies) -> None:
    storage = FakeStorage()
    storage.files = [
        StoredFile(
            name="weather_0_0_2025-01-01_2025-01-01_20250102T030405000000Z.json",
            size=512,
            created_at="2025-01-02T03:04:05Z",
        )
    ]
    override_dependencies(FakeWeatherClient(), storage)

    response = client.get("/list-weather-files")

    assert response.status_code == 200
    assert response.json() == {"files": [storage.files[0].model_dump()]}


def test_get_weather_file_content(client, override_dependencies) -> None:
    storage = FakeStorage()
    override_dependencies(FakeWeatherClient(), storage)
    name = "weather_0_0_2025-01-01_2025-01-01_20250102T030405000000Z.json"

    response = client.get(f"/weather-file-content/{name}")

    assert response.status_code == 200
    assert response.json() == SAMPLE_PAYLOAD


@pytest.mark.parametrize("name", ["../secret.json", "notes.json", "weather_bad.json"])
def test_get_rejects_unsafe_or_unexpected_names(
    client, override_dependencies, name
) -> None:
    override_dependencies(FakeWeatherClient(), FakeStorage())

    response = client.get(f"/weather-file-content/{name}")

    assert response.status_code == 404
    assert response.json() == {"status": "error", "message": "not found"}


def test_get_returns_required_payload_for_missing_file(
    client, override_dependencies
) -> None:
    storage = FakeStorage()
    storage.missing = True
    override_dependencies(FakeWeatherClient(), storage)
    name = "weather_0_0_2025-01-01_2025-01-01_20250102T030405000000Z.json"

    response = client.get(f"/weather-file-content/{name}")

    assert response.status_code == 404
    assert response.json() == {"status": "error", "message": "not found"}

