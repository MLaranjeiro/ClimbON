// Runs the Postman collections in src/testing/postman with newman, filling the
// collection variables from .env.local / .env.test.local so no credentials are
// stored in the collection files. Usage: npm run test:api [-- <collection-name-filter>]
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { config } from 'dotenv';
import newman from 'newman';

config({ path: '.env.local', quiet: true });
config({ path: '.env.test.local', quiet: true });

const dir = 'src/testing/postman';
const filter = process.argv[2]?.toLowerCase();
const collections = readdirSync(dir)
  .filter((f) => f.endsWith('.postman_collection.json'))
  .filter((f) => !filter || f.toLowerCase().includes(filter));

const base = {
  SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
};

// The routes collection creates and edits routes, so it needs a setter/admin account.
function accountFor(file) {
  const needsSetter = file.includes('Routes');
  return {
    TEST_EMAIL: (needsSetter && process.env.TEST_SETTER_EMAIL) || process.env.TEST_EMAIL,
    TEST_PASSWORD: (needsSetter && process.env.TEST_SETTER_PASSWORD) || process.env.TEST_PASSWORD,
  };
}

function run(file) {
  const vars = { ...base, ...accountFor(file) };
  return new Promise((resolve, reject) => {
    newman.run(
      {
        collection: join(dir, file),
        envVar: Object.entries(vars).map(([key, value]) => ({ key, value })),
        reporters: 'cli',
      },
      (err, summary) => (err ? reject(err) : resolve(summary.run.failures.length)),
    );
  });
}

let failures = 0;
for (const file of collections) {
  failures += await run(file);
}
process.exit(failures > 0 ? 1 : 0);
