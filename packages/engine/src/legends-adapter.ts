import type {Card} from './content';
import {CARDS} from './content';
import type {LegendsState} from './legends-runtime';
import {FEATS} from './legends';
export interface LegendPlayer {id:string;character:string;silenced?:boolean;hp:number;maxHp:number;hand:Card[];table:Card[];alive:boolean}
export interface LegendGame {active:string;drawn:boolean;players:Record<string,LegendPlayer>;discard:Card[];legends?:LegendsState;legendTurn?:LegendTurn}
export interface LegendTurn {events:FeatEvent[];eligible:string[];used:string[];black?:Card[];blackDone?:boolean;sidReady?:boolean;oregon?:boolean}
export type FeatEvent={type:'check'|'hit'|'miss'|'play'|'discard'|'take'|'duel-loss'|'excess';player:string;target?:string;card?:Card;zone?:string;count?:number;distance?:number;lastLife?:boolean};
export interface LegendHost {take:(n:number)=>Card[];draw:(id:string,n:number)=>void;hit:(source:string,target:string,n:number)=>void;shoot:(source:string,target:string)=>void;steal:(source:string,target:string,card?:string,zone?:string)=>void;heal:(id:string,n:number)=>void;discard:(id:string,card:string,zone:'hand'|'table')=>Card;effectiveSuit:(c:Card)=>string;check:(id:string,kind:string)=>void}
export const legendActive=(g:LegendGame,id:string,character?:string)=>!!g.legends?.legendary.includes(id)&&!g.players[id].silenced&&(!character||g.players[id].character===character);
export function resetLegendTurn(g:LegendGame){g.legendTurn={events:[],eligible:[],used:[]}}
/** Host emits only resolved events, never attempted/rejected actions. */
export function recordFeat(g:LegendGame,e:FeatEvent){if(!g.legends)return;const t=g.legendTurn??(g.legendTurn={events:[],eligible:[],used:[]});t.events.push(e);const own=e.player===g.active;const add=(k:string)=>{if(!t.eligible.includes(k))t.eligible.push(k)};
 if(e.type==='check'&&own)add('yooma');if(!g.drawn)return;
 if(e.type==='hit'&&own){if(e.card?.kind==='bang'&&e.lastLife)add('quick');if(new Set(t.events.filter(x=>x.type==='hit'&&x.player===g.active).map(x=>x.target)).size>=2)add('gang')}
 if(e.type==='miss'&&own&&e.card?.kind==='bang')add('pride');
 if(e.type==='duel-loss'&&own)add('scrugs');
 if(e.type==='play'&&own&&e.card?.kind==='bang'&&(e.distance??0)>=2)add('wilhelm');
 if(own&&(e.type==='take'||e.type==='discard')&&e.card&&CARDS[e.card.kind]?.range)add('guns');
 if(e.type==='excess'&&own&&(e.count??0)>=2)add('few');
 if(own&&(e.type==='play'||e.type==='discard')){const relevant=t.events.filter(x=>x.player===g.active&&(x.type==='play'||x.type==='discard'));const prev=relevant.at(-2);if(prev&&prev.type!==e.type&&prev.card?.kind===e.card?.kind)add('company')}
}
export function availableFeats(g:LegendGame,id:string){if(!g.legends||id!==g.active)return [];return g.legends.feats.filter(f=>!g.legendTurn?.used.includes(f.kind)&&(legendActive(g,id)||(!f.tokens[id]&&!g.legends!.retired.includes(id)))).map(f=>({kind:f.kind,...FEATS[f.kind as keyof typeof FEATS],eligible:g.legendTurn?.eligible.includes(f.kind)??false}))}
/** Executes the voluntary Crossroad payment, with no ordinary card effect. */
export function payCrossroad(g:LegendGame,id:string,kind:string,ids:string[],h:LegendHost){const p=g.players[id];if(id!==g.active||!availableFeats(g,id).some(f=>f.kind===kind))throw Error('Подвиг недоступен');if(kind==='oregon'){if(g.drawn)throw Error('Фаза добора уже завершена');(g.legendTurn??={events:[],eligible:[],used:[]}).oregon=true;g.legendTurn.eligible.push(kind);return}
 if(!g.drawn)throw Error('Сначала возьмите карты');const cards=ids.map(cid=>p.hand.find(c=>c.id===cid)??p.table.find(c=>c.id===cid));if(new Set(ids).size!==ids.length||cards.some(c=>!c))throw Error('Выберите свои карты');
 if(kind==='nameless'){if(p.hp<=1)throw Error('Нельзя потерять последнюю жизнь');h.hit(id,id,1)}
 else if(kind==='border'){for(const c of [...p.hand])h.discard(id,c.id,'hand')}
 else {if(ids.length!==1)throw Error('Выберите одну карту');const c=cards[0]!;const table=p.table.includes(c);if(kind==='hero'){if(!table||!CARDS[c.kind]?.blue)throw Error('Нужна синяя карта в игре')}else {if(table)throw Error('Нужна карта из руки');if(kind==='bottle'&&c.kind!=='beer'||kind==='chuck'&&c.kind!=='bang'||kind==='thousand'&&c.kind!=='missed')throw Error('Неверная карта');if(!['bottle','chuck','thousand','company'].includes(kind))throw Error('Это не свободный сброс')}
 const discarded=h.discard(id,c.id,table?'table':'hand');recordFeat(g,{type:'discard',player:id,card:discarded,zone:table?'table':'hand'});}
 if(kind!=='company'&&!g.legendTurn!.eligible.includes(kind))g.legendTurn!.eligible.push(kind);
}
export function legendHandLimit(g:LegendGame,id:string,ordinary:number){return g.legends&&g.players[id].hp===1?Math.max(2,ordinary):ordinary}
export function legendDistance(g:LegendGame,id:string,ordinary:number){return legendActive(g,id,'rose')?1:ordinary}
export function legendBangCost(g:LegendGame,target:string){return legendActive(g,target,'paul')?1:0}
export function legendUnavoidable(g:LegendGame,id:string){return legendActive(g,id,'slab')}
export function legendAsBang(g:LegendGame,id:string){return legendActive(g,id,'calamity')}
export const legendAsMiss=legendAsBang;
export function legendOnHit(g:LegendGame,id:string,source:string|undefined,card:Card|undefined,h:LegendHost){if(legendActive(g,id,'bart'))h.draw(id,2);if(legendActive(g,id,'gringo')&&source&&source!==id){if(g.players[source].hand.length)h.steal(id,source);const at=card?g.discard.findIndex(c=>c.id===card.id):-1;if(at>=0)g.players[id].hand.push(g.discard.splice(at,1)[0])}}
export function legendEmptyHand(g:LegendGame,id:string,h:LegendHost){if(legendActive(g,id,'suzy')&&g.players[id].hand.length<2)h.draw(id,2-g.players[id].hand.length)}
export function legendHealed(g:LegendGame,id:string){if(id===g.active&&legendActive(g,id,'sid')&&!g.legendTurn?.used.includes('sid'))(g.legendTurn??={events:[],eligible:[],used:[]}).sidReady=true}
export function legendSidShot(g:LegendGame,id:string,target:string,h:LegendHost){if(!g.legendTurn?.sidReady||!legendActive(g,id,'sid'))throw Error('Бесплатный выстрел недоступен');g.legendTurn.sidReady=false;g.legendTurn.used.push('sid');h.shoot(id,target)}
export function legendRose(g:LegendGame,id:string,target:string,card:string,h:LegendHost){if(id!==g.active||!legendActive(g,id,'rose')||g.legendTurn?.used.includes('rose'))throw Error('Способность недоступна');const p=g.players[id],c=[...p.hand,...p.table].find(c=>c.id===card);if(!c||!CARDS[c.kind]?.blue)throw Error('Выберите свою синюю карту');h.discard(id,card,p.table.includes(c)?'table':'hand');g.legendTurn!.used.push('rose');h.steal(id,target)}
/** Black Jack reveals sequentially; the UI may stop at any point before >21. */
export function legendBlackDraw(g:LegendGame,id:string,h:LegendHost,stop=false){if(!legendActive(g,id,'black'))throw Error('Способность недоступна');const t=g.legendTurn!,cards=t.black??(t.black=[]);if(t.blackDone)throw Error('Добор завершён');if(!stop)cards.push(...h.take(1));const sum=cards.reduce((n,c)=>n+((c.rank===1||c.rank===14)?11:Math.min(10,c.rank)),0);if(stop||sum>21){g.players[id].hand.push(...cards);t.black=[];t.blackDone=true}return {sum,done:!!t.blackDone,cards:[...cards]}}
export function legendJesse(g:LegendGame,id:string,target:string,card:string,h:LegendHost,count=2){if(!legendActive(g,id,'jesse')||!g.players[target]?.hand.some(c=>c.id===card)||target===id)throw Error('Выберите карту соперника');h.steal(id,target,card,'hand');h.draw(id,Math.max(0,count-1))}
export function legendPedro(g:LegendGame,id:string,h:LegendHost){h.draw(id,2);const c=g.discard.pop();if(c)g.players[id].hand.push(c)}
export function legendKit(g:LegendGame,id:string,h:LegendHost){const cards=h.take(3);g.players[id].hand.push(...cards);return cards.map(c=>c.id)}
export function legendKitGift(g:LegendGame,id:string,target:string,card:string,drawn:string[]){if(target===id||!g.players[target]?.alive||!drawn.includes(card))throw Error('Выберите получателя и новую карту');const at=g.players[id].hand.findIndex(c=>c.id===card);if(at<0)throw Error('Карта недоступна');g.players[target].hand.push(g.players[id].hand.splice(at,1)[0])}
export function legendJourdonnaisSuccess(rank:number){return rank===1||rank>=11}
export function legendLuckyOwner(g:LegendGame){return Object.keys(g.players).find(id=>g.players[id].alive&&legendActive(g,id,'lucky'))}
export function legendJailEscape(g:LegendGame,id:string,card:string,h:LegendHost){const p=g.players[id],c=p.hand.find(c=>c.id===card),j=p.table.find(c=>c.kind==='jail');if(!g.legends||!c||h.effectiveSuit(c)!=='H'||!j)throw Error('Для побега нужна черва');h.discard(id,c.id,'hand');h.discard(id,j.id,'table')}
