/**
 * Aurora access via RDS Data API (HTTP — no connection pool).
 * All server routes import `db` from here; schema lives in ./schema.ts.
 */
import { RDSDataClient } from "@aws-sdk/client-rds-data";
import { drizzle } from "drizzle-orm/aws-data-api/pg";
import * as schema from "./schema";

const rds = new RDSDataClient({ region: process.env.AWS_REGION! });

export const db = drizzle(rds, {
  database: process.env.AURORA_DATABASE!,
  resourceArn: process.env.AURORA_CLUSTER_ARN!,
  secretArn: process.env.AURORA_SECRET_ARN!,
  schema,
});
