export type WeatherForm = {
  latitude: string
  longitude: string
  startDate: string
  endDate: string
}

export type StoredFile = {
  name: string
  size: number
  created_at: string
}

export type DailyWeather = {
  time?: string[]
  temperature_2m_max?: Array<number | null>
  temperature_2m_min?: Array<number | null>
  apparent_temperature_max?: Array<number | null>
  apparent_temperature_min?: Array<number | null>
}

export type WeatherData = {
  latitude?: number
  longitude?: number
  elevation?: number
  timezone?: string
  timezone_abbreviation?: string
  daily_units?: Record<string, string>
  daily?: DailyWeather
}

export type WeatherRow = {
  date: string
  max: number | null
  min: number | null
  apparentMax: number | null
  apparentMin: number | null
}

