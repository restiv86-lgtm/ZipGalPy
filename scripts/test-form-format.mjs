import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
const root=path.resolve(import.meta.dirname,'..'),require=createRequire(path.join(root,'package.json'));
const esbuild=createRequire(require.resolve('tsx/package.json'))('esbuild');
const built=await esbuild.build({stdin:{contents:`export * from './src/lib/forms/format';export {formDateSchema,formMoneySchema} from './src/lib/forms/validation';export {homeItemSchema} from './src/lib/home-item/validation';export {repairSchema,scheduleSchema} from './src/lib/home-management/validation';export {expenseSchema} from './src/lib/home-expense/validation';export {contractSchema} from './src/lib/home-contract/validation';export {documentSchema} from './src/lib/home-document/validation';export {marketplaceSchema} from './src/lib/community/validation';`,resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs',packages:'external',alias:{'@':root+'/src'}});
const compiled={exports:{}};new Function('module','exports','require',built.outputFiles[0].text)(compiled,compiled.exports,require);const api=compiled.exports;
for(const [input,expected]of [['',''],[0,'0'],['0001234','1,234'],['123456789','123,456,789'],['₩ 1,234 원','1,234'],['１２３４','1,234'],['-123','-123'],['1.5','1.5']])assert.equal(api.formatCurrencyInput(input),expected);
assert.equal(api.parseCurrencyValue('12,345'),'12345');assert.equal(api.parseCurrencyValue('1.5'),'1.5');assert.equal(api.parseCurrencyValue('-1'),'-1');
for(const [input,expected]of [['',''],['2026','2026'],['202610','2026-10'],['20261016','2026-10-16'],['2026. 10. 16','2026-10-16'],['２０２６１０１６','2026-10-16']])assert.equal(api.formatDateInput(input),expected);
for(const date of ['0001-01-01','2000-02-29','2024-02-29','2026-10-16','9999-12-31'])assert.ok(api.isCompleteDate(date));
for(const date of ['0000-01-01','1900-02-29','2025-02-29','2026-04-31','2026-00-01','2026-13-01','2026-01-00','2026','2026-1-1'])assert.equal(api.isCompleteDate(date),false);
assert.deepEqual(api.formatNumericEdit('12934',3,'currency'),{value:'12,934',caret:4});assert.deepEqual(api.formatNumericEdit('20260216',6,'date'),{value:'2026-02-16',caret:7});
assert.deepEqual(api.deleteFormatSeparator('1,234',2,2,'Backspace','currency'),{value:'234',caret:0});assert.deepEqual(api.deleteFormatSeparator('1,234',1,1,'Delete','currency'),{value:'134',caret:1});assert.equal(api.deleteFormatSeparator('1,234',1,3,'Backspace','currency'),null);
assert.deepEqual(api.deleteFormatSeparator('2026-10-16',5,5,'Backspace','date'),{value:'2021-01-6',caret:3});assert.deepEqual(api.deleteFormatSeparator('2026-10-16',4,4,'Delete','date'),{value:'2026-01-6',caret:4});assert.deepEqual(api.formatNumericEdit('',0,'date'),{value:'',caret:0});
assert.equal(api.currencyInputError('0'),'');assert.equal(api.currencyInputError('99,999,999,999,999'),'');assert.ok(api.currencyInputError('100,000,000,000,000'));assert.ok(api.currencyInputError('0',1,2_000_000_000));assert.ok(api.currencyInputError('-1'));assert.ok(api.currencyInputError('1.5'));
for(const value of ['2026-02-30','2026-02','2026/10/16','2026-10-16T24:00','2026-10-16T12:60',null,0,''])assert.equal(api.formDateSchema.safeParse(value).success,false);
for(const value of ['2024-02-29','2026-10-16T09:30','2026-10-16T09:30:00.000Z',new Date('2026-10-16')])assert.ok(api.formDateSchema.parse(value) instanceof Date);
for(const value of [0,'0',99_999_999_999_999,'99999999999999'])assert.ok(api.formMoneySchema().safeParse(value).success);
for(const value of ['',null,'1,234','-1',-1,'1.5',1.5,'1e3',100_000_000_000_000])assert.equal(api.formMoneySchema().safeParse(value).success,false);
const cases=[
 [api.homeItemSchema,{name:'물건',category:'APPLIANCE'},['manufacturedAt','purchaseDate','warrantyUntil'],'purchasePrice'],
 [api.repairSchema,{title:'수리',description:'점검',type:'REPAIR',repairDate:'2026-10-16'},['repairDate','nextCheckDate'],'cost'],
 [api.expenseSchema,{title:'비용',category:'OTHER',amount:'0',expenseDate:'2026-10-16'},['expenseDate'],'amount'],
 [api.contractSchema,{title:'계약',type:'OTHER'},['startDate','endDate'],'amount'],
 [api.documentSchema,{title:'문서',type:'OTHER'},['issuedDate','expiresAt'],null],
 [api.scheduleSchema,{title:'일정',type:'OTHER',scheduledAt:'2026-10-16T09:00'},['scheduledAt'],null],
 ];
for(const [schema,base,dates,money]of cases){assert.ok(schema.safeParse(base).success);for(const field of dates){assert.equal(schema.safeParse({...base,[field]:'2026-02-30'}).success,false,field);const parsed=schema.parse({...base,[field]:'2024-02-29'});assert.ok(parsed[field] instanceof Date);}if(money){assert.equal(schema.safeParse({...base,[money]:'1,234'}).success,false);assert.equal(schema.parse({...base,[money]:'0'})[money],0);}}
assert.equal(api.marketplaceSchema.parse({type:'SELL',title:'가격',description:'테스트',price:2_000_000_000}).price,2_000_000_000);assert.equal(api.marketplaceSchema.safeParse({type:'SELL',title:'가격',description:'테스트',price:2_000_000_001}).success,false);assert.equal(api.marketplaceSchema.safeParse({type:'SELL',title:'가격',description:'테스트',price:0}).success,false);assert.equal(api.marketplaceSchema.parse({type:'GIVEAWAY',title:'나눔',description:'테스트',price:0}).price,0);
console.log('PASS: date/currency typing and paste, empty/partial values, separator deletion/caret, leap years, 0/ranges, all 11 date and 5 money validation fields, Date/number API output and rejection of comma/invalid dates; no network/data writes');
