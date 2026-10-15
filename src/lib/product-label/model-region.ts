import {rawModelEvidence,isRegulatoryModelLine,validModelValue,type FieldSuggestion,type LabelLine} from "./extract";

// Coordinates select evidence, never substitute look-alike characters (S/5, O/0).
export function modelRegions(lines:LabelLine[],width:number,height:number) {
  return lines.flatMap(line=>{
    if(isRegulatoryModelLine(line.text))return [];
    const words=line.words??[];
    let index=-1,end=-1;
    for(let i=0;i<words.length&&index<0;i++)for(const count of [3,2,1]){
      if(i+count>words.length)continue;
      const joined=words.slice(i,i+count).map(word=>word.text).join("").replace(/[\s:：.]/g,"");
      if(/^(?:모델명|모델|형명|MODEL|MODELNO|MODELNAME|MODELNUMBER)$/i.test(joined)){index=i;end=i+count-1;break;}
    }
    if(index<0)return [];
    const label=words[end];
    let value=words.slice(end+1).find(word=>!/^(?:[:：|]|NO\.?|NAME|NUMBER)$/i.test(word.text.trim()));
    if(!value){
      const height=Math.max(1,label.bbox.y1-label.bbox.y0);
      const below=lines.filter(other=>other!==line&&!isRegulatoryModelLine(other.text)).flatMap(other=>other.words??[]).filter(word=>validModelValue(word.text)&&word.bbox.y0>=label.bbox.y1&&word.bbox.y0-label.bbox.y1<height*1.5&&Math.abs(word.bbox.x0-label.bbox.x0)<height*2);
      if(below.length!==1)return [];value=below[0];
    }else if(value.bbox.x0<label.bbox.x1||value.bbox.x0-label.bbox.x1>(label.bbox.y1-label.bbox.y0)*5)return [];
    if(/^(?:용량|정격|소비전력|일련번호|시리얼|capacity|rated|voltage|power|serial|s\/?n)\s*[:：]?$/i.test(value.text.trim()))return [];
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

export type ModelReading={text:string;confidence:number;mode?:string};
// User-selected policy: the explicit model in the displayed first-pass text
// takes precedence over auxiliary crops. MEDIUM means editable/review needed,
// not a measured OCR probability. Existing/manual inputs remain reducer-owned.
export function resolveModelReadings(text:string,initial:FieldSuggestion,readings:ModelReading[]):FieldSuggestion {
  const raw=rawModelEvidence(text);
  if(raw.values.length===1)return {value:raw.values[0],score:.60,confidence:'MEDIUM',reason:'인식된 글자의 모델명 표시를 그대로 입력합니다. 사진과 비교해 수정할 수 있습니다.'};
  if(raw.values.length>1)return {value:raw.values[0],candidates:raw.values.slice(0,4),score:0,confidence:'LOW',reason:'원문에 서로 다른 모델명이 있어 자동 입력하지 않았습니다.'};
  const compared=compareModelReadings(initial,readings);
  if(!raw.hasLabel&&compared.value)return {...compared,score:Math.min(.59,compared.score),confidence:'LOW',reason:'원문에서 명시적인 모델명 표시를 확인하지 못했습니다.'};
  return compared;
}
// Same-engine scale repetition is not independent confirmation. Competing
// labelled/full-image and crop readings remain visible but never auto-fill.
export function compareModelReadings(initial:FieldSuggestion,readings:ModelReading[]):FieldSuggestion {
  const valid=readings.map(reading=>({...reading,value:validModelValue(reading.text)})).filter(reading=>reading.value&&Number.isFinite(reading.confidence)&&reading.confidence>=40);
  const values=[...new Set([initial.value,...(initial.candidates??[]),...valid.map(reading=>reading.value)].filter(Boolean))].slice(0,4);
  if(!values.length)return initial;
  const best=valid.toSorted((a,b)=>b.confidence-a.confidence)[0];
  if(values.length>1)return {value:best?.value??values[0],candidates:values,score:Math.min(.59,(best?.confidence??initial.score*100)/100),confidence:'LOW',reason:'판독 결과가 서로 달라 자동 입력하지 않았습니다. 사진과 후보를 비교해 직접 입력해 주세요.'};
  const modes=new Set(valid.map(reading=>reading.mode).filter(Boolean));
  if(modes.size>=2&&valid.every(reading=>reading.confidence>=60))return {value:values[0],score:Math.min(.79,Math.min(...valid.map(reading=>reading.confidence))/100),confidence:'MEDIUM',reason:'모델 라벨 영역의 서로 다른 판독 방식이 일치했습니다. 혼동 문자 치환 없이 읽었으며 사용자 확인이 필요합니다.'};
  if(initial.value)return initial;
  return {value:values[0],score:Math.min(.59,(best?.confidence??0)/100),confidence:'LOW',reason:'판독 방식의 일치 또는 신뢰도가 충분하지 않은 모델 후보입니다. 사진과 비교해 직접 입력해 주세요.'};
}
export function modelCropEvidence(readings:ModelReading[]) {
  const valid=readings.map(reading=>({value:reading.text.trim(),score:reading.confidence})).filter(reading=>Number.isFinite(reading.score)&&reading.score>=40&&!isRegulatoryModelLine(reading.value)&&/^(?=.*[A-Z])(?=.*\d)[A-Z0-9][A-Z0-9._/-]{2,59}$/i.test(reading.value));
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
