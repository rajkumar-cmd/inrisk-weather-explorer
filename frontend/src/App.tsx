import { useState, type FormEvent } from 'react'
import { getWeatherFile, listWeatherFiles, storeWeather } from './api'
import InputPanel from './components/InputPanel'
import StoredFiles from './components/StoredFiles'
import WeatherView from './components/WeatherView'
import type { StoredFile, WeatherData, WeatherForm, WeatherRow } from './types'
import { toWeatherRows } from './weather'

const initialForm: WeatherForm = {
  latitude: '',
  longitude: '',
  startDate: '',
  endDate: '',
}

function validateDates(form: WeatherForm): string | null {
  const start = new Date(`${form.startDate}T00:00:00Z`)
  const end = new Date(`${form.endDate}T00:00:00Z`)
  if (start > end) return 'Start date must be on or before end date.'
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
  return days > 31 ? 'Date range cannot exceed 31 days.' : null
}

export default function App() {
  const [form, setForm] = useState(initialForm)
  const [storeBusy, setStoreBusy] = useState(false)
  const [storeMessage, setStoreMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [files, setFiles] = useState<StoredFile[]>([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [filesLoaded, setFilesLoaded] = useState(false)
  const [filesError, setFilesError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<StoredFile | null>(null)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [rows, setRows] = useState<WeatherRow[]>([])
  const [contentLoading, setContentLoading] = useState(false)
  const [contentError, setContentError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const changeForm = (field: keyof WeatherForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const loadFiles = async () => {
    setFilesLoading(true)
    setFilesError(null)
    try {
      setFiles(await listWeatherFiles())
      setFilesLoaded(true)
    } catch (error) {
      setFilesError(error instanceof Error ? error.message : 'Could not load stored files.')
    } finally {
      setFilesLoading(false)
    }
  }

  const submitWeather = async (event: FormEvent) => {
    event.preventDefault()
    const dateError = validateDates(form)
    if (dateError) {
      setStoreMessage({ kind: 'error', text: dateError })
      return
    }
    setStoreBusy(true)
    setStoreMessage(null)
    try {
      const name = await storeWeather(form)
      setStoreMessage({ kind: 'success', text: `Stored ${name}` })
      await loadFiles()
    } catch (error) {
      setStoreMessage({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Could not store weather data.',
      })
    } finally {
      setStoreBusy(false)
    }
  }

  const selectFile = async (file: StoredFile) => {
    setSelectedFile(file)
    setWeatherData(null)
    setRows([])
    setPage(1)
    setContentError(null)
    setContentLoading(true)
    try {
      const data = await getWeatherFile(file.name)
      const parsedRows = toWeatherRows(data)
      setWeatherData(data)
      setRows(parsedRows)
    } catch (error) {
      setContentError(error instanceof Error ? error.message : 'Could not read this file.')
    } finally {
      setContentLoading(false)
    }
  }

  const changePageSize = (size: number) => {
    setPageSize(size)
    setPage(1)
  }

  return (
    <div className="min-h-screen">
      <header className="overflow-hidden bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-lg font-bold shadow-lg shadow-sky-500/20">W</div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">InRisk Labs case study</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Weather Archive Explorer</h1>
            </div>
          </div>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Fetch a short historical weather range, preserve the source response in cloud storage, and inspect saved temperature records.</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <InputPanel form={form} busy={storeBusy} message={storeMessage} onChange={changeForm} onSubmit={submitWeather} />
        <div className="grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <StoredFiles files={files} selectedName={selectedFile?.name ?? null} loading={filesLoading} loaded={filesLoaded} error={filesError} onRefresh={loadFiles} onSelect={selectFile} />
          <WeatherView file={selectedFile} data={weatherData} rows={rows} loading={contentLoading} error={contentError} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={changePageSize} />
        </div>
      </main>
      <footer className="mx-auto max-w-7xl px-4 pb-8 text-center text-xs text-slate-500 sm:px-6">Historical data provided by Open-Meteo. Files are read from private cloud storage through the API.</footer>
    </div>
  )
}

