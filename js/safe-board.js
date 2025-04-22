/**
 * Safe Board Generator – v3
 * --------------------------------------------------------
 *  – Mines placées APRES le premier clic (safeZone)
 *  – safeZone toujours vide
 *  – Générateur hybride : placement aléatoire puis
 *    « hill‑climb repairing » ⇒ fonctionne même sur très grandes grilles
 */

import * as State from './state.js';

/* ------------------------------------------------------------------ */
/* -----------------------  Helpers basiques  ----------------------- */
/* ------------------------------------------------------------------ */

const K = (x, y) => `${x},${y}`;

const valid = (x, y) =>
  x >= 0 && x < State.columns && y >= 0 && y < State.rows;

function neigh(x, y) {
  const out = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (valid(nx, ny)) out.push({ x: nx, y: ny });
    }
  }
  return out;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function flood(board, x, y, revealed = new Set()) {
  if (!valid(x, y)) return revealed;
  const key = K(x, y);
  if (revealed.has(key)) return revealed;

  revealed.add(key);
  const c = board[y][x];
  if (c.isMine || c.adjacentMines) return revealed;

  for (const n of neigh(x, y)) flood(board, n.x, n.y, revealed);
  return revealed;
}

function countAround(board, x, y) {
  return neigh(x, y).reduce(
    (s, n) => s + (board[n.y][n.x].isMine ? 1 : 0),
    0
  );
}

function updateAround(board, x, y) {
  const cells = neigh(x, y).concat({ x, y });
  for (const { x: cx, y: cy } of cells) {
    if (board[cy][cx].isMine) {
      board[cy][cx].adjacentMines = undefined;
    } else {
      board[cy][cx].adjacentMines = countAround(board, cx, cy);
    }
  }
}

function refreshAll(board) {
  for (let y = 0; y < State.rows; y++) {
    for (let x = 0; x < State.columns; x++) {
      board[y][x].adjacentMines = board[y][x].isMine
        ? undefined
        : countAround(board, x, y);
    }
  }
}

/* ------------------------------------------------------------------ */
/* -------------------------  Solver  ------------------------------- */
/* ------------------------------------------------------------------ */

/**
 * Résolution déterministe ; renvoie nombre de cases non résolues
 * et set des cases révélées (pour la réparation).
 */
function solve(board, safeZone, earlyCut = false) {
  const b =
    typeof structuredClone === 'function'
      ? structuredClone(board)
      : JSON.parse(JSON.stringify(board));

  const first = safeZone[(safeZone.length / 2) | 0];
  const revealed = new Set();
  flood(b, first.x, first.y, revealed);

  const frontier = new Set(
    [...revealed].filter(k => {
      const [x, y] = k.split(',').map(Number);
      return b[y][x].adjacentMines;
    })
  );
  const flagged = new Set();
  const maxIt = State.rows * State.columns * 4;
  let it = 0;

  while (frontier.size && it++ < maxIt) {
    const k = frontier.values().next().value;
    frontier.delete(k);
    const [cx, cy] = k.split(',').map(Number);
    const cell = b[cy][cx];
    if (!cell.adjacentMines) continue;

    const nbs = neigh(cx, cy);
    const unknown = [];
    let nbFlag = 0;

    for (const n of nbs) {
      const nk = K(n.x, n.y);
      if (flagged.has(nk)) nbFlag++;
      else if (!revealed.has(nk)) unknown.push(n);
    }

    const missing = cell.adjacentMines - nbFlag;
    let changed = false;

    if (missing === unknown.length && missing) {
      for (const n of unknown) {
        const nk = K(n.x, n.y);
        if (flagged.has(nk)) continue;
        if (!b[n.y][n.x].isMine) {
          if (earlyCut) return { unsolved: Infinity, revealed };
          return { unsolved: Infinity, revealed };
        }
        flagged.add(nk);
        changed = true;
        for (const nn of neigh(n.x, n.y)) {
          const nnk = K(nn.x, nn.y);
          if (revealed.has(nnk) && b[nn.y][nn.x].adjacentMines) frontier.add(nnk);
        }
      }
    } else if (missing === 0 && unknown.length) {
      for (const n of unknown) {
        const nk = K(n.x, n.y);
        if (revealed.has(nk)) continue;
        if (b[n.y][n.x].isMine) {
          if (earlyCut) return { unsolved: Infinity, revealed };
          return { unsolved: Infinity, revealed };
        }
        flood(b, n.x, n.y, revealed);
        changed = true;
      }
    }

    if (changed) {
      for (const n of neigh(cx, cy)) {
        const nk = K(n.x, n.y);
        if (revealed.has(nk) && b[n.y][n.x].adjacentMines) frontier.add(nk);
      }
    }
  }

  let unsolved = 0;
  for (let y = 0; y < State.rows; y++) {
    for (let x = 0; x < State.columns; x++) {
      if (!b[y][x].isMine && !revealed.has(K(x, y))) unsolved++;
    }
  }
  return { unsolved, revealed };
}

/* ------------------------------------------------------------------ */
/* -------------------  Placement initial aléatoire  ---------------- */
/* ------------------------------------------------------------------ */

function randomPlacement(board, safeSet) {
  const pool = [];
  // 1) reset & collect candidates
  for (let y = 0; y < State.rows; y++) {
    for (let x = 0; x < State.columns; x++) {
      board[y][x].isMine = false;
      board[y][x].adjacentMines = 0;
      if (!safeSet.has(K(x, y))) pool.push({ x, y });
    }
  }
  // 2) shuffle once
  shuffle(pool);
  // 3) place each mine and bump neighbor counts
  for (let i = 0; i < State.mineCount; i++) {
    const { x, y } = pool[i];
    board[y][x].isMine = true;
    for (const { x: nx, y: ny } of neigh(x, y)) {
      board[ny][nx].adjacentMines++;
    }
  }
  // 4) mark mines themselves
  for (let i = 0; i < State.mineCount; i++) {
    const { x, y } = pool[i];
    board[y][x].adjacentMines = undefined;
  }
}

/* ------------------------------------------------------------------ */
/* ---------------------  Hill‑Climb Repairing  ---------------------- */
/* ------------------------------------------------------------------ */

function repair(board, safeZone, safeSet) {
  const areaSize = State.columns * State.rows;
  const maxSwaps = areaSize * 10; // généreux pour les énormes grilles

  let { unsolved, revealed } = solve(board, safeZone);
  if (unsolved === 0) return true;

  for (let iter = 0; iter < maxSwaps && unsolved; iter++) {
    /* 1) Sélection d’une mine candidate (près de la zone révélée) */
    const mineCandidates = [];
    for (const k of revealed) {
      const [x, y] = k.split(',').map(Number);
      for (const n of neigh(x, y)) {
        const nk = K(n.x, n.y);
        if (!safeSet.has(nk) && board[n.y][n.x].isMine) mineCandidates.push(nk);
      }
    }

    if (!mineCandidates.length) break;

    const mineKey = mineCandidates[(Math.random() * mineCandidates.length) | 0];
    const [mx, my] = mineKey.split(',').map(Number);

    /* 2) Case vide loin de firstClick */
    const first = safeZone[(safeZone.length / 2) | 0];
    const empties = [];
    const far = d => Math.abs(d.x - first.x) + Math.abs(d.y - first.y) > 7;

    for (let y = 0; y < State.rows; y++) {
      for (let x = 0; x < State.columns; x++) {
        const k = K(x, y);
        if (!board[y][x].isMine && !safeSet.has(k) && far({ x, y })) {
          empties.push(k);
        }
      }
    }

    if (!empties.length) break;
    const emptyKey = empties[(Math.random() * empties.length) | 0];
    const [ex, ey] = emptyKey.split(',').map(Number);

    /* 3) Swap & MAJ locale */
    board[my][mx].isMine = false;
    board[ey][ex].isMine = true;
    updateAround(board, mx, my);
    updateAround(board, ex, ey);

    /* 4) Nouveau coût */
    const res = solve(board, safeZone, true); // early cut
    if (res.unsolved < unsolved) {
      // amélioration → garde
      unsolved = res.unsolved;
      revealed = res.revealed;
    } else {
      // pas mieux → revert
      board[my][mx].isMine = true;
      board[ey][ex].isMine = false;
      updateAround(board, mx, my);
      updateAround(board, ex, ey);
    }
  }

  return unsolved === 0;
}

/* ------------------------------------------------------------------ */
/* -------------------------  API public  --------------------------- */
/* ------------------------------------------------------------------ */

export function generateSolvableBoard(safeZone) {
  if (!safeZone?.length)
    throw new Error('Safe zone must contain at least one cell');

  const safeSet = new Set(safeZone.map(({ x, y }) => K(x, y)));
  const maxAttempts = 40;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    /* placement aléatoire */
    randomPlacement(State.gameBoard, safeSet);

    /* essai direct */
    if (solve(State.gameBoard, safeZone).unsolved === 0) {
      console.info(`Board solvable (attempt #${attempt})`);
      return true;
    }

    /* réparation */
    if (repair(State.gameBoard, safeZone, safeSet)) {
      console.info(`Board fixed via repair (attempt #${attempt})`);
      return true;
    }
  }

  console.warn(
    `Failed to build a solvable board after ${maxAttempts} attempts (fallback may be unsolvable)`
  );
  return false;
}
