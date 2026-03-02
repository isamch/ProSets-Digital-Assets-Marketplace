# ProSets Backend - Digital Assets Marketplace

## Architecture Overview

This is a production-ready NestJS backend for ProSets digital assets marketplace.

### Tech Stack
- NestJS (Node.js framework)
- PostgreSQL (Database)
- Prisma ORM (Database ORM)
- Auth0 (JWT validation)
- Stripe (Payment processing)
- AWS S3 (File storage)

### Architecture Principles
- Modular architecture with feature-based modules
- Clean separation of concerns
- Domain-driven design patterns
- SOLID principles
- Security-first approach

## Project Structure

```
backend/
├── src/
│   ├── app.module.ts                 # Root application module
│   ├── main.ts                       # Application entry point
│   │
│   ├── config/                       # Configuration management
│   │   ├── config.module.ts
│   │   ├── database.config.ts
│   │   ├── auth.config.ts
│   │   ├── stripe.config.ts
│   │   └── aws.config.ts
│   │
│   ├── common/                       # Shared utilities and components
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── middleware/
│   │   ├── pipes/
│   │   └── types/
│   │
│   ├── database/                     # Database related files
│   │   ├── database.module.ts
│   │   ├── prisma.service.ts
│   │   └── migrations/
│   │
│   ├── modules/                      # Feature modules
│   │   ├── auth/                     # Authentication & Authorization
│   │   ├── users/                    # User management
│   │   ├── assets/                   # Digital assets management
│   │   ├── categories/               # Asset categories
│   │   ├── orders/                   # Order management
│   │   ├── payments/                 # Payment processing
│   │   ├── uploads/                  # File upload handling
│   │   ├── downloads/                # Secure download management
│   │   └── admin/                    # Admin operations
│   │
│   └── health/                       # Health check endpoints
│
├── prisma/                          # Prisma schema and migrations
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── test/                            # Test files
├── .env.example                     # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
├── nest-cli.json
└── docker-compose.yml              # For local development
```

## Module Responsibilities

### Core Modules

#### 1. Config Module
- Environment variables management
- Configuration validation
- Service-specific configurations (DB, Auth0, Stripe, AWS)

#### 2. Database Module
- Prisma service setup
- Database connection management
- Transaction handling

#### 3. Common Module
- Shared utilities, decorators, guards
- Global exception filters
- Validation pipes
- Logging middleware

### Feature Modules

#### 4. Auth Module
- JWT token validation (Auth0)
- Role-based access control
- Authentication guards
- User context extraction

#### 5. Users Module
- User profile management
- User preferences
- Seller/Buyer role management

#### 6. Assets Module
- Digital asset CRUD operations
- Asset metadata management
- Asset approval workflow
- Search and filtering

#### 7. Categories Module
- Asset categorization
- Category hierarchy management

#### 8. Orders Module
- Order creation and management
- Order status tracking
- Purchase history

#### 9. Payments Module
- Stripe integration
- Payment intent creation
- Webhook handling
- Payment verification

#### 10. Uploads Module
- File upload to S3 (previews to public bucket)
- File validation and processing
- Metadata extraction

#### 11. Downloads Module
- Secure download URL generation
- Access control validation
- Presigned URL creation (5-minute expiry)
- Download tracking

#### 12. Admin Module
- Asset moderation
- User management
- Platform analytics
- Content management

### Security Features
- JWT validation on all protected routes
- Role-based access control
- File access validation
- Secure presigned URLs
- Input validation and sanitization
- Rate limiting
- CORS configuration

### Monitoring & Health
- Health check endpoints
- Logging middleware
- Error tracking
- Performance monitoring