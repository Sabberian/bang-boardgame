import {type State,type Action,hasAbility,suit} from './game';
import {CARDS,type Card} from './content';
import {isRailcar} from './train';
import {stationAccepts} from './train-runtime';
/** Legal-intent candidates only; the authoritative act() validates each candidate.
 * The cycle runner should try candidates until accepted, never mutate G directly.
 */
export function trainCandidates(g:State,id:string):Action[]{
 const t=g.train,p=g.players[id],q=g.queue[0];if(!t||!p?.alive)return[];
 if(q?.kind==='train'&&q.player===id){switch(q.trainTask){case'map':return[{type:'pass'},...(q.cards??[]).map(c=>({type:'choose',card:c.id}))];case'shade':return[{type:'pass'},...p.hand.map(c=>({type:'choose',card:c.id}))];case'circus':return p.table.map(c=>({type:'choose',card:c.id}));case'robbery':return[{type:'choose',choice:'discard'},{type:'choose',choice:'shot'}];case'lounge':return[{type:'choose',choice:'give'},...(q.cards??[]).map(c=>({type:'choose',card:c.id}))];default:return(q.cards??[]).map(c=>({type:'choose',card:c.id}));}}
 const result:Action[]=[];
 if(q?.player===id&&['shot','duel','indians'].includes(q.kind)){
  for(const c of [...p.hand,...p.table])if(CARDS[c.kind]?.blue){if(q.kind==='shot'&&c.kind!=='rail_caboose')result.push({type:'train-caboose',card:c.id});if(q.kind!=='shot'&&c.kind!=='rail_sleeper')result.push({type:'train-sleeper',card:c.id});}
  if(q.kind==='shot'){result.push({type:'train-baggage-miss'});if(hasAbility(p,'evan'))for(const c of p.hand)for(const target of g.seats)result.push({type:'train-evan',card:c.id,target});}
  return result;
 }
 if(g.active!==id||q||!g.drawn||g.discarding)return[];
 const alive=g.seats.filter(x=>g.players[x].alive),others=alive.filter(x=>x!==id),pay=[...p.hand,...p.table];
 function playing(c:Card,kind=c.kind){const base={type:'play',card:c.id};
  if(kind==='fullsteam')result.push({...base,choice:'cancel'},{...base,choice:'double'});
  else if(kind==='watertower')for(const rail of t!.cars)for(const target of g.seats)result.push({...base,choice:rail.id,target});
  else if(kind==='switch')for(const own of p.table)for(const target of others)for(const foreign of g.players[target].table)result.push({...base,cost:own.id,target,choice:foreign.id});
  else if(['trainrobbery','kniferevolver'].includes(kind))for(const target of others)result.push({...base,target});
  else if(kind==='mostwanted')result.push(base);
  else if(kind==='moneybag'){const copy=g.discard.at(-1);if(copy&&copy.kind!=='moneybag'&&!CARDS[copy.kind].blue&&!CARDS[copy.kind].green){const before=result.length;playing(c,copy.kind);if(result.length===before){result.push(base);for(const target of alive){result.push({...base,target});for(const foreign of g.players[target].table)result.push({...base,target,choice:foreign.id});for(const cost of p.hand)if(cost.id!==c.id)result.push({...base,target,cost:cost.id});}}}}
 }
 for(const c of p.hand)playing(c);
 for(let i=0;i<t.cars.length;i++){const rail=t.cars[i];for(const enabled of[false,true]){const index=t.position+(enabled?1:0)-i-1,station=t.stations[index];if(station){const costs:Card[][]=station==='virginia'?pay.flatMap((a,i)=>pay.slice(i+1).map(b=>[a,b])):station==='tombrock'?[[]]:pay.map(c=>[c]);for(const cards of costs)if(stationAccepts(station,cards,p.hp,c=>suit(g,c)))for(const target of ['rail_ghostcar','rail_lumber'].includes(rail.kind)?g.seats:[id])result.push({type:'train-buy',card:rail.id,enabled,cards:cards.map(c=>c.id),target});}if(hasAbility(p,'sancho'))for(const target of rail.kind==='rail_ghostcar'?g.seats:[id])result.push({type:'train-sancho',card:rail.id,enabled,target});}}
 if(hasAbility(p,'zippy'))result.push({type:'train-zippy'});
 for(const c of p.table){const base={type:'train-use',card:c.id};switch(c.kind){case'rail_cattle':case'rail_circus':case'rail_express':result.push(base);break;case'rail_coal':for(const target of alive)for(const other of g.players[target].table)if(isRailcar(other)&&other.id!==c.id)result.push({...base,target,choice:other.id});break;case'rail_mail':case'rail_lounge':for(const target of others)result.push({...base,target});break;case'rail_passenger':for(const target of others){result.push({...base,target});for(const foreign of g.players[target].table)result.push({...base,target,choice:foreign.id});}break;case'rail_baggage':for(const choice of ['bang','panic','cat'])for(const target of others){result.push({...base,choice,target});for(const foreign of g.players[target].table)result.push({...base,choice,target,cost:foreign.id});}break;case'rail_sleeper':for(const cost of pay)if(cost.id!==c.id&&CARDS[cost.kind].blue)for(const target of others)result.push({type:'train-sleeper-shot',card:cost.id,target});}}
 return result;
}
