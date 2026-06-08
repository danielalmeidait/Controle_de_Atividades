import { Task, Area, System } from './types';

export const MOCK_AREAS: Area[] = [
  { id: 1, name: 'IA', taskCount: 10, inProgressCount: 4 },
  { id: 2, name: 'UX', taskCount: 17, inProgressCount: 7 },
  { id: 3, name: 'CX', taskCount: 17, inProgressCount: 9 },
  { id: 4, name: 'Automações', taskCount: 17, inProgressCount: 9 },
  { id: 5, name: 'Onboarding', taskCount: 17, inProgressCount: 9 },
  { id: 6, name: 'Reports', taskCount: 17, inProgressCount: 9 },
];

export const MOCK_SYSTEMS: System[] = [
  { id: 1, name: 'SGP', taskCount: 10, inProgressCount: 4 },
  { id: 2, name: 'MODOS', taskCount: 17, inProgressCount: 7 },
  { id: 3, name: 'COCKPIT', taskCount: 17, inProgressCount: 9 },
  { id: 4, name: 'MODOSWEB', taskCount: 17, inProgressCount: 9 },
  { id: 5, name: 'FULLFILMT', taskCount: 17, inProgressCount: 9 },
  { id: 6, name: 'SGTA', taskCount: 17, inProgressCount: 9 },
  { id: 7, name: 'SISTEMA X', taskCount: 5, inProgressCount: 2 },
  { id: 8, name: 'SISTEMA Y', taskCount: 12, inProgressCount: 5 },
];

export const MOCK_TASKS: Task[] = [
  {
    id: 1,
    name: 'RPA ITP',
    type: 'Implantação',
    area: 'Automações',
    system: 'SGP',
    requester: 'Gisele',
    criticality: 'Alta',
    status: 'WIP',
    deadline: '2026-03-10',
    requestDate: '2026-03-01',
    checklist: [
      { text: 'Mapeamento de processo', done: false, deadline: '' },
      { text: 'Desenvolvimento', done: false, deadline: '' },
      { text: 'Testes', done: false, deadline: '' },
    ],
    lastUpdate: 'Aguardando validação do ambiente de homologação.',
    updateHistory: [],
    description: 'Eu como gestor preciso automatizar o processo ITP para reduzir erros manuais.',
    requestingArea: 'Financeiro',
  },
  {
    id: 2,
    name: "Road Show com P.O's",
    type: 'Inovação',
    area: 'UX',
    system: 'COCKPIT',
    requester: 'Leandro Rosseto',
    criticality: 'Média',
    status: 'Done',
    deadline: '2026-03-05',
    requestDate: '2026-02-15',
    checklist: [
      { text: 'Preparar deck', done: true, deadline: '' },
      { text: 'Agendar salas', done: true, deadline: '' },
      { text: 'Coletar feedbacks', done: true, deadline: '' },
    ],
    lastUpdate: 'Concluído com sucesso. Feedbacks positivos.',
    updateHistory: [],
    description: "Eu como PDM preciso alinhar as expectativas dos P.O's para garantir a entrega de valor.",
    requestingArea: 'Comercial',
  },
  {
    id: 3,
    name: 'Eficiência das integrações (SGP)',
    type: 'Melhoria',
    area: 'IA',
    system: 'SGP',
    requester: 'Ana Flávia',
    criticality: 'Alta',
    status: 'WIP',
    deadline: '2026-03-12',
    requestDate: '2026-03-02',
    checklist: [
      { text: 'Análise de latência', done: false, deadline: '' },
      { text: 'Refatoração de endpoints', done: false, deadline: '' },
    ],
    lastUpdate: 'Em andamento. Identificado gargalo no banco de dados.',
    updateHistory: [],
    description: 'Eu como desenvolvedor preciso otimizar as integrações para melhorar o tempo de resposta.',
    requestingArea: 'TI',
  }
];
