import {CARDS,hasAbility,needsTarget,targets,distance,range,suit,type State,type Action,type Card} from '@bang/engine';
import {RAILCARS} from '../../engine/src/train';
const MULTI=['gatling','indians','store','saloon','bandidos','tornado','poker','brawl','howitzer','mostwanted','rail_circus','fullsteam'];
const ACTIVE_RAILS=['rail_baggage','rail_cattle','rail_circus','rail_coal','rail_express','rail_lounge','rail_mail','rail_passenger'];
export const trainIntentKind=(g:State,a:Action)=>a.type==='play'?(g.players[g.active]?.hand.find(c=>c.id===a.card)?.kind==='moneybag'?g.discard.at(-1)?.kind:g.players[g.active]?.hand.find(c=>c.id===a.card)?.kind):g.players[g.active]?.table.find(c=>c.id===a.card)?.kind;
/** Call before ordinary hand/table selection. Only cards with additional choices are intercepted. */
export function trainCardIntent(g:State,id:string,c:Card,owner:string,zone:'hand'|'table'):Action|null{
 if(!g.train||owner!==id||g.manual||g.phase!=='play')return null;const q=g.queue[0],p=g.players[id];
 if(zone==='hand'&&!q&&hasAbility(p,'blaze')&&MULTI.includes(c.kind)&&g.active===id&&g.drawn&&!g.discarding)return{type:'play',card:c.id};
 if(zone==='hand'&&!q&&g.active===id&&g.drawn&&!g.discarding&&['fullsteam','watertower','switch','trainrobbery','kniferevolver','mostwanted','moneybag'].includes(c.kind))return {type:'play',card:c.id};
 if(zone!=='table'||g.event==='lasso'||id!==g.active&&hasAbility(g.players[g.active],'belle'))return null;
 if(q?.player===id&&q.kind==='shot'){if(c.kind==='rail_caboose')return{type:'train-caboose'};if(c.kind==='rail_baggage')return{type:'train-baggage-miss',card:c.id};}
 if(q?.player===id&&['duel','indians'].includes(q.kind)&&c.kind==='rail_sleeper'&&g.train.sleeperTurn[id]!==g.turn)return{type:'train-sleeper'};
 if(!q&&g.active===id&&g.drawn&&!g.discarding){if(ACTIVE_RAILS.includes(c.kind))return{type:'train-use',card:c.id};if(c.kind==='rail_sleeper'&&g.train.sleeperTurn[id]!==g.turn)return{type:'train-sleeper-shot'};}
 return null;
}
/** Own cards pay costs; opponents' table cards are targets, never replace the played card. */
export function trainIntentCard(g:State,id:string,a:Action,c:Card,owner:string,zone:'hand'|'table'):Action|null{
 if(!g.train)return null;const kind=trainIntentKind(g,a);
 if(a.type==='play'&&kind==='fanning')return owner!==id&&zone==='table'?trainIntentPlayer(g,id,a,owner):a;
 if(['train-buy','train-sancho'].includes(a.type)){if(owner!==id)return a;const cards=a.cards??[];return {...a,cards:cards.includes(c.id)?cards.filter(x=>x!==c.id):[...cards,c.id]};}
 if(['train-caboose','train-sleeper','train-sleeper-shot'].includes(a.type)){return owner===id&&CARDS[c.kind]?.blue&&c.kind!==(a.type==='train-caboose'?'rail_caboose':'rail_sleeper')?{...a,card:c.id}:a;}
 if(a.type==='train-evan')return owner===id&&zone==='hand'?{...a,card:c.id}:a;
 if(a.type==='train-use'){if(owner===id&&kind!=='rail_coal')return a;if(zone==='table')return{...a,target:owner,...(kind==='rail_baggage'?{cost:c.id}:{choice:c.id})};return a;}
 if(a.type==='play'&&kind==='switch'){return zone==='table'?(owner===id?{...a,cost:c.id}:{...a,target:owner,choice:c.id}):a;}
 if(a.type==='play'&&['fullsteam','watertower','trainrobbery','kniferevolver','mostwanted','moneybag'].includes(g.players[id].hand.find(c=>c.id===a.card)?.kind??'')){if(zone==='table'&&owner!==id)return{...a,target:owner,choice:c.id};if(owner===id&&CARDS[kind??'']?.cost&&c.id!==a.card)return{...a,cost:c.id};return a;}
 return null;
}
export function trainIntentPlayer(g:State,id:string,a:Action,target:string):Action|null{
 if(!g.train)return null;if(a.type==='play'&&trainIntentKind(g,a)==='fanning')return a.target?{...a,target2:target}:{...a,target,target2:undefined};if(a.to==='exclude')return{...a,target2:target};if(a.type.startsWith('train-')||a.type==='play'&&['fullsteam','watertower','switch','trainrobbery','kniferevolver','mostwanted','moneybag'].includes(g.players[id].hand.find(c=>c.id===a.card)?.kind??''))return {...a,...(a.to==='exclude'?{target2:target}:{target})};return null;
}
export function trainFanningTargetsValid(g:State,id:string,a:Action):boolean{const physical=g.players[id].hand.find(c=>c.id===a.card);return !!physical&&!!a.target&&targets(g,id,{...physical,kind:'fanning'}).includes(a.target)&&!!a.target2&&a.target2!==id&&a.target2!==a.target&&!!g.players[a.target2]?.alive&&distance(g,a.target,a.target2)===1;}
export function TrainActions({g,id,send,intent,setIntent}:{g:State;id:string;send:(a:Action)=>void;intent:Action|null;setIntent:(a:Action|null)=>void}){
 const p=g.players[id],q=g.queue[0],t=g.train;if(!t||!p||g.manual||g.phase!=='play')return null;
 const reacting=q?.player===id&&q.kind==='shot'&&q.bang&&q.original?.kind==='bang';
 if(!intent)return reacting&&hasAbility(p,'evan')&&g.seats.some(x=>x!==id&&x!==q.source&&g.players[x].alive&&distance(g,id,x)===1)?<button onClick={()=>setIntent({type:'train-evan'})}>Эван: перенаправить выстрел</button>:null;
 const a=intent;if(['train-buy','train-sancho'].includes(a.type))return null;
 const physical=p.hand.find(c=>c.id===a.card),rail=p.table.find(c=>c.id===a.card),kind=trainIntentKind(g,a),isSpecial=a.type.startsWith('train-')||a.type==='play'&&physical&&['fullsteam','watertower','switch','trainrobbery','kniferevolver','mostwanted','moneybag'].includes(physical.kind);if(!isSpecial&&!(a.type==='play'&&hasAbility(p,'blaze')&&MULTI.includes(kind??'')))return null;
 const update=(extra:Partial<Action>)=>setIntent({...a,...extra}),target=a.target?g.players[a.target]:undefined,cost=[...p.hand,...p.table].find(c=>c.id===a.cost),chosen=[...p.hand,...p.table].find(c=>c.id===a.card);
 let instruction='',valid=false;
 if(a.type==='train-evan'){instruction='Выберите карту своей руки той же масти и нажмите соседа, кроме стрелявшего.';valid=!!chosen&&!!q?.original&&suit(g,chosen)===suit(g,q.original)&&!!target&&target.id!==id&&target.id!==q.source&&target.alive&&distance(g,id,target.id)===1;}
 else if(['train-caboose','train-sleeper','train-sleeper-shot'].includes(a.type)){instruction='Нажмите другую свою синюю карту в руке или на столе: она будет сброшена.';valid=!!chosen&&!!CARDS[chosen.kind]?.blue;if(a.type==='train-sleeper-shot'){instruction+=' Затем выберите цель выстрела.';valid=valid&&!!target&&target.alive&&target.id!==id&&distance(g,id,target.id)<=range(p,g);}}
 else if(a.type==='train-baggage-miss'){instruction='Багажный вагон будет сброшен вместо Мимо!.';valid=true;}
 else if(kind==='fullsteam'){instruction='Поезд достигнет конца линии. Что произойдёт с эффектом локомотива?';valid=['cancel','double'].includes(a.choice??'');}
 else if(kind==='watertower'){instruction='Нажмите вагон в открытом поезде: он достанется бесплатно.';const c=t.cars.find(c=>c.id===a.choice);valid=!!c;if(c?.kind==='rail_ghostcar'){instruction+=' Нажмите получателя, кроме шерифа (можно выбывшего).';valid=!!target&&target.role!=='sheriff';}}
 else if(kind==='switch'){instruction='Нажмите свою карту на столе, затем чужую карту для обмена.';valid=!!cost&&!!target&&target.id!==id&&target.table.some(c=>c.id===a.choice);}
 else if(kind==='trainrobbery'||kind==='kniferevolver'){instruction='Нажмите игрока за столом.';valid=!!target&&targets(g,id,{...physical!,kind}).includes(target.id);}
 else if(kind==='rail_baggage'){instruction=a.choice==='bang'?'Нажмите цель дополнительного выстрела.':a.choice?'Нажмите чужую карту на столе или рубашку руки.':'Выберите эффект багажного вагона.';valid=['bang','panic','cat'].includes(a.choice??'')&&!!target&&target.alive&&target.id!==id&&(a.choice!=='bang'||distance(g,id,target.id)<=range(p,g))&&(a.choice!=='panic'||distance(g,id,target.id)<=1);}
 else if(kind==='rail_cattle'){instruction='Посмотрите три верхние карты сброса и возьмите одну.';valid=g.discard.length>0;}
 else if(kind==='mostwanted'){instruction='Каждый игрок сделает проверку: пики отнимают жизнь.';valid=true;}
 else if(kind==='rail_circus'){instruction='Каждый другой игрок сбросит одну карту со своего стола.';valid=true;}
 else if(kind==='rail_coal'){instruction='Нажмите вагон на столе любого игрока для сброса.';valid=!!target?.table.some(c=>c.id===a.choice&&!!RAILCARS[c.kind]&&c.id!==a.card);}
 else if(kind==='rail_express'){instruction='Сбросьте всю руку и этот вагон: ход закончится и сразу начнётся дополнительный.';valid=t.expressTurn!==g.turn;}
 else if(kind==='rail_mail'||kind==='rail_lounge'){instruction='Нажмите другого игрока, которому достанется подарок.';valid=!!target&&target.alive&&target.id!==id;}
 else if(kind==='rail_passenger'){instruction='Нажмите чужую карту на столе или рубашку руки, чтобы забрать её.';valid=!!target&&target.alive&&target.id!==id&&target.handCount+target.table.length>0;}
 else if(hasAbility(p,'blaze')&&MULTI.includes(kind??'')){instruction=CARDS[kind!].text;valid=true;}
 else if(kind==='fanning'&&physical?.kind==='moneybag'){instruction='Нажмите первую цель в пределах оружия, затем вторую на расстоянии 1 от первой.';valid=trainFanningTargetsValid(g,id,a);}
 else if(physical?.kind==='moneybag'){instruction='Мешок денег повторит: '+(CARDS[kind??'']?.name??'нет коричневой карты в сбросе');const info=CARDS[kind??''];valid=!!info&&!info.blue&&!info.green&&kind!=='moneybag';if(valid&&needsTarget(p,{...physical,kind:kind!})){instruction+=' Выберите цель на столе.';valid=!!target&&targets(g,id,{...physical,kind:kind!}).includes(target.id);}if(info?.cost){instruction+=' Выберите дополнительную карту для оплаты.';valid=valid&&!!cost;}}
 const title=physical?CARDS[physical.kind].name:rail?CARDS[rail.kind].name:a.type==='train-evan'?'Эван Бэббит':a.type==='train-caboose'?'Тормозной вагон':'Спальный вагон';
 return <section className="extra-intent" aria-label={title}><p><strong>{title}</strong> · {instruction}</p>{kind==='fullsteam'&&<div className="choice-row"><button aria-pressed={a.choice==='cancel'} onClick={()=>update({choice:'cancel'})}>Отменить эффект</button><button aria-pressed={a.choice==='double'} onClick={()=>update({choice:'double'})}>Выполнить дважды</button></div>}{kind==='rail_baggage'&&<div className="choice-row">{[['bang','Бэнг!'],['panic','Паника!'],['cat','Красотка Кэт']].map(([choice,label])=><button key={choice} aria-pressed={a.choice===choice} onClick={()=>update({choice,cost:undefined,target:undefined})}>{label}</button>)}</div>}{target&&<small>Цель: {target.name}{a.choice&&target.table.find(c=>c.id===a.choice)?' · '+CARDS[target.table.find(c=>c.id===a.choice)!.kind].name:''}</small>}{kind==='fanning'&&a.target2&&<small>Вторая цель: {g.players[a.target2]?.name}</small>}{cost&&<small>Ваша карта: {CARDS[cost.kind].name}</small>}{hasAbility(p,'blaze')&&MULTI.includes(kind??'')&&<button aria-pressed={a.to==='exclude'} onClick={()=>update(a.to==='exclude'?{to:undefined,target2:undefined}:{to:'exclude'})}>{a.target2?'Не затронуть: '+g.players[a.target2].name:a.to==='exclude'?'Нажмите игрока для исключения':'Блейз: исключить игрока'}</button>}<div className="choice-row"><button className="primary" disabled={!valid} onClick={()=>send(a)}>Подтвердить</button><button onClick={()=>setIntent(null)}>Отмена</button></div></section>;
}
