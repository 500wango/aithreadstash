import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/user.entity';

interface UserSession {
  userId: number;
  lastActive: Date;
  device?: string;
  ipAddress?: string;
}

@Injectable()
export class SessionService {
  private activeSessions = new Map<string, UserSession>();

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  createSession(userId: number, sessionId: string, device?: string, ipAddress?: string): void {
    this.activeSessions.set(sessionId, {
      userId,
      lastActive: new Date(),
      device,
      ipAddress,
    });
  }

  updateSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.lastActive = new Date();
      this.activeSessions.set(sessionId, session);
    }
  }

  getSession(sessionId: string): UserSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  destroySession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
  }

  getUserSessions(userId: number): UserSession[] {
    const sessions: UserSession[] = [];
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        sessions.push(session);
      }
    }
    return sessions;
  }

  destroyAllUserSessions(userId: number): void {
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        this.activeSessions.delete(sessionId);
      }
    }
  }

  cleanupExpiredSessions(): void {
    const now = new Date();
    const expirationTime = 24 * 60 * 60 * 1000; // 24 hours

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now.getTime() - session.lastActive.getTime() > expirationTime) {
        this.activeSessions.delete(sessionId);
      }
    }
  }

  getActiveSessionsCount(): number {
    return this.activeSessions.size;
  }
}