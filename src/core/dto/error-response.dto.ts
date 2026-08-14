import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDTO {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Validation failed' })
  message: string;

  @ApiProperty({ example: 'BAD_REQUEST' })
  error: string;

  // @ApiProperty({ required: false })
  // data?: any;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/auth/login' })
  path: string;
}
