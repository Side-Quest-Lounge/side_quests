/**
 * Verify Aurora, pgvector, app schema, and Bedrock are ready.
 *
 * Run: npm run check:aws
 * Or:  npx dotenv -e .env.local -- npm run check:aws
 */
import { RDSDataClient, ExecuteStatementCommand } from "@aws-sdk/client-rds-data";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

type Status = "pass" | "fail" | "warn";

type CheckResult = {
  label: string;
  status: Status;
  detail: string;
};

const REQUIRED_ENV = [
  "AWS_REGION",
  "AURORA_CLUSTER_ARN",
  "AURORA_SECRET_ARN",
  "AURORA_DATABASE",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
] as const;

const EXPECTED_TABLES = [
  "agent_traces",
  "events",
  "group_members",
  "groups",
  "messages",
  "preferences",
  "profiles",
  "rate_limits",
  "surveys",
  "users",
  "venues",
];

function cell(field: { isNull?: boolean; stringValue?: string; longValue?: number; doubleValue?: number; booleanValue?: boolean } | undefined): string | number | boolean | null {
  if (!field || field.isNull) return null;
  return field.stringValue ?? field.longValue ?? field.doubleValue ?? field.booleanValue ?? null;
}

function pass(label: string, detail: string): CheckResult {
  return { label, status: "pass", detail };
}

function fail(label: string, detail: string): CheckResult {
  return { label, status: "fail", detail };
}

function warn(label: string, detail: string): CheckResult {
  return { label, status: "warn", detail };
}

async function query(rds: RDSDataClient, sql: string): Promise<Array<Array<string | number | boolean | null>>> {
  const res = await rds.send(
    new ExecuteStatementCommand({
      resourceArn: process.env.AURORA_CLUSTER_ARN!,
      secretArn: process.env.AURORA_SECRET_ARN!,
      database: process.env.AURORA_DATABASE!,
      sql,
    }),
  );
  return (res.records ?? []).map((row) => row.map(cell));
}

function checkEnv(): CheckResult[] {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    return [fail("Environment variables", `Missing: ${missing.join(", ")}`)];
  }
  return [
    pass(
      "Environment variables",
      `region=${process.env.AWS_REGION}, database=${process.env.AURORA_DATABASE}`,
    ),
  ];
}

async function checkAurora(rds: RDSDataClient): Promise<CheckResult> {
  try {
    await query(rds, "SELECT 1 AS ok");
    return pass("Aurora Data API", "Connected successfully");
  } catch (err) {
    const name = err instanceof Error ? err.name : "Error";
    const message = err instanceof Error ? err.message : String(err);
    return fail("Aurora Data API", `${name}: ${message.slice(0, 160)}`);
  }
}

async function checkPgvector(rds: RDSDataClient): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  try {
    const ext = await query(rds, "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'");
    if (ext.length > 0) {
      results.push(pass("pgvector extension", `Installed (${ext[0].join(" v")})`));
    } else {
      results.push(
        fail("pgvector extension", "Not installed — run: CREATE EXTENSION IF NOT EXISTS vector;"),
      );
    }

    const vec = await query(rds, "SELECT '[1,2,3]'::vector(3) AS sample");
    if (vec.length > 0) {
      results.push(pass("pgvector query", `Vector type works (${vec[0][0]})`));
    } else {
      results.push(fail("pgvector query", "Vector literal query returned no rows"));
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    results.push(fail("pgvector", message.slice(0, 160)));
  }

  return results;
}

async function checkSchema(rds: RDSDataClient): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  try {
    const tables = await query(
      rds,
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name",
    );
    const names = tables.map((row) => String(row[0]));

    if (names.length === 0) {
      results.push(
        fail("App schema", "No public tables found — run: npx dotenv -e .env.local -- drizzle-kit push"),
      );
      return results;
    }

    const missing = EXPECTED_TABLES.filter((table) => !names.includes(table));
    if (missing.length === 0) {
      results.push(pass("App schema", `All ${EXPECTED_TABLES.length} tables present`));
    } else {
      results.push(
        warn("App schema", `Found ${names.length} tables; missing: ${missing.join(", ")}`),
      );
    }

    const cols = await query(
      rds,
      "SELECT column_name, udt_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' ORDER BY ordinal_position",
    );
    const hasEmbedding = cols.some((row) => row[0] === "embedding");
    if (hasEmbedding) {
      results.push(pass("profiles.embedding", "Vector column exists"));
    } else if (cols.length > 0) {
      results.push(fail("profiles.embedding", "profiles table exists but embedding column is missing"));
    } else {
      results.push(fail("profiles.embedding", "profiles table not found"));
    }

    const indexes = await query(rds, "SELECT indexname FROM pg_indexes WHERE tablename = 'profiles'");
    const indexNames = indexes.map((row) => String(row[0]));
    const hasHnsw = indexNames.some((name) => name.includes("embedding"));
    if (hasHnsw) {
      results.push(pass("Vector index", indexNames.filter((n) => n.includes("embedding")).join(", ")));
    } else {
      results.push(
        warn(
          "Vector index",
          "HNSW index missing — run CREATE INDEX profiles_embedding_hnsw ON profiles USING hnsw (embedding vector_cosine_ops);",
        ),
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    results.push(fail("App schema", message.slice(0, 160)));
  }

  return results;
}

async function checkBedrock(): Promise<CheckResult> {
  const region = process.env.BEDROCK_REGION ?? process.env.AWS_REGION!;
  const client = new BedrockRuntimeClient({ region });

  try {
    const res = await client.send(
      new InvokeModelCommand({
        modelId: "amazon.titan-embed-text-v2:0",
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({ inputText: "side quest readiness check", dimensions: 1024, normalize: true }),
      }),
    );
    const parsed = JSON.parse(new TextDecoder().decode(res.body)) as { embedding?: number[] };
    const dim = parsed.embedding?.length ?? 0;
    if (dim === 1024) {
      return pass("Bedrock Titan embed", `1024-dim embedding returned (${region})`);
    }
    return fail("Bedrock Titan embed", `Expected 1024 dimensions, got ${dim}`);
  } catch (err) {
    const name = err instanceof Error ? err.name : "Error";
    const message = err instanceof Error ? err.message : String(err);
    if (name === "ThrottlingException") {
      return warn(
        "Bedrock Titan embed",
        "Rate limited — IAM looks OK. Wait 30–60s and retry, or run check:aws again.",
      );
    }
    return fail(
      "Bedrock Titan embed",
      `${name}: ${message.slice(0, 160)} — enable amazon.titan-embed-text-v2:0 and add bedrock:InvokeModel to IAM`,
    );
  }
}

function printResults(results: CheckResult[]): void {
  const icon: Record<Status, string> = { pass: "✓", fail: "✗", warn: "!" };

  console.log("Side Quest — AWS readiness check\n");
  for (const result of results) {
    console.log(`${icon[result.status]} ${result.label}`);
    console.log(`  ${result.detail}\n`);
  }

  const failed = results.filter((r) => r.status === "fail").length;
  const warned = results.filter((r) => r.status === "warn").length;
  const passed = results.filter((r) => r.status === "pass").length;

  console.log(`Summary: ${passed} passed, ${warned} warnings, ${failed} failed`);
  if (failed === 0 && warned === 0) {
    console.log("All checks passed. You can run: npx dotenv -e .env.local -- npm run seed");
  } else if (failed === 0) {
    console.log("Core checks passed with warnings. Review items above before seeding.");
  } else {
    console.log("Fix failed checks before running seed or matching.");
  }
}

async function main(): Promise<void> {
  const results: CheckResult[] = [...checkEnv()];

  const envOk = results.every((r) => r.status === "pass");
  if (!envOk) {
    printResults(results);
    process.exit(1);
  }

  const rds = new RDSDataClient({ region: process.env.AWS_REGION! });

  results.push(await checkAurora(rds));

  const auroraOk = results[results.length - 1]?.status === "pass";
  if (auroraOk) {
    results.push(...(await checkPgvector(rds)));
    results.push(...(await checkSchema(rds)));
  }

  results.push(await checkBedrock());

  printResults(results);

  const failed = results.some((r) => r.status === "fail");
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error("check:aws failed:", err);
  process.exit(1);
});
