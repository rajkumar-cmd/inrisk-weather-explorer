from datetime import UTC, datetime

from app.filenames import build_weather_filename, is_weather_filename


def test_filename_normalizes_coordinates_and_uses_utc() -> None:
    name = build_weather_filename(
        -0.0,
        77.59000000,
        "2025-01-01",
        "2025-01-02",
        datetime(2025, 2, 3, 4, 5, 6, 789, tzinfo=UTC),
    )

    assert name == "weather_0_77.59_2025-01-01_2025-01-02_20250203T040506000789Z.json"
    assert is_weather_filename(name)

