import { prisma } from '../src/index';

async function main() {
  const provisionsWithoutRevision = await prisma.provision.count({
    where: {
      revisions: {
        none: {}
      }
    }
  });

  const byType = await prisma.provision.groupBy({
    by: ['type'],
    where: {
      revisions: {
        none: {}
      }
    },
    _count: true
  });

  console.log(`Total Provisions WITHOUT ProvisionRevision: ${provisionsWithoutRevision}`);
  console.log('Distribusi Type tanpa revision:', byType);

  // Check sample provisions without revision
  const sample = await prisma.provision.findMany({
    where: { revisions: { none: {} } },
    select: {
      id: true,
      canonicalPath: true,
      type: true,
      label: true,
      legalInstrument: { select: { slug: true } },
      children: { select: { id: true, canonicalPath: true, label: true } }
    },
    take: 10
  });

  console.log('\nSample provisions without revision:');
  sample.forEach(s => {
    console.log(`[${s.legalInstrument.slug}] ${s.type} ${s.label} (${s.canonicalPath}) -> children: ${s.children.length}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
