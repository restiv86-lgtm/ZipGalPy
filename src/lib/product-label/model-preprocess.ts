// Local image processing only; no character substitution or expected-model lookup.
export function enhanceModelPixels(rgba:Uint8ClampedArray,width:number,height:number){
  const gray=new Float32Array(width*height);let low=255,high=0;
  for(let i=0;i<gray.length;i++){
    const value=.299*rgba[i*4]+.587*rgba[i*4+1]+.114*rgba[i*4+2];
    gray[i]=value;low=Math.min(low,value);high=Math.max(high,value);
  }
  const normalized=Float32Array.from(gray,value=>(value-low)*255/Math.max(1,high-low));
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=y*width+x,value=normalized[i];
    const neighbours=(normalized[y*width+Math.max(0,x-1)]+normalized[y*width+Math.min(width-1,x+1)]+normalized[Math.max(0,y-1)*width+x]+normalized[Math.min(height-1,y+1)*width+x])/4;
    const sharp=Math.max(0,Math.min(255,value+.7*(value-neighbours)));
    rgba[i*4]=rgba[i*4+1]=rgba[i*4+2]=sharp;rgba[i*4+3]=255;
  }
  return rgba;
}
