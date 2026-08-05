import type { StoredFile, WeatherData, WeatherForm } from './types'

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const API_BASE_URL = configuredBaseUrl.replace(/\/$/, '')

type ApiError = {
  message?: string
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, options)
  const body = (await response.json().catch(() => ({}))) as T & ApiError
  if (!response.ok) {
    throw new Error(body.message || `Request failed with status ${response.status}`)
  }
  return body
}

export async function storeWeather(form: WeatherForm): Promise<string> {
  const result = await request<{ file: string }>('/store-weather-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      start_date: form.startDate,
      end_date: form.endDate,
    }),
  })
  return result.file
}

export async function listWeatherFiles(): Promise<StoredFile[]> {
  const result = await request<{ files: StoredFile[] }>('/list-weather-files')
  return result.files
}

export function getWeatherFile(name: string): Promise<WeatherData> {
  return request<WeatherData>(`/weather-file-content/${encodeURIComponent(name)}`)
}

