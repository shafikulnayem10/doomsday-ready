const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

//  Types (shape of the backend responses) 

export interface Prerequisite {
  id: number;
  title: string;
  releaseYear: number;
  runtimeMinutes: number;
  watched: boolean;
}

export interface Movie extends Prerequisite {
  prerequisites: Prerequisite[];
}

export interface MovieInput {
  title: string;
  releaseYear: number;
  runtimeMinutes: number;
  prerequisiteIds: number[];
}

export interface RewatchOrder {
  target: { id: number; title: string };
  order: Prerequisite[];
  totalPrerequisites: number;
  watchedCount: number;
  remainingRuntimeMinutes: number;
}

export interface Cinema {
  id: number;
  name: string;
  bundleSizes: number[];
}

export interface BookingResult {
  cinema: { id: number; name: string };
  groupSize: number;
  bundleSizes: number[];
  possible: boolean;
  totalBundles: number;
  bundles: { size: number; quantity: number }[];
  message?: string;
}

//  Error handling 

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    
    return error.status === 400 || error.status === 0
      ? error.message
      : `${error.message} (${error.code})`;
  }
  return 'Something unexpected went wrong.';
}

//  Core request helper 

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Cannot reach the server. Please check that the backend is running.',
    );
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const body = (data ?? {}) as { error?: string; message?: string | string[] };
    const message = Array.isArray(body.message)
      ? body.message.join(', ')
      : (body.message ?? 'Request failed');
    throw new ApiError(response.status, body.error ?? 'ERROR', message);
  }

  return data as T;
}

// API functions 

export const getMovies = () => request<Movie[]>('/movies');

export const createMovie = (input: MovieInput) =>
  request<Movie>('/movies', { method: 'POST', body: JSON.stringify(input) });

export const updateMovie = (id: number, input: Partial<MovieInput> & { watched?: boolean }) =>
  request<Movie>(`/movies/${id}`, { method: 'PATCH', body: JSON.stringify(input) });

export const getRewatchOrder = (id: number) =>
  request<RewatchOrder>(`/movies/${id}/rewatch-order`);

export const getCinemas = () => request<Cinema[]>('/cinemas');

export const getBooking = (cinemaId: number, groupSize: number) =>
  request<BookingResult>(`/cinemas/${cinemaId}/booking?groupSize=${groupSize}`);