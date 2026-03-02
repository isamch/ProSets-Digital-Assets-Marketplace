import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { User, UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string; // Auth0 user ID
  email: string;
  name?: string;
  picture?: string;
  aud: string;
  iss: string;
  iat: number;
  exp: number;
}

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async validateUser(payload: JwtPayload): Promise<User> {
    const { sub: auth0Id, email, name, picture } = payload;

    try {
      // Try to find existing user
      let user = await this.prisma.user.findUnique({
        where: { auth0Id },
      });

      // If user doesn't exist, create new user
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            auth0Id,
            email,
            name: name || null,
            avatar: picture || null,
            roles: [UserRole.BUYER], // Default role
            isActive: true,
          },
        });
      } else {
        // Update user info if it has changed
        const needsUpdate = 
          user.email !== email || 
          user.name !== name || 
          user.avatar !== picture;

        if (needsUpdate) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: {
              email,
              name: name || user.name,
              avatar: picture || user.avatar,
            },
          });
        }
      }

      // Check if user is active
      if (!user.isActive) {
        throw new UnauthorizedException('User account is deactivated');
      }

      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid token payload');
    }
  }

  async findUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findUserByAuth0Id(auth0Id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { auth0Id },
    });
  }
}