const lines = [1,2,3,4,5,6,7,8];
var turncounter = 1; 								//total de movimentos
var whiteturn = true;								//turno
let notation = [];									//notação da partida padrão
var wCaptured = [];									//capturas
var bCaptured = [];
var score;											//contagem do valor das peças em jogo
let wKingPos;										//casa do rei
let bKingPos;
let castling = 	[true, true, true, true];			//roque permitido KQkq
let inCheck = false;								//em cheque
var gamehistory = [];								//registro de histórico do jogo
var gameover = true;								//jogo ativo ou terminado
let vsCPU = false;									//jogar contra bot
let cpuTurn = false;								//turno do bot
var cpuDepth = 2;									//dificuldade do bot


window.addEventListener('click', (e) => {
	e.preventDefault();
}
) 
window.addEventListener("dragenter", (event) => {
	event.preventDefault();
//	console.log(event)
	if (event.target.tagName == "TD") {
		dropzone = event.target.firstChild.getAttribute('value')
//		console.log(dropzone)
}
	if (event.target.tagName == "SPAN") {
	dropzone = event.target.getAttribute('value')
//		console.log(dropzone)
}

  });
window.addEventListener("dragover", (event) => {
	event.preventDefault();
  });
document.addEventListener('keydown', function(event) {
	if (event.ctrlKey && event.code === 'KeyZ') {
	  undoMove ()
	}
  });

const showYCoord = document.querySelectorAll('.nc') //mostrar coodenadas linhas
const showXCoord = document.querySelectorAll('.lc') //mostrar coordenadas letras

const newBoard = [
	"r","n","b","q","k","b","n","r", 
	"p","p","p","p","p","p","p","p",
	"f","f","f","f","f","f","f","f",
	"f","f","f","f","f","f","f","f",
	"f","f","f","f","f","f","f","f",
	"f","f","f","f","f","f","f","f",
	"P","P","P","P","P","P","P","P",
	"R","N","B","Q","K","B","N","R"];    //posição inicial

var current_position = [];				//posição atual

const pieces_utf = {
K: "♔",
Q: "♕",
R: "♖",
B: "♗",
N: "♘",
P: "♙",
k: "♚",
q: "♛",
r: "♜",
b: "♝",
n: "♞",
p: "♟",
f: "  "
}										//conteudo utf
const pieces_img = {
	K: getImage("assets/img/wk.png"),
	Q: getImage("assets/img/wq.png"),
	R: getImage("assets/img/wr.png"),
	B: getImage("assets/img/wb.png"),
	N: getImage("assets/img/wn.png"),
	P: getImage("assets/img/wp.png"),
	k: getImage("assets/img/bk.png"),
	q: getImage("assets/img/bq.png"),
	r: getImage("assets/img/br.png"),
	b: getImage("assets/img/bb.png"),
	n: getImage("assets/img/bn.png"),
	p: getImage("assets/img/bp.png"),
	f: getImage("assets/img/f.png")
}										//conteudo imagens
function getImage(src){
		var tmp = new Image();
		tmp.src = src;
		return tmp
	}

const tdelements = document.querySelectorAll("td");  //casas no documento (td)
var data = []										//casas no documento (td) em ordem
var boardRotation = 2;								//0=brancas 1=pretas 2=rotação automática
// perspectiva das pretas
function listDataB () {
	data = []
	for (let i = 0; i < 64; i++) {
		data.push(tdelements[63-i])
	}
	for (let i = 1; i <= 8; i++) {
		showYCoord[i-1].innerText = i
	}
	for (let i = 0; i < 8; i++) {
		showXCoord[7-i].innerText = columns[i]
	}
}
// perspectiva das brancas
function listDataW () {
	data = []
	for (let i = 0; i < 64; i++) {
		data.push(tdelements[i])
	}
	for (let i = 1; i <= 8; i++) {
		showYCoord[i-1].innerText = 9-i
	}
	for (let i = 0; i < 8; i++) {
		showXCoord[i].innerText = columns[i]
	}
}
//escolher perspectiva
function setView (vv) {
	const viewBtn = document.querySelectorAll('.viewb')
	boardRotation = vv
	for (let i = 0; i < 3; i++) {
		let bt = viewBtn[i]
			if (i == vv) {
				bt.classList.replace("uns", "sel")
			}
			else {
				bt.classList.replace("sel", "uns")
			}
	}
}

//novo jogo
let gstray = document.getElementById('gstray')
function newGame (ty) {
	gamehistory = []
	if (ty != 2) {
		vsCPU = true
		switch (ty) {
			case 0: 
				cpuTurn = false
				break;
			case 1:
				cpuTurn = true
				break;
		}
	}
	if (ty == 2) {
		vsCPU = false 
	}
	console.log("vscpu", vsCPU, cpuTurn)
	let resetBoard = {
		layout: newBoard,
		totalmoves: 1,
		castleRight: [true, true, true, true],
		notat: [],
		wCap: [],
		bCap: []
	}
	gstray.style.display = "none"
	setGame (resetBoard)
}
function gameSelect () {
	gstray.style.display = "block"
}

//iniciar jogo
function setGame (details) {
	gameover = false
	let board = details.layout;
	turncounter = details.totalmoves;
	notation = details.notat;
	wCaptured = details.wCap;
	bCaptured = details.bCap;
	castling = details.castleRight;
	moving = false;
	setBoard (board)
}

//voltar para posição anterior, se (vsCPU), vota 2 movimentos
function undoMove () {
	let previous;
	if (turncounter > 1) {
//		console.log(gamehistory, turncounter, vsCPU)
		gamehistory.pop()
		previous = gamehistory[turncounter-1]
		if (vsCPU) {
		gamehistory.pop()
		previous = gamehistory[turncounter-2]
		}
		setGame (previous) }
	else {
		window.alert("Indisponível")
	}
}

const columns = ["a","b","c","d","e","f","g","h"];
function getAbsoluteCoord (coordinate) {
	let row = coordinate.charAt(1)
	let col = coordinate.charAt(0)
	let coln = getColumnNumber (col);
	let sqNum = ((8-row) * 8) + coln
	return sqNum;
}													//converte coordenada de 2d para linear
function get2dCoord (linear) {
	let row = Math.floor(linear/8)
	let col = linear % 8
	let coln = columns[col];
	let rown = 8-row
	let twodc = ""
	twodc += coln += rown
	return twodc;
}													//converte coordenada de linear para 2d
function squareType (sqr) {
	let c = sqr % 16
	if (c>7) {
		c++
	}
	let evenodd = c % 2
	switch (evenodd) {
		case 0:
			return false
		case 1: 
			return true
	}
}													//casa clara ou escura

//atualizar posição
function setBoard (position) {
	score = updateScore (position)
	showCaptured ()
	let over = false
	if ((turncounter % 2) != 1) {
		whiteturn = false
		if (boardRotation == 0) {
			listDataW ()
		}
		else {
		listDataB ()}
	}
	else {
		whiteturn = true
		if (boardRotation == 1) {
			listDataB ()
		}
		else {
		listDataW ()}
	}
	for (i=0; i < 64; i++) {
	let c = data[i];
	if (turncounter > 1) {
		if (position[i] != current_position[i]) {
			data[i].style.outline = "2px dashed green"}
		else {
			data[i].style.outline = "none"
			}
	}
	let myPiece = placePiece (position[i], get2dCoord(i));
	c.setAttribute("value", position[i]);
	if (position[i] == "k") {
		bKingPos = i
	}
	if (position[i] == "K") {
		wKingPos = i
	}
	c.innerHTML = myPiece
	current_position[i] = position[i];
}	
	let position_fen = toFen(current_position, whiteturn)
	toXJS (position_fen)
	over = allLegalMoves (current_position, whiteturn, false)
		if (over == true) {
			if (inCheck == true) {
			window.alert("Xeque-mate")
				if (whiteturn) {
					notation.push("0-1")
					gameover = true
				}
				else {
					notation.push("1-0")
					gameover = true
				}
			}
			if (inCheck == false) {
			window.alert("Empate por afogamento")
					notation.push("0-0")
					gameover = true
			}
		}
		if (checkRepetition() == true) {
			window.alert("Empate por repetição")
			notation.push("0-0")
			gameover = true
		}
		document.getElementById('notated').innerText = notation
		if (vsCPU == true) {
			if (cpuTurn == false && whiteturn == false) {
				let mvstr = requestBotMove (position, cpuTurn, cpuDepth)
				cpuMove (mvstr)
			}
			if (cpuTurn == true && whiteturn == true) {
				let mvstr = requestBotMove (position, cpuTurn, cpuDepth)
				cpuMove (mvstr)
			}
		}
}													//atualiza tabuleiro
function placePiece (piece, squ) {
	let p = document.createElement('span');
	let spancl;
	switch (piece) {
		case "Q":
		case "R":
		case "B":
		case "N":
		case "P":
			spancl = "wpiece";
			break;
		case "q":
		case "r":
		case "b":
		case "n":
		case "p":
			spancl = "bpiece";
			break;
		case "K":
			spancl = "wking";
			break;
		case "k":
			spancl = "bking";
			break;
		case "f":
			spancl = "empty";
			break;
	}
	p.setAttribute('draggable', true)
	p.setAttribute("value", squ);
	p.setAttribute("class", spancl);
	p.setAttribute("id", piece);
	p.setAttribute("onclick", "pickPiece(event)")
	p.setAttribute("ondragstart", "pickPiece(event)")
	p.insertAdjacentElement("beforeend", pieces_img[piece]);
//	p.innerText = piece;
	return p.outerHTML;
}													//desenha peças

//exibir peças capturadas
function showCaptured () {
	let wcap = document.getElementById('wcap')
	let bcap = document.getElementById('bcap')
	let showw = ""
	let showb = ""
	let showp = ""
	let shown = ""
	let showbb = ""
	let showr = ""
	let showq = ""
	for (let i = 0; i < wCaptured.length; i++) {
		let cp = wCaptured[i]
			switch (cp) {
				case 'p':
					showp += pieces_utf[cp];
					break;
				case 'n':
					shown += pieces_utf[cp];
					break;
				case 'b':
					showbb += pieces_utf[cp];
					break;
				case 'r':
					showr += pieces_utf[cp];
					break;
				case 'q':
					showq += pieces_utf[cp];
					break;
			}
	}
	showw += showp + shown + showbb + showr + showq
	showp = ""
	shown = ""
	showbb = ""
	showr = ""
	showq = ""
	for (let i = 0; i < bCaptured.length; i++) {
		let cp = bCaptured[i]
			switch (cp) {
				case 'P':
					showp += pieces_utf[cp];
					break;
				case 'N':
					shown += pieces_utf[cp];
					break;
				case 'B':
					showbb += pieces_utf[cp];
					break;
				case 'R':
					showr += pieces_utf[cp];
					break;
				case 'Q':
					showq += pieces_utf[cp];
					break;
			}
	}
	showb += showp + shown + showbb + showr + showq
	if (score > 0) {
		showw += "+" + Math.abs(score)
	}
	else if (score < 0) {
		showb += "+" + Math.abs(score)
	}
	wcap.innerText = showw
	bcap.innerText = showb
} 
function updateScore (position) {
	let myScore = 0;
	for (let i = 0; i < position.length; i++) {
		let mypiece = position[i]
			switch (mypiece) {
				case "p": 
					myScore -= 1
					break;
				case "b":
				case "n": 
					myScore -= 3
					break;
				case "r": 
					myScore -= 5
					break;
				case "q": 
					myScore -= 9
					break;
				case "P": 
					myScore += 1
					break;
				case "B":
				case "N": 
					myScore += 3
					break;
				case "R": 
					myScore += 5
					break;
				case "Q": 
					myScore += 9
					break;
				default:
					break;
			}
	}
	return myScore
}

let picked;											//peça selecionada
let from;											//coordenada de origem
let to;												//coord de destino
let moving = false									//há peça selecionada p mover
var allmoves = []									//movimentos legais
var jumpedPawn;										//casa pulada por peão(habilita passant)
let pickedImg;										//correção de bug ao arrastar imagem no firefox
let dropzone;										//destino ao clicar e arrastar

//jogada do bot
function cpuMove (movecommand) {
	let mstart = movecommand.charAt(0) + movecommand.charAt(1)
	let mend = movecommand.charAt(2) + movecommand.charAt(3)
	from = getAbsoluteCoord(mstart);
	picked = current_position[from];
	allmoves.push(getAbsoluteCoord(mend))
	movePiece (mend);
}
//selecionar ao clicar
function pickPiece(event) {
	if (gameover == true) {
		return;
	}
	let thistarget;
	if (event.target.tagName == "IMG") {
		thistarget = event.target.parentElement
	}
	else if (event.target.tagName == "SPAN") {
		thistarget = event.target
	}
	if (event.type == "click") {
	event.preventDefault();
	}
	else if (event.type == "dragstart") {
		moving = false
		let draggedcoord = thistarget.getAttribute('value')
		from = getAbsoluteCoord(draggedcoord)
		picked = current_position[from]
		let dragged = thistarget
		event.dataTransfer.effectAllowed = "move";
		thistarget.style.opacity = "0.1"
		thistarget.addEventListener("dragend", function(e) {
			e.preventDefault()
			clearHighlights ()
			dragged.style.opacity = "1"
			if (dropzone != undefined) {
			movePiece(dropzone)
			}
			moving = false
		});
		}
	
	// se hover pç selecionada iniciar seleção de destino
	if ((event.type == "click") && (moving == true)) { 
		clearHighlights ()
		let selectedCoord = thistarget.getAttribute('value')
		movePiece(selectedCoord)
		moving = false
	}
	// inicia cálculo de movimentos possíveis
	else {
	allmoves = []
	let selectedPiece = thistarget.getAttribute('id')
	let selectedCoord = thistarget.getAttribute('value')
	let pieceClass = thistarget.getAttribute('class')
	let selectedColour;
	//confere se é seu turno
	switch (pieceClass) {
		case "wpiece":
		case "wking":
			selectedColour = "whites"
			break;
		case "bpiece":
		case "bking":
			selectedColour = "blacks"
			break;
	}

	if ((whiteturn == true) && (selectedColour != "whites"))  {
		return;
	}
	if ((whiteturn == false) && (selectedColour != "blacks"))  {
		return;
	}
	//ler posição e tipo de peça para calcular movimentos legais
	picked = selectedPiece;
	from = getAbsoluteCoord(selectedCoord);
	var legalMoves
	switch (picked) {
		case "Q":
			legalMoves = wQueen(from, current_position);
			highLight (from, legalMoves)
			moving = true
			break;
		case "R":
			legalMoves = wRook(from, current_position);
			highLight (from, legalMoves)
			moving = true
			break;
		case "B":
			legalMoves = wBishop(from, current_position);
			highLight (from, legalMoves)
			moving = true
			break;
		case "N":
			legalMoves = wKnight(from, current_position);
			highLight (from, legalMoves)
			moving = true
			break;
		case "P":
			legalMoves = wPawn(from, current_position);
			highLight (from, legalMoves)
			moving = true
			break;
		case "q":
			legalMoves = bQueen(from, current_position);
			highLight (from, legalMoves)
			moving = true
			break;
		case "r":
			legalMoves = bRook(from, current_position);
			highLight (from, legalMoves)
			moving = true
			break;
		case "b":
			legalMoves = bBishop(from, current_position);
			highLight (from, legalMoves)
			moving = true
			break;
		case "n":
			legalMoves = bKnight(from, current_position);
			highLight (from, legalMoves)
			moving = true
			break;
		case "p":
			legalMoves = bPawn(from, current_position);
			highLight (from, legalMoves)
			moving = true
			break;
		case "K":
 			legalMoves = wKing(from, current_position);
			highLight (from, legalMoves)
			moving = true 
			break;
		case "k":
			legalMoves = bKing(from, current_position);
			highLight (from, legalMoves)
			moving = true
			break;
	}

}}													 
//selecionar casa de destino
function movePiece(selectedCoord) {
	to = getAbsoluteCoord(selectedCoord);
	let tsqu = current_position[to];
	let notl = pieces_utf[picked];
	let new_position = [];
	let ischeck;
	let notpr = "";
	if (whiteturn) {
	  notpr = "  " + Math.ceil(turncounter/2) + "."
	}
	for (let i = 0; i < allmoves.length; i++) {
		if (allmoves[i] == to) {
			if (current_position[from] != picked) {
				console.log("err")
				break;
			}
//			console.log(turncounter, picked, get2dCoord(from), get2dCoord(to))
			for (let i = 0; i < 64; i ++) {
				new_position.push(current_position[i])
			}
//detecta movimentos de rei e torres
			switch (from) {
				case 0:
					castling[3] = false
					break;
				case 7:
					castling[2] = false
					break;
				case 4:
					castling[2] = false
					castling[3] = false
					break;
				case 56:
					castling[1] = false
					break;
				case 63:
					castling[0] = false
					break;
				case 60:
					castling[0] = false
					castling[1] = false
					break;
				default: 
					break;
			}
//regras de peão (pulo, passant, promoção)
				let rank = selectedCoord.charAt(1)
				if (picked == "P") {
					let doublestep = from-16;
					switch (to) {
						case doublestep:
							jumpedPawn = from-8
							break;
						case jumpedPawn:
							new_position[jumpedPawn+8] = "f";
							notl += getColumnName(from % 8);
							notl += "x";
							wCaptured.push("p")
							jumpedPawn = 88
							break;
						default:
							jumpedPawn = 88
							break
					}
					if (rank == 8) {
						picked = promoteWpawn ()
					}
				}
				else if (picked == "p") {
						let doublestep = from+16;
						switch (to) {
							case doublestep:
								jumpedPawn = from+8
								break;
							case jumpedPawn:
								new_position[jumpedPawn-8] = "f";
								notl += getColumnName(from % 8);
								notl += "x";
								bCaptured.push("P")
								jumpedPawn = 88
								break;
							default:
								jumpedPawn = 88
								break
						}
						if (rank == 1) {
							picked = promoteBpawn ()
						}
				}
				else {
					jumpedPawn = 88
				}
//identifica captura
				if (tsqu != "f") {
					notl += "x";
					if (whiteturn == true) {
						wCaptured.push(tsqu)
					}
					if (whiteturn == false) {
						bCaptured.push(tsqu)
					}
				}
				notl += selectedCoord;
//roque
				if ((picked == "K") && (from == 60) && (to == 62)){
					new_position[63] = "f"
					new_position[61] = "R"
					notl = "0-0"
				}
				if ((picked == "K") && (from == 60) && (to == 58)){
					new_position[56] = "f"
					new_position[59] = "R"
					notl = "0-0-0"
				}
				if ((picked == "k") && (from == 4) && (to == 6)){
					new_position[7] = "f"
					new_position[5] = "r"
					notl = "0-0"
				}
				if ((picked == "k") && (from == 4) && (to == 2)){
					new_position[0] = "f"
					new_position[3] = "r"
					notl = "0-0-0"
				}

				new_position[from] = "f";
				new_position[to] = picked;
//cheque de ataque
				if (whiteturn == true) {
					ischeck = checkChecks (new_position, false)
					if (ischeck == true) {
						window.alert("CHECK")
							inCheck = true
//							console.log("bch")
							notl += "+";
					}	
 					else {
						inCheck = false
					} 
				}
				if (whiteturn == false) {
					ischeck = checkChecks (new_position, true)
					if (ischeck == true) {
						window.alert("CHECK")
							inCheck = true
//							console.log("wch")
							notl += "+";
					}
					else {
						inCheck = false
					} 
				}
				notation.push(notpr + notl)
				turncounter++;
				moving = false;
				setBoard(new_position)
				break;}
		else {
			
	}
}
}

//colunas de a-h para 0-7
function getColumnNumber (str) {
	switch (str) {
		case "a":
			return 0;
		case "b":
			return 1;
		case "c":
			return 2;
		case "d":
			return 3;
		case "e":
			return 4;
		case "f":
			return 5;
		case "g":
			return 6;
		case "h":
			return 7;
	}
}
function getColumnName (nu) {
	return columns[nu]
}

//destaca peça selecionada e movimentos legais
function highLight (from, legalMoves) {
	if (pickedImg != undefined) {
		pickedImg.removeAttribute('class')
	} 
	let moveorigin = data[from].firstChild
	pickedImg = moveorigin.firstChild;
	pickedImg.setAttribute("class", "moving_piece")
	let lm = legalMoves.moves;
	let lt = legalMoves.takes;
	let all = lm.concat(lt)
	for (let i = 0; i < all.length; i++) {
		moveStart.push(from)
		allmoves.push(all[i])
	}
	for (let i = 0; i < lm.length; i++) {
		let coor = lm[i];
		let mysqu = data[coor]
		let mysqcl = mysqu.getAttribute('class')
		if (mysqcl == "light") {
			mysqu.setAttribute("class", "lmove")}
		if (mysqcl == "dark") {
			mysqu.setAttribute("class", "dmove")
		}
	}
	for (let i = 0; i < lt.length; i++) {
		let coor = lt[i];
		let mysqu = data[coor]
		let mysqcl = mysqu.getAttribute('class')
		if (mysqcl == "light") {
			mysqu.setAttribute("class", "ltake")}
		if (mysqcl == "dark") {
			mysqu.setAttribute("class", "dtake")
		}
//	console.log(mysqu);
	}	
}
function clearHighlights () {
	pickedImg.removeAttribute('class')
	for (let i = 0; i<64; i++) {
		let c = squareType (i)
		if (c == true) {
			data[i].setAttribute("class", "dark")
	}
		else if (c == false){
			data[i].setAttribute("class", "light")}
	}
}

//lógica de movimentos legais de cada peça
function wPawn (origin, position) {
	let row = Math.floor(origin/8)
	let col = origin % 8
	let mymoves = [];
	let mytakes = [];
	let boardMap = mapPosition(position)
	let moves;
	let takes;
	if (position[origin-8] == "f") {
		mymoves.push(origin-8);
	if ((row == 6) && (position[origin-8] == "f") && (position[origin-16] == "f")) {
		mymoves.push(origin-16);
	}
	}
	let takeL = origin-9
	if (takeL >= 0) {
	if ((boardMap[takeL] == "bpiece") && (col != 0)) {
		mytakes.push(takeL);
	}
	}
	let takeR = origin-7
	if ((boardMap[takeR] == "bpiece") && (col != 7)) {
		mytakes.push(takeR);
	}
	if ((row == 3) && (jumpedPawn == (origin-9)) && (position[jumpedPawn+8] == "p")) {
		mytakes.push(origin-9);
	}
	if ((row == 3) && (jumpedPawn == (origin-7)) && (position[jumpedPawn+8] == "p")) {
		mytakes.push(origin-7);
	}
	moves = noPinnedChecks(mymoves, origin, position)
	takes = noPinnedChecks(mytakes, origin, position)

	return {moves, takes};
}
function bPawn (origin, position) {
	let row = Math.floor(origin/8)
	let col = origin % 8
	let boardMap = mapPosition(position)
	let mymoves = [];
	let mytakes = [];
	let moves;
	let takes;
	if (position[origin+8] == "f") {
		mymoves.push(origin+8);
	}
	if ((row == 1) && (position[origin+8] == "f") && (position[origin+16] == "f")) {
		mymoves.push(origin+16);
	}
	
	let takeL = origin+9
	if (takeL <= 63) {
	if ((boardMap[takeL] == "wpiece") && (col != 7)) {
		mytakes.push(takeL);
	}
}
	let takeR = origin+7
	if ((boardMap[takeR] == "wpiece") && (col != 0)) {
		mytakes.push(takeR);
	}
	if ((row == 4) && (jumpedPawn == (origin+9)) && (position[jumpedPawn-8] == "P")) {
		mytakes.push(origin+9);
	}
	if ((row == 4) && (jumpedPawn == (origin+7)) && (position[jumpedPawn-8] == "P")) {
		mytakes.push(origin+7);
	}
	moves = noPinnedChecks(mymoves, origin, position)
	takes = noPinnedChecks(mytakes, origin, position)

	return {moves, takes};
}
function wBishop (origin, position) {
	let moves;
	let takes;
	let dch = checkDiagonals (origin, position, true)
	let mymoves = dch.empty
	let mytakes = dch.opponent
	moves = noPinnedChecks(mymoves, origin, position)
	takes = noPinnedChecks(mytakes, origin, position)

	return {moves, takes};
}
function bBishop (origin, position) {
	let moves;
	let takes;
	let dch = checkDiagonals (origin, position, false)
	let mymoves = dch.empty
	let mytakes = dch.opponent
	moves = noPinnedChecks(mymoves, origin, position)
	takes = noPinnedChecks(mytakes, origin, position)
	return {moves, takes};
}
function wRook (origin, position) {
	let moves;
	let takes;
	let lch = checkLines (origin, position, true)
	let mymoves = lch.empty
	let mytakes = lch.opponent
	moves = noPinnedChecks(mymoves, origin, position)
	takes = noPinnedChecks(mytakes, origin, position)
	return {moves, takes};
}
function bRook (origin, position) {
	let moves;
	let takes;
	let lch = checkLines (origin, position, false)
	let mymoves = lch.empty
	let mytakes = lch.opponent
	moves = noPinnedChecks(mymoves, origin, position)
	takes = noPinnedChecks(mytakes, origin, position)
	return {moves, takes};
}
function wKnight (origin, position) {
	let mymoves = [];
	let mytakes = [];
	let moves;
	let takes;
	let map = mapPosition(position)
	let knight_type = squareType(origin)
	let kcheck = [origin-17,origin-15,origin-10,origin-6,origin+6,origin+10,origin+15,origin+17];
		for (let i = 0; i < kcheck.length; i++) {
			if (position[kcheck[i]] !== undefined) {
				if (squareType([kcheck[i]]) == knight_type) {
					continue;
				}
			if (position[kcheck[i]] == "f") {
				mymoves.push(kcheck[i])
			}
			else if (map[kcheck[i]] == ("bpiece" || "bking")) {
				mytakes.push(kcheck[i])
			}
		}
		}
		moves = noPinnedChecks(mymoves, origin, position)
		takes = noPinnedChecks(mytakes, origin, position)
	return {moves, takes};
}
function bKnight (origin, position) {
	let mymoves = [];
	let mytakes = [];
	let moves;
	let takes;
	let map = mapPosition(position)
	let knight_type = squareType(origin)
	let kcheck = [origin-17,origin-15,origin-10,origin-6,origin+6,origin+10,origin+15,origin+17];
		for (let i = 0; i < kcheck.length; i++) {
			if (position[kcheck[i]] !== undefined) {
				if (squareType([kcheck[i]]) == knight_type) {
					continue;
				}
			if (position[kcheck[i]] == "f") {
				mymoves.push(kcheck[i])
			}
			else if (map[kcheck[i]] == ("wpiece" || "wking")) {
				mytakes.push(kcheck[i])
			}
		}
		}
		moves = noPinnedChecks(mymoves, origin, position)
		takes = noPinnedChecks(mytakes, origin, position)
	return {moves, takes};
}
function wQueen (origin, position) {
	let moves;
	let takes;
	let lch = checkLines (origin, position, true)
	let dch = checkDiagonals (origin, position, true)
	let mymoves = dch.empty.concat(lch.empty) 
	let mytakes = dch.opponent.concat(lch.opponent)
	moves = noPinnedChecks(mymoves, origin, position)
	takes = noPinnedChecks(mytakes, origin, position)
	return {moves, takes};
}
function bQueen (origin, position) {
	let moves;
	let takes;
	let lch = checkLines (origin, position, false)
	let dch = checkDiagonals (origin, position, false)
	let mymoves = dch.empty.concat(lch.empty) 
	let mytakes = dch.opponent.concat(lch.opponent)
	moves = noPinnedChecks(mymoves, origin, position)
	takes = noPinnedChecks(mytakes, origin, position)
	return {moves, takes};
}
function wKing (origin, position) {
	let moves;
	let takes;
	let col = origin % 8
	let mymoves = [];
	let mytakes = [];
	let adj_sq;
	let posmap = mapPosition(position)
	let kside = noPinnedChecks([61, 62], origin, position)
	let qside = noPinnedChecks([57, 58, 59], origin, position);
	if ((castling[0] == true) && (position[62] == "f") && (position[61] == "f") && (inCheck == false)) {
		if (kside.length == 2) {
			mymoves.push(62)}
	}
	if ((castling[1] == true) && (position[57] == "f") && (position[58] == "f") && (position[59] == "f") && (inCheck == false)) {
		if (qside.length == 3) {
			mymoves.push(58)}
	}
	//se estiver na coluna a
	if (col == 0) {
		adj_sq = [origin+1, origin+8, origin-8, origin-7, origin+9]
	}
	//se estiver na coluna h
	else if (col == 7) {
		adj_sq = [origin-1, origin+8, origin-8, origin+7, origin-9]
	}
	//senão
	else {
		adj_sq = [origin+1, origin-1, origin+8, origin-8, origin+7, origin-7, origin+9, origin-9]
	}
	for (let i = 0; i < adj_sq.length; i++) {
		let m = adj_sq[i]
	//posições válidas
		if ((m >= 0) && (m <= 63)) {
			if (position[m] == "f") {
				mymoves.push(m)
			}
			else if ((posmap[m] == "bpiece") || (posmap[m] == "bking")) {
				mytakes.push(m)
			}
		}
	}
	//movimentos legais
	moves = noPinnedChecks(mymoves, origin, position)
	takes = noPinnedChecks(mytakes, origin, position)
	return {moves, takes};
} 
function bKing (origin, position) {
	let moves;
	let takes;
	let col = origin % 8
	let mymoves = [];
	let mytakes = [];
	let adj_sq;
	let posmap = mapPosition(position)
	let kside = noPinnedChecks([6, 5], origin, position)
	let qside = noPinnedChecks([3, 2, 1], origin, position);
	if ((castling[2] == true) && (position[6] == "f") && (position[5] == "f") && (inCheck == false)) {
		if (kside.length == 2) {
			mymoves.push(6)}
	}
	if ((castling[3] == true) && (position[3] == "f") && (position[2] == "f") && (position[1] == "f") && (inCheck == false)) {
		if (qside.length == 3) {
			mymoves.push(2)}
	}
	//se estiver na coluna a
	if (col == 0) {
		adj_sq = [origin+1, origin+8, origin-8, origin-7, origin+9]
	}
	//se estiver na coluna h
	else if (col == 7) {
		adj_sq = [origin-1, origin+8, origin-8, origin+7, origin-9]
	}
	//senão
	else {
		adj_sq = [origin+1, origin-1, origin+8, origin-8, origin+7, origin-7, origin+9, origin-9]
	}
	for (let i = 0; i < adj_sq.length; i++) {
		let m = adj_sq[i]
	//posições válidas
		if ((m >= 0) && (m <= 63)) {
			if (position[m] == "f") {
				mymoves.push(m)
			}
			else if ((posmap[m] == "wpiece") || (posmap[m] == "wking")) {
				mytakes.push(m)
			}
		}
	}
	
	//movimentos legais
	moves = noPinnedChecks(mymoves, origin, position)
	takes = noPinnedChecks(mytakes, origin, position)
	return {moves, takes};
} 

//retorna movimentos possiveis na horizontal e vertical
function checkLines (origin, position, player) {
	let myclass;
	let myking;
	let opclass;
	let opking;

	let empty = [];
	let opponent = [];
	let mine = [];

// discrimina obstáculos (minhas peças) e capturas (oponente) 
	switch (player) {
		case true:
			myclass = "wpiece"
			myking = "wking"
			opclass = "bpiece"
			opking = "bking"
			break;
		case false:
			myclass = "bpiece"
			myking = "bking"
			opclass = "wpiece"
			opking = "wking"
			break;
	}
	let right = checkLineAH(origin, position)
	let left = checkLineHA(origin, position)
	let up = checkLine18(origin, position)
	let down = checkLine81(origin, position)
	let all = right.concat(left,up,down)
	for (let i = 0; i<all.length; i++) {
		if (all[i] == myclass) {
			continue;
		}
		if (all[i] == myking) {
			continue;
		}
		if (all[i] == opclass) {
			continue;
		}
		if (all[i+1] == myclass) {
			mine.push(all[i])
			continue;
		}
		if (all[i+1] == myking) {
			mine.push(all[i])
			continue;
		}
		if (all[i+1] == opclass) {
			opponent.push(all[i])
		} 
		if (all[i+1] == opking) {
			opponent.push(all[i])
		} 
		else {
			empty.push(all[i])
		}
	}
	return {empty, opponent, mine};
}
function checkLineAH (origin, position) {
	let row = Math.floor(origin/8)
	let col = origin % 8
	let ch = []
	let chl = 7-col
	let posmap = mapPosition(position)
	for (let i = 1; i <= chl; i++) {
		let cc = origin+i
		if (cc > 63) {
			break;	
		}
		let nx = position[cc]
		if (nx == "f") {
			ch.push(cc)
		}
		else {
			ch.push(cc)
			ch.push(posmap[origin+i])
			break;
		}
	}
	return ch;
}
function checkLineHA (origin, position) {
	let row = Math.floor(origin/8)
	let col = origin % 8
	let ch = []
	let posmap = mapPosition(position)
	for (let i = 1; i <= col; i++) {
		let cc = origin-i
		if (cc < 0) {
			break;
		}
				let nx = position[cc]
		if (nx == "f") {
			ch.push(cc)
		}
		else {
			ch.push(cc)
			ch.push(posmap[origin-i])
			break;
		}
	}
	return ch;
}
function checkLine18 (origin, position) {
	let row = Math.floor(origin/8)
	let col = origin % 8
	let ch = []
	let posmap = mapPosition(position)
	for (let i = 1; i <= row; i++) {
		let chl = origin-(i*8)
		if (chl < 0) {
			break;
		} 
		let nx = position[chl]
		if (nx == "f") {
			ch.push(chl)
		}
		else {
			ch.push(chl)
			ch.push(posmap[chl])
			break;
		}
	}
	return ch;
}
function checkLine81 (origin, position) {
	let row = Math.floor(origin/8)
	let col = origin % 8
	let ch = []
	let dr = 7-row
	let posmap = mapPosition(position)
	for (let i = 1; i <= dr; i++) {
		let chl = origin+(i*8)
		let nx = position[chl]
		if (chl > 63) {
			break;
		} 
		if (nx == "f") {
			ch.push(chl)
		}
		else {
			ch.push(chl)
			ch.push(posmap[chl])
			break;
		}
	}
	return ch;
}

//retorna movimentos possiveis nas diagonais
function checkDiagonals (origin, position, player) {
	let myclass;
	let myking;
	let opclass;
	let opking;

	let empty = [];
	let opponent = [];
	let mine = [];

// verifica o número e cor da casa para determinar o fim da diagonal (se não for 0-63 ou se mudar de escuras para claras e vice-versa)
	let diagType = squareType(origin)
	let position_map = mapPosition(position)
// discrimina obstáculos e capturas
	switch (player) {
		case true:
			myclass = "wpiece"
			myking = "wking"
			opclass = "bpiece"
			opking = "bking"
			break;
		case false:
			myclass = "bpiece"
			myking = "bking"
			opclass = "wpiece"
			opking = "wking"
			break;
	}

// alimenta os movimentos de cada diagonal até o fim do tabuleiro ou até encontrar uma peça
	for (let i = 1; i <= 8; i++) {       //diagonal h8
		let diagh8 = origin - (7 * i)

		// verifica o número e cor da casa para determinar o fim da diagonal (se não for 0-63 ou se mudar de escuras para claras e vice-versa)
		if (diagh8 < 0) {
			break;
		}
		if (squareType(diagh8) != diagType) {
			break;
		}
		else {
				let sqr = position_map[diagh8]
				switch (sqr) {
				case opclass: 
				opponent.push(diagh8)
				break;
				case myclass: 
				mine.push(diagh8)
				break;
				case opking: 
				opponent.push(diagh8)
				break;
				case myking: 
				mine.push(diagh8)
				break;
				case "empty":
					empty.push(diagh8)
					continue
				}
			break
			}
		}
	for (let i = 1; i <= 8; i++) {		//diagonal a8
		let diaga8 = origin - (9 * i)
			if (diaga8 < 0) {
				break;
			}
			if (squareType(diaga8) != diagType) {
				break;
			}
			else {
				let sqr = position_map[diaga8]
				switch (sqr) {
				case opclass: 
				opponent.push(diaga8)
				break;
				case myclass: 
				mine.push(diaga8)
				break;
				case opking: 
				opponent.push(diaga8)
				break;
				case myking: 
				mine.push(diaga8)
				break;
				case "empty":
					empty.push(diaga8)
					continue
				}
			break
			}
	}
	for (let i = 1; i <= 8; i++) {		//diagonal a1
		let diaga1 = origin + (7 * i)
			if (diaga1 > 63) {
				break;
			}
			if (squareType(diaga1) != diagType) {
				break;
			}
			else {
				let sqr = position_map[diaga1]
				switch (sqr) {
				case opclass: 
				opponent.push(diaga1)
				break;
				case myclass: 
				mine.push(diaga1)
				break;
				case opking: 
				opponent.push(diaga1)
				break;
				case myking: 
				mine.push(diaga1)
				break;
				case "empty":
					empty.push(diaga1)
					continue
				}
			break
			}
	}
	for (let i = 1; i <= 8; i++) {		//diagonal h1
		let diagh1 = origin + (9 * i)
			if (diagh1 > 63) {
				break;
			}
			if (squareType(diagh1) != diagType) {
				break;
			}
			else {
				let sqr = position_map[diagh1]
				switch (sqr) {
				case opclass: 
				opponent.push(diagh1)
				break;
				case myclass: 
				mine.push(diagh1)
				break;
				case opking: 
				opponent.push(diagh1)
				break;
				case myking: 
				mine.push(diagh1)
				break;
				case "empty":
					empty.push(diagh1)
					continue
				}
			break
			}
	}
//	console.log(empty)
//	console.log(opponent)
//	console.log(mine)
	return {empty, opponent, mine};
}

//procura por ataques de cavalo
function checkKnightAttacks (kpos, position) {

	let sqr_type = squareType(kpos);
	let jumps = [];
	let ncoord = [];
	let kcheck = [kpos-17,kpos-15,kpos-10,kpos-6,kpos+6,kpos+10,kpos+15,kpos+17];
		for (let i = 0; i < kcheck.length; i++) {
			if (position[kcheck[i]] !== undefined) {
				if (squareType([kcheck[i]]) == sqr_type) {
					continue;
				}
			else {
				jumps.push(position[kcheck[i]])
				ncoord.push(kcheck[i])
			}
		};
		};
		return {jumps, ncoord};
}
//impede o rei de mover para casas protegidas por peão
function checkPawnAttacks (kpos, position, player) {
	let col = kpos % 8 
	let oppawn;
	let pattacks;
	if (player == true) {
		oppawn = "p"
		switch (col) {
			case 0: 
			pattacks = [-7]
			break;
			case 7: 
			pattacks = [-9]
			break;
			default:
			pattacks = [-7, -9]
			break;
		}}
	else if (player == false) {
		oppawn = "P"
		switch (col) {
			case 0: 
			pattacks = [+9]
			break;
			case 7: 
			pattacks = [+7]
			break;
			default:
			pattacks = [+7, +9]
			break;
		}
	}
	for (let i = 0; i<pattacks.length; i++) {
		if (position[(kpos+pattacks[i])] != oppawn) {
			continue;
		}
		else {
			return true
		}
	}
	return false
}
//impede o rei de mover para casas protegidas por rei
function checkKingAdjacent (opking, position, player) {
		let col = opking % 8
		let adj_sq;
		//se estiver na coluna a
		if (col == 0) {
			adj_sq = [opking+1, opking+8, opking-8, opking-7, opking+9]
		}
		//se estiver na coluna h
		else if (col == 7) {
			adj_sq = [opking-1, opking+8, opking-8, opking+7, opking-9]
		}
		//senão
		else {
			adj_sq = [opking+1, opking-1, opking+8, opking-8, opking+7, opking-7, opking+9, opking-9]
		}
		for (let i = 0; i < adj_sq.length; i++) {
			let m = adj_sq[i]
		//posições válidas
			if (position[m] == picked) {
				return true
			}
		}
	return false
}

//discrimina a posição entre peças pretas, peças brancas, rei preto, rei branco, e casa vazia
function mapPosition (position) {
	let mymap = []

	for (let b = 0; b < 64; b++) {
		switch (position[b]) {
			case "Q":
			case "R":
			case "B":
			case "N":
			case "P":
				mymap[b] = "wpiece";
				break;
			case "q":
			case "r":
			case "b":
			case "n":
			case "p":
				mymap[b] = "bpiece";
				break;
			case "K":
				mymap[b] = "wking";
				break;
			case "k":
				mymap[b] = "bking";
				break;
			case "f":
				mymap[b] = "empty";
				break;
			}
		}
		return mymap
}
//encontra o rei
function findKing (position, king_colour) {
	let kstr;
	if (king_colour == true) {
		kstr = "K";
	}
	else {
		kstr = "k";
	}
	for (let i = 0; i < 64; i++) {
			if (position[i] == kstr) {
				return i;
			}
		}
}

//evita movimentos que desprotegem o rei
function noPinnedChecks (moves, starting, current) {
	let legal_moves = []
	let iboards = []
	let whitetomove;
	let mapped = mapPosition(current)
	switch (mapped[starting]) {
		case "wpiece":
		case "wking":
			whitetomove = true;
			break;
		case "bpiece":
		case "bking":
			whitetomove = false;
			break;	
	}
	for (let i = 0; i < moves.length; i++) {
		let ipos;
			ipos = toIBoard (current, starting, moves[i])
		iboards.push(ipos)
	}
	for (let i = 0; i < iboards.length; i++) {
		let isillegal = checkChecks (iboards[i], whitetomove)
		if (isillegal != true) {
			legal_moves.push(moves[i])
		}
	}
	return legal_moves
}

//procura cheques
function checkChecks (position, whitetomove) {
	let kpos = findKing (position, whitetomove);
	if (kpos == undefined) {
		return true
	}
	let opqu;
	let opro;
	let opb;
	let opn;
	let opk;

	if (whitetomove == true) {
		opk = findKing (position, false)
		if ((picked == "K") && (moving == true)) {
			let kch = checkKingAdjacent (opk, position, true)
			if (kch) {
				return true
			}
		}
		opqu = "q"
		opro = "r"
		opb = "b"
		opn = "n"
	} 
	else if (whitetomove == false) {
		opk = findKing (position, true)
		if ((picked == "k") && (moving == true)) {
			let kch = checkKingAdjacent (opk, position, false)
			if (kch) {
				return true
			}
		}
		opqu = "Q"
		opro = "R"
		opb = "B"
		opn = "N"
	}
	let lch = checkLines (kpos, position, whitetomove)
	let dch = checkDiagonals (kpos, position, whitetomove)
	let nch = checkKnightAttacks (kpos, position)
	let pch = checkPawnAttacks (kpos, position, whitetomove)
	if (pch == true) {
		return true;
	}
	for (let i = 0; i < nch.ncoord.length; i++) {
		let k = nch.ncoord[i]
		if (position[k] == opn) {
			return true
		}
	}
	for (let i = 0; i < lch.opponent.length; i++) {
		let p = lch.opponent[i]
		if (position[p] == opqu) {
			return true
		}
		if (position[p] == opro) {
			return true;
		}
	}
	for (let i = 0; i < dch.opponent.length; i++) {
		let p = dch.opponent[i]
		if (position[p] == opqu) {
			return true;
		}
		if (position[p] == opb) {
			return true;
		}
	}
	return false
}  

//determina se há movimentos legais, se (abstract), retorna coordenadas dos movimentos
let moveStart = []
function allLegalMoves (position, whitetomove, abstract) {
	let mypiecesposition = [] 
	let mypiecestype = []
	let mypieces;
	let myking;
	let ismate = true
	let mykingpos
	let legalStart = []
	let legalTo = []
	switch (whitetomove) {
		case true:
			mypieces = "wpiece"
			myking = "wking"
			break;
		case false:
			mypieces = "bpiece"
			myking = "bking";
			break;
	}
	let position_map = mapPosition(position)
	for (let i = 0; i < 64; i++) {
		let ty = position_map[i] 
		if (ty == mypieces) {
			mypiecesposition.push(i)
			mypiecestype.push(position[i])
		}
		else if (ty == myking) {
			mypiecesposition.push(i)
			mypiecestype.push(position[i])
			mykingpos = i
		}
	}
	for (let i = 0; i < mypiecesposition.length; i++) {
		let pty = mypiecestype[i]
		let pco = mypiecesposition[i]
		var seemoves = []
		picked = mypiecestype[i]
		let all = []
		switch (pty) {
			case "f": 
				break;
			case "Q":
				seemoves = wQueen(pco, position);
				all = seemoves.moves.concat(seemoves.takes)
				for (let i = 0; i < all.length; i++) {
					legalStart.push(pco)
					legalTo.push(all[i])
				}
				break;
			case "R":
				seemoves = wRook(pco, position);
				all = seemoves.moves.concat(seemoves.takes)
				for (let i = 0; i < all.length; i++) {
					legalStart.push(pco)
					legalTo.push(all[i])
				}
				break;
			case "B":
				seemoves = wBishop(pco, position);
				all = seemoves.moves.concat(seemoves.takes)
				for (let i = 0; i < all.length; i++) {
					legalStart.push(pco)
					legalTo.push(all[i])
				}
				break;
			case "N":
				seemoves = wKnight(pco, position);
				all = seemoves.moves.concat(seemoves.takes)
				for (let i = 0; i < all.length; i++) {
					legalStart.push(pco)
					legalTo.push(all[i])
				}
				break;
			case "P":
				seemoves = wPawn(pco, position);
				all = seemoves.moves.concat(seemoves.takes)
				for (let i = 0; i < all.length; i++) {
					legalStart.push(pco)
					legalTo.push(all[i])
				}
				break;
			case "q":
				seemoves = bQueen(pco, position);
				all = seemoves.moves.concat(seemoves.takes)
				for (let i = 0; i < all.length; i++) {
					legalStart.push(pco)
					legalTo.push(all[i])
				}
				break;
			case "r":
				seemoves = bRook(pco, position);
				all = seemoves.moves.concat(seemoves.takes)
				for (let i = 0; i < all.length; i++) {
					legalStart.push(pco)
					legalTo.push(all[i])
				}
				break;
			case "b":
				seemoves = bBishop(pco, position);
				all = seemoves.moves.concat(seemoves.takes)
				for (let i = 0; i < all.length; i++) {
					legalStart.push(pco)
					legalTo.push(all[i])
				}
				break;
			case "n":
				seemoves = bKnight(pco, position);
				all = seemoves.moves.concat(seemoves.takes)
				for (let i = 0; i < all.length; i++) {
					legalStart.push(pco)
					legalTo.push(all[i])
				}
				break;
			case "p":
				seemoves = bPawn(pco, position);
				all = seemoves.moves.concat(seemoves.takes)
				for (let i = 0; i < all.length; i++) {
					legalStart.push(pco)
					legalTo.push(all[i])
				}
				break;
			case "K":
				seemoves = wKing(pco, position);
				all = seemoves.moves.concat(seemoves.takes)
				for (let i = 0; i < all.length; i++) {
					legalStart.push(pco)
					legalTo.push(all[i])
				}
				break;
			case "k":
				seemoves = bKing(pco, position);
				all = seemoves.moves.concat(seemoves.takes)
				for (let i = 0; i < all.length; i++) {
					legalStart.push(pco)
					legalTo.push(all[i])
				}
				break;
		}
	}

	if (legalTo.length > 0) {
		ismate = false
	}
	if (abstract == true) {
		ismate = false
		return {legalStart, legalTo};
	}
	else{
	return ismate}
}

//empate por repetição
function checkRepetition () {
	let count = gamehistory.length-1
	if (count < 8) {
		return false
	}
	let myBoard = gamehistory[count].layout;
	let myBoardScore = updateScore(myBoard)
	let literal = board_log(myBoard)
	let repetitions = 0
	for (let i = count-1; i >= 1; i--) {
		let prev_board = gamehistory[i].layout;
		if (updateScore(prev_board) != myBoardScore) {
			return false
		}
		else if (literal == board_log(prev_board)) {
			repetitions ++
			if (repetitions > 1) {
				return true
			}
		}
	}
}

//promover peão
function promoteWpawn () {
	if (cpuTurn == true && vsCPU == true) {
		return "Q"
	}
	var pr = window.prompt("Promover \nq = Dama,\nr = Torre,\nb = Bispo,\nn = Cavalo", "Q")
	if (pieces_utf[pr] == undefined) {
		return "Q"
	}
	else if ((pr.toLowerCase() != "k") && (pr.toLowerCase() != "p") && (pr.toLowerCase() != "f")) {
	return pr.toUpperCase()
	}
	else {
		return "Q"
	}
}
function promoteBpawn () {
	if (cpuTurn == false && vsCPU == true) {
		return "q"
	}
	var pr = window.prompt("Promover \nq = Dama,\nr = Torre,\nb = Bispo,\nn = Cavalo", "Q")
	if (pieces_utf[pr] == undefined) {
		return "q"
	}
	else if ((pr.toLowerCase() != "k") && (pr.toLowerCase() != "p") && (pr.toLowerCase() != "f")) {
	return pr.toLowerCase()
	}
	else {
		return "q"
	}
}

//padrão fen
function toFen (position, player) {
	let fen = ""
	for (let i = 0; i < 8; i++) {
		let emp = 0
		let lin = i*8
		for (let r = 0; r < 8; r++) {
			if (position[lin+r] != "f") {
				if (emp > 0) { 
					fen += emp.toString()
					emp = 0
				}
			fen += position[r+lin]
			}
			else if (r < 7) {
				emp++
			}
			else {
				emp++
				fen += emp.toString()
				emp = 0
			}
		}
	fen += "/"
}	
	fen = fen.substring(0, fen.length - 1);
	switch (player) {
		case true: 
		 fen += " w"
		break;
		 case false: 
		 fen += " b"
		break;
	}
	fen += " "

	if (castling[0] == true) {
		fen += "K"
		} 
	if (castling[1] == true) {
		fen += "Q"
		} 
	if ((castling[1] == false) && (castling[0] == false)) 
	{fen += "- "}
	if (castling[2] == true) {
		fen += "k"
		} 
	if (castling[3] == true) {
		fen += "q"
		} 
	if ((castling[2] == false) && (castling[3] == false)) 
	{fen += "- "}
	console.log((Math.ceil((turncounter-1)/2)) + "." + fen)
	return fen
}
function board_log (position) {
		let fenst = ""
		for (let i = 0; i < 8; i++) {
			let emp = 0
			let lin = i*8
			for (let r = 0; r < 8; r++) {
				if (position[lin+r] != "f") {
					if (emp > 0) { 
						fenst += emp.toString()
						emp = 0
					}
				fenst += position[r+lin]
				}
				else if (r < 7) {
					emp++
				}
				else {
					emp++
					fenst += emp.toString()
					emp = 0
				}
			}
	}	
	return fenst
}

//fen para padrão xadrezjs
function toXJS (fenstr) {
	let fen = fenstr
	let layout = []
	let wturn;
	let toplay;
	let acpl;
	let crights = [false, false, false, false]
	let hist = []
	let wtak = []
	let btak = []
	for (let i = 0; i < turncounter-1; i++) {
		hist.push(notation[i])
	}
	for (let i = 0; i < wCaptured.length; i++) {
		wtak.push(wCaptured[i])
	}
	for (let i = 0; i < bCaptured.length; i++) {
		btak.push(bCaptured[i])
	}

	for (let i = 0; i<fen.length; i++) {
		let fdata = fen.charAt(i) 
			if (fdata == "/") {
				continue;
			}
			if (fdata == " ") {
				acpl = i+1
				toplay = fen.charAt(i+1)
				break;
			}
			switch (fdata) {
				case "1":
				case "2":
				case "3":
				case "4":	
				case "5":
				case "6":
				case "7":
				case "8":
					for (let f = 0; f < fdata; f++) {		
						layout.push("f") 
					}
				break;
				default:
					layout.push(fdata)
				break
			}
		
	}
	if (toplay == "w") {
		wturn = true
	}
	if (toplay == "b") {
		wturn = false
	}
	let casw = [fen.charAt(acpl+2), fen.charAt(acpl+3), fen.charAt(acpl+4), fen.charAt(acpl+5)]
	for (let i = 0; i<4; i++) {
	let nx = casw[i]
	if (nx == "K") {
		crights[0] = true
	}
	if (nx == "Q") {
		crights[1] = true
	}
	
	if (nx == "k") {
		crights[2] = true
	}
	if (nx == "q") {
		crights[3] = true
	}
	}
	let current_position_object = new objpos(layout, turncounter, crights, hist, wtak, btak)
	gamehistory[turncounter] = current_position_object;
}
// constroi detalhes do estado do jogo
class objpos {
	constructor(b, c, cas, not, wca, bca) {
			this.layout = b,					//layout do tabuleiro
			this.totalmoves = c,				//contagem de movimentos
			this.castleRight = cas,				//permissão de roque
			this.notat = not,					//histórico de jogadas
			this.wCap = wca,					//capturas de pecas pretas
			this.bCap = bca;					//capturas de pecas brancas
	}
}

// posição após o movimento
function toIBoard (previous, origin, move) {
	let iboard = []
	for (let j = 0; j < 64; j++) {
		if (j == origin) {
			iboard[j] = "f"
		}
		else if (j == move) {
			if ((previous[origin] == "p") && move > 55) {
				iboard[j] = "q"
			}
			else if ((previous[origin] == "P") && move < 8) {
				iboard[j] = "Q"
			}
			else {
			iboard[j] = previous[origin]
		}
		}
		else {
			iboard[j] = previous[j]
		}
	}
	return iboard
}

// solicita movimento do Bot (por enquanto, avalia o valor da próxima posição (profundidade 1))
let depthCounter = 0
function requestBotMove (position, player, depth) {
	depthCounter = 0
	let movestring = ""
	const all = allLegalMoves (position, player, true)
	let cpumoves = []
	let bestMove = 0
	let goodMove = 0
	const mo = all.legalStart
	const md = all.legalTo
	const ml = mo.length
	let allFrom = []
	let allto = []
	for (let i = 0; i < ml; i++) {
		allFrom.push(mo[i])
		allto.push(md[i])
	}
//	console.log(ml)
	for (let i = 0; i<allto.length; i++) {

			let evaluation;
			let pfrom = allFrom[i]
			let pto = allto[i]
			let iboard = toIBoard(position, pfrom, pto)
			evaluation = evaluateBoard(iboard)
			depthCounter = 0
			cpumoves[i] = minimax (iboard, player, evaluation, depth)

		}

//	console.log(cpumoves)
	for (let i = 0; i<cpumoves.length; i++) {
		if (cpuTurn == true) {
			if (cpumoves[i] > cpumoves[bestMove]) {
				goodMove = bestMove
				bestMove = i
			}
		}
		else if (cpuTurn == false) {
			if (cpumoves[i] < cpumoves[bestMove]) {
				goodMove = bestMove
				bestMove = i
			}
		}
	} 
		movestring = MovetoString (position, allFrom[bestMove], allto[bestMove], false)
		console.log("botmove:", movestring)
		console.log("calculated value:", (cpumoves[bestMove]) - (evaluateBoard(position)))
		return movestring;
	
}

function MovetoString (position, origin, target, full) {
	let movestring = "";
	if (full) {
	movestring += position[origin]
	}
	movestring += get2dCoord(origin)
	if (full) {
	if (position[target] != "f") {
		movestring += "+"
	}
	}
	movestring += get2dCoord(target)
	return movestring
}

//valor PST do tabuleiro
function evaluateBoard(board) {
	let boardValue = 0
/* 
 * Piece Square Tables, adaptado de Sunfish.py:
 * https://github.com/thomasahle/sunfish/blob/master/sunfish.py
 */
	let weights = { 
		'P': 100, 
		'N': 280, 
		'B': 320, 
		'R': 479, 
		'Q': 929, 
		'K': 60000,
		'p': -100, 
		'n': -280, 
		'b': -320, 
		'r': -479, 
		'q': -929, 
		'k': -60000
	};
	let pst = {
		'P':
			[100, 100, 100, 100, 105, 100, 100,  100,
			 78,  83,  86,  73, 102,  82,  85,  90,
			 7,  29,  21,  44,  40,  31,  44,   7,
			-17,  16,  -2,  15,  14,   0,  15, -13,
			-26,   3,  10,   9,   6,   1,   0, -23,
			-22,   9,   5, -11, -10,  -2,   3, -19,
			-31,   8,  -7, -37, -36, -14,   3, -31,
			0,   0,   0,   0,   0,   0,   0,   0
			],
		'N':  [
				-66, -53, -75, -75, -10, -55, -58, -70,
				 -3,  -6, 100, -36,   4,  62,  -4, -14,
				 10,  67,   1,  74,  73,  27,  62,  -2,
				 24,  24,  45,  37,  33,  41,  25,  17,
				 -1,   5,  31,  21,  22,  35,   2,   0,
				-18,  10,  13,  22,  18,  15,  11, -14,
				-23, -15,   2,   0,   2,   0, -23, -20,
				-74, -23, -26, -24, -19, -35, -22, -69
			],
		'B':  [
				-59, -78, -82, -76, -23,-107, -37, -50,
				-11,  20,  35, -42, -39,  31,   2, -22,
				 -9,  39, -32,  41,  52, -10,  28, -14,
				 25,  17,  20,  34,  26,  25,  15,  10,
				 13,  10,  17,  23,  17,  16,   0,   7,
				 14,  25,  24,  15,   8,  25,  20,  15,
				 19,  20,  11,   6,   7,   6,  20,  16,
				 -7,   2, -15, -12, -14, -15, -10, -10
			],
		'R':   [
				 35,  29,  33,   4,  37,  33,  56,  50,
				 55,  29,  56,  67,  55,  62,  34,  60,
				 19,  35,  28,  33,  45,  27,  25,  15,
				  0,   5,  16,  13,  18,  -4,  -9,  -6,
				-28, -35, -16, -21, -13, -29, -46, -30,
				-42, -28, -42, -25, -25, -35, -26, -46,
				-53, -38, -31, -26, -29, -43, -44, -53,
				-30, -24, -18,   5,  -2, -18, -31, -32
			],
		'Q':    [
				  6,   1,  -8,-104,  69,  24,  88,  26,
				 14,  32,  60, -10,  20,  76,  57,  24,
				 -2,  43,  32,  60,  72,  63,  43,   2,
				  1, -16,  22,  17,  25,  20, -13,  -6,
				-14, -15,  -2,  -5,  -1, -10, -20, -22,
				-30,  -6, -13, -11, -16, -11, -16, -27,
				-36, -18,   0, -19, -15, -15, -21, -38,
				-39, -30, -31, -13, -31, -36, -34, -42
			],
		'K':   [
				  4,  54,  47, -99, -99,  60,  83, -62,
				-32,  10,  55,  56,  56,  55,  10,   3,
				-62,  12, -57,  44, -67,  28,  37, -31,
				-55,  50,  11,  -4, -19,  13,   0, -49,
				-55, -43, -52, -28, -51, -47,  -8, -50,
				-47, -42, -43, -79, -64, -32, -29, -32,
				 -4,   3, -14, -50, -57, -18,  13,   4,
				 17,  30,  -3, -14,   6,  -1,  40,  18
			],
	
		// Endgame King Table
		'K_e': [
			-50, -40, -30, -20, -20, -30, -40, -50,
			-30, -20, -10,   0,   0, -10, -20, -30,
			-30, -10,  20,  30,  30,  20, -10, -30,
			-30, -10,  30,  40,  40,  30, -10, -30,
			-30, -10,  30,  40,  40,  30, -10, -30,
			-30, -10,  20,  30,  30,  20, -10, -30,
			-30, -30,   0,   0,   0,   0, -30, -30,
			-50, -30, -30, -30, -30, -30, -30, -50
			],
		"p":	[
			0,0,0,0,0,0,0,0,
			31,-8,7,37,36,14,-3,31,
			22,-9,-5,11,10,2,-3,19,
			26,-3,-10,-9,-6,-1,0,23,
			17,-16,2,-15,-14,0,-15,13,
			-7,-29,-21,-44,-40,-31,-44,-7,
			-78,-83,-86,-73,-102,-82,-85,-90,
			-100,-100,-100,-100,-105,-100,-100,-100
			],
		"n":[
			74,23,26,24,19,35,22,69,
			23,15,-2,0,-2,0,23,20,
			18,-10,-13,-22,-18,-15,-11,14,
			1,-5,-31,-21,-22,-35,-2,0,
			-24,-24,-45,-37,-33,-41,-25,-17,
			-10,-67,-1,-74,-73,-27,-62,2,
			3,6,-100,36,-4,-62,4,14,
			66,53,75,75,10,55,58,70
			],
		"b":[
			7,-2,15,12,14,15,10,10,
			-19,-20,-11,-6,-7,-6,-20,-16,
			-14,-25,-24,-15,-8,-25,-20,-15,
			-13,-10,-17,-23,-17,-16,0,-7,
			-25,-17,-20,-34,-26,-25,-15,-10,
			9,-39,32,-41,-52,10,-28,14,
			11,-20,-35,42,39,-31,-2,22,
			59,78,82,76,23,107,37,50
			],
		"r":[
			30,24,18,-5,2,18,31,32,
			53,38,31,26,29,43,44,53,
			42,28,42,25,25,35,26,46,
			28,35,16,21,13,29,46,30,
			0,-5,-16,-13,-18,4,9,6,
			-19,-35,-28,-33,-45,-27,-25,-15,
			-55,-29,-56,-67,-55,-62,-34,-60,
			-35,-29,-33,-4,-37,-33,-56,-50
			],
		"q":[
			39,30,31,13,31,36,34,42,
			36,18,0,19,15,15,21,38,
			30,6,13,11,16,11,16,27,
			14,15,2,5,1,10,20,22,
			-1,16,-22,-17,-25,-20,13,6,
			2,-43,-32,-60,-72,-63,-43,-2,
			-14,-32,-60,10,-20,-76,-57,-24,
			-6,-1,8,104,-69,-24,-88,-26],
		"k":[
			-17,-30,3,14,-6,1,-40,-18,
			4,-3,14,50,57,18,-13,-4,
			47,42,43,79,64,32,29,32,
			55,43,52,28,51,47,8,50,
			55,-50,-11,4,19,-13,0,49,
			62,-12,57,-44,67,-28,-37,31,
			32,-10,-55,-56,-56,-55,-10,-3,
			-4,-54,-47,99,99,-60,-83,62],
		"k_e":[
			50,30,30,30,30,30,30,50,
			30,30,0,0,0,0,30,30,
			30,10,-20,-30,-30,-20,10,30,
			30,10,-30,-40,-40,-30,10,30,
			30,10,-30,-40,-40,-30,10,30,
			30,10,-20,-30,-30,-20,10,30,
			30,20,10,0,0,10,20,30,
			50,40,30,20,20,30,40,50]
			}
	for (let i = 0; i<64; i++) {
		if (board[i] != 'f') {
			let pw = board[i]
			let pt = pst[pw]
//			console.log(pt[i])
			boardValue += weights[pw] 
			boardValue += pt[i]
		}
	}
//	console.log(boardValue)
	return boardValue
}
//avalia valor do movimento
function minimax (position, player, eval, depth) {
		const all = allLegalMoves (position, !player, true)
		let options = []
		let adjusted;
		let best = 0
		const oo = all.legalStart
		const od = all.legalTo
		const ol = oo.length
		let oFrom = []
		let oto = []
		let ismate = false
		if (ol == 0) {
			ismate = checkChecks(position, !player)
			if ((depthCounter <= 1) && (ismate == true)) {
				console.log("m1")
				if (player == false) {
					return -70000;
				}
				if (player == true) {
					return 70000;
				}
			}
		}
		for (let i = 0; i < ol; i++) {
			oFrom.push(oo[i])
			oto.push(od[i])
		}
	
		for (let i = 0; i<oto.length; i++) {
	
				let evaluation;
				let pfrom = oFrom[i]
				let pto = oto[i]
				let iboard = toIBoard(position, pfrom, pto)
				evaluation = evaluateBoard(iboard)
				options[i] = (eval + evaluation) / 2
	
			}
		for (let i = 0; i<options.length; i++) {
			if (!player == true) {
			if (options[i] > options[best]) {
				best = i
			}
		}
		else if (!player == false) {
			if (options[i] < options[best]) {
				best = i
			}
		}
	} 


	adjusted = options[best]
	depthCounter++
	if ((depthCounter/2) < depth) {
		let next = toIBoard(position, oFrom[best], oto[best])
		return minimax (next, !player, adjusted, depth)
	}
	else {
	return adjusted
	}
}



//Salvar jogo (precisa refatorar)

// constroi JSON com os dados do jogo atual
function savegame () {
	let mygametype = {
			vs: vsCPU,
			bot: cpuTurn,
			view: boardRotation
			}
	let saveslot = localStorage.getItem('save1')
	let slotgametype = localStorage.getItem('save1st')
//	console.log(saveslot)
	if (saveslot != null) {
		let chkoverwrite = window.confirm("Susbstituir jogo salvo?");
		if (chkoverwrite) {
			alert("Susbstituído");
		}
		else {
			alert("Escolha outro jogo");
			return;
		}
	}
	let allpositions = JSON.stringify(gamehistory)
	let gamesettings = JSON.stringify(mygametype)
	localStorage.setItem('save1', allpositions)
	localStorage.setItem('save1st', gamesettings)
	alert("Salvo");
}
function savegame2 () {
	let mygametype = {
		vs: vsCPU,
		bot: cpuTurn,
		view: boardRotation
		}
	let saveslot = localStorage.getItem('save2')
//	console.log(saveslot)
	if (saveslot != null) {
		let chkoverwrite = window.confirm("Susbstituir jogo salvo?");
		if (chkoverwrite) {
			alert("Susbstituído");
		}
		else {
			alert("Escolha outro jogo");
			return;
		}
	}
	let allpositions = JSON.stringify(gamehistory)
	let gamesettings = JSON.stringify(mygametype)
	let lastposition = JSON.stringify(gamehistory[gamehistory.length-1])
	localStorage.setItem('save2', allpositions)
	localStorage.setItem('save2st', gamesettings)
	alert("Salvo");
}
// interpreta JSON com os dados do jogo a resumir
function loadgame () {
	let savein = localStorage.getItem('save1')
	let slotgametype = localStorage.getItem('save1st')
	if (savein == undefined) {
		window.alert("Não há jogo salvo")
	}
	else {
		let chkload = window.confirm("Carregar jogo 1?");
			if (chkload) {
				alert("Carregado");
			}
			else {
			return;
		}
	let allpositions = JSON.parse(savein)
	let gamesettings = JSON.parse(slotgametype)
	let lastposition = allpositions[allpositions.length-1]
	current_position = lastposition.layout
	gamehistory = allpositions
	vsCPU = gamesettings.vs
	cpuTurn = gamesettings.bot
	setView(gamesettings.view)
	setGame(lastposition)
	}
}
function loadgame2 () {
	let savein = localStorage.getItem('save2')
	let slotgametype = localStorage.getItem('save2st')
	if (savein == undefined) {
		window.alert("Não há jogo salvo")
	}
	else {
		let chkload = window.confirm("Carregar jogo 2?");
			if (chkload) {
				alert("Carregado");
			}
			else {
			return;
		}
	let allpositions = JSON.parse(savein)
	let gamesettings = JSON.parse(slotgametype)
	let lastposition = allpositions[allpositions.length-1]
	current_position = lastposition.layout
	gamehistory = allpositions
	vsCPU = gamesettings.vs
	cpuTurn = gamesettings.bot
	setView(gamesettings.view)
	setGame(lastposition)
	}
}


// encolhe o tabuleiro para dispositivos verticais
function zoom() {
	let dw = document.body.clientWidth  
		if (dw < 544) {
			let zoomlevel = dw/522;
			document.body.style.MozTransform = 'scale(' + zoomlevel + ')';
			document.body.style.WebkitTransform = 'scale(' + zoomlevel + ')';
	}  
}