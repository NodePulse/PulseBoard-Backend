import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
  UseGuards,
  Get,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDTO } from './dto/create-tenant.dto';
import { ResponseMessage } from '../../core/decorators/response-message.decorator';
import { RESPONSE_MESSAGES } from '../../core/constants/messages';
import { API_ROUTES } from '../../core/constants/routes';
import { SessionGuard } from 'src/core/guards/session.guard';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { SessionPayload } from '../auth/auth.controller';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { ApiEndpoint } from 'src/core/decorators/api-endpoint.decorator';

@ApiTags('Tenants')
@Controller(API_ROUTES.TENANTS.ROOT)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  // CONTROLLER
  @ApiOperation({
    summary: 'Create a new organization/tenant',
    description: 'Creates a new tenant and sets the user as the owner.',
  })
  @ApiBody({ type: CreateTenantDTO })
  @ApiEndpoint({
    201: {
      type: { id: String, name: String, slug: String },
      message: RESPONSE_MESSAGES.TENANT_CREATED,
    },
    400: RESPONSE_MESSAGES.AUTH.VALIDATION_ERROR,
    401: RESPONSE_MESSAGES.UNAUTHORIZED_TOKEN,
  })
  @Post(API_ROUTES.TENANTS.CREATE_ORGANIZATION)
  @ResponseMessage(RESPONSE_MESSAGES.TENANT_CREATED)
  @UseGuards(SessionGuard)
  public async create(
    @CurrentUser() user: SessionPayload,
    @Body()
    dto: CreateTenantDTO,
  ) {
    if (!user?.sub) {
      throw new BadRequestException(RESPONSE_MESSAGES.HEADER_REQUIRED);
    }
    return this.tenantsService.createTenant(user?.sub, dto);
  }

  // CONTROLLER
  @ApiOperation({
    summary: 'Get current organization',
    description: 'Retrieves the organization the current user belongs to.',
  })
  @ApiEndpoint({
    200: {
      type: { id: String, name: String, slug: String },
      message: RESPONSE_MESSAGES.TENANT.GET_SUCCESS,
    },
    401: RESPONSE_MESSAGES.UNAUTHORIZED_TOKEN,
  })
  @Get(API_ROUTES.TENANTS.GET_ORGANIZATION)
  @ResponseMessage(RESPONSE_MESSAGES.TENANT.GET_SUCCESS)
  @UseGuards(SessionGuard)
  public async getOrganization(@CurrentUser() user: SessionPayload) {
    return this.tenantsService.getTenant(user?.sub);
  }
}
