// Execute the real form/capture handlers with isolated hooks and a deferred OCR
// provider. This is a shallow component regression, not a browser/photo test.
import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
const root=path.resolve(import.meta.dirname,'..');
const require=createRequire(path.join(root,'package.json'));
const esbuild=createRequire(require.resolve('tsx/package.json'))('esbuild');
const hooks=`
const scopes=new Map();let active;
export function render(id,Component,props){let scope=scopes.get(id);if(!scope){scope={slots:[],cursor:0};scopes.set(id,scope);}scope.cursor=0;active=scope;return Component(props);}
export function useState(initial){const scope=active,index=scope.cursor++;if(!scope.slots[index])scope.slots[index]={value:typeof initial==='function'?initial():initial};const cell=scope.slots[index];return [cell.value,value=>{cell.value=typeof value==='function'?value(cell.value):value;}];}
export function useReducer(reducer,initial){const [value,setValue]=useState(initial);return [value,action=>setValue(previous=>reducer(previous,action))];}
export function useRef(value){return useState({current:value})[0];}
export function useId(){return useState('label-test')[0];}
export function useEffect(){} // Effects omitted: no account/config requests.
`;
const ocr=`export const pending=[];export const browserLabelOcr={recognize(file,signal){return new Promise((resolve,reject)=>pending.push({file,signal,resolve,reject}));}};`;
const stubs={
  hooks,ocr,
  jsx:`export const Fragment='fragment';export const jsx=(type,props,key)=>({type,props:props??{},key});export const jsxs=jsx;`,
  navigation:`export const useRouter=()=>({push(){throw Error('Unexpected navigation');},refresh(){throw Error('Unexpected refresh');}});`,
  link:`export default 'link-stub';`,
  photos:`export const ItemPhotoEditor='photo-editor-stub';`,
  attachments:`export const AttachmentPanel='attachment-stub';`,
  inputs:`export const FormattedDateInput='date-input-stub';export const FormattedCurrencyInput='currency-input-stub';`,
  css:`export default {};`,
};
const built=await esbuild.build({
  stdin:{contents:`export {HomeItemForm} from './src/components/home-item/home-item-form';export {ProductLabelCapture} from './src/components/home-item/product-label-capture';export {render} from 'test:hooks';export {pending} from 'test:ocr';export {extractProductLabel} from './src/lib/product-label/extract';export {resolveModelReadings} from './src/lib/product-label/model-region';`,resolveDir:root,loader:'ts'},
  bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',alias:{'@':root+'/src'},
  plugins:[{name:'isolated-ui',setup(build){
    build.onResolve({filter:/.*/},args=>{
      let key;
      if(args.path==='react'||args.path==='test:hooks')key='hooks';
      else if(args.path==='react/jsx-runtime')key='jsx';
      else if(args.path==='test:ocr'||args.path.endsWith('/browser-ocr'))key='ocr';
      else if(args.path==='next/navigation')key='navigation';
      else if(args.path==='next/link')key='link';
      else if(args.path.endsWith('/item-photo-editor'))key='photos';
      else if(args.path.endsWith('/attachment-panel'))key='attachments';
      else if(args.path.endsWith('/formatted-inputs'))key='inputs';
      else if(args.path.endsWith('.css'))key='css';
      if(key)return {path:key,namespace:'isolated'};
    });
    build.onLoad({filter:/.*/,namespace:'isolated'},args=>({contents:stubs[args.path],loader:'js'}));
  }}],
});
const compiled={exports:{}};
new Function('module','exports','require',built.outputFiles[0].text)(compiled,compiled.exports,require);
const api=compiled.exports;
function nodes(node){if(!node||typeof node!=='object')return [];return [node,...[node.props?.children].flat(Infinity).flatMap(nodes)];}
function find(tree,predicate){const found=nodes(tree).find(predicate);assert.ok(found,'Expected rendered element missing');return found;}
const flush=()=>new Promise(setImmediate);
const recognition=(model,brand='LG전자')=>{
  const text=`모델명: ${model}\n제조사: ${brand}`;
  const result=api.extractProductLabel(text,95);
  result.suggestions.modelName=api.resolveModelReadings(text,result.suggestions.modelName,[]);
  return result;
};
let networkCalls=0;
const originalFetch=globalThis.fetch;
globalThis.fetch=async()=>{networkCalls++;throw Error('Network/save/AI forbidden in component regression');};
try{
  for(const mode of ['create','edit']){
    const item=mode==='edit'?{id:'ITEM',name:'USER ITEM',category:'DIGITAL',brand:'OLD BRAND',modelName:'OLD-123',manufacturedAt:new Date('2020-01-02'),serialNumber:'OLD-SN9',purchaseDate:new Date('2021-01-02'),purchasePrice:{toString:()=> '12345'},warrantyUntil:new Date('2023-01-02'),memo:'USER MEMO',status:'USING'}:undefined;
    const formProps={homeId:'HOME',item};
    const form=()=>api.render(mode+'-form',api.HomeItemForm,formProps);
    const field=id=>find(form(),node=>node.props.id===id).props;
    find(form(),node=>node.type==='button'&&node.props['aria-expanded']===false).props.onClick();
    const capture=()=>api.render(mode+'-capture',api.ProductLabelCapture,find(form(),node=>node.type===api.ProductLabelCapture).props);
    const select=name=>find(capture(),node=>node.type==='input'&&node.props.type==='file').props.onChange({target:{files:[new File(['test'],name,{type:'image/jpeg'})]}});
    async function start(){const promise=find(capture(),node=>node.type==='button'&&node.props.children==='라벨 인식하기').props.onClick();await flush();return {promise,call:api.pending.at(-1)};}
    const finish=async(run,result)=>{run.call.resolve(result);await run.promise;};
    const undo=()=>find(capture(),node=>node.type==='button'&&node.props.children==='분석 결과 취소 · 자동 반영 되돌리기').props.onClick();
    const beforeOther=Object.fromEntries(['manufacturedAt','serialNumber','purchaseDate','purchasePrice','warrantyUntil','memo','name','category'].map(id=>[id,{value:field(id).value,defaultValue:field(id).defaultValue}]));
    field('brand').onChange({target:{value:'MANUAL BRAND'}});
    field('modelName').onChange({target:{value:'MANUAL-123'}});
    select('A.jpg');assert.equal(field('modelName').value,'MANUAL-123');
    const a=await start();
    select('B.jpg');assert.equal(a.call.signal.aborted,true);assert.equal(field('modelName').value,'MANUAL-123');
    const b=await start();await finish(b,recognition('NEW-456'));
    assert.equal(field('modelName').value,'NEW-456');assert.equal(field('brand').value,'LG전자');
    await finish(a,recognition('STALE-999','삼성전자'));
    assert.equal(field('modelName').value,'NEW-456');assert.equal(field('brand').value,'LG전자');
    for(const [id,old] of Object.entries(beforeOther))assert.deepEqual({value:field(id).value,defaultValue:field(id).defaultValue},old);

    // Selection alone preserves B. C has no brand: it must keep B's brand.
    select('C.jpg');assert.equal(field('modelName').value,'NEW-456');
    const c=await start();await finish(c,recognition('NEXT-789',''));
    assert.equal(field('modelName').value,'NEXT-789');assert.equal(field('brand').value,'LG전자');
    undo();assert.equal(field('modelName').value,'NEW-456');assert.equal(field('brand').value,'LG전자');
    const d=await start();
    find(capture(),node=>node.type==='button'&&node.props.children==='인식 취소').props.onClick();
    await finish(d,recognition('CANCELLED-123'));
    assert.equal(field('modelName').value,'NEW-456');
    const e=await start();await finish(e,recognition('LAST-456','삼성전자'));
    field('modelName').onChange({target:{value:'AFTER-987'}});
    undo();assert.equal(field('modelName').value,'AFTER-987');assert.equal(field('brand').value,'LG전자');
    console.log(`PASS: real ${mode} form/capture handlers, prior manual overwrite, photo replacement, reversed async completion, missing-brand preservation, exact undo, pending cancel, post-analysis edits, unrelated date/price/memo preservation`);
  }
  assert.equal(networkCalls,0);
}finally{globalThis.fetch=originalFetch;}
console.log('PASS: no DOM/browser engine, OCR/Next effects isolated; no network, external AI, item save or navigation');
