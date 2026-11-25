import {useState} from 'react';
import type {State} from '@bang/engine';
import {CardFace,Modal} from './Art';
export function CheckTheatre({checks,players,close}:{checks:NonNullable<State['checkHistory']>;players:State['players'];close:()=>void}){
 const [currentId,setCurrentId]=useState(checks[0].id);const index=Math.max(0,checks.findIndex(check=>check.id===currentId));const c=checks[index];
 return <Modal title={c.title+' · '+players[c.player].name} close={close}><div className="check-theatre" key={c.id}><div className="check-flip"><CardFace card={c.card}/></div><div className="check-outcome" role="status"><span className="eyebrow">РЕЗУЛЬТАТ ПРОВЕРКИ</span><h2>{c.result}</h2>{c.effectiveSuit!==c.card.suit&&<p>Событие изменило масть карты: {({H:'черва',D:'бубна',C:'трефа',S:'пика'} as Record<string,string>)[c.effectiveSuit]}.</p>}<button className="primary" onClick={()=>index<checks.length-1?setCurrentId(checks[index+1].id):close()}>{index<checks.length-1?'Следующая проверка':'Понятно'}</button></div></div></Modal>;
}
