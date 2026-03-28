import 'dotenv/config';
import { analyzeCode } from './services/llm.js';

async function test() {
  try {
    const res = await analyzeCode("function test() {}", "javascript");
    console.log("SUCCESS:", res);
  } catch (err) {
    console.error("SDK ERROR:", err);
  }
}
test();
