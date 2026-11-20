import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';


const migrationsPath = `${import.meta.dirname.replaceAll('\\', '/')}/../migrations/*.js`;

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');

       
        const connection = databaseUrl
          ? { url: databaseUrl }
          : {
              host: config.get<string>('DB_HOST', 'localhost'),
              port: Number(config.get<string>('DB_PORT', '5432')),
              username: config.get<string>('DB_USERNAME'),
              password: config.get<string>('DB_PASSWORD'),
              database: config.get<string>('DB_NAME'),
            };

        return {
          type: 'postgres' as const,
          ...connection,
          ssl: config.get<string>('DB_SSL') === 'true',
          autoLoadEntities: true,
          synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true',
          migrations: [migrationsPath],
          migrationsRun: config.get<string>('DB_MIGRATIONS_RUN') === 'true',
        };
      },
    }),
  ],
})
export class DatabaseModule {}