'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  getBooking,
  getCinemas,
  getErrorMessage,
  type BookingResult,
  type Cinema,
} from '@/lib/api';

const inputClass =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200';

export default function BookingPage() {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [cinemaId, setCinemaId] = useState('');
  const [groupSize, setGroupSize] = useState('');
  const [result, setResult] = useState<BookingResult | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCinemas()
      .then(setCinemas)
      .catch((err) => setLoadError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setResult(null);

    const size = Number(groupSize);
    if (cinemaId === '') {
      setError('Please select a cinema.');
      return;
    }
    if (!Number.isInteger(size) || size < 1 || size > 10000) {
      setError('Group size must be a whole number between 1 and 10,000.');
      return;
    }

    setSubmitting(true);
    try {
      setResult(await getBooking(Number(cinemaId), size));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="mb-4 text-lg font-semibold">Watch-party booking</h2>

      {loadError && (
        <p
          role="alert"
          className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {loadError}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading cinemas...</p>
      ) : cinemas.length === 0 && !loadError ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
          No cinemas available yet.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div>
            <label htmlFor="cinema" className="mb-1 block text-sm font-medium">
              Cinema
            </label>
            <select
              id="cinema"
              value={cinemaId}
              onChange={(e) => {
                setCinemaId(e.target.value);
                setResult(null);
              }}
              className={inputClass}
            >
              <option value="">Select a cinema...</option>
              {cinemas.map((cinema) => (
                <option key={cinema.id} value={cinema.id}>
                  {cinema.name} (bundles: {cinema.bundleSizes.join(', ')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="groupSize" className="mb-1 block text-sm font-medium">
              Group size
            </label>
            <input
              id="groupSize"
              type="number"
              min={1}
              max={10000}
              required
              value={groupSize}
              onChange={(e) => {
                setGroupSize(e.target.value);
                setResult(null);
              }}
              className={inputClass}
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Calculating...' : 'Get quote'}
          </button>
        </form>
      )}

      <div aria-live="polite" className="mt-6">
        {result &&
          (result.possible ? (
            <section className="rounded-lg border border-green-200 bg-green-50 p-4">
              <h3 className="font-semibold text-green-900">
                {result.totalBundles} {result.totalBundles === 1 ? 'bundle' : 'bundles'} for{' '}
                {result.groupSize} {result.groupSize === 1 ? 'person' : 'people'}
              </h3>
              <ul className="mt-3 space-y-1 text-sm text-green-900">
                {result.bundles.map((bundle) => (
                  <li key={bundle.size}>
                    {bundle.size}-seat bundle × {bundle.quantity} ={' '}
                    {bundle.size * bundle.quantity} seats
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <h3 className="font-semibold text-amber-900">Not possible</h3>
              <p className="mt-1 text-sm text-amber-900">
                No exact combination of {result.bundleSizes.join(', ')}-seat bundles adds up
                to {result.groupSize} seats.
              </p>
            </section>
          ))}
      </div>
    </div>
  );
}