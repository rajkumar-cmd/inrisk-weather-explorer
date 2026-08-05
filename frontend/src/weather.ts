import type { WeatherData, WeatherRow } from './types'

export function toWeatherRows(data: WeatherData): WeatherRow[] {
  const daily = data.daily
  if (!daily?.time || !Array.isArray(daily.time)) {
    throw new Error('This file does not contain daily weather data.')
  }

  const valueAt = (values: Array<number | null> | undefined, index: number) =>
    Array.isArray(values) && index < values.length ? values[index] : null

  return daily.time.map((date, index) => ({
    date,
    max: valueAt(daily.temperature_2m_max, index),
    min: valueAt(daily.temperature_2m_min, index),
    apparentMax: valueAt(daily.apparent_temperature_max, index),
    apparentMin: valueAt(daily.apparent_temperature_min, index),
  }))
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

export function formatDateTime(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

