import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CinemasService } from './cinemas.service.js';
import { CreateCinemaDto } from './dto/create-cinema.dto.js';
import { BookingQueryDto } from './dto/booking-query.dto.js';

@Controller('cinemas')
export class CinemasController {
  constructor(private readonly cinemasService: CinemasService) {}

  @Post()
  create(@Body() dto: CreateCinemaDto) {
    return this.cinemasService.create(dto);
  }

  @Get()
  findAll() {
    return this.cinemasService.findAll();
  }

  @Get(':id/booking')
  booking(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: BookingQueryDto,
  ) {
    return this.cinemasService.calculateBooking(id, query.groupSize);
  }
}