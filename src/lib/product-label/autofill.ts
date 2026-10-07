import type { FieldKey, LabelFields } from "./extract";

export type LabelProposal={value:string;confidence:"HIGH"|"MEDIUM"|"LOW"};
export type LabelFormState={fields:LabelFields;automatic:Partial<Record<FieldKey,LabelProposal>>;manual:Partial<Record<FieldKey,boolean>>};
export type LabelFormAction=
  | {type:"analyzed";suggestions:Partial<Record<FieldKey,LabelProposal>>}
  | {type:"edited";key:FieldKey;value:string}
  | {type:"discard"};

// Pure form-state changes only: never stores data or adds/uploads a photo.
export function labelFormReducer(state:LabelFormState,action:LabelFormAction):LabelFormState {
  const fields={...state.fields},automatic={...state.automatic},manual={...state.manual};
  if(action.type==="edited"){
    fields[action.key]=action.value;manual[action.key]=true;delete automatic[action.key];
  }else if(action.type==="discard"){
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
  return {fields,automatic,manual};
}
