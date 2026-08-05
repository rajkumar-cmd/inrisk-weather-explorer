import type { FormEvent } from 'react'
import type { WeatherForm } from '../types'

type Props = {
  form: WeatherForm
  busy: boolean
  message: { kind: 'success' | 'error'; text: string } | null
  onChange: (field: keyof WeatherForm, value: string) => void
  onSubmit: (event: FormEvent) => void
}

const inputClass =
  'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-sky-500'

export default function InputPanel({
  form,
  busy,
  message,
  onChange,
  onSubmit,
}: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            New dataset
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">Fetch historical weather</h2>
          <p className="mt-1 text-sm text-slate-500">Choose one location and up to 31 days.</p>
        </div>
        <span className="hidden rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 sm:block">
          Open-Meteo
        </span>
      </div>

      <form onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm font-medium text-slate-700">
            Latitude
            <input
              className={inputClass}
              type="number"
              min="-90"
              max="90"
              step="any"
              value={form.latitude}
              onChange={(event) => onChange('latitude', event.target.value)}
              placeholder="12.9716"
              required
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Longitude
            <input
              className={inputClass}
              type="number"
              min="-180"
              max="180"
              step="any"
              value={form.longitude}
              onChange={(event) => onChange('longitude', event.target.value)}
              placeholder="77.5946"
              required
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Start date
            <input
              className={inputClass}
              type="date"
              value={form.startDate}
              onChange={(event) => onChange('startDate', event.target.value)}
              required
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            End date
            <input
              className={inputClass}
              type="date"
              value={form.endDate}
              onChange={(event) => onChange('endDate', event.target.value)}
              required
            />
          </label>
        </div>

        <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <button
            className="rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            type="submit"
            disabled={busy}
          >
            {busy ? 'Fetching and storing…' : 'Fetch & store data'}
          </button>
          {message && (
            <p
              role={message.kind === 'error' ? 'alert' : 'status'}
              className={`break-all text-sm ${message.kind === 'error' ? 'text-red-700' : 'text-emerald-700'}`}
            >
              {message.text}
            </p>
          )}
        </div>
      </form>
    </section>
  )
}

