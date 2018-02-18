class RocketPocketGame {
    debug: boolean = false;
    fuel: number = 500;
    accelerationX: number = 200;
    accelerationY: number = 400;
    fuelLabel: string = 'Fuel';

    playingSound: boolean = false;
    exploded: boolean = false;
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

        this.drawGround();

        this.graphics = this.game.add.graphics(0, 0);
        this.graphics.beginFill(0x8e8e8e);
        this.graphics.drawPolygon(this.ground.points);
        this.graphics.endFill();

        this.rocket = this.game.add.sprite(32, 1512, 'rocket');
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
    }

    update() {
        if (this.checkExplosion() && !this.exploded) {
            this.exploding();
        } else if (!this.exploded) {
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
            new Phaser.Point(0, 580), // landing
            new Phaser.Point(100, 580)  // landing
        ];

        for (let xPoint = 150; xPoint < 1750; xPoint += 50) {
            groundPoints.push(new Phaser.Point(xPoint, (Math.random() * lowerPoint) + highPoint));
        }

        groundPoints.push(new Phaser.Point(1800, 580)); // landing
        groundPoints.push(new Phaser.Point(1900, 580)); // landing

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
    };

    isFuelEmpty() {
        return this.fuel === 0;
    };

    launching() {
        this.rocket.animations.play('launching');
        this.playRocketSound();
        this.consumeFuel();
    }

    setUpExplosionSprite() {
        this.explosion = this.game.add.sprite(this.rocket.x, this.rocket.y, 'explosion');
        this.explosion.anchor = new Phaser.Point(0.5, 0.5);
        this.explosion.animations.add('exploding',
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23], 10, false);

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

    exploding() {
        this.exploded = true;
        this.rocket.body.velocity.x = 0;
        this.rocket.body.velocity.y = 0;

        this.setUpExplosionSprite();
        this.explosion.animations.play('exploding', 10, false, true);

        this.game.world.remove(this.rocket);
        this.rocketAudio.stop();

        this.rocketExplosion.play('exploding');
    }
}

window.onload = () => {
    new RocketPocketGame();
};