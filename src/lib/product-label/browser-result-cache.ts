import type {LabelRecognition} from './extract';

// Page-session results only. No image bytes, disk, DB or browser storage.
export class BrowserResultCache {
  private entries=new Map<string,{expires:number;result:LabelRecognition}>();
  read(key:string,now=Date.now()):LabelRecognition|undefined{
    const entry=this.entries.get(key);
    if(!entry)return;
    if(entry.expires<=now){this.entries.delete(key);return;}
    return structuredClone(entry.result);
  }
  write(key:string,result:LabelRecognition,now=Date.now()){
    while(this.entries.size>=3)this.entries.delete(this.entries.keys().next().value!);
    this.entries.set(key,{expires:now+5*60_000,result:structuredClone(result)});
  }
}
