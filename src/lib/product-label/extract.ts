export type LabelFields = {
  brand: string; name: string; modelName: string; manufacturedAt: string;
  serialNumber: string; category: string;
};
export type LabelRecognition = { fields: LabelFields; confidence: number; text: string };
export const emptyLabelFields = (): LabelFields => ({brand:"",name:"",modelName:"",manufacturedAt:"",serialNumber:"",category:""});

// Extract only explicitly labelled values. Do not invent a product from a model prefix.
export function extractProductLabel(text: string, confidence: number): LabelRecognition {
  const fields = emptyLabelFields();
  const lines = text.replace(/[\u0000-\u0008\u000b-\u001f]/g,"").split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
  const find = (pattern: RegExp, max: number) => {
    for (const line of lines) {
      const match = line.match(pattern);
      if (match?.[1]?.trim()) return match[1].trim().slice(0,max);
    }
    return "";
  };
  // Low OCR confidence is not permission to guess. A user may enter everything manually.
  if (!Number.isFinite(confidence) || confidence < 45) return {fields,confidence:Number.isFinite(confidence)?confidence:0,text};
  fields.brand=find(/^(?:제조\s*(?:사|업체|자)|브랜드|manufacturer|brand)\s*[:：]\s*(.+)$/i,80);
  fields.name=find(/^(?:제품\s*명|품명|product\s*name)\s*[:：]\s*(.+)$/i,120);
  fields.modelName=find(/^(?:모델\s*(?:명|번호)?|model(?:\s*(?:name|no\.?|number))?)\s*[:：]\s*([A-Z0-9][A-Z0-9._ /-]*)$/i,120);
  fields.serialNumber=find(/^(?:시리얼\s*(?:번호)?|제조\s*번호|serial(?:\s*(?:no\.?|number))?|s\/?n)\s*[:：]\s*([A-Z0-9][A-Z0-9._/-]*)$/i,120);
  const date=find(/^(?:제조\s*(?:일자|일|년월)|manufactur(?:ed|ing)\s*(?:date)?|mfg(?:\s*date)?)\s*[:：]\s*(.+)$/i,40);
  const matched=date.match(/^(\d{4})[.\-/년\s]*(\d{1,2})[.\-/월\s]*(\d{1,2})(?:일)?(?:\s|$)/);
  if (matched) {
    const year=Number(matched[1]), month=Number(matched[2]), day=Number(matched[3]);
    const parsed=new Date(Date.UTC(year,month-1,day));
    if(year>=1900&&year<=new Date().getFullYear()&&parsed.getUTCFullYear()===year&&parsed.getUTCMonth()===month-1&&parsed.getUTCDate()===day) {
      fields.manufacturedAt=`${matched[1]}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    }
  }
  const product=fields.name.toLowerCase();
  if (/(냉장고|세탁기|건조기|에어컨|청소기|refrigerator|washing machine|dryer|air conditioner|vacuum)/.test(product)) fields.category="APPLIANCE";
  else if (/(모니터|노트북|컴퓨터|monitor|laptop|computer)/.test(product)) fields.category="DIGITAL";
  else if (/(의자|책상|식탁|소파|chair|desk|table|sofa)/.test(product)) fields.category="FURNITURE";
  return {fields,confidence,text};
}
