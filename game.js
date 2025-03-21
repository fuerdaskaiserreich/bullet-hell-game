const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    audio: {
        disableWebAudio: true
    }
};

const game = new Phaser.Game(config);

let player, bullets, enemies, enemyBullets, killCounter, lives, lifeBar, gameOverText;

function preload() {
    this.load.image('ship', 'assets/ship.png');
    this.load.image('bullet', 'assets/bullet.png');
    this.load.image('enemy', 'assets/enemy.png');
    this.load.image('enemyBullet', 'assets/enemyBullet.png');
}

function create() {
    player = this.physics.add.sprite(400, 500, 'ship').setOrigin(0.5, 0.5);
    player.setCollideWorldBounds(true);

    bullets = this.physics.add.group();
    enemies = this.physics.add.group();
    enemyBullets = this.physics.add.group();

    spawnEnemies.call(this);

    this.time.addEvent({
        delay: 2000,
        callback: shootEnemyPattern,
        callbackScope: this,
        loop: true
    });

    this.time.addEvent({
        delay: 10000, // 10 seconds
        callback: spawnEnemies,
        callbackScope: this,
        loop: true
    });

    this.physics.add.overlap(player, enemyBullets, hitPlayer, null, this);
    this.physics.add.overlap(bullets, enemies, hitEnemy, null, this);

    // Kill counter
    killCounter = 0;
    this.killText = this.add.text(10, 10, 'Kills: 0', { fontSize: '20px', color: '#ffffff' });

    // Lives and life bar
    lives = 3;
    this.livesText = this.add.text(10, 40, 'Lives: 3', { fontSize: '20px', color: '#ffffff' });
    lifeBar = this.add.rectangle(100, 50, 90, 10, 0x00ff00); // Green bar, 30px per life
    lifeBar.setOrigin(0, 0.5); // Align left

    // Game over text (hidden initially)
    gameOverText = this.add.text(400, 300, 'Game Over!\nClick to Restart', {
        fontSize: '40px',
        color: '#ff0000',
        align: 'center'
    }).setOrigin(0.5).setVisible(false);
}

function update(time) {
    if (lives > 0) { // Only update if game isn't over
        player.x = this.input.x;
        player.y = this.input.y;

        if (this.input.activePointer.isDown) {
            let bullet = bullets.create(player.x, player.y - 20, 'bullet');
            bullet.setVelocityY(-400);
        }

        enemies.getChildren().forEach(enemy => {
            enemy.x = enemy.originalX + Math.sin(time * 0.001) * 100;
            if (enemy.y < 450) {
                enemy.y += 0.5;
            }
        });
    }

    // Restart on click if game over
    if (lives <= 0 && this.input.activePointer.isDown) {
        restartGame.call(this);
    }
}

function spawnEnemies() {
    for (let i = 0; i < 3; i++) {
        let x = 200 + i * 200;
        let enemy = enemies.create(x, 100, 'enemy').setOrigin(0.5, 0.5);
        enemy.setCollideWorldBounds(true);
        enemy.originalX = x;
    }
}

function shootEnemyPattern() {
    enemies.getChildren().forEach(enemy => {
        for (let angle = -30; angle <= 30; angle += 30) {
            let rad = Phaser.Math.DegToRad(angle);
            let bullet = enemyBullets.create(enemy.x, enemy.y, 'enemyBullet');
            bullet.setVelocity(200 * Math.sin(rad), 200 * Math.cos(rad));
        }
    });
}

function hitPlayer(player, bullet) {
    bullet.destroy();
    if (lives > 0) { // Only reduce lives if not already game over
        lives--;
        this.livesText.setText(`Lives: ${lives}`);
        lifeBar.width = lives * 30; // Shrink bar (30px per life)
        lifeBar.setFillStyle(lives > 1 ? 0x00ff00 : 0xff0000); // Green to red
        console.log(`Player hit! Lives left: ${lives}`);

        if (lives <= 0) {
            gameOver.call(this);
        }
    }
}

function hitEnemy(bullet, enemy) {
    bullet.destroy();
    enemy.destroy();
    killCounter++;
    this.killText.setText(`Kills: ${killCounter}`);
    console.log("Enemy destroyed!");
}

function gameOver() {
    gameOverText.setVisible(true);
    player.setVisible(false); // Hide player
    enemies.clear(true, true); // Remove all enemies
    enemyBullets.clear(true, true); // Remove enemy bullets
    bullets.clear(true, true); // Remove player bullets
}

function restartGame() {
    lives = 3;
    killCounter = 0;
    this.livesText.setText(`Lives: ${lives}`);
    this.killText.setText(`Kills: ${killCounter}`);
    lifeBar.width = 90;
    lifeBar.setFillStyle(0x00ff00);
    gameOverText.setVisible(false);
    player.setVisible(true);
    player.setPosition(400, 500);
    spawnEnemies.call(this);
}
