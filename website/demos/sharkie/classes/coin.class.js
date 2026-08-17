const coinImages = [
    'assets/images/collectibles/coins/coin-01.png',
    'assets/images/collectibles/coins/coin-02.png',
    'assets/images/collectibles/coins/coin-03.png',
    'assets/images/collectibles/coins/coin-04.png'
];

/**
 * Represents an animated coin collectible.
 */
class Coin extends CollectibleObject {
    width = 105;
    height = 100;
    frameDelay = 110;
    offset = { top: 12, right: 12, bottom: 12, left: 12 };

    /**
     * Creates a coin at the requested world position.
     * @param {number} worldX Horizontal world position.
     * @param {number} y Vertical canvas position.
     */
    constructor(worldX, y) {
        super(coinImages, worldX, y, 'coin');
    }
}
