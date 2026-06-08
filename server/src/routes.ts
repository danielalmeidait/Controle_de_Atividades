import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();
const prisma = new PrismaClient();

// Helper para atualizar contadores de Áreas e Sistemas
async function updateCounters() {
    const tasks = await prisma.task.findMany();
    const areas = await prisma.area.findMany();
    const systems = await prisma.system.findMany();

    for (const area of areas) {
        const areaTasks = tasks.filter(t => t.area === area.name);
        await prisma.area.update({
            where: { id: area.id },
            data: {
                taskCount: areaTasks.length,
                inProgressCount: areaTasks.filter(t => !isTaskDone(t.status)).length
            }
        });
    }

    for (const system of systems) {
        const systemTasks = tasks.filter(t => t.system === system.name);
        await prisma.system.update({
            where: { id: system.id },
            data: {
                taskCount: systemTasks.length,
                inProgressCount: systemTasks.filter(t => !isTaskDone(t.status)).length
            }
        });
    }
}

// Helper para parsear campos JSON de uma tarefa
function parseTask(task: any) {
    return {
        ...task,
        checklist: JSON.parse(task.checklist || '[]'),
        updateHistory: JSON.parse(task.updateHistory || '[]'),
    };
}

function isTaskDone(status: string) {
    if (!status) return false;
    const s = status.toLowerCase();
    return s.includes('concluí') || s.includes('done') || s.includes('fim');
}

function isTaskWip(status: string) {
    if (!status) return false;
    const s = status.toLowerCase();
    return s.includes('andamento') || s.includes('wip') || s.includes('fazendo');
}

// GET /api/tasks - Listar todas as tarefas
router.get('/tasks', async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({ orderBy: { id: 'desc' } });
        res.json(tasks.map(parseTask));
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar tarefas' });
    }
});

// GET /api/tasks/:id - Buscar tarefa por ID
router.get('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const task = await prisma.task.findUnique({ where: { id: parseInt(id) } });
        if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });
        res.json(parseTask(task));
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar tarefa' });
    }
});

// POST /api/tasks - Criar nova tarefa
router.post('/tasks', async (req, res) => {
    try {
        const newTask = await prisma.task.create({
            data: {
                ...req.body,
                checklist: JSON.stringify(req.body.checklist || []),
                updateHistory: JSON.stringify([]),
                requestDate: req.body.requestDate || new Date().toISOString()
            }
        });
        await updateCounters();
        res.status(201).json(parseTask(newTask));
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar tarefa' });
    }
});

// PUT /api/tasks/:id - Editar tarefa (appends lastUpdate to history if changed)
router.put('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const existing = await prisma.task.findUnique({ where: { id: parseInt(id) } });
        if (!existing) return res.status(404).json({ error: 'Tarefa não encontrada' });

        // Build updated history
        let history: { date: string; text: string }[] = [];
        try { history = JSON.parse(existing.updateHistory || '[]'); } catch { }

        const newLastUpdate = req.body.lastUpdate;
        if (newLastUpdate && newLastUpdate !== existing.lastUpdate) {
            history.unshift({
                date: new Date().toISOString(),
                text: newLastUpdate
            });
        }

        const updatedTask = await prisma.task.update({
            where: { id: parseInt(id) },
            data: {
                ...req.body,
                checklist: req.body.checklist ? JSON.stringify(req.body.checklist) : existing.checklist,
                updateHistory: JSON.stringify(history),
                updatedAt: new Date()
            }
        });
        await updateCounters();
        res.json(parseTask(updatedTask));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar tarefa' });
    }
});

// DELETE /api/tasks/:id - Deletar tarefa
router.delete('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.task.delete({ where: { id: parseInt(id) } });
        await updateCounters();
        res.json({ message: 'Tarefa deletada' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar tarefa' });
    }
});

// --- Áreas ---
router.get('/areas', async (req, res) => {
    try {
        const areas = await prisma.area.findMany({ orderBy: { name: 'asc' } });
        res.json(areas);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar áreas' });
    }
});

router.post('/areas', async (req, res) => {
    try {
        const newArea = await prisma.area.create({ data: { name: req.body.name } });
        await updateCounters();
        res.status(201).json(newArea);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar área' });
    }
});

router.put('/areas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const updatedArea = await prisma.area.update({
            where: { id: parseInt(id) },
            data: { name: req.body.name }
        });
        await updateCounters();
        res.json(updatedArea);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar área' });
    }
});

router.delete('/areas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.area.delete({ where: { id: parseInt(id) } });
        await updateCounters();
        res.json({ message: 'Área deletada' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar área' });
    }
});

// --- Sistemas ---
router.get('/systems', async (req, res) => {
    try {
        const systems = await prisma.system.findMany({ orderBy: { name: 'asc' } });
        res.json(systems);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar sistemas' });
    }
});

router.post('/systems', async (req, res) => {
    try {
        const newSystem = await prisma.system.create({ data: { name: req.body.name } });
        await updateCounters();
        res.status(201).json(newSystem);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar sistema' });
    }
});

router.put('/systems/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const updatedSystem = await prisma.system.update({
            where: { id: parseInt(id) },
            data: { name: req.body.name }
        });
        await updateCounters();
        res.json(updatedSystem);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar sistema' });
    }
});

router.delete('/systems/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.system.delete({ where: { id: parseInt(id) } });
        await updateCounters();
        res.json({ message: 'Sistema deletado' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar sistema' });
    }
});

// --- Tipos de Atividade ---
router.get('/task-types', async (req, res) => {
    try {
        const types = await prisma.taskType.findMany({ orderBy: { name: 'asc' } });
        res.json(types);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar tipos' });
    }
});

router.post('/task-types', async (req, res) => {
    try {
        const newType = await prisma.taskType.create({ data: { name: req.body.name } });
        await updateCounters();
        res.status(201).json(newType);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar tipo' });
    }
});

router.put('/task-types/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const updatedType = await prisma.taskType.update({
            where: { id: parseInt(id) },
            data: { name: req.body.name }
        });
        await updateCounters();
        res.json(updatedType);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar tipo' });
    }
});

router.delete('/task-types/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.taskType.delete({ where: { id: parseInt(id) } });
        await updateCounters();
        res.json({ message: 'Tipo deletado' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar tipo' });
    }
});

// --- Status de Atividades ---
router.get('/task-statuses', async (req, res) => {
    try {
        const statuses = await prisma.taskStatus.findMany({ orderBy: { name: 'asc' } });
        res.json(statuses);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar status' });
    }
});

router.post('/task-statuses', async (req, res) => {
    try {
        const newStatus = await prisma.taskStatus.create({ data: { name: req.body.name } });
        await updateCounters();
        res.status(201).json(newStatus);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar status' });
    }
});

router.put('/task-statuses/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const updatedStatus = await prisma.taskStatus.update({
            where: { id: parseInt(id) },
            data: { name: req.body.name }
        });
        await updateCounters();
        res.json(updatedStatus);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
});

router.delete('/task-statuses/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.taskStatus.delete({ where: { id: parseInt(id) } });
        await updateCounters();
        res.json({ message: 'Status deletado' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar status' });
    }
});

// --- Ideias (Segundo Cérebro) ---
router.get('/ideas', async (req, res) => {
    try {
        const ideas = await prisma.idea.findMany({ orderBy: [{ reviewDate: 'asc' }, { createdAt: 'desc' }] });
        res.json(ideas);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar ideias' });
    }
});

router.post('/ideas', async (req, res) => {
    try {
        const idea = await prisma.idea.create({
            data: {
                title: req.body.title,
                content: req.body.content || '',
                reviewDate: req.body.reviewDate || null,
                relatedTaskId: req.body.relatedTaskId || null,
                relatedSystem: req.body.relatedSystem || null,
            }
        });
        res.status(201).json(idea);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar ideia' });
    }
});

router.put('/ideas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const idea = await prisma.idea.update({
            where: { id: parseInt(id) },
            data: {
                title: req.body.title,
                content: req.body.content,
                reviewDate: req.body.reviewDate || null,
                relatedTaskId: req.body.relatedTaskId || null,
                relatedSystem: req.body.relatedSystem || null,
                updatedAt: new Date()
            }
        });
        res.json(idea);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar ideia' });
    }
});

router.delete('/ideas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.idea.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Ideia deletada' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar ideia' });
    }
});

// GET /api/stats - Estatísticas para o Dashboard
router.get('/stats', async (req, res) => {
    try {
        const tasks = await prisma.task.findMany();
        const areas = await prisma.area.findMany();
        const systems = await prisma.system.findMany();
        const taskTypes = await prisma.taskType.findMany();
        const taskStatuses = await prisma.taskStatus.findMany();

        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        const staleTasks = tasks
            .filter(t => !isTaskDone(t.status) && new Date(t.updatedAt) < fiveDaysAgo)
            .map(t => ({ id: t.id, name: t.name, updatedAt: t.updatedAt }));

        res.json({
            areas,
            systems,
            taskTypes,
            taskStatuses,
            totalTasks: tasks.length,
            wipTasks: tasks.filter(t => isTaskWip(t.status)).length,
            doneTasks: tasks.filter(t => isTaskDone(t.status)).length,
            staleTasks
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao calcular estatísticas' });
    }
});

// GET /api/system/status - Status do banco e últimas atualizações
router.get('/system/status', async (req, res) => {
    try {
        const recentUpdates = await prisma.task.findMany({
            orderBy: { updatedAt: 'desc' },
            take: 10,
            select: {
                id: true,
                name: true,
                status: true,
                lastUpdate: true,
                updatedAt: true,
                area: true,
                requester: true
            }
        });

        // Se a query funcionar, consideramos o banco online
        res.json({
            status: 'online',
            recentUpdates
        });
    } catch (error) {
        res.status(500).json({ status: 'offline', recentUpdates: [] });
    }
});

// POST /api/backup/run — dispara backup manual
router.post('/backup/run', (req, res) => {
    const { type } = req.body;
    if (type !== 'full' && type !== 'incremental') {
        return res.status(400).json({ error: 'Tipo inválido. Use "full" ou "incremental".' });
    }

    const { exec } = require('child_process');
    const serverRoot = path.resolve(__dirname, '../..');
    const command = `npm run backup:${type}`;

    exec(command, { cwd: serverRoot }, (error: any, stdout: string, stderr: string) => {
        if (error) {
            return res.status(500).json({ error: error.message, output: stderr || stdout });
        }
        res.json({ success: true, output: stdout });
    });
});

// GET /api/backup/status — status do sistema de backup
router.get('/backup/status', (req, res) => {
    try {
        const backupRoot = path.resolve(__dirname, '../../backups');
        const logFile    = path.join(backupRoot, 'backup.log');
        const fullDir    = path.join(backupRoot, 'full');
        const incDir     = path.join(backupRoot, 'incremental');

        const getLatestFile = (dir: string) => {
            if (!fs.existsSync(dir)) return null;
            const files = fs.readdirSync(dir)
                .filter(f => f.endsWith('.db'))
                .map(f => {
                    const stat = fs.statSync(path.join(dir, f));
                    return { name: f, size: stat.size, createdAt: stat.mtime.toISOString() };
                })
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return files[0] ?? null;
        };

        const countFiles = (dir: string) =>
            fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.db')).length : 0;

        const recentLogs: string[] = [];
        if (fs.existsSync(logFile)) {
            const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n').filter(Boolean);
            recentLogs.push(...lines.slice(-30).reverse());
        }

        res.json({
            lastFullBackup:          getLatestFile(fullDir),
            lastIncrementalBackup:   getLatestFile(incDir),
            fullCount:               countFiles(fullDir),
            incrementalCount:        countFiles(incDir),
            recentLogs
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar status de backup' });
    }
});

export default router;
