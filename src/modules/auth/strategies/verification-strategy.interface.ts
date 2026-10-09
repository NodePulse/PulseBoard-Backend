import { User } from '../../users/entities/user.entity';

export interface VerificationStrategy {
  send(params: {
    user: User;
    email: string;
    method: string;
    verificationExpiresAt: Date;
    expiresIn: number;
    resendCooldown: number;
  }): Promise<any>;

  verify(params: {
    email?: string;
    code: string;
    method?: string;
  }): Promise<any>;
}
