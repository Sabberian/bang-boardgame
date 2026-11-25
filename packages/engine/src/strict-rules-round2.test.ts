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
function fixture(){const g=start();g.queue=[];g.active='0';g.drawn=true;g.event=undefined;g.wws=undefined;g.eventDeck=[];g.wwsDeck=[];for(const p of Object.values(g.players)){p.character='willy';p.hand=[];p.table=[];p.hp=4;p.maxHp=4;}return g;}
it('strict round2: committed boasting cannot be skipped before its mandatory token placement',()=>{
 let g=fixture();g.queue=[{kind:'legend-boast',player:'0'}];const fame=g.legends!.fame['0'];
 g=move(g,'0',{type:'legend-begin-boast'});expect(g.legends!.feats.length).toBe(2);
 const r=act(g,'0',{type:'legend-skip'},identity);expect(r.error).toBeTruthy();expect(r.state.legends!.fame['0']).toBe(fame);
});
it('strict round2: committed boasting cannot leave five revealed feats by skipping',()=>{
 let g=fixture();while(g.legends!.feats.length<4)g.legends!.feats.push({kind:g.legends!.deck.pop()!,tokens:{}});g.queue=[{kind:'legend-boast',player:'0'}];
 g=move(g,'0',{type:'legend-begin-boast'});expect(g.legends!.feats).toHaveLength(5);expect(act(g,'0',{type:'legend-skip'},identity).error).toBeTruthy();
});
it('strict round2: legendary Jesse theft triggers victim Refund',()=>{
 let g=fixture();g.players['0'].character='jesse';g.legends!.legendary=['0'];g.players['0'].legendary=true;
 g.players['1'].table=[{id:'refund-test',kind:'refund',suit:'S',rank:3}];g.players['1'].hand=[{id:'stolen-test',kind:'bang',suit:'H',rank:5}];
 g.drawn=false;g.queue=[{kind:'draw',player:'0'}];g=move(g,'0',{type:'draw',target:'1'});g=move(g,'0',{type:'legend-jesse',card:'stolen-test'});expect(g.players['1'].hand).toHaveLength(1);
});
function physical(g:State){const cards:Card[]=[...g.deck,...g.discard,...Object.values(g.players).flatMap(p=>[...p.hand,...p.table]),...g.train?.deck??[],...g.train?.cars??[],...g.painPending?.flatMap(x=>x.cards)??[]];for(const q of g.queue){if(q.kind==='train'&&q.trainTask==='cattle'||q.kind==='legend-jesse')continue;cards.push(...q.cards??[],...q.kept??[],...q.prefix??[],...q.pool??[]);}return cards;}
for(const seed of [19073,52811,90397,117803])it(`strict round2 complete all-set game ${seed}`,()=>{
 let random=seed;const shuffle:Shuffle=<T>(a:T[])=>{const b=[...a];for(let i=b.length-1;i>0;i--){random=(Math.imul(random,1103515245)+12345)>>>0;const j=random%(i+1);[b[i],b[j]]=[b[j],b[i]];}return b;};
 let g=start(shuffle);const initial=physical(g).length;const trace:{id:string;action:Action}[]=[];const counts:Record<string,number>={};let undoChecks=0;
 for(let n=0;n<5000&&g.phase==='play';n++){
  const id=actor(g),p=g.players[id],q=g.queue[0];const options:Action[]=[];
  // Fresh adversarial policy rotates targets and tries real defense cards instead of always taking damage.
  if(q&&['shot','duel','indians'].includes(q.kind)&&n%3!==0){for(const c of p.hand)options.push({type:'respond',card:c.id});options.push({type:'barrel'});}
  const inherited=allCycleCandidates(g,id);options.push(...inherited.filter(a=>a.type.startsWith('legend-')));
  if(!q&&!g.discarding){for(const c of p.hand){if(!['bang','duel','indians','gatling','punch'].includes(c.kind))continue;const ts=targets(g,id,c);const offset=(seed+n)%Math.max(1,ts.length);for(const target of [...ts.slice(offset),...ts.slice(0,offset)])options.push({type:'play',card:c.id,target,cost:p.hand.find(x=>x.id!==c.id)?.id});}}
  options.push(...inherited,{type:'end'});const chosen=options.find(a=>!act(g,id,a,identity).error);if(!chosen)writeFileSync(`docs/qa/strict-round2-stall-${seed}.json`,JSON.stringify({g,options,errors:options.map(a=>act(g,id,a,identity).error)},null,2));expect(chosen,JSON.stringify({seed,n,id,q})).toBeTruthy();
  const before=structuredClone(g);g=move(g,id,chosen!,shuffle);trace.push({id,action:chosen!});counts[chosen!.type]=(counts[chosen!.type]??0)+1;
  const cards=physical(g);expect(cards.length,`conservation seed ${seed} action ${n}`).toBe(initial);expect(new Set(cards.map(c=>c.id)).size).toBe(cards.length);expect(armedSupply(g)).toBeGreaterThanOrEqual(0);
  for(const viewer of [...g.seats,null]){const v=playerView(g,viewer);expect(v.deck).toEqual([]);expect(v.train?.deck).toEqual([]);expect(v.legends?.deck).toEqual([]);expect(v.undo).toBeUndefined();for(const other of g.seats)if(other!==viewer&&g.wws!=='sacagaway')expect(v.players[other].hand).toEqual([]);}
  if(n%23===0||g.phase==='finished'){let u=move(g,id,{type:'mode',enabled:true},shuffle);u=move(u,id,{type:'undo'},shuffle);for(const key of ['players','deck','discard','queue','train','armed','legends','legendTurn','phase'] as const)expect(u[key]).toEqual(before[key]);undoChecks++;}
  if(n===5&&g.phase==='play'){
   // Exercise reversible manual repair through actions; no repair influences the completed match.
   let repair=move(g,id,{type:'mode',enabled:true},shuffle);const repairBefore=structuredClone(repair);repair=move(repair,id,{type:'manual-draw',target:g.active},shuffle);repair=move(repair,id,{type:'undo'},shuffle);expect(repair.players).toEqual(repairBefore.players);expect(repair.deck).toEqual(repairBefore.deck);
  }
 }
 const result={seed,actions:trace.length,winners:g.winners,winningRole:g.winningRole,phase:g.phase,turn:g.turn,counts,undoChecks,trace};writeFileSync(`docs/qa/strict-round2-${seed}.json`,JSON.stringify(result,null,2));console.log(JSON.stringify({...result,trace:undefined}));expect(g.phase).toBe('finished');expect(g.winners.length).toBeGreaterThan(0);
},120000);


it('strict round2: legendary Rose table theft triggers Refund',()=>{
 let g=fixture();g.players['0'].character='rose';g.legends!.legendary=['0'];g.players['0'].legendary=true;
 g.players['0'].hand=[{id:'rose-cost',kind:'mustang',suit:'H',rank:5}];g.players['1'].table=[{id:'refund-test',kind:'refund',suit:'S',rank:3},{id:'scope-target',kind:'scope',suit:'S',rank:14}];
 g=move(g,'0',{type:'legend-rose',card:'rose-cost',target:'1',choice:'scope-target'});expect(g.players['1'].hand).toHaveLength(1);
});
it('strict round2: legendary Gringo retaliation theft triggers attacker Refund',()=>{
 let g=fixture();g.players['0'].character='gringo';g.legends!.legendary=['0'];g.players['0'].legendary=true;
 g.players['1'].table=[{id:'refund-test',kind:'refund',suit:'S',rank:3}];g.players['1'].hand=[{id:'stolen-test',kind:'beer',suit:'H',rank:5}];g.queue=[{kind:'shot',player:'0',source:'1',count:1}];
 g=move(g,'0',{type:'take-hit'});expect(g.players['1'].hand).toHaveLength(1);expect(g.players['0'].hand.some(c=>c.id==='stolen-test')).toBe(true);
});
for(const legendary of [false,true])it(`strict round2: final excess discard leaves Few claimable (legend=${legendary})`,()=>{
 let g=fixture();g.armed=undefined;g.train=undefined;g.legends!.feats=[{kind:'few',tokens:{}}];g.legends!.legendary=legendary?['0']:[];g.players['0'].legendary=legendary;g.players['0'].hand=Array.from({length:6},(_,i)=>({id:`excess-${i}`,kind:'bang',suit:'H' as const,rank:5}));
 g=move(g,'0',{type:'end'});g=move(g,'0',{type:'discard',card:'excess-0'});g=move(g,'0',{type:'discard',card:'excess-1'});
 expect(g.active).toBe('0');expect(g.queue).toEqual([]);const r=act(g,'0',{type:legendary?'legend-claim':'legend-perform',choice:'few'},identity);expect(r.error).toBeUndefined();
});
it('strict round2: Crossroad at discard limit can still claim feat then end without extra discard',()=>{
 let g=fixture();g.armed=undefined;g.train=undefined;g.players['0'].hand=Array.from({length:5},(_,i)=>({id:`limit-${i}`,kind:i===0?'missed':'bang',suit:'H' as const,rank:5}));g.legends!.feats=[{kind:'thousand',tokens:{}}];
 g=move(g,'0',{type:'end'});g=move(g,'0',{type:'legend-crossroad',choice:'thousand',cards:['limit-0']});expect(g.players['0'].hand).toHaveLength(4);g=move(g,'0',{type:'legend-perform',choice:'thousand'});g=move(g,'0',{type:'end'});expect(g.active).not.toBe('0');
});

