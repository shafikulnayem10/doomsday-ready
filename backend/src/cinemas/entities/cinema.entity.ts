import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { CinemaBundle } from './cinema-bundle.entity.js';

@Entity('cinemas')
export class Cinema {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150, unique: true })
  name: string;

  @OneToMany(() => CinemaBundle, (bundle) => bundle.cinema, { cascade: true })
  bundles: Relation<CinemaBundle>[];
}