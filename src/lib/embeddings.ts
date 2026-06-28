/**
 * Bedrock Titan embeddings (1024-dim) for profiles.
 * `tryEmbedText` / `embedProfile` swallow errors so quiz save still succeeds without Bedrock.
 */
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const region = process.env.BEDROCK_REGION ?? process.env.AWS_REGION ?? "ap-southeast-2";
const client = new BedrockRuntimeClient({ region });

export function profileToText(answers: Record<string, number | string>, bio?: string): string {
  const parts = Object.entries(answers).map(([k, v]) => `${k}: ${v}`);
  if (bio) parts.push(`bio: ${bio}`);
  return parts.join("; ");
}

export class EmbeddingError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "EmbeddingError";
  }
}

export async function embedText(text: string): Promise<number[]> {
  try {
    const res = await client.send(
      new InvokeModelCommand({
        modelId: "amazon.titan-embed-text-v2:0",
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({ inputText: text, dimensions: 1024, normalize: true }),
      }),
    );
    const parsed = JSON.parse(new TextDecoder().decode(res.body)) as { embedding?: number[] };
    if (!parsed.embedding?.length) {
      throw new EmbeddingError("Bedrock returned an empty embedding");
    }
    return parsed.embedding;
  } catch (err) {
    const name = err instanceof Error ? err.name : "UnknownError";
    const msg = err instanceof Error ? err.message : String(err);
    if (name === "AccessDeniedException") {
      throw new EmbeddingError(
        "Bedrock access denied — enable Titan Embeddings in the AWS Bedrock console and add bedrock:InvokeModel to your IAM user.",
        err,
      );
    }
    throw new EmbeddingError(`Bedrock embedding failed (${name}): ${msg}`, err);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableBedrockError(err: unknown): boolean {
  let current: unknown = err;
  for (let i = 0; i < 3; i++) {
    if (!current) break;
    const name = current instanceof Error ? current.name : "";
    const message = current instanceof Error ? current.message : String(current);
    if (
      name === "ThrottlingException" ||
      name === "ServiceUnavailableException" ||
      name === "TooManyRequestsException" ||
      message.includes("Too many requests") ||
      message.includes("ThrottlingException")
    ) {
      return true;
    }
    current = current instanceof Error ? current.cause : undefined;
  }
  return false;
}

/** Call Bedrock with exponential backoff — use for batch jobs like seeding. */
export async function embedTextWithRetry(
  text: string,
  opts: { maxAttempts?: number; baseDelayMs?: number } = {},
): Promise<number[]> {
  const maxAttempts = opts.maxAttempts ?? 6;
  const baseDelayMs = opts.baseDelayMs ?? 2000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await embedText(text);
    } catch (err) {
      if (!isRetryableBedrockError(err) || attempt === maxAttempts) throw err;
      const delay = baseDelayMs * 2 ** (attempt - 1);
      console.warn(`[embeddings] throttled — retry ${attempt}/${maxAttempts - 1} in ${delay}ms`);
      await sleep(delay);
    }
  }

  throw new EmbeddingError("Bedrock embedding failed after retries");
}

/** Returns null instead of throwing — use when profile should save even without an embedding. */
export async function tryEmbedText(text: string): Promise<number[] | null> {
  try {
    return await embedText(text);
  } catch (err) {
    console.error("[embeddings]", err);
    return null;
  }
}

/** Build profile text and embed quiz answers, bio, and optional survey likes. */
export async function embedProfile(
  answers: Record<string, number | string>,
  bio?: string | null,
  likes?: string[],
): Promise<number[] | null> {
  let text = profileToText(answers, bio ?? undefined);
  if (likes?.length) text += "; likes: " + likes.join(", ");
  try {
    // Quiz save UI already waits — retry throttling for up to ~30s before giving up.
    return await embedTextWithRetry(text, { maxAttempts: 5, baseDelayMs: 3000 });
  } catch (err) {
    console.error("[embeddings]", err);
    return null;
  }
}
