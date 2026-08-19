// Daily database backup to S3.
// Reuses the same S3 bucket/credentials as leaflet/image storage (server/s3.ts),
// under a private `backups/` prefix — never exposed via publicUrl().
import cron from 'node-cron';
import pool from './pool';
import { s3Enabled, uploadBackup, pruneOldBackups } from './s3';

const RETENTION_DAYS = 5;

export async function generateSqlDump(): Promise<string> {
  const lines: string[] = [];

  lines.push('-- =============================================');
  lines.push('-- Full database export');
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push('-- =============================================');
  lines.push('');
  lines.push("SET client_encoding = 'UTF8';");
  lines.push('SET standard_conforming_strings = on;');
  lines.push('');

  // 1. Emit CREATE SEQUENCE before tables
  const { rows: allSeqs } = await pool.query<{
    sequence_name: string;
    data_type: string;
    start_value: string;
    increment: string;
    min_value: string;
    max_value: string;
    cycle_option: string;
  }>(
    `SELECT sequence_name, data_type, start_value, increment, minimum_value AS min_value,
            maximum_value AS max_value, cycle_option
     FROM information_schema.sequences WHERE sequence_schema = 'public'`
  );

  if (allSeqs.length > 0) {
    lines.push('-- Sequences');
    for (const s of allSeqs) {
      lines.push(`CREATE SEQUENCE IF NOT EXISTS "${s.sequence_name}"`);
      lines.push(`  AS ${s.data_type}`);
      lines.push(`  START WITH ${s.start_value}`);
      lines.push(`  INCREMENT BY ${s.increment}`);
      lines.push(`  MINVALUE ${s.min_value}`);
      lines.push(`  MAXVALUE ${s.max_value}`);
      lines.push(`  ${s.cycle_option === 'YES' ? 'CYCLE' : 'NO CYCLE'};`);
      lines.push('');
    }
  }

  // 2. Tables + data
  const { rows: tables } = await pool.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
  );

  for (const { tablename } of tables) {
    lines.push(`-- Table: ${tablename}`);

    const { rows: cols } = await pool.query<{
      column_name: string;
      data_type: string;
      character_maximum_length: number | null;
      is_nullable: string;
      column_default: string | null;
    }>(
      `SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1
       ORDER BY ordinal_position`,
      [tablename]
    );

    const colDefs = cols.map(c => {
      const isSerial =
        c.column_default?.startsWith('nextval(') &&
        (c.data_type === 'integer' || c.data_type === 'bigint');
      let type: string;
      if (isSerial) {
        type = c.data_type === 'bigint' ? 'BIGSERIAL' : 'SERIAL';
      } else {
        type = c.data_type.toUpperCase();
        if (c.character_maximum_length) type += `(${c.character_maximum_length})`;
      }
      let def = `  "${c.column_name}" ${type}`;
      if (!isSerial && c.column_default !== null) def += ` DEFAULT ${c.column_default}`;
      if (c.is_nullable === 'NO') def += ' NOT NULL';
      return def;
    });

    const { rows: pks } = await pool.query<{ column_name: string }>(
      `SELECT kcu.column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
       WHERE tc.constraint_type = 'PRIMARY KEY'
         AND tc.table_schema = 'public' AND tc.table_name = $1
       ORDER BY kcu.ordinal_position`,
      [tablename]
    );
    if (pks.length > 0) {
      colDefs.push(`  PRIMARY KEY (${pks.map(p => `"${p.column_name}"`).join(', ')})`);
    }

    lines.push(`CREATE TABLE IF NOT EXISTS "${tablename}" (`);
    lines.push(colDefs.join(',\n'));
    lines.push(');');
    lines.push('');

    const { rows: dataRows, fields } = await pool.query(`SELECT * FROM "${tablename}"`);

    if (dataRows.length > 0) {
      const colNames = fields.map(f => `"${f.name}"`).join(', ');
      lines.push(`-- Data for ${tablename}`);
      for (const row of dataRows) {
        const values = fields.map(f => {
          const val = row[f.name];
          if (val === null || val === undefined) return 'NULL';
          if (Buffer.isBuffer(val)) return `'\\x${val.toString('hex')}'`;
          if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
          if (typeof val === 'number') return String(val);
          if (val instanceof Date) return `'${val.toISOString()}'`;
          return `'${String(val).replace(/'/g, "''")}'`;
        });
        lines.push(`INSERT INTO "${tablename}" (${colNames}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;`);
      }
      lines.push('');
    }
  }

  // 3. Reset sequences
  lines.push('-- Reset sequences');
  const { rows: seqBindings } = await pool.query<{
    seq_name: string;
    table_name: string;
    col_name: string;
  }>(
    `SELECT pg_get_serial_sequence(c.table_name, c.column_name) AS seq_name,
            c.table_name, c.column_name AS col_name
     FROM information_schema.columns c
     WHERE c.table_schema = 'public'
       AND c.column_default LIKE 'nextval(%'
       AND pg_get_serial_sequence(c.table_name, c.column_name) IS NOT NULL`
  );
  for (const { seq_name, table_name, col_name } of seqBindings) {
    lines.push(`SELECT setval('${seq_name}', COALESCE((SELECT MAX("${col_name}") FROM "${table_name}"), 1));`);
  }
  lines.push('');

  return lines.join('\n');
}

export async function runDailyBackup(): Promise<void> {
  if (!s3Enabled) {
    console.warn('⏭️  Skipping daily backup: S3 is not configured (S3_BUCKET not set)');
    return;
  }
  try {
    const sql = await generateSqlDump();
    const dateStr = new Date().toISOString().slice(0, 10);
    const key = await uploadBackup(`db-backup-${dateStr}.sql`, Buffer.from(sql, 'utf-8'));
    console.log(`✅ Daily backup uploaded to s3://${key}`);
    const deleted = await pruneOldBackups(RETENTION_DAYS);
    if (deleted > 0) console.log(`🗑️  Pruned ${deleted} backup(s) older than ${RETENTION_DAYS} days`);
  } catch (err) {
    console.error('❌ Daily backup failed:', err);
  }
}

// Runs once a day at 02:30 IST — off-peak, well after midnight rollover.
export function scheduleDailyBackup(): void {
  cron.schedule('30 2 * * *', () => {
    runDailyBackup();
  }, { timezone: 'Asia/Kolkata' });
  console.log('🕑 Daily S3 backup scheduled for 02:30 IST');
}
