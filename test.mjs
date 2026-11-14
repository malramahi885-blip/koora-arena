import assert from 'node:assert/strict';
import {handleRequest} from './auth.mjs';
const env={ADMIN_USERNAME:'admin',ADMIN_PASSWORD:'test-only-password',XTREAM_SERVER:'https://example.test',XTREAM_USERNAME:'hidden-user',XTREAM_PASSWORD:'hidden-secret'};
for(const path of ['/admin','/admin/','/api/admin/status','/api/admin/check']){
 for(const headers of [{},{'oai-authenticated-user-id':'portable-admin'},{authorization:'Basic '+Buffer.from('admin:wrong').toString('base64')}]){
  let r=await handleRequest(new Request('https://site.test'+path,{headers}),env);assert.equal(r.status,401);assert.ok(!(await r.text()).includes('hidden-user'));
 }
}
const headers={authorization:'Basic '+Buffer.from('admin:test-only-password').toString('base64')};
let r=await handleRequest(new Request('https://site.test/api/admin/status',{headers}),env);assert.equal(r.status,200);let data=await r.json();assert.equal(data.username,'hidden-user');assert.ok(!JSON.stringify(data).includes('hidden-secret'));
r=await handleRequest(new Request('https://site.test/admin',{headers}),{});assert.equal(r.status,401);
r=await handleRequest(new Request('https://site.test/'),env);assert.equal(r.status,200);let html=await r.text();assert.ok(!html.includes('hidden-user'));assert.ok(!html.includes('hidden-secret'));assert.ok(!html.includes('XTREAM_'));
console.log('PASS: public page, independent admin login, spoofed-header rejection, missing-password fail closed, password omission');
