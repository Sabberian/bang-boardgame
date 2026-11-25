import {allCycleCandidates as candidates} from './all-cycle-candidates';
import {it,expect} from 'vitest';
import {act,setup,actor,playerView,type State,type Action,type Shuffle} from './game';
import {trainCandidates} from './expansion-cycle-helpers';
import {baseCycleAction} from './cycle-driver';
import {legendsCycleCandidates} from './legends-cycle-candidates';
import {armedSources,armedLoads,armedSupply} from './armed-runtime';
import {CARDS,type Card} from './content';

function physical(g:State){
 const cards:Card[]=[...g.deck,...g.discard,...Object.values(g.players).flatMap(p=>[...p.hand,...p.table]),...g.train?.deck??[],...g.train?.cars??[],...g.painPending?.flatMap(x=>x.cards)??[]];
 for(const q of g.queue){if(q.kind==='train'&&q.trainTask==='cattle'||q.kind==='legend-jesse')continue;cards.push(...q.cards??[],...q.kept??[],...q.prefix??[],...q.pool??[]);}
 return cards;
}
const sets=['dodge','valley','gold','wildwest','highnoon','fistful','armed','train','promos'];
for(const shadows of [false,true])for(const legends of [false,true])for(const seed of [1,2,3,4])it(`all official sets / four seats / legends ${legends} / shadows ${shadows} / seed ${seed}`,()=>{
 let random=seed*881;const shuffle:Shuffle=<T>(a:T[])=>{const b=[...a];for(let i=b.length-1;i>0;i--){random=(Math.imul(random,1664525)+1013904223)>>>0;const j=random%(i+1);[b[i],b[j]]=[b[j],b[i]];}return b;};
 let g=setup(4,shuffle,[...sets,...(legends?['legends']:[]),...(shadows?['shadows']:[])]);for(const id of g.seats)g=act(g,id,{type:'ready'},shuffle).state;g=act(g,'0',{type:'start'},shuffle).state;
 expect(g.phase).toBe('play');const count=physical(g).length;let actions=0,undos=0;
 for(;actions<4000&&g.phase==='play';actions++){
  const id=actor(g),a=candidates(g,id).find(a=>!act(g,id,a,items=>[...items]).error);
  expect(a,JSON.stringify({actions,id,q:g.queue[0],hand:g.players[id].hand.map(c=>c.kind)})).toBeTruthy();
  const before=structuredClone(g),r=act(g,id,a!,shuffle);expect(r.error,JSON.stringify(a)).toBeUndefined();g=r.state;
  const cards=physical(g);expect(new Set(cards.map(c=>c.id)).size,`card duplication after ${JSON.stringify(a)}`).toBe(cards.length);expect(cards.length,`lost cards after ${JSON.stringify(a)}`).toBe(count);
  if(g.armed)expect(armedSupply(g)).toBeGreaterThanOrEqual(0);
  for(const viewer of g.seats){const v=playerView(g,viewer);expect(v.deck).toEqual([]);expect(v.train?.deck??[]).toEqual([]);expect(v.undo).toBeUndefined();for(const other of g.seats)if(other!==viewer&&g.wws!=='sacagaway')expect(v.players[other].hand).toEqual([]);}
  if(actions%19===0||g.phase==='finished'){let u=act(g,id,{type:'mode',enabled:true},shuffle).state;u=act(u,id,{type:'undo'},shuffle).state;expect(u.phase).toBe(before.phase);expect(u.players).toEqual(before.players);expect(u.deck).toEqual(before.deck);expect(u.train).toEqual(before.train);expect(u.armed).toEqual(before.armed);undos++;}
 }
 expect(g.phase,`deadlock after ${actions}`).toBe('finished');expect(g.winners.length).toBeGreaterThan(0);expect(undos).toBeGreaterThan(0);
},60000);
