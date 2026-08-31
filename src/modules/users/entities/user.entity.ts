import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum WorkspaceRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

@Entity('users')
@Index(['tenantId', 'email'], { unique: true })
export class User {
  @ApiProperty({ description: 'The unique identifier of the user' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiPropertyOptional({ description: 'The tenant ID this user belongs to' })
  @Column({ name: 'tenant_id', nullable: true })
  tenantId: string | null;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant | null;

  @ApiProperty({ description: 'User email address' })
  @Column({ length: 50, nullable: false })
  @Index()
  email: string;

  @Column({ name: 'password_hash', length: 255, nullable: true, select: false })
  passwordHash: string | null;

  @ApiPropertyOptional({ description: 'First name' })
  @Column({ name: 'first_name', length: 20, nullable: true })
  firstName: string;

  @ApiPropertyOptional({ description: 'Last name' })
  @Column({ name: 'last_name', length: 20, nullable: true })
  lastName: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ description: 'Whether the email is verified' })
  @Column({ name: 'is_email_verified', default: false })
  isEmailVerified: boolean;

  @Column({ name: 'verification_token', length: 255, nullable: true })
  @Index({ unique: true, where: 'verification_token IS NOT NULL' })
  verificationToken: string | null;

  @Column({ name: 'verification_otp', length: 6, nullable: true })
  verificationOtp: string | null;

  @ApiPropertyOptional({ description: 'When the verification token/OTP expires' })
  @Column({
    name: 'verification_expires_at',
    type: 'datetime',
    nullable: true,
  })
  verificationExpiresAt: Date | null;

  @ApiProperty({ enum: WorkspaceRole, description: 'Role within the workspace' })
  @Column({
    name: 'workspace_role',
    type: 'varchar',
    default: WorkspaceRole.MEMBER,
  })
  workspaceRole: WorkspaceRole;

  @ApiProperty({ description: 'Is the user active' })
  @Column({ nullable: true, default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Deletion date' })
  @DeleteDateColumn({ type: 'datetime', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
