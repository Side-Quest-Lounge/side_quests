/**
 * Bedrock Titan embeddings (1024-dim) for profiles.
 * `tryEmbedText` / `embedProfile` swallow errors so quiz save still succeeds without Bedrock.
 *
 * When Bedrock throttles (common on new accounts in ap-southeast-2), seed can fall back to
 * `deterministicEmbed()` — good enough for matching demos; not semantic-quality Titan vectors.
 */
import { createHash } from "crypto";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const region = process.env.BEDROCK_REGION ?? process.env.AWS_REGION ?? "ap-southeast-2";
const client = new BedrockRuntimeClient({ region });

const EMBED_DIM = 1024;

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

/** L2-normalized pseudo-embedding from text — for seed/dev when Bedrock RPM quota is exhausted. */
export function deterministicEmbed(text: string, dims = EMBED_DIM): number[] {
  const vec = new Float32Array(dims);
  const blocks = Math.ceil(dims / 32);
  for (let b = 0; b < blocks; b++) {
    const hash = createHash("sha256").update(`${text}\0${b}`).digest();
    for (let i = 0; i < 32 && b * 32 + i < dims; i++) {
      vec[b * 32 + i] = hash[i] / 127.5 - 1;
    }
  }
  let norm = 0;
  for (let i = 0; i < dims; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  return Array.from(vec, (x) => x / norm);
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

export function isBedrockThrottleError(err: unknown): boolean {
  return isRetryableBedrockError(err);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

/** Bedrock first; on throttle, optional deterministic fallback for dev/seed. */
export async function embedTextWithFallback(
  text: string,
  opts: { allowDeterministic?: boolean; maxAttempts?: number; baseDelayMs?: number } = {},
): Promise<{ embedding: number[]; source: "bedrock" | "deterministic" }> {
  const allowDeterministic = opts.allowDeterministic ?? process.env.ALLOW_DETERMINISTIC_EMBEDDINGS === "1";
  try {
    const embedding = await embedTextWithRetry(text, opts);
    return { embedding, source: "bedrock" };
  } catch (err) {
    if (allowDeterministic && isRetryableBedrockError(err)) {
      return { embedding: deterministicEmbed(text), source: "deterministic" };
    }
    throw err;
  }
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
    const { embedding } = await embedTextWithFallback(text, {
      allowDeterministic: process.env.ALLOW_DETERMINISTIC_EMBEDDINGS === "1",
      maxAttempts: 5,
      baseDelayMs: 3000,
    });
    return embedding;
  } catch (err) {
    console.error("[embeddings]", err);
    return null;
  }
}
