import {RUSSIAN_ART} from './russian-art';
import {useEffect,useRef,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {CARDS,SUITS,rank,type Card} from '@bang/engine';
export function Modal({title,children,close}:{title:string;children:ReactNode;close:()=>void}){const ref=useRef<HTMLDialogElement>(null);useEffect(()=>{const trigger=document.activeElement as HTMLElement|null;const dialog=ref.current;dialog?.showModal();return ()=>{dialog?.close();if(trigger?.isConnected)trigger.focus();};},[]);return createPortal(<dialog ref={ref} className="modal" aria-label={title} onCancel={e=>{e.preventDefault();close();}}><header><h2>{title}</h2><button onClick={close} aria-label="Закрыть окно">×</button></header>{children}</dialog>,document.body);}
export function CardFace({card,selected,onClick,onZoom,disabled,reason,small=false,previewSide}:{card:Card;selected?:boolean;onClick?:()=>void;onZoom?:(c:Card)=>void;disabled?:boolean;reason?:string|null;small?:boolean;previewSide?:"left"|"right"}){const info=CARDS[card.kind];return <div onClick={e=>{if(e.target===e.currentTarget&&!disabled)onClick?.();}} title={reason??info.text} className={`card-wrap ${small?'small':''} ${selected?'selected':''} ${RUSSIAN_ART.has(info.art??`01_${info.file}.png`)?'russian-art':''}`} data-card-name={info.name} data-preview-side={previewSide}><div className="card-visual"><button className={`playing-card ${info.blue?'blue':info.green?'green':''}`} onClick={onClick} disabled={disabled} aria-pressed={selected} aria-label={`${info.name}${card.rank>0?", "+rank(card.rank)+SUITS[card.suit]:""}`}><img src={`/art/${info.art??`01_${info.file}.png`}`} alt="" draggable={false}/><span className="card-name">{info.name}</span>{card.rank>0&&<span className={`poker ${['H','D'].includes(card.suit)?'red':''}`}>{rank(card.rank)}{SUITS[card.suit]}</span>}</button>{onZoom&&<button className="magnifier" aria-label={`Рассмотреть: ${info.name}`} title={info.text} onClick={()=>onZoom(card)}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></svg></button>}</div></div>;}
export function CardZoom({card,close}:{card:Card;close:()=>void}){
 const info=CARDS[card.kind];
 return <Modal title={info.name} close={close}>
   <div className="zoom-card">
     <CardFace card={card}/>
     <div className="card-reading">
       {card.rank>0&&<strong>{rank(card.rank)}{SUITS[card.suit]}</strong>}
       <p>{info.text}</p>
       {info.range&&<p className="card-property">Дальность оружия: {info.range}</p>}
     </div>
   </div>
 </Modal>;
}
