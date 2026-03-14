import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;

const pool = new Pool({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const isDevMode = process.env.DEV_MODE === 'true';
  const env = process.env.APP_ENV || process.env.NODE_ENV || 'development';

  if (!isDevMode || env === 'production') {
    console.log('🚫 DEV_MODE is not enabled. Skipping test account creation.');
    return;
  }

  const email = process.env.SEED_TEST_EMAIL || 'testhotel@ratevoice.ai';
  const password = process.env.SEED_TEST_PASSWORD;
  if (!password) {
    throw new Error('SEED_TEST_PASSWORD is required when DEV_MODE=true');
  }
  const businessName = 'RateVoice Test Hotel';
  
  console.log('--- Creating Test Establishment Account ---');
  console.log(`Target Email: ${email}`);

  // 1. Ensure BUSINESS Role exists
  const roleName = 'BUSINESS';
  const role = await prisma.role.upsert({
    where: { name: roleName },
    update: {},
    create: { name: roleName, description: 'Establishment/Business Owner' },
  });
  console.log('✓ Role ensured: BUSINESS');

  // 2. Hash Password
  const salt = await bcrypt.genSalt();
  const passwordHash = await bcrypt.hash(password, salt);

  // 3. Create or Update User
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      fullName: 'Test Hotel Owner',
      isVerified: true,
      isActive: true,
      mustChangePassword: false,
    },
    create: {
      email,
      passwordHash,
      fullName: 'Test Hotel Owner',
      isVerified: true,
      isActive: true,
      mustChangePassword: false,
    },
  });
  console.log('✓ User created/updated');

  // 4. Assign Role
  await prisma.userRole.upsert({
    where: {
      userId_roleId_branchId: {
        userId: user.id,
        roleId: role.id,
        branchId: '', // Handling potential null/empty mismatch if schema allows null
      } as any // Cast to any to bypass strict type check on unique constraint if branchId is nullable
    },
    update: {},
    create: {
      userId: user.id,
      roleId: role.id,
    },
  }).catch(async (e) => {
      // Fallback if unique constraint is actually (userId, roleId, branchId) where branchId can be null
      const existing = await prisma.userRole.findFirst({
          where: { userId: user.id, roleId: role.id }
      });
      if (!existing) {
          await prisma.userRole.create({
              data: { userId: user.id, roleId: role.id }
          });
      }
  });
  console.log('✓ Role assigned');

  // 5. Create Wallet (Points Balance: 50)
  await prisma.wallet.upsert({
    where: { userId: user.id },
    update: { balance: 50 },
    create: {
      userId: user.id,
      balance: 50,
      currency: 'USD',
    },
  });
  console.log('✓ Wallet created with 50 points');

  // 6. Create Business
  const business = await prisma.business.create({
    data: {
      ownerId: user.id,
      name: businessName,
      category: 'hotel',
      description: 'Sandbox Development Account', // Labeling as requested
      status: 'ACTIVE',
      branches: {
        create: {
          name: 'Main Branch',
          city: 'Casablanca',
          country: 'Morocco',
          isActive: true,
        }
      },
      verifications: {
        create: {
          documentUrl: 'https://ratevoice.ai/dev-cert.pdf',
          status: 'APPROVED', // Skip verification
          verifiedAt: new Date(),
        }
      }
    }
  });
  console.log('✓ Business & Branch created');
  console.log('✓ Verification bypassed (Status: APPROVED)');

  console.log('---------------------------------');
  console.log('   TEST ESTABLISHMENT CREDENTIALS ');
  console.log('---------------------------------');
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Login:    /establishment/dashboard`);
  console.log('---------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
