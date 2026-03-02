# Auth Module

This module handles JWT token validation from Auth0 and user management.

## Features

- JWT token validation using Auth0 JWKS
- Automatic user creation/update from token payload
- Role-based access control
- Custom decorators for easy usage

## Usage Examples

### Basic Authentication

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser } from '../auth';
import { User } from '@prisma/client';

@Controller('protected')
@UseGuards(JwtAuthGuard)
export class ProtectedController {
  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return user;
  }
}
```

### Public Routes

```typescript
import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth';

@Controller('public')
export class PublicController {
  @Public()
  @Get('info')
  getPublicInfo() {
    return { message: 'This is public' };
  }
}
```

### Role-Based Access

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth';
import { UserRole } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Roles(UserRole.ADMIN)
  @Get('dashboard')
  getAdminDashboard(@CurrentUser() user: User) {
    return { message: 'Admin only content' };
  }

  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @Get('seller-tools')
  getSellerTools(@CurrentUser() user: User) {
    return { message: 'Seller tools' };
  }
}
```

## Environment Variables Required

```env
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_AUDIENCE=your-api-identifier
```

## How It Works

1. **Token Validation**: JWT tokens are validated using Auth0's JWKS endpoint
2. **User Management**: Users are automatically created/updated based on token payload
3. **Request Context**: Validated user is attached to request object
4. **Guards**: Custom guards handle authentication and authorization
5. **Decorators**: Easy-to-use decorators for common patterns

## Security Features

- JWKS caching and rate limiting
- Automatic token expiry validation
- User account status checking
- Role-based access control
- Public route exemption