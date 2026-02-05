const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');
const holdCanvas = document.getElementById('hold');
const holdContext = holdCanvas.getContext('2d');

// Scale
context.scale(30, 30);
nextContext.scale(20, 20); // 4x4 grid in 80x80
holdContext.scale(20, 20);

// Audio (Kept from v1.1)
class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
        this.bgmInterval = null;
    }
    
    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) {
            if (this.ctx.state === 'suspended') this.ctx.resume();
            this.startBGM();
        } else {
            this.stopBGM();
        }
        return this.enabled;
    }

    startBGM() {
        if (!this.enabled || this.bgmInterval) return;
        // Simple ambient arpeggio (Cm7 - Bb - Ab - G7)
        const notes = [
            261.63, 311.13, 392.00, 466.16, // Cm7
            233.08, 293.66, 349.23, 466.16, // Bb
            207.65, 261.63, 311.13, 415.30, // Ab
            196.00, 246.94, 293.66, 392.00  // G
        ];
        let i = 0;
        this.bgmInterval = setInterval(() => {
            if (!this.enabled) return;
            const f = notes[i % notes.length];
            // Soft sine pad
            this.playTone(f, 'sine', 0.02, 0.6); 
            // Bass
            if (i % 4 === 0) this.playTone(f * 0.5, 'triangle', 0.03, 1.0);
            i++;
        }, 300);
    }

    stopBGM() {
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
    }

    play(type) {
        if (!this.enabled || !this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        const now = this.ctx.currentTime;

        if (type === 'move') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.05);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.05);
            osc.start(now); osc.stop(now + 0.05);
        } else if (type === 'rotate') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.linearRampToValueAtTime(600, now + 0.1);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        } else if (type === 'drop') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.2);
            osc.start(now); osc.stop(now + 0.2);
        } else if (type === 'clear') {
            this.playTone(440, 'sine', 0.1, 0.4);
            this.playTone(554, 'sine', 0.1, 0.4);
            this.playTone(659, 'sine', 0.1, 0.4);
        } else if (type === 'gameover') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 1.0);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0, now + 1.0);
            osc.start(now); osc.stop(now + 1.0);
        } else if (type === 'hold') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, now);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        }
    }
    playTone(freq, type, vol, dur) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + dur);
    }
}
const audio = new SoundManager();

// Colors (Vibrant Flat)
const colors = [
    null,
    '#ff6b6b', // T - Red
    '#54a0ff', // I - Blue
    '#1dd1a1', // S - Green
    '#feca57', // Z - Yellow
    '#ff9ff3', // L - Pink
    '#00d2d3', // O - Teal
    '#5f27cd', // J - Purple
];

const arena = createMatrix(10, 20);

// Game State
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let score = 0;
let level = 1;
let linesClearedTotal = 0;
let isPaused = false;
let isGameOver = false;

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
    next: null,
    hold: null,
    canHold: true,
};

let particles = [];

class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color;
        this.vx = (Math.random() - 0.5) * 0.5; 
        this.vy = (Math.random() - 0.5) * 0.5;
        this.alpha = 1;
        this.size = Math.random() * 0.6 + 0.2;
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        this.vy += 0.01; this.alpha -= 0.02;
    }
    draw(ctx) {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

function createMatrix(w, h) {
    const matrix = [];
    while (h--) matrix.push(new Array(w).fill(0));
    return matrix;
}

function createPiece(type) {
    if (type === 'I') return [[0, 2, 0, 0], [0, 2, 0, 0], [0, 2, 0, 0], [0, 2, 0, 0]]; // Blue
    if (type === 'L') return [[0, 5, 0], [0, 5, 0], [0, 5, 5]]; // Pink
    if (type === 'J') return [[0, 7, 0], [0, 7, 0], [7, 7, 0]]; // Purple
    if (type === 'O') return [[6, 6], [6, 6]]; // Teal
    if (type === 'Z') return [[4, 4, 0], [0, 4, 4], [0, 0, 0]]; // Yellow
    if (type === 'S') return [[0, 3, 3], [3, 3, 0], [0, 0, 0]]; // Green
    if (type === 'T') return [[0, 1, 0], [1, 1, 1], [0, 0, 0]]; // Red
    return [[0,0,0],[0,0,0],[0,0,0]]; // Fallback
}

// Helper to get type char from matrix (for Hold)
function getPieceType(matrix) {
    const val = matrix.flat().find(v => v !== 0);
    if (!val) return 'T';
    if (val === 2) return 'I';
    if (val === 5) return 'L';
    if (val === 7) return 'J';
    if (val === 6) return 'O';
    if (val === 4) return 'Z';
    if (val === 3) return 'S';
    if (val === 1) return 'T';
    return 'T';
}

function drawMatrix(matrix, offset, ctx, alpha = 1) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = colors[value];
                ctx.globalAlpha = alpha;
                
                // Flat style block with slight rounded inner
                // Actually canvas rects are sharp. 
                // We can simulate a gap
                ctx.fillRect(x + offset.x + 0.05, y + offset.y + 0.05, 0.9, 0.9);
                
                ctx.globalAlpha = 1;
            }
        });
    });
}

function drawGhost() {
    // Clone player
    const ghost = {
        pos: { ...player.pos },
        matrix: player.matrix
    };
    
    // Drop until collide
    while (!collide(arena, ghost)) {
        ghost.pos.y++;
    }
    ghost.pos.y--; // Step back
    
    drawMatrix(ghost.matrix, ghost.pos, context, 0.2); // 20% opacity
}

function draw() {
    // Clear Main Board
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    drawMatrix(arena, {x: 0, y: 0}, context);
    
    if (!isGameOver && !isPaused) {
        drawGhost();
        drawMatrix(player.matrix, player.pos, context);
    }
    
    particles.forEach(p => p.draw(context));

    // Draw Next
    nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (player.next) {
        const offset = {
            x: 2 - player.next[0].length / 2,
            y: 2 - player.next.length / 2
        };
        drawMatrix(player.next, offset, nextContext);
    }
    
    // Draw Hold
    holdContext.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
    if (player.hold) {
        const offset = {
            x: 2 - player.hold[0].length / 2,
            y: 2 - player.hold.length / 2
        };
        drawMatrix(player.hold, offset, holdContext, player.canHold ? 1 : 0.5);
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
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) matrix.forEach(row => row.reverse());
    else matrix.reverse();
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
        audio.play('drop');
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
    audio.play('drop');
    if (navigator.vibrate) navigator.vibrate(20);
    dropCounter = 0;
}

function playerMove(offset) {
    player.pos.x += offset;
    if (collide(arena, player)) {
        player.pos.x -= offset;
    } else {
        audio.play('move');
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
    audio.play('rotate');
}

function playerHold() {
    if (!player.canHold) return;
    
    audio.play('hold');
    
    // Calculate current type
    const currentType = getPieceType(player.matrix);
    
    if (player.hold === null) {
        // First hold: store current, get next
        player.hold = createPiece(currentType);
        playerReset(true); // Reset but don't spawn hold (spawn next)
    } else {
        // Swap
        const temp = player.hold;
        player.hold = createPiece(currentType);
        player.matrix = temp;
        player.pos.y = 0;
        player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
        player.canHold = false; // Lock hold
    }
    // Note: playerReset usually spawns next. 
    // Logic: 
    // If holding for first time: current -> hold, next -> current.
    // If swapping: current -> hold, old hold -> current.
}

function playerReset(fromHold = false) {
    if (!fromHold) {
        if (player.next === null) player.next = createPiece('ILJOTSZ'[Math.random() * 7 | 0]);
        player.matrix = player.next;
        player.next = createPiece('ILJOTSZ'[Math.random() * 7 | 0]);
        player.canHold = true; // Unlock hold
    }
    
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);

    if (collide(arena, player)) {
        gameOver();
    }
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) return true;
        }
    }
    return false;
}

function arenaSweep() {
    let rowCount = 0;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) continue outer;
        }
        
        // Particles
        for (let x = 0; x < 10; x++) {
            const val = arena[y][x];
            for (let i = 0; i < 5; i++) particles.push(new Particle(x, y, colors[val]));
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        rowCount++;
    }
    
    if (rowCount > 0) {
        score += [0, 40, 100, 300, 1200][rowCount] * level;
        linesClearedTotal += rowCount;
        level = Math.floor(linesClearedTotal / 10) + 1;
        dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        audio.play('clear');
        if (navigator.vibrate) navigator.vibrate([30,30,30]);
    }
}

function updateScore() {
    document.getElementById('score').innerText = score;
    document.getElementById('level').innerText = level;
}

function gameOver() {
    isGameOver = true;
    document.getElementById('overlay-title').innerText = "GAME OVER";
    document.getElementById('start-btn').innerText = "RETRY";
    document.getElementById('overlay').classList.remove('hidden');
    audio.play('gameover');
    if (navigator.vibrate) navigator.vibrate(200);
}

function update(time = 0) {
    if (isPaused || isGameOver) return;
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) playerDrop();

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].alpha <= 0) particles.splice(i, 1);
    }

    draw();
    requestAnimationFrame(update);
}

// Controls
document.addEventListener('keydown', event => {
    if (isGameOver) return;
    if (event.keyCode === 37) playerMove(-1);
    else if (event.keyCode === 39) playerMove(1);
    else if (event.keyCode === 40) playerDrop();
    else if (event.keyCode === 38) playerRotate(1);
    else if (event.keyCode === 32) playerHardDrop();
    else if (event.keyCode === 67 || event.keyCode === 16) playerHold(); // C or Shift
});

// Mobile Controls
document.getElementById('btn-left').addEventListener('touchstart', (e) => { e.preventDefault(); playerMove(-1); });
document.getElementById('btn-right').addEventListener('touchstart', (e) => { e.preventDefault(); playerMove(1); });
document.getElementById('btn-down').addEventListener('touchstart', (e) => { e.preventDefault(); playerDrop(); });
document.getElementById('btn-rotate').addEventListener('touchstart', (e) => { e.preventDefault(); playerRotate(1); });
document.getElementById('btn-drop').addEventListener('touchstart', (e) => { e.preventDefault(); playerHardDrop(); });
document.getElementById('btn-hold').addEventListener('touchstart', (e) => { e.preventDefault(); playerHold(); });

// Also add Click for desktop/testing
document.getElementById('btn-left').addEventListener('click', () => playerMove(-1));
document.getElementById('btn-right').addEventListener('click', () => playerMove(1));
document.getElementById('btn-down').addEventListener('click', () => playerDrop());
document.getElementById('btn-rotate').addEventListener('click', () => playerRotate(1));
document.getElementById('btn-drop').addEventListener('click', () => playerHardDrop());
document.getElementById('btn-hold').addEventListener('click', () => playerHold());

// Mute Button
document.getElementById('btn-mute').addEventListener('click', (e) => {
    const enabled = audio.toggle();
    e.target.innerText = enabled ? '🔊' : '🔇';
});

// Start
document.getElementById('start-btn').addEventListener('click', () => {
    if (isGameOver) {
        arena.forEach(row => row.fill(0));
        score = 0; level = 1; linesClearedTotal = 0; dropInterval = 1000;
        updateScore();
        isGameOver = false;
        player.hold = null;
        playerReset();
    }
    document.getElementById('overlay').classList.add('hidden');
    if (!player.matrix) playerReset();
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    audio.startBGM(); // Start Music
    update();
});

// Init
playerReset();
updateScore();
draw();
