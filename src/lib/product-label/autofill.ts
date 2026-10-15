import type { FieldKey, LabelFields } from "./extract";

export type LabelProposal={value:string;confidence:"HIGH"|"MEDIUM"|"LOW"};
export type LabelAnalysisSource="photo"|"ai";
type PhotoUndo=Partial<Record<FieldKey,{value:string;manual?:boolean}>>;
export type LabelFormState={fields:LabelFields;automatic:Partial<Record<FieldKey,LabelProposal>>;manual:Partial<Record<FieldKey,boolean>>;photoUndo?:PhotoUndo};
export type LabelFormAction=
  | {type:"analyzed";suggestions:Partial<Record<FieldKey,LabelProposal>>}
  | {type:"photoStarted"}
  | {type:"photoAnalyzed";suggestions:Partial<Record<FieldKey,LabelProposal>>}
  | {type:"edited";key:FieldKey;value:string}
  | {type:"discard"};

// Pure form-state changes only: never stores data or adds/uploads a photo.
export function labelFormReducer(state:LabelFormState,action:LabelFormAction):LabelFormState {
  const fields={...state.fields},automatic={...state.automatic},manual={...state.manual};
  const photoUndo=state.photoUndo?{...state.photoUndo}:undefined;
  if(action.type==="photoStarted"){
    // Starting/cancelling a new run must not undo the preceding photo's values.
    delete automatic.brand;delete automatic.modelName;
    return {fields,automatic,manual,photoUndo:{}};
  }
  if(action.type==="photoAnalyzed"){
    const undo:PhotoUndo={};
    delete automatic.brand;delete automatic.modelName;
    for(const key of ["brand","modelName"] as const){
      const suggestion=action.suggestions[key];
      if(!suggestion?.value.trim()||suggestion.confidence==="LOW")continue;
      // Snapshot at application, including edits made while OCR was running.
      undo[key]={value:fields[key],manual:manual[key]};
      fields[key]=suggestion.value;automatic[key]=suggestion;delete manual[key];
    }
    return {fields,automatic,manual,photoUndo:undo};
  }
  if(action.type==="edited"){
    fields[action.key]=action.value;manual[action.key]=true;delete automatic[action.key];
    if(photoUndo)delete photoUndo[action.key];
  }else if(action.type==="discard"){
    if(photoUndo){
      for(const key of Object.keys(photoUndo) as FieldKey[]){
        const before=photoUndo[key]!;
        if(!manual[key]&&fields[key]===automatic[key]?.value){
          fields[key]=before.value;
          if(before.manual===undefined)delete manual[key];else manual[key]=before.manual;
          delete automatic[key];
        }
      }
      return {fields,automatic,manual};
    }
    for(const key of Object.keys(automatic) as FieldKey[]){
      if(!manual[key]&&fields[key]===automatic[key]?.value)fields[key]="";
    }
    return {fields,automatic:{},manual};
  }else{
    for(const key of Object.keys(action.suggestions) as FieldKey[]){
      const suggestion=action.suggestions[key];
      if(!suggestion?.value||suggestion.confidence==="LOW"||fields[key].trim()||manual[key])continue;
      fields[key]=suggestion.value;automatic[key]=suggestion;
    }
  }
  return {fields,automatic,manual,...(photoUndo?{photoUndo}:{})};
}
