import { NextResponse } from "next/server";
import { DEMO } from "@/lib/demo";

/** Public liveness check for deploys and uptime monitors. Does not query Aurora. */
export async function GET(): Promise<NextResponse> {
  const configured = {
    aurora: Boolean(
      process.env.AURORA_CLUSTER_ARN &&
        process.env.AURORA_SECRET_ARN &&
        process.env.AURORA_DATABASE,
    ),
    clerk: Boolean(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
    bedrock: Boolean(process.env.AWS_REGION),
  };

  const ok = DEMO || (configured.aurora && configured.clerk);

  return NextResponse.json(
    {
      ok,
      demo: DEMO,
      configured,
      ts: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  );
}
