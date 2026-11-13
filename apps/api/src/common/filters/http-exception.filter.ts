import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request.headers['x-request-id'] as string) || uuid();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse() as Record<string, unknown>;

      if (typeof body === 'string') {
        message = body;
      } else {
        code = (body.code as string) || `HTTP_${status}`;
        message = (body.message as string) || exception.message;
        details = body.details;

        // Handle class-validator errors
        if (Array.isArray(body.message)) {
          code = 'VALIDATION_ERROR';
          message = 'Validation failed';
          details = body.message;
        }
      }
    }

    // Log full error (never expose stack to client)
    this.logger.error({
      requestId,
      status,
      code,
      message,
      path: request.url,
      method: request.method,
      ...(exception instanceof Error ? { stack: exception.stack } : {}),
    });

    response.status(status).json({
      success: false,
      error: { code, message, ...(details ? { details } : {}) },
      requestId,
    });
  }
}
