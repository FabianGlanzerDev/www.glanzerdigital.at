/** @file Creates shared game objects, UI references and round state. */

const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');
const keyboard = new Keyboard();
const audioManager = new AudioManager();
const level = new Level();
const sharkie = new Character(keyboard, level.width, audioManager);
const healthBar = new StatusBar();
const bossStatusBar = new BossStatusBar();
const enemies = level.enemies;
const endboss = level.endboss;
const obstacles = level.obstacles;
const coins = level.coins;
const bubbleEnergies = level.bubbleEnergies;
const collectibles = level.collectibles;

sharkie.setObstacles(obstacles);


const coinCounter = new CollectibleCounter(
    'assets/images/collectibles/coins/coin-01.png', 1630, 112, 'Coins', coins.length
);
const bubbleEnergyCounter = new CollectibleCounter(
    'assets/images/collectibles/bubble-energy/bubble-energy.png', 1630, 198,
    'Bubble Energy', sharkie.maxBubbleEnergy
);


let projectiles = [];
let gameState = 'home';
let gameOverTimer = null;
let winTimer = null;


const gameShell = document.getElementById('gameShell');
const startScreen = document.getElementById('startScreen');
const controlsScreen = document.getElementById('controlsScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const winScreen = document.getElementById('winScreen');
const gameHud = document.getElementById('gameHud');
const mobileControls = document.getElementById('mobileControls');


const startButton = document.getElementById('startButton');
const continueButton = document.getElementById('continueButton');
const controlsCloseButton = document.getElementById('controlsCloseButton');
const restartButton = document.getElementById('restartButton');
const homeButton = document.getElementById('homeButton');
const winRestartButton = document.getElementById('winRestartButton');
const winHomeButton = document.getElementById('winHomeButton');
const muteButton = document.getElementById('muteButton');
const fullscreenButton = document.getElementById('fullscreenButton');


const backgroundLayers = [
    new BackgroundObject('assets/images/backgrounds/layers/water.png', 0.05),
    new BackgroundObject('assets/images/backgrounds/layers/far-background.png', 0.15),
    new BackgroundObject('assets/images/backgrounds/layers/middle-background.png', 0.3),
    new BackgroundObject('assets/images/backgrounds/layers/floor.png', 0.55)
];
const lightLayer = new BackgroundObject('assets/images/backgrounds/layers/light.png', 0.1);
