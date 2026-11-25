import {act,setup,actor,cardActionReason,targets,distance,ability,playerView,type State,type Action,type Shuffle} from './game';
import {WILDWEST,WILDWEST_CHARACTER_IDS} from './wildwest';
import {GOLD_CHARACTER_IDS,EQUIPMENT} from './goldrush';
import {CARDS} from './content';
const identity:Shuffle=a=>[...a];
export function baseCycleAction(g:State):Action{
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

