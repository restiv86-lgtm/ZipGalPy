import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
const root=path.resolve(import.meta.dirname,'..'),require=createRequire(path.join(root,'package.json'));
const esbuild=createRequire(require.resolve('tsx/package.json'))('esbuild');
const built=await esbuild.build({stdin:{contents:`export {ItemPhotoDraft,validateItemPhoto} from './src/lib/attachments/item-photo-draft';export {attachItemLabel} from './src/lib/attachments/upload-client';`,resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs'});
const compiled={exports:{}};new Function('module','exports','require',built.outputFiles[0].text)(compiled,compiled.exports,require);
const {ItemPhotoDraft,validateItemPhoto,attachItemLabel}=compiled.exports;
const file=(text='label',name='label.jpg')=>new File([text],name,{type:'image/jpeg'});
const image=(id,purpose='PHOTO')=>({id,purpose,fileName:id+'.webp',contentUrl:'/local/'+id,mimeType:'image/webp'});
function server(initial=[]){const files=new Map(initial.map(f=>[f.id,f])),calls=[],state={uploadFailure:false,orderFailure:false};let seq=0;return{files,calls,state,ports:{list:async()=>({files:[...files.values()]}),upload:async(f,id,purpose,replace)=>{calls.push(['upload',purpose,replace]);if(state.uploadFailure)throw Error('upload failed');const key='new-'+(++seq);files.set(key,image(key,purpose));if(replace)files.delete(replace);return key;},remove:async id=>{calls.push(['delete',id]);files.delete(id);},purpose:async(id,purpose)=>{calls.push(['purpose',id,purpose]);files.get(id).purpose=purpose;},order:async(id,ids)=>{calls.push(['order',...ids]);assert.ok(ids.every(id=>files.get(id)?.purpose!=='LABEL'));if(state.orderFailure){state.orderFailure=false;throw Error('order failed');}}}};}
const originalFetch=globalThis.fetch;globalThis.fetch=async()=>{throw Error('Real network forbidden');};
try{
  const draft=new ItemPhotoDraft(),a=file('same','photo.jpg'),b=file('same','renamed.jpg');
  await draft.add(a);await draft.add(b);assert.equal(draft.photos.length,1);
  await draft.add(b,'LABEL');assert.equal(draft.products.length,0);assert.equal(draft.labels.length,1);
  draft.discardLabel();assert.equal(draft.products.length,1);assert.equal(draft.labels.length,0);
  await draft.add(file('different'),'LABEL');assert.equal(draft.labels.length,1);
  await draft.add(file('replacement'),'LABEL');assert.equal(draft.labels.length,1);assert.equal(draft.photos.length,2);
  const s=server();s.state.orderFailure=true;
  await assert.rejects(draft.save('item',s.ports),/order failed/);assert.equal(s.calls.filter(c=>c[0]==='upload').length,2);
  await draft.save('item',s.ports);assert.equal(s.calls.filter(c=>c[0]==='upload').length,2);assert.equal([...s.files.values()].filter(f=>f.purpose==='LABEL').length,1);
  const edit=new ItemPhotoDraft(),stored=[image('old-label','LABEL'),...Array.from({length:9},(_,i)=>image('p'+i))];edit.load(stored);edit.startReplacement('old-label');await edit.add(file('new-label'),'LABEL');assert.equal(edit.visible.length,10);
  const replacement=server(stored);replacement.state.uploadFailure=true;
  await assert.rejects(edit.save('item',replacement.ports),/upload failed/);assert.ok(replacement.files.has('old-label'));assert.equal(replacement.calls.filter(c=>c[0]==='delete').length,0);
  replacement.state.uploadFailure=false;replacement.state.orderFailure=true;await assert.rejects(edit.save('item',replacement.ports),/order failed/);assert.equal(replacement.files.size,10);assert.ok(!replacement.files.has('old-label'));
  const count=replacement.calls.filter(c=>c[0]==='upload').length;await edit.save('item',replacement.ports);assert.equal(replacement.calls.filter(c=>c[0]==='upload').length,count);
  const cancelled=new ItemPhotoDraft();cancelled.load([image('kept','LABEL')]);cancelled.startReplacement('kept');await cancelled.add(file('cancel'),'LABEL');cancelled.discardLabel();assert.equal(cancelled.labels[0].id,'kept');assert.equal(cancelled.photos.length,1);
  const reused=new ItemPhotoDraft();reused.load([image('cover','COVER'),image('stored-label','LABEL')]);await reused.add(file('optimized'),'LABEL','cover');const reuseServer=server([image('cover','COVER'),image('stored-label','LABEL')]);await reused.save('item',reuseServer.ports);assert.equal(reuseServer.calls.filter(c=>c[0]==='upload').length,0);assert.equal(reuseServer.files.get('cover').purpose,'LABEL');
  const full=new ItemPhotoDraft();full.load([...Array.from({length:9},(_,i)=>image('f'+i)),{...image('pdf'),mimeType:'application/pdf'}]);await assert.rejects(full.add(file('too-many'),'LABEL'),/10/);assert.equal(full.photos.length,9);
  assert.throws(()=>validateItemPhoto(new File(['bad'],'label.pdf',{type:'application/pdf'})));assert.throws(()=>validateItemPhoto(new File([],'empty.jpg',{type:'image/jpeg'})));assert.throws(()=>validateItemPhoto(new File([new Uint8Array(10*1024*1024+1)],'large.jpg',{type:'image/jpeg'})));
  for(const d of [draft,edit,cancelled,reused,full])d.dispose();
  console.log('PASS: local-only selection/cancel, byte-identical draft dedup, separate label role, saved-image reuse, PDF-inclusive limits, full-capacity replacement, old-label retention on failure, completed-ID retry and product-only ordering');

  let auth=0,put=0,finalize=0,fail=true;const selected=file('transport');
  globalThis.fetch=async(url,options={})=>{if(url==='/api/attachments'&&options.method==='POST'){auth++;const body=JSON.parse(options.body);assert.equal(body.purpose,'LABEL');assert.equal(body.replaceAttachmentId,'old');return Response.json({assetId:'asset',attachmentId:'attachment',uploadUrl:'https://invalid.example/local-only'});}if(options.method==='PUT'){put++;return new Response(null,{status:200});}if(url==='/api/attachments/finalize'){finalize++;assert.equal(JSON.parse(options.body).replaceAttachmentId,'old');if(fail)throw Error('lost finalize response');return Response.json({ok:true});}if(String(url).startsWith('/api/attachments?'))throw Error('offline');throw Error('Unexpected test request '+url);};
  await assert.rejects(attachItemLabel(selected,'item','LABEL','old'),/lost finalize/);fail=false;assert.equal(await attachItemLabel(selected,'item','LABEL','old'),'attachment');assert.equal(auth,1);assert.equal(put,1);assert.equal(finalize,2);
  console.log('PASS: uncertain finalize response retries same reservation/bytes; no duplicate upload or deletion of successfully replaced label; all network mocked');
  let invalid=true,created=0,deleted=0;const rejectedFile=file('rejected');
  globalThis.fetch=async(url,options={})=>{if(url==='/api/attachments'&&options.method==='POST'){created++;return Response.json({assetId:'rejected-'+created,attachmentId:'new-'+created,uploadUrl:'https://invalid.example/local-only'});}if(options.method==='PUT')return new Response(null,{status:200});if(url==='/api/attachments/finalize')return invalid?Response.json({error:'invalid image'},{status:400}):Response.json({ok:true});if(String(url).startsWith('/api/attachments?'))return Response.json({files:[]});if(options.method==='DELETE'){assert.ok(String(url).startsWith('/api/attachments/new-'));deleted++;return new Response(null,{status:404});}throw Error('unexpected mocked request');};
  await assert.rejects(attachItemLabel(rejectedFile,'item','LABEL','old'),/invalid image/);invalid=false;await attachItemLabel(rejectedFile,'item','LABEL','old');assert.equal(created,2);assert.equal(deleted,1);
  console.log('PASS: explicit rejected upload cleans only its new reservation and can retry; old label never targeted by client cleanup');
}finally{globalThis.fetch=originalFetch;}
