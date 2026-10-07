import assert from "node:assert/strict";
import {emptyLabelFields} from "../src/lib/product-label/extract";
import {labelFormReducer,type LabelFormState} from "../src/lib/product-label/autofill";

const initial=():LabelFormState=>({fields:emptyLabelFields(),automatic:{},manual:{}});
const proposals={brand:{value:"LG전자",confidence:"MEDIUM" as const},name:{value:"냉장고",confidence:"HIGH" as const},modelName:{value:"S839S30",confidence:"LOW" as const}};
let state=labelFormReducer(initial(),{type:"analyzed",suggestions:proposals});
assert.equal(state.fields.brand,"LG전자");assert.equal(state.automatic.brand?.confidence,"MEDIUM");
assert.equal(state.fields.name,"냉장고");assert.equal(state.fields.modelName,"");
assert.deepEqual(labelFormReducer(state,{type:"discard"}),initial());
state=labelFormReducer(state,{type:"edited",key:"brand",value:"직접 입력한 제조사"});
state=labelFormReducer(state,{type:"analyzed",suggestions:{brand:{value:"삼성전자",confidence:"HIGH"},modelName:{value:"AI-MODEL1",confidence:"MEDIUM"}}});
assert.equal(state.fields.brand,"직접 입력한 제조사");assert.equal(state.fields.modelName,"AI-MODEL1");
state=labelFormReducer(state,{type:"discard"});
assert.equal(state.fields.brand,"직접 입력한 제조사");assert.equal(state.fields.modelName,"");assert.equal(state.fields.name,"");
state=labelFormReducer(state,{type:"edited",key:"modelName",value:""});
state=labelFormReducer(state,{type:"analyzed",suggestions:{modelName:{value:"S839S30",confidence:"HIGH"}}});
assert.equal(state.fields.modelName,""); // User-cleared input stays empty, even after new AI/OCR.
const existing={...initial(),fields:{...emptyLabelFields(),modelName:"EXISTING123",manufacturedAt:"2020-01-01"}};
const edited=labelFormReducer(existing,{type:"analyzed",suggestions:{modelName:{value:"S839S30",confidence:"HIGH"},manufacturedAt:{value:"2026-01-01",confidence:"MEDIUM"},brand:proposals.brand}});
assert.equal(edited.fields.modelName,"EXISTING123");assert.equal(edited.fields.manufacturedAt,"2020-01-01");
assert.deepEqual(labelFormReducer(edited,{type:"discard"}),existing);
const typedDuringAnalysis=labelFormReducer(initial(),{type:"edited",key:"manufacturedAt",value:"2026-10"});
assert.equal(labelFormReducer(typedDuringAnalysis,{type:"analyzed",suggestions:{manufacturedAt:{value:"2020-01-01",confidence:"HIGH"}}}).fields.manufacturedAt,"2026-10");
const repeat=labelFormReducer(labelFormReducer(initial(),{type:"analyzed",suggestions:proposals}),{type:"analyzed",suggestions:{brand:{value:"새 분석",confidence:"HIGH"}}});
assert.equal(repeat.fields.brand,"LG전자");assert.equal(repeat.automatic.brand?.confidence,"MEDIUM");
console.log("PASS: HIGH/MEDIUM empty-only autofill, LOW excluded, manual/existing/cleared/date protection, OCR/AI repeat protection, cancel rollback");
