import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error'],
});

async function main() {
  try {
    console.log('[DB Test] Connecting...');
    const count = await prisma.user.count();
    console.log('[DB Test] SUCCESS! User count:', count);
    
    // Try to create test user if not exists
    const testEmail = 'test@stockpilot.ai';
    let user = await prisma.user.findUnique({ where: { email: testEmail } });
    if (!user) {
      const bcrypt = (await import('bcryptjs')).default;
      const hashed = await bcrypt.hash('123456789', 12);
      user = await prisma.user.create({
        data: {
          email: testEmail,
          name: 'Test User',
          password: hashed,
          watchlists: {
            create: { name: 'My Watchlist' },
          },
        },
      });
      console.log('[DB Test] Created test user:', user.email, '| id:', user.id);
    } else {
      console.log('[DB Test] Test user already exists:', user.email, '| id:', user.id);
      // Update password to ensure it matches
      const bcrypt = (await import('bcryptjs')).default;
      const hashed = await bcrypt.hash('123456789', 12);
      await prisma.user.update({
        where: { email: testEmail },
        data: { password: hashed },
      });
      console.log('[DB Test] Password updated for test user');
    }
  } catch (err) {
    console.error('[DB Test] FAILED:', err.message);
    if (err.code) console.error('[DB Test] Error code:', err.code);
  } finally {
    await prisma.$disconnect();
  }
}

main();
