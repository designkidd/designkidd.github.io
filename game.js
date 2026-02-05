const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');

// Scale everything up
context.scale(30, 30);
nextContext.scale(30, 30); // Smaller scale for preview? No, keep logic same, adjust canvas size.
// Next canvas is 100x100. If we scale 25, 4 blocks fit. 
// Let's reset nextContext scale to manage it better later or use same scale.
// Actually 30px blocks means standard board is 10 blocks wide = 300px. Correct.
// Next board is 100px. 30px blocks might be too big for 4x4. 
// Let's re-scale next context specifically.
nextContext.setTransform(1, 0, 0, 1, 0, 0); // Reset
nextContext.scale(20, 20); // 20px blocks for preview

// Game State
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let score = 0;
let level = 1;
let linesClearedTotal = 0;
let isPaused = false;
let isGameOver = false;

// Colors matching the Neon Theme
const colors = [
    null,
    '#FF0D72', // T - Magenta
    '#0DC2FF', // I - Cyan
    '#0DFF72', // S - Green
    '#F538FF', // Z - Purple
    '#FF8E0D', // L - Orange
    '#FFE138', // O - Yellow
    '#3877FF', // J - Blue
];

const arena = createMatrix(10, 20);

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
    next: null,
};

// --- Core Functions ---

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    if (type === 'I') {
        return [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
        ];
    } else if (type === 'L') {
        return [
            [0, 2, 0],
            [0, 2, 0],
            [0, 2, 2],
        ];
    } else if (type === 'J') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [3, 3, 0],
        ];
    } else if (type === 'O') {
        return [
            [4, 4],
            [4, 4],
        ];
    } else if (type === 'Z') {
        return [
            [5, 5, 0],
            [0, 5, 5],
            [0, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'T') {
        return [
            [0, 7, 0],
            [7, 7, 7],
            [0, 0, 0],
        ];
    }
}

function drawMatrix(matrix, offset, ctx) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                // Glow effect simulation via shadow
                // Canvas doesn't handle CSS shadows well inside standard rects without performance hit
                // We will just draw clean colors
                ctx.fillStyle = colors[value];
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                
                // Add a slight inner light
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(x + offset.x + 0.1, y + offset.y + 0.1, 0.8, 0.8);
            }
        });
    });
}

function draw() {
    // Clear Main Board
    context.fillStyle = '#000'; // Pure black for contrast behind blocks
    // Actually let's use transparent to show grid if we had one, but standard black is safer
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Arena
    drawMatrix(arena, {x: 0, y: 0}, context);
    
    // Draw Ghost Piece (Optional, maybe later)
    
    // Draw Player
    drawMatrix(player.matrix, player.pos, context);

    // Draw Next Piece
    nextContext.fillStyle = '#050508';
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    if (player.next) {
        // Center the next piece
        const offset = {
            x: 2.5 - player.next[0].length / 2,
            y: 2.5 - player.next.length / 2
        };
        drawMatrix(player.next, offset, nextContext);
    }
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerHardDrop() {
    while (!collide(arena, player)) {
        player.pos.y++;
    }
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
    dropCounter = 0;
}

function playerMove(offset) {
    player.pos.x += offset;
    if (collide(arena, player)) {
        player.pos.x -= offset;
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function playerReset() {
    if (player.next === null) {
        player.next = createPiece('ILJOTSZ'[Math.random() * 7 | 0]);
    }
    
    player.matrix = player.next;
    player.next = createPiece('ILJOTSZ'[Math.random() * 7 | 0]);
    
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
                   (player.matrix[0].length / 2 | 0);

    if (collide(arena, player)) {
        gameOver();
    }
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function arenaSweep() {
    let rowCount = 0;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        rowCount++;
    }
    
    if (rowCount > 0) {
        // Scoring: 40, 100, 300, 1200
        const lineScores = [0, 40, 100, 300, 1200];
        score += lineScores[rowCount] * level;
        linesClearedTotal += rowCount;
        
        // Level up every 10 lines
        level = Math.floor(linesClearedTotal / 10) + 1;
        
        // Speed up
        dropInterval = Math.max(100, 1000 - (level - 1) * 100);
    }
}

function updateScore() {
    document.getElementById('score').innerText = score;
    document.getElementById('level').innerText = level;
    document.getElementById('lines').innerText = linesClearedTotal;
}

function gameOver() {
    isGameOver = true;
    document.getElementById('overlay-title').innerText = "GAME OVER";
    document.getElementById('start-btn').innerText = "TRY AGAIN";
    document.getElementById('overlay').classList.remove('hidden');
}

function update(time = 0) {
    if (isPaused || isGameOver) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

// --- Controls ---

document.addEventListener('keydown', event => {
    if (isGameOver) return;
    
    if (event.keyCode === 37) { // Left
        playerMove(-1);
    } else if (event.keyCode === 39) { // Right
        playerMove(1);
    } else if (event.keyCode === 40) { // Down
        playerDrop();
    } else if (event.keyCode === 38) { // Up (Rotate)
        playerRotate(1);
    } else if (event.keyCode === 32) { // Space (Hard Drop)
        playerHardDrop();
    } else if (event.keyCode === 80) { // P (Pause)
        togglePause();
    }
});

function togglePause() {
    if (isGameOver) return;
    isPaused = !isPaused;
    if (isPaused) {
        document.getElementById('overlay-title').innerText = "PAUSED";
        document.getElementById('start-btn').innerText = "RESUME";
        document.getElementById('overlay').classList.remove('hidden');
    } else {
        document.getElementById('overlay').classList.add('hidden');
        lastTime = performance.now(); // Prevent jump
        update();
    }
}

// Mobile Controls
document.getElementById('btn-left').addEventListener('click', () => playerMove(-1));
document.getElementById('btn-right').addEventListener('click', () => playerMove(1));
document.getElementById('btn-down').addEventListener('click', () => playerDrop());
document.getElementById('btn-rotate').addEventListener('click', () => playerRotate(1));
document.getElementById('btn-drop').addEventListener('click', () => playerHardDrop());

// Start Game
document.getElementById('start-btn').addEventListener('click', () => {
    if (isGameOver) {
        // Reset Game
        arena.forEach(row => row.fill(0));
        score = 0;
        level = 1;
        linesClearedTotal = 0;
        dropInterval = 1000;
        updateScore();
        isGameOver = false;
        playerReset();
    }
    
    if (isPaused) {
        togglePause();
    } else {
        document.getElementById('overlay').classList.add('hidden');
        if (!player.matrix) playerReset();
        update();
    }
});

// Initial Draw (Empty)
context.fillStyle = '#000';
context.fillRect(0, 0, canvas.width, canvas.height);
updateScore();
