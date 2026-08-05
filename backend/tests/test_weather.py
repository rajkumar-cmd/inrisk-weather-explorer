from datetime import date
from urllib.parse import parse_qs

import httpx
import pytest

from app.errors import WeatherProviderError
from app.weather import ARCHIVE_URL, DAILY_VARIABLES, OpenMeteoClient


@pytest.mark.asyncio
async def test_open_meteo_request_uses_required_daily_variables() -> None:
    captured_request = None
    raw_payload = b'{"daily":{"time":["2025-01-01"]}}'

    def handle(request: httpx.Request) -> httpx.Response:
        nonlocal captured_request
        captured_request = request
        return httpx.Response(200, content=raw_payload)

    async with httpx.AsyncClient(transport=httpx.MockTransport(handle)) as http_client:
        result = await OpenMeteoClient(http_client).fetch_daily(
            12.97,
            77.59,
            date(2025, 1, 1),
            date(2025, 1, 2),
        )

    assert result == raw_payload
    assert str(captured_request.url).startswith(ARCHIVE_URL)
    query = parse_qs(captured_request.url.query.decode())
    assert query["daily"] == [",".join(DAILY_VARIABLES)]
    assert query["timezone"] == ["auto"]


@pytest.mark.asyncio
async def test_open_meteo_failure_is_sanitized() -> None:
    def fail(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectTimeout("timed out", request=request)

    async with httpx.AsyncClient(transport=httpx.MockTransport(fail)) as http_client:
        with pytest.raises(WeatherProviderError, match="weather provider request failed"):
            await OpenMeteoClient(http_client).fetch_daily(
                0,
                0,
                date(2025, 1, 1),
                date(2025, 1, 1),
            )

