class RocketPocketGame {
    debug: boolean = false;
    accelerationX: number = 200;
    accelerationY: number = 400;
    fuelDefault: number = 500;
    fuelLabel: string = 'Combustível';
    gameOverLabel: string = 'Você perdeu!';
    victoryLabel: string = 'Você conseguiu!';

    fuel: number = this.fuelDefault;
    playingSound: boolean = false;
    ended: boolean = false;
    game: Phaser.Game;
    cursors: Phaser.CursorKeys;
    rocket: Phaser.Sprite;
    explosion: Phaser.Sprite;
    rocketAudio: Phaser.AudioSprite;
    rocketExplosion: Phaser.AudioSprite;
    fuelText: Phaser.Text;
    background: Phaser.TileSprite;
    ground: Phaser.Polygon;
    graphics: Phaser.Graphics;
    introText: Phaser.Text;
    restartButton: Phaser.Button;

    constructor() {
        this.game = new Phaser.Game(800, 600, Phaser.AUTO, 'content', {
            preload: this.preload.bind(this),
            create: this.create.bind(this),
            update: this.update.bind(this),
            render: this.render.bind(this)
        });
    }

    preload() {
        this.game.load.spritesheet('rocket', 'img/rocket.png', 50, 75, 3);
        this.game.load.spritesheet('explosion', 'img/explosion.png', 64, 64, 23);
        this.game.load.spritesheet('restart-button', 'img/restart-button.png', 96, 40);

        this.game.load.image('background', 'img/lunar-background.png');

        this.game.load.audio('rocket-audio', ['audio/rocket-launch.mp3']);
        this.game.load.audio('rocket-explosion', ['audio/rocket-explosion.mp3']);
    }

    create() {
        this.game.stage.backgroundColor = '#2d2d2d';
        this.game.physics.startSystem(Phaser.Physics.ARCADE);

        this.cursors = this.game.input.keyboard.createCursorKeys();

        this.background = this.game.add.tileSprite(0, 0, 800, 600, 'background');
        this.background.fixedToCamera = true;
        this.game.world.setBounds(0, 0, 2000, 600);

        this.rocketAudio = this.game.add.audio('rocket-audio', 1, true);
        this.rocketAudio.allowMultiple = false;
        this.rocketAudio.addMarker('launching', 0, 10);

        this.rocketExplosion = this.game.add.audio('rocket-explosion', 1, true);
        this.rocketExplosion.allowMultiple = false;
        this.rocketExplosion.addMarker('exploding', 0, 10);

        this.fuelText = this.game.add.text(32, 32, this.fuelLabel + ': ' + this.fuel, {
            font: "20px Arial",
            fill: "#ffffff",
            align: "left"
        });
        this.fuelText.fixedToCamera = true;
        this.fuelText.cameraOffset.setTo(32, 32);

        this.graphics = this.game.add.graphics(0, 0);
        this.drawGround();
        this.graphics.beginFill(0x8e8e8e);
        this.graphics.drawPolygon(this.ground.points);
        this.graphics.endFill();

        this.rocket = this.game.add.sprite(50, 1512, 'rocket');
        this.rocket.animations.add('launching', [1, 2, 3], 10, true);
        this.rocket.anchor = new Phaser.Point(0.5, 0.5);
        this.game.physics.enable([this.rocket], Phaser.Physics.ARCADE);

        this.rocket.body.bounce.set(0);
        this.rocket.body.gravity.set(0, 180);
        this.rocket.body.velocity.setTo(0, 200);
        this.rocket.body.collideWorldBounds = true;

        this.game.camera.follow(this.rocket);
        this.game.camera.deadzone = new Phaser.Rectangle(150, 150, 500, 0);
        this.game.camera.focusOnXY(0, 0);

        this.explosion = this.game.add.sprite(0, 0, 'explosion');
        this.explosion.anchor = new Phaser.Point(0.5, 0.5);
        this.explosion.animations.add('exploding',
            Array.apply(null, {length: 23}).map(Number.call, Number), 10, false);
        this.explosion.visible = false;

        this.introText = this.game.add.text(400, this.game.world.centerY, '',
            {font: "40px Arial", fill: "#ffffff", align: "center"});
        this.introText.anchor = new Phaser.Point(0.5, 0.5);
        this.introText.fixedToCamera = true;
        this.introText.visible = false;

        this.restartButton = this.game.add.button(400, this.game.world.centerY + 50, 'restart-button', this.restart, this, 2, 1, 0);
        this.restartButton.anchor = new Phaser.Point(0.5, 0.5);
        this.restartButton.fixedToCamera = true;
        this.restartButton.visible = false;
    }

    update() {
        if (!this.ended && this.checkExplosion()) {
            this.exploding();
        } else if (!this.ended && this.checkVictory()) {
            this.victory();
        } else if (!this.ended) {
            this.moving();
        }
    }

    render() {
        if (this.debug) {
            this.game.debug.bodyInfo(this.rocket, 32, 32);
            this.game.debug.body(this.rocket);
        }
    }

    drawGround() {
        let highPoint = 100;
        let lowerPoint = 450;
        let groundPoints = [
            new Phaser.Point(0, 600),
            new Phaser.Point(0, 580), // launch
            new Phaser.Point(100, 580)  // launch
        ];

        let lineLaunch = new Phaser.Line(0, 585, 100, 585);
        let graphicsLaunch = this.game.add.graphics(0, 0);
        graphicsLaunch.lineStyle(10, 0xffd900, 1);
        graphicsLaunch.moveTo(lineLaunch.start.x, lineLaunch.start.y);
        graphicsLaunch.lineTo(lineLaunch.end.x, lineLaunch.end.y);
        graphicsLaunch.endFill();

        for (let xPoint = 150; xPoint < 1750; xPoint += 50) {
            groundPoints.push(new Phaser.Point(xPoint, (Math.random() * lowerPoint) + highPoint));
        }

        groundPoints.push(new Phaser.Point(1800, 580)); // landing
        groundPoints.push(new Phaser.Point(1900, 580)); // landing

        let lineLanding = new Phaser.Line(1800, 585, 1900, 585);
        let graphicsLanding = this.game.add.graphics(0, 0);
        graphicsLanding.lineStyle(10, 0xE43A45, 1);
        graphicsLanding.moveTo(lineLanding.start.x, lineLanding.start.y);
        graphicsLanding.lineTo(lineLanding.end.x, lineLanding.end.y);
        graphicsLanding.endFill();

        groundPoints.push(new Phaser.Point(1950, (Math.random() * lowerPoint) + highPoint));
        groundPoints.push(new Phaser.Point(2000, (Math.random() * lowerPoint) + highPoint));
        groundPoints.push(new Phaser.Point(2100, 600));

        this.ground = new Phaser.Polygon();
        this.ground.setTo(groundPoints);
    }

    consumeFuel() {
        if (this.fuel > 0) {
            this.fuel -= 1;
        }
    }

    playRocketSound() {
        if (!this.playingSound) {
            this.rocketAudio.play('launching');
            this.playingSound = true
        }
    }

    checkExplosion() {
        return this.ground.contains(this.rocket.x, this.rocket.y)
            || (this.rocket.body.onFloor() && this.rocket.body.speed > 203)
    }

    checkVictory() {
        return !this.ended && this.rocket.body.onFloor()
            && this.rocket.x > 1800 && this.rocket.x < 1900
    }

    isFuelEmpty() {
        return this.fuel === 0;
    }

    launching() {
        this.rocket.animations.play('launching');
        this.playRocketSound();
        this.consumeFuel();
    }

    moving() {
        if (this.cursors.up.isDown && !this.isFuelEmpty()) {
            this.rocket.body.acceleration.y = -this.accelerationY;
            this.launching();
        } else if (this.cursors.left.isDown && !this.isFuelEmpty()) {
            this.rocket.body.acceleration.x = -this.accelerationX;
            this.launching();
        } else if (this.cursors.right.isDown && !this.isFuelEmpty()) {
            this.rocket.body.acceleration.x = this.accelerationX;
            this.launching();
        } else {
            this.rocket.body.acceleration.setTo(0, 0);
            this.rocket.frame = 0;
            this.rocket.animations.stop();
            this.rocketAudio.stop();
            this.playingSound = false;
        }

        if (this.rocket.body.onFloor()) {
            this.rocket.body.velocity.x = 0;
        }

        this.fuelText.text = this.fuelLabel + ': ' + this.fuel;
        this.background.tilePosition.x = -this.game.camera.x;
        this.background.tilePosition.y = -this.game.camera.y;
    }

    freeze() {
        this.ended = true;
        this.rocket.body.velocity.x = 0;
        this.rocket.body.velocity.y = 0;
    }

    exploding() {
        this.freeze();

        this.explosion.x = this.rocket.x;
        this.explosion.y = this.rocket.y;
        this.explosion.visible = true;

        this.explosion.animations.play('exploding', 10, false, true);

        this.game.world.remove(this.rocket);
        this.rocketAudio.stop();

        this.rocketExplosion.play('exploding');

        this.gameOver();
    }

    gameOver() {
        this.introText.text = this.gameOverLabel;
        this.introText.visible = true;
        this.restartButton.visible = true;
    }

    victory() {
        this.freeze();

        this.introText.text = this.victoryLabel;
        this.introText.visible = true;
        this.restartButton.visible = true;
    }

    restart() {
        this.fuel = this.fuelDefault;
        this.ended = false;

        this.game.state.restart();
    }
}

window.onload = () => {
    new RocketPocketGame();
};