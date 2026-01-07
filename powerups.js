/* ========================================
   ⚡ Power-Up System
   Speed, Invincibility, Shrink
======================================== */

class PowerUpSystem {
    constructor() {
        this.types = {
            speed: {
                symbol: '⚡',
                color: '#ffff00',
                duration: 5000,
                name: 'SPEED BOOST'
            },
            invincible: {
                symbol: '🛡️',
                color: '#9d00ff',
                duration: 4000,
                name: 'INVINCIBLE'
            },
            shrink: {
                symbol: '✂️',
                color: '#39ff14',
                duration: 0, // Instant effect
                name: 'SHRINK'
            },
            slow: {
                symbol: '🐌',
                color: '#00ffff',
                duration: 5000,
                name: 'SLOW MO'
            }
        };

        this.activePowerUp = null;
        this.spawnedPowerUp = null;
        this.activeEffects = new Map();
        this.spawnChance = 0.02; // 2% chance per food eaten
        this.indicatorContainer = null;
    }

    init() {
        // Create indicator container if not exists
        if (!this.indicatorContainer) {
            this.indicatorContainer = document.createElement('div');
            this.indicatorContainer.className = 'powerup-active';
            document.body.appendChild(this.indicatorContainer);
        }
    }

    shouldSpawn() {
        return Math.random() < this.spawnChance && !this.spawnedPowerUp;
    }

    spawn(gridWidth, gridHeight, occupiedCells) {
        if (this.spawnedPowerUp) return null;

        const typeKeys = Object.keys(this.types);
        const randomType = typeKeys[Math.floor(Math.random() * typeKeys.length)];

        let position;
        let attempts = 0;
        do {
            position = {
                x: Math.floor(Math.random() * gridWidth),
                y: Math.floor(Math.random() * gridHeight)
            };
            attempts++;
        } while (this.isOccupied(position, occupiedCells) && attempts < 100);

        if (attempts >= 100) return null;

        this.spawnedPowerUp = {
            type: randomType,
            position: position,
            spawnTime: Date.now(),
            lifetime: 8000 // Disappears after 8 seconds
        };

        return this.spawnedPowerUp;
    }

    isOccupied(pos, occupiedCells) {
        return occupiedCells.some(cell => cell.x === pos.x && cell.y === pos.y);
    }

    collect(snake) {
        if (!this.spawnedPowerUp) return null;

        const powerUp = this.spawnedPowerUp;
        const type = this.types[powerUp.type];
        this.spawnedPowerUp = null;

        if (typeof audio !== 'undefined') {
            audio.playPowerUp();
        }

        // Apply effect
        if (powerUp.type === 'shrink') {
            // Instant effect - shrink snake
            return { type: powerUp.type, shrinkAmount: 3 };
        } else {
            // Timed effect
            this.activateEffect(powerUp.type, type.duration);
            return { type: powerUp.type, duration: type.duration };
        }
    }

    activateEffect(type, duration) {
        const typeInfo = this.types[type];

        // Clear existing effect of same type
        if (this.activeEffects.has(type)) {
            clearTimeout(this.activeEffects.get(type).timeout);
            this.removeIndicator(type);
        }

        // Show indicator
        this.showIndicator(type, typeInfo);

        // Set timeout to remove effect
        const timeout = setTimeout(() => {
            this.deactivateEffect(type);
        }, duration);

        this.activeEffects.set(type, {
            startTime: Date.now(),
            duration: duration,
            timeout: timeout
        });
    }

    deactivateEffect(type) {
        if (this.activeEffects.has(type)) {
            clearTimeout(this.activeEffects.get(type).timeout);
            this.activeEffects.delete(type);
            this.removeIndicator(type);
        }
    }

    isActive(type) {
        return this.activeEffects.has(type);
    }

    showIndicator(type, typeInfo) {
        if (!this.indicatorContainer) this.init();

        const indicator = document.createElement('div');
        indicator.className = `powerup-indicator ${type}`;
        indicator.id = `powerup-${type}`;
        indicator.innerHTML = `${typeInfo.symbol} ${typeInfo.name}`;
        indicator.style.borderColor = typeInfo.color;
        indicator.style.color = typeInfo.color;
        this.indicatorContainer.appendChild(indicator);
    }

    removeIndicator(type) {
        const indicator = document.getElementById(`powerup-${type}`);
        if (indicator) {
            indicator.remove();
        }
    }

    update() {
        // Check if spawned power-up has expired
        if (this.spawnedPowerUp) {
            const elapsed = Date.now() - this.spawnedPowerUp.spawnTime;
            if (elapsed > this.spawnedPowerUp.lifetime) {
                this.spawnedPowerUp = null;
            }
        }
    }

    getSpeedMultiplier() {
        if (this.isActive('speed')) return 1.5;
        if (this.isActive('slow')) return 0.6;
        return 1;
    }

    isInvincible() {
        return this.isActive('invincible');
    }

    draw(ctx, cellSize) {
        if (!this.spawnedPowerUp) return;

        const powerUp = this.spawnedPowerUp;
        const type = this.types[powerUp.type];
        const x = powerUp.position.x * cellSize;
        const y = powerUp.position.y * cellSize;

        // Pulsing effect
        const elapsed = Date.now() - powerUp.spawnTime;
        const pulse = 0.8 + Math.sin(elapsed / 100) * 0.2;
        const remaining = powerUp.lifetime - elapsed;
        const flash = remaining < 2000 && Math.floor(elapsed / 100) % 2 === 0;

        if (!flash) {
            ctx.save();
            ctx.translate(x + cellSize / 2, y + cellSize / 2);
            ctx.scale(pulse, pulse);

            // Glow effect
            ctx.shadowColor = type.color;
            ctx.shadowBlur = 15;

            ctx.font = `${cellSize * 0.8}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(type.symbol, 0, 0);

            ctx.restore();
        }
    }

    reset() {
        this.spawnedPowerUp = null;
        this.activeEffects.forEach((_, type) => {
            this.deactivateEffect(type);
        });
        this.activeEffects.clear();
    }
}

// Global power-up instance
const powerUps = new PowerUpSystem();
