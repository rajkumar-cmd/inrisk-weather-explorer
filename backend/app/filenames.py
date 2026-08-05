import re
from datetime import UTC, datetime


WEATHER_FILE_PATTERN = re.compile(
    r"^weather_-?\d+(?:\.\d+)?_-?\d+(?:\.\d+)?_"
    r"\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}_"
    r"\d{8}T\d{12}Z\.json$"
)


def _coordinate(value: float) -> str:
    normalized = format(value, ".8f").rstrip("0").rstrip(".")
    return "0" if normalized in {"-0", ""} else normalized


def build_weather_filename(
    latitude: float,
    longitude: float,
    start_date: str,
    end_date: str,
    now: datetime | None = None,
) -> str:
    timestamp = (now or datetime.now(UTC)).astimezone(UTC)
    timestamp_text = timestamp.strftime("%Y%m%dT%H%M%S%fZ")
    return (
        f"weather_{_coordinate(latitude)}_{_coordinate(longitude)}_"
        f"{start_date}_{end_date}_{timestamp_text}.json"
    )


def is_weather_filename(value: str) -> bool:
    return bool(WEATHER_FILE_PATTERN.fullmatch(value))

