import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('NotificationsGateway');

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        throw new Error('Authentication token missing');
      }

      const payload = await this.jwtService.verifyAsync(token);
      
      // Store user info in socket instance
      client.data.user = payload;
      
      // Auto-join user's personal room
      const userRoom = `user_${payload.sub}`;
      client.join(userRoom);
      
      this.logger.log(`Client connected: ${client.id} (User: ${payload.sub})`);
    } catch (error) {
      this.logger.warn(`Connection rejected: ${client.id} - ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(client: Socket, room: string) {
    // Basic room validation - preventing users from joining other users' rooms
    if (room.startsWith('user_')) {
       const requestedUserId = room.split('_')[1];
       if (client.data.user?.sub !== requestedUserId) {
           this.logger.warn(`User ${client.data.user?.sub} attempted to join unauthorized room ${room}`);
           return;
       }
    }

    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
  }

  // Method to send notifications to a specific user
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user_${userId}`).emit(event, data);
  }
  
  // Method to broadcast to all
  broadcast(event: string, data: any) {
      this.server.emit(event, data);
  }
}
