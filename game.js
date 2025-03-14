import confetti from 'https://cdn.skypack.dev/canvas-confetti';

class Game {
    constructor() {
        this.score = 1000;
        this.timeLeft = 60;
        this.initializeGame();
    }

    initializeGame() {
        this.setupGrid();
        this.setupControls();
    }

    setupGrid() {
        const grid = document.querySelector('.game-grid');
        grid.innerHTML = '<p>遊戲開始！</p>';
    }

    setupControls() {
        document.getElementById('rulesBtn').addEventListener('click', () => this.showRules());
    }

    showRules() {
        alert('遊戲規則：找到正確的成語組合！');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
