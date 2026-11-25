import {it,expect} from 'vitest';
import {act,setup,actor,type State,type Shuffle,type Action} from './game';
import {trainCandidates} from './expansion-cycle-helpers';
import {baseCycleAction} from './cycle-driver';
import {TRAIN_CHARACTER_IDS} from './train';
const identity:Shuffle=a=>[...a];
for(const seed of [1,2,3,4])it(`train full four-player game and undo / seed ${seed}`,()=>{
 let r=seed*1349;const shuffle:Shuffle=<T>(a:T[])=>{const b=[...a];for(let i=b.length-1;i>0;i--){r=(Math.imul(r,1664525)+1013904223)>>>0;const j=r%(i+1);[b[i],b[j]]=[b[j],b[i]];}if(b.includes('benny' as T)){const ids=seed%2?TRAIN_CHARACTER_IDS.slice(0,4):TRAIN_CHARACTER_IDS.slice(4);return [...ids,...b.filter(v=>!ids.includes(v as string))] as T[];}return b;};
 let g=setup(4,shuffle,['train','dodge','valley','highnoon','fistful']);for(const id of g.seats)g=act(g,id,{type:'ready'},shuffle).state;g=act(g,'0',{type:'start'},shuffle).state;
 let before=g,trainMoves=0,undos=0,lastTurn=0,turnTrain=0;
 for(let i=0;i<4000&&g.phase!=='finished';i++){
  if(lastTurn!==g.turn){lastTurn=g.turn;turnTrain=0;}const id=actor(g),candidates=trainCandidates(g,id);let chosen:Action|undefined;
  if(g.queue[0]?.kind==='train'||turnTrain<3)chosen=candidates.find(a=>!act(g,id,a,identity).error);
  if(!chosen)chosen=baseCycleAction(g);const result=act(g,id,chosen,shuffle);expect(result.error,JSON.stringify({seed,i,chosen,q:g.queue[0],log:g.log.slice(-5)})).toBeUndefined();before=g;g=result.state;if(candidates.some(a=>JSON.stringify(a)===JSON.stringify(chosen))){trainMoves++;turnTrain++;}
  if(g.phase!=='finished'){
   const cards=[...g.deck,...g.discard,...g.train!.deck,...g.train!.cars,...Object.values(g.players).flatMap(p=>[...p.hand,...p.table]),...(g.painPending??[]).flatMap(p=>p.cards),...g.queue.flatMap(q=>[...(q.kind==='train'&&q.trainTask==='cattle'?[]:q.cards??[]),...q.pool??[],...q.prefix??[],...q.kept??[]])];
   expect(cards.length,JSON.stringify({seed,i,chosen,q:g.queue})).toBe(168);expect(new Set(cards.map(c=>c.id)).size).toBe(168);
  }
  if(i%19===0){const m=act(g,'0',{type:'mode',enabled:true},shuffle).state;const u=act(m,'0',{type:'undo'},shuffle);expect(u.error).toBeUndefined();expect(u.state.train).toEqual(before.train);expect(u.state.players).toEqual(before.players);expect(u.state.queue).toEqual(before.queue);undos++;}
 }
 expect(g.phase).toBe('finished');expect(g.winners.length).toBeGreaterThan(0);expect(trainMoves).toBeGreaterThan(0);expect(undos).toBeGreaterThan(0);
});
