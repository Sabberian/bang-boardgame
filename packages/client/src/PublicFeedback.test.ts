import {describe,it,expect} from 'vitest';
import {publicFeedback,type PublicSnapshot} from './PublicFeedback';
const before:PublicSnapshot={revision:2,phase:'play',manual:false,log:['Первый ход.','Выстрел.'],players:{'0':{name:'Шериф',hp:4},'1':{name:'Игрок 2',hp:3}}};
describe('public handoff receipts',()=>{
 it('keeps damage and source visible when capped log shifts',()=>{
  const result=publicFeedback(before,{...before,revision:3,log:['Выстрел.','Шериф теряет 1 жизнь: Бэнг! Игрока 2.'],players:{...before.players,'0':{name:'Шериф',hp:3}}});
  expect(result?.lines).toEqual(['Шериф теряет 1 жизнь: Бэнг! Игрока 2.']);
  expect(result?.health).toEqual([{id:'0',name:'Шериф',before:4,after:3,kind:'damage'}]);
 });
 it('does not replay effects when switching private views at the same revision',()=>{
  expect(publicFeedback(before,{...before})).toBeNull();
 });
 it('describes undo as correction and does not replay restored historical log lines',()=>{
  const result=publicFeedback({...before,revision:8,players:{...before.players,'0':{name:'Шериф',hp:0}}},{...before,revision:9,manual:true,log:['Старая запись.','Шериф отменяет последнее действие. Уже увиденные карты нельзя забыть.']});
  expect(result?.lines).toHaveLength(1);expect(result?.lines[0]).toContain('отменяет');
  expect(result?.health[0].kind).toBe('correction');expect(result?.health[0].after).toBe(4);
 });
 it('does not animate dealt starting life as healing',()=>{
  expect(publicFeedback({...before,phase:'lobby'}, {...before,revision:3})).toBeNull();
 });
 it('reports actual capped healing and clears feedback for an otherwise silent revision',()=>{
  const result=publicFeedback(before,{...before,revision:3,players:{...before.players,'1':{name:'Игрок 2',hp:4}}});
  expect(result?.health).toEqual([{id:'1',name:'Игрок 2',before:3,after:4,kind:'heal'}]);
  expect(publicFeedback(before,{...before,revision:3})).toBeNull();
 });
});
