import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

// Helper to get connection string with specific schema
const getUrl = (schema?: string) => {
  const url = process.env.DATABASE_URL || '';
  if (!schema) return url;
  return url.includes('?') 
    ? `${url}&schema=${schema}` 
    : `${url}?schema=${schema}`;
};

async function main() {
  if (process.env.APP_ENV !== 'sandbox') {
    throw new Error('seed-sandbox can only run with APP_ENV=sandbox');
  }
  console.log('--- Sandbox Initialization ---');

  const originalUrl = process.env.DATABASE_URL;
  if (!originalUrl) {
      throw new Error('DATABASE_URL is missing');
  }

  // 1. Setup Sandbox Schema (using default connection)
  console.log('1. Setting up Sandbox Schema...');
  const defaultPool = new Pool({ 
      connectionString: originalUrl,
      ssl: { rejectUnauthorized: false }
  });

  const createSchemaSql = `
    CREATE SCHEMA IF NOT EXISTS sandbox;
    
    DO $$ 
    DECLARE 
        r RECORD;
    BEGIN 
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP 
            EXECUTE 'CREATE TABLE IF NOT EXISTS sandbox."' || r.tablename || '" (LIKE public."' || r.tablename || '" INCLUDING ALL)';
        END LOOP;
    END $$;
    
    GRANT ALL ON SCHEMA sandbox TO postgres;
    GRANT ALL ON ALL TABLES IN SCHEMA sandbox TO postgres;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA sandbox TO postgres;
  `;

  try {
      await defaultPool.query(createSchemaSql);
      console.log('✓ Sandbox Schema Created/Synced');
  } catch (e) {
      console.error('Error creating schema:', e);
      // Don't exit, maybe it already exists and permission failed, but we try to proceed
  } finally {
      await defaultPool.end();
  }

  // 2. Connect to Sandbox Schema
  console.log('2. Connecting to Sandbox...');
  const sandboxUrl = getUrl('sandbox');
  const sandboxPool = new Pool({ 
      connectionString: sandboxUrl,
      ssl: { rejectUnauthorized: false }
  });
  const adapter = new PrismaPg(sandboxPool);
  const prisma = new PrismaClient({ adapter });

  try {
      // 3. Seed Data
      console.log('3. Seeding Data...');

      // Roles
      const roles = ['SUPER_ADMIN', 'ADMIN', 'BUSINESS', 'USER', 'AMBASSADOR', 'ELITE'];
      for (const roleName of roles) {
        await prisma.role.upsert({
          where: { name: roleName },
          update: {},
          create: { name: roleName, description: `${roleName} Role (Sandbox)` },
        });
      }

      // Admin
      const adminPass = process.env.SEED_SANDBOX_ADMIN_PASSWORD;
      if (!adminPass) throw new Error('SEED_SANDBOX_ADMIN_PASSWORD is required');
      const salt = await bcrypt.genSalt();
      const hash = await bcrypt.hash(adminPass, salt);
      const adminEmail = 'admin_sandbox@ratevoice.ai';

      await prisma.user.upsert({
        where: { email: adminEmail },
        update: { passwordHash: hash },
        create: {
          email: adminEmail,
          passwordHash: hash,
          fullName: 'Sandbox Admin',
          isVerified: true,
          isActive: true,
          mustChangePassword: false,
          roles: {
            create: {
              role: { connect: { name: 'SUPER_ADMIN' } }
            }
          }
        }
      });

      // Hotels
      const hotels = [
        { name: 'Casablanca Grand Hotel', city: 'Casablanca' },
        { name: 'Atlas Luxury Resort', city: 'Marrakech' },
        { name: 'Marrakech Desert Palace', city: 'Marrakech' },
        { name: 'Ocean View Hotel', city: 'Tangier' },
        { name: 'Rabat Royal Suites', city: 'Rabat' }
      ];

      for (const h of hotels) {
        const email = `hotel_${h.city.toLowerCase().replace(' ', '')}_${Math.floor(Math.random() * 10000)}@sandbox.com`;
        
        // Check if exists to avoid dupes in seed re-runs
        const existing = await prisma.user.findUnique({ where: { email } });
        if (!existing) {
            const user = await prisma.user.create({
                data: {
                    email,
                    passwordHash: hash,
                    fullName: `${h.name} Owner`,
                    isVerified: true,
                    isActive: true,
                    roles: { create: { role: { connect: { name: 'BUSINESS' } } } }
                }
            });

            await prisma.business.create({
                data: {
                    ownerId: user.id,
                    name: h.name,
                    category: 'hotel',
                    status: 'ACTIVE',
                    description: 'Sandbox Establishment',
                    branches: {
                        create: {
                            name: 'Main Branch',
                            city: h.city,
                            country: 'Morocco',
                            isActive: true
                        }
                    }
                }
            });

            await prisma.wallet.create({
                data: {
                    userId: user.id,
                    balance: 1000,
                    currency: 'USD'
                }
            });
        }
      }

      console.log('✓ Seeding Complete');
      console.log('---------------------------------');
      console.log('SANDBOX ENVIRONMENT READY');
      console.log('Admin Login: admin_sandbox@ratevoice.ai');
      console.log('Password:    sandbox123');
      console.log('---------------------------------');

  } catch (e) {
      console.error('Seeding Error:', e);
      process.exit(1);
  } finally {
      await prisma.$disconnect();
      await sandboxPool.end();
  }
}

main();
