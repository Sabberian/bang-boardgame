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
for(const seed of [211163])it(`release November 21 complete all-set game ${seed}`,()=>{
 let random=seed;const shuffle:Shuffle=<T>(a:T[])=>{const b=[...a];for(let i=b.length-1;i>0;i--){random=(Math.imul(random,1103515245)+12345)>>>0;const j=random%(i+1);[b[i],b[j]]=[b[j],b[i]];}return b;};
 let g=start(shuffle);const initial=physical(g).length;const trace:{id:string;action:Action}[]=[];const counts:Record<string,number>={};let undoChecks=0;
 for(let n=0;n<5000&&g.phase==='play';n++){
  const id=actor(g),p=g.players[id],q=g.queue[0];const options:Action[]=[];
  // Fresh adversarial policy rotates targets and tries real defense cards instead of always taking damage.
  if(q&&['shot','duel','indians'].includes(q.kind)&&n%3!==0){for(const c of p.hand)options.push({type:'respond',card:c.id});options.push({type:'barrel'});}
  const inherited=allCycleCandidates(g,id);options.push(...inherited.filter(a=>a.type.startsWith('legend-')));
  if(!q&&!g.discarding){for(const c of p.hand){if(!['bang','duel','indians','gatling','punch'].includes(c.kind))continue;const ts=targets(g,id,c);const offset=(seed+n)%Math.max(1,ts.length);for(const target of [...ts.slice(offset),...ts.slice(0,offset)])options.push({type:'play',card:c.id,target,cost:p.hand.find(x=>x.id!==c.id)?.id});}}
  options.push(...inherited,{type:'end'});const chosen=options.find(a=>!act(g,id,a,identity).error);if(!chosen)writeFileSync(`docs/qa/release-nov21-stall-${seed}.json`,JSON.stringify({g,options,errors:options.map(a=>act(g,id,a,identity).error)},null,2));expect(chosen,JSON.stringify({seed,n,id,q})).toBeTruthy();
  const before=structuredClone(g);g=move(g,id,chosen!,shuffle);trace.push({id,action:chosen!});counts[chosen!.type]=(counts[chosen!.type]??0)+1;
  const cards=physical(g);expect(cards.length,`conservation seed ${seed} action ${n}`).toBe(initial);expect(new Set(cards.map(c=>c.id)).size).toBe(cards.length);expect(armedSupply(g)).toBeGreaterThanOrEqual(0);
  for(const viewer of [...g.seats,null]){const v=playerView(g,viewer);expect(v.deck).toEqual([]);expect(v.train?.deck).toEqual([]);expect(v.legends?.deck).toEqual([]);expect(v.undo).toBeUndefined();for(const other of g.seats)if(other!==viewer&&g.wws!=='sacagaway')expect(v.players[other].hand).toEqual([]);}
  if(n%23===0||g.phase==='finished'){let u=move(g,id,{type:'mode',enabled:true},shuffle);u=move(u,id,{type:'undo'},shuffle);for(const key of ['players','deck','discard','queue','train','armed','legends','legendTurn','phase'] as const)expect(u[key]).toEqual(before[key]);undoChecks++;}
  if(n===5&&g.phase==='play'){
   // Exercise reversible manual repair through actions; no repair influences the completed match.
   let repair=move(g,id,{type:'mode',enabled:true},shuffle);const repairBefore=structuredClone(repair);repair=move(repair,id,{type:'manual-draw',target:g.active},shuffle);repair=move(repair,id,{type:'undo'},shuffle);expect(repair.players).toEqual(repairBefore.players);expect(repair.deck).toEqual(repairBefore.deck);
  }
 }
 const result={seed,actions:trace.length,winners:g.winners,winningRole:g.winningRole,phase:g.phase,turn:g.turn,counts,undoChecks,trace};writeFileSync(`docs/qa/release-nov21-${seed}.json`,JSON.stringify(result,null,2));console.log(JSON.stringify({...result,trace:undefined}));expect(g.phase).toBe('finished');expect(g.winners.length).toBeGreaterThan(0);
},120000);
let receiptCardSerial=0;
const receiptCard=(kind:string,suit:Card['suit']='H',rank=5):Card=>({id:`receipt-${receiptCardSerial++}`,kind,suit,rank});
function receiptBase(){let g=setup(4,identity,['train','gold','dodge','valley','wildwest']);for(const id of g.seats)g=move(g,id,{type:'ready'});g=move(g,'0',{type:'start'});g.queue=[];g.drawn=true;g.active='0';g.discard=[];for(const p of Object.values(g.players)){p.character='willy';p.hand=[];p.table=[];p.hp=4;p.maxHp=4;p.handCount=0;}return g;}
it('train Cactus publishes the actual effective-suit card and heal; undo restores receipt history',()=>{
 let g=receiptBase();g.players['1'].hp=2;g.players['1'].hand=[receiptCard('cactus')];const drawn=receiptCard('bang','S');g.deck.unshift(drawn);g.event='blessing';g.queue=[{kind:'shot',player:'1',source:'0',count:1}];const before=structuredClone(g);
 g=move(g,'1',{type:'respond',card:g.players['1'].hand[0].id});expect(g.players['1'].hp).toBe(3);expect(g.checkHistory?.at(-1)).toMatchObject({player:'1',card:drawn,effectiveSuit:'H',title:'Кактус'});expect(g.checkHistory?.at(-1)?.result).toContain('1');
 expect(playerView(g,'2').checkHistory).toEqual(g.checkHistory);
 g=move(move(g,'1',{type:'mode',enabled:true}),'1',{type:'undo'});expect(g.checkHistory).toEqual(before.checkHistory);expect(g.checkSerial).toEqual(before.checkSerial);
});
it('Knife Revolver publishes face-card success and returns real card',()=>{let g=receiptBase();const knife=receiptCard('kniferevolver'),drawn=receiptCard('cat','S',12);g.players['0'].hand=[knife];g.deck.unshift(drawn);g=move(g,'0',{type:'play',card:knife.id,target:'1'});expect(g.players['0'].hand).toContainEqual(knife);expect(g.checkHistory?.at(-1)).toMatchObject({card:drawn,title:'Револьвер с ножом'});expect(g.checkHistory?.at(-1)?.result).toContain('возвращён');});
it('Rhum publishes all revealed cards with actual capped healing and no hidden hand leak',()=>{
 let g=receiptBase();g.players['0'].hp=3;g.players['0'].gold=20;g.market=[{id:'receipt-rhum',kind:'rhum'}];g=move(g,'0',{type:'buy',card:'receipt-rhum'});const cards=[receiptCard('bang','H'),receiptCard('bang','H'),receiptCard('bang','C'),receiptCard('bang','S')];g.deck=cards;
 g=move(g,'0',{type:'equipment-effect'});expect(g.players['0'].hp).toBe(4);expect(g.checkHistory?.slice(-4).map(c=>c.card)).toEqual(cards);for(const r of g.checkHistory??[])expect(r.result).toContain('Восстановлено жизней: 1');expect(playerView(g,'1').players['0'].hand).toEqual([]);
});

it('losing own Duel names its cause, preserves Gringo rules, and retains cause after a rescue is declined',()=>{
 for(const rescue of [false,true]){
  let g=receiptBase();g.players['0'].character='gringo';const duel=receiptCard('duel'),bang=receiptCard('bang');g.players['0'].hand=[duel];g.players['1'].hand=[bang,receiptCard('beer')];if(rescue)g.players['2'].hand=[receiptCard('saved')];
  g=move(g,'0',{type:'play',card:duel.id,target:'1'});g=move(g,'1',{type:'respond',card:bang.id});g=move(g,'0',{type:'take-hit'});if(rescue){expect(g.queue[0].kind).toBe('save');g=move(g,'2',{type:'pass'});}
  expect(g.players['0'].hp).toBe(3);expect(g.players['0'].hand).toHaveLength(0);expect(g.players['1'].hand).toHaveLength(1);expect(g.log.some(x=>x.includes('проиграна собственная Дуэль'))).toBe(true);expect(g.log.some(x=>x.includes('−1')&&x.includes('источник: '+g.players['0'].name))).toBe(false);
 }
});
