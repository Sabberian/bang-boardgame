import {it,expect} from 'vitest';
import {act,setup,actor,cardActionReason,targets,distance,ability,playerView,type State,type Action,type Shuffle} from './game';
import {CARDS} from './content';
const identity:Shuffle=a=>[...a];
function bot(g:State):Action{
 const id=actor(g),p=g.players[id],q=g.queue[0];
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
 const hand=[...p.hand].sort((a,b)=>Number(b.id===g.lawCard?.id)-Number(a.id===g.lawCard?.id));
 for(const [zone,cards] of [['hand',hand],['table',p.table]] as const)for(const c of cards){
 if(cardActionReason(g,id,c,zone))continue;
 const t=targets(g,id,c)[0],a:Action={type:zone==='hand'?'play':'use',card:c.id,target:t,cost:p.hand.find(x=>x.id!==c.id&&(c.kind!=='aim'||x.kind==='bang'||ability(p)==='calamity'&&x.kind==='missed'))?.id};
 if(c.kind==='fanning')a.target2=g.seats.find(x=>x!==id&&x!==t&&g.players[x].alive&&distance(g,t!,x)===1);
 if(t&&['panic','cat','ragtime','cancan','conestoga'].includes(c.kind)&&!g.players[t].hand.length)a.choice=g.players[t].table[0]?.id;
 if(!act(g,id,a,identity).error)return a;
 }return {type:'end'};
}
for(const ex of [['valley'],['valley','dodge'],['valley','dodge','highnoon','fistful']])for(const n of ex.includes('dodge')?[3,4,8]:[4,7])for(const seed of [1,2,3])it(`complete Valley game ${ex.join('+')} / ${n} / ${seed}, conservation, privacy and final undo`,()=>{
 let r=seed*31;const shuffle:Shuffle=<T>(a:T[])=>{const b=[...a];for(let i=b.length-1;i>0;i--){r=(Math.imul(r,1664525)+1013904223)>>>0;const j=r%(i+1);[b[i],b[j]]=[b[j],b[i]];}return b;};
 let g=setup(n,shuffle,ex);for(const id of g.seats)g=act(g,id,{type:'ready'},shuffle).state;g=act(g,'0',{type:'start'},shuffle).state;
 let previous=g,action:Action={type:'end'},who='0';
 for(let i=0;i<5000&&g.phase!=='finished';i++){
 previous=g;who=actor(g);action=bot(g);const res=act(g,who,action,shuffle);expect(res.error,JSON.stringify({i,action,q:g.queue[0],event:g.event})).toBeUndefined();g=res.state;
 for(const id of g.seats){const v=playerView(g,id);expect(v.undo).toBeUndefined();for(const q of v.queue){expect(q.pool??[]).toEqual([]);if(q.player!==id)expect(q.revealed??[]).toEqual([]);}}
 if(g.phase!=='finished'){const all=[...g.deck,...g.discard,...Object.values(g.players).flatMap(p=>[...p.hand,...p.table]),...g.queue.flatMap(q=>[...(q.cards??[]),...(q.pool??[])])];expect(all,JSON.stringify({i,action,before:previous.queue,after:g.queue,log:g.log.slice(-5)})).toHaveLength(ex.includes('dodge')?136:96);expect(new Set(all.map(c=>c.id)).size).toBe(all.length);}
 }
 expect(g.phase).toBe('finished');expect(g.winners.length).toBeGreaterThan(0);
 g=act(g,'0',{type:'mode',enabled:true},shuffle).state;g=act(g,'0',{type:'undo'},shuffle).state;
 expect(g.phase).toBe('play');expect(g.players).toEqual(previous.players);expect(g.queue).toEqual(previous.queue);expect(g.deck).toEqual(previous.deck);
 const replay=act(g,who,action,shuffle);expect(replay.error).toBeUndefined();expect(replay.state.phase).toBe('finished');
});
