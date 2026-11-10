/* Pocket Arcade chess integration. Rules: chess.js 1.4.0, vendored BSD-2-Clause. */
(function(root,factory){const vendor=typeof module==='object'&&module.exports?require('../vendor/chess-1.4.0.js'):root.ChessVendor;const api=factory(vendor);if(typeof module==='object'&&module.exports)module.exports=api;else root.ChessRules=api})(globalThis,function(vendor){
 'use strict';
 const {Chess,DEFAULT_POSITION,validateFen}=vendor;
 function isFen(v){
  if(typeof v!=='string'||v.length>=160||!validateFen(v).ok)return false;
  // FEN syntax alone does not reject an impossible previous move or phantom castling rights.
  const game=new Chess(v),turn=game.turn(),board=game.board().flat().filter(Boolean),other=turn==='w'?'b':'w',king=board.find(p=>p.type==='k'&&p.color===other);
  if(!king||game.isAttacked(king.square,turn))return false;
  for(const color of ['w','b']){const pieces=board.filter(p=>p.color===color),pawns=pieces.filter(p=>p.type==='p').length,promotions=['q','r','b','n'].reduce((n,t)=>n+Math.max(0,pieces.filter(p=>p.type===t).length-({q:1,r:2,b:2,n:2}[t])),0);if(pieces.length>16||pawns>8||promotions>8-pawns)return false}
  const ep=v.split(' ')[3];if(ep!=='-'){const file=ep[0],pawn=game.get(file+(turn==='w'?'5':'4'));if(game.get(ep)||pawn?.type!=='p'||pawn?.color!==other||game.get(file+(turn==='w'?'7':'2')))return false}
  const rights=v.split(' ')[2];
  for(const [right,k,r,color]of [['K','e1','h1','w'],['Q','e1','a1','w'],['k','e8','h8','b'],['q','e8','a8','b']])if(rights.includes(right)&&(game.get(k)?.type!=='k'||game.get(k)?.color!==color||game.get(r)?.type!=='r'||game.get(r)?.color!==color))return false;
  return true;
 }
 function legacyFen(v){if(!v||!Array.isArray(v.b)||v.b.length!==8||!v.b.every(r=>Array.isArray(r)&&r.length===8&&r.every(p=>typeof p==='string'&&/^[.prnbqkPRNBQK]$/.test(p))))return null;let rows=v.b.map(row=>{let s='',empty=0;for(const p of row){if(p==='.')empty++;else{if(empty)s+=empty;empty=0;s+=p}}return s+(empty||'')});const rights=[['K',7,4,7],['Q',7,4,0],['k',0,4,7],['q',0,4,0]].filter(([k,r,c,rook])=>v.rights?.[k]===true&&v.b[r][c]===(r===7?'K':'k')&&v.b[r][rook]===(r===7?'R':'r')).map(v=>v[0]).join('')||'-';const ep=v.ep&&[2,5].includes(v.ep.r)&&Number.isInteger(v.ep.c)&&v.ep.c>=0&&v.ep.c<8?String.fromCharCode(97+v.ep.c)+(8-v.ep.r):'-';const fen=rows.join('/')+' '+(v.whiteTurn===false?'b':'w')+' '+rights+' '+ep+' 0 1';if(isFen(fen))return fen;const withoutEp=fen.replace(' '+ep+' 0 1',' - 0 1');return isFen(withoutEp)?withoutEp:null}
 function restore(v){let initialFen=DEFAULT_POSITION,game=new Chess(),recovered=false;if(v&&v.version===3&&isFen(v.initialFen)&&Array.isArray(v.moves)&&v.moves.length<=4096&&isFen(v.fen)){try{game=new Chess(v.initialFen);for(const m of v.moves){if(typeof m!=='string'||m.length>16)throw Error('Invalid move');game.move(m)}if(game.fen()!==v.fen)throw Error('Position mismatch');initialFen=v.initialFen;recovered=true}catch{game=new Chess()}}else{const legacy=legacyFen(v);if(legacy){game=new Chess(legacy);initialFen=legacy;recovered=true}}
  return {game,initialFen,recovered,resultRecorded:recovered&&v?.resultRecorded===true}}
 function snapshot(game,initialFen,resultRecorded=false){return {version:3,initialFen,fen:game.fen(),moves:game.history(),resultRecorded}}
 function outcome(game){if(game.isCheckmate())return {terminal:true,type:'checkmate',winner:game.turn()==='w'?'b':'w',title:'Checkmate'};if(game.isStalemate())return {terminal:true,type:'stalemate',title:'Draw by stalemate'};if(game.isThreefoldRepetition())return {terminal:true,type:'repetition',title:'Draw by repetition'};if(game.isDrawByFiftyMoves())return {terminal:true,type:'fifty-move',title:'Draw by fifty-move rule'};if(game.isInsufficientMaterial())return {terminal:true,type:'material',title:'Draw by insufficient material'};return {terminal:false,type:game.isCheck()?'check':'playing'}}
 const values={p:100,n:320,b:335,r:500,q:900,k:0};
 function evaluate(game){let total=0;for(const row of game.board())for(const p of row){if(!p)continue;const file=p.square.charCodeAt(0)-97,rank=+p.square[1]-1,advance=p.color==='w'?rank:7-rank,center=7-Math.abs(file-3.5)-Math.abs(rank-3.5);let n=values[p.type];if(p.type==='p')n+=advance*8+Math.max(0,3-Math.abs(file-3.5))*3;if(p.type==='n'||p.type==='b')n+=center*8;if(p.type==='k')n-=center*3;total+=n*(p.color==='w'?1:-1)}return total*(game.turn()==='w'?1:-1)}
 const limits={easy:{depth:1,nodes:160,ms:60},medium:{depth:2,nodes:1400,ms:140},hard:{depth:3,nodes:5500,ms:260}};
 const toSquare=n=>typeof n==='string'?n:String.fromCharCode(97+(n&15))+(8-(n>>4));
 function chooseMove(game,difficulty='medium',overrides={}){const base=limits[difficulty]||limits.medium,config={depth:Math.max(1,Math.min(4,Number.isSafeInteger(overrides.depth)?overrides.depth:base.depth)),nodes:Math.max(1,Math.min(20000,Number.isSafeInteger(overrides.nodes)?overrides.nodes:base.nodes)),ms:Math.max(1,Math.min(2000,Number.isFinite(overrides.ms)?overrides.ms:base.ms))},start=Date.now();let nodes=0,aborted=false;const legal=game._moves();if(!legal.length||outcome(game).terminal)return {move:null,nodes:0,depth:0,elapsedMs:0};
  // Pinned chess.js fast search adapter. Keep the repetition map consistent for every speculative move.
  function push(move){game._makeMove(move);game._incPositionCount()}
  function pop(){const hash=game._hash;game._decPositionCount(hash);game._undoMove()}
  function order(moves){return moves.sort((a,b)=>((values[b.captured]||0)*10+(b.promotion?values[b.promotion]:0)-(values[b.piece]||0)*.01)-((values[a.captured]||0)*10+(a.promotion?values[a.promotion]:0)-(values[a.piece]||0)*.01)||String(a.from).localeCompare(String(b.from))||String(a.to).localeCompare(String(b.to)))}
  function search(depth,alpha,beta,ply){if(++nodes>config.nodes||Date.now()-start>config.ms){aborted=true;return evaluate(game)}if(game.isCheckmate())return -100000+ply;if(game.isDraw())return 0;if(depth===0)return evaluate(game);let best=-Infinity;for(const move of order(game._moves())){push(move);let value;try{value=-search(depth-1,-beta,-alpha,ply+1)}finally{pop()}if(aborted)return best===-Infinity?value:best;if(value>best)best=value;if(value>alpha)alpha=value;if(alpha>=beta)break}return best===-Infinity?evaluate(game):best}
  let bestMove=order(legal)[0],bestValue=-Infinity,completedDepth=0;
  for(let depth=1;depth<=config.depth;depth++){let candidate=null,value=-Infinity;for(const move of order([...legal])){push(move);let score;try{score=-search(depth-1,-Infinity,-value,1)}finally{pop()}if(aborted)break;if(score>value){value=score;candidate=move}}if(aborted)break;if(candidate){bestMove=candidate;bestValue=value;completedDepth=depth}}
  return {move:{from:toSquare(bestMove.from),to:toSquare(bestMove.to),...(bestMove.promotion?{promotion:bestMove.promotion}:{})},nodes:Math.min(nodes,config.nodes+1),depth:completedDepth,score:Number.isFinite(bestValue)?bestValue:null,elapsedMs:Date.now()-start,aborted};
 }
 function undoTurn(game,mode='computer'){let count=0;if(!game.history().length)return 0;const initialTurn=game.turn();game.undo();count++;if(mode==='computer'&&initialTurn==='w'&&game.history().length){game.undo();count++}return count}
 return {Chess,DEFAULT_POSITION,isFen,legacyFen,restore,snapshot,outcome,chooseMove,undoTurn,limits};
});
