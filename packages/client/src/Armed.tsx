import {CARDS,hasAbility,actor,targets,range,distance,cardActionReason,type State,type Action,type Card} from '@bang/engine';
import {ARMED_CARDS,isDangerous,loadCost} from '../../engine/src/armed';
import {armedLoads,armedSupply,armedSources,armedTotal,characterLoadKey} from '../../engine/src/armed-runtime';
const ACTIVE=['sleeve','bandolier','beerkeg','belltower','lockpick','whip'];
const works=(g:State,id:string)=>!g.players[id].armedDisabled&&g.event!=='lasso'&&(g.active===id||!hasAbility(g.players[g.active],'belle'));
const isArmedIntent=(g:State,id:string,a:Action)=>a.type.startsWith('armed-')||['play','respond'].includes(a.type)&&!!g.players[id].hand.find(c=>c.id===a.card&&(!!ARMED_CARDS[c.kind]||c.kind==='bang'&&g.players[id].table.some(x=>isDangerous(x)&&CARDS[x.kind].range)));
export function armedCardIntent(g:State,id:string,c:Card,owner:string,zone:'hand'|'table'):Action|null{
 if(!g.armed||g.manual||owner!==id||g.phase!=='play')return null;const p=g.players[id],q=g.queue[0];
 if(q?.player===id&&q.kind==='armed-load'&&zone==='table'&&isDangerous(c))return {type:'armed-load',choice:c.id};
 if(zone==='table'&&isDangerous(c)&&works(g,id)){
  if(q?.player===id&&q.kind==='armed-tumbleweed'&&c.kind==='tumbleweed')return {type:'armed-reroll',card:c.id};
  if(q?.player===id&&q.kind==='shot'&&c.kind==='crate'&&!q.unavoidable)return {type:'armed-use',card:c.id};
  if(!q&&g.active===id&&g.drawn&&!g.discarding&&ACTIVE.includes(c.kind))return {type:'armed-use',card:c.id};
 }
 if(zone==='hand'&&q?.player===id&&q.kind==='shot'&&c.kind==='duck')return{type:'respond',card:c.id,upgrade:0};
 if(zone==='hand'&&!q&&g.active===id&&g.drawn&&!g.discarding&&!cardActionReason(g,id,c)&&(ARMED_CARDS[c.kind]&&!isDangerous(c)||c.kind==='bang'&&p.table.some(x=>isDangerous(x)&&CARDS[x.kind].range)))return {type:'play',card:c.id,upgrade:0};
 return null;
}
function pay(g:State,id:string,a:Action,key:string){const loads=a.loads??[],n=loads.filter(k=>k===key).length;return armedSources(g,id).includes(key)&&armedLoads(g,key)>n?{...a,loads:[...loads,key]}:a;}
export function armedIntentCard(g:State,id:string,a:Action,c:Card,owner:string,zone:'hand'|'table'):Action|null{
 if(!g.armed||!isArmedIntent(g,id,a))return null;
 if(a.kind==='armed-payment')return owner===id&&zone==='table'&&isDangerous(c)?pay(g,id,a,c.id):a;
 if(a.type==='armed-load')return owner===id&&zone==='table'&&isDangerous(c)?{...a,choice:c.id}:a;
 if(a.type==='armed-reroll')return owner===id&&c.kind==='tumbleweed'?{...a,card:c.id}:a;
 if(a.type==='armed-ability'){
  if(a.choice==='bass')return owner===id?(zone==='hand'?{...a,card:c.id}:isDangerous(c)?{...a,to:c.id}:a):a;
  if(a.choice==='frankie')return zone==='table'&&isDangerous(c)?{...a,from:c.id}:a;
  if(a.choice==='ringo')return owner===id&&zone==='table'&&isDangerous(c)?{...a,targets:[...(a.targets??[]).slice(-1),c.id]}:a;
  return a;
 }
 const played=g.players[id].hand.find(x=>x.id===a.card),used=g.players[id].table.find(x=>x.id===a.card);
 if(zone==='table'&&(played?.kind==='squaw'||used?.kind==='whip'))return{...a,target:owner,choice:c.id};
 return a;
}
export function armedIntentPlayer(g:State,id:string,a:Action,target:string):Action|null{
 if(!g.armed||!isArmedIntent(g,id,a))return null;
 if(a.kind==='armed-payment')return target===id?pay(g,id,a,characterLoadKey(id)):a;
 if(a.type==='armed-load')return target===id?{...a,choice:characterLoadKey(id)}:a;
 if(a.type==='armed-ability'&&a.choice==='bass')return target===id?{...a,to:characterLoadKey(id)}:a;
 if(a.type==='armed-ability'&&a.choice==='frankie')return target!==id?{...a,from:characterLoadKey(target)}:a;
 if(a.type==='armed-ability'&&a.choice==='ringo')return a;
 const c=g.players[id].hand.find(c=>c.id===a.card);
 if(c&&['arrow','quickshot'].includes(c.kind)){const selected=a.targets??[],list=selected.includes(target)?selected.filter(t=>t!==target):[...selected,target];return{...a,targets:list,target:list[0]};}
 return{...a,target};
}
/** Render beside existing HP/gold. Characters use characterLoadKey(owner); danger cards use card.id. */
export function LoadCounter({g,owner,source,send}:{g:State;owner:string;source:string;send:(a:Action)=>void}){if(!g.armed)return null;const n=armedLoads(g,source);return <span className="load-counter" title={'Заряды: '+n+' / 4'} aria-label={'Заряды: '+n+' из 4'}>{g.manual&&<button aria-label="Убрать заряд" disabled={!n} onClick={e=>{e.stopPropagation();send({type:'manual-load',choice:source,hp:n-1});}}>−</button>}<span aria-hidden="true">⬡</span> {n}{g.manual&&<button aria-label="Добавить заряд" disabled={n>=4||armedSupply(g)<=0} onClick={e=>{e.stopPropagation();send({type:'manual-load',choice:source,hp:n+1});}}>+</button>}</span>;}
export function ArmedActions({g,id,send,intent,setIntent}:{g:State;id:string;send:(a:Action)=>void;intent:Action|null;setIntent:(a:Action|null)=>void;selected?:Card;target?:string}){
 const p=g.players[id],q=g.queue[0];if(!g.armed||!p||g.manual||g.phase!=='play')return null;
 const own=g.active===id&&!q&&g.drawn&&!g.discarding;const pending=q?.player===id&&q.kind.startsWith('armed-');
 if(!intent){if(pending){if(q.kind==='armed-load')return null;
 if(['armed-preacher','armed-return'].includes(q.kind))return <div className="extra-intent"><p>{q.kind==='armed-preacher'?'Эл Проповедник: взять карту':'Вернуть Кремнёвый пистолет'} за 2 заряда?</p><button onClick={()=>setIntent({type:'armed-pay',kind:'armed-payment',loads:[]})}>Выбрать заряды</button><button onClick={()=>send({type:'skip'})}>Пропустить</button></div>;
 if(q.kind==='armed-bomb-pass')return <div className="extra-intent"><p>Передайте Бомбу другому игроку.</p><button onClick={()=>setIntent({type:'armed-pass'})}>Выбрать игрока</button></div>;
 if(q.kind==='armed-tumbleweed')return <div className="extra-intent"><p>Проверка: {q.armed?.result?CARDS[q.armed.result.kind].name:''}. Перекати-поле позволяет повторить её за 1 заряд.</p><button onClick={()=>setIntent({type:'armed-reroll',card:p.table.find(c=>c.kind==='tumbleweed'&&armedLoads(g,c.id)>0)?.id})}>Повторить проверку</button><button onClick={()=>send({type:'skip'})}>Оставить результат</button></div>;
 if(q.kind==='armed-arrow')return <div className="extra-intent"><p>Стрела: сбросьте настоящий Бэнг! с руки или потеряйте жизнь.</p><button onClick={()=>send({type:'take-hit'})}>Принять урон</button></div>;
 if(q.kind==='armed-discard')return <p className="extra-intent">Бантлайн: нажмите карту своей руки для сброса.</p>;
 }
 return own?<div className="armed-abilities">{(['bass','frankie','mexicali','ringo'] as const).filter(k=>hasAbility(p,k)&&!g.armed!.used.includes(k)).map(k=><button key={k} onClick={()=>setIntent({type:'armed-ability',choice:k,loads:[],targets:[]})}>{({bass:'Басс: обменять карту',frankie:'Фрэнки: забрать заряд',mexicali:'Мексикали: выстрелить',ringo:'Ринго: переместить заряды'})[k]}</button>)}</div>:null;}
 if(!isArmedIntent(g,id,intent))return null;const a=intent,physical=p.hand.find(c=>c.id===a.card),used=p.table.find(c=>c.id===a.card),kind=physical?.kind??used?.kind??'',info=ARMED_CARDS[kind],upgrade=a.upgrade??0;
 const update=(more:Partial<Action>)=>setIntent({...a,...more});const payment=a.type==='armed-pay'||a.type==='armed-ability'&&a.choice==='mexicali'?2:physical?(info?.upgradeCost??0)*upgrade:0;
 const paid=a.loads?.length??0;const total=armedTotal(g,id);const keyName=(key:string)=>key.startsWith('character:')?'Персонаж':CARDS[p.table.find(c=>c.id===key)?.kind??'']?.name??'Карта';
 const selected=a.target?g.players[a.target]:undefined;let valid=actor(g)===id,instruction='';
 if(a.type==='armed-load'){instruction='Нажмите своего персонажа или опасную карту, куда положить заряд.';valid=valid&&!!a.choice&&armedSources(g,id).includes(a.choice)&&armedLoads(g,a.choice)<4;}
 else if(a.type==='armed-pay'){instruction='Нажимайте свои карты или персонажа, чтобы выбрать 2 заряда.';valid=valid&&paid===2;}
 else if(a.type==='armed-pass'){instruction='Нажмите другого игрока, которому передадите Бомбу.';valid=valid&&!!selected&&selected.alive&&selected.id!==id;}
 else if(a.type==='armed-reroll'){instruction='Проверка будет выполнена заново, включая все карты Счастливчика и Подковы.';valid=valid&&!!used&&used.kind==='tumbleweed'&&armedLoads(g,used.id)>0;}
 else if(a.type==='armed-ability'){
  if(a.choice==='bass'){instruction='Выберите карту с руки для сброса, затем своего персонажа или опасную карту для двух зарядов.';valid=valid&&!!physical&&!!a.to&&armedSources(g,id).includes(a.to);}
  if(a.choice==='frankie'){instruction='Нажмите заряд на опасной карте любого игрока или чужого персонажа.';valid=valid&&!!a.from&&armedLoads(g,a.from)>0&&a.from!==characterLoadKey(id)&&armedLoads(g,characterLoadKey(id))<4;}
  if(a.choice==='ringo'){instruction='Нажмите одну или две свои опасные карты. Одна карта может получить оба заряда.';valid=valid&&!!a.targets?.length&&a.targets.length<=2&&armedLoads(g,characterLoadKey(id))>=a.targets.length;}
  if(a.choice==='mexicali'){instruction='Выберите 2 заряда и игрока в пределах дальности оружия.';valid=valid&&paid===2&&!!selected&&selected.id!==id&&selected.alive&&distance(g,id,selected.id)<=range(p,g);}
 }
 else if(a.type==='armed-use'){
  instruction=CARDS[kind]?.text??'';valid=valid&&!!used&&works(g,id)&&armedLoads(g,used.id)>=loadCost(kind);
  if(kind==='bandolier')valid=valid&&!g.armed.used.includes('bandolier');if(kind==='beerkeg')valid=valid&&p.hp<p.maxHp&&!p.ghost&&!p.shadow&&!p.phantom&&!p.trainGhost;
  if(kind==='lockpick')valid=valid&&!!selected&&selected.id!==id&&selected.alive&&selected.handCount>0;
  if(kind==='whip')valid=valid&&!!selected?.table.some(c=>c.id===a.choice);
 }
 else if(physical){instruction=CARDS[kind].text;valid=valid&&paid===payment&&!cardActionReason(g,id,physical);
  if(['arrow','quickshot'].includes(kind))valid=valid&&a.targets?.length===1+upgrade&&a.targets.every(t=>targets(g,id,physical).includes(t));
  else if(['bang','flintlock'].includes(kind))valid=valid&&!!a.target&&targets(g,id,physical).includes(a.target)&&(kind!=='bang'||a.weapon||distance(g,id,a.target)<=range(p,g));
  else if(kind==='squaw')valid=valid&&!!selected?.table.some(c=>c.id===a.choice);
 }
 const weapon=physical?.kind==='bang'?p.table.find(c=>isDangerous(c)&&CARDS[c.kind].range):undefined;
 return <section className="extra-intent armed-intent"><p><strong>{physical?CARDS[kind].name:used?CARDS[kind].name:'Заряды'}</strong> · {instruction}</p>
 {info?.upgradeCost&&kind!=='flintlock'&&physical&&<div className="choice-row"><span>Усиление: {upgrade}</span><button disabled={!upgrade} onClick={()=>update({upgrade:upgrade-1,loads:[],targets:undefined,target:undefined})}>−</button><button disabled={(upgrade+1)*info.upgradeCost>total||['duck','squaw'].includes(kind)&&upgrade>=1} onClick={()=>update({upgrade:upgrade+1,loads:[],kind:'armed-payment',targets:undefined,target:undefined})}>+ <span>{info.upgradeCost} ⬡</span></button></div>}
 {weapon&&<label className="weapon-upgrade"><input type="checkbox" checked={!!a.weapon} disabled={!works(g,id)||armedLoads(g,weapon.id)<loadCost(weapon.kind)||weapon.kind==='doublebarrel'&&physical?.suit!=='D'} onChange={e=>update({weapon:e.target.checked})}/> Усилить: {CARDS[weapon.kind].name} · {loadCost(weapon.kind)} ⬡</label>}
 {payment>0&&<div className="charge-payment"><button aria-pressed={a.kind==='armed-payment'} onClick={()=>update({kind:a.kind==='armed-payment'?undefined:'armed-payment'})}>{paid} / {payment} ⬡ · выбрать оплату</button><button disabled={!paid} onClick={()=>update({loads:[]})}>Очистить</button><small>{paid?(a.loads??[]).map(keyName).join(' · '):'Нажмите своего персонажа или опасные карты на столе.'}</small></div>}
 {a.kind==='armed-payment'&&payment>0&&paid===payment&&<button onClick={()=>update({kind:undefined})}>Выбрать цель на столе</button>}
 {a.targets?.length? <small>Выбрано: {a.targets.map(t=>g.players[t]?.name??keyName(t)).join(', ')}</small>:selected?<small>Цель: {selected.name}{a.choice&&selected.table.find(c=>c.id===a.choice)?' · '+CARDS[selected.table.find(c=>c.id===a.choice)!.kind].name:''}</small>:null}
 {a.type==='armed-load'&&a.choice&&<small>Заряд → {keyName(a.choice)}</small>}
 <div className="choice-row"><button className="primary" disabled={!valid} onClick={()=>send(a)}>Подтвердить</button><button onClick={()=>setIntent(null)}>Отмена</button></div></section>;
}

/** Initialize compulsory board targeting directly, without a redundant start button. */
export function armedPromptIntent(g:State,id:string):Action|null{const q=g.queue[0];if(q?.player!==id)return null;if(q.kind==='armed-bomb-pass')return{type:'armed-pass'};return null;}
