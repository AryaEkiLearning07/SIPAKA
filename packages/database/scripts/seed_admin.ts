import { prisma } from '../src/index';
import bcrypt from 'bcryptjs';

async function main() {
  const email = 'aryaeki@admin';
  const password = 'aryaeki07';
  const name = 'Arya Eki';
  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hash,
      role: 'ADMIN',
      name,
    },
    create: {
      email,
      name,
      passwordHash: hash,
      role: 'ADMIN',
      isDemo: false,
    },
  });

  console.log(`[SUCCESS] Akun Admin siap: ${user.name} (${user.email}) - Peran: ${user.role}`);

  // Catat jejak audit awal
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      userRole: user.role,
      action: 'ADMIN_ACCOUNT_INITIALIZED',
      entity: 'User',
      entityId: user.id,
      details: { note: 'Inisialisasi akun Administrator Utama SIPAKA berstandar ISO 9001/27001' },
    },
  });

  console.log('[SUCCESS] Audit log inisialisasi admin berhasil dicatat.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
