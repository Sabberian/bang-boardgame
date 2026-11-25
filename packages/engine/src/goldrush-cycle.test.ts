import {it,expect} from 'vitest';
import {act,setup,actor,cardActionReason,targets,distance,ability,playerView,type State,type Action,type Shuffle} from './game';
import {WILDWEST,WILDWEST_CHARACTER_IDS} from './wildwest';
import {GOLD_CHARACTER_IDS,EQUIPMENT} from './goldrush';
import {CARDS} from './content';
const identity:Shuffle=a=>[...a];
function bot(g:State):Action{
 const id=actor(g),p=g.players[id],q=g.queue[0];
 if(q?.kind==='dutch')return {type:'choose',card:q.cards![0].id};
 if(q?.kind==='gold-effect'){const kind=q.equipment!.kind;return {type:'equipment-effect',choice:kind==='bottle'?'beer':kind==='pardner'?'store':undefined,target:kind==='wanted'?g.seats.find(t=>g.players[t].alive&&!g.players[t].equipment?.some(e=>e.kind==='wanted')):id};}
 if(q?.kind==='greygory')return {type:'choose',choice:'keep'};
 if(q?.kind==='youl')return {type:'choose',card:p.hand[0].id};
 if(q?.kind==='offer'||q?.kind==='save'){const c=p.hand.find(c=>!cardActionReason(g,id,c));return c?{type:'respond',card:c.id}:{type:'pass'};}
 if(q?.kind==='jim')return {type:'pass'};
 if(q?.kind==='bandidos')return {type:'take-hit'};
 if(q&&['tornado','poker','shotgun'].includes(q.kind))return {type:'choose',card:p.hand[0].id};
 if(q?.kind==='poker-pick'||q?.kind==='save-reward')return {type:'choose',cards:(q.cards??q.revealed??[]).slice(0,2).map(c=>c.id)};
 if(q?.kind==='vera')return {type:'copy',target:g.seats.find(t=>t!==id&&g.players[t].alive)};
 if(q?.kind==='draw')return {type:'draw'};
 if(q?.kind==='blood'||q?.kind==='ranch')return {type:'skip'};
 if(q?.kind==='peyote')return {type:'guess',choice:'black'};
 if(q?.kind==='daltons')return {type:'choose',card:p.table.find(c=>CARDS[c.kind].blue)?.id};
 if(q&&['kit','store','check'].includes(q.kind))return {type:'choose',card:q.cards![0]?.id};
 if(q?.kind==='eliminate')return {type:'choose',card:[...p.hand,...p.table][0].id};
 if(q?.kind==='brawl'||q?.kind==='loot'){const v=g.players[q.other??q.victim!];return v.table.length?{type:'choose',zone:'table',card:v.table[0].id}:{type:'choose'};}
 if(q?.kind==='dying')return {type:'concede'};
 if(q)return {type:'take-hit'};
 if(g.discarding)return {type:'discard',card:p.hand[0].id};
 if(p.character==='flint'&&!g.flintUsed&&p.hand.length){const target=g.seats.find(t=>t!==id&&g.players[t].alive&&g.players[t].hand.length);if(target)return {type:'flint',card:p.hand[0].id,target};}
 if(p.character==='lee'&&g.lastBrown&&!g.repeatUsed){const pay=p.hand.find(c=>c.kind==='bang'||g.wws==='showdown');if(pay){const original=g.lastBrown,target=targets(g,id,original)[0];const repeat:Action={type:'repeat',card:pay.id,target};if(original.kind==='fanning')repeat.target2=g.seats.find(t=>t!==id&&t!==target&&g.players[t].alive&&distance(g,target!,t)===1);if(!act(g,id,repeat,identity).error)return repeat;}}
 if((p.gold??0)>0){const item=g.market?.find(e=>EQUIPMENT[e.kind].cost<=(p.gold??0)&&(!EQUIPMENT[e.kind].permanent||e.kind==='wanted'||!p.equipment?.some(x=>x.kind===e.kind)));if(item)return {type:'buy',card:item.id};}
 const hand=[...p.hand].sort((a,b)=>Number(b.id===g.lawCard?.id)-Number(a.id===g.lawCard?.id));
 for(const [zone,cards] of [['hand',hand],['table',p.table]] as const)for(const c of cards){
 if(cardActionReason(g,id,c,zone))continue;
 const t=targets(g,id,c)[0],a:Action={type:zone==='hand'?'play':'use',card:c.id,target:t,cost:p.hand.find(x=>x.id!==c.id&&(c.kind!=='aim'||x.kind==='bang'||ability(p)==='calamity'&&x.kind==='missed'))?.id};
 if(c.kind==='fanning')a.target2=g.seats.find(x=>x!==id&&x!==t&&g.players[x].alive&&distance(g,t!,x)===1);
 if(t&&['panic','cat','ragtime','cancan','conestoga'].includes(c.kind)&&!g.players[t].hand.length)a.choice=g.players[t].table[0]?.id;
 if(!act(g,id,a,identity).error)return a;
 }return {type:'end'};
}

for(const n of [4,8])for(const shadows of [false,true])for(const seed of [1,2,3,4])it(`Gold Rush full game / ${n} / shadows ${shadows} / seed ${seed}`,()=>{
 let r=seed*917;const shuffle:Shuffle=<T>(a:T[])=>{const b=[...a];for(let i=b.length-1;i>0;i--){r=(Math.imul(r,1664525)+1013904223)>>>0;const j=r%(i+1);[b[i],b[j]]=[b[j],b[i]];}if(b.includes('don' as T)){const order=[...GOLD_CHARACTER_IDS.slice((seed%2)*4),...GOLD_CHARACTER_IDS.slice(0,(seed%2)*4)];return [...order,...b.filter(x=>!order.includes(x as string))] as T[];}return b;};
 let g=setup(n,shuffle,['dodge','valley','highnoon','fistful','wildwest','gold',...(shadows?['shadows']:[])]);for(const id of g.seats)g=act(g,id,{type:'ready'},shuffle).state;g=act(g,'0',{type:'start'},shuffle).state;
 let previous=g,action:Action={type:'end'},who='0',undos=0,purchases=0;
 for(let i=0;i<7000&&g.phase!=='finished';i++){
 previous=g;who=actor(g);action=bot(g);const result=act(g,who,action,shuffle);expect(result.error,JSON.stringify({i,action,q:g.queue[0],log:g.log.slice(-5)})).toBeUndefined();g=result.state;if(action.type==='buy')purchases++;
 const all=[...g.deck,...g.discard,...(g.painPending??[]).flatMap(x=>x.cards),...Object.values(g.players).flatMap(p=>[...p.hand,...p.table]),...g.queue.flatMap(q=>[...(q.cards??[]),...(q.pool??[]),...(q.prefix??[]),...(q.kept??[])])];
 if(g.phase!=='finished'){expect(all,JSON.stringify({i,action,q:g.queue,log:g.log.slice(-5)})).toHaveLength(136);expect(new Set(all.map(c=>c.id)).size).toBe(136);}
 const eq=[...g.market??[],...g.equipmentDeck??[],...g.equipmentDiscard??[],...Object.values(g.players).flatMap(p=>p.equipment??[]),...g.queue.flatMap(q=>q.equipment?[q.equipment]:[])];expect(eq).toHaveLength(24);expect(new Set(eq.map(e=>e.id)).size).toBe(24);
 for(const id of g.seats){const v=playerView(g,id);expect(v.equipmentDeck).toEqual([]);if(v.queue[0]?.kind==='dutch'&&v.queue[0].player!==id)expect(v.queue[0].cards).toEqual([]);}
 if(i%23===0&&g.phase!=='finished'){const enabled=act(g,'0',{type:'mode',enabled:true},shuffle).state;const reverted=act(enabled,'0',{type:'undo'},shuffle);expect(reverted.error).toBeUndefined();const clean=(s:State)=>{const {undo,revision,manual,log,errors,...rest}=s;return rest;};expect(clean(reverted.state)).toEqual(clean(previous));undos++;}
 }
 expect(g.phase).toBe('finished');expect(g.winners.length).toBeGreaterThan(0);expect(undos).toBeGreaterThan(0);expect(purchases).toBeGreaterThan(0);
 const back=act(act(g,'0',{type:'mode',enabled:true},shuffle).state,'0',{type:'undo'},shuffle).state;expect(back.phase).toBe('play');expect(back.players).toEqual(previous.players);expect(back.market).toEqual(previous.market);expect(back.equipmentDeck).toEqual(previous.equipmentDeck);expect(act(back,who,action,shuffle).state.phase).toBe('finished');
});
