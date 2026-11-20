import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cinema } from './entities/cinema.entity.js';
import { CreateCinemaDto } from './dto/create-cinema.dto.js';
import { calculateMinBundles } from './algorithms/min-bundles.js';

@Injectable()
export class CinemasService {
  constructor(
    @InjectRepository(Cinema) private readonly cinemaRepo: Repository<Cinema>,
  ) {}

  async create(dto: CreateCinemaDto) {
    const existing = await this.cinemaRepo.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException({
        error: 'DUPLICATE_CINEMA_NAME',
        message: `A cinema named "${dto.name}" already exists`,
      });
    }

    const cinema = this.cinemaRepo.create({
      name: dto.name,
      bundles: dto.bundleSizes.map((size) => ({ size })),
    });
    const saved = await this.cinemaRepo.save(cinema);
    return this.toResponse(await this.findEntity(saved.id));
  }

  async findAll() {
    const cinemas = await this.cinemaRepo.find({
      relations: { bundles: true },
      order: { id: 'ASC' },
    });
    return cinemas.map((c) => this.toResponse(c));
  }

  async calculateBooking(id: number, groupSize: number) {
    const cinema = await this.findEntity(id);
    const bundleSizes = this.sortedSizes(cinema);
    const result = calculateMinBundles(bundleSizes, groupSize);

    return {
      cinema: { id: cinema.id, name: cinema.name },
      groupSize,
      bundleSizes,
      ...result,
      message: result.possible ? undefined : 'Not Possible',
    };
  }

  // helpers 

  private async findEntity(id: number): Promise<Cinema> {
    const cinema = await this.cinemaRepo.findOne({
      where: { id },
      relations: { bundles: true },
    });
    if (!cinema) {
      throw new NotFoundException({
        error: 'CINEMA_NOT_FOUND',
        message: `Cinema with id ${id} not found`,
      });
    }
    return cinema;
  }

  private sortedSizes(cinema: Cinema): number[] {
    return cinema.bundles.map((b) => b.size).sort((a, b) => a - b);
  }

  private toResponse(cinema: Cinema) {
    return {
      id: cinema.id,
      name: cinema.name,
      bundleSizes: this.sortedSizes(cinema),
    };
  }
}