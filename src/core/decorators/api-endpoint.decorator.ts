import { applyDecorators } from '@nestjs/common';
import { ApiResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { ErrorResponseDTO } from '../dto/error-response.dto';
import { ApiSuccessResponse } from './api-success-response.decorator';

export interface SuccessEndpointConfig {
  type?: any;
  message?: string;
  description?: string;
}

export interface ErrorEndpointConfig {
  description: string;
}

export type EndpointResponses = {
  [status: number]: SuccessEndpointConfig | string;
};

const getErrorStatusText = (status: number) => {
  const map: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_SERVER_ERROR',
  };
  return map[status] || 'ERROR';
};

export function ApiEndpoint(responses: EndpointResponses) {
  const decorators: MethodDecorator[] = [ApiExtraModels(ErrorResponseDTO)];

  for (const [statusStr, config] of Object.entries(responses)) {
    const status = parseInt(statusStr, 10);
    const isSuccess = status >= 200 && status < 300;

    if (isSuccess) {
      const successConfig = typeof config === 'string' ? { description: config } : (config as SuccessEndpointConfig);
      decorators.push(
        ApiSuccessResponse(successConfig.type || 'string', {
          status,
          message: successConfig.message,
          description: successConfig.description,
        })
      );
    } else {
      const description = typeof config === 'string' ? config : (config as ErrorEndpointConfig).description;
      decorators.push(
        ApiResponse({
          status,
          description,
          schema: {
            allOf: [
              { $ref: getSchemaPath(ErrorResponseDTO) },
              {
                properties: {
                  statusCode: { type: 'number', example: status },
                  message: { type: 'string', example: description },
                  error: { type: 'string', example: getErrorStatusText(status) },
                },
              },
            ],
          },
        })
      );
    }
  }

  return applyDecorators(...decorators);
}

