class RocketPocketGame {
    game: Phaser.Game;
    cursors: Phaser.CursorKeys;
    rocket: Phaser.Sprite;
    rocketAudio: Phaser.AudioSprite;
    fuel: number;
    fuelText: Phaser.Text;
    background: Phaser.TileSprite;

    constructor() {
        this.game = new Phaser.Game(800, 512, Phaser.AUTO, 'content', {
            preload: this.preload,
            create: this.create,
            update: this.update,
            render: this.render
        });
    }

    preload() {
        this.fuel = 300;
        this.game.load.spritesheet('rocket', 'img/rocket.png', 50, 75, 3);
        this.game.load.image('background', 'img/lunar-background.png');
        this.game.load.audio('rocket-audio', ['audio/rocket-launch.wav']);
    }

    create() {
        this.game.stage.backgroundColor = '#2d2d2d';
        this.game.physics.startSystem(Phaser.Physics.ARCADE);

        this.background = this.game.add.tileSprite(0, 0, 1024, 512, 'background');
        this.background.fixedToCamera = true;
        this.game.world.setBounds(0, 0, 2000, 1512);
        this.game.camera.y = 1512;

        this.rocket = this.game.add.sprite(32, 1512, 'rocket');
        this.rocket.animations.add('launching', [1, 2, 3], 10, true);
        this.game.physics.enable( [ this.rocket ], Phaser.Physics.ARCADE);

        this.rocketAudio = this.game.add.audio('rocket-audio');
        this.rocketAudio.allowMultiple = false;
        this.rocketAudio.addMarker('launching', 0, 10);

        this.rocket.body.velocity.setTo(0, 200);
        this.rocket.body.collideWorldBounds = true;

        this.cursors = this.game.input.keyboard.createCursorKeys();

        this.rocket.body.bounce.set(0);
        this.rocket.body.gravity.set(0, 180);

        this.fuelText = this.game.add.text(32, 32, 'Combustível: ' + this.fuel, { font: "20px Arial", fill: "#ffffff", align: "left" });
        this.fuelText.fixedToCamera = true;
        this.fuelText.cameraOffset.setTo(32, 32);

        this.game.camera.follow(this.rocket);
        this.game.camera.deadzone = new Phaser.Rectangle(150, 150, 500, 300);
        this.game.camera.focusOnXY(0, 0);
    }

    update() {
        let consumeFuel = function (fuel) {
            if(fuel > 0){
                fuel -=1;
            }

            return fuel;
        };

        if (this.cursors.up.isDown && this.fuel > 0) {
            this.rocket.body.acceleration.y = -600;
            this.rocket.animations.play('launching');

            this.rocketAudio.play('launching');
            this.fuel = consumeFuel(this.fuel);
        } else if (this.cursors.left.isDown && this.fuel > 0) {
            this.rocket.body.acceleration.x = -100;
            this.rocket.animations.play('launching');

            this.rocketAudio.play('launching');
            this.fuel = consumeFuel(this.fuel);
        } else if (this.cursors.right.isDown && this.fuel > 0) {
            this.rocket.body.acceleration.x = 100;
            this.rocket.animations.play('launching');

            this.rocketAudio.play('launching');
            this.fuel = consumeFuel(this.fuel);
        } else {
            this.rocket.body.acceleration.setTo(0,0);
            this.rocket.frame = 0;
            this.rocket.animations.stop();
            this.rocketAudio.stop();
        }

        if(this.rocket.body.onFloor()){
            this.rocket.body.velocity.x = 0;
        }

        this.fuelText.text = 'Combustível: ' + this.fuel;

        this.background.tilePosition.x = -this.game.camera.x;
        this.background.tilePosition.y = -this.game.camera.y;
    }

    render() {
        this.game.debug.bodyInfo(this.rocket, 32, 32);
        this.game.debug.body(this.rocket);
    }
}

window.onload = () => {
    new RocketPocketGame();
};