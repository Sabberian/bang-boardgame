import {it,expect} from 'vitest';
import {setup,act,playerView,type State,type Action,type Shuffle} from './game';
import {makeDeck,type Card} from './content';
import {armedPlace} from './armed-runtime';
const shuffle:Shuffle=a=>[...a];
const card=(kind:string,id=kind,suit:Card['suit']='H'):Card=>({id,kind,suit,rank:5});
function step(g:State,id:string,a:Action){const r=act(g,id,a,shuffle);expect(r.error,JSON.stringify(a)).toBeUndefined();return r.state;}
function fixture(character='lucky'){
 let g=setup(4,shuffle,['legends','armed','train','wildwest','highnoon']);
 for(const id of g.seats)g=step(g,id,{type:'ready'});g=step(g,'0',{type:'start'});
 g.queue=[];g.active='0';g.drawn=true;g.event=undefined;g.wws=undefined;g.eventDeck=[];g.wwsDeck=[];g.deck=makeDeck();g.discard=[];
 g.legends!.legendary=['0'];for(const p of Object.values(g.players)){p.character='willy';p.hand=[];p.table=[];p.hp=4;p.maxHp=4;}
 g.players['0'].character=character;g.players['0'].legendary=true;return g;
}
function barrel(g:State){g.players['1'].table.push(card('barrel'));g.deck.unshift(card('beer','chosen'),card('bang','other','S'));g.queue=[{kind:'shot',player:'1',source:'0',count:1,barrels:1}];g=step(g,'1',{type:'barrel'});return step(g,'0',{type:'legend-lucky',card:'chosen'});}
it('independent: Lucky gets selected card after Tumbleweed owner passes',()=>{
 let g=fixture();const t=card('tumbleweed');g.players['2'].table.push(t);armedPlace(g,t);g=barrel(g);expect(g.queue[0].kind).toBe('armed-tumbleweed');g=step(g,'2',{type:'skip'});expect(g.players['0'].hand.map(c=>c.id)).toContain('chosen');
});
it('independent: Lucky must not override Julie character check',()=>{
 let g=fixture();g.players['1'].character='julie';g.deck.unshift(card('beer','julie-check'));g.queue=[{kind:'shot',player:'1',source:'0',count:1}];g=step(g,'1',{type:'take-hit'});expect(g.queue.some(q=>q.kind==='legend-lucky')).toBe(false);expect(g.queue[0].kind).toBe('shot');
});
it('independent: fatal dynamite check cannot supply its selected Beer before death resolution',()=>{
 let g=fixture();g.event='curse';g.players['0'].hp=3;g.players['0'].table=[card('dynamite')];const selected=card('beer','fatal','H');g.queue=[{kind:'legend-lucky',player:'0',other:'0',check:'dynamite',cards:[selected,card('bang','safe')]}];g=step(g,'0',{type:'legend-lucky',card:selected.id});expect(g.players['0'].hand.map(c=>c.id)).not.toContain(selected.id);
});
for(const event of ['thirst','train'] as const)it(`independent: legendary Jesse respects ${event} phase count`,()=>{
 let g=fixture('jesse');g.event=event;g.drawn=false;g.players['1'].hand=[card('beer','stolen')];g.queue=[{kind:'draw',player:'0'}];g=step(g,'0',{type:'draw',target:'1'});g=step(g,'0',{type:'legend-jesse',card:'stolen'});expect(g.players['0'].hand).toHaveLength(event==='thirst'?1:3);
});
it('independent: Ghost outlaw prevents law victory; removing Ghost wins and undo restores it',()=>{
 let g=fixture('willy');g.players['0'].role='sheriff';g.players['1'].role='outlaw';g.players['2'].role='outlaw';g.players['3'].role='renegade';
 for(const id of ['2','3']){g.players[id].alive=false;g.players[id].hp=0;}
 Object.assign(g.players['1'],{trainGhost:true,hp:0,table:[card('rail_ghostcar')]});g.players['0'].hand=[card('cat')];
 g=step(g,'0',{type:'mode',enabled:true});expect(g.phase).toBe('play');const before=structuredClone(g);
 g=step(g,'0',{type:'play',card:'cat',target:'1',choice:'rail_ghostcar'});expect(g.phase).toBe('finished');expect(g.winners).toEqual(['0']);expect(g.players['1'].alive).toBe(false);
 g=step(g,'0',{type:'undo'});expect(g.players).toEqual(before.players);expect(g.train).toEqual(before.train);expect(g.phase).toBe('play');
});
it('independent: Jesse private choice and undo snapshots do not reach other seats or spectators',()=>{
 let g=fixture('jesse');g.players['1'].hand=[card('beer','private1'),card('bang','private2')];g.drawn=false;g.queue=[{kind:'draw',player:'0'}];g=step(g,'0',{type:'draw',target:'1'});
 for(const viewer of ['2','3',null]){const v=playerView(g,viewer),serialized=JSON.stringify(v);expect(serialized).not.toContain('private1');expect(serialized).not.toContain('private2');expect(v.undo).toBeUndefined();expect(v.players['1'].role).toBeNull();}
 expect(playerView(g,'0').queue[0].cards?.map(c=>c.id)).toEqual(['private1','private2']);
});
it('independent: Lucky receives only the final Tumbleweed reroll selection and undo restores pending ownership',()=>{
 let g=fixture();const t=card('tumbleweed');g.players['2'].table.push(t);armedPlace(g,t);g=barrel(g);
 g.deck.unshift(card('beer','rerolled'),card('bang','reroll-other','S'));
 g=step(g,'2',{type:'armed-reroll',card:t.id});expect(g.players['0'].hand).toEqual([]);
 expect(g.discard.map(c=>c.id)).toContain('chosen');g=step(g,'0',{type:'legend-lucky',card:'rerolled'});
 const pending=structuredClone(g);g=step(g,'2',{type:'skip'});expect(g.players['0'].hand.map(c=>c.id)).toEqual(['rerolled']);
 g=step(g,'0',{type:'mode',enabled:true});g=step(g,'0',{type:'undo'});expect(g.queue).toEqual(pending.queue);expect(g.players).toEqual(pending.players);
});
it('independent: a failed Jail still awards the card from Lucky own turn after active seat changes',()=>{
 let g=fixture();g.players['0'].table=[card('jail')];g.queue=[{kind:'legend-lucky',player:'0',other:'0',check:'jail',cards:[card('bang','jail-fail','S'),card('beer','jail-pass')]}];
 g=step(g,'0',{type:'legend-lucky',card:'jail-fail'});expect(g.active).not.toBe('0');expect(g.players['0'].hand.map(c=>c.id)).toContain('jail-fail');
});
it('independent: Lucky can receive failed Barrel result before responding to the original shot',()=>{
 let g=fixture();g.players['0'].table=[card('barrel')];g.queue=[{kind:'legend-lucky',player:'0',other:'0',check:'barrel',cards:[card('missed','defense','S'),card('beer','heart')]},{kind:'shot',player:'0',source:'1',count:1,barrels:0}];
 g=step(g,'0',{type:'legend-lucky',card:'defense'});expect(g.queue[0].kind).toBe('shot');expect(g.players['0'].hand.map(c=>c.id)).toContain('defense');g=step(g,'0',{type:'respond',card:'defense'});expect(g.players['0'].hp).toBe(4);
});
it('independent: documented John Pain precedence never duplicates the selected card',()=>{
 let g=fixture();g.players['2'].character='john';g=barrel(g);expect(g.players['0'].hand).toEqual([]);expect(g.players['2'].hand.map(c=>c.id)).toEqual(['chosen','other']);expect(g.discard.map(c=>c.id)).not.toContain('chosen');expect(g.painPending).toEqual([]);
});
it('independent: Lucky does not intercept original Jourdonnais innate Barrel',()=>{
 let g=fixture();g.players['1'].character='jour';g.queue=[{kind:'shot',player:'1',source:'0',count:1,barrels:1}];g.deck.unshift(card('beer','innate'));
 g=step(g,'1',{type:'barrel'});expect(g.queue.some(q=>q.kind==='legend-lucky')).toBe(false);expect(g.players['0'].hand).toEqual([]);expect(g.queue).toEqual([]);
});
it('independent: Tumbleweed reroll preserves the innate check exclusion from legendary Lucky',()=>{
 let g=fixture();g.players['1'].character='jour';const t=card('tumbleweed');g.players['2'].table.push(t);armedPlace(g,t);g.queue=[{kind:'shot',player:'1',source:'0',count:1,barrels:1}];g.deck.unshift(card('beer','innate-first'),card('beer','innate-second'));
 g=step(g,'1',{type:'barrel'});g=step(g,'2',{type:'armed-reroll',card:t.id});expect(g.queue[0].kind).toBe('armed-tumbleweed');g=step(g,'2',{type:'skip'});expect(g.players['0'].hand).toEqual([]);expect(g.queue).toEqual([]);
});


