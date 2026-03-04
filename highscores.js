/* ========================================
   🏆 High Score System
   Top 10 with 3-letter initials
======================================== */

class HighScoreSystem {
    constructor(storageKey = 'snake_highscores') {
        this.storageKey = storageKey;
        this.maxScores = 10;
        this.scores = this.load();
    }

    load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.warn('Failed to load high scores:', e);
            return [];
        }
    }

    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.scores));
        } catch (e) {
            console.warn('Failed to save high scores:', e);
        }
    }

    isHighScore(score) {
        if (this.scores.length < this.maxScores) return true;
        return score > this.scores[this.scores.length - 1].score;
    }

    addScore(initials, score) {
        const entry = {
            initials: initials.toUpperCase().substring(0, 3),
            score: score,
            date: new Date().toISOString()
        };

        this.scores.push(entry);
        this.scores.sort((a, b) => b.score - a.score);
        this.scores = this.scores.slice(0, this.maxScores);
        this.save();

        return this.scores.indexOf(entry) + 1;
    }

    getScores() {
        return [...this.scores];
    }

    getTopScore() {
        return this.scores.length > 0 ? this.scores[0].score : 0;
    }

    getRank(score) {
        for (let i = 0; i < this.scores.length; i++) {
            if (score > this.scores[i].score) return i + 1;
        }
        return this.scores.length + 1;
    }

    clear() {
        this.scores = [];
        this.save();
    }

    // Render high score table HTML
    renderTable() {
        if (this.scores.length === 0) {
            return '<div class="no-scores">NO SCORES YET</div>';
        }

        let html = '<div class="highscore-table">';
        this.scores.forEach((entry, index) => {
            const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            html += `
                <div class="highscore-row">
                    <span class="rank">${rankEmoji}${index + 1}.</span>
                    <span class="initials">${entry.initials}</span>
                    <span class="hs-score">${entry.score.toLocaleString()}</span>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    // Render initial entry form
    renderEntryForm(score, onSubmit) {
        const container = document.createElement('div');
        container.className = 'highscore-entry';
        container.innerHTML = `
            <h3>🎉 NEW HIGH SCORE! 🎉</h3>
            <p style="font-size: 0.5rem; color: var(--neon-yellow); margin-bottom: 15px;">
                SCORE: ${score.toLocaleString()}
            </p>
            <p style="font-size: 0.5rem; margin-bottom: 10px;">ENTER YOUR INITIALS:</p>
            <div class="initial-input">
                <input type="text" class="initial-char" maxlength="1" data-index="0" autocomplete="off">
                <input type="text" class="initial-char" maxlength="1" data-index="1" autocomplete="off">
                <input type="text" class="initial-char" maxlength="1" data-index="2" autocomplete="off">
            </div>
        `;

        const inputs = container.querySelectorAll('.initial-char');

        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const value = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
                e.target.value = value;

                if (value && index < 2) {
                    inputs[index + 1].focus();
                }

                // Check if all filled
                const initials = Array.from(inputs).map(i => i.value).join('');
                if (initials.length === 3) {
                    setTimeout(() => {
                        if (typeof audio !== 'undefined') audio.playSelect();
                        onSubmit(initials);
                    }, 200);
                }
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    inputs[index - 1].focus();
                }
                if (typeof audio !== 'undefined' && e.key.length === 1) {
                    audio.playNavigate();
                }
            });
        });

        // Focus first input
        setTimeout(() => inputs[0].focus(), 100);

        return container;
    }
}

// Global high score instance
const highScores = new HighScoreSystem();
