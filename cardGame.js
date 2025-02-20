// 定义牌的颜色
const COLORS = ['red', 'yellow', 'blue', 'black'];

// 生成牌库
function generateDeck() {
    const deck = [];
    for (let color of COLORS) {
        for (let number = 1; number <= 13; number++) {
            deck.push({ color, number });
            deck.push({ color, number }); // 每个数字牌有2张
        }
    }
    return deck;
}

// 洗牌函数
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// 发牌函数
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
    
    // 对每个颜色组内的牌按数字排序
    for (let color in groups) {
        groups[color].sort((a, b) => a.number - b.number);
    }
    
    return groups;
}

// 查找顺子
function findStraights(cards, minLength = 3) {
    const straights = [];
    const len = cards.length;
    
    for (let i = 0; i < len; i++) {
        for (let j = i + minLength - 1; j < len; j++) {
            const sequence = cards.slice(i, j + 1);
            if (isValidStraight(sequence)) {
                straights.push({
                    type: 'straight',
                    cards: sequence,
                    score: calculateScore(sequence)
                });
            }
        }
    }
    
    return straights;
}

// 检查是否为有效顺子
function isValidStraight(cards) {
    if (cards.length < 3) return false;
    
    for (let i = 1; i < cards.length; i++) {
        if (cards[i].number !== cards[i-1].number + 1) {
            return false;
        }
    }
    return true;
}

// 查找相同数字组合
function findSameNumberGroups(cards) {
    const numberGroups = {};
    const combinations = [];
    const maxSameNumberGroups = 4; // 限制刻子牌的最大组合数量
    
    // 统计每个数字的出现次数和对应的牌
    cards.forEach(card => {
        if (!numberGroups[card.number]) {
            numberGroups[card.number] = [];
        }
        numberGroups[card.number].push(card);
    });
    
    // 找出所有3张或4张相同数字的组合
    let sameNumberGroupCount = 0;
    for (let number in numberGroups) {
        if (sameNumberGroupCount >= maxSameNumberGroups) break; // 如果达到最大限制，停止添加新的组合
        
        const group = numberGroups[number];
        if (group.length >= 3) {
            // 如果是4张牌，检查颜色是否都不相同
            if (group.length === 4) {
                const colors = new Set(group.map(card => card.color));
                if (colors.size !== 4) continue; // 如果有重复颜色，跳过这个组合
            }
            
            combinations.push({
                type: 'same_number',
                cards: group,
                score: calculateScore(group)
            });
            sameNumberGroupCount++; // 增加计数器
        }
    }
    
    return combinations;
}

// 计算组合分数
function calculateScore(cards) {
    return cards.reduce((sum, card) => sum + card.number, 0);
}

// 选择最优组合
function findBestCombinations(cards) {
    const colorGroups = groupCardsByColor(cards);
    let allCombinations = [];
    
    // 查找所有颜色的顺子
    for (let color in colorGroups) {
        const straights = findStraights(colorGroups[color]);
        allCombinations = allCombinations.concat(straights);
    }
    
    // 查找相同数字组合
    const sameNumberGroups = findSameNumberGroups(cards);
    allCombinations = allCombinations.concat(sameNumberGroups);
    
    // 按分数排序
    allCombinations.sort((a, b) => b.score - a.score);
    
    // 选择不重叠的最优组合
    const selectedCombinations = [];
    const usedCards = new Set();
    
    for (let combination of allCombinations) {
        const cards = combination.cards;
        let canUse = true;
        
        // 检查是否有重叠的牌
        for (let card of cards) {
            const cardKey = `${card.color}-${card.number}`;
            if (usedCards.has(cardKey)) {
                canUse = false;
                break;
            }
        }
        
        if (canUse) {
            selectedCombinations.push(combination);
            cards.forEach(card => {
                usedCards.add(`${card.color}-${card.number}`);
            });
        }
    }
    
    // 收集未使用的牌
    const unusedCards = cards.filter(card => {
        const cardKey = `${card.color}-${card.number}`;
        return !usedCards.has(cardKey);
    });
    
    // 计算总分
    const totalScore = selectedCombinations.reduce((sum, combo) => sum + combo.score, 0);
    
    return {
        combinations: selectedCombinations,
        unusedCards: unusedCards,
        totalScore: totalScore
    };
}

// 渲染牌
function renderCard(card) {
    const cardElement = document.createElement('div');
    cardElement.className = `card ${card.color}`;
    cardElement.textContent = card.number;
    return cardElement;
}

// 渲染组合
function renderCombination(combination) {
    const container = document.createElement('div');
    container.className = 'combination';
    
    combination.cards.forEach(card => {
        container.appendChild(renderCard(card));
    });
    
    // 添加组合分数显示
    const scoreElement = document.createElement('span');
    scoreElement.className = 'score';
    scoreElement.textContent = `分数: ${combination.score}`;
    container.appendChild(scoreElement);
    
    return container;
}

// 渲染手牌区域
function renderHandCards(cards) {
    const handCardsElement = document.getElementById('handCards');
    handCardsElement.innerHTML = '';
    
    // 按数字分组
    const numberGroups = {};
    cards.forEach(card => {
        if (!numberGroups[card.number]) {
            numberGroups[card.number] = [];
        }
        numberGroups[card.number].push(card);
    });
    
    // 按数字大小排序并渲染
    Object.keys(numberGroups)
        .sort((a, b) => Number(a) - Number(b))
        .forEach(number => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'number-group';
            numberGroups[number].forEach(card => {
                groupDiv.appendChild(renderCard(card));
            });
            handCardsElement.appendChild(groupDiv);
        });
}

// 开始游戏
function startGame() {
    // 清空现有显示
    document.getElementById('handCards').innerHTML = '';
    document.getElementById('combinations').innerHTML = '';
    
    // 生成并洗牌
    const deck = shuffleDeck(generateDeck());
    
    // 发牌
    const handCards = dealCards(deck, 21);
    
    // 显示手牌
    renderHandCards(handCards);
    
    // 找出最优组合并显示
    const result = findBestCombinations(handCards);
    
    // 显示组合
    result.combinations.forEach(combination => {
        document.getElementById('combinations').appendChild(renderCombination(combination));
    });
    
    // 显示未使用的牌
    if (result.unusedCards.length > 0) {
        const unusedContainer = document.createElement('div');
        unusedContainer.className = 'combination unused-cards';
        const unusedTitle = document.createElement('div');
        unusedTitle.className = 'unused-title';
        unusedTitle.textContent = '未使用的牌:';
        unusedContainer.appendChild(unusedTitle);
        
        result.unusedCards.forEach(card => {
            unusedContainer.appendChild(renderCard(card));
        });
        
        document.getElementById('combinations').appendChild(unusedContainer);
    }
    
    // 显示总分
    const totalScoreContainer = document.createElement('div');
    totalScoreContainer.className = 'total-score';
    totalScoreContainer.textContent = `总分: ${result.totalScore}`;
    document.getElementById('combinations').appendChild(totalScoreContainer);
}