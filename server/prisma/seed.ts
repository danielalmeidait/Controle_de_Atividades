import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const areas = ['Automações', 'UX', 'IA', 'Dados', 'Desenvolvimento']
  const systems = ['SGP', 'COCKPIT', 'BPM', 'CRM']
  const taskTypes = ['Inovação', 'Implantação', 'Melhoria', 'Correção']
  const taskStatuses = ['TBD', 'WIP', 'Done']

  // --- DATABASE SAFETY LOCK ---
  // AVISO: Removida a limpeza automática (deleteMany) para preservar dados do usuário.
  // O script agora apenas garante a existência dos dados básicos (upsert).
  // ----------------------------

  console.log('Verificando Tabelas de Referência...')

  for (const name of areas) {
    await prisma.area.upsert({
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

  // Se já houver tarefas no banco, não rodar o seed de tarefas para evitar duplicidade ou confusão
  const existingTasksCount = await prisma.task.count()

  if (existingTasksCount === 0) {
    console.log('Banco vazio. Aguardando cadastros do usuário.')
  } else {
    console.log(`Banco já contém ${existingTasksCount} tarefas. Pulando seed de tarefas.`)
  }

  // Atualizar contadores
  console.log('Sincronizando contadores...')
  const allTasks = await prisma.task.findMany()
  const allAreas = await prisma.area.findMany()
  const allSystems = await prisma.system.findMany()
  const allTypes = await prisma.taskType.findMany()
  const allStatuses = await prisma.taskStatus.findMany()

  for (const a of allAreas) {
    const tCount = allTasks.filter(t => t.area === a.name).length
    const pCount = allTasks.filter(t => t.area === a.name && t.status !== 'Done').length
    await prisma.area.update({ where: { id: a.id }, data: { taskCount: tCount, inProgressCount: pCount } })
  }
  for (const s of allSystems) {
    const tCount = allTasks.filter(t => t.system === s.name).length
    const pCount = allTasks.filter(t => t.system === s.name && t.status !== 'Done').length
    await prisma.system.update({ where: { id: s.id }, data: { taskCount: tCount, inProgressCount: pCount } })
  }
  for (const tType of allTypes) {
    const tCount = allTasks.filter(t => t.type === tType.name).length
    const pCount = allTasks.filter(t => t.type === tType.name && t.status !== 'Done').length
    await prisma.taskType.update({ where: { id: tType.id }, data: { taskCount: tCount, inProgressCount: pCount } })
  }
  for (const sStatus of allStatuses) {
    const tCount = allTasks.filter(t => t.status === sStatus.name).length
    const pCount = allTasks.filter(t => t.status === sStatus.name && t.status !== 'Done').length
    await prisma.taskStatus.update({ where: { id: sStatus.id }, data: { taskCount: tCount, inProgressCount: pCount } })
  }

  console.log('Sincronização concluída com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
