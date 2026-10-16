// Real route/http/access code; all persistence, identity and bytes are isolated models.
import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
const root=path.resolve(import.meta.dirname,'..'),require=createRequire(path.join(root,'package.json'));
const esbuild=createRequire(require.resolve('tsx/package.json'))('esbuild');
const modules={db:`export const getPrisma=()=>globalThis.__labelRouteTest.db;`,security:`export const getAuthenticatedUserId=async()=>globalThis.__labelRouteTest.user;`,blob:`export const issueSignedToken=async()=>'';export const presignUrl=async()=>({presignedUrl:'https://invalid.example/test-only'});export const head=async()=>({size:3,contentType:'image/jpeg'});export const get=async()=>({statusCode:200,stream:new Response(new Uint8Array([1,2,3])).body});export const put=async(...args)=>globalThis.__labelRouteTest.blobs.push(['put',args[0]]);export const del=async(keys)=>globalThis.__labelRouteTest.blobs.push(['del',keys]);`,validation:`export const validateDeclaration=()=>{};export const validateAndOptimize=async(bytes)=>({bytes,mimeType:'image/webp',extension:'webp'});`};
const built=await esbuild.build({stdin:{contents:`export {GET as list,POST as reserve} from './src/app/api/attachments/route';export {POST as finalize} from './src/app/api/attachments/finalize/route';export {PATCH as purpose} from './src/app/api/attachments/[id]/route';export {PATCH as order} from './src/app/api/attachments/order/route';export {GET as content} from './src/app/api/attachments/[id]/content/route';export {POST as reuse} from './src/app/api/attachments/reuse/route';`,resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs',packages:'external',alias:{'@':root+'/src'},plugins:[{name:'no-services',setup(b){b.onResolve({filter:/.*/},a=>{const key=a.path==='@/lib/prisma'?'db':a.path==='@/lib/community/security'?'security':a.path==='@vercel/blob'?'blob':a.path==='@/lib/attachments/validation'?'validation':null;return key?{path:key,namespace:'test'}:undefined;});b.onLoad({filter:/.*/,namespace:'test'},a=>({contents:modules[a.path],loader:'js'}));}}]});
const compiled={exports:{}};new Function('module','exports','require',built.outputFiles[0].text)(compiled,compiled.exports,require);const routes=compiled.exports;
let attachments=new Map(),assets=new Map(),seq=0;
const test={user:'owner',blobs:[],failCommit:false,lostAck:false,db:null};globalThis.__labelRouteTest=test;
function match(row,where={}){return Object.entries(where).every(([k,v])=>{const value=row?.[k];if(v===undefined)return true;if(v&&typeof v==='object'&&!Array.isArray(v)){if('not'in v)return value!==v.not;if('startsWith'in v)return value?.startsWith(v.startsWith);if('gte'in v)return value>=v.gte;return match(value,v);}return value===v;});}
const enrich=a=>({...a,fileAsset:assets.get(a.fileAssetId),homeItem:{home:{userId:a.homeItemId==='foreign'?'other':'owner'}}});
const rows=where=>[...attachments.values()].map(enrich).filter(r=>match(r,where));
const db={
  homeItem:{findFirst:async({where})=>where.home?.userId===(where.id==='foreign'?'other':'owner')?{id:where.id}:null},
  marketplacePost:{findFirst:async()=>({id:'market'})},
  attachment:{findFirst:async({where})=>rows(where)[0]??null,findUnique:async({where})=>attachments.has(where.id)?enrich(attachments.get(where.id)):null,findMany:async({where})=>rows(where),count:async({where})=>rows(where).length,
    update:async({where,data})=>Object.assign(attachments.get(where.id),data),updateMany:async({where,data})=>{const found=rows(where);for(const r of found)Object.assign(attachments.get(r.id),data);return{count:found.length};},delete:async({where})=>{attachments.delete(where.id);},deleteMany:async({where})=>{for(const r of rows(where))attachments.delete(r.id);}},
  fileAsset:{count:async({where})=>[...assets.values()].filter(a=>match(a,where)).length,findFirst:async({where})=>{const a=[...assets.values()].find(a=>match(a,where));return a?{...a,attachments:rows({fileAssetId:a.id})}:null;},
    create:async({data})=>{const id='asset-'+(++seq),attachmentId='attachment-'+seq;const{attachments:relation,...fields}=data;assets.set(id,{id,status:'PENDING',createdAt:new Date(),...fields});attachments.set(attachmentId,{id:attachmentId,fileAssetId:id,...relation.create});return{id,attachments:[{id:attachmentId}]};},
    update:async({where,data})=>Object.assign(assets.get(where.id),data),updateMany:async({where,data})=>{const found=[...assets.values()].filter(a=>match(a,where));for(const a of found)Object.assign(a,data);return{count:found.length};},delete:async({where})=>{assets.delete(where.id);}},
  $executeRaw:async()=>0,
  $transaction:async callback=>{const previousAttachments=structuredClone(attachments),previousAssets=structuredClone(assets);try{const r=await callback(db);if(test.failCommit)throw Error('simulated commit failure');if(test.lostAck)throw Object.assign(Error('lost commit acknowledgement'),{committed:true});return r;}catch(e){if(!e.committed){attachments=previousAttachments;assets=previousAssets;}throw e;}},
};test.db=db;
function reset(count=0){attachments.clear();assets.clear();test.user='owner';test.blobs=[];test.failCommit=false;test.lostAck=false;for(let i=0;i<count;i++){const id='ready-'+i;assets.set(id,{id,ownerId:'owner',status:'READY',mimeType:'image/webp',fileName:'fixture.webp',byteSize:3,storeId:'TEST_STORE',storageKey:'old/'+id,uploadKey:'pending/'+id,createdAt:new Date()});attachments.set(id,{id,fileAssetId:id,homeItemId:'item',purpose:i===0?'LABEL':'PHOTO'});}}
const body=(overrides={})=>({target:{type:'item',id:'item'},fileName:'label.jpg',mimeType:'image/jpeg',byteSize:3,purpose:'LABEL',...overrides});
const request=(data,origin='https://local.invalid')=>new Request('https://local.invalid/api/attachments',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(data)});
const context=id=>({params:Promise.resolve({id})});
const env=process.env.BLOB_STORE_ID,originalFetch=globalThis.fetch;process.env.BLOB_STORE_ID='TEST_STORE';globalThis.fetch=async()=>{throw Error('Real network forbidden');};
try{
  reset();test.user=null;assert.equal((await routes.reserve(request(body()))).status,401);assert.equal((await routes.content(request({}),context('x'))).status,401);
  test.user='owner';assert.equal((await routes.reserve(request(body(),'https://evil.invalid'))).status,403);
  assert.equal((await routes.reserve(request(body({target:{type:'item',id:'foreign'}})))).status,404);
  assert.equal((await routes.reserve(request(body({target:{type:'marketplace',id:'market'}})))).status,400);
  assert.equal((await routes.reserve(request(body({fileName:'label.pdf',mimeType:'application/pdf'})))).status,400);
  reset(10);assert.equal((await routes.reserve(request(body()))).status,400);
  assert.equal((await routes.reserve(request(body({replaceAttachmentId:'ready-1'})))).status,404);
  const prepared=await routes.reserve(request(body({replaceAttachmentId:'ready-0'})));assert.equal(prepared.status,200);const ids=await prepared.json();assert.equal(attachments.size,11);
  assert.equal((await routes.reserve(request(body({replaceAttachmentId:'ready-0'})))).status,400);
  assert.equal((await routes.finalize(request({assetId:ids.assetId,replaceAttachmentId:'ready-0'}))).status,200);assert.equal(attachments.size,10);assert.ok(!attachments.has('ready-0'));assert.equal(assets.get(ids.assetId).status,'READY');
  assert.equal((await routes.finalize(request({assetId:ids.assetId,replaceAttachmentId:'ready-0'}))).status,200);
  test.user='other';assert.equal((await routes.content(request({}),context(ids.attachmentId))).status,404);assert.equal((await routes.purpose(request({purpose:'PHOTO'}),context(ids.attachmentId))).status,404);
  test.user='owner';assert.equal((await routes.content(request({}),context(ids.attachmentId))).status,200);assert.equal((await routes.reuse(request({attachmentId:ids.attachmentId,marketplacePostId:'market'}))).status,404);
  assert.equal((await routes.order(request({target:{type:'item',id:'item'},ids:[...attachments.keys()].filter(id=>id!==ids.attachmentId)}))).status,200);assert.equal(attachments.get(ids.attachmentId).purpose,'LABEL');
  assert.equal((await routes.purpose(request({purpose:'LABEL'}),context('ready-1'))).status,200);assert.equal(attachments.get('ready-1').purpose,'LABEL');
  reset(10);const failed=await(await routes.reserve(request(body({replaceAttachmentId:'ready-0'})))).json();test.failCommit=true;
  assert.equal((await routes.finalize(request({assetId:failed.assetId,replaceAttachmentId:'ready-0'}))).status,500);assert.ok(attachments.has('ready-0'));assert.equal(assets.get('ready-0').status,'READY');assert.ok(!test.blobs.some(([op,key])=>op==='del'&&JSON.stringify(key).includes('old/ready-0')));
  reset(10);const omitted=await(await routes.reserve(request(body({replaceAttachmentId:'ready-0'})))).json();assert.equal((await routes.finalize(request({assetId:omitted.assetId}))).status,409);assert.ok(attachments.has('ready-0'));assert.equal(rows({fileAsset:{status:'READY'}}).length,10);
  reset(10);const uncertain=await(await routes.reserve(request(body({replaceAttachmentId:'ready-0'})))).json();test.lostAck=true;assert.equal((await routes.finalize(request({assetId:uncertain.assetId,replaceAttachmentId:'ready-0'}))).status,200);assert.equal(assets.get(uncertain.assetId).status,'READY');assert.ok(attachments.has(uncertain.attachmentId));assert.ok(!attachments.has('ready-0'));assert.ok(!test.blobs.some(([op,key])=>op==='del'&&String(key).includes(assets.get(uncertain.assetId).storageKey)));
  console.log('PASS: committed replacement survives a lost transaction acknowledgement; READY content is not cleaned up');
  console.log('PASS: real attachment routes enforce session/origin/owner/store, label-image/item scope, private content, product-only ordering, label marketplace exclusion, 10 READY limit/one temporary slot, atomic replacement rollback, idempotent finalization; DB/blob/identity/bytes are models, no real network');
}finally{if(env===undefined)delete process.env.BLOB_STORE_ID;else process.env.BLOB_STORE_ID=env;globalThis.fetch=originalFetch;delete globalThis.__labelRouteTest;}
