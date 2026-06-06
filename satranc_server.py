from stockfish import Stockfish
from flask import Flask, request, json, send_file
import random, os

stockfish = Stockfish(os.path.abspath("stockfish_10_x64.exe"))
api = Flask(__name__)

@api.route('/get_best_move', methods=['POST'])
def get_best_move():
    pos = request.form.get("pos").split()
    depth = request.form.get("depth")
    stockfish.make_moves_from_start(pos)
    stockfish.set_depth(int(depth))
    return stockfish.get_best_move()

@api.route("/get_top5_move", methods=["POST"])
def get_top5_move():
    pos = request.form.get("pos").split()
    depth = request.form.get("depth")
    stockfish.make_moves_from_start(pos)
    stockfish.set_depth(int(depth))
    return stockfish.get_top_moves(5)

@api.route("/", methods=["GET"])
def hello():
    return "LichessBot Server is listening, enjoy! -Sems"
if __name__ == '__main__':
    api.run(host="localhost", port=44, debug=True)
