/**
 * List all PostgreSQL databases on the Aurora cluster.
 * Run: npx dotenv -e .env.local -- tsx scripts/list-databases.ts
 */
import { RDSDataClient, ExecuteStatementCommand } from "@aws-sdk/client-rds-data";

async function query(database: string, sql: string): Promise<Array<Array<string | number | boolean | null>>> {
  const rds = new RDSDataClient({ region: process.env.AWS_REGION! });
  const res = await rds.send(
    new ExecuteStatementCommand({
      resourceArn: process.env.AURORA_CLUSTER_ARN!,
      secretArn: process.env.AURORA_SECRET_ARN!,
      database,
      sql,
    }),
  );
  return (res.records ?? []).map((row) =>
    row.map((f) => f.stringValue ?? f.longValue ?? f.doubleValue ?? f.booleanValue ?? null),
  );
}

async function main(): Promise<void> {
  console.log("Cluster:", process.env.AURORA_CLUSTER_ARN?.split(":cluster:")[1]);
  console.log("Region:", process.env.AWS_REGION);
  console.log("App database (AURORA_DATABASE):", process.env.AURORA_DATABASE);
  console.log("");

  const dbs = await query(
    "postgres",
    "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname",
  );
  console.log("All databases on cluster:");
  for (const [name] of dbs) console.log(`  - ${name}`);

  for (const row of dbs) {
    const db = String(row[0]);
    try {
      const tables = await query(
        db,
        "SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'",
      );
      let hasUsers = false;
      try {
        const users = await query(db, "SELECT count(*)::int AS n FROM users");
        hasUsers = Number(users[0]?.[0] ?? 0) >= 0;
        console.log(`\n${db}: ${tables[0]?.[0]} public tables, users rows: ${users[0]?.[0]}`);
      } catch {
        console.log(`\n${db}: ${tables[0]?.[0]} public tables, no users table`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`\n${db}: error — ${msg.slice(0, 120)}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
