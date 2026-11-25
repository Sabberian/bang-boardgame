// Isolated in-memory QA server. No production debug routes or persistent matches.
const path=require('node:path');
const {Server}=require('boardgame.io/server');
const serve=require('koa-static');
const {Bang,setup,act}=require('../build/engine/src/game.js');
const {CHARACTERS}=require('../build/engine/src/content.js');
const identity=a=>[...a];
const expansions=['dodge','valley','highnoon','fistful','wildwest'];
const game={...Bang,validateSetupData:()=>undefined,setup:(_ctx,data)=>{
 let g=setup(4,identity,expansions);for(const id of g.seats)g=act(g,id,{type:'ready'},identity).state;g=act(g,'0',{type:'start'},identity).state;
 const pool=[...g.deck,...Object.values(g.players).flatMap(p=>p.hand)];
 const chars=[data.scenario,'teren','john','youl'];
 for(const p of Object.values(g.players)){p.hand=[];p.handCount=0;p.table=[];p.character=chars[+p.id];p.maxHp=CHARACTERS[p.character].hp+Number(p.role==='sheriff');p.hp=p.maxHp;}
 const give=(id,kind)=>{const i=pool.findIndex(c=>c.kind===kind);g.players[id].hand.push(pool.splice(i,1)[0]);g.players[id].handCount++;};
 for(const kind of ['stagecoach','bang','cat','beer'])give('0',kind);
 for(const id of ['1','2','3']){give(id,'bang');give(id,'missed');give(id,'beer');}
 g.deck=pool;g.deckCount=pool.length;g.drawn=true;g.queue=[];g.event='blessing';g.wws='susanna';g.wwsDeck=['sacagaway','wildwest'];g.wwsRemaining=2;
 if(data.scenario==='greygory'){g.players['0'].abilities=['kit','black'];g.queue=[{kind:'greygory',player:'0'},{kind:'draw',player:'0',handled:true}];g.drawn=false;}
 g.log=['Изолированная проверка персонажей Дикого Запада.'];return g;
}};
const server=Server({games:[game],origins:['http://localhost:3004']});
server.app.use(serve(path.resolve(__dirname,'../packages/client/dist')));
server.run(3004,async()=>{for(const scenario of ['flint','lee','greygory']){const r=await fetch('http://localhost:3004/games/bang-boardgame/create',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({numPlayers:4,setupData:{scenario}})});console.log(scenario+': http://localhost:3004/#/m/'+(await r.json()).matchID);}});
