const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {Client}=require('boardgame.io/client');
const {SocketIO}=require('boardgame.io/multiplayer');
const {Bang,actor,act}=require('../build/engine/src/game.js');
const {allCycleCandidates}=require('../build/engine/src/all-cycle-candidates.js');
const server=process.env.TEST_SERVER||'http://localhost:3003';
const legends=true;
const expansions=['dodge','valley','gold','shadows','wildwest','highnoon','fistful','armed','train','promos',...(legends?['legends']:[])];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn){for(let i=0;i<400;i++){if(fn())return;await pause(15);}throw Error('Network update timeout');}
async function post(path,body){const r=await fetch(server+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,200);return r.json();}
function digest(g){const v=structuredClone(g);for(const k of ['revision','manual','log','canUndo','errors'])delete v[k];return v;}
(async()=>{
 const {matchID}=process.env.TEST_RESUME?{matchID:process.env.TEST_RESUME}:await post('/games/bang-boardgame/create',{numPlayers:4,setupData:{expansions}}),clients=[],configs=[];let watch;
 const saved=key=>JSON.parse(fs.readFileSync(path.join(process.env.TEST_STATE_DIR||'data/matches',createHash('md5').update(key).digest('hex')),'utf8')).value;
 const previousLog=process.env.TEST_RESUME?saved(matchID+':log'):[];
 // Omniscient scripted fixture: preflight intentions against the QA room's own
 // persisted server state, then send every accepted move through real sockets.
 // Client/spectator privacy assertions below never use this server-only object.
 const stateFile=path.join(process.env.TEST_STATE_DIR||'data/matches',createHash('md5').update(matchID).digest('hex'));
 async function fullState(revision){let value;await until(()=>{try{value=JSON.parse(fs.readFileSync(stateFile,'utf8')).value.G;return value.revision===revision;}catch{return false;}});return value;}
 console.log(JSON.stringify({event:'started',matchID,legends,expansions}));
 try{
  for(let i=0;i<4;i++){const {playerCredentials}=process.env.TEST_RESUME?{playerCredentials:saved(matchID+':metadata').players[String(i)].credentials}:await post(`/games/bang-boardgame/${matchID}/join`,{playerID:String(i),playerName:`РђСѓРґРёС‚ ${i+1}`});const config={game:Bang,numPlayers:4,playerID:String(i),matchID,credentials:playerCredentials,multiplayer:SocketIO({server}),debug:false};configs.push(config);const c=Client(config);c.start();clients.push(c);}
  watch=Client({game:Bang,matchID,multiplayer:SocketIO({server}),debug:false});watch.start();await until(()=>clients.every(c=>c.getState()?.isConnected)&&watch.getState()?.isConnected);
  async function send(id,a,required=true){const rev=clients[+id].getState().G.revision,stateid=clients[+id].getState()._stateID;clients[+id].moves.act(a);await until(()=>clients[+id].getState()._stateID>stateid);const n=clients[+id].getState();if(n.G.revision===rev){if(required)throw Error(n.G.errors[id]||JSON.stringify(a));return false;}await until(()=>clients.every(c=>c.getState().G.revision===n.G.revision)&&watch.getState().G.revision===n.G.revision);return true;}
  if(!process.env.TEST_RESUME){for(let i=0;i<4;i++)await send(String(i),{type:'ready'});await send('0',{type:'start'});}
  const manualChecks=[];
  async function correction(a){const before=[...clients,watch].map(c=>digest(c.getState().G));await send('0',{type:'mode',enabled:true});await send('0',a);await send('0',{type:'undo'});for(const [i,c] of [...clients,watch].entries())assert.deepEqual(digest(c.getState().G),before[i]);await send('0',{type:'mode',enabled:false});manualChecks.push(a.type);}
  if(!process.env.TEST_RESUME){await correction({type:'manual-hp',target:'0',hp:Math.max(1,clients[0].getState().G.players['0'].hp-1)});
  await correction({type:'manual-move',from:'0',zone:'hand',card:clients[0].getState().G.players['0'].hand[0].id,destination:'discard'});
  await correction({type:'manual-load',choice:'character:0',hp:1});}
  const reconnectBefore=digest(clients[1].getState().G);clients[1].stop();clients[1]=Client({...configs[1],multiplayer:SocketIO({server})});clients[1].start();await until(()=>clients[1].getState()?.isConnected);assert.deepEqual(digest(clients[1].getState().G),reconnectBefore);manualChecks.push('reconnect-preserves-private-seat');
  if(process.env.TEST_REPLAY_DEATH==='1'){await send('2',{type:'mode',enabled:true});await send('2',{type:'undo'});await send('2',{type:'mode',enabled:false});await send('2',{type:'choose',card:'armed-11'});assert.notEqual(watch.getState().G.active,'2');manualChecks.push('fatal-dynamite-undo-replay-advances');}
  let actions=0,undos=0;const transcript=[];const crossroads=new Set();let last;
  for(;actions<250;actions++){
   const publicState=watch.getState().G;if(publicState.phase==='finished'||(publicState.checkHistory??[]).some(c=>/Кактус|Ром|Револьвер|разыскиваем|проверка поезда/i.test(c.title)))break;
   const id=actor(publicState),g=clients[+id].getState().G;
   for(let i=0;i<5;i++){const v=i===4?watch.getState().G:clients[i].getState().G;for(const key of ['deck','eventDeck','wwsDeck','equipmentDeck'])assert.deepEqual(v[key]??[],[]);assert.deepEqual(v.train?.deck??[],[]);assert.deepEqual(v.legends?.deck??[],[]);assert.equal(v.undo,undefined);assert.deepEqual(v.checkHistory??[],watch.getState().G.checkHistory??[]);assert.ok((v.checkHistory??[]).length<=8);for(const event of v.checkHistory??[]){assert.ok(event.card?.id&&event.title&&event.result);assert.ok(['H','D','S','C'].includes(event.effectiveSuit));}for(const pid of v.seats)if(pid!==String(i)){const p=v.players[pid];if(v.wws!=='sacagaway')assert.deepEqual(p.hand,[]);if(p.role!=='sheriff'&&(p.roleSecret||p.alive&&p.diedAt===undefined))assert.equal(p.role,null);assert.equal(p.spareCharacter,undefined);}for(const q of v.queue)if(q.player!==String(i)&&(['kit','dutch','claus','legend-kit','legend-jesse'].includes(q.kind)||q.kind==='train'&&['map','mail','lounge','cattle'].includes(q.trainTask)))assert.deepEqual(q.cards??[],[]);}
   const before=[...clients,watch].map(c=>digest(c.getState().G)),full=await fullState(g.revision);let accepted;
   const candidates=allCycleCandidates(full,id); if(full.queue[0] && ['shot','duel','indians','dying'].includes(full.queue[0].kind)) candidates.unshift(...full.players[id].hand.map(c=>({type:'respond',card:c.id})));
   if(full.queue[0]?.kind==='shot') candidates.unshift({type:'barrel'});
   if(!full.queue.length&&full.drawn&&!full.discarding){const extra=[];for(const c of full.players[id].table)for(const target of full.seats){extra.push({type:'armed-use',card:c.id,target});for(const other of full.players[target].table)extra.push({type:'armed-use',card:c.id,target,choice:other.id});}extra.push({type:'equipment-use',kind:'rucksack'},{type:'equipment-use',kind:'goldpan'});candidates.unshift(...extra);}
   for(const a of candidates){const crossKey=`${g.turn}:${id}:${a.choice}`;if(a.type==='legend-crossroad'&&crossroads.has(crossKey))continue;if(!act(full,id,a,items=>[...items]).error){await send(id,a);accepted=a;if(a.type==='legend-crossroad')crossroads.add(crossKey);break;}}
   assert.ok(accepted,JSON.stringify({id,q:g.queue[0],turn:g.turn}));transcript.push({actor:id,action:accepted,turn:g.turn,pending:g.queue[0]?.kind,cardKind:[...full.players[id].hand,...full.players[id].table,...full.market??[],...full.train?.cars??[]].find(c=>c.id===accepted.card)?.kind,alive:full.seats.filter(x=>full.players[x].alive),hp:Object.fromEntries(full.seats.map(x=>[x,full.players[x].hp]))});last={id,a:accepted};
   if(actions%23===0||watch.getState().G.phase==='finished'){
    await send(id,{type:'mode',enabled:true});await send(id,{type:'undo'});for(const [i,c] of [...clients,watch].entries())assert.deepEqual(digest(c.getState().G),before[i]);undos++;await send(id,{type:'mode',enabled:false});await send(id,accepted);
   }
   fs.writeFileSync('docs/qa/release-nov21-receipts-checkpoint.json',JSON.stringify({matchID,previousLog:previousLog.map(x=>({stateID:x._stateID,actor:x.action.payload.playerID,action:x.action.payload.args[0]})),actions:actions+1,undos,manualChecks,transcript},null,2));
   if(actions%50===0)console.log(JSON.stringify({event:'progress',actions,undos,turn:g.turn,phase:watch.getState().G.phase}));
  }
  const terminalBefore=[...clients,watch].map(c=>digest(c.getState().G)); for(let i=0;i<4;i++){clients[i].stop();clients[i]=Client({...configs[i],multiplayer:SocketIO({server})});clients[i].start();await until(()=>clients[i].getState()?.isConnected);assert.deepEqual(digest(clients[i].getState().G),terminalBefore[i]);} manualChecks.push('terminal-undo-replay-and-four-seat-reconnect'); const result=watch.getState().G;assert.ok((result.checkHistory??[]).length>0,'No check receipt exercised');assert.ok(undos>0);const report={checkHistory:result.checkHistory,phase:result.phase,matchID,previousLog:previousLog.map(x=>({stateID:x._stateID,actor:x.action.payload.playerID,action:x.action.payload.args[0]})),resumed:!!process.env.TEST_RESUME,server,expansions,players:4,actions,undos,manualChecks,finalTurn:result.turn,finalLog:result.log.slice(-12),finalPlayers:Object.fromEntries(result.seats.map(id=>[id,{role:result.players[id].role,character:result.players[id].character,hp:result.players[id].hp,alive:result.players[id].alive,shadow:result.players[id].shadow}])),winners:result.winners,winningRole:result.winningRole,privacyProjectionsChecked:actions*5,legendCrossroadPolicy:'At most one crossroad payment per turn/player/feat, including Company, to avoid a Suzy driver loop.',terminalReplay:last,method:'Omniscient scripted QA-room fixture chooses legal actions; four real Socket.IO player clients and one spectator verify synchronized moves, private projections and undo. Not browser play.',transcript};fs.writeFileSync('docs/qa/release-nov21-receipts.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,previousLog:undefined,transcript:undefined}));
 }finally{clients.forEach(c=>c.stop());watch?.stop();}
})().catch(e=>{console.error(e);process.exitCode=1;});
