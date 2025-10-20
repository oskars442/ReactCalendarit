// app/api/baby-logs/[id]/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * PUT /api/baby-logs/[id]
 * Atjaunina konkrētu bērna ierakstu
 */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    const body = await req.json()

    // Pārbaudām, vai ieraksts pieder lietotājam
    const existing = await prisma.babyLog.findFirst({
      where: { id: params.id, userId },
    })
    if (!existing)
      return NextResponse.json({ error: 'Not found or not allowed' }, { status: 404 })

    // Drošs update
    const updated = await prisma.babyLog.update({
      where: { id: params.id },
      data: {
        occurredAt: body.occurredAt ? new Date(body.occurredAt) : existing.occurredAt,
        foodType: body.foodType ?? existing.foodType,
        amount:
          body.amount != null ? Number(body.amount) : existing.amount,
        unit: body.unit ?? existing.unit,
        weightKg:
          body.weightKg === '' || body.weightKg == null
            ? null
            : Number(body.weightKg),
        notes: body.notes ?? existing.notes,
        babyId: body.babyId ?? existing.babyId,
      },
    })

    return NextResponse.json({ success: true, updated })
  } catch (err) {
    console.error('PUT /baby-logs/[id] error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * DELETE /api/baby-logs/[id]
 * Dzēš konkrētu bērna ierakstu
 */
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id

    // Pārbaudām, vai lietotājam pieder šis ieraksts
    const existing = await prisma.babyLog.findFirst({
      where: { id: params.id, userId },
    })
    if (!existing)
      return NextResponse.json({ error: 'Not found or not allowed' }, { status: 404 })

    await prisma.babyLog.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /baby-logs/[id] error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
