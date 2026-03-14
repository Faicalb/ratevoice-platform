
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const originalUrl = process.env.DATABASE_URL || '';
let connectionString = originalUrl;

// Check for Sandbox Environment (Replicating PrismaService logic)
if (process.env.APP_ENV === 'sandbox') {
    const hasQuery = originalUrl.includes('?');
    connectionString = hasQuery 
      ? `${originalUrl}&schema=sandbox` 
      : `${originalUrl}?schema=sandbox`;
    console.log('🔶 [SANDBOX MODE] Database operations are redirected to "sandbox" schema.');
}

const pool = new Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const env = process.env.APP_ENV || process.env.NODE_ENV || 'development';
  if (env === 'production' && process.env.ALLOW_SEED_IN_PROD !== 'true') {
    throw new Error('Refusing to run ensure-admin in production without ALLOW_SEED_IN_PROD=true');
  }

  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required');
  }
  console.log(`Checking for user: ${email}...`);

  // 1. Ensure SUPER_ADMIN role exists
  let superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
  if (!superAdminRole) {
    console.log('Creating SUPER_ADMIN role...');
    superAdminRole = await prisma.role.create({
      data: {
        name: 'SUPER_ADMIN',
        description: 'Super Administrator with full system access',
      },
    });
  }

  // 2. Find or Create User
  let user = await prisma.user.findUnique({
    where: { email },
    include: { roles: true },
  });

  if (!user) {
    console.log('User not found. Creating new admin user...');
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: 'System Super Admin',
        isVerified: true,
        isAdmin: true,
        isActive: true,
        mustChangePassword: true
      },
      include: { roles: true },
    });
    console.log('User created.');
  } else {
    console.log('User found. Updating permissions...');
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        isAdmin: true,
        isActive: true,
        mustChangePassword: true
      },
      include: { roles: true },
    });
  }

  // 3. Assign Role if not already assigned
  const hasRole = user.roles.some((ur) => ur.roleId === superAdminRole!.id);
  if (!hasRole) {
    console.log('Assigning SUPER_ADMIN role...');
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: superAdminRole!.id,
      },
    });
  } else {
    console.log('User already has SUPER_ADMIN role.');
  }

  console.log('-----------------------------------------------------');
  console.log('LOGIN RESULT');
  console.log(`1. User ID: ${user.id}`);
  console.log(`2. Role Assigned: SUPER_ADMIN`);
  console.log(`3. SUPER_ADMIN access enabled: YES`);
  console.log('4. Accessible Routes: ALL (/admin/*, etc.)');
  console.log('-----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
