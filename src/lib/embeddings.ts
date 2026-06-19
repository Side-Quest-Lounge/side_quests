import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION! });

export function profileToText(answers: Record<string, number | string>, bio?: string): string {
  const parts = Object.entries(answers).map(([k, v]) => `${k}: ${v}`);
  if (bio) parts.push(`bio: ${bio}`);
  return parts.join("; ");
}

export async function embedText(text: string): Promise<number[]> {
  const res = await client.send(new InvokeModelCommand({
    modelId: "amazon.titan-embed-text-v2:0",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({ inputText: text, dimensions: 1024, normalize: true }),
  }));
  const parsed = JSON.parse(new TextDecoder().decode(res.body));
  return parsed.embedding as number[];
}
