import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import type { HomeItemInput } from "./validation";
const data=(input:HomeItemInput)=>({...input,purchasePrice:input.purchasePrice==null?null:new Prisma.Decimal(input.purchasePrice)});
export async function listOwnedItems(userId:string,homeId:string){const home=await getPrisma().home.findFirst({where:{id:homeId,userId},select:{id:true,name:true}});if(!home)return null;return{home,items:await getPrisma().homeItem.findMany({where:{homeId},orderBy:{createdAt:"desc"}})}}
export function getOwnedItem(userId:string,homeId:string,itemId:string){return getPrisma().homeItem.findFirst({where:{id:itemId,homeId,home:{userId}},include:{home:{select:{id:true,name:true}},marketplacePosts:{select:{id:true,apartmentId:true,type:true,status:true},orderBy:{createdAt:"desc"},take:5}}})}
export async function createOwnedItem(userId:string,homeId:string,input:HomeItemInput){if(!await getPrisma().home.findFirst({where:{id:homeId,userId},select:{id:true}}))return null;return getPrisma().homeItem.create({data:{...data(input),homeId}})}
export async function updateOwnedItem(userId:string,homeId:string,itemId:string,input:HomeItemInput){const result=await getPrisma().homeItem.updateMany({where:{id:itemId,homeId,home:{userId}},data:data(input)});return result.count?getOwnedItem(userId,homeId,itemId):null}
export async function deleteOwnedItem(userId:string,homeId:string,itemId:string){return (await getPrisma().homeItem.deleteMany({where:{id:itemId,homeId,home:{userId}}})).count===1}
