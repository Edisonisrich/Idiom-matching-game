import confetti from 'https://cdn.skypack.dev/canvas-confetti';

// 音效
const SOUNDS = {
    correct: new Audio('https://github.com/Edisonisrich/BGM1/raw/refs/heads/main/13386.mp3'),
    wrong: new Audio('https://github.com/Edisonisrich/BGM1/raw/refs/heads/main/478.mp3'),
    skip: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-click-error-1110.mp3'),
    bgm: new Audio('https://github.com/Edisonisrich/BGM1/raw/refs/heads/main/%E7%84%A1%E6%96%99%E3%83%95%E3%83%AA%E3%83%BCBGM%E5%85%8D%E8%B2%BB%E9%9F%B3%E6%A8%82Original%E5%8E%9F%E5%89%B5%E9%9F%B3%E6%A8%82(%E5%95%86%E7%94%A8%E6%AD%A1%E8%BF%8E%E6%B4%BD%E8%AB%87%E6%8E%88%E6%AC%8A%20327.%E3%81%AE%E3%82%93%E3%81%B3%E3%82%8A%E3%81%97%E3%81%9F%E5%A4%8F%E3%81%AE%E4%BC%91%E6%97%A5.mp3')
};

// 遊戲配置
const CONFIG = {
    initialScore: 1000,
    timeLimit: 30,
    correctBonus: 50,
    wrongPenalty: 100,
    skipPenalty: 30,
    decayRate: 0.5
};

class Game {
    constructor() {
        this.score = CONFIG.initialScore;
        this.timeLeft = CONFIG.timeLimit;
        this.selectedCells = [];
        this.muted = false;
        this.correctAnswersHistory = [];
        this.allIdioms = [];
        this.initializeGame();
    }

    initializeGame() {
        this.setupAudio();
        this.setupGrid();
        this.setupControls();
        this.setupTimer();
        this.showRules();
    }

    setupAudio() {
        SOUNDS.bgm.loop = true;
        SOUNDS.bgm.volume = 0.3;
        SOUNDS.bgm.play();  
        document.getElementById('muteBtn').addEventListener('click', () => this.toggleMute());
    }

    setupGrid() {
        const grid = document.querySelector('.game-grid');
        grid.innerHTML = '';
        
        // 從成語庫中隨機選擇一個成語作為正確答案
        const correctIdiom = idioms[Math.floor(Math.random() * idioms.length)];
        this.currentCorrectIdiom = correctIdiom.join('');
        this.allIdioms.push(this.currentCorrectIdiom);
        
        // 建立一個常用漢字庫，用於填充錯誤選項
        const commonChars = "天地人山水木火土金風雲雨日月星春夏秋冬花鳥魚蟲龍虎豹象馬牛羊鹿鷹鶴鳳凰";
        
        // 建立 4x4 的字符陣列
        let gridChars = Array(16).fill('');
        
        // 隨機選擇四個位置放置正確成語
        let positions = Array.from({length: 16}, (_, i) => i)
            .sort(() => Math.random() - 0.5)
            .slice(0, 4);
            
        // 放置正確成語
        positions.forEach((pos, index) => {
            gridChars[pos] = correctIdiom[index];
        });
        
        // 填充其他位置用隨機漢字
        let remainingPositions = Array.from({length: 16}, (_, i) => i)
            .filter(i => !positions.includes(i));
            
        remainingPositions.forEach(pos => {
            // 從常用漢字中隨機選擇一個字
            gridChars[pos] = commonChars[Math.floor(Math.random() * commonChars.length)];
        });
        
        // 創建格子元素
        gridChars.forEach((char, i) => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.textContent = char;
            cell.dataset.index = i;
            cell.addEventListener('click', () => this.handleCellClick(cell));
            grid.appendChild(cell);
        });
    }

    setupControls() {
        document.getElementById('skipBtn').addEventListener('click', () => this.skipCurrentSet());
        document.getElementById('rulesBtn').addEventListener('click', () => this.showRules());
        document.getElementById('endGameBtn').addEventListener('click', () => this.endGame());
    }

    setupTimer() {
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.score -= CONFIG.decayRate;
            this.updateDisplay();
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    handleCellClick(cell) {
        // If cell is already selected, deselect it
        const index = this.selectedCells.indexOf(cell);
        if (index !== -1) {
            cell.classList.remove('selected');
            this.selectedCells.splice(index, 1);
            return;
        }
        
        // If not already selected, add to selection
        cell.classList.add('selected');
        this.selectedCells.push(cell);
        
        if (this.selectedCells.length === 4) {
            this.checkAnswer();
        }
    }

    checkAnswer() {
        const selectedPhrase = this.selectedCells.map(cell => cell.textContent).join('');
        const isCorrect = this.currentCorrectIdiom === selectedPhrase;
        
        if (isCorrect) {
            this.handleCorrectAnswer();
        } else {
            this.handleWrongAnswer();
        }
        
        setTimeout(() => {
            this.selectedCells.forEach(cell => cell.classList.remove('selected', 'correct', 'wrong'));
            this.selectedCells = [];
            if (isCorrect) {
                this.setupGrid(); // 答對後重新生成新題目
            }
        }, 1000);
    }

    handleCorrectAnswer() {
        this.correctAnswersHistory.push(this.currentCorrectIdiom);

        this.score += CONFIG.correctBonus;
        this.selectedCells.forEach(cell => cell.classList.add('correct'));
        if (!this.muted) {
            SOUNDS.correct.currentTime = 0;
            SOUNDS.correct.play();
        }
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }

    handleWrongAnswer() {
        this.score -= CONFIG.wrongPenalty;
        this.selectedCells.forEach(cell => cell.classList.add('wrong'));
        if (!this.muted) {
            SOUNDS.wrong.currentTime = 0;
            SOUNDS.wrong.play();
        }
        
        // Simply reset and continue to next question
        setTimeout(() => {
            this.selectedCells.forEach(cell => cell.classList.remove('selected', 'wrong'));
            this.selectedCells = [];
            this.setupGrid();
        }, 1000);
    }

    skipCurrentSet() {
        this.score -= CONFIG.skipPenalty;
        if (!this.muted) {
            SOUNDS.skip.currentTime = 0;
            SOUNDS.skip.play();
        }
        this.selectedCells = [];
        this.setupGrid();
    }

    toggleMute() {
        this.muted = !this.muted;
        const muteBtn = document.getElementById('muteBtn');
        muteBtn.textContent = this.muted ? '🔇' : '🔊';
        
        Object.values(SOUNDS).forEach(sound => {
            sound.muted = this.muted;
        });
    }

    updateDisplay() {
        document.getElementById('score').textContent = Math.max(0, Math.floor(this.score));
        document.getElementById('timer').textContent = this.timeLeft;
    }

showRules() {
    this.showModal('遊戲規則', 
        "1. 在 4x4 格子中找出正確的成語。\n\n" +
        "2. 按照順序點選 4 個字。\n\n" +
        `3. 答對加 ${CONFIG.correctBonus} 分，答錯扣 ${CONFIG.wrongPenalty} 分。\n\n` +
        `4. 跳過扣 ${CONFIG.skipPenalty} 分。\n\n` +
        "5. 分數會隨時間慢慢減少。\n\n" +
        "6. 時間到或分數歸零即遊戲結束。"
    );
}


    async endGame() {
        clearInterval(this.timer);
        SOUNDS.bgm.pause();
        
        // Get list of correct answers during the game
        const correctAnswers = this.correctAnswersHistory || [];
        const rank = await this.getGlobalRanking();
        
        let resultsText = `你的最終得分: ${Math.floor(this.score)}\n`;
        resultsText += `全球排名: 前${rank}%\n\n`;
        
        if (correctAnswers.length > 0) {
            resultsText += '已解鎖的成語:\n' + correctAnswers.join('\n');
            resultsText += '\n\n觀看廣告解鎖全部答案！';
        } else {
            resultsText += '這次沒有答對的成語，再接再厲！';
        }
        
        this.showModal('遊戲結束', resultsText, [
            {
                text: '解鎖全部答案',
                action: () => {
                    // Load and show ad
                    const adContainer = document.createElement('ins');
                    adContainer.className = 'adsbygoogle';
                    adContainer.style.display = 'block';
                    adContainer.setAttribute('data-ad-client', 'ca-pub-YOUR_PUBLISHER_ID');
                    adContainer.setAttribute('data-ad-slot', 'YOUR_AD_SLOT_ID');
                    adContainer.setAttribute('data-ad-format', 'auto');
                    
                    const modalContent = document.querySelector('.modal-content');
                    modalContent.appendChild(adContainer);
                    
                    (adsbygoogle = window.adsbygoogle || []).push({
                        callback: () => {
                            // After ad is shown, reveal all answers
                            this.showModal('完整答案', `
                                解鎖成功！\n
                                得分: ${Math.floor(this.score)}\n
                                排名: 前${rank}%\n
                                所有出現的成語:\n${this.allIdioms.join('\n')}
                            `, [{
                                text: '重新開始',
                                action: () => location.reload()
                            }]);
                        }
                    });
                }
            },
            {text: '分享', action: () => this.shareScore(rank)},
            {text: '重新開始', action: () => location.reload()}
        ]);
    }

    async getGlobalRanking() {
        // 模擬排名計算
        return Math.floor(Math.random() * 100);
    }

    shareScore(rank) {
        const text = `我在成語連線遊戲中獲得 ${Math.floor(this.score)} 分，排名全球前 ${rank}%！快來挑戰！`;
        const url = window.location.href;
        
        // First try Web Share API
        if (navigator.share) {
            navigator.share({
                title: '成語連線遊戲',
                text: text,
                url: url,
            }).catch(() => this.showSocialShareDialog(text, url));
        } else {
            this.showSocialShareDialog(text, url);
        }
    }

    async generateInstagramShareImage(score, rank) {
        const canvas = document.createElement('canvas');
        canvas.width = 1080; // Instagram post width
        canvas.height = 1080; // Instagram post height
        const ctx = canvas.getContext('2d');

        // Fill background
        ctx.fillStyle = '#FFF8E1'; // Use your background color
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add text
        ctx.font = 'bold 96px sans-serif';
        ctx.fillStyle = '#5D4037'; // Use your text color
        ctx.textAlign = 'center';
        ctx.fillText(`我獲得 ${Math.floor(score)} 分！`, canvas.width / 2, canvas.height / 2 - 50);
        ctx.font = '64px sans-serif';
        ctx.fillText(`全球排名: 前 ${rank}%`, canvas.width / 2, canvas.height / 2 + 50);

        // Convert canvas to data URL
        return canvas.toDataURL('image/png');
    }

    showSocialShareDialog(text, url) {
        this.getGlobalRanking().then(rank => {
            const encodedText = encodeURIComponent(text);
            const encodedUrl = encodeURIComponent(url);
        
            this.generateInstagramShareImage(this.score, rank).then(imageData => {
                const shareLinks = {
                    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
                    instagram: `https://www.instagram.com/`, // Instagram does not support direct sharing with text
                    line: `https://line.me/R/share?text=${encodedText}%0D%0A${encodedUrl}`
                };

                this.showModal('分享成績', '', [
                    {
                        text: 'Facebook',
                        action: () => window.open(shareLinks.facebook, '_blank')
                    },
                    {
                        text: 'Instagram',
                        action: async () => {
                            const link = document.createElement('a');
                            link.href = imageData;
                            link.download = 'idiom_game_score.png'; // Suggest a filename
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);

                            this.showModal("提示", "圖片已下載，請手動上傳至 Instagram");
                        }
                    },
                    {
                        text: 'Line',
                        action: () => window.open(shareLinks.line, '_blank')
                    }
                ]);
            });
        });
    }

    showModal(title, text, buttons = [{text: '確定', action: () => this.hideModal()}]) {
        const modal = document.getElementById('modal');
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-text').textContent = text;
        
        const buttonContainer = document.getElementById('modal-buttons');
        buttonContainer.innerHTML = '';
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.textContent = btn.text;
            button.onclick = btn.action;
            buttonContainer.appendChild(button);
        });
        
        modal.style.display = 'flex';
    }

    hideModal() {
        document.getElementById('modal').style.display = 'none';
    }
}

const idioms = [
    ["畫", "蛇", "添", "足"], ["亡", "羊", "補", "牢"], ["井", "底", "之", "蛙"], ["對", "牛", "彈", "琴"],
    ["畫", "龍", "點", "睛"], ["掩", "耳", "盜", "鈴"], ["刻", "舟", "求", "劍"], ["杯", "弓", "蛇", "影"],
    ["一", "箭", "雙", "雕"], ["指", "鹿", "為", "馬"], ["自", "相", "矛", "盾"], ["東", "施", "效", "顰"],
    ["人", "山", "人", "海"], ["滄", "海", "桑", "田"], ["一", "帆", "風", "順"], ["五", "光", "十", "色"],
    ["三", "心", "二", "意"], ["四", "面", "楚", "歌"], ["青", "出", "於", "藍"], ["千", "軍", "萬", "馬"],
    ["投", "桃", "報", "李"], ["望", "梅", "止", "渴"], ["鴻", "門", "宴", "會"], ["亡", "命", "之", "徒"],
    ["臨", "渴", "掘", "井"], ["捨", "本", "逐", "末"], ["知", "己", "知", "彼"], ["驚", "弓", "之", "鳥"],
    ["樂", "不", "思", "蜀"], ["畫", "地", "為", "牢"], ["暗", "度", "陳", "倉"], ["毛", "遂", "自", "薦"],
    ["唇", "亡", "齒", "寒"], ["百", "發", "百", "中"], ["四", "通", "八", "達"], ["語", "重", "心", "長"],
    ["無", "中", "生", "有"], ["見", "風", "轉", "舵"], ["好", "事", "多", "磨"], ["守", "株", "待", "兔"]
];

// 啟動遊戲
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
