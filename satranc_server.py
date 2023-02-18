from stockfish import Stockfish
from flask import Flask, request, json, send_file
import random, os
#stockfish = Stockfish("C:\\Users\\safak\\Masaüstü\\stockfish_15_win_x64_avx2\\stockfish_15_win_x64_avx2\\stockfish_15_x64_avx2.exe",depth=20,parameters={"Threads": 5, "Minimum Thinking Time": 20, "Hash":2048, "Ponder":"true"})

stockfish = Stockfish(os.path.abspath("stockfish_10_x64.exe"))
api = Flask(__name__)

@api.route('/get_best_move', methods=['POST'])
def get_best_move():
    pos = request.form.get("pos").split()
    depth = request.form.get("depth")
    stockfish.set_position(pos)
    stockfish.set_depth(int(depth))
    return stockfish.get_best_move()

@api.route("/get_top5_move", methods=["POST"])
def get_top5_move():
    pos = request.form.get("pos").split()
    depth = request.form.get("depth")
    stockfish.set_position(pos)
    stockfish.set_depth(int(depth))
    return stockfish.get_top_moves(5)

@api.route("/", methods=["GET"])
def hello():
    return send_file("index.html")
if __name__ == '__main__':
    api.run(host="localhost", port=44, debug=True)
