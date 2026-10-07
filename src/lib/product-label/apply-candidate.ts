import { emptyLabelFields, type FieldKey, type FieldSuggestion, type LabelFields } from "./extract";

// Called only by the user's Apply button. No API, Blob, or save side effects.
export function applyConfirmedCandidate(key:FieldKey,suggestion:FieldSuggestion,onApply:(fields:LabelFields)=>boolean) {
  if(!suggestion.value)return false;
  return onApply({...emptyLabelFields(),[key]:suggestion.value});
}
