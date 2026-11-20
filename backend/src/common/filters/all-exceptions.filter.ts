import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'string') {
        response
          .status(status)
          .json({ statusCode: status, error: HttpStatus[status] ?? 'ERROR', message: body });
        return;
      }

      const { error, message } = body as { error?: string; message?: string | string[] };
      const isValidation = status === HttpStatus.BAD_REQUEST && Array.isArray(message);

      response.status(status).json({
        statusCode: status,
        error: isValidation ? 'VALIDATION_ERROR' : (error ?? HttpStatus[status] ?? 'ERROR'),
        message: message ?? exception.message,
      });
      return;
    }

    
    if (
      exception instanceof QueryFailedError &&
      (exception.driverError as { code?: string } | undefined)?.code === '23505'
    ) {
      response.status(409).json({
        statusCode: 409,
        error: 'DUPLICATE_VALUE',
        message: 'A record with the same unique value already exists',
      });
      return;
    }

    console.error(exception);
    response.status(500).json({
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong on the server',
    });
  }
}