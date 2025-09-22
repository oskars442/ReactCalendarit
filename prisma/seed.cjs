// prisma/seed.cjs
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || '';
  const hash = process.env.ADMIN_PASSWORD_HASH || '';

  if (!email || !hash) {
    console.log('Missing ADMIN_EMAIL or ADMIN_PASSWORD_HASH in env; skipping admin seed.');
    return;
  }

  // Adjust to your model names/fields
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash: hash, role: 'ADMIN' },
    create: {
      email,
      passwordHash: hash,
      role: 'ADMIN',
      name: 'Admin'
    }
  });

  console.log('✅ Admin user ensured:', email);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
