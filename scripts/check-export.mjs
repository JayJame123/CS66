import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { memories } from '../data/memories.ts';
const child = spawn(process.execPath, [fileURLToPath(new URL('./serve-static.mjs', import.meta.url))], {env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});
try {
 const origin=await new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>reject(new Error('Server did not start')),15000);
  child.once('error',reject);child.once('exit',code=>{clearTimeout(timeout);reject(new Error(`Server exited: ${code}`));});
  child.stdout.on('data',chunk=>{const match=String(chunk).match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timeout);resolve(match[0]);}});
 });
 for(const route of ['/', '/members/jame', '/members/mint', '/members/bank', '/members/ploy', '/members/non', '/members/fah']) {
  const response=await fetch(origin+route);assert.equal(response.status,200,route);assert.match(response.headers.get('content-type'),/text\/html/);
 }
 assert.equal((await fetch(origin+'/missing-page')).status,404);
 assert.equal((await fetch(origin+'/',{method:'POST'})).status,405);
 assert.equal((await fetch(origin+'/%ZZ')).status,400);
 assert.equal((await fetch(origin+'/%5c..%5cpackage.json')).status,400);
 assert.equal((await fetch(origin+'/package.json')).status,404);
 assert.equal((await fetch(origin+'/',{method:'HEAD'})).status,200);
 assert.equal(new Set(memories.map(photo=>photo.image)).size,24);
 for(const photo of memories){
  const response=await fetch(origin+photo.image);assert.equal(response.status,200,photo.image);assert.equal(response.headers.get('content-type'),'image/jpeg');
  const source=await readFile(new URL('../public'+photo.image,import.meta.url));assert.deepEqual(Buffer.from(await response.arrayBuffer()),source);
 }
 console.log('PASS: 7 pages, 24 unchanged photos, 404, HEAD, method and path checks.');
} finally {child.kill();if(child.exitCode===null)await once(child,'exit');}
