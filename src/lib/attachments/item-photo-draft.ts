export type ItemImage = {id:string;fileName:string;contentUrl:string;mimeType:string;purpose:string};
export type DraftPhoto = {key:string;id?:string;file?:File;url:string;name:string;purpose:string;originalPurpose?:string;replaceId?:string};
export type PhotoSavePorts = {
  list:(id:string)=>Promise<{files:ItemImage[]}>;
  upload:(file:File,id:string,purpose:"PHOTO"|"LABEL",replaceId?:string)=>Promise<string>;
  remove:(id:string)=>Promise<void>;
  purpose:(id:string,purpose:"LABEL"|"PHOTO")=>Promise<void>;
  order:(id:string,ids:string[])=>Promise<void>;
};
const hashes=new WeakMap<File,Promise<string>>();
function fingerprint(file:File){let hash=hashes.get(file);if(!hash){hash=file.arrayBuffer().then(bytes=>crypto.subtle.digest("SHA-256",bytes)).then(bytes=>Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,"0")).join(""));hashes.set(file,hash);}return hash;}
export function validateItemPhoto(file:File){if(!["image/jpeg","image/png","image/webp"].includes(file.type)||!file.size||file.size>10*1024*1024)throw new Error("JPG/PNG/WebP 사진을 10MB 이하로 선택해 주세요.");}

// All draft operations are local. Only save() uses attachment write ports.
export class ItemPhotoDraft {
  photos:DraftPhoto[]=[];
  otherCount=0;
  readonly removed=new Set<string>();
  replaceId?:string;
  private labelUndo?:{key:string;previous?:DraftPhoto};
  private generation=0;
  private urls=new Set<string>();
  load(files:ItemImage[]){this.otherCount=files.filter(f=>!f.mimeType.startsWith("image/")).length;this.photos=files.filter(f=>f.mimeType.startsWith("image/")).map(f=>({key:f.id,id:f.id,url:f.contentUrl,name:f.fileName,purpose:f.purpose,originalPurpose:f.purpose}));}
  get visible(){const replaced=new Set(this.photos.map(p=>p.replaceId).filter(Boolean));return this.photos.filter(p=>!p.id||!replaced.has(p.id));}
  get products(){return this.visible.filter(p=>p.purpose!=="LABEL");}
  get labels(){return this.visible.filter(p=>p.purpose==="LABEL");}
  get savedImages(){return this.photos.filter(p=>p.id&&!this.removed.has(p.id)).map(p=>({id:p.id!,fileName:p.name,contentUrl:p.url,mimeType:"image/webp",purpose:p.purpose}));}
  assertLimit(){if(this.visible.length+this.otherCount>10)throw new Error("물건 첨부는 사진·라벨·PDF를 합쳐 최대 10개입니다.");}
  startReplacement(id:string){this.discardLabel();if(!this.photos.some(p=>p.id===id&&p.purpose==="LABEL"))throw new Error("교체할 라벨을 찾지 못했습니다.");this.replaceId=id;}
  discardLabel(){this.generation++;const undo=this.labelUndo;if(undo){const p=this.photos.find(p=>p.key===undo.key);if(p&&!p.id&&p.file&&!undo.previous){this.release(p);this.photos=this.photos.filter(p=>p.key!==undo.key);}else if(undo.previous){this.photos=this.photos.map(p=>p.key===undo.key?undo.previous!:p);}}this.labelUndo=undefined;this.replaceId=undefined;}
  async add(file:File,purpose:"PHOTO"|"LABEL"="PHOTO",sourceId?:string){
    validateItemPhoto(file);const generation=++this.generation;
    const hash=sourceId?null:await fingerprint(file);
    if(generation!==this.generation)return;
    const replaceId=this.replaceId;
    const existingSource=sourceId?this.photos.find(p=>p.id===sourceId):undefined;
    if(sourceId&&!existingSource)throw new Error("저장된 사진이 변경되었습니다. 새로고침 후 다시 시도해 주세요.");
    const filePhotos=this.photos.filter(p=>p.file);
    const matches=hash?await Promise.all(filePhotos.map(async p=>(await fingerprint(p.file!))===hash?p.key:null)):[];
    if(generation!==this.generation)return;
    const match=existingSource??this.photos.find(p=>matches.includes(p.key));
    if(purpose==="PHOTO"&&match)return;
    if(purpose==="LABEL"){
      // Select/replace only the latest pending OCR input. Other product edits survive undo.
      const matchingKey=match?.key;this.discardLabel();this.replaceId=replaceId;
      const retained=this.photos.find(p=>p.key===matchingKey);
      if(retained){if(replaceId&&retained.id===replaceId||retained.purpose==="LABEL"&&!replaceId){this.replaceId=undefined;return;}this.labelUndo={key:retained.key,previous:{...retained}};retained.purpose="LABEL";retained.replaceId=replaceId;return;}
    }
    const effectiveCount=this.visible.length+this.otherCount-(purpose==="LABEL"&&replaceId?1:0);
    if(effectiveCount>=10)throw new Error("사진·라벨·PDF를 합쳐 물건당 최대 10개입니다. 기존 첨부를 삭제하거나 라벨 교체를 선택해 주세요.");
    const url=URL.createObjectURL(file);this.urls.add(url);const p:DraftPhoto={key:crypto.randomUUID(),file,url,name:file.name,purpose,...(purpose==="LABEL"&&replaceId?{replaceId}:{})};this.photos.push(p);if(purpose==="LABEL")this.labelUndo={key:p.key};
  }
  remove(key:string){if(this.labelUndo?.key===key){this.discardLabel();return;}const p=this.photos.find(p=>p.key===key);if(!p)return;if(p.id)this.removed.add(p.id);else this.release(p);this.photos=this.photos.filter(p=>p.key!==key);if(this.replaceId===p.id)this.replaceId=undefined;}
  move(from:number,to:number){const products=this.products;if(to<0||to>=products.length)return;const [photo]=products.splice(from,1);products.splice(to,0,photo);this.photos=[...products,...this.photos.filter(p=>p.purpose==="LABEL")];}
  async save(itemId:string,ports:PhotoSavePorts){
    const server=await ports.list(itemId);this.otherCount=server.files.filter(f=>!f.mimeType.startsWith("image/")).length;this.assertLimit();
    const serverIds=new Set(server.files.map(f=>f.id));
    const replacing=new Set(this.photos.map(p=>p.replaceId));
    if(this.photos.some(p=>p.id&&!serverIds.has(p.id)&&!replacing.has(p.id)))throw new Error("저장된 사진이 변경되었습니다. 새로고침 후 다시 시도해 주세요.");
    for(const id of [...this.removed]){await ports.remove(id);this.removed.delete(id);}
    for(const photo of this.photos){if(!photo.id&&photo.file){photo.id=await ports.upload(photo.file,itemId,photo.purpose==="LABEL"?"LABEL":"PHOTO",photo.replaceId);photo.originalPurpose=photo.purpose;}}
    // Keep the old label until the new upload/finalization succeeds; retain IDs for retry.
    for(const photo of this.photos){if(photo.id&&photo.originalPurpose!==photo.purpose){await ports.purpose(photo.id,photo.purpose==="LABEL"?"LABEL":"PHOTO");photo.originalPurpose=photo.purpose;}}
    for(const photo of [...this.photos]){if(photo.replaceId){await ports.remove(photo.replaceId);this.photos=this.photos.filter(p=>p.id!==photo.replaceId);photo.replaceId=undefined;}}
    await ports.order(itemId,this.products.map(p=>p.id!));this.labelUndo=undefined;this.replaceId=undefined;
  }
  private release(photo:DraftPhoto){if(this.urls.delete(photo.url))URL.revokeObjectURL(photo.url);}
  dispose(){for(const url of this.urls)URL.revokeObjectURL(url);this.urls.clear();this.generation++;}
}
