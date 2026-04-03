// @ts-ignore
import { GoogleGenerativeAI } from '@google/generative-ai';

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const REVIEW_SCHEMA = `{
  "quality_score": <integer 1-10>,
  "summary": "<one sentence overall assessment>",
  "bugs": [
    {
      "line": <integer or null>,
      "severity": "low" | "medium" | "high",
      "description": "<what the bug is>",
      "fix": "<how to fix it>"
    }
  ],
  "improvements": [
    {
      "description": "<what to improve>",
      "before": "<original code snippet>",
      "after": "<improved code snippet>"
    }
  ],
  "documentation": [
    {
      "name": "<function or class name>",
      "description": "<what it does>",
      "params": [{ "name": "...", "type": "...", "description": "..." }],
      "returns": "<return value description or 'void'>"
    }
  ]
}`;

const SYSTEM_PROMPT = `You are a senior software engineer performing a thorough code review.
Respond ONLY with a valid JSON object — no preamble, no markdown fences, no explanation outside the JSON.
The JSON must match this exact schema:
${REVIEW_SCHEMA}`;

const MAX_CHUNK_SIZE = 24000;

function chunkCode(code: string): string[] {
  if (code.length <= MAX_CHUNK_SIZE) return [code];

  const chunks: string[] = [];
  let start = 0;

  while (start < code.length) {
    let end = start + MAX_CHUNK_SIZE;
    if (end >= code.length) {
      chunks.push(code.slice(start));
      break;
    }
    // Try to split on blank line or function boundary
    const boundary = code.slice(0, end).lastIndexOf('\n\n');
    if (boundary > start + MAX_CHUNK_SIZE / 2) {
      end = boundary;
    } else {
      const nlBoundary = code.slice(0, end).lastIndexOf('\n');
      if (nlBoundary > start) end = nlBoundary;
    }
    chunks.push(code.slice(start, end));
    start = end;
  }
  return chunks;
}

async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  const model = ai.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompt,
  });

  // Helper for exponential backoff on 429 errors
  const executeWithRetry = async (retries = 3, delay = 2000): Promise<string> => {
    try {
      const result = await model.generateContent(userPrompt);
      const response = await result.response;
      return response.text();
    } catch (err: any) {
      const isRateLimit = err.message?.includes('429') || err.status === 429;
      if (isRateLimit && retries > 0) {
        console.warn(`[AI-THROTTLE] Rate limited. Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return executeWithRetry(retries - 1, delay * 2);
      }
      throw err;
    }
  };

  return executeWithRetry();
}

function parseJSON(raw: string): Record<string, unknown> {
  // Strip any accidental markdown fences
  const clean = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
  return JSON.parse(clean);
}

async function reviewChunk(
  code: string,
  language: string,
  chunkIndex: number,
  totalChunks: number
): Promise<Record<string, unknown>> {
  const isMultiChunk = totalChunks > 1;
  const userPrompt = isMultiChunk
    ? `This is chunk ${chunkIndex + 1} of ${totalChunks}. Focus on bugs and improvements for this chunk only. Still return valid JSON matching the schema.\n\nReview the following ${language} code:\n\n${code}`
    : `Review the following ${language} code:\n\n${code}`;

  let raw = await callLLM(SYSTEM_PROMPT, userPrompt);

  try {
    return parseJSON(raw);
  } catch {
    // One retry
    const retryPrompt = `Your last response was not valid JSON. Please return only the JSON object.\n\nOriginal request: ${userPrompt}`;
    raw = await callLLM(SYSTEM_PROMPT, retryPrompt);
    return parseJSON(raw);
  }
}

async function mergeChunkResults(
  results: Record<string, unknown>[]
): Promise<Record<string, unknown>> {
  if (results.length === 1) return results[0];

  const mergePrompt = `Given these ${results.length} JSON results from separate code chunks: ${JSON.stringify(results)}
  
Produce a single merged JSON following the same schema. Merge bugs and improvements arrays. Average the quality_scores (round to nearest integer). Write one combined summary.`;

  let raw = await callLLM(SYSTEM_PROMPT, mergePrompt);
  try {
    return parseJSON(raw);
  } catch {
    const retryPrompt = `Your last response was not valid JSON. Please return only the JSON object.\n\n${mergePrompt}`;
    raw = await callLLM(SYSTEM_PROMPT, retryPrompt);
    return parseJSON(raw);
  }
}

export interface ReviewResult {
  quality_score: number;
  summary: string;
  bugs: Array<{
    line: number | null;
    severity: 'low' | 'medium' | 'high';
    description: string;
    fix: string;
  }>;
  improvements: Array<{
    description: string;
    before: string;
    after: string;
  }>;
  documentation: Array<{
    name: string;
    description: string;
    params: Array<{ name: string; type: string; description: string }>;
    returns: string;
  }>;
}

export async function analyzeCode(
  code: string,
  language: string
): Promise<ReviewResult> {
  const chunks = chunkCode(code);
  const chunkResults: Record<string, unknown>[] = [];

  for (let i = 0; i < chunks.length; i++) {
    // Add artificial delay between chunks to avoid immediate 429
    if (i > 0) {
      console.log(`[AI-THROTTLE] Waiting 1s before next chunk...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    const result = await reviewChunk(chunks[i], language, i, chunks.length);
    chunkResults.push(result);
  }

  // Small delay before merging
  if (chunks.length > 1) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const merged = await mergeChunkResults(chunkResults);
  return merged as unknown as ReviewResult;
}
