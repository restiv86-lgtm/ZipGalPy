import type { LabelLine } from "./extract";

// Coordinates select evidence, never substitute look-alike characters (S/5, O/0).
export function modelRegions(lines:LabelLine[],width:number,height:number) {
  return lines.flatMap(line=>{
    const words=line.words??[];
    const index=words.findIndex(word=>/^(?:모델명|모델|형명|MODEL)$/i.test(word.text.trim()));
    if(index<0)return [];
    const label=words[index];
    const value=words.slice(index+1).find(word=>!/^(?:[:：|]|NO\.?|NAME|NUMBER)$/i.test(word.text.trim()));
    if(!value||value.bbox.x0<label.bbox.x1||value.bbox.x0-label.bbox.x1>(label.bbox.y1-label.bbox.y0)*5)return [];
    const box=value.bbox;
    const left=Math.max(0,box.x0-3),top=Math.max(0,box.y0-3);
    return [{left,top,width:Math.min(width,box.x1+3)-left,height:Math.min(height,box.y1+3)-top}];
  }).slice(0,2);
}

export type ModelReading={text:string;confidence:number};
export function modelCropEvidence(readings:ModelReading[]) {
  const valid=readings.map(reading=>({value:reading.text.trim(),score:reading.confidence})).filter(reading=>/^(?=.*[A-Z])(?=.*\d)[A-Z0-9][A-Z0-9._/-]{2,59}$/i.test(reading.value));
  const values=new Set(valid.map(reading=>reading.value));
  if(values.size!==1)return null;
  const candidate=valid[0];
  return {value:candidate.value,score:Math.min(...valid.map(reading=>reading.score),valid.length>=2?98:79)};
}
