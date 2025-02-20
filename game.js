// 定义牌的颜色和数字范围
const COLORS = ['red', 'yellow', 'blue', 'black'];
const NUMBERS = Array.from({length: 13}, (_, i) => i + 1);

// 生成完整牌库
function generateDeck() {
    const deck = [];
    for (const color of COLORS) {
        for (const number of NUMBERS) {
            // 每个数字每种颜色生成两张牌
            deck.push({ color, number });
            deck.push({ color, number });
        }
    }
    return deck;
}

// 随机洗牌
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// 发牌
function dealCards(deck, count) {
    return deck.slice(0, count);
}

// 按颜色分组
function groupCardsByColor(cards) {
    const groups = {};
    COLORS.forEach(color => groups[color] = []);
    
    cards.forEach(card => {
        groups[card.color].push(card);
    });
    
    // 每组内按数字排序
    for (const color in groups) {
        groups[color].sort((a, b) => a.number - b.number);
    }
    
    return groups;
}

// 寻找顺子
function findStraights(cards) {
    const straights = [];
    if (cards.length < 3) return straights;
    
    let start = 0;
    for (let i = 1; i <= cards.length; i++) {
        if (i === cards.length || cards[i].number !== cards[i-1].number + 1) {
            if (i - start >= 3) {
                const straight = cards.slice(start, i);
                const score = straight.reduce((sum, card) => sum + card.number, 0);
                straights.push({ cards: straight, score, type: 'straight' });
            }
            start = i;
        }
    }
    
    return straights;
}

// 寻找刻子（相同数字的组合）
function findSets(cards) {
    const numberGroups = {};
    cards.forEach(card => {
        if (!numberGroups[card.number]) {
            numberGroups[card.number] = [];
        }
        numberGroups[card.number].push(card);
    });
    
    const sets = [];
    for (const number in numberGroups) {
        const group = numberGroups[number];
        if (group.length >= 3) {
            // 如果超过4张牌，需要分组
            while (group.length >= 3) {
                const setCards = group.splice(0, Math.min(4, group.length));
                const score = setCards.length * Number(number);
                sets.push({ cards: setCards, score, type: 'set' });
            }
        }
    }
    
    return sets;
}

// 寻找最优组合
function findBestCombinations(cards) {
    const colorGroups = groupCardsByColor(cards);
    let allCombinations = [];
    
    // 收集所有顺子
    for (const color in colorGroups) {
        const straights = findStraights(colorGroups[color]);
        allCombinations = allCombinations.concat(straights);
    }
    
    // 收集所有刻子
    const sets = findSets(cards);
    allCombinations = allCombinations.concat(sets);
    
    // 按分数排序
    allCombinations.sort((a, b) => b.score - a.score);
    
    // 选择最优组合
    const selectedCombinations = [];
    const usedCards = new Set();
    
    for (const combo of allCombinations) {
        const comboCards = combo.cards;
        const isAvailable = comboCards.every(card => 
            !usedCards.has(`${card.color}-${card.number}`));
        
        if (isAvailable) {
            selectedCombinations.push(combo);
            comboCards.forEach(card => 
                usedCards.add(`${card.color}-${card.number}`));
        }
    }
    
    // 添加散牌
    const remainingCards = cards.filter(card => 
        !usedCards.has(`${card.color}-${card.number}`));
    if (remainingCards.length > 0) {
        selectedCombinations.push({
            cards: remainingCards,
            score: remainingCards.reduce((sum, card) => sum + card.number, 0),
            type: 'remaining'
        });
    }
    
    return selectedCombinations;
}

// 创建卡片DOM元素
function createCardElement(card) {
    const cardElement = document.createElement('div');
    cardElement.className = `card ${card.color}`;
    cardElement.textContent = card.number;
    return cardElement;
}

// 创建组合DOM元素
function createCombinationElement(combination) {
    const comboElement = document.createElement('div');
    comboElement.className = `combination ${combination.type}`;
    
    // 添加组合类型和分数标签
    const labelElement = document.createElement('div');
    labelElement.className = 'combo-label';
    const typeText = combination.type === 'straight' ? '顺子' : 
                     combination.type === 'set' ? '刻子' : '散牌';
    labelElement.textContent = `${typeText} (总分: ${combination.score})`;
    comboElement.appendChild(labelElement);
    
    // 添加卡片
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'combo-cards';
    combination.cards.forEach(card => {
        cardsContainer.appendChild(createCardElement(card));
    });
    comboElement.appendChild(cardsContainer);
    
    return comboElement;
}

// 更新界面显示
function updateDisplay(handCards, combinations) {
    const handCardsContainer = document.getElementById('hand-cards');
    const combinationsContainer = document.getElementById('best-combinations');
    
    // 清空容器
    handCardsContainer.innerHTML = '';
    combinationsContainer.innerHTML = '';
    
    // 显示手牌
    handCards.forEach(card => {
        handCardsContainer.appendChild(createCardElement(card));
    });
    
    // 显示组合
    combinations.forEach(combo => {
        combinationsContainer.appendChild(createCombinationElement(combo));
    });
}

// 检查组合是否满足条件
function checkCombinations(combinations) {
    let hasStraight = false;
    let hasSet = false;
    
    for (const combo of combinations) {
        if (combo.type === 'straight') hasStraight = true;
        if (combo.type === 'set') hasSet = true;
        if (hasStraight && hasSet) return true;
    }
    return false;
}

// 初始化游戏
function initGame() {
    const dealButton = document.getElementById('deal-button');
    let deck = generateDeck();
    
    dealButton.addEventListener('click', () => {
        let handCards, bestCombinations;
        do {
            // 重新洗牌并发牌
            deck = shuffleDeck(generateDeck());
            handCards = dealCards(deck, 21);
            bestCombinations = findBestCombinations(handCards);
        } while (!checkCombinations(bestCombinations));
        
        // 更新显示
        updateDisplay(handCards, bestCombinations);
    });
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', initGame);