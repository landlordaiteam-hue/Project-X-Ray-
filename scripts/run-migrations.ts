import 'dotenv/config';
import { Client } from 'pg';

const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://capitalxray:capitalxray@localhost:5432/capitalxray';

async function main() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const migrations = [
      '001_core.sql',
      '002_roles_permissions.sql',
      '003_project_workspace.sql'
    ];

    for (const file of migrations) {
      const sql = await import('node:fs/promises').then((fs) =>
        fs.readFile(new URL(`../db/migrations/${file}`, import.meta.url), 'utf8')
      );
      await client.query(sql);
      console.log(`Applied ${file}`);
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
