import {it,expect} from 'vitest';
import fs from 'node:fs';
import {act,type State} from './game';

it('strict round2: fatal Lucky Dynamite check advances beyond the dead active seat',()=>{
 const stalled=JSON.parse(fs.readFileSync('docs/qa/strict-network-round2-stall.json','utf8')) as State;
 const before=stalled.undo!;
 expect(before.queue[0].kind).toBe('check');
 expect(before.queue[0].check).toBe('dynamite');
 expect(before.players['2'].hp).toBe(3);
 const result=act(before,'2',{type:'choose',card:'armed-11'},items=>[...items]);
 expect(result.error).toBeUndefined();
 expect(result.state.players['2'].alive).toBe(false);
 expect(result.state.active).not.toBe('2');
 expect(result.state.queue.length>0||result.state.drawn||result.state.phase==='finished').toBe(true);
});
