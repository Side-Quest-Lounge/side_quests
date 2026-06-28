/**
 * Apply schema changes that drizzle-kit push may hang on with RDS Data API.
 *
 * Run: npx dotenv -e .env.local -- npm run db:migrate
 */
import { RDSDataClient, ExecuteStatementCommand } from "@aws-sdk/client-rds-data";

const statements = [
  `CREATE TABLE IF NOT EXISTS rate_limits (
    key text PRIMARY KEY,
    count integer NOT NULL DEFAULT 1,
    window_start timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS group_members_group_user_unique
   ON group_members (group_id, user_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS surveys_group_user_unique
   ON surveys (group_id, user_id)`,
];

async function run(sql: string): Promise<void> {
  const rds = new RDSDataClient({ region: process.env.AWS_REGION! });
  await rds.send(
    new ExecuteStatementCommand({
      resourceArn: process.env.AURORA_CLUSTER_ARN!,
      secretArn: process.env.AURORA_SECRET_ARN!,
      database: process.env.AURORA_DATABASE!,
      sql,
    }),
  );
}

async function main(): Promise<void> {
  console.log("Applying schema updates via RDS Data API...\n");
  for (const sql of statements) {
    const label = sql.trim().split("\n")[0].slice(0, 60);
    process.stdout.write(`  ${label}... `);
    try {
      await run(sql);
      console.log("OK");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log("SKIP or FAIL:", msg.slice(0, 100));
    }
  }
  console.log("\nDone. Verify with: npm run check:aws");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
