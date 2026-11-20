'use client';

import { useEffect, useState } from 'react';
import {
  getErrorMessage,
  getMovies,
  getRewatchOrder,
  type Movie,
  type RewatchOrder,
} from '@/lib/api';
import { formatMinutes } from '@/lib/format';

export default function RewatchPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [plan, setPlan] = useState<RewatchOrder | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState('');

  useEffect(() => {
    getMovies()
      .then(setMovies)
      .catch((error) => setLoadError(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedId === null) return;

    let cancelled = false;
    setPlanLoading(true);
    setPlanError('');

    getRewatchOrder(selectedId)
      .then((data) => {
        if (!cancelled) setPlan(data);
      })
      .catch((error) => {
        if (!cancelled) {
          setPlan(null);
          setPlanError(getErrorMessage(error));
        }
      })
      .finally(() => {
        if (!cancelled) setPlanLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const percent =
    plan && plan.totalPrerequisites > 0
      ? Math.round((plan.watchedCount / plan.totalPrerequisites) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-4 text-lg font-semibold">Rewatch plan</h2>

      {loadError && (
        <p
          role="alert"
          className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {loadError}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading movies...</p>
      ) : movies.length === 0 && !loadError ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
          No movies yet. Add some on the Movies page first.
        </p>
      ) : (
        <div>
          <label htmlFor="target" className="mb-1 block text-sm font-medium">
            Target movie
          </label>
          <select
            id="target"
            value={selectedId ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              setPlan(null);
              setPlanError('');
              setSelectedId(value === '' ? null : Number(value));
            }}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <option value="">Select a movie...</option>
            {movies.map((movie) => (
              <option key={movie.id} value={movie.id}>
                {movie.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div aria-live="polite" className="mt-6">
        {planLoading && <p className="text-sm text-gray-500">Building plan...</p>}

        {planError && (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {planError}
          </p>
        )}

        {plan && selectedId !== null && !planLoading && (
          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="font-semibold">Before you watch: {plan.target.title}</h3>

            {plan.totalPrerequisites === 0 ? (
              <p className="mt-3 text-sm text-gray-600">
                No prerequisites. You can watch this one right away.
              </p>
            ) : (
              <>
                <p className="mt-3 text-sm font-medium">
                  {plan.watchedCount} of {plan.totalPrerequisites} watched
                </p>
                <div
                  role="progressbar"
                  aria-label="Watched prerequisites"
                  aria-valuemin={0}
                  aria-valuemax={plan.totalPrerequisites}
                  aria-valuenow={plan.watchedCount}
                  className="mt-2 h-3 overflow-hidden rounded-full bg-gray-200"
                >
                  <div
                    className="h-full bg-indigo-600 transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Remaining watch time:{' '}
                  <span className="font-medium">
                    {formatMinutes(plan.remainingRuntimeMinutes)}
                  </span>
                </p>

                <ol className="mt-4 space-y-2">
                  {plan.order.map((movie, index) => (
                    <li
                      key={movie.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-gray-200 px-3 py-2"
                    >
                      <span className="text-sm">
                        <span className="mr-2 text-gray-500">{index + 1}.</span>
                        {movie.title}
                        <span className="ml-2 text-gray-500">
                          ({formatMinutes(movie.runtimeMinutes)})
                        </span>
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          movie.watched ? 'text-green-700' : 'text-gray-500'
                        }`}
                      >
                        {movie.watched ? '✓ Watched' : 'Not watched'}
                      </span>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}