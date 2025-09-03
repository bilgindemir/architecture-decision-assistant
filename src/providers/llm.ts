import 'dotenv/config';

export interface LLM {
  generate(prompt: string): Promise<string>;
  embed(texts: string[]): Promise<number[][]>;
}

function assertEnv(key: string) {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
}

export async function getLLM(): Promise<LLM> {
  const provider = (process.env.PROVIDER || 'openai').toLowerCase();

  if (provider === 'openai') {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: assertEnv('OPENAI_API_KEY') });
    const genModel = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
    const embModel = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small';

    return {
      async generate(prompt: string) {
        // Responses API is the current recommended API
        const res = await client.responses.create({
          model: genModel,
          input: prompt
        });
        return res.output_text || '';
      },
      async embed(texts: string[]) {
        const res = await client.embeddings.create({
          model: embModel,
          input: texts
        });
        return res.data.map((d) => d.embedding as number[]);
      }
    };
  }

  if (provider === 'bedrock') {
    const { BedrockRuntimeClient, ConverseCommand, InvokeModelCommand } =
      await import('@aws-sdk/client-bedrock-runtime');

    const region = assertEnv('BEDROCK_REGION');
    const textModel = assertEnv('BEDROCK_MODEL_ID');
    const embedModel = assertEnv('BEDROCK_EMBEDDING_MODEL');
    const br = new BedrockRuntimeClient({ region });

    return {
      async generate(prompt: string) {
        // Bedrock's Converse API works broadly across chat models
        const cmd = new ConverseCommand({
          modelId: textModel,
          messages: [{ role: 'user', content: [{ text: prompt }] }]
        });
        const res = await br.send(cmd);
        const out = res.output?.message?.content?.[0]?.text ?? '';
        return out;
      },
      async embed(texts: string[]) {
        // Titan Embeddings (text)
        const results: number[][] = [];
        for (const t of texts) {
          const payload = JSON.stringify({ inputText: t });
          const cmd = new InvokeModelCommand({
            modelId: embedModel,
            contentType: 'application/json',
            accept: 'application/json',
            body: new TextEncoder().encode(payload)
          });
          const res = await br.send(cmd);
          const parsed = JSON.parse(new TextDecoder().decode(res.body));
          results.push(parsed.embedding);
        }
        return results;
      }
    };
  }

  throw new Error(`Unsupported PROVIDER: ${provider}`);
}
