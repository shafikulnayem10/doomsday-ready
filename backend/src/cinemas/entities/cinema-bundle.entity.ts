import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  type Relation,
} from 'typeorm';
import { Cinema } from './cinema.entity.js';

@Entity('cinema_bundles')
@Unique('UQ_cinema_bundle_size', ['cinemaId', 'size'])
@Check('"size" >= 1 AND "size" <= 500')
export class CinemaBundle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  size: number;

  @Column({ name: 'cinema_id', type: 'int' })
  cinemaId: number;

  @ManyToOne(() => Cinema, (cinema) => cinema.bundles, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'cinema_id' })
  cinema: Relation<Cinema>;
}