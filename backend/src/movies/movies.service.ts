import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Movie } from './entities/movie.entity.js';
import { CreateMovieDto } from './dto/create-movie.dto.js';
import { UpdateMovieDto } from './dto/update-movie.dto.js';
import {
  computeRewatchOrder,
  hasCycle,
  type PrerequisiteGraph,
} from './algorithms/prerequisite-graph.js';

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie) private readonly movieRepo: Repository<Movie>,
  ) {}

  async create(dto: CreateMovieDto): Promise<Movie> {
    await this.assertTitleAvailable(dto.title);
// A brand-new movie cannot be anyone's prerequisite yet, so it cannot be part of a cycle. Cycle checks are needed on update .
    const prerequisites = await this.loadPrerequisites(dto.prerequisiteIds ?? []);

    const movie = this.movieRepo.create({
      title: dto.title,
      releaseYear: dto.releaseYear,
      runtimeMinutes: dto.runtimeMinutes,
      watched: dto.watched ?? false,
      prerequisites,
    });
    const saved = await this.movieRepo.save(movie);
    return this.findOne(saved.id);
  }

  findAll(): Promise<Movie[]> {
    return this.movieRepo.find({
      relations: { prerequisites: true },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Movie> {
    const movie = await this.movieRepo.findOne({
      where: { id },
      relations: { prerequisites: true },
    });
    if (!movie) {
      throw new NotFoundException({
        error: 'MOVIE_NOT_FOUND',
        message: `Movie with id ${id} not found`,
      });
    }
    return movie;
  }

  async update(id: number, dto: UpdateMovieDto): Promise<Movie> {
    const movie = await this.findOne(id);

    // All validation happens BEFORE anything is saved.
    if (dto.title !== undefined && dto.title !== movie.title) {
      await this.assertTitleAvailable(dto.title);
      movie.title = dto.title;
    }
    if (dto.releaseYear !== undefined) movie.releaseYear = dto.releaseYear;
    if (dto.runtimeMinutes !== undefined) movie.runtimeMinutes = dto.runtimeMinutes;
    if (dto.watched !== undefined) movie.watched = dto.watched;

    if (dto.prerequisiteIds !== undefined) {
      const prerequisites = await this.loadPrerequisites(dto.prerequisiteIds);
      await this.assertNoCycle(id, dto.prerequisiteIds);
      movie.prerequisites = prerequisites;
    }

    await this.movieRepo.save(movie);
    return this.findOne(id);
  }

  async getRewatchOrder(id: number) {
    const movies = await this.movieRepo.find({
      relations: { prerequisites: true },
    });
    const byId = new Map(movies.map((m) => [m.id, m]));
    const target = byId.get(id);
    if (!target) {
      throw new NotFoundException({
        error: 'MOVIE_NOT_FOUND',
        message: `Movie with id ${id} not found`,
      });
    }

    const orderedIds = computeRewatchOrder(this.buildGraph(movies), id);
    const order = orderedIds
      .map((movieId) => byId.get(movieId))
      .filter((m): m is Movie => m !== undefined);

    const watchedCount = order.filter((m) => m.watched).length;
    const remainingRuntimeMinutes = order
      .filter((m) => !m.watched)
      .reduce((sum, m) => sum + m.runtimeMinutes, 0);

    return {
      target: { id: target.id, title: target.title },
      order: order.map((m) => ({
        id: m.id,
        title: m.title,
        releaseYear: m.releaseYear,
        runtimeMinutes: m.runtimeMinutes,
        watched: m.watched,
      })),
      totalPrerequisites: order.length,
      watchedCount,
      remainingRuntimeMinutes,
    };
  }

  //  helpers 

  private buildGraph(movies: Movie[]): PrerequisiteGraph {
    const graph: PrerequisiteGraph = new Map();
    for (const movie of movies) {
      graph.set(
        movie.id,
        movie.prerequisites.map((p) => p.id),
      );
    }
    return graph;
  }

  private async assertTitleAvailable(title: string): Promise<void> {
    const existing = await this.movieRepo.findOne({ where: { title } });
    if (existing) {
      throw new ConflictException({
        error: 'DUPLICATE_TITLE',
        message: `A movie titled "${title}" already exists`,
      });
    }
  }

  private async loadPrerequisites(ids: number[]): Promise<Movie[]> {
    if (ids.length === 0) return [];
    const found = await this.movieRepo.findBy({ id: In(ids) });
    if (found.length !== ids.length) {
      const foundIds = new Set(found.map((m) => m.id));
      const missing = ids.filter((id) => !foundIds.has(id));
      throw new BadRequestException({
        error: 'INVALID_PREREQUISITE',
        message: `Prerequisite movie id(s) not found: ${missing.join(', ')}`,
      });
    }
    return found;
  }

  private async assertNoCycle(movieId: number, newPrerequisiteIds: number[]): Promise<void> {
    const movies = await this.movieRepo.find({
      relations: { prerequisites: true },
    });
    const graph = this.buildGraph(movies);
    graph.set(movieId, newPrerequisiteIds);

    if (hasCycle(graph, movieId)) {
      throw new ConflictException({
        error: 'CIRCULAR_DEPENDENCY',
        message: 'This change would create a circular dependency between movies',
      });
    }
  }
}