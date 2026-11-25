import {baseCycleAction} from './cycle-driver';
import {legendsCycleCandidates} from './legends-cycle-candidates';
import {trainCandidates} from './expansion-cycle-helpers';
import {armedSources} from './armed-runtime';
import type {State,Action} from './game';
export function allCycleCandidates(g:State,id:string):Action[]{
 const p=g.players[id],q=g.queue[0],out:Action[]=[];
 if(q?.kind==='claus')return [{type:'choose',card:q.cards?.[0]?.id,target:q.remaining?.[0]}];
 if(q?.kind==='handcuffs')return ['H','D','S','C'].map(choice=>({type:'choose',choice}));
 if(q?.kind==='identity')return [{type:'choose',choice:'change'},{type:'choose',choice:'keep'}];
 if(q?.kind.startsWith('armed-')){
  if(q.kind==='armed-load')out.push(...armedSources(g,id).map(choice=>({type:'armed-load',choice})));
  if(q.kind==='armed-discard')out.push(...p.hand.map(c=>({type:'discard',card:c.id})));
  if(q.kind==='armed-arrow')out.push(...p.hand.map(c=>({type:'respond',card:c.id})),{type:'take-hit'});
  if(q.kind==='armed-bomb-pass')out.push(...g.seats.filter(t=>t!==id).map(target=>({type:'armed-pass',target})));
  out.push({type:'skip'});return out;
 }
 out.push(...legendsCycleCandidates(g,id),...trainCandidates(g,id));
 try{out.push(baseCycleAction(g));}catch{}
 if(q){for(const c of [...q.cards??[],...p.hand,...p.table])out.push({type:'choose',card:c.id},{type:'respond',card:c.id});out.push({type:'pass'},{type:'skip'},{type:'take-hit'});}
 if(!q)out.push({type:'end'});
 return out;
}
