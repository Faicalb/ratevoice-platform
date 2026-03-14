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
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const tempPassword = process.env.SEED_ADMIN_PASSWORD;
  const env = process.env.APP_ENV || process.env.NODE_ENV || 'development';
  if (env === 'production' && process.env.ALLOW_SEED_IN_PROD !== 'true') {
    throw new Error('Refusing to run seed-admin in production without ALLOW_SEED_IN_PROD=true');
  }
  if (!adminEmail || !tempPassword) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required');
  }
  
  console.log('--- Super Admin Initialization ---');
  console.log(`Target Email: ${adminEmail}`);

  try {
      // 1. Ensure SUPER_ADMIN Role exists
      const roles = ['SUPER_ADMIN', 'ADMIN', 'BUSINESS', 'USER', 'AMBASSADOR', 'ELITE'];
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
      const passwordHash = await bcrypt.hash(tempPassword, salt);

      // 3. Get SUPER_ADMIN role id
      const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
      if (!superAdminRole) {
          throw new Error('SUPER_ADMIN role not found after sync.');
      }

      // 4. Create or Update Super Admin
      const existingUser = await prisma.user.findUnique({
        where: { email: adminEmail },
        include: { roles: true }
      });

      if (existingUser) {
        console.log(`⚠️  Super Admin user already exists: ${existingUser.email}`);
        
        // Update password
        await prisma.user.update({
            where: { email: adminEmail },
            data: {
                passwordHash,
                mustChangePassword: true,
                isActive: true,
                isVerified: true
            }
        });

        // Assign Role if missing
        const existingRoleLink = await prisma.userRole.findFirst({
            where: {
                userId: existingUser.id,
                roleId: superAdminRole.id,
                branchId: null
            }
        });

        if (!existingRoleLink) {
            await prisma.userRole.create({
                data: {
                    userId: existingUser.id,
                    roleId: superAdminRole.id,
                    branchId: null
                }
            });
            console.log(`✓ Assigned SUPER_ADMIN role.`);
        }

        console.log(`✓ Super Admin password reset.`);
      } else {
        await prisma.user.create({
          data: {
            email: adminEmail,
            passwordHash,
            fullName: 'Super Administrator',
            mustChangePassword: true,
            isActive: true,
            isVerified: true,
            roles: {
              create: {
                roleId: superAdminRole.id,
                branchId: null
              }
            }
          },
        });
        console.log(`✓ Super Admin user created: ${adminEmail}`);
      }

      console.log('---------------------------------');
      console.log('       ADMIN CREDENTIALS         ');
      console.log('---------------------------------');
      console.log(`Email:    ${adminEmail}`);
      console.log('---------------------------------');
      console.log('⚠️  Please login immediately and change your password.');

  } catch (error) {
      console.error('❌ Database connection failed or script error:', error);
      console.log('\n--- MANUAL SQL INSTRUCTIONS ---');
      console.log('If connection fails, please run the following SQL in Supabase SQL Editor:');
      
      const hash = await bcrypt.hash(tempPassword, 10);
      
      console.log(`
-- 1. Ensure Role Exists
INSERT INTO "Role" (id, name, description)
VALUES (gen_random_uuid(), 'SUPER_ADMIN', 'Super Admin Role')
ON CONFLICT (name) DO NOTHING;

-- 2. Create User (or update password if exists)
WITH new_user AS (
    INSERT INTO "User" (id, email, "passwordHash", "fullName", "mustChangePassword", "isActive", "isVerified", "createdAt", "updatedAt")
    VALUES (
        gen_random_uuid(), 
        '${adminEmail}', 
        '${hash}', 
        'Super Administrator', 
        true, 
        true, 
        true, 
        NOW(), 
        NOW()
    )
    ON CONFLICT (email) DO UPDATE 
    SET "passwordHash" = EXCLUDED."passwordHash", "mustChangePassword" = true
    RETURNING id
)
-- 3. Assign Role
INSERT INTO "UserRole" (id, "userId", "roleId", "branchId", "assignedAt")
SELECT 
    gen_random_uuid(),
    (SELECT id FROM new_user UNION ALL SELECT id FROM "User" WHERE email = '${adminEmail}' LIMIT 1),
    (SELECT id FROM "Role" WHERE name = 'SUPER_ADMIN'),
    NULL,
    NOW()
ON CONFLICT ("userId", "roleId", "branchId") DO NOTHING;
      `);
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
