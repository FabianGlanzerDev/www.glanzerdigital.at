/**
 * Stores the size and object layout of the current game level.
 */
class Level {
    width = 12000;
    cameraAnchorX = 620;

    caveCollisionBoxes = [
        { x: 0, y: 0, width: 211, height: 315 },
        { x: 0, y: 881, width: 211, height: 199 },
        { x: 211, y: 0, width: 211, height: 313 },
        { x: 211, y: 837, width: 211, height: 243 },
        { x: 422, y: 0, width: 211, height: 253 },
        { x: 422, y: 809, width: 211, height: 271 },
        { x: 633, y: 0, width: 211, height: 304 },
        { x: 633, y: 787, width: 211, height: 293 },
        { x: 844, y: 0, width: 211, height: 260 },
        { x: 844, y: 784, width: 211, height: 296 },
        { x: 1055, y: 0, width: 211, height: 420 },
        { x: 1055, y: 798, width: 211, height: 282 },
        { x: 1266, y: 0, width: 211, height: 419 },
        { x: 1266, y: 810, width: 211, height: 270 },
        { x: 1477, y: 0, width: 205, height: 326 },
        { x: 1477, y: 843, width: 205, height: 237 }
    ];

    rockCollisionBoxes = [
        { x: 250, y: 235, width: 1056, height: 414 }
    ];

    pillarCollisionBoxes = [
        { x: 116, y: 58, width: 232, height: 744 }
    ];

    coinPositions = [
        [1100, 250], [2100, 650], [3450, 500], [4550, 700], [5550, 240],
        [6650, 650], [7800, 260], [8500, 360], [9250, 300], [9850, 600]
    ];

    bubbleEnergyPositions = [
        [1500, 500], [2750, 260], [3900, 560], [5350, 650],
        [7000, 320], [8650, 620], [9700, 360]
    ];

    enemies = [
        new PufferFish(2200, 560),
        new JellyFish(5450, 520),
        new PufferFish(6800, 500),
        new JellyFish(8500, 340),
        new PufferFish(9700, 560)
    ];

    ambientFish = [
        new AmbientFish(1250, 340, 'coral', 90, 0.65),
        new AmbientFish(3000, 180, 'red', 78, 0.7),
        new AmbientFish(5050, 210, 'coral', 92, 0.55),
        new AmbientFish(5300, 290, 'red', 70, 0.62),
        new AmbientFish(6200, 660, 'red', 76, 0.6),
        new AmbientFish(7450, 180, 'coral', 84, 0.7),
        new AmbientFish(8950, 230, 'red', 88, 0.65),
        new AmbientFish(10100, 500, 'coral', 78, 0.55)
    ];

    endboss = new Endboss(11200, 210);
    obstacles;
    coins;
    bubbleEnergies;
    collectibles;

    /**
     * Creates all objects placed inside the level.
     */
    constructor() {
        this.obstacles = this.createObstacles();
        this.coins = this.createCoins();
        this.bubbleEnergies = this.createBubbleEnergies();
        this.collectibles = [...this.coins, ...this.bubbleEnergies];
    }

    /**
     * Creates only clearly visible solid barriers.
     * Background corals remain decorative and can be crossed.
     * @returns {Obstacle[]} Obstacles placed inside the game world.
     */
    createObstacles() {
        return [
            new Obstacle('assets/images/obstacles/cave-tunnel.png',
                3200, 0, 1682, 1080, this.caveCollisionBoxes),
            new Obstacle('assets/images/obstacles/rock-pillar.png',
                6000, -90, 441, 906, this.pillarCollisionBoxes),
            new Obstacle('assets/images/obstacles/rock-mass.png',
                7900, 500, 1415, 649, this.rockCollisionBoxes)
        ];
    }

    /**
     * Creates coins from the configured world positions.
     * @returns {Coin[]} Coins placed throughout the level.
     */
    createCoins() {
        return this.coinPositions.map(([x, y]) => new Coin(x, y));
    }

    /**
     * Creates bubble energy pickups from configured world positions.
     * @returns {BubbleEnergy[]} Energy pickups placed throughout the level.
     */
    createBubbleEnergies() {
        return this.bubbleEnergyPositions.map(([x, y]) => new BubbleEnergy(x, y));
    }
}
