import type {State,Action} from './game';
import type {LegendGame} from './legends-adapter';
import {availableFeats} from './legends-adapter';
import {boastDiscardChoices} from './legends-runtime';
/** Candidate generation is intentionally non-authoritative: run through act and retain legal moves. */
export function legendsCycleCandidates(g:State,id:string):Action[]{const state=g as State&LegendGame;if(!state.legends)return [];const s=state.legends,p=g.players[id],q=g.queue[0] as unknown as {kind:string;player:string;cards?:{id:string}[]}|undefined;const out:Action[]=[];const players=g.seats.filter(t=>t!==id&&g.players[t].alive);
 if(q?.player===id&&q.kind.startsWith('legend-')){
  if(q.kind==='legend-boast'){if(s.boasting===id){const choices=boastDiscardChoices(s);return choices.length?choices.map(choice=>({type:'legend-boast-discard',choice})):s.feats.filter(f=>!f.tokens[id]).map(f=>({type:'legend-boast',choice:f.kind}))}return [{type:'legend-begin-boast'},{type:'legend-skip'}]}
  if(q.kind==='legend-black')return [{type:'legend-black'},{type:'legend-black',enabled:true}];
  if(q.kind==='legend-kit')return [{type:'legend-skip'},...(q.cards??[]).flatMap(c=>players.map(target=>({type:'legend-kit-gift',card:c.id,target})))];
  if(q.kind==='legend-jesse'||q.kind==='legend-lucky')return (q.cards??[]).map(c=>({type:q.kind,card:c.id}));
  if(q.kind==='legend-jour')return [{type:'legend-jour'},{type:'legend-skip'}];
  if(q.kind==='legend-jail')return [{type:'legend-jail-check'},...p.hand.map(c=>({type:'legend-jail',card:c.id}))];
 }
 if(g.active!==id||q&&q.kind!=='draw')return out;
 for(const f of availableFeats(state,id)){if(f.eligible){if(s.legendary.includes(id)){out.push(...players.map(target=>({type:'legend-claim',choice:f.kind,target})),{type:'legend-claim',choice:f.kind});if(p.character==='willy')out.push(...players.map(target=>({type:'legend-willy',choice:f.kind,target})))}else out.push({type:'legend-perform',choice:f.kind})}else if(f.crossroad){if(['border','nameless','oregon'].includes(f.kind))out.push({type:'legend-crossroad',choice:f.kind});else out.push(...[...p.hand,...p.table].map(c=>({type:'legend-crossroad',choice:f.kind,cards:[c.id]})))}}
 if(state.legendTurn?.sidReady)out.push(...players.map(target=>({type:'legend-sid',target})));
 if(s.legendary.includes(id)&&p.character==='rose')out.push(...[...p.hand,...p.table].flatMap(c=>players.map(target=>({type:'legend-rose',card:c.id,target}))));
 return out;
}
