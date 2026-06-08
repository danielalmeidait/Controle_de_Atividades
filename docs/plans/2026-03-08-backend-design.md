# Design do Back-end - Activities_Control

## Visão Geral
Criação de um servidor API robusto para persistência de dados do dashboard de atividades, utilizando Node.js, Express e Prisma ORM com SQLite.

## Arquitetura
- **Linguagem**: TypeScript
- **Runtime**: Node.js
- **Framework Web**: Express.js
- **Banco de Dados**: SQLite (escolhido pela simplicidade local e portabilidade)
- **ORM**: Prisma (escolhido pela facilidade de migração futura para MySQL/PostgreSQL)

## Modelo de Dados (Prisma Schema)

```prisma
model Task {
  id          String   @id @default(uuid())
  name        String
  type        String   // Inovação, Implantação, Melhoria, Correção
  area        String
  system      String
  requester   String
  criticality String   // Baixa, Média, Alta
  status      String   // TBD, WIP, Done
  deadline    DateTime
  requestDate DateTime @default(now())
  checklist   String   // JSON string
  lastUpdate  String
  description String
}
```

## Endpoints da API
- `GET /api/tasks`: Listagem de todas as tarefas.
- `GET /api/tasks/:id`: Detalhes de uma tarefa específica.
- `POST /api/tasks`: Criação de nova tarefa.
- `PUT /api/tasks/:id`: Atualização de dados/status.
- `DELETE /api/tasks/:id`: Remoção de tarefa.
- `GET /api/stats`: Agregados para os cards do dashboard e gráficos.

## Estratégia de Migração de Dados
1. Criar script de seed para importar os dados atuais do `constants.ts` para o SQLite.
2. Atualizar o frontend para consumir a API via `fetch`.
