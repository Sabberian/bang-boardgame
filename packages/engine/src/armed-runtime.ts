import {CARDS,type Card} from './content';
import {ARMED_CARDS,isDangerous,loadCost} from './armed';
import type {State,Player,Prompt,Action} from './game';
export interface ArmedState {loads:Record<string,number>;used:string[];extraBangs:number;tower?:boolean;suppressed?:string;previousSilenced?:boolean;previousDisabled?:boolean}
export type ArmedGame=State&{armed?:ArmedState};
export type ArmedAction=Action&{loads?:string[];targets?:string[];upgrade?:number;weapon?:boolean};
export interface ArmedResolution {weapon?:string;card?:Card;actual?:boolean;remaining?:string[];result?:Card;originalCheck?:Prompt;pool?:string[]}
export type ArmedPrompt=Omit<Prompt,'kind'|'check'|'armed'>&{kind:string;check?:string;armed?:ArmedResolution};
export interface ArmedHost {
 has(p:Player,k:string):boolean;works(g:State,p:Player):boolean;immune(g:State,target:string,c:Card):boolean;
 draw(g:State,id:string,n:number):void;damage(g:State,id:string,source:string|undefined,n:number):void;
 shot(g:State,id:string,source:string):Prompt;reaction(g:State,q:Prompt,c:Card):Prompt;
 check(g:State,id:string,kind:string,source?:string):void;
 repeatCheck(g:State,q:Prompt):void;resolveCheck(g:State,q:Prompt,result:Card):void;
 distance(g:State,from:string,to:string):number;range(g:State,p:Player):number;
 transfer(g:State,from:string,to:string,zone:'hand'|'table',card:string|undefined,steal:boolean,original?:Card):void;
 discardHand(g:State,p:Player,id:string):Card;
 suit(g:State,c:Card):string;note(g:State,s:string):void;
}
const insist=(v:unknown,s:string)=>{if(!v)throw Error(s);};
const enqueue=(g:ArmedGame,q:ArmedPrompt)=>g.queue.push(q as Prompt);
const prepend=(g:ArmedGame,q:ArmedPrompt)=>g.queue.unshift(q as Prompt);
export const characterLoadKey=(id:string)=>'character:'+id;
export const armedLoads=(g:ArmedGame,key:string)=>g.armed?.loads[key]??0;
export const armedSupply=(g:ArmedGame)=>32-Object.values(g.armed?.loads??{}).reduce((a,b)=>a+b,0);
export function armedSetup(g:ArmedGame,h:ArmedHost){if(!g.expansions.includes('armed'))return;g.armed={loads:{},used:[],extraBangs:0};for(const p of Object.values(g.players))if(h.has(p,'ringo'))g.armed.loads[characterLoadKey(p.id)]=4;}
export function armedTurn(g:ArmedGame){if(!g.armed)return;g.armed.used=[];g.armed.extraBangs=0;delete g.armed.tower;}
export function armedSources(g:ArmedGame,id:string){const p=g.players[id];return [characterLoadKey(id),...p.table.filter(isDangerous).map(c=>c.id)];}
export function armedTotal(g:ArmedGame,id:string){return armedSources(g,id).reduce((n,k)=>n+armedLoads(g,k),0);}
export function armedAdd(g:ArmedGame,id:string,key:string,n:number){insist(g.armed&&armedSources(g,id).includes(key),'Выберите своего персонажа или опасную карту.');const count=Math.max(0,Math.min(n,4-armedLoads(g,key),armedSupply(g)));g.armed!.loads[key]=armedLoads(g,key)+count;return count;}
/** Return loads whenever a physical card leaves play, before it can be replayed. */
export function armedRemove(g:ArmedGame,c:Card){if(g.armed)delete g.armed.loads[c.id];}
export function armedCleanup(g:ArmedGame){if(!g.armed)return;const keys=new Set(Object.values(g.players).flatMap(p=>[...(p.alive?[characterLoadKey(p.id)]:[]),...p.table.filter(isDangerous).map(c=>c.id)]));for(const key of Object.keys(g.armed.loads))if(!keys.has(key))delete g.armed.loads[key];}
function exhaust(g:ArmedGame,key:string,h:ArmedHost,explode=true){if(key.startsWith('character:')||armedLoads(g,key)>0)return;for(const p of Object.values(g.players)){const i=p.table.findIndex(c=>c.id===key);if(i<0)continue;const c=p.table.splice(i,1)[0];delete c.placed;g.discard.push(c);delete g.armed!.loads[key];if(c.kind==='bomb'&&explode)h.damage(g,p.id,undefined,2);break;}}
export function armedSpend(g:ArmedGame,id:string,n:number,sources:string[]|undefined,h:ArmedHost){insist(Number.isInteger(n)&&n>=0,'Некорректное число зарядов.');if(!n)return;const chosen=sources??Array.from({length:n},()=>characterLoadKey(id));insist(chosen.length===n,'Выберите источники всех расходуемых зарядов.');const available=armedSources(g,id),counts:Record<string,number>={};for(const key of chosen){insist(available.includes(key),'Нельзя тратить чужие заряды.');counts[key]=(counts[key]??0)+1;}for(const [key,count] of Object.entries(counts))insist(armedLoads(g,key)>=count,'Не хватает зарядов на выбранной карте.');for(const [key,count] of Object.entries(counts))g.armed!.loads[key]-=count;for(const key of Object.keys(counts))exhaust(g,key,h);}
function payCard(g:ArmedGame,p:Player,c:Card,h:ArmedHost){insist(p.table.some(x=>x.id===c.id)&&h.works(g,p),'Эта опасная карта сейчас недоступна.');armedSpend(g,p.id,loadCost(c.kind),Array(loadCost(c.kind)).fill(c.id),h);}
export function armedPlace(g:ArmedGame,c:Card){if(!isDangerous(c))return;insist(g.armed&&armedSupply(g)>=3,'В общем запасе должно быть хотя бы 3 заряда.');g.armed!.loads[c.id]=3;}
/** Queue optional allocation after a blue card or mandatory phase-3 discard. */
export function armedGrant(g:ArmedGame,id:string,n:number,front=false){if(!g.armed||n<=0||armedSupply(g)<=0||armedSources(g,id).every(k=>armedLoads(g,k)>=4))return;const q:ArmedPrompt={kind:'armed-load',player:id,count:n};if(front)prepend(g,q);else enqueue(g,q);}
export function armedPlayed(g:ArmedGame,id:string,c:Card,h:ArmedHost){if(!g.armed||!CARDS[c.kind].blue)return;if(!isDangerous(c))armedGrant(g,id,1);for(const p of Object.values(g.players))if(p.alive&&p.id!==id&&h.has(p,'preacher')&&armedTotal(g,p.id)>=2)enqueue(g,{kind:'armed-preacher',player:p.id});}
export function armedImmune(g:ArmedGame,p:Player,c:Card,h:ArmedHost,soleTarget=true){return soleTarget&&h.has(p,'abigail')&&!CARDS[c.kind].blue&&!CARDS[c.kind].green&&(c.rank===1||c.rank>=11);}
/** Capture weapon modifiers while the weapon is still on the table; consuming last load removes it. */
export function armedBang(g:ArmedGame,p:Player,c:Card,target:string,a:ArmedAction,q:Prompt,h:ArmedHost){if(!g.armed)return;const aq=q as ArmedPrompt;aq.armed={actual:c.kind==='bang',card:c};if(c.kind!=='bang'||!a.weapon)return;const weapon=p.table.find(x=>isDangerous(x)&&CARDS[x.kind].range);insist(weapon,'Нет опасного оружия.');const kind=weapon!.kind;insist(kind!=='doublebarrel'||h.suit(g,c)==='D','Двустволка усиливает только Бэнг! бубен.');payCard(g,p,weapon!,h);aq.armed.weapon=kind;if(kind==='doublebarrel')q.unavoidable=true;if(kind==='bigfifty'){g.armed.suppressed=target;g.armed.previousSilenced=g.players[target].silenced;g.armed.previousDisabled=(g.players[target] as Player&{armedDisabled?:boolean}).armedDisabled;(g.players[target] as Player&{armedDisabled?:boolean}).armedDisabled=true;g.players[target].silenced=true;q.barrels=0;}if(kind==='thunderer'){const i=g.discard.findIndex(x=>x.id===c.id);if(i>=0)p.hand.push(g.discard.splice(i,1)[0]);}}
export function armedReleaseSuppression(g:ArmedGame){if(!g.armed?.suppressed)return;g.players[g.armed.suppressed].silenced=g.armed.previousSilenced;(g.players[g.armed.suppressed] as Player&{armedDisabled?:boolean}).armedDisabled=g.armed.previousDisabled;delete g.armed.suppressed;delete g.armed.previousSilenced;delete g.armed.previousDisabled;}
/** Call once when the complete shot is canceled, not once for each Slab Dodge. */
export function armedCanceled(g:ArmedGame,q:Prompt,h:ArmedHost){const aq=q as ArmedPrompt;if(!g.armed||!q.source)return;const source=g.players[q.source];if(aq.armed?.actual&&h.has(source,'bloody'))h.draw(g,source.id,1);if(aq.armed?.weapon==='buntline'&&g.players[q.player].hand.length)prepend(g,{kind:'armed-discard',player:q.player});if(aq.armed?.card?.kind==='flintlock'&&source.alive&&armedTotal(g,source.id)>=2&&g.discard.some(c=>c.id===aq.armed!.card!.id))prepend(g,{kind:'armed-return',player:source.id,original:aq.armed.card});armedReleaseSuppression(g);}
export function armedDamaged(g:ArmedGame,p:Player,source:string|undefined,h:ArmedHost){if(!g.armed||!source||source===p.id||!h.has(p,'julie'))return;enqueue(g,{kind:'armed-julie',player:p.id,source});}
export function armedBombCheck(g:ArmedGame,p:Player,result:Card,h:ArmedHost){const bomb=p.table.find(c=>c.kind==='bomb');if(!bomb)return;if(['H','D'].includes(h.suit(g,result)))prepend(g,{kind:'armed-bomb-pass',player:p.id,original:bomb});else{g.armed!.loads[bomb.id]=Math.max(0,armedLoads(g,bomb.id)-2);exhaust(g,bomb.id,h);}}
/** Wrap a completed check before applying its result. Payload contains the original complete check. */
export function armedOfferReroll(g:ArmedGame,q:Prompt,result:Card,h:ArmedHost){if(!g.armed)return false;const ids=g.seats.filter(id=>g.players[id].alive&&h.works(g,g.players[id])&&g.players[id].table.some(c=>c.kind==='tumbleweed'&&armedLoads(g,c.id)>0));if(!ids.length)return false;prepend(g,{kind:'armed-tumbleweed',player:ids[0],armed:{remaining:ids.slice(1),result,originalCheck:q}});return true;}
export function armedBrown(g:ArmedGame,p:Player,c:Card,a:ArmedAction,h:ArmedHost){if(!g.armed||!['nip','arrow','caravan','flintlock','quickshot','reloading','rust','squaw'].includes(c.kind))return false;const n=a.upgrade??0;insist(Number.isInteger(n)&&n>=0,'Некорректное усиление.');const cost=ARMED_CARDS[c.kind].upgradeCost??0;insist(!n||cost>0&&c.kind!=='flintlock','Эту карту нельзя усилить сейчас.');const targets=a.targets??(a.target?[a.target]:[]);if(['arrow','flintlock','quickshot'].includes(c.kind)){insist(targets.length===1+n&&new Set(targets).size===targets.length,'Выберите разные цели для каждого выстрела.');for(const id of targets){insist(id!==p.id&&g.players[id]?.alive,'Выберите другого живого игрока.');if(c.kind!=='arrow')insist(h.distance(g,p.id,id)<=h.range(g,p),'Цель вне дальности оружия.');}}
 if(c.kind==='squaw')insist(a.target&&g.players[a.target]?.table.some(x=>x.id===a.choice),'Выберите открытую карту на столе.');
 armedSpend(g,p.id,n*cost,a.loads,h);
 if(c.kind==='nip'&&!p.ghost&&!p.phantom&&!p.shadow&&!p.trainGhost)p.hp=Math.min(p.maxHp,p.hp+1+n);
 if(c.kind==='caravan')h.draw(g,p.id,2+n);
 if(['arrow','flintlock','quickshot'].includes(c.kind))for(const id of targets){if(h.immune(g,id,c)||armedImmune(g,g.players[id],c,h,targets.length===1))continue;if(c.kind==='arrow')g.queue.push(h.reaction(g,{kind:'armed-arrow',player:id,source:p.id},c));else{const q=h.shot(g,id,p.id) as ArmedPrompt;q.armed={card:c};g.queue.push(h.reaction(g,q as Prompt,c));}}
 if(c.kind==='reloading')armedGrant(g,p.id,3,true);
 if(c.kind==='rust'){for(const other of Object.values(g.players))if(other.id!==p.id&&other.alive){const q:Prompt={kind:'armed-rust',player:other.id,source:p.id};const offered=h.reaction(g,q,c);if(offered.kind==='offer')g.queue.push(offered);else armedRustTarget(g,other.id,p.id,h);}}
 if(c.kind==='squaw')h.transfer(g,a.target!,p.id,'table',a.choice,n>0,c);
 return true;
}
export function armedDuck(g:ArmedGame,p:Player,c:Card,a:ArmedAction,h:ArmedHost){if(c.kind!=='duck'||!a.upgrade)return;insist(a.upgrade===1,'Пригнись! можно вернуть только один раз.');armedSpend(g,p.id,2,a.loads,h);const i=g.discard.findIndex(x=>x.id===c.id);if(i>=0)p.hand.push(g.discard.splice(i,1)[0]);}
/** Returns true when an expansion action was handled. Main engine still owns turn/queue routing. */
export function armedAction(g:ArmedGame,p:Player,a:ArmedAction,h:ArmedHost):boolean{
 if(!g.armed)return false;const q=g.queue[0] as ArmedPrompt|undefined;
 if(q?.player===p.id&&q.kind.startsWith('armed-')){
  if(q.kind==='armed-load'){insist(['armed-load','skip'].includes(a.type),'Распределите заряды или пропустите.');if(a.type==='skip'){g.queue.shift();return true;}armedAdd(g,p.id,a.choice??characterLoadKey(p.id),1);q.count!--;if(q.count!<=0||armedSupply(g)<=0||armedSources(g,p.id).every(k=>armedLoads(g,k)>=4))g.queue.shift();return true;}
  if(q.kind==='armed-preacher'||q.kind==='armed-return'){if(a.type==='skip'){g.queue.shift();return true;}insist(a.type==='armed-pay','Потратьте заряды или пропустите.');armedSpend(g,p.id,2,a.loads,h);g.queue.shift();if(q.kind==='armed-preacher')h.draw(g,p.id,1);else{const i=g.discard.findIndex(c=>c.id===q.original!.id);insist(i>=0,'Карта уже покинула сброс.');p.hand.push(g.discard.splice(i,1)[0]);}return true;}
  if(q.kind==='armed-discard'){insist(a.type==='discard'&&a.card,'Выберите карту для сброса.');h.discardHand(g,p,a.card!);g.queue.shift();return true;}
  if(q.kind==='armed-arrow'){insist(['respond','take','take-hit'].includes(a.type),'Сбросьте Бэнг! или примите урон.');if(a.type==='respond'){insist(p.hand.find(c=>c.id===a.card)?.kind==='bang','Нужна настоящая карта Бэнг!.');h.discardHand(g,p,a.card!);g.queue.shift();}else{g.queue.shift();h.damage(g,p.id,q.source,1);}return true;}
  if(q.kind==='armed-bomb-pass'){insist(a.type==='armed-pass'&&a.target!==p.id&&g.players[a.target??'']?.alive,'Выберите другого живого игрока.');insist(!g.players[a.target!].table.some(c=>c.kind==='bomb'),'У игрока уже есть Бомба.');const i=p.table.findIndex(c=>c.id===q.original!.id);insist(i>=0,'Бомба уже не на столе.');g.players[a.target!].table.push(p.table.splice(i,1)[0]);g.queue.shift();return true;}
  if(q.kind==='armed-tumbleweed'){insist(['armed-reroll','skip'].includes(a.type),'Повторите проверку или пропустите.');if(a.type==='armed-reroll'){const c=p.table.find(c=>c.id===a.card&&c.kind==='tumbleweed');insist(c,'Выберите Перекати-поле.');payCard(g,p,c!,h);g.queue.shift();const original=q.armed!.originalCheck!;h.repeatCheck(g,original);return true;}const next=q.armed!.remaining!.shift();if(next)q.player=next;else{g.queue.shift();h.resolveCheck(g,q.armed!.originalCheck!,q.armed!.result!);}return true;}
  return false;
 }
 if(a.type!=='armed-use'&&a.type!=='armed-ability')return false;
 if(a.type==='armed-use'){const c=p.table.find(c=>c.id===a.card&&isDangerous(c));insist(c,'Выберите свою опасную карту.');if(c!.kind==='crate'){insist(q?.kind==='shot'&&q.player===p.id&&!q.unavoidable,'Сейчас нельзя уклониться.');payCard(g,p,c!,h);q!.count=(q!.count??1)-1;if(q!.count<=0){g.queue.shift();armedCanceled(g,q as Prompt,h);}return true;}
 insist(!q&&g.active===p.id&&g.drawn&&!g.discarding,'Дождитесь своей фазы действий.');
 const kind=c!.kind;insist(['sleeve','bandolier','beerkeg','belltower','lockpick','whip'].includes(kind),'Эта карта применяется автоматически или во время реакции.');if(kind==='bandolier')insist(!g.armed.used.includes('bandolier'),'Патронташ уже использован в этот ход.');if(kind==='beerkeg')insist(!p.ghost&&!p.phantom&&!p.shadow&&!p.trainGhost&&p.hp<p.maxHp,'Жизни уже полные.');if(kind==='lockpick')insist(a.target!==p.id&&g.players[a.target??'']?.alive&&g.players[a.target!].hand.length,'Выберите другого игрока с картами.');if(kind==='whip')insist(g.players[a.target??'']?.table.some(x=>x.id===a.choice),'Выберите карту на столе.');payCard(g,p,c!,h);
 if(kind==='sleeve')h.draw(g,p.id,1);if(kind==='bandolier'){g.armed.extraBangs++;g.armed.used.push('bandolier');}if(kind==='beerkeg')p.hp++;if(kind==='belltower')g.armed.tower=true;if(kind==='lockpick')h.transfer(g,a.target!,p.id,'hand',undefined,true);if(kind==='whip')h.transfer(g,a.target!,p.id,'table',a.choice,false);return true;
 }
 insist(!q&&g.active===p.id&&g.drawn&&!g.discarding,'Дождитесь своей фазы действий.');const ability=a.choice!;insist(['bass','frankie','mexicali','ringo'].includes(ability)&&h.has(p,ability),'Эта способность недоступна.');insist(!g.armed.used.includes(ability),'Способность уже использована в этот ход.');
 if(ability==='bass'){insist(a.card&&p.hand.some(c=>c.id===a.card),'Выберите карту для сброса.');insist(armedSources(g,p.id).includes(a.to??characterLoadKey(p.id)),'Выберите свою карту для зарядов.');h.discardHand(g,p,a.card!);armedAdd(g,p.id,a.to??characterLoadKey(p.id),2);}
 if(ability==='frankie'){const key=a.from!;insist(armedLoads(g,key)>0&&key!==characterLoadKey(p.id),'Выберите другой источник заряда.');insist(Object.values(g.players).some(other=>other.alive&&armedSources(g,other.id).includes(key)),'Недоступный источник.');insist(armedLoads(g,characterLoadKey(p.id))<4,'На персонаже уже 4 заряда.');g.armed.loads[key]--;g.armed.loads[characterLoadKey(p.id)]=armedLoads(g,characterLoadKey(p.id))+1;exhaust(g,key,h);}
 if(ability==='mexicali'){insist(a.target!==p.id&&g.players[a.target??'']?.alive&&h.distance(g,p.id,a.target!)<=h.range(g,p),'Выберите цель в пределах дальности оружия.');armedSpend(g,p.id,2,a.loads,h);g.queue.push(h.shot(g,a.target!,p.id));}
 if(ability==='ringo'){const keys=a.targets??[];insist(keys.length>=1&&keys.length<=2&&armedLoads(g,characterLoadKey(p.id))>=keys.length,'Переместите один или два заряда.');for(const key of keys)insist(p.table.some(c=>c.id===key&&isDangerous(c)),'Выберите свою опасную карту.');for(const key of keys){g.armed.loads[characterLoadKey(p.id)]--;armedAdd(g,p.id,key,1);}}
 g.armed.used.push(ability);return true;
}

export function armedRustTarget(g:ArmedGame,target:string,source:string,h:ArmedHost){if(!g.armed||!g.players[target]?.alive)return;let removed=0;for(const key of armedSources(g,target))if(armedLoads(g,key)){g.armed.loads[key]--;removed++;exhaust(g,key,h);}if(g.players[source]?.alive)armedAdd(g,source,characterLoadKey(source),removed);}
