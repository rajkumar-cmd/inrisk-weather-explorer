import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const fileName =
  'weather_12.97_77.59_2025-01-01_2025-01-12_20250113T030405000000Z.json'

function response(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

function fileList() {
  return {
    files: [{ name: fileName, size: 2048, created_at: '2025-01-13T03:04:05Z' }],
  }
}

function weatherData(days = 12) {
  const dates = Array.from({ length: days }, (_, index) =>
    `2025-01-${String(index + 1).padStart(2, '0')}`,
  )
  return {
    latitude: 12.97,
    longitude: 77.59,
    elevation: 920,
    timezone: 'Asia/Kolkata',
    daily_units: { temperature_2m_max: '°C' },
    daily: {
      time: dates,
      temperature_2m_max: dates.map((_, index) => 25 + index),
      temperature_2m_min: dates.map((_, index) => 15 + index),
      apparent_temperature_max: dates.map((_, index) => 24 + index),
      apparent_temperature_min: dates.map((_, index) => 14 + index),
    },
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('weather explorer', () => {
  it('submits a range, shows the stored name, and refreshes files', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => response({ status: 'ok', file: fileName }))
      .mockImplementationOnce(() => response(fileList()))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Latitude'), '12.97')
    await user.type(screen.getByLabelText('Longitude'), '77.59')
    await user.type(screen.getByLabelText('Start date'), '2025-01-01')
    await user.type(screen.getByLabelText('End date'), '2025-01-12')
    await user.click(screen.getByRole('button', { name: 'Fetch & store data' }))

    expect(await screen.findByText(`Stored ${fileName}`)).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const request = fetchMock.mock.calls[0][1]
    expect(JSON.parse(request.body)).toEqual({
      latitude: 12.97,
      longitude: 77.59,
      start_date: '2025-01-01',
      end_date: '2025-01-12',
    })
  })

  it('shows a useful empty state when the bucket has no files', async () => {
    vi.stubGlobal('fetch', vi.fn(() => response({ files: [] })))
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Browse files' }))

    expect(await screen.findByText('No weather files yet')).toBeInTheDocument()
  })

  it('loads a stored file and paginates its daily rows', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => response(fileList()))
      .mockImplementationOnce(() => response(weatherData()))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Browse files' }))
    await user.click(await screen.findByRole('button', { name: new RegExp(fileName) }))

    expect(await screen.findByText('Daily temperature range')).toBeInTheDocument()
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
    expect(screen.getAllByText('2025-01-01').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument()
    expect(screen.getAllByText('2025-01-11').length).toBeGreaterThan(0)

    await user.selectOptions(screen.getByLabelText('Rows per page'), '20')
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument()
  })

  it('reports malformed stored JSON instead of rendering an empty chart', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => response(fileList()))
      .mockImplementationOnce(() => response({ latitude: 12.97 }))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Browse files' }))
    await user.click(await screen.findByRole('button', { name: new RegExp(fileName) }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'This file does not contain daily weather data.',
      ),
    )
  })
})

