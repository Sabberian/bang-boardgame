// Isolated in-memory UI fixture; never imported by the production server.
const path=require('node:path');
const {Server}=require('boardgame.io/server');
const serve=require('koa-static');
const {Bang,setup,act}=require('../build/engine/src/game.js');
const identity=a=>[...a];
const game={...Bang,setup:()=>{let g=setup(4,identity,['wildwest','dodge','valley','highnoon']);for(const id of g.seats)g=act(g,id,{type:'ready'},identity).state;g=act(g,'0',{type:'start'},identity).state;const pool=[...g.deck,...Object.values(g.players).flatMap(p=>p.hand)];for(const p of Object.values(g.players)){p.hand=[];p.handCount=0;p.character='willy';}const give=(id,kind)=>{const i=pool.findIndex(c=>c.kind===kind);g.players[id].hand.push(pool.splice(i,1)[0]);g.players[id].handCount++;};give('0','stagecoach');give('0','beer');give('1','bang');give('1','beer');give('2','missed');give('3','missed');g.deck=pool;g.deckCount=pool.length;g.drawn=true;g.queue=[];g.wws='dorothy';g.wwsDeck=['sacagaway','wildwest'];g.wwsRemaining=2;g.event='blessing';g.log=['Изолированный QA-сценарий: Дороти и открытые руки.'];return g;}};
const server=Server({games:[game],origins:['http://localhost:3004','http://127.0.0.1:3004']});server.app.use(serve(path.resolve(__dirname,'../packages/client/dist')));server.run(3004,async()=>{const r=await fetch('http://localhost:3004/games/bang-boardgame/create',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({numPlayers:4,setupData:{expansions:['wildwest']}})});console.log('UI fixture: http://localhost:3004/#/m/'+(await r.json()).matchID);});
