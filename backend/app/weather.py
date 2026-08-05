import json
from datetime import date

import httpx

from .errors import WeatherProviderError


ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
DAILY_VARIABLES = (
    "temperature_2m_max",
    "temperature_2m_min",
    "apparent_temperature_max",
    "apparent_temperature_min",
)


class OpenMeteoClient:
    def __init__(
        self,
        client: httpx.AsyncClient | None = None,
        timeout_seconds: float = 12.0,
    ) -> None:
        self._client = client
        self._timeout = timeout_seconds

    async def fetch_daily(
        self,
        latitude: float,
        longitude: float,
        start_date: date,
        end_date: date,
    ) -> bytes:
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "daily": ",".join(DAILY_VARIABLES),
            "timezone": "auto",
        }

        try:
            if self._client is not None:
                response = await self._client.get(ARCHIVE_URL, params=params)
            else:
                async with httpx.AsyncClient(timeout=self._timeout) as client:
                    response = await client.get(ARCHIVE_URL, params=params)
            response.raise_for_status()
            payload = response.content
            parsed = json.loads(payload)
            if not isinstance(parsed, dict) or "daily" not in parsed:
                raise WeatherProviderError("weather provider returned incomplete data")
            return payload
        except WeatherProviderError:
            raise
        except (httpx.HTTPError, json.JSONDecodeError) as exc:
            raise WeatherProviderError("weather provider request failed") from exc


def get_weather_client() -> OpenMeteoClient:
    return OpenMeteoClient()

