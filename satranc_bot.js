// ==UserScript==
// @name         THT Lichess Bot
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Eğlence amaçlı satranç botudur
// @author       Sems
// @icon         https://lichess1.org/assets/logo/lichess-favicon-32.png
// @grant        GM.xmlHttpRequest
// @connect      localhost
// @run-at       document-start
// @match        https://lichess.org/*
// ==/UserScript==

// Sems tarafından itinayla kodlanmıştır

var data = ""
var gameWs = null
var initReady = false
var wsReady = false
var ply, color, player_name, enemy_name

const STOCK_DEPTH = 10
const MAX_DELAY = 0 // buna 0 derseniz bütün hamleler anında yapılır

const urls = {
    "top5": "http://localhost:44/get_top5_move",
    "best_one": "http://localhost:44/get_best_move"
}

const origSend = WebSocket.prototype.send
WebSocket.prototype.send = function(...args) {
    if (!gameWs) {
        gameWs = this
        onWsCaptured()
    }
    return origSend.apply(this, args)
}

window.site = window.site || {}
window.site.load = new Promise(resolve => {
    document.addEventListener("DOMContentLoaded", () => {
        const el = document.getElementById("page-init-data")
        if (el) data = JSON.parse(el.textContent).data
        resolve()
    })
})

window.site.load.then(() => {
    if (!data) return
    initReady = true
    if (wsReady) init()
})

function onWsCaptured() {
    wsReady = true
    if (initReady) init()
    gameWs.addEventListener("message", (e) => {
        if (!initReady) return
        handleMessage(e)
    })
}

function who_turn(ply) {
    let turn
    if (ply % 2 != 0)
        turn = "black"
    else
        turn = "white"
    return turn
}

function get_move(arg) {
    return new Promise((resolve, reject) => {
        GM.xmlHttpRequest({
            method: "POST",
            url: urls[arg],
            data: "pos=" + localStorage.pos.trim() + "&depth=" + STOCK_DEPTH,
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            onload: function(response) { resolve(response.responseText) },
            onerror: function(error) { reject(error) }
        })
    })
}

function go_move(best_move) {
    setTimeout(() => {
        origSend.call(gameWs, JSON.stringify({
            t: "move",
            d: { u: best_move, b: 1, a: 1 }
        }))
    }, Math.floor(Math.random() * MAX_DELAY) * 1000)
}

function handleMessage(e) {
    let dat = JSON.parse(e.data)
    let uci = ""

    if (dat.hasOwnProperty("d") && dat.d.hasOwnProperty("ply"))
        ply = dat.d.ply

    if (dat.t == "crowd") {
        // socket başlatıldığında dönüyor ve maç esnasında oyuncuların çıkıp çıkmadığını gösteriyor
        // ve sanırım izleyici varsa onu gösteriyor {"t":"crowd","d":{"white":true,"black":false,"watchers":{"nb":0}}}
        if (ply == 0) {
            // oyunun başladığı ifade eder
        }
    }
    else if (dat.t == "move") {
        if (dat.d.hasOwnProperty("castle")) {
            uci = dat.d.castle.king.join("")
        }
        else if (dat.d.hasOwnProperty("promotion")) {
            uci = dat.d.uci + dat.d.promotion.pieceClass.charAt(0)
        }
        else
            uci = dat.d.uci

        // oyunun başından itibaren oynanan bütün hamleleri localstorage de tutuyoruz,
        // her oyun başladığında sıfırlamamız gerekiyor, şimdilik böyle bir çözüm buldum hamleleri kaydetmek için
        localStorage.pos += " " + uci

        if (color == who_turn(ply)) {
            console.log(enemy_name + " -> " + uci)
            if (localStorage.MODE == "AUTO") {
                get_move("best_one").then(go_move).catch((error) => {
                    console.log("cant get move from server error->", error)
                })
            }
        } else {
            console.log(player_name + " -> " + uci)
        }
    }
    else if (dat.d == "endData") {
        // Oyun bittiğinde kimin kazandığını gösteriyor
        // {"t":"endData","v":7,"d":{"winner":"black","error":{"id":31,"name":"resign"}}}
    }
}

function init() {
    if (data.hasOwnProperty("counters")) {
        console.log("Welcome! Enter a game to control the bot\n\nGuide:\n  Alt+a -> AUTO mode\n  Alt+m -> MANUEL mode\n  Alt+s -> steps in manual mode\n  Alt+x -> analysis the game (i guess it will be used more in manual mode)\n\n\n-Carefully coded by Sems")
        return
    }

    color = data.player.color
    ply = data.game.turns

    if (data.player.hasOwnProperty("user"))
        player_name = data.player.user.username
    else
        player_name = "Magic Guy"

    if (data.opponent.hasOwnProperty("user"))
        enemy_name = data.opponent.user.username
    else if (data.opponent.hasOwnProperty("ai"))
        enemy_name = "lvl " + data.opponent.ai + " ai"
    else
        enemy_name = "Anon"

    localStorage.pos = ""
    for (let i = 1; i != data.steps.length; i++) {
        // data dan dönen değerde rok varsa stockfish in istediği versiyona dönüştürüyoruz
        // bunu yapmanın socket yapısındaki kadar kolay olmamasının sebebi data nın socket ten dönen
        // data ile aynı rok bilgisine sahip olmaması
        // gene socket tekinden farklı olarak promotion değerinin modifiye edilmemesinin sebebi ise
        // bilginin stockfish in istediği şekilde dönmesi, neden bu şekilde yapmışlar inanın bilmiyorum
        if (data.steps[i].san == "O-O")
            localStorage.pos += " " + data.steps[i].uci.replace("h", "g")
        else if (data.steps[i].san == "O-O-O")
            localStorage.pos += " " + data.steps[i].uci.replace("a", "c")
        else
            localStorage.pos += " " + data.steps[i].uci
    }

    if (!localStorage.hasOwnProperty("MODE"))
        localStorage.MODE = "AUTO" // AUTO, MANUEL | default MODE -> AUTO

    // AUTO modda sayfa yüklendiğinde sıra bizdeyse otomatik hamle yapıyoruz
    if (color == who_turn(ply) && localStorage.MODE == "AUTO") {
        get_move("best_one").then(go_move).catch((error) => {
            console.log("cant get move from server error->", error)
        })
    }

    let keysPressed = {}
    document.addEventListener('keydown', (event) => {
        keysPressed[event.key] = true

        if (keysPressed['Alt']) {
            if (keysPressed["m"]) {
                localStorage.MODE = "MANUEL"
                console.log("Switched to MANUEL mode")
            }
            else if (keysPressed["s"]) {
                if (color == who_turn(ply) && localStorage.MODE == "MANUEL") {
                    get_move("best_one").then(go_move).catch((error) => {
                        console.log("cant get move from server error->", error)
                    })
                } else
                    console.log("Not your turn my friend")
            }
            else if (keysPressed["a"]) {
                localStorage.MODE = "AUTO"
                console.log("Switched to AUTO mode")
                if (color == who_turn(ply) && localStorage.MODE == "AUTO") {
                    get_move("best_one").then(go_move).catch((error) => {
                        console.log("cant get move from server error->", error)
                    })
                }
            }
            else if (keysPressed["x"]) {
                get_move("top5").then(console.log).catch((error) => {
                    console.log("cant get move from server error->", error)
                })
            }
            else if (keysPressed["t"])
                console.log("Bot shortcut is working.")
        }
    })

    document.addEventListener('keyup', (event) => {
        delete keysPressed[event.key]
    })
}
