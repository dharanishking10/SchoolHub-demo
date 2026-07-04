import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('CHELLAMPALAYAM', 12)

  const headmaster = await prisma.user.upsert({
    where: { username: 'GOVT_MODEL_HM' },
    update: {},
    create: {
      username: 'GOVT_MODEL_HM',
      password: hashedPassword,
      role: 'HEADMASTER',
      name: 'Headmaster',
      email: 'headmaster@edugov.edu',
    },
  })

  console.log('✅ Seeded headmaster:', headmaster.username)
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
