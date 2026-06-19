import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  driver: "aws-data-api",
  dbCredentials: {
    database: process.env.AURORA_DATABASE!,
    resourceArn: process.env.AURORA_CLUSTER_ARN!,
    secretArn: process.env.AURORA_SECRET_ARN!,
  },
});
