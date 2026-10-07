import type { LabelLine } from "./extract";

// Coordinates select evidence, never substitute look-alike characters (S/5, O/0).
export function modelRegions(lines:LabelLine[],width:number,height:number) {
  return lines.flatMap(line=>{
    const words=line.words??[];
    let index=-1,end=-1;
    for(let i=0;i<words.length&&index<0;i++)for(const count of [3,2,1]){
      const joined=words.slice(i,i+count).map(word=>word.text).join("").replace(/[\s:：.]/g,"");
      if(/^(?:모델명|모델|형명|MODEL|MODELNO|MODELNAME|MODELNUMBER)$/i.test(joined)){index=i;end=i+count-1;break;}
    }
    if(index<0)return [];
    const label=words[end];
    const value=words.slice(end+1).find(word=>!/^(?:[:：|]|NO\.?|NAME|NUMBER)$/i.test(word.text.trim()));
    if(!value||value.bbox.x0<label.bbox.x1||value.bbox.x0-label.bbox.x1>(label.bbox.y1-label.bbox.y0)*5)return [];
    const box=value.bbox;
    const left=Math.max(0,box.x0-3),top=Math.max(0,box.y0-3);
    return [{left,top,width:Math.min(width,box.x1+3)-left,height:Math.min(height,box.y1+3)-top}];
  }).slice(0,2);
}

// Bounded fallback when full-image segmentation misses the model label entirely.
export function modelSearchBands(width:number,height:number){
  const bandHeight=Math.ceil(height/8),step=Math.max(1,Math.floor(height/16));
  return Array.from({length:16},(_,i)=>({left:Math.floor(width*.2),top:i*step,width:Math.floor(width*.6),height:Math.min(bandHeight,height-i*step)})).filter(band=>band.height>8);
}

export type ModelReading={text:string;confidence:number};
export function modelCropEvidence(readings:ModelReading[]) {
  const valid=readings.map(reading=>({value:reading.text.trim().replace(/^[:：]\s*/,""),score:reading.confidence})).filter(reading=>Number.isFinite(reading.score)&&reading.score>=40&&/^(?=.*[A-Z])(?=.*\d)[A-Z0-9][A-Z0-9._/-]{2,59}$/i.test(reading.value));
  const values=new Set(valid.map(reading=>reading.value));
  if(values.size!==1)return null;
  const candidate=valid[0];
  // Spatial model-label evidence + agreement across original/enhanced OCR permits
  // MEDIUM even when the full photo has poor confidence. This is a heuristic,
  // not a probability. Competing readable candidates remain rejected above.
  const scores=valid.map(reading=>reading.score),minimum=Math.min(...scores);
  const repeated=valid.length>=2&&scores.reduce((sum,score)=>sum+score,0)/scores.length>=50;
  return {value:candidate.value,score:repeated?Math.min(98,Math.max(60,minimum)):Math.min(79,minimum)};
}
