import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Tenant } from './entities/tenant.entity';
import { WorkspaceRole } from '../users/entities/user.entity';
import { CreateTenantDTO } from './dto/create-tenant.dto';
import { RESPONSE_MESSAGES } from '../../core/constants/messages';
import { TENANT_CONSTANTS } from '../../core/constants/tenants';
import { UserRepository } from '../users/repositories/user.repository';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationChannel } from '../notifications/entities/notification-type.enum';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly userRepository: UserRepository,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  public async createTenant(
    userId: string,
    dto: CreateTenantDTO,
  ): Promise<Tenant> {
    try {
      const { name, slug } = dto;

      // 1. Find user
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException(RESPONSE_MESSAGES.USER_NOT_FOUND);
      }

      // 2. Business rule check: "any user not able to make a tenant if that user have not any plan other than free"
      const activeSubscription =
        await this.subscriptionsService.getActiveSubscription(userId);
      if (!activeSubscription) {
        throw new ForbiddenException(RESPONSE_MESSAGES.FREE_PLAN_RESTRICTION);
      }

      const userOrganization = user.tenantId;
      if (userOrganization) {
        throw new ConflictException(
          RESPONSE_MESSAGES.TENANT.USER_ALREADY_HAVE_TENANT,
        );
      }

      // 3. Check if slug is already taken
      const existingTenant = await this.tenantRepository.findOne({
        where: { slug },
      });
      if (existingTenant) {
        throw new ConflictException(
          RESPONSE_MESSAGES.TENANT.TENANT_SLUG_CONFLICT,
        );
      }

      // 4. Generate unique tenant code
      const code = `${TENANT_CONSTANTS.CODE_PREFIX}${randomBytes(
        TENANT_CONSTANTS.CODE_BYTE_LENGTH,
      )
        .toString('hex')
        .toUpperCase()}`;

      // 5. Create and save the Tenant
      const tenant = this.tenantRepository.create({
        name,
        slug,
        code,
      });
      const savedTenant = await this.tenantRepository.save(tenant);

      // 6. Update user to associate with the tenant and set workspace role to OWNER
      user.tenantId = savedTenant.id;
      user.workspaceRole = WorkspaceRole.OWNER;
      await this.userRepository.save(user);

      await this.notificationsService.createNotification({
        recipientId: userId,
        type: NotificationType.PROJECT_UPDATE,
        channel: NotificationChannel.IN_APP,
        title: 'Workspace Created',
        body: `You have successfully created the workspace '${savedTenant.name}'.`,
      });

      return savedTenant;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : 'An error occurred while creating the tenant',
      );
    }
  }

  public async getTenant(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(RESPONSE_MESSAGES.USER_NOT_FOUND);
    }

    if (!user.tenantId) {
      return { tenant: null, role: user.workspaceRole };
    }
    const tenant = await this.tenantRepository.findOne({
      where: { id: user.tenantId },
    });
    if (!tenant) {
      throw new NotFoundException(RESPONSE_MESSAGES.TENANT.TENANT_NOT_FOUND);
    }
    return { tenant, role: user.workspaceRole };
  }
}
