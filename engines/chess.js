/* Ivory Chess V3: maintained legal rules, explicit promotions, resumable history. */
function makeChess(){
 const options=getGameOptions('chess'),mode=options.mode==='local'?'local':'computer',difficulty=['easy','medium','hard'].includes(options.difficulty)?options.difficulty:'medium';
 const winsKey='pa_v3_chess_wins_'+difficulty;function winCount(){const n=storeGet(winsKey,0);return Number.isSafeInteger(n)&&n>=0&&n<=1e9?n:0}
 const restored=ChessRules.restore(sessionRead('chess')),game=restored.game,initialFen=restored.initialFen;let selected=null,legal=[],aiDelay=0,resultRecorded=restored.resultRecorded,pending=null,lastSearch=null;
 let searchWorker=null,searchToken=0,searchJob=null,queuedSearch=null,workerDisabled=false,disposed=false;
 const fallbackLimits={easy:{depth:1,nodes:80,ms:12},medium:{depth:2,nodes:240,ms:20},hard:{depth:2,nodes:600,ms:30}};
 const workspace=h('div','board-workspace chess-workspace'),boardSide=h('div','board-main'),sidebar=h('div','board-sidebar chess-sidebar'),status=h('div','chess-status'),opponent=h('div','chess-player'),you=h('div','chess-player'),grid=h('div','chess-board'),ranks=h('div','chess-files'),history=h('ol','chess-history'),promotion=h('div','chess-promotion hidden');
 function pieceImage(type,color,cls='chess-piece'){const im=h('img',cls);im.src='./art/board-chess-'+(color==='w'?'white':'black')+'-'+type+'.svg';im.alt='';im.draggable=false;return im}
 function playerLine(el,color,name,sub){const copy=h('div');copy.append(h('strong','',name),h('small','',sub));el.append(pieceImage('n',color,'chess-avatar'),copy)}
 playerLine(opponent,'b',mode==='local'?'Black pieces':'The strategist',mode==='local'?'Local match':difficulty.toUpperCase()+' · Minimax computer');playerLine(you,'w','White pieces',mode==='local'?'Pass & play':'You · White');for(const file of 'abcdefgh')ranks.append(h('span','',file));boardSide.append(opponent,grid,ranks);sidebar.append(you,status,h('span','board-kicker','MOVE HISTORY'),history,h('p','board-guide','Tap a piece, then a marked square. Promotions let you choose a piece.'));workspace.append(boardSide,sidebar,promotion);$('gameStage').append(workspace);
 function save(){sessionWrite('chess',ChessRules.snapshot(game,initialFen,resultRecorded))}
 function cancelSearch(){searchToken++;searchJob=null;queuedSearch=null;if(searchWorker){searchWorker.onmessage=null;searchWorker.onerror=null;searchWorker.onmessageerror=null;searchWorker.terminate();searchWorker=null}}
 function failWorker(){cancelSearch();workerDisabled=true;aiDelay=0}
 function validMove(move){return !!(move&&typeof move==='object'&&typeof move.from==='string'&&typeof move.to==='string'&&/^[a-h][1-8]$/.test(move.from)&&/^[a-h][1-8]$/.test(move.to)&&(move.promotion===undefined||['q','r','b','n'].includes(move.promotion)))}
 function receiveSearch(event){
  if(disposed||!searchJob)return;const data=event.data;
  if(!data||data.token!==searchJob.token||data.fen!==searchJob.fen)return;
  const result=data.result;if(data.type!=='search-result'||!result||!validMove(result.move)){failWorker();return}
  // Never move a piece from an asynchronous callback. Paused games may safely queue this result.
  queuedSearch={token:data.token,fen:data.fen,result:{move:{from:result.move.from,to:result.move.to,...(result.move.promotion?{promotion:result.move.promotion}:{})},nodes:Number.isSafeInteger(result.nodes)&&result.nodes>=0?Math.min(result.nodes,20001):0,depth:Number.isSafeInteger(result.depth)&&result.depth>=0?Math.min(result.depth,4):0,elapsedMs:Number.isFinite(result.elapsedMs)&&result.elapsedMs>=0?Math.min(result.elapsedMs,10000):0,score:Number.isFinite(result.score)?result.score:null,aborted:result.aborted===true,transport:'worker'}};
 }
 function beginSearch(){
  const fen=game.fen();
  if(!workerDisabled){try{
   if(typeof Worker!=='function')throw Error('Worker unavailable');
   if(!searchWorker){const worker=new Worker('./logic/chess-worker.js');searchWorker=worker;worker.onmessage=receiveSearch;worker.onerror=event=>{event.preventDefault?.();if(!disposed&&searchWorker===worker)failWorker()};worker.onmessageerror=()=>{if(!disposed&&searchWorker===worker)failWorker()}}
   searchJob={token:++searchToken,fen,age:0};searchWorker.postMessage({type:'search',token:searchJob.token,fen,difficulty,snapshot:ChessRules.snapshot(game,initialFen,resultRecorded)});return;
  }catch{failWorker()}}
  // Restricted browsers still get a legal opponent; a smaller soft budget bounds UI interruption.
  lastSearch={...ChessRules.chooseMove(game,difficulty,fallbackLimits[difficulty]),transport:'fallback'};
  if(lastSearch.move)play(lastSearch.move);
 }
 function updateAI(dt){
  if(disposed)return;
  if(queuedSearch){const queued=queuedSearch;queuedSearch=null;
   if(searchJob&&queued.token===searchJob.token&&queued.fen===searchJob.fen&&game.fen()===queued.fen&&mode==='computer'&&game.turn()==='b'&&!ChessRules.outcome(game).terminal){
    const legalMove=game.moves({verbose:true}).some(m=>m.from===queued.result.move.from&&m.to===queued.result.move.to&&(m.promotion||undefined)===queued.result.move.promotion);
    if(legalMove){searchJob=null;lastSearch=queued.result;play(queued.result.move)}else failWorker();
   }
  }
  if(mode!=='computer'||game.turn()!=='b'||ChessRules.outcome(game).terminal)return;
  if(searchJob){searchJob.age+=Math.max(0,Math.min(1,Number.isFinite(dt)?dt:0));if(searchJob.age<=3)return;failWorker()}
  if(aiDelay>0){aiDelay-=dt;if(aiDelay>0)return}
  beginSearch();
 }
 function render(){const current=game.turn(),moves=game.history({verbose:true}),last=moves.at(-1),out=ChessRules.outcome(game);grid.replaceChildren();for(let r=0;r<8;r++)for(let c=0;c<8;c++){
  const square=String.fromCharCode(97+c)+(8-r),p=game.get(square),chosen=selected===square,can=legal.some(m=>m.to===square),previous=last&&(last.from===square||last.to===square),cell=h('button',((r+c)%2?'dark ':'')+(chosen?'selected ':'')+(can?'legal ':'')+(previous?'last-move ':'')+(p?(p.color==='w'?'white-piece':'black-piece'):''));
  cell.type='button';if(p)cell.append(pieceImage(p.type,p.color));if(can)cell.append(h('span','move-indicator'));if(c===0)cell.append(h('small','rank-label',8-r));cell.setAttribute('aria-label',square+(p?' '+(p.color==='w'?p.type.toUpperCase():p.type):' empty'));cell.setAttribute('aria-pressed',String(chosen));cell.onclick=()=>select(square);grid.append(cell)
 }status.classList.toggle('thinking',mode==='computer'&&current==='b'&&!out.terminal);status.replaceChildren(h('span','board-kicker',out.terminal?'MATCH COMPLETE':current==='w'?'WHITE TO PLAY':'BLACK TO PLAY'),h('strong','',out.terminal?out.title:game.isCheck()?'King in check.':mode==='computer'&&current==='b'?'Considering a reply…':'Find your next move.'));you.classList.toggle('active',current==='w'&&!out.terminal);opponent.classList.toggle('active',current==='b'&&!out.terminal);history.replaceChildren();const san=game.history();const rows=new Map();for(const m of moves.slice(-14)){const n=m.before.split(' ')[5];if(!rows.has(n))rows.set(n,{});rows.get(n)[m.color]=m.san}for(const [n,row]of rows)history.append(h('li','',n+'. '+(row.w||'…')+' '+(row.b||'')));history.scrollTop=history.scrollHeight;hud([['TURN',current==='w'?'WHITE':'BLACK'],['MOVES',Math.ceil(san.length/2)],['WINS',winCount()]]);undoButton.disabled=san.length===0;
 }
 function terminal(){if(disposed)return false;const out=ChessRules.outcome(game);if(!out.terminal)return false;aiDelay=0;cancelSearch();if(!resultRecorded){resultRecorded=true;if(out.winner==='w'&&mode==='computer'){const wins=Math.min(1e9,winCount()+1);storeSet(winsKey,wins);recordScore('chess',wins);if(typeof completeLevel==='function')completeLevel('chess',1,{easy:1,medium:2,hard:3}[difficulty])}save()}finishGame(out.winner?(out.winner==='w'?'White wins by checkmate':'Black wins by checkmate'):out.title,out.type==='repetition'?'The same position occurred three times.':out.type==='fifty-move'?'Fifty moves by each side without a pawn move or capture.':out.type==='material'?'Neither side has sufficient mating material.':out.type==='stalemate'?'The player to move has no legal move and is not in check.':'A complete match. Start a new one when ready.',{stats:[['Moves',Math.ceil(game.history().length/2)],['Mode',mode==='local'?'Local two player':difficulty+' computer']]});return true}
 function play(move){try{const played=game.move(move);feedback(played.captured?'score':'tap');selected=null;legal=[];pending=null;promotion.classList.add('hidden');save();render();if(!terminal()&&mode==='computer'&&game.turn()==='b')aiDelay=.3}catch{message('That move is not legal. Select another square.')}}
 function select(square){if(pending||ChessRules.outcome(game).terminal||(mode==='computer'&&game.turn()==='b'))return;const candidates=selected?legal.filter(m=>m.to===square):[];if(candidates.length){if(candidates.some(m=>m.promotion)){pending={from:selected,to:square};promotion.replaceChildren(h('strong','','Choose your promotion'));const row=h('div','promotion-options');for(const [type,name]of [['q','Queen'],['r','Rook'],['b','Bishop'],['n','Knight']]){const b=h('button');b.type='button';b.setAttribute('aria-label','Promote to '+name);b.append(pieceImage(type,game.turn()),h('span','',name));b.onclick=()=>play({...pending,promotion:type});row.append(b)}promotion.append(row);const cancel=h('button','btn quiet','Cancel');cancel.onclick=()=>{pending=null;promotion.classList.add('hidden')};promotion.append(cancel);promotion.classList.remove('hidden')}else play({from:selected,to:square});return}
  const p=game.get(square);if(p&&p.color===game.turn()){selected=square;legal=game.moves({square,verbose:true});feedback('tap')}else{selected=null;legal=[]}render()
 }
 const undoButton=action(mode==='computer'?'Undo turn':'Undo move',()=>{if(ChessRules.undoTurn(game,mode)){cancelSearch();aiDelay=0;selected=null;legal=[];pending=null;promotion.classList.add('hidden');save();render();message('Previous '+(mode==='computer'?'turn':'move')+' restored.');feedback('tap')}},'');
 handlers.push(()=>{disposed=true;cancelSearch()});
 render();if(mode==='computer'&&game.turn()==='b'&&!ChessRules.outcome(game).terminal)aiDelay=.3;if(ChessRules.outcome(game).terminal)queueMicrotask(terminal);else message(mode==='local'?'Two players, one board. White moves first.':'You play White. Undo takes back your full turn.');
 return {save,update:updateAI,destroy(){disposed=true;cancelSearch()},debugState(){return {fen:game.fen(),history:game.history(),lastSearch,search:{pending:!!searchJob,queued:!!queuedSearch,worker:!!searchWorker,disabled:workerDisabled,token:searchToken}}}};
}
gameEngines.chess=makeChess;
if(typeof registerSessionValidator==='function')registerSessionValidator('chess',v=>{const r=ChessRules.restore(v);return r.recovered&&!ChessRules.outcome(r.game).terminal});
