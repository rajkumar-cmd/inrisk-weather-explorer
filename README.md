# InRisk Weather Explorer

[Open the live dashboard](https://inrisk-weather-explorer.vercel.app)

This project fetches historical weather data for a location and saves the response in a private S3 bucket. Saved files can be opened later and shown as a chart and table.

## Main features

- Request up to 31 days of historical weather data.
- Store the complete Open-Meteo response in S3.
- List and open saved weather files.
- Show maximum and minimum temperatures in a chart.
- Show actual and apparent temperatures in a table.
- Change the table page size between 10, 20, and 50 rows.
- Use the dashboard on desktop and mobile screens.

## Tools used

- React, TypeScript, Vite, and Tailwind CSS for the frontend.
- FastAPI and Pydantic for the API and request validation.
- Recharts for the temperature chart.
- AWS Lambda and API Gateway for the backend.
- A private AWS S3 bucket for saved weather files.
- AWS SAM for infrastructure.
- GitHub Actions for tests and manual backend deployment.
- Vercel for frontend hosting.

## Project structure

```text
backend/
  app/
    main.py          API routes and error handling
    models.py        Request and response models
    weather.py       Open-Meteo requests
    storage.py       S3 operations
    filenames.py     S3 filename creation and validation
  tests/             Backend tests

frontend/
  src/
    components/      Form, file list, chart, and table
    App.tsx           Page state and user actions
    api.ts            Backend requests
    weather.ts        Converts stored data into table rows
  src/App.test.tsx    Frontend tests

.github/workflows/    Test and deployment workflows
template.yaml         AWS SAM template
```

## How a request works

1. The user enters coordinates and a date range.
2. The React app sends the request to FastAPI.
3. FastAPI validates the input.
4. The backend requests historical data from Open-Meteo.
5. The full response is saved in the private S3 bucket.
6. The dashboard lists the saved file.
7. When the user opens the file, the dashboard uses the stored data for the chart and table.

The browser does not call Open-Meteo directly. It only communicates with the FastAPI backend.

S3 operations use `asyncio.to_thread()` because boto3 is synchronous. This keeps blocking S3 work away from the FastAPI event loop.

## API endpoints

### Store weather data

```http
POST /store-weather-data
```

Example body:

```json
{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "start_date": "2025-01-01",
  "end_date": "2025-01-10"
}
```

Example response:

```json
{
  "status": "ok",
  "file": "weather_12.9716_77.5946_2025-01-01_2025-01-10_20250111T083000123456Z.json"
}
```

### List saved files

```http
GET /list-weather-files
```

Each item contains the filename, file size, and creation time.

### Open a saved file

```http
GET /weather-file-content/{file}
```

Invalid or missing filenames return HTTP 404:

```json
{
  "status": "error",
  "message": "not found"
}
```

## Run locally

### Backend

Python 3.12 is recommended.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --env-file .env
```

Backend environment variables:

```text
WEATHER_BUCKET_NAME=your-private-bucket-name
CORS_ORIGINS=http://localhost:5173
```

The API runs at `http://localhost:8000`.

### Frontend

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Frontend environment variable:

```text
VITE_API_BASE_URL=http://localhost:8000
```

The frontend runs at `http://localhost:5173`.

## Run the tests

Backend:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest
```

Frontend:

```powershell
cd frontend
npm run lint
npm run test
npm run build
```

The tests use mocks, so they do not call Open-Meteo or AWS.

## Deployment

### Backend

The `template.yaml` file defines the Lambda function, API Gateway, private S3 bucket, permissions, and logs.

The backend workflow is manual:

1. Open **Actions → Deploy backend** in GitHub.
2. Select **Run workflow**.
3. Enter the allowed frontend origins.
4. Confirm the AWS account check.
5. Run the workflow.

The workflow reads AWS credentials from secrets in the GitHub `production` environment. Credentials are not stored in the repository.

### Frontend

The frontend is deployed from the `frontend` directory on Vercel.

```text
Framework: Vite
Build command: npm run build
Output directory: dist
```

Set `VITE_API_BASE_URL` to the deployed API Gateway URL before deploying.
