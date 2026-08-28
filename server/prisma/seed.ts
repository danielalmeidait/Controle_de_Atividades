import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const themes = ['Automações', 'UX', 'IA', 'Dados', 'Desenvolvimento']
  const systems = ['SGP', 'COCKPIT', 'BPM', 'CRM']
  const taskTypes = ['Inovação', 'Implantação', 'Melhoria', 'Correção']
  const taskStatuses = ['A definir', 'Em andamento', 'Concluído']
  const businessAreas: { name: string; responsible: string }[] = [
    { name: 'Financeiro', responsible: '' },
    { name: 'Comercial', responsible: '' },
    { name: 'TI', responsible: '' },
  ]

  // --- DATABASE SAFETY LOCK ---
  // AVISO: Removida a limpeza automática (deleteMany) para preservar dados do usuário.
  // O script agora apenas garante a existência dos dados básicos (upsert).
  // ----------------------------

  console.log('Verificando Tabelas de Referência...')

  for (const name of themes) {
    await prisma.theme.upsert({
      where: { name },
      update: {},
      create: { name }
    })
  }

  for (const name of systems) {
    await prisma.system.upsert({
      where: { name },
      update: {},
      create: { name }
    })
  }

  for (const name of taskTypes) {
    await prisma.taskType.upsert({
      where: { name },
      update: {},
      create: { name }
    })
  }

  for (const name of taskStatuses) {
    await prisma.taskStatus.upsert({
      where: { name },
      update: {},
      create: { name }
    })
  }

  for (const area of businessAreas) {
    await prisma.businessArea.upsert({
      where: { name: area.name },
      update: {},
      create: area
    })
  }

  // Se já houver tarefas no banco, não rodar o seed de tarefas para evitar duplicidade ou confusão
  const existingTasksCount = await prisma.task.count()

  if (existingTasksCount === 0) {
    console.log('Banco vazio. Aguardando cadastros do usuário.')
  } else {
    console.log(`Banco já contém ${existingTasksCount} tarefas. Pulando seed de tarefas.`)
  }

  console.log('Tabelas de referência garantidas com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
