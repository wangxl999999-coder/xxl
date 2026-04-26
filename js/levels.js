const LEVELS = [
    {
        id: 1,
        name: "入门",
        moves: 20,
        rows: 6,
        cols: 6,
        target: 500,
        types: 5,
        goal: "达到500分"
    },
    {
        id: 2,
        name: "初试",
        moves: 18,
        rows: 6,
        cols: 6,
        target: 800,
        types: 5,
        goal: "达到800分"
    },
    {
        id: 3,
        name: "进阶",
        moves: 15,
        rows: 6,
        cols: 6,
        target: 1000,
        types: 6,
        goal: "达到1000分"
    },
    {
        id: 4,
        name: "挑战",
        moves: 14,
        rows: 7,
        cols: 6,
        target: 1200,
        types: 6,
        goal: "达到1200分"
    },
    {
        id: 5,
        name: "高手",
        moves: 12,
        rows: 7,
        cols: 7,
        target: 1500,
        types: 6,
        goal: "达到1500分"
    },
    {
        id: 6,
        name: "精英",
        moves: 10,
        rows: 7,
        cols: 7,
        target: 1800,
        types: 7,
        goal: "达到1800分"
    },
    {
        id: 7,
        name: "大师",
        moves: 9,
        rows: 8,
        cols: 7,
        target: 2000,
        types: 7,
        goal: "达到2000分"
    },
    {
        id: 8,
        name: "宗师",
        moves: 8,
        rows: 8,
        cols: 8,
        target: 2500,
        types: 7,
        goal: "达到2500分"
    },
    {
        id: 9,
        name: "传说",
        moves: 7,
        rows: 8,
        cols: 8,
        target: 3000,
        types: 7,
        goal: "达到3000分"
    },
    {
        id: 10,
        name: "神话",
        moves: 6,
        rows: 8,
        cols: 8,
        target: 3500,
        types: 7,
        goal: "达到3500分"
    },
    {
        id: 11,
        name: "至尊",
        moves: 5,
        rows: 8,
        cols: 8,
        target: 4000,
        types: 7,
        goal: "达到4000分"
    },
    {
        id: 12,
        name: "巅峰",
        moves: 5,
        rows: 9,
        cols: 9,
        target: 4500,
        types: 7,
        goal: "达到4500分"
    }
];

const TILE_EMOJIS = [
    '🔴',
    '🔵',
    '🟡',
    '🟢',
    '🟣',
    '🟠',
    '⚪'
];

const TILE_COLORS = [
    'type-0',
    'type-1',
    'type-2',
    'type-3',
    'type-4',
    'type-5',
    'type-6'
];

function getLevel(id) {
    return LEVELS.find(l => l.id === id) || LEVELS[0];
}

function getTotalLevels() {
    return LEVELS.length;
}
