import type { StoredFile } from '../types'
import { formatBytes, formatDateTime } from '../weather'

type Props = {
  files: StoredFile[]
  selectedName: string | null
  loading: boolean
  loaded: boolean
  error: string | null
  onRefresh: () => void
  onSelect: (file: StoredFile) => void
}

export default function StoredFiles({
  files,
  selectedName,
  loading,
  loaded,
  error,
  onRefresh,
  onSelect,
}: Props) {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <div>
          <h2 className="font-semibold text-slate-950">Stored files</h2>
          <p className="mt-0.5 text-xs text-slate-500">JSON objects in S3</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-sky-500 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Browse files'}
        </button>
      </div>

      {error && <p role="alert" className="m-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {!error && loaded && files.length === 0 && (
        <div className="p-8 text-center">
          <p className="font-medium text-slate-700">No weather files yet</p>
          <p className="mt-1 text-sm text-slate-500">Store a dataset, then browse again.</p>
        </div>
      )}

      {!loaded && !loading && (
        <p className="p-6 text-sm leading-6 text-slate-500">
          Browse the bucket to choose a stored dataset. The chart always works from saved data.
        </p>
      )}

      {files.length > 0 && (
        <ul className="max-h-[32rem] divide-y divide-slate-100 overflow-y-auto">
          {files.map((file) => {
            const selected = selectedName === file.name
            return (
              <li key={file.name}>
                <button
                  type="button"
                  onClick={() => onSelect(file)}
                  className={`w-full px-5 py-4 text-left transition ${
                    selected ? 'bg-sky-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className={`block break-all text-sm font-medium ${selected ? 'text-sky-800' : 'text-slate-800'}`}>
                    {file.name}
                  </span>
                  <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span>{formatBytes(file.size)}</span>
                    <span>{formatDateTime(file.created_at)}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </aside>
  )
}

