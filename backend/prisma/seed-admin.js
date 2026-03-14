const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = 'superadmin@ratevoice.ai';
  const initialPassword = 'ChangeMeNow!2026';

  console.log('--- Super Admin Initialization ---');

  // 1. Ensure Roles exist
  const roles = ['ADMIN', 'BUSINESS', 'USER', 'AMBASSADOR', 'ELITE'];
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, description: `${roleName} Role` },
    });
  }
  console.log('✓ Roles synchronized.');

  // 2. Hash Password
  const salt = await bcrypt.genSalt();
  const passwordHash = await bcrypt.hash(initialPassword, salt);

  // 3. Create Super Admin
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      mustChangePassword: true,
      isActive: true,
      isVerified: true,
    },
    create: {
      email: adminEmail,
      passwordHash,
      fullName: 'Super Administrator',
      mustChangePassword: true,
      isActive: true,
      isVerified: true,
      roles: {
        create: {
          role: {
            connect: { name: 'ADMIN' }
          }
        }
      }
    },
  });

  console.log(`✓ Super Admin user created/updated: ${admin.email}`);
  console.log(`✓ Initial Access Key: ${initialPassword}`);
  console.log('⚠️  Password change will be required on first login.');
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
