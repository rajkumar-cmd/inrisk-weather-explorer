import logging
from typing import Any

from fastapi import Depends, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from mangum import Mangum
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import cors_origins
from .errors import StorageError, WeatherProviderError
from .filenames import build_weather_filename, is_weather_filename
from .models import ErrorResult, FileList, StoreResult, WeatherRequest
from .storage import S3WeatherStorage, get_storage
from .weather import OpenMeteoClient, get_weather_client


logger = logging.getLogger(__name__)
app = FastAPI(title="InRisk Weather Explorer API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


def error_response(status_code: int, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content=ErrorResult(message=message).model_dump(),
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    first_error = exc.errors()[0]
    message = str(first_error.get("msg", "invalid request"))
    if message.startswith("Value error, "):
        message = message.removeprefix("Value error, ")
    return error_response(400, message)


@app.exception_handler(StarletteHTTPException)
async def http_error_handler(
    _request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    if exc.status_code == 404:
        return error_response(404, "not found")
    return error_response(exc.status_code, str(exc.detail))


@app.exception_handler(WeatherProviderError)
async def weather_error_handler(
    _request: Request, exc: WeatherProviderError
) -> JSONResponse:
    return error_response(502, str(exc))


@app.exception_handler(StorageError)
async def storage_error_handler(_request: Request, exc: StorageError) -> JSONResponse:
    logger.exception("Storage operation failed", exc_info=exc)
    return error_response(503, str(exc))


@app.post(
    "/store-weather-data",
    response_model=StoreResult,
    responses={400: {"model": ErrorResult}, 502: {"model": ErrorResult}},
)
async def store_weather_data(
    request: WeatherRequest,
    weather: OpenMeteoClient = Depends(get_weather_client),
    storage: S3WeatherStorage = Depends(get_storage),
) -> StoreResult:
    payload = await weather.fetch_daily(
        request.latitude,
        request.longitude,
        request.start_date,
        request.end_date,
    )
    name = build_weather_filename(
        request.latitude,
        request.longitude,
        request.start_date.isoformat(),
        request.end_date.isoformat(),
    )
    await storage.put_json(name, payload)
    return StoreResult(file=name)


@app.get("/list-weather-files", response_model=FileList)
async def list_weather_files(
    storage: S3WeatherStorage = Depends(get_storage),
) -> FileList:
    return FileList(files=await storage.list_files())


@app.get(
    "/weather-file-content/{file_name}",
    response_model=None,
    responses={404: {"model": ErrorResult}},
)
async def weather_file_content(
    file_name: str,
    storage: S3WeatherStorage = Depends(get_storage),
) -> dict[str, Any] | JSONResponse:
    if not is_weather_filename(file_name):
        return error_response(404, "not found")
    try:
        return await storage.get_json(file_name)
    except FileNotFoundError:
        return error_response(404, "not found")


handler = Mangum(app, lifespan="off")
