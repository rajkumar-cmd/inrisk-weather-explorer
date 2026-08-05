# Backend

FastAPI service that validates historical-weather requests, fetches Open-Meteo asynchronously, and stores raw response bytes in private S3.

The application is split by responsibility:

- `main.py`: routes, dependency wiring, CORS, and HTTP error mapping.
- `models.py`: Pydantic request and response shapes.
- `weather.py`: Open-Meteo request construction and timeout/error handling.
- `storage.py`: S3 upload, paginated listing, and retrieval using `asyncio.to_thread`.
- `filenames.py`: normalized filenames and retrieval validation.

Install `requirements-dev.txt`, set the variables shown in `.env.example`, and run:

```powershell
uvicorn app.main:app --reload --env-file .env
```

Tests use dependency overrides and require no AWS credentials:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

