# LichessBot
funny bot for lichess.com

This bot is made with the aim of entertainment and enjoyment.

First launch flask server -> satranc_server.py<br>
Second, download tampermonkey plugin (in my experience it works fine for chrome)<br>
Third, copy the code from satranc_bot.js and open a new script in tampermonkey and paste it in<br>
Alternative way for the third step, open tampermonkey and enter the "Utilities" section, enter the "Import from file" section and import the txt file in the repo.

Options:<br>
There are settings you can play in the javascript file; these are; MAX_DELAY and STOCK_DEPTH. MAX_DELAY intentionally extends the playing time of the move, for example, if you do this to 10, moves will be made with random deliberate waits between 10 and 0 seconds. STOCK_DEPTH increases the depth level of the stockfish that the server controls, simply put, it determines how many moves ahead stockfish will see.

EXTRA:<br>
You can modify the server to use stockfish more efficiently and powerfully by reading this link https://pypi.org/project/stockfish/
