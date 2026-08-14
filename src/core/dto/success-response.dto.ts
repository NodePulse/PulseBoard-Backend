import { ApiProperty } from '@nestjs/swagger';

export class SuccessResponseDTO<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Operation successful' })
  message: string;

  // The actual type of data will be defined when this is used in a decorator,
  // since TypeScript generics do not persist to Swagger metadata automatically.
  data: T;
}
