import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Tenant } from "../../tenants/entities/tenant.entity";

export enum WorkspaceRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

export enum UserPlan {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

@Entity('users')
@Index(['tenantId', 'email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', nullable: true })
  tenantId: string | null;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant | null;

  @Column({ length: 50, nullable: false })
  @Index()
  email: string;

  @Column({ name: 'password_hash', length: 255, nullable: true, select: false })
  passwordHash: string | null;

  @Column({ name: 'first_name', length: 20, nullable: true })
  firstName: string;

  @Column({ name: 'last_name', length: 20, nullable: true })
  lastName: string;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'is_email_verified', default: false })
  isEmailVerified: boolean;

  @Column({ name: 'verification_token', length: 255, nullable: true })
  @Index({ unique: true, where: 'verification_token IS NOT NULL' })
  verificationToken: string | null;

  @Column({ name: 'verification_otp', length: 6, nullable: true })
  verificationOtp: string | null;

  @Column({ name: 'verification_expires_at', type: 'timestamptz', nullable: true })
  verificationExpiresAt: Date | null;

  @Column({
    name: 'workspace_role',
    type: 'enum',
    enum: WorkspaceRole,
    default: WorkspaceRole.MEMBER,
  })
  workspaceRole: WorkspaceRole;

  @Column({
    type: 'enum',
    enum: UserPlan,
    default: UserPlan.FREE,
  })
  plan: UserPlan;

  @Column({ nullable: true, default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: "deleted_at", nullable: true })
  deletedAt: Date | null;
}