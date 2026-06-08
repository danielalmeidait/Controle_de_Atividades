import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const args = process.argv.slice(2);
const typeIndex = args.indexOf('--type');
const backupType = typeIndex !== -1 ? args[typeIndex + 1] : 'incremental';

const DB_PATH     = path.resolve(__dirname, '../prisma/dev.db');
const BACKUP_ROOT = path.resolve(__dirname, '../backups');
const FULL_DIR    = path.join(BACKUP_ROOT, 'full');
const INC_DIR     = path.join(BACKUP_ROOT, 'incremental');
const LOG_FILE    = path.join(BACKUP_ROOT, 'backup.log');
const RETENTION_DAYS = 60;

fs.mkdirSync(FULL_DIR, { recursive: true });
fs.mkdirSync(INC_DIR,  { recursive: true });

function log(message: string) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
}

function dateStr() {
  return new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').slice(0, 19);
}

function formatBytes(bytes: number) {
  return (bytes / 1024).toFixed(1) + ' KB';
}

function cleanup() {
  const cutoff = Date.now() - RETENTION_DAYS * 86_400_000;
  let deleted = 0;
  for (const dir of [FULL_DIR, INC_DIR]) {
    for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.db'))) {
      const fp = path.join(dir, file);
      if (fs.statSync(fp).mtimeMs < cutoff) {
        fs.unlinkSync(fp);
        deleted++;
        log(`CLEANUP | Apagado: ${file} (mais de ${RETENTION_DAYS} dias)`);
      }
    }
  }
  if (deleted === 0) log('CLEANUP | Nenhum arquivo antigo para apagar');
}

async function runBackup() {
  log(`START | Tipo: ${backupType}`);

  if (!fs.existsSync(DB_PATH)) {
    log('ERROR | Banco não encontrado: ' + DB_PATH);
    process.exit(1);
  }

  if (backupType === 'incremental') {
    const dbMtime = fs.statSync(DB_PATH).mtimeMs;
    const lastFile = fs.readdirSync(INC_DIR)
      .filter(f => f.endsWith('.db'))
      .map(f => fs.statSync(path.join(INC_DIR, f)).mtimeMs)
      .sort((a, b) => b - a)[0] ?? 0;

    if (dbMtime <= lastFile) {
      log('SKIP | Sem alterações desde o último backup incremental');
      cleanup();
      log('DONE');
      return;
    }
  }

  const destDir  = backupType === 'full' ? FULL_DIR : INC_DIR;
  const prefix   = backupType === 'full' ? 'dev_full' : 'dev_inc';
  const destPath = path.join(destDir, `${prefix}_${dateStr()}.db`);
  // VACUUM INTO cria uma cópia consistente enquanto o banco está em uso
  const destPosix = destPath.replace(/\\/g, '/');

  const prisma = new PrismaClient();
  try {
    await prisma.$executeRawUnsafe(`VACUUM INTO '${destPosix}'`);
    const size = fs.statSync(destPath).size;
    log(`SUCCESS | ${path.basename(destPath)} — ${formatBytes(size)}`);
  } catch (err: any) {
    log(`ERROR | Falha no backup: ${err.message}`);
    await prisma.$disconnect();
    process.exit(1);
  }
  await prisma.$disconnect();

  cleanup();
  log('DONE');
}

runBackup();
