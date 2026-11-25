import {it,expect} from 'vitest';
import {writeFileSync} from 'node:fs';
import {act,setup,actor,playerView,targets,type State,type Action,type Shuffle} from './game';
import {allCycleCandidates} from './all-cycle-candidates';
import {CARDS,type Card} from './content';
import {armedSupply} from './armed-runtime';
const identity:Shuffle=a=>[...a];
const sets=['dodge','valley','gold','wildwest','highnoon','fistful','armed','train','promos','legends','shadows'];
const move=(g:State,id:string,a:Action,shuffle=identity)=>{const r=act(g,id,a,shuffle);expect(r.error,JSON.stringify(a)).toBeUndefined();return r.state;};
function start(shuffle=identity){let g=setup(4,shuffle,sets);for(const id of g.seats)g=move(g,id,{type:'ready'},shuffle);return move(g,'0',{type:'start'},shuffle);}
function physical(g:State){const cards:Card[]=[...g.deck,...g.discard,...Object.values(g.players).flatMap(p=>[...p.hand,...p.table]),...g.train?.deck??[],...g.train?.cars??[],...g.painPending?.flatMap(x=>x.cards)??[]];for(const q of g.queue){if(q.kind==='train'&&q.trainTask==='cattle'||q.kind==='legend-jesse')continue;cards.push(...q.cards??[],...q.kept??[],...q.prefix??[],...q.pool??[]);}return cards;}
for(const seed of [154867])it(`fitted interaction complete all-set game ${seed}`,()=>{
 let random=seed;const shuffle:Shuffle=<T>(a:T[])=>{const b=[...a];for(let i=b.length-1;i>0;i--){random=(Math.imul(random,1103515245)+12345)>>>0;const j=random%(i+1);[b[i],b[j]]=[b[j],b[i]];}return b;};
 let g=start(shuffle);const initial=physical(g).length;const trace:{id:string;action:Action}[]=[];const counts:Record<string,number>={};let undoChecks=0;
 for(let n=0;n<5000&&g.phase==='play';n++){
  const id=actor(g),p=g.players[id],q=g.queue[0];const options:Action[]=[];
  // Fresh adversarial policy rotates targets and tries real defense cards instead of always taking damage.
  if(q&&['shot','duel','indians'].includes(q.kind)&&n%3!==0){for(const c of p.hand)options.push({type:'respond',card:c.id});options.push({type:'barrel'});}
  const inherited=allCycleCandidates(g,id);options.push(...inherited.filter(a=>a.type.startsWith('legend-')));
  if(!q&&!g.discarding){for(const c of p.hand){if(!['bang','duel','indians','gatling','punch'].includes(c.kind))continue;const ts=targets(g,id,c);const offset=(seed+n)%Math.max(1,ts.length);for(const target of [...ts.slice(offset),...ts.slice(0,offset)])options.push({type:'play',card:c.id,target,cost:p.hand.find(x=>x.id!==c.id)?.id});}}
  options.push(...inherited,{type:'end'});const chosen=options.find(a=>!act(g,id,a,identity).error);if(!chosen)writeFileSync(`docs/qa/fitted-interaction-stall-${seed}.json`,JSON.stringify({g,options,errors:options.map(a=>act(g,id,a,identity).error)},null,2));expect(chosen,JSON.stringify({seed,n,id,q})).toBeTruthy();
  const before=structuredClone(g);g=move(g,id,chosen!,shuffle);trace.push({id,action:chosen!});counts[chosen!.type]=(counts[chosen!.type]??0)+1;
  const cards=physical(g);expect(cards.length,`conservation seed ${seed} action ${n}`).toBe(initial);expect(new Set(cards.map(c=>c.id)).size).toBe(cards.length);expect(armedSupply(g)).toBeGreaterThanOrEqual(0);
  for(const viewer of [...g.seats,null]){const v=playerView(g,viewer);expect(v.deck).toEqual([]);expect(v.train?.deck).toEqual([]);expect(v.legends?.deck).toEqual([]);expect(v.undo).toBeUndefined();for(const other of g.seats)if(other!==viewer&&g.wws!=='sacagaway')expect(v.players[other].hand).toEqual([]);}
  if(n%23===0||g.phase==='finished'){let u=move(g,id,{type:'mode',enabled:true},shuffle);u=move(u,id,{type:'undo'},shuffle);for(const key of ['players','deck','discard','queue','train','armed','legends','legendTurn','phase'] as const)expect(u[key]).toEqual(before[key]);undoChecks++;}
  if(n===5&&g.phase==='play'){
   // Exercise reversible manual repair through actions; no repair influences the completed match.
   let repair=move(g,id,{type:'mode',enabled:true},shuffle);const repairBefore=structuredClone(repair);repair=move(repair,id,{type:'manual-draw',target:g.active},shuffle);repair=move(repair,id,{type:'undo'},shuffle);expect(repair.players).toEqual(repairBefore.players);expect(repair.deck).toEqual(repairBefore.deck);
  }
 }
 const result={seed,actions:trace.length,winners:g.winners,winningRole:g.winningRole,phase:g.phase,turn:g.turn,counts,undoChecks,trace};writeFileSync(`docs/qa/fitted-interaction-${seed}.json`,JSON.stringify(result,null,2));console.log(JSON.stringify({...result,trace:undefined}));expect(g.phase).toBe('finished');expect(g.winners.length).toBeGreaterThan(0);
},120000);
