// ==UserScript==
// @name THT Lichess Bot
// @match https://lichess.org/*
// @version          1.1
// @grant GM.xmlHttpRequest
// ==/UserScript==
// Sems tarafından itinayla kodlanmıştır

let data = "not_play"
let scripts = document.getElementsByTagName("script")
let raw_data = scripts[3].innerText.substring(53,scripts[3].innerText.trim().length-4)
data = JSON.parse(raw_data).data
if (data.hasOwnProperty("counters")){
	console.log("Welcome! Enter a game to control the bot\n\nGuide:\n  Alt+a -> AUTO mode\n  Alt+m -> MANUEL mode\n  Alt+s -> steps in manual mode\n  Alt+x -> analysis the game (i guess it will be used more in manual mode)\n\n\n-Carefully coded by Sems")
	return
}

const MAX_DELAY = 0 // buna 0 derseniz bütün hamleler anında yapılır
const STOCK_DEPTH = 10

let color = data.player.color
let ply = data.game.turns

localStorage.pos = ""
for (let i=1; i != data.steps.length; i++){
	//data dan dönen değerde rok varsa stockfish in istediği versiyona dönüştürüyoruz bunu yapmanın socket yapısındaki kadar kolay olmamasının sebebi data nın socket ten dönen data ile aynı rok bilgisine sahip olmaması
	//gene socket tekinden farklı olarak promotion değerinin modifiye edilmemesinin sebebi ise bilginin stockfish in istediği şekilde dönmesi, neden bu şekilde yapmışlar inanın bilmiyorum
	if (data.steps[i].san == "O-O")
		localStorage.pos += " "+data.steps[i].uci.replace("h","g")
	else if (data.steps[i].san == "O-O-O")
	localStorage.pos += " "+data.steps[i].uci.replace("a","c")
	else
		localStorage.pos += " "+data.steps[i].uci
}

if (!localStorage.hasOwnProperty("MODE"))
	localStorage.MODE = "AUTO"// AUTO, MANUEL | default MODE -> AUTO

	let urls = {
	"top5":"http://localhost:44/get_top5_move",
	"best_one":"http://localhost:44/get_best_move"
}

let player_name
if (data.player.hasOwnProperty("user"))
	player_name = data.player.user.username
else
	player_name = "Magic Guy"

let enemy_name
if (data.opponent.hasOwnProperty("user"))
	enemy_name = data.opponent.user.username
else
	enemy_name = "lvl "+data.opponent.ai+" ai"

function who_turn(ply){
	let turn
	if (ply%2 != 0){
		turn = "black"
	}
	else{
		turn = "white"
	}
    return turn
}

function go_move(best_move){
	setTimeout(()=>{
		lichess.socket.send("move",{b:1,u:best_move},{sign: lichess.socket._sign, ackable: true, withLag: false, millis: 4611.5})
	}, Math.floor(Math.random()*MAX_DELAY)*1000)
}

function get_move(arg){
	return new Promise((resolve, reject) => {
		GM.xmlHttpRequest({
			method: "POST",
			url: urls[arg],
			data:"pos="+localStorage.pos.trim()+"&depth="+STOCK_DEPTH,
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			onload: function(response) {
				resolve(response.responseText);
				},
			onerror: function(error) {
				reject(error);
			}
		});
	});
}


lichess.socket.ws.addEventListener("open", (e)=>{
	//AUTO modda sayfa yüklendiğinde sıra bizdeyse otomatik hamle yapıyoruz burası sayesinde
	if (color == who_turn(ply) && localStorage.MODE == "AUTO"){
		get_move("best_one").then(go_move).catch((error)=>{
			console.log("cant get move from server error->", error)
		})
	}
})
lichess.socket.ws.addEventListener("message", (e) => {
	let dat = JSON.parse(e.data)
	let uci = ""
	if (dat.hasOwnProperty("d") && dat.d.hasOwnProperty("ply"))
		ply = dat.d.ply

	if (dat.t == "crowd"){
		//socket başlatıldığında dönüyor ve maç esnasında oyuncular ın çıkıp çıkmadığını gösteriyor ve sanırım izleyici varsa onu gösteriyor {"t":"crowd","d":{"white":true,"black":false,"watchers":{"nb":0}}}
		if (ply == 0){
			//oyunun başladığı ifade eder
		}

	}
	else if (dat.t == "move"){

		if (dat.d.hasOwnProperty("castle")){
			uci = dat.d.castle.king.join("")
		}
		else if (dat.d.hasOwnProperty("promotion")){
			uci = dat.d.uci+dat.d.promotion.pieceClass.charAt(0)
		}
		else
			uci = dat.d.uci

		localStorage.pos += " "+uci //oyunun başından itibaren oynana bütün hamleleri localstorage de tutuyoruz, her oyun başladığında sıfırlamamız gerekiyor şimdilik böyle bir çözüm buldum hamleleri kaydetmek için

		if (color == who_turn(ply)){
			console.log(enemy_name+" -> "+uci)
			if (localStorage.MODE == "AUTO"){
				get_move("best_one").then(go_move).catch((error)=>{
					console.log("cant get move from server error->", error)
				})
			}
		} else{
			console.log(player_name+" -> "+uci)
		}
	}
	else if (dat.d == "endData"){
		//Oyun bittiğinde kimin kazandığını gösteriyor {"t":"endData","v":7,"d":{"winner":"black","error":{"id":31,"name":"resign"}}}
	}


})
let keysPressed = {};
document.addEventListener('keydown', (event) => {
   keysPressed[event.key] = true;

   if (keysPressed['Alt']) {
		if (keysPressed["m"]){
			localStorage.MODE = "MANUEL"
			console.log("Switched to MANUEL mode")
		}
		else if (keysPressed["s"]){
			if (color == who_turn(ply) && localStorage.MODE == "MANUEL"){
				get_move("best_one").then(go_move).catch((error)=>{
					console.log("cant get move from server error->", error)
				})
			} else
				console.log("Not your turn my friend")
		}
		else if (keysPressed["a"]){
			localStorage.MODE = "AUTO"
			console.log("Switched to AUTO mode")
			if (color == who_turn(ply) && localStorage.MODE == "AUTO"){
				get_move("best_one").then(go_move).catch((error)=>{
					console.log("cant get move from server error->", error)
				})
			}
		}
		else if (keysPressed["x"]){
			get_move("top5").then(console.log).catch((error)=>{
				console.log("cant get move from server error->", error)
			})
		}
		else if (keysPressed["t"])
			console.log("Bot shortcut is working.")
   }
});

document.addEventListener('keyup', (event) => {
   delete keysPressed[event.key];
});
