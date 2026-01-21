import OpenAI from "openai";

import { getBaseEnv } from "@/lib/env";

const EMBEDDING_MODEL = "text-embedding-3-small";
const ANSWER_MODEL = "gpt-4o-mini";

let cachedClient: OpenAI | null = null;

function getClient() {
  if (!cachedClient) {
    const env = getBaseEnv();
    cachedClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return cachedClient;
}

export async function createEmbedding(input: string) {
  const client = getClient();
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input,
  });
  return response.data[0]?.embedding ?? [];
}

type AnswerSource = {
  title: string;
  content: string;
};

export async function generateAnswer(params: {
  query: string;
  sources: AnswerSource[];
}) {
  const client = getClient();
  const sourceText = params.sources
    .map((source, index) => {
      const content =
        source.content.length > 1500 ? `${source.content.slice(0, 1500)}...` : source.content;
      return `Source ${index + 1}:\nTitle: ${source.title}\nContent:\n${content}`;
    })
    .join("\n\n");

  const response = await client.chat.completions.create({
    model: ANSWER_MODEL,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You answer questions using the provided wiki sources. If the sources do not contain the answer, say you do not have enough information.",
      },
      {
        role: "user",
        content: `Question: ${params.query}\n\n${sourceText}`,
      },
    ],
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}
