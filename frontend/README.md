# Frontend

React and TypeScript dashboard for requesting weather storage, browsing S3-backed files, and visualizing a selected Open-Meteo response.

Set `VITE_API_BASE_URL` as shown in `.env.example`, then run:

```powershell
npm install
npm run dev
```

Quality checks:

```powershell
npm run lint
npm test
npm run build
```

For Vercel, use `frontend` as the project root and configure `VITE_API_BASE_URL` before deploying.

