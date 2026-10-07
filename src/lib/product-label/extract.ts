export type LabelFields = { brand:string; name:string; modelName:string; manufacturedAt:string; serialNumber:string; category:string };
export type FieldKey = keyof LabelFields;
export type LabelLine = { text:string; confidence:number; bbox?:{x0:number;y0:number;x1:number;y1:number}; words?:{text:string;bbox:{x0:number;y0:number;x1:number;y1:number}}[] };
export type FieldSuggestion = { value:string; confidence:"HIGH"|"MEDIUM"|"LOW"; score:number; reason:string };
export type LabelRecognition = { fields:LabelFields; suggestions:Record<FieldKey,FieldSuggestion>; confidence:number; text:string };
export const emptyLabelFields=():LabelFields=>({brand:"",name:"",modelName:"",manufacturedAt:"",serialNumber:"",category:""});
const keys:FieldKey[]=["brand","name","modelName","manufacturedAt","serialNumber","category"];
const labels:Record<Exclude<FieldKey,"category">,RegExp>={
  brand:/^(?:제조\s*(?:사|업체|자)|브랜드|manufacturer|brand)(?=\s|[:：]|$)\s*[:：]?\s*/i,
  name:/^(?:제품\s*명칭|제품\s*명|제품|품명|product\s*name|product)(?=\s|[:：]|$)\s*[:：]?\s*/i,
  modelName:/^(?:모델\s*(?:명|번호)?|형명|model(?:\s*(?:no\.?|name|number))?)(?=\s|[:：]|$)\s*[:：]?\s*/i,
  serialNumber:/^(?:일련\s*번호|제조\s*번호|시리얼\s*(?:번호)?|serial(?:\s*(?:no\.?|number))?|s\/?n)(?=\s|[:：]|$)\s*[:：]?\s*/i,
  manufacturedAt:/^(?:제조\s*(?:년월|일자|일)|date\s+of\s+manufacture|manufactur(?:ed|ing)\s*(?:date)?|mfg(?:\s*date)?)(?=\s|[:：]|$)\s*[:：]?\s*/i,
};
const brands=[{name:"삼성전자",pattern:/(?:삼성(?:전자)?|\bSAMSUNG\b)/i},{name:"LG전자",pattern:/(?:엘지전자|LG\s*전자|\bLG(?:\s+ELECTRONICS)?\b)/i},{name:"위니아",pattern:/(?:위니아|\bWINIA\b)/i},{name:"캐리어",pattern:/(?:캐리어|\bCARRIER\b)/i},{name:"쿠쿠",pattern:/(?:쿠쿠|\bCUCKOO\b)/i},{name:"쿠첸",pattern:/(?:쿠첸|\bCUCHEN\b)/i}];
function validValue(key:FieldKey,raw:string):string {
  const value=raw.trim().replace(/[;，,]+$/g,"");
  if(key==="serialNumber"&&/^\d{6,60}$/.test(value))return value;
  if(key==="modelName"||key==="serialNumber")return /^(?=.*[A-Z])(?=.*\d)[A-Z0-9][A-Z0-9._/-]{2,59}$/i.test(value)?value:"";
  if(key==="manufacturedAt"){
    const match=value.match(/^(\d{4})(?:[-./년\s]*)(\d{2}|\d)(?:[-./월\s]*)(\d{2}|\d)(?:일)?$/);
    if(!match)return "";const y=+match[1],m=+match[2],d=+match[3],date=new Date(Date.UTC(y,m-1,d));
    return y>=1900&&y<=new Date().getFullYear()&&date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d?y+"-"+String(m).padStart(2,"0")+"-"+String(d).padStart(2,"0"):"";
  }
  if(!value||value.length>(key==="brand"?80:120)||Object.values(labels).some(pattern=>pattern.test(value)))return "";
  return key==="brand"?brands.find(b=>b.pattern.test(value))?.name??value:value;
}
// Evidence scores are conservative heuristics, NOT calibrated accuracy probabilities.
export function extractProductLabel(text:string,confidence:number,layout:LabelLine[]=[],corroboratingText?:string,modelEvidence?:{value:string;score:number}|null):LabelRecognition {
  const fields=emptyLabelFields();
  const suggestions=Object.fromEntries(keys.map(key=>[key,{value:"",confidence:"LOW",score:0,reason:"확실한 라벨 값 없음"}])) as Record<FieldKey,FieldSuggestion>;
  const lines:LabelLine[]=layout.length?layout:text.split(/\r?\n/).filter(line=>line.trim()).map(text=>({text,confidence}));
  const conflicts=new Set<FieldKey>();
  function offer(key:FieldKey,value:string,score:number,reason:string){
    if(!value||!Number.isFinite(score)||conflicts.has(key))return;const current=suggestions[key];
    if(current.value&&current.value!==value){conflicts.add(key);suggestions[key]={value:"",confidence:"LOW",score:0,reason:"서로 다른 후보가 있어 제안하지 않습니다."};return;}
    if(score/100<current.score)return;
    suggestions[key]={value,score:Math.max(0,Math.min(100,score))/100,confidence:score>=90?"HIGH":score>=60?"MEDIUM":"LOW",reason};
  }
  for(const key of Object.keys(labels) as Exclude<FieldKey,"category">[]){
    const pattern=labels[key];
    lines.forEach((line,index)=>{
      const clean=line.text.trim().replace(/^[|│]+\s*/,""),match=clean.match(pattern);if(!match)return;
      const tail=clean.slice(match[0].length).trim();
      let value=validValue(key,tail),score=Math.min(98,line.confidence),reason="명시적 라벨과 같은 행의 값";
      if(!tail){
        const box=line.bbox,height=box?Math.max(1,box.y1-box.y0):0;
        const adjacent=box?lines.filter(other=>other!==line&&other.bbox).filter(other=>{const b=other.bbox!;const overlap=Math.min(b.y1,box.y1)-Math.max(b.y0,box.y0);return (b.x0>=box.x1&&b.x0-box.x1<height*12&&overlap>=height*.5)||(b.y0>=box.y1&&b.y0-box.y1<height*1.5&&Math.abs(b.x0-box.x0)<height*2);}).filter(other=>validValue(key,other.text)):[];
        if(adjacent.length===1){value=validValue(key,adjacent[0].text);score=Math.min(line.confidence,adjacent[0].confidence,94);reason="라벨 오른쪽/바로 아래의 단일 후보";}
        else if(!box&&lines[index+1]){value=validValue(key,lines[index+1].text);score=Math.min(line.confidence,lines[index+1].confidence,75);reason="다음 행 후보: 위치 확인 필요";}
      }
      if((key==="modelName"||key==="serialNumber")&&layout.length){
        const agreement=corroboratingText?.split(/\r?\n/).some(other=>{const matched=other.trim().match(pattern);return matched&&validValue(key,other.trim().slice(matched[0].length))===value;});
        if(!agreement){score=Math.min(score,79);reason+=" · 두 번째 인식에서 일치 확인 안 됨";}
      }
      offer(key,value,score,reason);
    });
  }
  if(modelEvidence)offer("modelName",validValue("modelName",modelEvidence.value),modelEvidence.score,"모델 라벨 바로 오른쪽 확대 인식 · 혼동 문자 치환 없음 · 사용자 확인 필요");
  if(!suggestions.brand.value&&!conflicts.has("brand")){const found=brands.filter(b=>b.pattern.test(text));if(found.length===1)offer("brand",found[0].name,Math.min(75,confidence),"로고/주변 브랜드 표기: 제조사 확인 필요");}
  const product=suggestions.name;
  const category=/(냉장고|세탁기|건조기|에어컨|청소기|텔레비전|\bTV\b|refrigerator|washing machine|dryer|air conditioner|vacuum)/i.test(product.value)?"APPLIANCE":/(모니터|노트북|컴퓨터|monitor|laptop|computer)/i.test(product.value)?"DIGITAL":/(의자|책상|식탁|소파|chair|desk|table|sofa)/i.test(product.value)?"FURNITURE":"";
  if(category)offer("category",category,product.score*100,"명시적 제품명에 따른 분류");
  for(const key of keys)if(suggestions[key].confidence==="HIGH")fields[key]=suggestions[key].value;
  return {fields,suggestions,confidence:Number.isFinite(confidence)?confidence:0,text};
}
