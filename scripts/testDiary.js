const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const row = await prisma.workDiaryEntry.create({
    data: {
      userId: 1,
      type: 'Cits',
      label: 'Filmēšana',
      typeColor: '#6B7280',
      title: 'Filmēt reklāmu',
      notes: 'Objekts pie klienta',
      location: 'Rīga',
      startAt: new Date('2025-09-01T09:00:00+03:00'),
      endAt:   new Date('2025-09-01T10:00:00+03:00'),
      allDay: false,
      status: 'planned',
      priority: 2,
      reminders: [15, 30],
    },
  });

  const all = await prisma.workDiaryEntry.findMany({ where: { userId: 1 } });
  console.log({ inserted: row.id, total: all.length });
}

run().finally(() => prisma.$disconnect());
