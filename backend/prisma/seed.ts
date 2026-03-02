import { PrismaClient, UserRole, AssetCategory, AssetStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create Admin User
  const adminEmail = 'admin@prosets.com';
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      auth0Id: 'auth0|admin123', // Mock Auth0 ID
      name: 'Admin User',
      roles: [UserRole.ADMIN, UserRole.SELLER, UserRole.BUYER],
      isActive: true,
    },
  });
  console.log(`Created admin user: ${admin.email}`);

  // Create Seller User
  const sellerEmail = 'seller@prosets.com';
  const seller = await prisma.user.upsert({
    where: { email: sellerEmail },
    update: {},
    create: {
      email: sellerEmail,
      auth0Id: 'auth0|seller123', // Mock Auth0 ID
      name: 'John Seller',
      roles: [UserRole.SELLER],
      isActive: true,
    },
  });
  console.log(`Created seller user: ${seller.email}`);

  // Create Buyer User
  const buyerEmail = 'buyer@prosets.com';
  const buyer = await prisma.user.upsert({
    where: { email: buyerEmail },
    update: {},
    create: {
      email: buyerEmail,
      auth0Id: 'auth0|buyer123', // Mock Auth0 ID
      name: 'Jane Buyer',
      roles: [UserRole.BUYER],
      isActive: true,
    },
  });
  console.log(`Created buyer user: ${buyer.email}`);

  // Create some assets
  const asset1 = await prisma.asset.create({
    data: {
      title: 'Modern UI Kit',
      description: 'A complete UI kit for modern web applications.',
      price: 49.99,
      previewUrl: 'https://prosets-public.s3.amazonaws.com/preview1.jpg',
      fileKey: 'private/ui-kit.zip',
      fileName: 'ui-kit.zip',
      fileSize: 1024000,
      category: AssetCategory.GRAPHICS,
      status: AssetStatus.ACTIVE,
      tags: ['ui', 'web', 'design'],
      sellerId: seller.id,
    },
  });
  console.log(`Created asset: ${asset1.title}`);

  const asset2 = await prisma.asset.create({
    data: {
      title: 'NestJS Boilerplate',
      description: 'Production-ready NestJS starter template.',
      price: 29.99,
      previewUrl: 'https://prosets-public.s3.amazonaws.com/preview2.jpg',
      fileKey: 'private/nestjs-starter.zip',
      fileName: 'nestjs-starter.zip',
      fileSize: 500000,
      category: AssetCategory.CODE_SNIPPETS,
      status: AssetStatus.PENDING_APPROVAL,
      tags: ['nestjs', 'backend', 'typescript'],
      sellerId: seller.id,
    },
  });
  console.log(`Created asset: ${asset2.title}`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
