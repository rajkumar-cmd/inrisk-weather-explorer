import os


def cors_origins() -> list[str]:
    configured = os.getenv("CORS_ORIGINS", "http://localhost:5173")
    return [origin.strip() for origin in configured.split(",") if origin.strip()]


def bucket_name() -> str:
    name = os.getenv("WEATHER_BUCKET_NAME")
    if not name:
        raise RuntimeError("WEATHER_BUCKET_NAME is not configured")
    return name

