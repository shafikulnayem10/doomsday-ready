import {
  Check,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('movies')
@Check('"runtime_minutes" >= 1 AND "runtime_minutes" <= 300')
export class Movie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200, unique: true })
  title: string;

  @Column({ name: 'release_year', type: 'int' })
  releaseYear: number;

  @Column({ name: 'runtime_minutes', type: 'int' })
  runtimeMinutes: number;

  @Column({ type: 'boolean', default: false })
  watched: boolean;

  // Self-referencing many-to-many: a movie can have many prerequisites,
  // and a movie can be a prerequisite of many movies.
  @ManyToMany(() => Movie)
  @JoinTable({
    name: 'movie_prerequisites',
    joinColumn: { name: 'movie_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'prerequisite_id', referencedColumnName: 'id' },
  })
  prerequisites: Movie[];
}