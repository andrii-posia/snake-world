/* ========================================
   🐍 SNAKE ARENA - Core Game Engine
   Complete Snake Game with 80s Features
======================================== */

class SnakeGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Game dimensions
        this.cellSize = 20;
        this.gridWidth = 30;
        this.gridHeight = 25;
        this.canvas.width = this.gridWidth * this.cellSize;
        this.canvas.height = this.gridHeight * this.cellSize;

        // Game state
        this.gameMode = 'single'; // 'single' or 'multi'
        this.state = 'menu'; // 'menu', 'playing', 'paused', 'gameover'
        this.score = 0;
        this.level = 1;
        this.baseSpeed = 120;

        // Snake
        this.snake = [];
        this.direction = { x: 1, y: 0 };
        this.directionQueue = [];

        // Opponent snake (multiplayer)
        this.opponentSnake = [];
        this.opponentDirection = { x: -1, y: 0 };

        // Food & Bonus
        this.food = null;
        this.bonusFruit = null;
        this.bonusFruits = [
            { symbol: '🍒', points: 50 },
            { symbol: '🍎', points: 30 },
            { symbol: '🍊', points: 40 },
            { symbol: '🍇', points: 60 },
            { symbol: '🍓', points: 45 }
        ];

        // Obstacles (level progression)
        this.obstacles = [];

        // Timing
        this.lastUpdate = 0;
        this.animationId = null;

        // Colors - 80s neon theme with ice-blue snake
        this.colors = {
            snake: '#7fdbff',
            snakeHead: '#a8e6ff',
            opponent: '#00ffff',
            opponentHead: '#00bfff',
            food: '#ff00ff',
            obstacle: '#ff6600',
            grid: 'rgba(0, 255, 255, 0.05)'
        };

        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);

        // Initialize
        this.setupEventListeners();
        this.setupUI();

        // Load high scores on start
        setTimeout(() => this.updateHighScoreDisplay(), 100);
    }

    setupEventListeners() {
        document.addEventListener('keydown', this.handleKeyDown);
    }

    setupUI() {
        // Start menu buttons
        document.getElementById('btn-single')?.addEventListener('click', () => this.startGame('single'));
        document.getElementById('btn-multi')?.addEventListener('click', () => this.showMultiplayerMenu());

        // Game over buttons
        document.getElementById('btn-restart')?.addEventListener('click', () => this.restartGame());
        document.getElementById('btn-menu')?.addEventListener('click', () => this.showMainMenu());

        // Pause button
        document.getElementById('btn-pause')?.addEventListener('click', () => {
            if (this.state === 'playing') this.pauseGame();
            else if (this.state === 'paused') this.resumeGame();
        });

        // Check for room code in URL
        const roomCode = multiplayer.getRoomFromURL();
        if (roomCode) {
            this.joinMultiplayerGame(roomCode);
        }
    }

    handleKeyDown(e) {
        // Prevent default for arrow keys and space
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', ' '].includes(e.key)) {
            e.preventDefault();
        }

        // Menu navigation
        if (this.state === 'menu') {
            if (e.key === '1') this.startGame('single');
            if (e.key === '2') this.showMultiplayerMenu();
            return;
        }

        // Pause toggle
        if (e.key === ' ' || e.key === 'Escape') {
            if (this.state === 'playing') this.pauseGame();
            else if (this.state === 'paused') this.resumeGame();
            return;
        }

        // Snake controls (WASD for player 1)
        if (this.state === 'playing') {
            const keyMap = {
                'w': { x: 0, y: -1 },
                'W': { x: 0, y: -1 },
                'ArrowUp': { x: 0, y: -1 },
                's': { x: 0, y: 1 },
                'S': { x: 0, y: 1 },
                'ArrowDown': { x: 0, y: 1 },
                'a': { x: -1, y: 0 },
                'A': { x: -1, y: 0 },
                'ArrowLeft': { x: -1, y: 0 },
                'd': { x: 1, y: 0 },
                'D': { x: 1, y: 0 },
                'ArrowRight': { x: 1, y: 0 }
            };

            const newDir = keyMap[e.key];
            if (newDir) {
                // Compare against last queued direction to prevent 180-degree turns
                const lastQueued = this.directionQueue.length > 0
                    ? this.directionQueue[this.directionQueue.length - 1]
                    : this.direction;
                if (
                    (lastQueued.x + newDir.x !== 0 || lastQueued.y + newDir.y !== 0) &&
                    this.directionQueue.length < 3
                ) {
                    this.directionQueue.push(newDir);
                    if (typeof audio !== 'undefined') audio.init();
                }
            }
        }
    }

    startGame(mode) {
        this.gameMode = mode;
        this.state = 'playing';
        this.score = 0;
        this.level = 1;

        // Initialize snake
        const startX = Math.floor(this.gridWidth / 4);
        const startY = Math.floor(this.gridHeight / 2);
        this.snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];
        this.direction = { x: 1, y: 0 };
        this.directionQueue = [];

        // Initialize opponent for multiplayer
        if (mode === 'multi') {
            const oppStartX = Math.floor(this.gridWidth * 3 / 4);
            this.opponentSnake = [
                { x: oppStartX, y: startY },
                { x: oppStartX + 1, y: startY },
                { x: oppStartX + 2, y: startY }
            ];
            this.opponentDirection = { x: -1, y: 0 };
        }

        // Reset power-ups
        if (typeof powerUps !== 'undefined') {
            powerUps.reset();
        }

        // Place initial food
        this.placeFood();

        // Clear obstacles (will add based on level)
        this.obstacles = [];

        // Update UI
        this.updateScoreDisplay();
        this.hideAllOverlays();

        // Show appropriate controls
        document.querySelector('.scoreboard')?.classList.toggle('single-mode', mode === 'single');
        document.getElementById('p2-controls').style.display = mode === 'multi' ? 'flex' : 'none';

        // Show pause button
        document.getElementById('btn-pause').style.display = 'inline-block';

        // Play start sound
        if (typeof audio !== 'undefined') {
            audio.init();
            audio.playStart();
        }

        // Start game loop
        this.lastUpdate = performance.now();
        this.gameLoop();
    }

    gameLoop(timestamp = performance.now()) {
        if (this.state !== 'playing') return;

        const elapsed = timestamp - this.lastUpdate;
        let speed = this.baseSpeed - (this.level - 1) * 5; // Speed increases with level

        // Apply power-up speed modifier
        if (typeof powerUps !== 'undefined') {
            speed = speed / powerUps.getSpeedMultiplier();
        }

        // Apply weather speed modifier
        if (typeof weather !== 'undefined') {
            speed = speed / weather.getSpeedModifier();
        }

        speed = Math.max(speed, 50); // Minimum speed cap

        if (elapsed >= speed) {
            this.update();
            this.lastUpdate = timestamp;
        }

        this.draw();
        this.animationId = requestAnimationFrame(this.gameLoop);
    }

    update() {
        // Consume next queued direction if available
        if (this.directionQueue.length > 0) {
            this.direction = this.directionQueue.shift();
        }

        // Calculate new head position
        const head = this.snake[0];
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };

        // Check wall collision (wrap around disabled - game over on wall hit)
        if (newHead.x < 0 || newHead.x >= this.gridWidth ||
            newHead.y < 0 || newHead.y >= this.gridHeight) {
            if (typeof powerUps !== 'undefined' && powerUps.isInvincible()) {
                // Wrap around when invincible
                newHead.x = (newHead.x + this.gridWidth) % this.gridWidth;
                newHead.y = (newHead.y + this.gridHeight) % this.gridHeight;
            } else {
                this.gameOver();
                return;
            }
        }

        // Check self collision
        if (this.checkCollision(newHead, this.snake) &&
            !(typeof powerUps !== 'undefined' && powerUps.isInvincible())) {
            this.gameOver();
            return;
        }

        // Check obstacle collision
        if (this.checkCollision(newHead, this.obstacles) &&
            !(typeof powerUps !== 'undefined' && powerUps.isInvincible())) {
            this.gameOver();
            return;
        }

        // Check opponent collision (multiplayer)
        if (this.gameMode === 'multi' && this.checkCollision(newHead, this.opponentSnake)) {
            this.gameOver();
            return;
        }

        // Move snake
        this.snake.unshift(newHead);

        // Check food collision
        if (newHead.x === this.food.x && newHead.y === this.food.y) {
            this.score += 10;
            this.updateScoreDisplay();
            this.placeFood();

            if (typeof audio !== 'undefined') audio.playEat();

            // Chance to spawn power-up
            if (typeof powerUps !== 'undefined' && powerUps.shouldSpawn()) {
                powerUps.spawn(this.gridWidth, this.gridHeight, this.getAllOccupiedCells());
            }

            // Chance to spawn bonus fruit
            if (Math.random() < 0.15 && !this.bonusFruit) {
                this.placeBonusFruit();
            }

            // Level up every 50 points
            if (this.score % 50 === 0 && this.score > 0) {
                this.levelUp();
            }
        } else {
            this.snake.pop();
        }

        // Check bonus fruit collision
        if (this.bonusFruit && newHead.x === this.bonusFruit.x && newHead.y === this.bonusFruit.y) {
            this.score += this.bonusFruit.points;
            this.updateScoreDisplay();
            this.bonusFruit = null;
            if (typeof audio !== 'undefined') audio.playBonusEat();
        }

        // Check power-up collision
        if (typeof powerUps !== 'undefined' && powerUps.spawnedPowerUp) {
            const pu = powerUps.spawnedPowerUp;
            if (newHead.x === pu.position.x && newHead.y === pu.position.y) {
                const effect = powerUps.collect(this.snake);
                if (effect && effect.type === 'shrink' && this.snake.length > 3) {
                    // Shrink snake
                    const removeCount = Math.min(effect.shrinkAmount, this.snake.length - 3);
                    for (let i = 0; i < removeCount; i++) {
                        this.snake.pop();
                    }
                }
            }
        }

        // Update power-ups
        if (typeof powerUps !== 'undefined') {
            powerUps.update();
        }

        // Update bonus fruit timer
        if (this.bonusFruit) {
            this.bonusFruit.timer--;
            if (this.bonusFruit.timer <= 0) {
                this.bonusFruit = null;
            }
        }

        // Send state to multiplayer peer
        if (this.gameMode === 'multi' && typeof multiplayer !== 'undefined' && multiplayer.isConnected()) {
            multiplayer.sendState({
                type: 'state',
                snake: this.snake,
                direction: this.direction,
                score: this.score
            });
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#050508';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.drawGrid();

        // Draw obstacles
        this.obstacles.forEach(obs => {
            this.ctx.fillStyle = this.colors.obstacle;
            this.ctx.fillRect(
                obs.x * this.cellSize + 1,
                obs.y * this.cellSize + 1,
                this.cellSize - 2,
                this.cellSize - 2
            );
        });

        // Draw food
        this.drawFood();

        // Draw bonus fruit
        if (this.bonusFruit) {
            this.drawBonusFruit();
        }

        // Draw power-ups
        if (typeof powerUps !== 'undefined') {
            powerUps.draw(this.ctx, this.cellSize);
        }

        // Draw snake
        this.drawSnake(this.snake, this.colors.snake, this.colors.snakeHead);

        // Draw opponent snake (multiplayer)
        if (this.gameMode === 'multi' && this.opponentSnake.length > 0) {
            this.drawSnake(this.opponentSnake, this.colors.opponent, this.colors.opponentHead);
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 0.5;

        for (let x = 0; x <= this.gridWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.cellSize, 0);
            this.ctx.lineTo(x * this.cellSize, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y <= this.gridHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.cellSize);
            this.ctx.lineTo(this.canvas.width, y * this.cellSize);
            this.ctx.stroke();
        }
    }

    drawRoundRect(ctx, x, y, w, h, r) {
        if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(x, y, w, h, r);
        } else {
            // Fallback for browsers without native roundRect support
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.arcTo(x + w, y, x + w, y + r, r);
            ctx.lineTo(x + w, y + h - r);
            ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
            ctx.lineTo(x + r, y + h);
            ctx.arcTo(x, y + h, x, y + h - r, r);
            ctx.lineTo(x, y + r);
            ctx.arcTo(x, y, x + r, y, r);
            ctx.closePath();
        }
    }

    drawSnake(snake, bodyColor, headColor) {
        snake.forEach((segment, index) => {
            const x = segment.x * this.cellSize;
            const y = segment.y * this.cellSize;
            const size = this.cellSize - 2;

            if (index === 0) {
                // Head with glow effect
                this.ctx.shadowColor = headColor;
                this.ctx.shadowBlur = 10;
                this.ctx.fillStyle = headColor;
            } else {
                this.ctx.shadowBlur = 0;
                this.ctx.fillStyle = bodyColor;
            }

            // Rounded rectangle for each segment
            this.ctx.beginPath();
            this.drawRoundRect(this.ctx, x + 1, y + 1, size, size, 4);
            this.ctx.fill();

            // Eyes on head
            if (index === 0) {
                this.ctx.shadowBlur = 0;
                this.ctx.fillStyle = '#000';
                const eyeSize = 3;
                const eyeOffset = 5;

                if (this.direction.x === 1) { // Right
                    this.ctx.fillRect(x + size - eyeOffset, y + eyeOffset, eyeSize, eyeSize);
                    this.ctx.fillRect(x + size - eyeOffset, y + size - eyeOffset - eyeSize, eyeSize, eyeSize);
                } else if (this.direction.x === -1) { // Left
                    this.ctx.fillRect(x + eyeOffset, y + eyeOffset, eyeSize, eyeSize);
                    this.ctx.fillRect(x + eyeOffset, y + size - eyeOffset - eyeSize, eyeSize, eyeSize);
                } else if (this.direction.y === -1) { // Up
                    this.ctx.fillRect(x + eyeOffset, y + eyeOffset, eyeSize, eyeSize);
                    this.ctx.fillRect(x + size - eyeOffset - eyeSize, y + eyeOffset, eyeSize, eyeSize);
                } else { // Down
                    this.ctx.fillRect(x + eyeOffset, y + size - eyeOffset, eyeSize, eyeSize);
                    this.ctx.fillRect(x + size - eyeOffset - eyeSize, y + size - eyeOffset, eyeSize, eyeSize);
                }
            }
        });
        this.ctx.shadowBlur = 0;
    }

    drawFood() {
        const x = this.food.x * this.cellSize + this.cellSize / 2;
        const y = this.food.y * this.cellSize + this.cellSize / 2;
        const radius = (this.cellSize - 4) / 2;

        // Pulsing effect
        const pulse = 1 + Math.sin(Date.now() / 200) * 0.1;

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.scale(pulse, pulse);

        // Glow
        this.ctx.shadowColor = this.colors.food;
        this.ctx.shadowBlur = 15;

        this.ctx.fillStyle = this.colors.food;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    drawBonusFruit() {
        const x = this.bonusFruit.x * this.cellSize;
        const y = this.bonusFruit.y * this.cellSize;
        const flash = this.bonusFruit.timer < 60 && Math.floor(Date.now() / 100) % 2 === 0;

        if (!flash) {
            this.ctx.font = `${this.cellSize - 4}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.shadowColor = '#fff';
            this.ctx.shadowBlur = 10;
            this.ctx.fillText(this.bonusFruit.symbol, x + this.cellSize / 2, y + this.cellSize / 2);
            this.ctx.shadowBlur = 0;
        }
    }

    placeFood() {
        let position;
        do {
            position = {
                x: Math.floor(Math.random() * this.gridWidth),
                y: Math.floor(Math.random() * this.gridHeight)
            };
        } while (this.isOccupied(position));

        this.food = position;
    }

    placeBonusFruit() {
        let position;
        do {
            position = {
                x: Math.floor(Math.random() * this.gridWidth),
                y: Math.floor(Math.random() * this.gridHeight)
            };
        } while (this.isOccupied(position));

        const fruitType = this.bonusFruits[Math.floor(Math.random() * this.bonusFruits.length)];
        this.bonusFruit = {
            ...position,
            ...fruitType,
            timer: 180 // ~3 seconds at 60fps equivalent
        };
    }

    isOccupied(pos) {
        return this.checkCollision(pos, this.snake) ||
            this.checkCollision(pos, this.opponentSnake) ||
            this.checkCollision(pos, this.obstacles) ||
            (this.food && pos.x === this.food.x && pos.y === this.food.y);
    }

    getAllOccupiedCells() {
        return [
            ...this.snake,
            ...this.opponentSnake,
            ...this.obstacles,
            this.food
        ].filter(Boolean);
    }

    checkCollision(pos, array) {
        return array.some(cell => cell.x === pos.x && cell.y === pos.y);
    }

    levelUp() {
        this.level++;
        if (typeof audio !== 'undefined') audio.playLevelUp();
        this.updateScoreDisplay();

        // Add obstacles at certain levels
        if (this.level % 2 === 0) {
            this.addObstacle();
        }
    }

    addObstacle() {
        const patterns = [
            // Horizontal line
            () => {
                const y = Math.floor(Math.random() * (this.gridHeight - 4)) + 2;
                const x = Math.floor(Math.random() * (this.gridWidth - 6)) + 2;
                return Array.from({ length: 4 }, (_, i) => ({ x: x + i, y }));
            },
            // Vertical line
            () => {
                const x = Math.floor(Math.random() * (this.gridWidth - 4)) + 2;
                const y = Math.floor(Math.random() * (this.gridHeight - 6)) + 2;
                return Array.from({ length: 4 }, (_, i) => ({ x, y: y + i }));
            },
            // Square
            () => {
                const x = Math.floor(Math.random() * (this.gridWidth - 4)) + 2;
                const y = Math.floor(Math.random() * (this.gridHeight - 4)) + 2;
                return [
                    { x, y }, { x: x + 1, y },
                    { x, y: y + 1 }, { x: x + 1, y: y + 1 }
                ];
            }
        ];

        const pattern = patterns[Math.floor(Math.random() * patterns.length)]();

        // Only add if not overlapping with snake or food
        const canAdd = pattern.every(cell => !this.isOccupied(cell));
        if (canAdd) {
            this.obstacles.push(...pattern);
        }
    }

    gameOver() {
        if (this.state === 'gameover') return;
        this.state = 'gameover';
        cancelAnimationFrame(this.animationId);

        if (typeof audio !== 'undefined') audio.playGameOver();

        // Show game over screen
        const gameOverOverlay = document.getElementById('game-over');
        const scoreValue = document.getElementById('final-score-value');
        const winnerDisplay = document.getElementById('winner-display');

        gameOverOverlay.classList.remove('hidden');

        if (this.gameMode === 'single') {
            scoreValue.textContent = this.score;
            winnerDisplay.classList.add('hidden');

            // Show high score entry form if score qualifies
            if (highScores.isHighScore(this.score)) {
                const gameOverCard = document.querySelector('#game-over .game-over-card');

                // Clear any existing high score forms from previous games
                const existingForm = gameOverCard.querySelector('.highscore-entry');
                if (existingForm) {
                    existingForm.remove();
                }

                const entryForm = highScores.renderEntryForm(this.score, (initials) => {
                    highScores.addScore(initials, this.score);
                    entryForm.remove();
                    this.updateHighScoreDisplay();
                });
                gameOverCard.appendChild(entryForm);
            }
        } else {
            // Multiplayer - show winner
            winnerDisplay.classList.remove('hidden');
            document.getElementById('winner-text').textContent = 'Game Over!';
        }
    }

    pauseGame() {
        if (this.state !== 'playing') return;
        this.state = 'paused';
        cancelAnimationFrame(this.animationId);
        document.getElementById('pause-menu').classList.remove('hidden');
    }

    resumeGame() {
        if (this.state !== 'paused') return;
        this.state = 'playing';
        document.getElementById('pause-menu').classList.add('hidden');
        this.lastUpdate = performance.now();
        this.gameLoop();
    }

    restartGame() {
        this.hideAllOverlays();
        this.startGame(this.gameMode);
    }

    showMainMenu() {
        this.state = 'menu';
        this.hideAllOverlays();
        document.getElementById('start-menu').classList.remove('hidden');

        // Hide pause button
        document.getElementById('btn-pause').style.display = 'none';

        // Update high scores in menu
        this.updateHighScoreDisplay();

        // Disconnect multiplayer
        if (typeof multiplayer !== 'undefined') {
            multiplayer.disconnect();
        }
    }

    updateHighScoreDisplay() {
        const highScoreList = document.getElementById('highscore-list');
        if (!highScoreList) return;

        const scores = highScores.getScores();
        const items = highScoreList.querySelectorAll('.highscore-item');
        items.forEach((item, index) => {
            const score = scores[index];
            item.querySelector('.name').textContent = score ? score.initials : '---';
            item.querySelector('.score').textContent = score ? score.score : '0';
        });
    }

    hideAllOverlays() {
        document.querySelectorAll('.overlay').forEach(overlay => {
            overlay.classList.add('hidden');
        });
    }

    updateScoreDisplay() {
        if (this.gameMode === 'single') {
            document.getElementById('score-single').textContent = this.score;
        } else {
            document.getElementById('score-p1').textContent = this.score;
        }
        const levelEl = document.getElementById('level-value');
        if (levelEl) levelEl.textContent = this.level;
    }

    // ===== MULTIPLAYER METHODS =====

    showMultiplayerMenu() {
        const overlay = document.getElementById('start-menu');
        const card = overlay.querySelector('.menu-card');

        card.innerHTML = `
            <div class="menu-snake-icon">🌐</div>
            <h2 class="menu-title">MULTIPLAYER</h2>
            <p class="menu-subtitle">Play with a friend online</p>
            <div class="menu-buttons">
                <button class="btn btn-primary" id="btn-create-room">
                    <span class="btn-icon">🏠</span>
                    Create Room
                </button>
                <button class="btn btn-secondary" id="btn-join-room">
                    <span class="btn-icon">🚪</span>
                    Join Room
                </button>
                <button class="btn btn-secondary" id="btn-back-menu">
                    <span class="btn-icon">⬅️</span>
                    Back
                </button>
            </div>
        `;

        document.getElementById('btn-create-room').addEventListener('click', () => this.createMultiplayerRoom());
        document.getElementById('btn-join-room').addEventListener('click', () => this.showJoinRoomUI());
        document.getElementById('btn-back-menu').addEventListener('click', () => this.resetMainMenu());
    }

    async createMultiplayerRoom() {
        const card = document.querySelector('.menu-card');
        card.innerHTML = `
            <div class="menu-snake-icon">⏳</div>
            <h2 class="menu-title">CREATING ROOM...</h2>
            <p class="menu-subtitle">Please wait</p>
        `;

        try {
            const roomId = await multiplayer.createRoom();

            card.innerHTML = `
                <div class="menu-snake-icon">✅</div>
                <h2 class="menu-title">ROOM CREATED!</h2>
                <div class="room-code-display">
                    <p style="font-size: 0.5rem; margin-bottom: 10px;">Share this code:</p>
                    <div class="room-code">${roomId}</div>
                    <button class="copy-btn" id="copy-link">📋 COPY LINK</button>
                </div>
                <p class="menu-subtitle">Waiting for opponent...</p>
            `;

            document.getElementById('copy-link').addEventListener('click', () => {
                navigator.clipboard.writeText(multiplayer.getShareableLink());
                document.getElementById('copy-link').textContent = '✅ COPIED!';
                setTimeout(() => {
                    document.getElementById('copy-link').textContent = '📋 COPY LINK';
                }, 2000);
            });

            // Wait for opponent to connect
            multiplayer.onConnected = () => {
                this.startGame('multi');
            };

        } catch (error) {
            card.innerHTML = `
                <div class="menu-snake-icon">❌</div>
                <h2 class="menu-title">ERROR</h2>
                <p class="menu-subtitle">${error.message}</p>
                <button class="btn btn-primary" id="btn-retry">Retry</button>
            `;
            document.getElementById('btn-retry').addEventListener('click', () => this.showMultiplayerMenu());
        }
    }

    showJoinRoomUI() {
        const card = document.querySelector('.menu-card');
        card.innerHTML = `
            <div class="menu-snake-icon">🚪</div>
            <h2 class="menu-title">JOIN ROOM</h2>
            <p class="menu-subtitle">Enter room code:</p>
            <div class="initial-input" style="margin: 20px 0;">
                <input type="text" class="initial-char" style="width: 180px;" id="room-input" placeholder="XXXXXX" maxlength="6" autocomplete="off">
            </div>
            <div class="menu-buttons">
                <button class="btn btn-primary" id="btn-join-go">
                    <span class="btn-icon">🎮</span>
                    JOIN
                </button>
                <button class="btn btn-secondary" id="btn-back-multi">
                    <span class="btn-icon">⬅️</span>
                    Back
                </button>
            </div>
        `;

        document.getElementById('room-input').focus();
        document.getElementById('btn-join-go').addEventListener('click', () => {
            const code = document.getElementById('room-input').value;
            if (code.length === 6) {
                this.joinMultiplayerGame(code);
            }
        });
        document.getElementById('btn-back-multi').addEventListener('click', () => this.showMultiplayerMenu());
    }

    async joinMultiplayerGame(roomCode) {
        const overlay = document.getElementById('start-menu');
        overlay.classList.remove('hidden');
        const card = overlay.querySelector('.menu-card');

        card.innerHTML = `
            <div class="menu-snake-icon">⏳</div>
            <h2 class="menu-title">JOINING...</h2>
            <p class="menu-subtitle">Connecting to ${roomCode}</p>
        `;

        try {
            await multiplayer.joinRoom(roomCode);

            // Setup state receiving
            multiplayer.onStateReceived = (data) => {
                if (data.type === 'state') {
                    this.opponentSnake = data.snake;
                    this.opponentDirection = data.direction;
                    document.getElementById('score-p2').textContent = data.score;
                }
            };

            multiplayer.onDisconnected = () => {
                if (this.state === 'playing') {
                    this.gameOver();
                }
            };

            this.startGame('multi');

        } catch (error) {
            card.innerHTML = `
                <div class="menu-snake-icon">❌</div>
                <h2 class="menu-title">FAILED TO JOIN</h2>
                <p class="menu-subtitle">${error.message}</p>
                <button class="btn btn-primary" id="btn-retry-join">Retry</button>
            `;
            document.getElementById('btn-retry-join').addEventListener('click', () => this.showJoinRoomUI());
        }
    }

    resetMainMenu() {
        const overlay = document.getElementById('start-menu');
        const card = overlay.querySelector('.menu-card');

        card.innerHTML = `
            <div class="menu-snake-icon">🐍</div>
            <h2 class="menu-title">SNAKE ARENA</h2>
            <p class="menu-subtitle">The Classic Arcade Game</p>
            <div class="menu-buttons">
                <button class="btn btn-primary" id="btn-single">
                    <span class="btn-icon">👤</span>
                    Single Player
                </button>
                <button class="btn btn-secondary" id="btn-multi">
                    <span class="btn-icon">👥</span>
                    Multiplayer
                </button>
            </div>
            <div class="menu-features">
                <div class="feature">✓ Arrow Keys / WASD</div>
                <div class="feature">✓ Real-time Weather</div>
                <div class="feature">✓ Online Multiplayer</div>
            </div>
        `;

        document.getElementById('btn-single').addEventListener('click', () => this.startGame('single'));
        document.getElementById('btn-multi').addEventListener('click', () => this.showMultiplayerMenu());
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new SnakeGame('game-canvas');
});
