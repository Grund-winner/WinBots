import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(process.env.NODE_ENV === 'production' 
      ? { log: ['error'] }
      : { log: ['query', 'error'] }
    ),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
