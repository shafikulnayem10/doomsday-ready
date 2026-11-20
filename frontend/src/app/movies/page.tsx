'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  createMovie,
  getErrorMessage,
  getMovies,
  updateMovie,
  type Movie,
} from '@/lib/api';
import { formatMinutes } from '@/lib/format';

const inputClass =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200';
const primaryButton =
  'rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50';
const secondaryButton =
  'rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50';

const emptyForm = {
  title: '',
  releaseYear: '',
  runtimeMinutes: '',
  prerequisiteIds: [] as number[],
};

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadMovies = useCallback(async () => {
    try {
      setMovies(await getMovies());
      setListError('');
    } catch (error) {
      setListError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMovies();
  }, [loadMovies]);

  function startEdit(movie: Movie) {
    setEditingId(movie.id);
    setFormError('');
    setForm({
      title: movie.title,
      releaseYear: String(movie.releaseYear),
      runtimeMinutes: String(movie.runtimeMinutes),
      prerequisiteIds: movie.prerequisites.map((p) => p.id),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setFormError('');
    setForm(emptyForm);
  }

  function togglePrerequisite(id: number) {
    setForm((current) => ({
      ...current,
      prerequisiteIds: current.prerequisiteIds.includes(id)
        ? current.prerequisiteIds.filter((x) => x !== id)
        : [...current.prerequisiteIds, id],
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError('');

    const payload = {
      title: form.title.trim(),
      releaseYear: Number(form.releaseYear),
      runtimeMinutes: Number(form.runtimeMinutes),
      prerequisiteIds: form.prerequisiteIds,
    };

    try {
      if (editingId === null) {
        await createMovie(payload);
      } else {
        await updateMovie(editingId, payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadMovies();
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function toggleWatched(movie: Movie) {
    setBusyId(movie.id);
    try {
      await updateMovie(movie.id, { watched: !movie.watched });
      await loadMovies();
    } catch (error) {
      setListError(getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  }

  const candidates = movies.filter((m) => m.id !== editingId);

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <section
        aria-labelledby="form-title"
        className="h-fit rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <h2 id="form-title" className="mb-4 text-lg font-semibold">
          {editingId === null ? 'Add a movie' : 'Edit movie'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium">
              Title
            </label>
            <input
              id="title"
              required
              maxLength={200}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="year" className="mb-1 block text-sm font-medium">
                Release year
              </label>
              <input
                id="year"
                type="number"
                required
                min={1888}
                max={2100}
                value={form.releaseYear}
                onChange={(e) => setForm({ ...form, releaseYear: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="runtime" className="mb-1 block text-sm font-medium">
                Runtime (min)
              </label>
              <input
                id="runtime"
                type="number"
                required
                min={1}
                max={300}
                value={form.runtimeMinutes}
                onChange={(e) => setForm({ ...form, runtimeMinutes: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <fieldset>
            <legend className="mb-1 text-sm font-medium">
              Prerequisites (watch these first)
            </legend>
            {candidates.length === 0 ? (
              <p className="text-sm text-gray-500">No other movies yet.</p>
            ) : (
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-gray-200 p-2">
                {candidates.map((movie) => (
                  <label key={movie.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.prerequisiteIds.includes(movie.id)}
                      onChange={() => togglePrerequisite(movie.id)}
                    />
                    {movie.title}
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          {formError && (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {formError}
            </p>
          )}

          <div className="flex gap-2">
            <button type="submit" disabled={saving} className={primaryButton}>
              {saving ? 'Saving...' : editingId === null ? 'Add movie' : 'Save changes'}
            </button>
            {editingId !== null && (
              <button type="button" onClick={cancelEdit} className={secondaryButton}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section aria-labelledby="list-title">
        <h2 id="list-title" className="mb-4 text-lg font-semibold">
          All movies
        </h2>

        {listError && (
          <p
            role="alert"
            className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {listError}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Loading movies...</p>
        ) : movies.length === 0 && !listError ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            No movies yet. Add your first movie using the form.
          </p>
        ) : (
          <ul className="space-y-3">
            {movies.map((movie) => (
              <li
                key={movie.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{movie.title}</h3>
                    <p className="text-sm text-gray-600">
                      {movie.releaseYear} · {formatMinutes(movie.runtimeMinutes)}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {movie.prerequisites.length === 0
                        ? 'No prerequisites'
                        : `Watch first: ${movie.prerequisites.map((p) => p.title).join(', ')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={movie.watched}
                        disabled={busyId === movie.id}
                        onChange={() => void toggleWatched(movie)}
                        aria-label={`Mark ${movie.title} as watched`}
                      />
                      Watched
                    </label>
                    <button
                      type="button"
                      onClick={() => startEdit(movie)}
                      className={secondaryButton}
                      aria-label={`Edit ${movie.title}`}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}