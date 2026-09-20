import 'dotenv/config';
import { hashPassword } from '../src/lib/auth';
import { runQuery } from '../src/lib/db';
async function main() { const org = (await runQuery<{id:string}>(`INSERT INTO organizations(name,slug) VALUES($1,$2) ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name RETURNING id`, ['Capital X-RAY Demo','capital-x-ray-demo'])).rows[0].id; const user = (await runQuery<{id:string}>(`INSERT INTO users(email,password_hash,display_name) VALUES($1,$2,$3) ON CONFLICT(email) DO UPDATE SET display_name=EXCLUDED.display_name RETURNING id`, ['admin@capitalxray.local', await hashPassword('Password123!'), 'Demo Admin'])).rows[0].id; await runQuery(`INSERT INTO organization_memberships(organization_id,user_id,role_id) SELECT $1,$2,id FROM roles WHERE name='exec_admin' ON CONFLICT DO NOTHING`, [org,user]); console.log('Seeded admin@capitalxray.local / Password123!'); }
main().catch(error => { console.error(error); process.exit(1); });
