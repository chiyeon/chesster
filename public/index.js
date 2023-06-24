const chessboard = document.querySelector("#chessboard");
const turn_span = document.querySelector("#turn");
const restart = document.querySelector("#restart");
const promotion_close = document.querySelector("#promotion-close");
const promotion = document.querySelector("#promotion");
const promotion_options = document.querySelector("#promotion-options");

const WHITE = "WHITE";
const BLACK = "BLACK";

const moveTypes = {
  MOVE: "MOVE",
  CAPTURE: "CAPTURE",
  CASTLE: "CASTLE",
  EN_PASSANT: "EN_PASSANT",
  PROMOTION: "PROMOTION",
};

function calculateTeam(piece) {
  switch (piece) {
    case "♔":
    case "♕":
    case "♗":
    case "♘":
    case "♖":
    case "♙":
      return WHITE;
    case "♚":
    case "♛":
    case "♝":
    case "♞":
    case "♜":
    case "♟︎":
      return BLACK;
    default:
      throw new Error("Invalid piece: " + piece);
  }
}

function clearAllHighlights(boardOfElements) {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      for (let modifier of [
        ...Object.keys(moveTypes).map((moveType) => moveTypes[moveType]),
        "selected",
      ]) {
        boardOfElements[i][j].classList.remove(modifier);
      }
    }
  }
}

function clearLastMove(boardOfElements) {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      for (let modifier of ["moved_from", "moved_to"]) {
        boardOfElements[i][j].classList.remove(modifier);
      }
    }
  }
}

function reloadBoard(boardOfData, boardOfElements) {
  clearAllHighlights(boardOfElements);

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      let piece = boardOfData[j][i];
      boardOfElements[7 - i][j].innerHTML = "";
      if (piece) boardOfElements[7 - i][j].textContent = piece.string;
    }
  }
}

promotion_close.addEventListener("click", () => {
  promotion.classList.add("hidden");
  promotion_options.replaceChildren();
  chessboard.classList.remove("disabled");
});

async function showPromotionModal(moves) {
  return new Promise((resolve, reject) => {
    promotion.classList.remove("hidden");
    chessboard.classList.add("disabled");
    for (let move of moves) {
      let button = document.createElement("button");
      button.textContent = move.promotion;

      button.addEventListener("click", async () => {
        console.log("clicked", move.promotion);

        promotion.classList.add("hidden");
        promotion_options.replaceChildren();
        chessboard.classList.remove("disabled");

        resolve(move);
      });
      promotion_options.appendChild(button);
    }
  });
}

(async () => {
  var boardOfElements = [[], [], [], [], [], [], [], []];
  var selectedElement = null;
  var selectedElementMoves = [];
  var boardOfData = [];
  var turn = null;

  console.log(moveTypes);

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.classList.add((i + j) % 2 == 0 ? "variant1" : "variant2");
      chessboard.appendChild(cell);
      boardOfElements[i].push(cell);
      //   boardOfElements[i].push({
      //     element: cell,
      //     x: i,
      //     y: j,
      //     piece: null,
      //   });
    }
  }

  // initial data fetch
  const data = await fetch("/chessboard");
  const json = await data.json();

  boardOfData = json.board;
  turn = json.turn;

  turn_span.classList.remove(WHITE);
  turn_span.classList.remove(BLACK);
  turn_span.classList.add(turn);

  console.log(json);

  reloadBoard(boardOfData, boardOfElements);

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      // set onclick event
      (() => {
        const element = boardOfElements[7 - j][i];
        element.addEventListener("click", async () => {
          console.log("clicked", i, j);

          let foundMoves = selectedElementMoves.filter(
            (move) =>
              move.to[0] == i &&
              move.to[1] == j &&
              element.classList.contains(move.type)
          );

          let move = foundMoves[0];

          if (foundMoves.length > 1) {
            if (foundMoves[0].type !== moveTypes.PROMOTION)
              throw new Error("invalid move type with multiple moves");

            let selectedPromotion = await showPromotionModal(foundMoves);

            if (!selectedPromotion) return;

            console.log("selectedPromotion", selectedPromotion);

            move = selectedPromotion;
          }

          if (move) {
            console.log("move", move);

            // change turn color instantly
            turn_span.classList.remove(WHITE);
            turn_span.classList.remove(BLACK);
            turn_span.classList.add(turn == WHITE ? BLACK : WHITE);

            // send move request
            let data = await fetch("/move", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(move),
            });
            let json = await data.json(); // returns new chessboard and turn color

            board = json.board;
            turn = json.turn;

            turn_span.classList.remove(WHITE);
            turn_span.classList.remove(BLACK);
            turn_span.classList.add(turn);

            selectedElement = null;
            selectedElementMoves = [];
            reloadBoard(board, boardOfElements);
            clearLastMove(boardOfElements);

            if (json.moved) {
              // mark moved spots
              boardOfElements[7 - json.moved.from[1]][
                json.moved.from[0]
              ].classList.add("moved_from");
              boardOfElements[7 - json.moved.to[1]][
                json.moved.to[0]
              ].classList.add("moved_to");
            }

            return;
          }

          // clear all highlights
          clearAllHighlights(boardOfElements);

          if (
            selectedElement == element ||
            !element.textContent ||
            calculateTeam(element.textContent) != turn
          ) {
            selectedElement = null;
            selectedElementMoves = [];
            return;
          }

          element.classList.add("selected");

          let data = await fetch("/getMoves", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              x: i,
              y: j,
            }),
          });

          let moves = await data.json();

          console.log(moves);
          for (let move of moves) {
            boardOfElements[7 - move.to[1]][move.to[0]].classList.add(
              move.type
            );
          }

          // set selected variables
          selectedElementMoves = moves;
          selectedElement = element;
        });
      })();
    }
  }

  // set onclick event for new game button
  restart.addEventListener("click", async () => {
    let data = await fetch("/restart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    let json = await data.json(); // returns new chessboard and turn color

    board = json.board;
    turn = json.turn;

    turn_span.classList.remove(WHITE);
    turn_span.classList.remove(BLACK);
    turn_span.classList.add(turn);

    selectedElement = null;
    selectedElementMoves = [];
    reloadBoard(board, boardOfElements);
    clearLastMove(boardOfElements);
    return;
  });
})();

document.documentElement.style.setProperty(
  "--chessboard-size",
  (window.innerHeight > window.innerWidth
    ? window.innerWidth
    : window.innerHeight) *
    0.6 +
    "px"
);

document.documentElement.style.setProperty(
  "--border-size",
  (window.innerHeight > window.innerWidth
    ? window.innerWidth
    : window.innerHeight) *
    0.005 +
    "px"
);

window.addEventListener("resize", () => {
  document.documentElement.style.setProperty(
    "--chessboard-size",
    (window.innerHeight > window.innerWidth
      ? window.innerWidth
      : window.innerHeight) *
      0.6 +
      "px"
  );
  document.documentElement.style.setProperty(
    "--border-size",
    (window.innerHeight > window.innerWidth
      ? window.innerWidth
      : window.innerHeight) *
      0.005 +
      "px"
  );
});
