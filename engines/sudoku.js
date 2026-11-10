// Ivory Sudoku V3 — ninety verified puzzles, daily challenges, notes and durable sessions.
// Requires logic/sudoku.js, loaded locally before this engine.
function sudokuSessionValid(state){
 try{
  if(!state||typeof state!=='object'||!Array.isArray(state.board))return false;
  const legacy=!state.puzzleId;
  const descriptor=SudokuLogic.puzzleById(legacy?'legacy:v2':state.puzzleId);if(!descriptor)return false;
  if(legacy){if(!SudokuLogic.validBoard(state.board)||!state.board.every((v,i)=>!descriptor.puzzle[i]||v===descriptor.puzzle[i]))return false;return !state.board.every((v,i)=>v===descriptor.solution[i])}
  return SudokuLogic.validateState(state,descriptor.puzzle)&&Number.isInteger(state.selected)&&state.selected>=-1&&state.selected<81&&!state.board.every((v,i)=>v===descriptor.solution[i]);
 }catch{return false}
}
if(typeof registerSessionValidator==='function')registerSessionValidator('sudoku',sudokuSessionValid);
function makeSudoku(){
 const S=SudokuLogic,options=typeof getGameOptions==='function'?getGameOptions('sudoku'):{difficulty:'easy',mode:'collection',puzzle:1};
 const saved=sessionRead('sudoku');let descriptor=S.getPuzzle(options);
 // V2 used one fixed puzzle. Resume its actual board rather than placing its entries in a new puzzle.
 if(saved&&!saved.puzzleId&&sudokuSessionValid(saved))descriptor=S.puzzleById('legacy:v2');
 else if(saved&&saved.puzzleId&&S.puzzleById(saved.puzzleId)&&S.validateState(saved,S.puzzleById(saved.puzzleId).puzzle)){
  // Daily sessions retain their original UTC day when resumed after midnight.
  const prior=S.puzzleById(saved.puzzleId);if(prior.mode===descriptor.mode&&prior.difficulty===descriptor.difficulty&&(prior.mode==='daily'||prior.number===descriptor.number))descriptor=prior;
 }
 const {puzzle,solution,id}=descriptor;
 let board=puzzle.slice(),notes=Array.from({length:81},()=>[]),selected=-1,hints=0,mistakes=0,elapsed=0,notesMode=false,done=false,lastPaint=-1;
 if(saved&&((!saved.puzzleId&&id==='legacy:v2')||saved.puzzleId===id)){
  const candidate=saved.puzzleId?saved:{...saved,puzzleId:id,notes:Array.from({length:81},()=>[]),mistakes:0,elapsed:0};
  if(S.validateState(candidate,puzzle)){board=candidate.board.slice();notes=candidate.notes.map(a=>a.slice());selected=Number.isInteger(candidate.selected)&&candidate.selected>=0&&candidate.selected<81?candidate.selected:-1;hints=candidate.hints;mistakes=candidate.mistakes;elapsed=candidate.elapsed;notesMode=candidate.notesMode===true;done=board.every((v,i)=>v===solution[i])}
 }
 const workspace=h('div','board-workspace sudoku-workspace'),boardSide=h('div','board-main'),sidebar=h('div','board-sidebar'),caption=h('div','board-caption'),grid=h('div','sudoku-board'),pad=h('div','number-pad'),guide=h('p','board-guide'),summary=h('p','sudoku-session-summary');
 const subtitle=descriptor.mode==='daily'?'DAILY · '+descriptor.day:descriptor.mode==='legacy'?'YOUR V2 PUZZLE':descriptor.difficulty.toUpperCase()+' · '+String(descriptor.number).padStart(2,'0')+' / 30';
 caption.append(h('span','board-kicker',subtitle),h('strong','','Ivory Sudoku'));
 boardSide.append(caption,grid);sidebar.append(h('div','board-kicker','YOUR NUMBERS'),pad,summary,guide);workspace.append(boardSide,sidebar);$('gameStage').append(workspace);
 const cells=[],numberButtons=[];
 for(let i=0;i<81;i++){const b=h('button');b.type='button';b.dataset.row=Math.floor(i/9);b.dataset.col=i%9;b.onclick=()=>{selected=i;feedback('tap');render();save()};cells.push(b);grid.append(b)}
 function formatTime(){const seconds=Math.floor(elapsed);return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')}
 function save(){sessionWrite('sudoku',{schema:3,puzzleId:id,board:board.slice(),notes:notes.map(a=>a.slice()),selected,hints,mistakes,elapsed,notesMode,done})}
 function paintHud(){hud([['TIME',formatTime()],['MISTAKES',mistakes],['FILLED',board.filter(Boolean).length+'/81']]);summary.textContent=hints+' hint'+(hints===1?'':'s')+' used · '+best('sudoku')+' unique puzzles solved';lastPaint=Math.floor(elapsed)}
 function render(){const sr=Math.floor(selected/9),sc=selected%9,sv=board[selected];board.forEach((v,i)=>{const r=Math.floor(i/9),c=i%9,peer=selected>=0&&(r===sr||c===sc||(Math.floor(r/3)===Math.floor(sr/3)&&Math.floor(c/3)===Math.floor(sc/3))),b=cells[i];b.className=(puzzle[i]?'fixed ':'editable ')+(peer?'peer ':'')+(sv&&v===sv?'matching ':'')+(selected===i?'selected ':'')+(v&&v!==solution[i]?'wrong ':'');
   if(v){b.textContent=String(v)}else if(notes[i].length){const pencil=h('span','sudoku-notes');for(let n=1;n<=9;n++)pencil.append(h('span','',notes[i].includes(n)?String(n):''));b.replaceChildren(pencil)}else b.textContent='';
   b.setAttribute('aria-label','Row '+(r+1)+' column '+(c+1)+(v?' value '+v:notes[i].length?' notes '+notes[i].join(', '):' empty')+(puzzle[i]?' given':''));b.setAttribute('aria-pressed',String(selected===i));b.disabled=done;
  });
  numberButtons.forEach((b,i)=>{const count=board.filter(v=>v===i+1).length;b.classList.toggle('complete',count===9);b.setAttribute('aria-label',(notesMode?'Toggle note ':'Enter ')+(i+1));b.disabled=done});
  notesButton.classList.toggle('selected',notesMode);notesButton.setAttribute('aria-pressed',String(notesMode));notesButton.textContent=notesMode?'Notes on':'Notes';notesButton.disabled=done;
  guide.textContent=done?'A little focus, a perfect finish.':selected<0?'Select an empty cell. Notes adds pencil marks.':puzzle[selected]?'Given numbers cannot be changed. Highlighted cells share a row, column or box.':notesMode?'Pencil mode: tap digits to toggle notes. Tap Notes again to enter a number.':'Enter a number. Mistakes are counted and marked in coral.';paintHud();
 }
 function completionLedger(){const raw=storeGet('pa_v3_sudoku_completed',{}),clean=Object.create(null);if(raw&&typeof raw==='object'&&!Array.isArray(raw))for(const [key,value]of Object.entries(raw)){if(key.length<61&&value&&Number.isFinite(value.seconds)&&value.seconds>=0&&Number.isSafeInteger(value.points)&&value.points>=0)clean[key]=value}return clean}
 function nextPuzzle(){if(typeof setGameOptions==='function')setGameOptions('sudoku',{difficulty:descriptor.difficulty,mode:'collection',puzzle:descriptor.mode==='collection'?descriptor.number%30+1:1});if(typeof restartGame==='function')restartGame()}
 function showFinish(points,stars){finishGame('Beautifully solved',descriptor.mode==='daily'?'Daily challenge complete · '+descriptor.day:'A clear mind and a complete grid.',{stats:[['TIME',formatTime()],['MISTAKES',mistakes],['HINTS',hints],['POINTS',points],['STARS',stars+'/3']],next:nextPuzzle})}
 function complete(){if(done||!board.every((v,i)=>v===solution[i]))return;done=true;
  const points=S.performanceScore(descriptor.difficulty,elapsed,hints,mistakes),stars=hints===0&&mistakes===0?3:hints<=3&&mistakes<=3?2:1,ledger=completionLedger();
  if(!ledger[id]){ledger[id]={seconds:Math.floor(elapsed),hints,mistakes,points,stars,completedAt:new Date().toISOString()};storeSet('pa_v3_sudoku_completed',ledger);record('sudoku',best('sudoku')+1)}
  else if(points>ledger[id].points){ledger[id]={seconds:Math.floor(elapsed),hints,mistakes,points,stars,completedAt:ledger[id].completedAt};storeSet('pa_v3_sudoku_completed',ledger)}
  recordScore('sudoku',points);
  if(descriptor.mode==='collection'&&typeof completeLevel==='function')completeLevel('sudoku',descriptor.number+Math.max(0,['easy','medium','hard'].indexOf(descriptor.difficulty))*30,stars);
  feedback('success');message('Puzzle solved. '+points+' points · '+stars+' stars.');save();render();showFinish(points,stars);
 }
 function enter(n){if(done||selected<0||puzzle[selected])return;if(notesMode&&n){if(board[selected]){message('Erase the number first to add notes.');return}notes=S.toggleNote(notes,selected,n);feedback('tap');render();save();return}
  if(board[selected]===n)return;board[selected]=n;notes[selected]=[];if(n&&n!==solution[selected]){mistakes++;feedback('fail')}else{feedback('tap');if(n)notes=S.pruneNotes(notes,selected,n)}render();complete();save();
 }
 for(let n=1;n<=9;n++){const b=h('button','',n);b.onclick=()=>enter(n);numberButtons.push(b);pad.append(b)}
 const clear=h('button','erase-number','⌫');clear.setAttribute('aria-label','Erase selected number or notes');clear.onclick=()=>{if(done||selected<0||puzzle[selected])return;if(!board[selected]){notes[selected]=[];render();save()}else enter(0)};pad.append(clear);
 const notesButton=action('Notes',()=>{if(done)return;notesMode=!notesMode;feedback('tap');render();save()});notesButton.setAttribute('aria-label','Toggle pencil notes');
 action('Hint',()=>{if(done)return;const idx=selected>=0&&!puzzle[selected]&&board[selected]!==solution[selected]?selected:board.findIndex((v,i)=>v!==solution[i]);if(idx<0)return;selected=idx;board[idx]=solution[idx];notes=S.pruneNotes(notes,idx,solution[idx]);hints++;feedback('score');render();complete();save()},'primary');
 action('Check',()=>{const wrong=board.reduce((n,v,i)=>n+(v!==0&&v!==solution[i]?1:0),0);feedback(wrong?'fail':'success');message(wrong?wrong+' number'+(wrong===1?' needs':'s need')+' another look.':'All entered numbers are correct. Keep going!')});
 listen(document,'keydown',e=>{if(e.key>='1'&&e.key<='9')enter(+e.key);if(e.key==='Backspace'||e.key==='Delete'){e.preventDefault();clear.click()}if(e.key.toLowerCase()==='n')notesButton.click()});render();
 if(done)queueMicrotask(()=>{const ledger=completionLedger(),entry=ledger[id];showFinish(entry?.points||0,entry?.stars||1)});
 return {save,update(dt){if(done)return;elapsed+=Math.max(0,Math.min(.25,dt));if(Math.floor(elapsed)!==lastPaint){paintHud();save()}}};
}
gameEngines.sudoku=makeSudoku;
