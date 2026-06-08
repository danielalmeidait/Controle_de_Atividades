import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Procurando por tarefas envolvendo 'Jornada'...");
    const tasks = await prisma.task.findMany({
        where: {
            OR: [
                { name: { contains: 'Jornada' } },
                { description: { contains: 'Jornada' } }
            ]
        }
    });

    console.log(`Encontrei ${tasks.length} tarefa(s):`);
    console.log(JSON.stringify(tasks, null, 2));
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
