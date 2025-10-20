// app/api/baby-logs/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const days = Number(searchParams.get('days') || 7)
  const from = new Date()
  from.setDate(from.getDate() - days)

  const logs = await prisma.babyLog.findMany({
    where: { userId: session.user.id, occurredAt: { gte: from } },
    orderBy: { occurredAt: 'desc' },
    take: 500,
  })

  return NextResponse.json({ logs })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const occurredAt = new Date(body.occurredAt)
  if (Number.isNaN(occurredAt.getTime())) {
    return NextResponse.json({ error: 'Invalid occurredAt' }, { status: 400 })
  }

  const created = await prisma.babyLog.create({
    data: {
      userId: session.user.id,
      babyId: body.babyId || null,
      occurredAt,
      foodType: String(body.foodType || ''),
      amount: Number(body.amount || 0),
      unit: String(body.unit || 'ml'),
      weightKg: body.weightKg === '' || body.weightKg == null ? null : Number(body.weightKg),
      notes: body.notes || null,
    },
  })
  return NextResponse.json({ created }, { status: 201 })
}
