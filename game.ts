import { ChessterBoard } from "./board";
import { ChessterMove } from "./move";
import { ChessterPlayer } from "./player";
import {
  BLACK,
  WHITE,
  history,
  moveData,
  moveTypes,
  piece,
  pieceBoard,
  team,
} from "./types";

export class ChessterGame {
  board: ChessterBoard;
  white: ChessterPlayer;
  black: ChessterPlayer;
  turn: team;
  history: history;
  whiteChecked: boolean; // whether white is in check
  blackChecked: boolean; // whether black is in check

  constructor() {
    this.board = new ChessterBoard(this);
    this.white = new ChessterPlayer(this, WHITE);
    this.black = new ChessterPlayer(this, BLACK);
    this.turn = WHITE;
    this.history = [];
    this.whiteChecked = false;
    this.blackChecked = false;
  }

  init(board?: pieceBoard) {
    this.turn = WHITE;
    this.history = [];
    this.board.init(board);
  }

  move(move: ChessterMove) {
    if (move.piece.getTeam() !== this.turn) {
      throw new Error("Wrong team");
    }

    if (move.type === moveTypes.CASTLE) {
      if (!move.castle) throw new Error("Castle move has no castle property");
      move.castle.piece.moved = true;
      move.castle.to.setPiece(move.castle.piece);
      move.castle.from.setPiece(undefined);
    } else if (
      move.type === moveTypes.CAPTURE ||
      move.type === moveTypes.EN_PASSANT_CAPTURE
    ) {
      if (!move.take) throw new Error("Capture move has no take property");
      move.take.taken = true;
      move.take.location.setPiece(undefined);
      // TODO: capture logic (i.e. scoring)
      if (move.take.team === WHITE) {
        this.white.removePiece(move.take);
        this.black.taken.push(move.take);
      } else {
        this.black.removePiece(move.take);
        this.white.taken.push(move.take);
      }
    }

    move.piece.moved = true;
    move.to.setPiece(move.piece);
    move.from.setPiece(undefined);

    this.history.push(move);

    this.whiteChecked = this.isChecked(WHITE);
    this.blackChecked = this.isChecked(BLACK);

    this.turn = this.turn === WHITE ? BLACK : WHITE;
  }

  validateAndMove(moveData: moveData): boolean {
    const { from, to, type } = moveData;

    const piece = this.board.get(from)?.piece;
    if (!piece) return false;

    const move = piece.getAvailableMoves().find((move) => {
      return move.to.x === to[0] && move.to.y === to[1] && move.type === type;
    });
    if (!move) return false;

    this.move(move);

    return true;
  }

  printBoard() {
    for (let i = this.board.board.length; i > 0; i--) {
      let row = "";
      for (let j = 0; j < this.board.board[i - 1].length; j++) {
        row += (this.board.board[j][i - 1].piece?.piece || " ") + " ";
      }
      console.log(row);
    }
  }

  /**
   * Checks if the given team is checked
   * @param team The team to check
   * @returns Whether the given team is checked
   */
  isChecked(team: team): boolean {
    for (let piece of (team === WHITE ? this.black : this.white).pieces) {
      let moves = piece.getAvailableMoves();
      for (let move of moves) {
        let take = move.take;
        if (take && (take.piece === "♚" || take.piece === "♔")) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Checks if the enemy team is checkmated
   * @param team The team to check
   * @returns Whether the enemy team is checkmated
   * @todo Implement this
   */
  checkCheckmatedEnemy(team: team): boolean {
    return false;
  }
}
