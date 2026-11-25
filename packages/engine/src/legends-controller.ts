import type {State,Action,Shuffle,Prompt} from './game';
import {FEATS} from './legends';
import * as L from './legends-adapter';
import * as F from './legends-runtime';
export interface LegendsControllerHost extends L.LegendHost{shuffle:Shuffle;phaseCount:(id:string)=>number;nextTurn:()=>void;finishDraw:()=>void;log:(text:string)=>void}
export type LegendState=State&L.LegendGame;
/** Host may use arbitrary private queue kinds via this boundary until Prompt union is extended. */
export function legendsController(g:LegendState,h:LegendsControllerHost){
 const push=(kind:string,id:string,rest:Record<string,unknown>={})=>g.queue.unshift({kind,player:id,...rest} as Prompt);
 const fameHost:F.LegendsHost={shuffle:x=>h.shuffle(x),healToThree:id=>{const p=g.players[id];if(p.hp<3)p.hp=3;h.log(p.name+' становится легендой!')},hit:(source,target)=>h.hit(source,target,1),hp:id=>g.players[id].hp,isSlab:id=>L.legendActive(g,id,'slab'),alive:id=>g.players[id].alive};
 function setup(){g.legends=F.createLegends(g.seats,Object.keys(FEATS),x=>h.shuffle(x));L.resetLegendTurn(g)}
 function startTurn(){L.resetLegendTurn(g);if(g.legends)F.legendsStartTurn(g.legends)}
 function endTurn(){if(!g.players[g.active].alive||!g.legends||g.legends.legendary.includes(g.active)||g.legends.retired.includes(g.active)||g.legends.performed.includes(g.active)||!g.legends.fame[g.active])return false;push('legend-boast',g.active);return true}
 function act(id:string,a:Action){if(!g.legends||!a.type.startsWith('legend-'))return false;const s=g.legends;const q=g.queue[0] as unknown as {kind:string;player:string;cards?:import('./content').Card[];other?:string;count?:number};const own=id===g.active;const ready=own&&(!q||q.kind==='draw');const need=(ok:unknown)=>{if(!ok)throw Error('Действие легенды сейчас недоступно')};
 if(a.type==='legend-begin-boast'){need(q?.kind==='legend-boast'&&q.player===id);need(F.beginBoast(s,id,fameHost));return true}
 if(a.type==='legend-boast-discard'){need(s.boasting===id);need(F.discardBoastFeat(s,a.choice!));return true}
 if(a.type==='legend-boast'){need(F.finishBoast(s,id,a.choice!,fameHost));g.queue.shift();h.nextTurn();return true}
 if(a.type==='legend-skip'){need(q?.player===id&&['legend-boast','legend-kit'].includes(q.kind));need(q.kind!=='legend-boast'||s.boasting!==id);g.queue.shift();if(q.kind==='legend-boast')h.nextTurn();else {g.players[id].hand.push(...q.cards??[]);h.finishDraw();}return true}
 if(a.type==='legend-crossroad'){need(ready);L.payCrossroad(g,id,a.choice!,a.cards??[],h);return true}
 if(a.type==='legend-perform'||a.type==='legend-claim'){need(ready);need(L.availableFeats(g,id).some(f=>f.kind===a.choice&&f.eligible));if(a.type==='legend-perform')need(F.performFeat(s,id,a.choice!,fameHost));else {need(!a.target||F.claimTargets(s,id,fameHost).includes(a.target));need(F.claimFeat(s,id,a.choice!,a.target,fameHost))}g.legendTurn!.used.push(a.choice!);return true}
 if(a.type==='legend-black'){need(q?.kind==='legend-black'&&q.player===id);const result=L.legendBlackDraw(g,id,h,!!a.enabled);if(result.done){g.queue.shift();h.finishDraw()}else q.cards=result.cards;return true}
 if(a.type==='legend-jesse'){need(q?.kind==='legend-jesse'&&q.player===id&&q.other);L.legendJesse(g,id,q.other!,a.card!,h,q.count);g.queue.shift();h.finishDraw();return true}
 if(a.type==='legend-kit-gift'){need(q?.kind==='legend-kit'&&q.player===id);need(a.target!==id&&g.players[a.target!]?.alive);const at=q.cards!.findIndex(c=>c.id===a.card);need(at>=0);g.players[a.target!].hand.push(q.cards!.splice(at,1)[0]);g.players[id].hand.push(...q.cards!);g.queue.shift();h.finishDraw();return true}
 if(a.type==='legend-rose'){need(ready);L.legendRose(g,id,a.target!,a.card!,{...h,steal:(source,target)=>h.steal(source,target,a.choice,a.choice?'table':'hand')});return true}
 if(a.type==='legend-sid'){need(ready);L.legendSidShot(g,id,a.target!,h);return true}
 return false;
 }
 function draw(id:string,target?:string){if(!g.legends)return false;const p=g.players[id];if(L.legendActive(g,id,'black')){g.queue.shift();push('legend-black',id);return true}if(L.legendActive(g,id,'jesse')&&h.phaseCount(id)>0&&target&&target!==id&&g.players[target]?.alive&&g.players[target]?.hand.length&&!g.legendTurn?.oregon){g.queue.shift();push('legend-jesse',id,{other:target,cards:[...g.players[target].hand],count:h.phaseCount(id)});return true}if(L.legendActive(g,id,'pedro')){g.queue.shift();L.legendPedro(g,id,g.legendTurn?.oregon?{...h,draw:(who,n)=>h.draw(who,Math.max(0,n-1))}:h);h.finishDraw();return true}if(L.legendActive(g,id,'kit')){g.queue.shift();push('legend-kit',id,{cards:h.take(g.legendTurn?.oregon?2:3)});return true}return false}
 return {setup,startTurn,endTurn,act,draw,fameHost};
}
