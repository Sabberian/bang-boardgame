import {useEffect,useRef,useState} from 'react';
import type {State} from '@bang/engine';

// Retain public fields only: the hotseat handoff is visible to every player.
export type PublicSnapshot={revision:number;phase:State['phase'];log:string[];manual:boolean;players:Record<string,{name:string;hp:number}>};
export type PublicFeedback={revision:number;lines:string[];health:{id:string;name:string;before:number;after:number;kind:'damage'|'heal'|'correction'}[]};
function snapshot(g:State):PublicSnapshot{return {revision:g.revision,phase:g.phase,log:[...g.log],manual:g.manual,players:Object.fromEntries(g.seats.map(id=>[id,{name:g.players[id].name,hp:g.players[id].hp}]))};}
export function publicFeedback(before:PublicSnapshot,after:PublicSnapshot):PublicFeedback|null{
 if(before.revision===after.revision||before.phase==='lobby'||after.phase==='lobby')return null;
 // The public log is capped. Find its retained suffix instead of comparing lengths.
 let overlap=Math.min(before.log.length,after.log.length);
 while(overlap>0&&!before.log.slice(-overlap).every((line,i)=>line===after.log[i]))overlap--;
 const undone=after.log.at(-1)?.includes('отменяет последнее действие.');
 const lines=(undone?after.log.slice(-1):after.log.slice(overlap)).slice(-3);
 const correction=after.manual||before.manual||!!undone;
 const health=Object.entries(after.players).flatMap(([id,p])=>{
  const old=before.players[id];if(!old||old.hp===p.hp)return [];
  return [{id,name:p.name,before:old.hp,after:p.hp,kind:correction?'correction' as const:p.hp<old.hp?'damage' as const:'heal' as const}];
 });
 return lines.length||health.length?{revision:after.revision,lines,health}:null;
}
export function usePublicFeedback(g:State|undefined){
 const previous=useRef<PublicSnapshot>();const [feedback,setFeedback]=useState<PublicFeedback|null>(null);
 useEffect(()=>{if(!g)return;const next=snapshot(g);if(previous.current?.revision===next.revision)return;setFeedback(previous.current?publicFeedback(previous.current,next):null);previous.current=next;},[g?.revision,g?.phase]);
 return feedback;
}
export function HandoffReceipt({feedback}:{feedback:PublicFeedback|null}){
 if(!feedback)return null;
 return <section className="handoff-receipt" aria-label="Результат последнего действия" aria-live="polite" key={feedback.revision}><span className="eyebrow">ЧТО ПРОИЗОШЛО</span>{feedback.health.length>0&&<div className="handoff-health">{feedback.health.map(change=><div key={change.id} data-kind={change.kind}><strong>{change.name}</strong><span>{change.kind==='correction'?'Исправление':change.kind==='damage'?'Потеря жизни':'Восстановление'} · {change.before} → {change.after}</span></div>)}</div>}<div className="handoff-lines">{feedback.lines.map((line,i)=><p key={i}>{line}</p>)}</div></section>;
}
export function HealthDelta({feedback,id}:{feedback:PublicFeedback|null;id:string}){
 const change=feedback?.health.find(item=>item.id===id);if(!change)return null;
 const delta=change.after-change.before;
 return <span className="health-delta" data-kind={change.kind} key={feedback!.revision} aria-label={`${change.name}: жизни ${change.before} → ${change.after}${change.kind==='correction'?', ручное исправление':''}`}>{change.kind==='correction'?'↺ ':''}{delta>0?'+':''}{delta}</span>;
}
