import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { StoredFile, WeatherData, WeatherRow } from '../types'

type Props = {
  file: StoredFile | null
  data: WeatherData | null
  rows: WeatherRow[]
  loading: boolean
  error: string | null
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

function value(value: number | null, unit: string) {
  return value === null ? '—' : `${value.toFixed(1)} ${unit}`
}

export default function WeatherView({
  file,
  data,
  rows,
  loading,
  error,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: Props) {
  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">Loading stored weather data…</div>
  }

  if (error) {
    return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
  }

  if (!file || !data) {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
        <div>
          <p className="font-medium text-slate-700">Select a stored weather file</p>
          <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">Its temperature series and metadata will appear here without another call to Open-Meteo.</p>
        </div>
      </div>
    )
  }

  const unit = data.daily_units?.temperature_2m_max ?? '°C'
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const visibleRows = rows.slice((page - 1) * pageSize, page * pageSize)
  const firstDate = rows.at(0)?.date ?? '—'
  const lastDate = rows.at(-1)?.date ?? '—'

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Selected dataset</p>
        <h2 className="mt-2 break-all text-lg font-semibold text-slate-950">{file.name}</h2>
        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3 lg:grid-cols-5">
          <div><dt className="text-xs text-slate-500">Coordinates</dt><dd className="mt-1 text-sm font-medium text-slate-800">{data.latitude ?? '—'}, {data.longitude ?? '—'}</dd></div>
          <div><dt className="text-xs text-slate-500">Elevation</dt><dd className="mt-1 text-sm font-medium text-slate-800">{data.elevation === undefined ? '—' : `${data.elevation} m`}</dd></div>
          <div><dt className="text-xs text-slate-500">Timezone</dt><dd className="mt-1 text-sm font-medium text-slate-800">{data.timezone ?? '—'}</dd></div>
          <div><dt className="text-xs text-slate-500">Date range</dt><dd className="mt-1 text-sm font-medium text-slate-800">{firstDate} – {lastDate}</dd></div>
          <div><dt className="text-xs text-slate-500">Daily records</dt><dd className="mt-1 text-sm font-medium text-slate-800">{rows.length}</dd></div>
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="font-semibold text-slate-950">Daily temperature range</h2>
          <p className="mt-1 text-sm text-slate-500">Maximum and minimum air temperature at 2 metres.</p>
        </div>
        <div className="h-72 w-full" aria-label="Daily maximum and minimum temperature chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={24} />
              <YAxis tick={{ fontSize: 11 }} unit={` ${unit}`} />
              <Tooltip formatter={(item) => [`${item} ${unit}`]} />
              <Legend />
              <Line type="monotone" dataKey="max" name="Daily max" stroke="#ea580c" strokeWidth={2.5} dot={false} connectNulls />
              <Line type="monotone" dataKey="min" name="Daily min" stroke="#0284c7" strokeWidth={2.5} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-950">Daily readings</h2>
            <p className="mt-1 text-sm text-slate-500">Actual and apparent temperature values.</p>
          </div>
          <label className="text-sm text-slate-600">
            Rows per page{' '}
            <select
              aria-label="Rows per page"
              className="ml-2 rounded-lg border border-slate-300 bg-white px-2 py-1.5"
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-5 py-3">Date</th><th className="px-5 py-3">Max</th><th className="px-5 py-3">Min</th><th className="px-5 py-3">Apparent max</th><th className="px-5 py-3">Apparent min</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleRows.map((row) => (
                <tr key={row.date} className="text-slate-700 hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-900">{row.date}</td>
                  <td className="px-5 py-3">{value(row.max, unit)}</td>
                  <td className="px-5 py-3">{value(row.min, unit)}</td>
                  <td className="px-5 py-3">{value(row.apparentMax, unit)}</td>
                  <td className="px-5 py-3">{value(row.apparentMin, unit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm">
          <span className="text-slate-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button type="button" className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium disabled:cursor-not-allowed disabled:opacity-40" disabled={page === 1} onClick={() => onPageChange(page - 1)}>Previous</button>
            <button type="button" className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium disabled:cursor-not-allowed disabled:opacity-40" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>Next</button>
          </div>
        </div>
      </section>
    </div>
  )
}

