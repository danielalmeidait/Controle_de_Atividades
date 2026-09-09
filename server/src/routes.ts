import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

const router = Router();
const prisma = new PrismaClient();

const STALE_TASK_THRESHOLD_DAYS = 5;

const DONE_PATTERNS = ['concluí', 'concluido', 'done', 'fim', 'finaliz', 'encerr', 'completo'];
const WIP_PATTERNS  = ['andamento', 'wip', 'fazendo', 'progress', 'execut'];

const ALLOWED_BACKUP_SCRIPTS: Record<string, string> = {
    full:        'backup:full',
    incremental: 'backup:incremental',
};

function normalizeStr(s: string): string {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function isTaskDone(status: string): boolean {
    if (!status) return false;
    const s = normalizeStr(status);
    return DONE_PATTERNS.some(p => s.includes(p));
}

function isTaskWip(status: string): boolean {
    if (!status) return false;
    const s = normalizeStr(status);
    return WIP_PATTERNS.some(p => s.includes(p));
}

function parseTask(task: any) {
    return {
        ...task,
        checklist:     JSON.parse(task.checklist     || '[]'),
        updateHistory: JSON.parse(task.updateHistory || '[]'),
    };
}

// --- Tasks ---

router.get('/tasks', async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({ orderBy: { id: 'desc' } });
        res.json(tasks.map(parseTask));
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar tarefas' });
    }
});

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

router.post('/tasks', async (req, res) => {
    try {
        const {
            name, type, theme, system, requester, responsible, criticality, status,
            deadline, requestDate, requestingArea, checklist, description, lastUpdate, initiativeId,
            isHighlight, highlightColor,
        } = req.body;

        if (!name || !type || !theme || !system || !requester || !criticality || !status) {
            return res.status(400).json({ error: 'Campos obrigatórios: name, type, theme, system, requester, criticality, status.' });
        }

        const newTask = await prisma.task.create({
            data: {
                name,
                type,
                theme,
                system,
                requester,
                responsible:   responsible ?? null,
                criticality,
                status,
                deadline:      deadline ? new Date(deadline) : null,
                requestDate:   requestDate ? new Date(requestDate) : new Date(),
                requestingArea: requestingArea ?? '',
                description:   description   ?? '',
                lastUpdate:    lastUpdate    ?? '',
                initiativeId:  initiativeId ?? null,
                checklist:     JSON.stringify(checklist || []),
                updateHistory: JSON.stringify([]),
                isHighlight:   isHighlight === true || isHighlight === 'true',
                highlightColor: highlightColor ?? null,
            }
        });
        res.status(201).json(parseTask(newTask));
    } catch (error) {
        console.error('[POST /tasks]', error);
        const msg = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: msg });
    }
});

router.put('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const existing = await prisma.task.findUnique({ where: { id: parseInt(id) } });
        if (!existing) return res.status(404).json({ error: 'Tarefa não encontrada' });

        const {
            name, type, theme, system, requester, responsible, criticality, status,
            deadline, requestingArea, description, lastUpdate, checklist, initiativeId,
            isHighlight, highlightColor,
        } = req.body;

        let history: { date: string; text: string }[] = [];
        try { history = JSON.parse(existing.updateHistory || '[]'); } catch { }

        if (lastUpdate && lastUpdate !== existing.lastUpdate) {
            history.unshift({ date: new Date().toISOString(), text: lastUpdate });
        }

        const updatedTask = await prisma.task.update({
            where: { id: parseInt(id) },
            data: {
                name:          name          ?? existing.name,
                type:          type          ?? existing.type,
                theme:         theme         ?? existing.theme,
                system:        system        ?? existing.system,
                requester:     requester     ?? existing.requester,
                responsible:   responsible !== undefined ? responsible : existing.responsible,
                criticality:   criticality   ?? existing.criticality,
                status:        status        ?? existing.status,
                deadline:      deadline !== undefined ? (deadline ? new Date(deadline) : null) : existing.deadline,
                requestingArea: requestingArea ?? existing.requestingArea,
                description:   description   ?? existing.description,
                lastUpdate:    lastUpdate    ?? existing.lastUpdate,
                initiativeId:  initiativeId !== undefined ? initiativeId : existing.initiativeId,
                checklist:     checklist ? JSON.stringify(checklist) : existing.checklist,
                updateHistory: JSON.stringify(history),
                isHighlight:   isHighlight !== undefined ? (isHighlight === true || isHighlight === 'true') : existing.isHighlight,
                highlightColor: highlightColor !== undefined ? highlightColor : existing.highlightColor,
                updatedAt:     new Date(),
            }
        });
        res.json(parseTask(updatedTask));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar tarefa' });
    }
});

router.delete('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.task.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Tarefa deletada' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar tarefa' });
    }
});

// --- Temas (Antigas Áreas) ---

router.get('/themes', async (req, res) => {
    try {
        const [themes, tasks] = await Promise.all([
            prisma.theme.findMany({ orderBy: { name: 'asc' } }),
            prisma.task.findMany({ select: { theme: true, status: true } }),
        ]);
        const result = themes.map(theme => ({
            ...theme,
            taskCount:       tasks.filter(t => t.theme === theme.name).length,
            inProgressCount: tasks.filter(t => t.theme === theme.name && !isTaskDone(t.status)).length,
        }));
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar temas' });
    }
});

router.post('/themes', async (req, res) => {
    try {
        const newTheme = await prisma.theme.create({ data: { name: req.body.name } });
        res.status(201).json({ ...newTheme, taskCount: 0, inProgressCount: 0 });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar tema' });
    }
});

router.put('/themes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const updatedTheme = await prisma.theme.update({
            where: { id: parseInt(id) },
            data: { name: req.body.name }
        });
        res.json(updatedTheme);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar tema' });
    }
});

router.delete('/themes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.theme.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Tema deletado' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar tema' });
    }
});

// --- Sistemas ---

router.get('/systems', async (req, res) => {
    try {
        const [systems, tasks] = await Promise.all([
            prisma.system.findMany({ orderBy: { name: 'asc' } }),
            prisma.task.findMany({ select: { system: true, status: true } }),
        ]);
        const result = systems.map(system => ({
            ...system,
            taskCount:       tasks.filter(t => t.system === system.name).length,
            inProgressCount: tasks.filter(t => t.system === system.name && !isTaskDone(t.status)).length,
        }));
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar sistemas' });
    }
});

router.post('/systems', async (req, res) => {
    try {
        const newSystem = await prisma.system.create({ data: { name: req.body.name } });
        res.status(201).json({ ...newSystem, taskCount: 0, inProgressCount: 0 });
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
        res.json(updatedSystem);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar sistema' });
    }
});

router.delete('/systems/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.system.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Sistema deletado' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar sistema' });
    }
});

// --- Tipos de Atividade ---

router.get('/task-types', async (req, res) => {
    try {
        const [types, tasks] = await Promise.all([
            prisma.taskType.findMany({ orderBy: { name: 'asc' } }),
            prisma.task.findMany({ select: { type: true, status: true } }),
        ]);
        const result = types.map(t => ({
            ...t,
            taskCount:       tasks.filter(tk => tk.type === t.name).length,
            inProgressCount: tasks.filter(tk => tk.type === t.name && !isTaskDone(tk.status)).length,
        }));
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar tipos' });
    }
});

router.post('/task-types', async (req, res) => {
    try {
        const newType = await prisma.taskType.create({ data: { name: req.body.name } });
        res.status(201).json({ ...newType, taskCount: 0, inProgressCount: 0 });
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
        res.json(updatedType);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar tipo' });
    }
});

router.delete('/task-types/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.taskType.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Tipo deletado' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar tipo' });
    }
});

// --- Status de Atividades ---

router.get('/task-statuses', async (req, res) => {
    try {
        const [statuses, tasks] = await Promise.all([
            prisma.taskStatus.findMany({ orderBy: { name: 'asc' } }),
            prisma.task.findMany({ select: { status: true } }),
        ]);
        const result = statuses.map(s => ({
            ...s,
            taskCount:       tasks.filter(t => t.status === s.name).length,
            inProgressCount: tasks.filter(t => t.status === s.name && !isTaskDone(t.status)).length,
        }));
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar status' });
    }
});

router.post('/task-statuses', async (req, res) => {
    try {
        const newStatus = await prisma.taskStatus.create({ data: { name: req.body.name } });
        res.status(201).json({ ...newStatus, taskCount: 0, inProgressCount: 0 });
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
        res.json(updatedStatus);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
});

router.delete('/task-statuses/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.taskStatus.delete({ where: { id: parseInt(id) } });
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
                title:         req.body.title,
                content:       req.body.content       || '',
                reviewDate:    req.body.reviewDate    || null,
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
                title:         req.body.title,
                content:       req.body.content,
                reviewDate:    req.body.reviewDate    || null,
                relatedTaskId: req.body.relatedTaskId || null,
                relatedSystem: req.body.relatedSystem || null,
                updatedAt:     new Date()
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

// --- Stats ---

router.get('/stats', async (req, res) => {
    try {
        const [tasks, themes, systems, taskTypes, taskStatuses] = await Promise.all([
            prisma.task.findMany(),
            prisma.theme.findMany(),
            prisma.system.findMany(),
            prisma.taskType.findMany(),
            prisma.taskStatus.findMany(),
        ]);

        const threshold = new Date();
        threshold.setDate(threshold.getDate() - STALE_TASK_THRESHOLD_DAYS);

        const staleTasks = tasks
            .filter(t => !isTaskDone(t.status) && new Date(t.updatedAt) < threshold)
            .map(t => ({ id: t.id, name: t.name, updatedAt: t.updatedAt }));

        const themesWithCounts = themes.map(theme => ({
            ...theme,
            taskCount:       tasks.filter(t => t.theme === theme.name).length,
            inProgressCount: tasks.filter(t => t.theme === theme.name && !isTaskDone(t.status)).length,
        }));

        const systemsWithCounts = systems.map(system => ({
            ...system,
            taskCount:       tasks.filter(t => t.system === system.name).length,
            inProgressCount: tasks.filter(t => t.system === system.name && !isTaskDone(t.status)).length,
        }));

        res.json({
            themes:      themesWithCounts,
            systems:    systemsWithCounts,
            taskTypes,
            taskStatuses,
            totalTasks: tasks.length,
            wipTasks:   tasks.filter(t => isTaskWip(t.status)).length,
            doneTasks:  tasks.filter(t => isTaskDone(t.status)).length,
            staleTasks,
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao calcular estatísticas' });
    }
});

// --- System Status ---

router.get('/system/status', async (req, res) => {
    try {
        const recentUpdates = await prisma.task.findMany({
            orderBy: { updatedAt: 'desc' },
            take: 10,
            select: {
                id: true, name: true, status: true,
                lastUpdate: true, updatedAt: true, theme: true, requester: true,
            }
        });
        res.json({ status: 'online', recentUpdates });
    } catch (error) {
        res.status(500).json({ status: 'offline', recentUpdates: [] });
    }
});

// --- Backup ---

router.post('/backup/run', (req, res) => {
    const { type } = req.body;
    const script = ALLOWED_BACKUP_SCRIPTS[type];
    if (!script) {
        return res.status(400).json({ error: 'Tipo inválido. Use "full" ou "incremental".' });
    }

    const serverRoot = path.resolve(__dirname, '../..');
    const child = spawn('npm', ['run', script], { cwd: serverRoot, shell: true });

    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (data: Buffer) => { stdout += data.toString(); });
    child.stderr?.on('data', (data: Buffer) => { stderr += data.toString(); });

    child.on('close', (code: number) => {
        if (code !== 0) {
            return res.status(500).json({ error: stderr || 'Backup falhou', output: stdout });
        }
        res.json({ success: true, output: stdout });
    });
});

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
            lastFullBackup:        getLatestFile(fullDir),
            lastIncrementalBackup: getLatestFile(incDir),
            fullCount:             countFiles(fullDir),
            incrementalCount:      countFiles(incDir),
            recentLogs,
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar status de backup' });
    }
});
// --- Iniciativas / Projetos (mesma tabela, discriminada por `kind`) ---

// Garante a regra: projeto nunca tem pai; kind sempre válido.
function sanitizeInitiative(body: any) {
    const data = { ...body };
    if (data.kind !== undefined && data.kind !== 'project' && data.kind !== 'initiative') {
        data.kind = 'initiative';
    }
    if (data.kind === 'project') {
        data.parentId = null;
    } else if (data.parentId !== undefined && data.parentId !== null) {
        data.parentId = Number(data.parentId);
    }
    if (data.isHighlight !== undefined) {
        data.isHighlight = data.isHighlight === true || data.isHighlight === 'true';
    }
    if (data.highlightColor !== undefined && data.highlightColor !== null) {
        data.highlightColor = String(data.highlightColor) || null;
    }
    return data;
}

router.get('/initiatives', async (req, res) => {
    try {
        const { kind, parentId } = req.query;
        const where: any = {};
        if (kind) where.kind = String(kind);
        if (parentId !== undefined) where.parentId = parentId === 'null' ? null : Number(parentId);
        const initiatives = await prisma.initiative.findMany({ where, orderBy: [{ position: 'asc' }, { id: 'desc' }] });
        res.json(initiatives);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar iniciativas' });
    }
});

router.post('/initiatives', async (req, res) => {
    try {
        const newInitiative = await prisma.initiative.create({ data: sanitizeInitiative(req.body) });
        res.status(201).json(newInitiative);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar iniciativa' });
    }
});

router.put('/initiatives/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const updatedInitiative = await prisma.initiative.update({
            where: { id: parseInt(id) },
            data: sanitizeInitiative(req.body)
        });
        res.json(updatedInitiative);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar iniciativa' });
    }
});

// Promove uma iniciativa a projeto (item 2): vira raiz da hierarquia.
router.patch('/initiatives/:id/promote', async (req, res) => {
    const { id } = req.params;
    try {
        const promoted = await prisma.initiative.update({
            where: { id: parseInt(id) },
            data: { kind: 'project', parentId: null },
        });
        res.json(promoted);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao promover iniciativa a projeto' });
    }
});

router.delete('/initiatives/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.initiative.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Iniciativa deletada' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar iniciativa' });
    }
});

// --- Entregas ---
router.get('/deliveries', async (req, res) => {
    try {
        const deliveries = await prisma.delivery.findMany();
        res.json(deliveries);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar entregas' });
    }
});

router.post('/deliveries', async (req, res) => {
    try {
        const newDelivery = await prisma.delivery.create({ data: req.body });
        res.status(201).json(newDelivery);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar entrega' });
    }
});

router.put('/deliveries/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const updatedDelivery = await prisma.delivery.update({
            where: { id: parseInt(id) },
            data: req.body
        });
        res.json(updatedDelivery);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar entrega' });
    }
});

router.delete('/deliveries/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.delivery.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Entrega deletada' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar entrega' });
    }
});

// --- Áreas de Negócio (com responsável) ---
router.get('/business-areas', async (req, res) => {
    try {
        const areas = await prisma.businessArea.findMany({ orderBy: { name: 'asc' } });
        res.json(areas);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar áreas de negócio' });
    }
});

router.post('/business-areas', async (req, res) => {
    try {
        const { name, responsible } = req.body;
        if (!name) return res.status(400).json({ error: 'Campo obrigatório: name.' });
        const area = await prisma.businessArea.create({ data: { name, responsible: responsible ?? '' } });
        res.status(201).json(area);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar área de negócio' });
    }
});

router.put('/business-areas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { name, responsible } = req.body;
        const area = await prisma.businessArea.update({
            where: { id: parseInt(id) },
            data: {
                ...(name !== undefined ? { name } : {}),
                ...(responsible !== undefined ? { responsible } : {}),
            },
        });
        res.json(area);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar área de negócio' });
    }
});

router.delete('/business-areas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.businessArea.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Área de negócio deletada' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar área de negócio' });
    }
});

// --- Responsáveis ---
router.get('/responsibles', async (req, res) => {
    try {
        const responsibles = await prisma.responsible.findMany({ orderBy: { name: 'asc' } });
        res.json(responsibles);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar responsáveis' });
    }
});

router.post('/responsibles', async (req, res) => {
    try {
        const { name, email, active } = req.body;
        if (!name) return res.status(400).json({ error: 'Campo obrigatório: name.' });
        const responsible = await prisma.responsible.create({
            data: { name, email: email ?? null, active: active !== false },
        });
        res.status(201).json(responsible);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar responsável' });
    }
});

router.put('/responsibles/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { name, email, active } = req.body;
        const responsible = await prisma.responsible.update({
            where: { id: parseInt(id) },
            data: {
                ...(name !== undefined ? { name } : {}),
                ...(email !== undefined ? { email } : {}),
                ...(active !== undefined ? { active } : {}),
                updatedAt: new Date(),
            },
        });
        res.json(responsible);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar responsável' });
    }
});

router.delete('/responsibles/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.responsible.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Responsável deletado' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar responsável' });
    }
});

export default router;
