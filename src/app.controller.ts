import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { API_ROUTES } from './core/constants/routes';
import { RESPONSE_MESSAGES } from './core/constants/messages';
import { ResponseMessage } from './core/decorators/response-message.decorator';
import { AppService, HealthStatusResponse } from './app.service';

@ApiTags('Health')
@Controller(API_ROUTES.HEALTH.ROOT)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Check system health',
    description:
      'Returns overall application health status along with database, Redis, uptime, and environment details.',
  })
  @ApiResponse({
    status: 200,
    description: 'Health check completed successfully',
  })
  @ResponseMessage(RESPONSE_MESSAGES.HEALTH.SUCCESS)
  public async getHealth(): Promise<HealthStatusResponse> {
    return this.appService.getHealth();
  }
}
