import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SessionCacheService } from '../session/session-cache.service';
import { Notification } from './entities/notification.entity';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly sessionCacheService: SessionCacheService) {}

  async handleConnection(client: Socket) {
    try {
      const cookieHeader = client.handshake.headers.cookie;
      let sessionId: string | undefined;
      if (cookieHeader) {
        const match = cookieHeader.match(/pulseboard_session=([^;]+)/);
        if (match) {
          sessionId = match[1];
        } else {
          sessionId = cookieHeader;
        }
      }

      if (!sessionId) {
        client.disconnect();
        return;
      }

      const session = await this.sessionCacheService.get(sessionId);

      if (!session) {
        client.disconnect();
        return;
      }

      const userId = session.userId;
      (client as any).userId = userId;
      client.join(`user_${userId}`);

      console.log(`User ${userId} connected to notification gateway`);
    } catch (error) {
      console.error('Error in handleConnection:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const userId = (client as any).userId || client.handshake.auth?.userId;
      if (userId) {
        client.leave(`user_${userId}`);
      }
      console.log(`User ${userId || 'unknown'} disconnected`);
    } catch (error) {
      console.error('Error in handleDisconnect:', error);
    }
  }

  async sendNotificationToUser(userId: string, notification: Notification) {
    this.server.to(`user_${userId}`).emit('notification', notification);
  }
}
