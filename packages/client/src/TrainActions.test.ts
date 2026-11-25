import {it,expect} from 'vitest';
import {setup,act,type Action,type Shuffle} from '../../engine/src/game';
import {trainCardIntent,trainIntentPlayer,trainFanningTargetsValid} from './TrainActions';
const shuffle:Shuffle=a=>[...a];
it('Money Bag copying Fanning selects two targets and resolves both shots',()=>{
 let g=setup(4,shuffle,['train','valley']);
 for(const id of g.seats)g=act(g,id,{type:'ready'},shuffle).state;
 g=act(g,'0',{type:'start'},shuffle).state;
 g.active='0';g.drawn=true;g.queue=[];g.bangs=0;
 for(const p of Object.values(g.players)){p.character='bart';p.table=[];p.hand=[];p.alive=true;p.hp=4;p.maxHp=4;}
 const card={id:'bag',kind:'moneybag',suit:'H' as const,rank:5};
 g.players['0'].hand=[card];g.discard=[{id:'fan',kind:'fanning',suit:'H',rank:5}];
 let a:Action=trainCardIntent(g,'0',card,'0','hand')!;
 expect(a).toBeTruthy();
 a=trainIntentPlayer(g,'0',a,'1')!;
 expect(trainFanningTargetsValid(g,'0',a)).toBe(false);
 a=trainIntentPlayer(g,'0',a,'1')!;
 expect(trainFanningTargetsValid(g,'0',a)).toBe(false);
 a=trainIntentPlayer(g,'0',a,'2')!;
 expect(a.target).toBe('1');expect(a.target2).toBe('2');
 expect(trainFanningTargetsValid(g,'0',a)).toBe(true);
 const result=act(g,'0',a,shuffle);
 expect(result.error).toBeUndefined();
 expect(result.state.queue.filter(q=>q.kind==='shot').map(q=>q.player)).toEqual(['1','2']);
});
