import express from "express";
import { ChessterGame } from "./game";
import {
  BLACK,
  ChessterBoardString,
  ChessterMove,
  WHITE,
  moveTypes,
} from "./types";
import { boardStringToBoard } from "./util";
import { ChessterAI } from "./ai";
import { Server, Socket } from "socket.io";
import { createServer } from "http";

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.use(express.json());

io.on("connection", (socket: Socket) => {
  const game = new ChessterGame();
  socket.emit("initState", game.getState());

  socket.on("move", (data: ChessterMove) => {
    game.validateAndMove(data);

    if (
      (game.turn === WHITE && game.white.checkmated) ||
      (game.turn === BLACK && game.black.checkmated)
    ) {
      console.log("checkmate (game over)");
      socket.emit("gameOver");
    } else {
      const ai = new ChessterAI(game); // maybe move this to the top?
      const aiMove = ai.getNextMove();

      if (aiMove) {
        game.validateAndMove(aiMove);
      } else {
        throw new Error("ai returned undefined move");
      }

      console.log("turn: " + game.turn);
      console.log("white in check: " + game.white.checked);
      console.log("black in check: " + game.black.checked);
      console.log("white in checkmate: " + game.white.checkmated);
      console.log("black in checkmate: " + game.black.checkmated);

      socket.emit("aiMove", aiMove);
    }
  });

  // socket.on("getMoves", (data: { x: number; y: number }) => {
  //   let piece = game.board[data.x][data.y];

  //   if (!piece) {
  //     socket.emit("updateMoves", []);
  //     return;
  //   }

  //   socket.emit("updateMoves", game.getAvailableMoves(piece));
  // });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

// app.post("/restart", (request, response) => {
//   game.init();
//   response.send({ board: game.board, turn: game.turn });
// });

server.listen(3000, () => {
  console.log("chesster server listening at http://localhost:3000");
});
