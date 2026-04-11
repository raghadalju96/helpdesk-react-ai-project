import 'dotenv/config'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import prisma from '../src/db'
import { Role } from "../src/generated/prisma/client";

// Seed-only auth instance — signup enabled so we can create the admin user
const seedAuth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true },
})

async function main() {
  const email = process.env.ADMIN_EMAIL!
  const password = process.env.ADMIN_PASSWORD!

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env')
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log('Admin user already exists, skipping.')
    return
  }

  const result = await seedAuth.api.signUpEmail({
    body: { email, password, name: 'Admin' },
  })

  await prisma.user.update({
    where: { id: result.user.id },
    data: { role: Role.admin },
  })

  console.log(`Admin user created: ${email}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
