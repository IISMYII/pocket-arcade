/* Local, offline chess search worker. No downloaded code, network API, or dynamic evaluation. */
'use strict';
importScripts('../vendor/chess-1.4.0.js','./chess-rules.js');
self.onmessage=function(event){
 const data=event.data;
 if(!data||data.type!=='search'||!Number.isSafeInteger(data.token)||data.token<1||typeof data.fen!=='string'||data.fen.length>160||!['easy','medium','hard'].includes(data.difficulty))return;
 try{
  const restored=ChessRules.restore(data.snapshot);
  if(!restored.recovered||restored.game.fen()!==data.fen||restored.game.turn()!=='b'||ChessRules.outcome(restored.game).terminal)throw Error('Invalid position');
  const result=ChessRules.chooseMove(restored.game,data.difficulty);
  self.postMessage({type:'search-result',token:data.token,fen:data.fen,result});
 }catch{
  self.postMessage({type:'search-error',token:data.token,fen:data.fen});
 }
};
