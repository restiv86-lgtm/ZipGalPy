import { getPrisma } from "../src/lib/prisma";
const prisma=getPrisma();
const [users,homes,repairs,schedules]=await Promise.all([prisma.user.count(),prisma.home.count(),prisma.homeRepair.count(),prisma.homeSchedule.count()]);
console.log(JSON.stringify({users,homes,repairs,schedules}));
await prisma.$disconnect();
