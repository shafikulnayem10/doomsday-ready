import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cinema } from './entities/cinema.entity.js';
import { CinemaBundle } from './entities/cinema-bundle.entity.js';
import { CinemasController } from './cinemas.controller.js';
import { CinemasService } from './cinemas.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Cinema, CinemaBundle])],
  controllers: [CinemasController],
  providers: [CinemasService],
})
export class CinemasModule {}