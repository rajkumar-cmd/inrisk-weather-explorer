from collections.abc import AsyncIterator

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.storage import get_storage
from app.weather import get_weather_client


@pytest.fixture
def client() -> AsyncIterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def override_dependencies():
    def apply(weather, storage) -> None:
        app.dependency_overrides[get_weather_client] = lambda: weather
        app.dependency_overrides[get_storage] = lambda: storage

    yield apply
    app.dependency_overrides.clear()

