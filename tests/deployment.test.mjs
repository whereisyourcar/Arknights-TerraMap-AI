import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const root=new URL('../',import.meta.url);

test('every server module copied into the image survives the Docker context allowlist',()=>{
 const dockerfile=readFileSync(new URL('Dockerfile',root),'utf8');
 const rules=readFileSync(new URL('.dockerignore',root),'utf8').split(/\r?\n/).map(line=>line.trim()).filter(line=>line&&!line.startsWith('#'));
 // This project deliberately sends only explicitly allowed files to Docker.
 // Fail if the format changes, so a new ignore policy needs its own review.
 assert.equal(rules[0],'*','the current context is an explicit allowlist');
 assert(rules.slice(1).every(rule=>rule.startsWith('!')),'new exclusion rules need a full Docker-ignore evaluator');
 const allowed=new Set(rules.slice(1).map(rule=>rule.slice(1).replace(/^\.\//,'')));
 const copied=new Set();
 for(const line of dockerfile.split(/\r?\n/)){
  if(!/^COPY\s/i.test(line))continue;
  const fields=line.trim().split(/\s+/).slice(1).filter(field=>!field.startsWith('--'));
  for(const source of fields.slice(0,-1))if(/^[\w.-]+\.mjs$/.test(source))copied.add(source);
 }
 assert(copied.has('server.mjs'),'test must inspect the executable server COPY instruction');
 for(const file of copied){
  assert(existsSync(new URL(file,root)),`Docker COPY source is missing: ${file}`);
  assert(allowed.has(file),`${file} is copied by Dockerfile but excluded from the build context`);
 }
 // Follow the actual local imports as well: omitting a new module from COPY
 // should fail here instead of only after the container starts in production.
 const visited=new Set();
 function inspect(file){
  if(visited.has(file))return;visited.add(file);
  const source=readFileSync(new URL(file,root),'utf8');
  for(const match of source.matchAll(/(?:from\s*|import\s*\(\s*)['"]\.\/([\w.-]+\.mjs)['"]/g)){
   const dependency=match[1];
   assert(copied.has(dependency),`${file} imports ${dependency}, which is absent from Docker COPY`);
   assert(allowed.has(dependency),`${file} imports ${dependency}, which is excluded from the build context`);
   inspect(dependency);
  }
 }
 inspect('server.mjs');
});
