/** SERVER ONLY. Never import in the browser. Analytics remain deterministic. */
import {analyze,promotion,type Job} from '../src/domain';
export type NarrativeInput={company:string;request:string;metrics:ReturnType<typeof analyze>;actions:ReturnType<typeof promotion>};
export type NarrativeResult={summary:string;hypotheses:string[];posts:string[]};
export interface NarrativeProvider { generate(input:NarrativeInput):Promise<NarrativeResult>; }
export function prepareModelInput(job:Job):NarrativeInput {return {company:job.company,request:job.title,metrics:analyze(job.rows),actions:promotion(job)};}
/** Private gateway contract: POST {model,input} -> {summary,hypotheses,posts}.
 * This is not a vendor-specific endpoint; connect your chosen SDK behind it.
 */
export class ServerGatewayProvider implements NarrativeProvider {
 async generate(input:NarrativeInput):Promise<NarrativeResult>{
  const endpoint=process.env.MODEL_BASE_URL,key=process.env.MODEL_API_KEY,model=process.env.MODEL_NAME;
  if(!endpoint||!key||!model)throw new Error('Model gateway is not configured. Keep demonstration mode enabled.');
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},body:JSON.stringify({model,input}),signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw new Error('Model gateway request failed.');
  const result:unknown=await response.json();
  if(!result||typeof result!=='object'||!('summary' in result)||typeof result.summary!=='string'||!('hypotheses'in result)||!Array.isArray(result.hypotheses)||!result.hypotheses.every(x=>typeof x==='string')||!('posts'in result)||!Array.isArray(result.posts)||!result.posts.every(x=>typeof x==='string'))throw new Error('Invalid narrative response.');
  return result as NarrativeResult;
 }
}
