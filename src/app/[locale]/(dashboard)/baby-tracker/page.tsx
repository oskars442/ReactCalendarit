// app/[locale]/(dashboard)/baby-tracker/page.tsx
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import BabyTrackerClient from './ui'

export const dynamic = 'force-dynamic'

type ClientBabyLog = {
  id: string
  userId: string
  babyId: string | null
  occurredAt: string
  foodType: string
  amount: number
  unit: string
  weightKg: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export default async function Page() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return <div className="p-6">Unauthorized</div>
  }

  const from = new Date()
  from.setDate(from.getDate() - 7)

  const logs = await prisma.babyLog.findMany({
    where: { userId: session.user.id, occurredAt: { gte: from } },
    orderBy: { occurredAt: 'desc' },
  })

  // Date -> ISO string, lai atbilstu klienta tipiem
  const serialized: ClientBabyLog[] = logs.map(l => ({
    id: l.id,
    userId: l.userId,
    babyId: l.babyId ?? null,
    occurredAt: l.occurredAt.toISOString(),
    foodType: l.foodType,
    amount: l.amount,
    unit: l.unit,
    weightKg: l.weightKg ?? null,
    notes: l.notes ?? null,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  }))

  return <BabyTrackerClient initialLogs={serialized} />
}
