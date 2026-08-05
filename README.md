# InRisk Weather Explorer

[Live dashboard](https://inrisk-weather-explorer.vercel.app)


A small full-stack application that retrieves historical daily weather data from Open-Meteo, stores the original response in Amazon S3, and visualizes saved datasets in a responsive dashboard.

The repository is organized as a monorepo:

```text
backend/   FastAPI application and backend tests
frontend/  React dashboard and frontend tests
```

The backend and frontend remain separate deployable applications. This keeps cloud-specific code out of the browser and lets the dashboard work only with datasets already stored by the backend.

## Status

Implementation in progress. Setup, architecture, API, testing, and deployment documentation will be completed with the application.

