(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
var RocketPocketGame = /** @class */ (function () {
    function RocketPocketGame() {
        this.debug = false;
        this.accelerationX = 200;
        this.accelerationY = 400;
        this.fuelDefault = 500;
        this.fuelLabel = 'Combustível';
        this.gameOverLabel = 'Você perdeu!';
        this.victoryLabel = 'Você conseguiu!';
        this.fuel = this.fuelDefault;
        this.playingSound = false;
        this.ended = false;
        this.game = new Phaser.Game(800, 600, Phaser.AUTO, 'content', {
            preload: this.preload.bind(this),
            create: this.create.bind(this),
            update: this.update.bind(this),
            render: this.render.bind(this)
        });
    }
    RocketPocketGame.prototype.preload = function () {
        this.game.load.spritesheet('rocket', 'img/rocket.png', 50, 75, 3);
        this.game.load.spritesheet('explosion', 'img/explosion.png', 64, 64, 23);
        this.game.load.spritesheet('restart-button', 'img/restart-button.png', 96, 40);
        this.game.load.image('background', 'img/lunar-background.png');
        this.game.load.audio('rocket-audio', ['audio/rocket-launch.mp3']);
        this.game.load.audio('rocket-explosion', ['audio/rocket-explosion.mp3']);
    };
    RocketPocketGame.prototype.create = function () {
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
        this.explosion = this.game.add.sprite(0, 0, 'explosion');
        this.explosion.anchor = new Phaser.Point(0.5, 0.5);
        this.explosion.animations.add('exploding', Array.apply(null, { length: 23 }).map(Number.call, Number), 10, false);
        this.explosion.visible = false;
        this.introText = this.game.add.text(400, this.game.world.centerY, '', { font: "40px Arial", fill: "#ffffff", align: "center" });
        this.introText.anchor = new Phaser.Point(0.5, 0.5);
        this.introText.fixedToCamera = true;
        this.introText.visible = false;
        this.restartButton = this.game.add.button(400, this.game.world.centerY + 50, 'restart-button', this.restart, this, 2, 1, 0);
        this.restartButton.anchor = new Phaser.Point(0.5, 0.5);
        this.restartButton.fixedToCamera = true;
        this.restartButton.visible = false;
    };
    RocketPocketGame.prototype.update = function () {
        if (!this.ended && this.checkExplosion()) {
            this.exploding();
        }
        else if (!this.ended && this.checkVictory()) {
            this.victory();
        }
        else if (!this.ended) {
            this.moving();
        }
    };
    RocketPocketGame.prototype.render = function () {
        if (this.debug) {
            this.game.debug.bodyInfo(this.rocket, 32, 32);
            this.game.debug.body(this.rocket);
        }
    };
    RocketPocketGame.prototype.drawGround = function () {
        var highPoint = 100;
        var lowerPoint = 450;
        var groundPoints = [
            new Phaser.Point(0, 600),
            new Phaser.Point(0, 580),
            new Phaser.Point(100, 580) // landing
        ];
        for (var xPoint = 150; xPoint < 1750; xPoint += 50) {
            groundPoints.push(new Phaser.Point(xPoint, (Math.random() * lowerPoint) + highPoint));
        }
        groundPoints.push(new Phaser.Point(1800, 580)); // landing
        groundPoints.push(new Phaser.Point(1900, 580)); // landing
        groundPoints.push(new Phaser.Point(1950, (Math.random() * lowerPoint) + highPoint));
        groundPoints.push(new Phaser.Point(2000, (Math.random() * lowerPoint) + highPoint));
        groundPoints.push(new Phaser.Point(2100, 600));
        this.ground = new Phaser.Polygon();
        this.ground.setTo(groundPoints);
    };
    RocketPocketGame.prototype.consumeFuel = function () {
        if (this.fuel > 0) {
            this.fuel -= 1;
        }
    };
    RocketPocketGame.prototype.playRocketSound = function () {
        if (!this.playingSound) {
            this.rocketAudio.play('launching');
            this.playingSound = true;
        }
    };
    RocketPocketGame.prototype.checkExplosion = function () {
        return this.ground.contains(this.rocket.x, this.rocket.y)
            || (this.rocket.body.onFloor() && this.rocket.body.speed > 203);
    };
    RocketPocketGame.prototype.checkVictory = function () {
        return !this.ended && this.rocket.body.onFloor()
            && this.rocket.x > 1800 && this.rocket.x < 1900;
    };
    RocketPocketGame.prototype.isFuelEmpty = function () {
        return this.fuel === 0;
    };
    RocketPocketGame.prototype.launching = function () {
        this.rocket.animations.play('launching');
        this.playRocketSound();
        this.consumeFuel();
    };
    RocketPocketGame.prototype.moving = function () {
        if (this.cursors.up.isDown && !this.isFuelEmpty()) {
            this.rocket.body.acceleration.y = -this.accelerationY;
            this.launching();
        }
        else if (this.cursors.left.isDown && !this.isFuelEmpty()) {
            this.rocket.body.acceleration.x = -this.accelerationX;
            this.launching();
        }
        else if (this.cursors.right.isDown && !this.isFuelEmpty()) {
            this.rocket.body.acceleration.x = this.accelerationX;
            this.launching();
        }
        else {
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
    };
    RocketPocketGame.prototype.freeze = function () {
        this.ended = true;
        this.rocket.body.velocity.x = 0;
        this.rocket.body.velocity.y = 0;
    };
    RocketPocketGame.prototype.exploding = function () {
        this.freeze();
        this.explosion.x = this.rocket.x;
        this.explosion.y = this.rocket.y;
        this.explosion.visible = true;
        this.explosion.animations.play('exploding', 10, false, true);
        this.game.world.remove(this.rocket);
        this.rocketAudio.stop();
        this.rocketExplosion.play('exploding');
        this.gameOver();
    };
    RocketPocketGame.prototype.gameOver = function () {
        this.introText.text = this.gameOverLabel;
        this.introText.visible = true;
        this.restartButton.visible = true;
    };
    RocketPocketGame.prototype.victory = function () {
        this.freeze();
        this.introText.text = this.victoryLabel;
        this.introText.visible = true;
        this.restartButton.visible = true;
    };
    RocketPocketGame.prototype.restart = function () {
        this.fuel = this.fuelDefault;
        this.ended = false;
        this.game.state.restart();
    };
    return RocketPocketGame;
}());
window.onload = function () {
    new RocketPocketGame();
};
},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvbWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0lBeUJJO1FBeEJBLFVBQUssR0FBWSxLQUFLLENBQUM7UUFDdkIsa0JBQWEsR0FBVyxHQUFHLENBQUM7UUFDNUIsa0JBQWEsR0FBVyxHQUFHLENBQUM7UUFDNUIsZ0JBQVcsR0FBVyxHQUFHLENBQUM7UUFDMUIsY0FBUyxHQUFXLGFBQWEsQ0FBQztRQUNsQyxrQkFBYSxHQUFXLGNBQWMsQ0FBQztRQUN2QyxpQkFBWSxHQUFXLGlCQUFpQixDQUFDO1FBRXpDLFNBQUksR0FBVyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQ2hDLGlCQUFZLEdBQVksS0FBSyxDQUFDO1FBQzlCLFVBQUssR0FBWSxLQUFLLENBQUM7UUFlbkIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRTtZQUMxRCxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQ2hDLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDOUIsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztZQUM5QixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO1NBQ2pDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRCxrQ0FBTyxHQUFQO1FBQ0ksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2xFLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxD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TUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDckMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxHQUFHLElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNuRSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRWpDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDekQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNuRCxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUNyQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxFQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN6RSxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFFL0IsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQ2hFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQzlELElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLElBQUks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USxHQUFSO1FBQ0ksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUN6QyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDOUIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO0lBQ3RDLENBQUM7SUFFRCxrQ0FBTyxHQUFQO1FBQ0ksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBRWQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQztRQUN4QyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDOUIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO0lBQ3RDLENBQUM7SUFFRCxrQ0FBTyxHQUFQO1FBQ0ksSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQzdCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBRW5CLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzlCLENBQUM7SUFDTCx1QkFBQztBQUFELENBL1BBLEFBK1BDLElBQUE7QUFFRCxNQUFNLENBQUMsTUFBTSxHQUFHO0lBQ1osSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO0FBQzNCLENBQUMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9cmV0dXJuIGV9KSgpIiwiY2xhc3MgUm9ja2V0UG9ja2V0R2FtZSB7XG4gICAgZGVidWc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICBhY2NlbGVyYXRpb25YOiBudW1iZXIgPSAyMDA7XG4gICAgYWNjZWxlcmF0aW9uWTogbnVtYmVyID0gNDAwO1xuICAgIGZ1ZWxEZWZhdWx0OiBudW1iZXIgPSA1MDA7XG4gICAgZnVlbExhYmVsOiBzdHJpbmcgPSAnQ29tYnVzdMOtdmVsJztcbiAgICBnYW1lT3ZlckxhYmVsOiBzdHJpbmcgPSAnVm9jw6ogcGVyZGV1ISc7XG4gICAgdmljdG9yeUxhYmVsOiBzdHJpbmcgPSAnVm9jw6ogY29uc2VndWl1ISc7XG5cbiAgICBmdWVsOiBudW1iZXIgPSB0aGlzLmZ1ZWxEZWZhdWx0O1xuICAgIHBsYXlpbmdTb3VuZDogYm9vbGVhbiA9IGZhbHNlO1xuICAgIGVuZGVkOiBib29sZWFuID0gZmFsc2U7XG4gICAgZ2FtZTogUGhhc2VyLkdhbWU7XG4gICAgY3Vyc29yczogUGhhc2VyLkN1cnNvcktleXM7XG4gICAgcm9ja2V0OiBQaGFzZXIuU3ByaXRlO1xuICAgIGV4cGxvc2lvbjogUGhhc2VyLlNwcml0ZTtcbiAgICByb2NrZXRBdWRpbzogUGhhc2VyLkF1ZGlvU3ByaXRlO1xuICAgIHJvY2tldEV4cGxvc2lvbjogUGhhc2VyLkF1ZGlvU3ByaXRlO1xuICAgIGZ1ZWxUZXh0OiBQaGFzZXIuVGV4dDtcbiAgICBiYWNrZ3JvdW5kOiBQaGFzZXIuVGlsZVNwcml0ZTtcbiAgICBncm91bmQ6IFBoYXNlci5Qb2x5Z29uO1xuICAgIGdyYXBoaWNzOiBQaGFzZXIuR3JhcGhpY3M7XG4gICAgaW50cm9UZXh0OiBQaGFzZXIuVGV4dDtcbiAgICByZXN0YXJ0QnV0dG9uOiBQaGFzZXIuQnV0dG9uO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZ2FtZSA9IG5ldyBQaGFzZXIuR2FtZSg4MDAsIDYwMCwgUGhhc2VyLkFVVE8sICdjb250ZW50Jywge1xuICAgICAgICAgICAgcHJlbG9hZDogdGhpcy5wcmVsb2FkLmJpbmQodGhpcyksXG4gICAgICAgICAgICBjcmVhdGU6IHRoaXMuY3JlYXRlLmJpbmQodGhpcyksXG4gICAgICAgICAgICB1cGRhdGU6IHRoaXMudXBkYXRlLmJpbmQodGhpcyksXG4gICAgICAgICAgICByZW5kZXI6IHRoaXMucmVuZGVyLmJpbmQodGhpcylcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJlbG9hZCgpIHtcbiAgICAgICAgdGhpcy5nYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ3JvY2tldCcsICdpbWcvcm9ja2V0LnBuZycsIDUwLCA3NSwgMyk7XG4gICAgICAgIHRoaXMuZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCdleHBsb3Npb24nLCAnaW1nL2V4cGxvc2lvbi5wbmcnLCA2NCwgNjQsIDIzKTtcbiAgICAgICAgdGhpcy5nYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ3Jlc3RhcnQtYnV0dG9uJywgJ2ltZy9yZXN0YXJ0LWJ1dHRvbi5wbmcnLCA5NiwgNDApO1xuXG4gICAgICAgIHRoaXMuZ2FtZS5sb2FkLmltYWdlKCdiYWNrZ3JvdW5kJywgJ2ltZy9sdW5hci1iYWNrZ3JvdW5kLnBuZycpO1xuXG4gICAgICAgIHRoaXMuZ2FtZS5sb2FkLmF1ZGlvKCdyb2NrZXQtYXVkaW8nLCBbJ2F1ZGlvL3JvY2tldC1sYXVuY2gubXAzJ10pO1xuICAgICAgICB0aGlzLmdhbWUubG9hZC5hdWRpbygncm9ja2V0LWV4cGxvc2lvbicsIFsnYXVkaW8vcm9ja2V0LWV4cGxvc2lvbi5tcDMnXSk7XG4gICAgfVxuXG4gICAgY3JlYXRlKCkge1xuICAgICAgICB0aGlzLmdhbWUuc3RhZ2UuYmFja2dyb3VuZENvbG9yID0gJyMyZDJkMmQnO1xuICAgICAgICB0aGlzLmdhbWUucGh5c2ljcy5zdGFydFN5c3RlbShQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xuXG4gICAgICAgIHRoaXMuY3Vyc29ycyA9IHRoaXMuZ2FtZS5pbnB1dC5rZXlib2FyZC5jcmVhdGVDdXJzb3JLZXlzKCk7XG5cbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kID0gdGhpcy5nYW1lLmFkZC50aWxlU3ByaXRlKDAsIDAsIDgwMCwgNjAwLCAnYmFja2dyb3VuZCcpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmQuZml4ZWRUb0NhbWVyYSA9IHRydWU7XG4gICAgICAgIHRoaXMuZ2FtZS53b3JsZC5zZXRCb3VuZHMoMCwgMCwgMjAwMCwgNjAwKTtcblxuICAgICAgICB0aGlzLnJvY2tldEF1ZGlvID0gdGhpcy5nYW1lLmFkZC5hdWRpbygncm9ja2V0LWF1ZGlvJywgMSwgdHJ1ZSk7XG4gICAgICAgIHRoaXMucm9ja2V0QXVkaW8uYWxsb3dNdWx0aXBsZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJvY2tldEF1ZGlvLmFkZE1hcmtlcignbGF1bmNoaW5nJywgMCwgMTApO1xuXG4gICAgICAgIHRoaXMucm9ja2V0RXhwbG9zaW9uID0gdGhpcy5nYW1lLmFkZC5hdWRpbygncm9ja2V0LWV4cGxvc2lvbicsIDEsIHRydWUpO1xuICAgICAgICB0aGlzLnJvY2tldEV4cGxvc2lvbi5hbGxvd011bHRpcGxlID0gZmFsc2U7XG4gICAgICAgIHRoaXMucm9ja2V0RXhwbG9zaW9uLmFkZE1hcmtlcignZXhwbG9kaW5nJywgMCwgMTApO1xuXG4gICAgICAgIHRoaXMuZnVlbFRleHQgPSB0aGlzLmdhbWUuYWRkLnRleHQoMzIsIDMyLCB0aGlzLmZ1ZWxMYWJlbCArICc6ICcgKyB0aGlzLmZ1ZWwsIHtcbiAgICAgICAgICAgIGZvbnQ6IFwiMjBweCBBcmlhbFwiLFxuICAgICAgICAgICAgZmlsbDogXCIjZmZmZmZmXCIsXG4gICAgICAgICAgICBhbGlnbjogXCJsZWZ0XCJcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZnVlbFRleHQuZml4ZWRUb0NhbWVyYSA9IHRydWU7XG4gICAgICAgIHRoaXMuZnVlbFRleHQuY2FtZXJhT2Zmc2V0LnNldFRvKDMyLCAzMik7XG5cbiAgICAgICAgdGhpcy5kcmF3R3JvdW5kKCk7XG5cbiAgICAgICAgdGhpcy5ncmFwaGljcyA9IHRoaXMuZ2FtZS5hZGQuZ3JhcGhpY3MoMCwgMCk7XG4gICAgICAgIHRoaXMuZ3JhcGhpY3MuYmVnaW5GaWxsKDB4OGU4ZThlKTtcbiAgICAgICAgdGhpcy5ncmFwaGljcy5kcmF3UG9seWdvbih0aGlzLmdyb3VuZC5wb2ludHMpO1xuICAgICAgICB0aGlzLmdyYXBoaWNzLmVuZEZpbGwoKTtcblxuICAgICAgICB0aGlzLnJvY2tldCA9IHRoaXMuZ2FtZS5hZGQuc3ByaXRlKDMyLCAxNTEyLCAncm9ja2V0Jyk7XG4gICAgICAgIHRoaXMucm9ja2V0LmFuaW1hdGlvbnMuYWRkKCdsYXVuY2hpbmcnLCBbMSwgMiwgM10sIDEwLCB0cnVlKTtcbiAgICAgICAgdGhpcy5yb2NrZXQuYW5jaG9yID0gbmV3IFBoYXNlci5Qb2ludCgwLjUsIDAuNSk7XG4gICAgICAgIHRoaXMuZ2FtZS5waHlzaWNzLmVuYWJsZShbdGhpcy5yb2NrZXRdLCBQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xuXG4gICAgICAgIHRoaXMucm9ja2V0LmJvZHkuYm91bmNlLnNldCgwKTtcbiAgICAgICAgdGhpcy5yb2NrZXQuYm9keS5ncmF2aXR5LnNldCgwLCAxODApO1xuICAgICAgICB0aGlzLnJvY2tldC5ib2R5LnZlbG9jaXR5LnNldFRvKDAsIDIwMCk7XG4gICAgICAgIHRoaXMucm9ja2V0LmJvZHkuY29sbGlkZVdvcmxkQm91bmRzID0gdHJ1ZTtcblxuICAgICAgICB0aGlzLmdhbWUuY2FtZXJhLmZvbGxvdyh0aGlzLnJvY2tldCk7XG4gICAgICAgIHRoaXMuZ2FtZS5jYW1lcmEuZGVhZHpvbmUgPSBuZXcgUGhhc2VyLlJlY3RhbmdsZSgxNTAsIDE1MCwgNTAwLCAwKTtcbiAgICAgICAgdGhpcy5nYW1lLmNhbWVyYS5mb2N1c09uWFkoMCwgMCk7XG5cbiAgICAgICAgdGhpcy5leHBsb3Npb24gPSB0aGlzLmdhbWUuYWRkLnNwcml0ZSgwLCAwLCAnZXhwbG9zaW9uJyk7XG4gICAgICAgIHRoaXMuZXhwbG9zaW9uLmFuY2hvciA9IG5ldyBQaGFzZXIuUG9pbnQoMC41LCAwLjUpO1xuICAgICAgICB0aGlzLmV4cGxvc2lvbi5hbmltYXRpb25zLmFkZCgnZXhwbG9kaW5nJyxcbiAgICAgICAgICAgIEFycmF5LmFwcGx5KG51bGwsIHtsZW5ndGg6IDIzfSkubWFwKE51bWJlci5jYWxsLCBOdW1iZXIpLCAxMCwgZmFsc2UpO1xuICAgICAgICB0aGlzLmV4cGxvc2lvbi52aXNpYmxlID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5pbnRyb1RleHQgPSB0aGlzLmdhbWUuYWRkLnRleHQoNDAwLCB0aGlzLmdhbWUud29ybGQuY2VudGVyWSwgJycsXG4gICAgICAgICAgICB7IGZvbnQ6IFwiNDBweCBBcmlhbFwiLCBmaWxsOiBcIiNmZmZmZmZcIiwgYWxpZ246IFwiY2VudGVyXCIgfSk7XG4gICAgICAgIHRoaXMuaW50cm9UZXh0LmFuY2hvciA9IG5ldyBQaGFzZXIuUG9pbnQoMC41LCAwLjUpO1xuICAgICAgICB0aGlzLmludHJvVGV4dC5maXhlZFRvQ2FtZXJhID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5pbnRyb1RleHQudmlzaWJsZSA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMucmVzdGFydEJ1dHRvbiA9IHRoaXMuZ2FtZS5hZGQuYnV0dG9uKDQwMCwgdGhpcy5nYW1lLndvcmxkLmNlbnRlclkgKyA1MCwgJ3Jlc3RhcnQtYnV0dG9uJywgdGhpcy5yZXN0YXJ0LCB0aGlzLCAyLCAxLCAwKTtcbiAgICAgICAgdGhpcy5yZXN0YXJ0QnV0dG9uLmFuY2hvciA9IG5ldyBQaGFzZXIuUG9pbnQoMC41LCAwLjUpO1xuICAgICAgICB0aGlzLnJlc3RhcnRCdXR0b24uZml4ZWRUb0NhbWVyYSA9IHRydWU7XG4gICAgICAgIHRoaXMucmVzdGFydEJ1dHRvbi52aXNpYmxlID0gZmFsc2U7XG4gICAgfVxuXG4gICAgdXBkYXRlKCkge1xuICAgICAgICBpZiAoIXRoaXMuZW5kZWQgJiYgdGhpcy5jaGVja0V4cGxvc2lvbigpKSB7XG4gICAgICAgICAgICB0aGlzLmV4cGxvZGluZygpO1xuICAgICAgICB9IGVsc2UgaWYoIXRoaXMuZW5kZWQgJiYgdGhpcy5jaGVja1ZpY3RvcnkoKSkge1xuICAgICAgICAgICAgdGhpcy52aWN0b3J5KCk7XG4gICAgICAgIH0gZWxzZSBpZiAoIXRoaXMuZW5kZWQpIHtcbiAgICAgICAgICAgIHRoaXMubW92aW5nKCk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgaWYgKHRoaXMuZGVidWcpIHtcbiAgICAgICAgICAgIHRoaXMuZ2FtZS5kZWJ1Zy5ib2R5SW5mbyh0aGlzLnJvY2tldCwgMzIsIDMyKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZS5kZWJ1Zy5ib2R5KHRoaXMucm9ja2V0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRyYXdHcm91bmQoKSB7XG4gICAgICAgIGxldCBoaWdoUG9pbnQgPSAxMDA7XG4gICAgICAgIGxldCBsb3dlclBvaW50ID0gNDUwO1xuICAgICAgICBsZXQgZ3JvdW5kUG9pbnRzID0gW1xuICAgICAgICAgICAgbmV3IFBoYXNlci5Qb2ludCgwLCA2MDApLFxuICAgICAgICAgICAgbmV3IFBoYXNlci5Qb2ludCgwLCA1ODApLCAvLyBsYW5kaW5nXG4gICAgICAgICAgICBuZXcgUGhhc2VyLlBvaW50KDEwMCwgNTgwKSAgLy8gbGFuZGluZ1xuICAgICAgICBdO1xuXG4gICAgICAgIGZvciAobGV0IHhQb2ludCA9IDE1MDsgeFBvaW50IDwgMTc1MDsgeFBvaW50ICs9IDUwKSB7XG4gICAgICAgICAgICBncm91bmRQb2ludHMucHVzaChuZXcgUGhhc2VyLlBvaW50KHhQb2ludCwgKE1hdGgucmFuZG9tKCkgKiBsb3dlclBvaW50KSArIGhpZ2hQb2ludCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ3JvdW5kUG9pbnRzLnB1c2gobmV3IFBoYXNlci5Qb2ludCgxODAwLCA1ODApKTsgLy8gbGFuZGluZ1xuICAgICAgICBncm91bmRQb2ludHMucHVzaChuZXcgUGhhc2VyLlBvaW50KDE5MDAsIDU4MCkpOyAvLyBsYW5kaW5nXG5cbiAgICAgICAgZ3JvdW5kUG9pbnRzLnB1c2gobmV3IFBoYXNlci5Qb2ludCgxOTUwLCAoTWF0aC5yYW5kb20oKSAqIGxvd2VyUG9pbnQpICsgaGlnaFBvaW50KSk7XG4gICAgICAgIGdyb3VuZFBvaW50cy5wdXNoKG5ldyBQaGFzZXIuUG9pbnQoMjAwMCwgKE1hdGgucmFuZG9tKCkgKiBsb3dlclBvaW50KSArIGhpZ2hQb2ludCkpO1xuICAgICAgICBncm91bmRQb2ludHMucHVzaChuZXcgUGhhc2VyLlBvaW50KDIxMDAsIDYwMCkpO1xuXG4gICAgICAgIHRoaXMuZ3JvdW5kID0gbmV3IFBoYXNlci5Qb2x5Z29uKCk7XG4gICAgICAgIHRoaXMuZ3JvdW5kLnNldFRvKGdyb3VuZFBvaW50cyk7XG4gICAgfVxuXG4gICAgY29uc3VtZUZ1ZWwoKSB7XG4gICAgICAgIGlmICh0aGlzLmZ1ZWwgPiAwKSB7XG4gICAgICAgICAgICB0aGlzLmZ1ZWwgLT0gMTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHBsYXlSb2NrZXRTb3VuZCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnBsYXlpbmdTb3VuZCkge1xuICAgICAgICAgICAgdGhpcy5yb2NrZXRBdWRpby5wbGF5KCdsYXVuY2hpbmcnKTtcbiAgICAgICAgICAgIHRoaXMucGxheWluZ1NvdW5kID0gdHJ1ZVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2hlY2tFeHBsb3Npb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdyb3VuZC5jb250YWlucyh0aGlzLnJvY2tldC54LCB0aGlzLnJvY2tldC55KVxuICAgICAgICAgICAgfHwgKHRoaXMucm9ja2V0LmJvZHkub25GbG9vcigpICYmIHRoaXMucm9ja2V0LmJvZHkuc3BlZWQgPiAyMDMpXG4gICAgfVxuXG4gICAgY2hlY2tWaWN0b3J5KCkge1xuICAgICAgICByZXR1cm4gIXRoaXMuZW5kZWQgJiYgdGhpcy5yb2NrZXQuYm9keS5vbkZsb29yKClcbiAgICAgICAgICAgICYmIHRoaXMucm9ja2V0LnggPiAxODAwICYmIHRoaXMucm9ja2V0LnggPCAxOTAwXG4gICAgfVxuXG4gICAgaXNGdWVsRW1wdHkoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZ1ZWwgPT09IDA7XG4gICAgfVxuXG4gICAgbGF1bmNoaW5nKCkge1xuICAgICAgICB0aGlzLnJvY2tldC5hbmltYXRpb25zLnBsYXkoJ2xhdW5jaGluZycpO1xuICAgICAgICB0aGlzLnBsYXlSb2NrZXRTb3VuZCgpO1xuICAgICAgICB0aGlzLmNvbnN1bWVGdWVsKCk7XG4gICAgfVxuXG4gICAgbW92aW5nKCkge1xuICAgICAgICBpZiAodGhpcy5jdXJzb3JzLnVwLmlzRG93biAmJiAhdGhpcy5pc0Z1ZWxFbXB0eSgpKSB7XG4gICAgICAgICAgICB0aGlzLnJvY2tldC5ib2R5LmFjY2VsZXJhdGlvbi55ID0gLXRoaXMuYWNjZWxlcmF0aW9uWTtcbiAgICAgICAgICAgIHRoaXMubGF1bmNoaW5nKCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5jdXJzb3JzLmxlZnQuaXNEb3duICYmICF0aGlzLmlzRnVlbEVtcHR5KCkpIHtcbiAgICAgICAgICAgIHRoaXMucm9ja2V0LmJvZHkuYWNjZWxlcmF0aW9uLnggPSAtdGhpcy5hY2NlbGVyYXRpb25YO1xuICAgICAgICAgICAgdGhpcy5sYXVuY2hpbmcoKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmN1cnNvcnMucmlnaHQuaXNEb3duICYmICF0aGlzLmlzRnVlbEVtcHR5KCkpIHtcbiAgICAgICAgICAgIHRoaXMucm9ja2V0LmJvZHkuYWNjZWxlcmF0aW9uLnggPSB0aGlzLmFjY2VsZXJhdGlvblg7XG4gICAgICAgICAgICB0aGlzLmxhdW5jaGluZygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5yb2NrZXQuYm9keS5hY2NlbGVyYXRpb24uc2V0VG8oMCwgMCk7XG4gICAgICAgICAgICB0aGlzLnJvY2tldC5mcmFtZSA9IDA7XG4gICAgICAgICAgICB0aGlzLnJvY2tldC5hbmltYXRpb25zLnN0b3AoKTtcbiAgICAgICAgICAgIHRoaXMucm9ja2V0QXVkaW8uc3RvcCgpO1xuICAgICAgICAgICAgdGhpcy5wbGF5aW5nU291bmQgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnJvY2tldC5ib2R5Lm9uRmxvb3IoKSkge1xuICAgICAgICAgICAgdGhpcy5yb2NrZXQuYm9keS52ZWxvY2l0eS54ID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZnVlbFRleHQudGV4dCA9IHRoaXMuZnVlbExhYmVsICsgJzogJyArIHRoaXMuZnVlbDtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kLnRpbGVQb3NpdGlvbi54ID0gLXRoaXMuZ2FtZS5jYW1lcmEueDtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kLnRpbGVQb3NpdGlvbi55ID0gLXRoaXMuZ2FtZS5jYW1lcmEueTtcbiAgICB9XG5cbiAgICBmcmVlemUoKSB7XG4gICAgICAgIHRoaXMuZW5kZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnJvY2tldC5ib2R5LnZlbG9jaXR5LnggPSAwO1xuICAgICAgICB0aGlzLnJvY2tldC5ib2R5LnZlbG9jaXR5LnkgPSAwO1xuICAgIH1cblxuICAgIGV4cGxvZGluZygpIHtcbiAgICAgICAgdGhpcy5mcmVlemUoKTtcblxuICAgICAgICB0aGlzLmV4cGxvc2lvbi54ID0gdGhpcy5yb2NrZXQueDtcbiAgICAgICAgdGhpcy5leHBsb3Npb24ueSA9IHRoaXMucm9ja2V0Lnk7XG4gICAgICAgIHRoaXMuZXhwbG9zaW9uLnZpc2libGUgPSB0cnVlO1xuXG4gICAgICAgIHRoaXMuZXhwbG9zaW9uLmFuaW1hdGlvbnMucGxheSgnZXhwbG9kaW5nJywgMTAsIGZhbHNlLCB0cnVlKTtcblxuICAgICAgICB0aGlzLmdhbWUud29ybGQucmVtb3ZlKHRoaXMucm9ja2V0KTtcbiAgICAgICAgdGhpcy5yb2NrZXRBdWRpby5zdG9wKCk7XG5cbiAgICAgICAgdGhpcy5yb2NrZXRFeHBsb3Npb24ucGxheSgnZXhwbG9kaW5nJyk7XG5cbiAgICAgICAgdGhpcy5nYW1lT3ZlcigpO1xuICAgIH1cblxuICAgIGdhbWVPdmVyKCkge1xuICAgICAgICB0aGlzLmludHJvVGV4dC50ZXh0ID0gdGhpcy5nYW1lT3ZlckxhYmVsO1xuICAgICAgICB0aGlzLmludHJvVGV4dC52aXNpYmxlID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5yZXN0YXJ0QnV0dG9uLnZpc2libGUgPSB0cnVlO1xuICAgIH1cblxuICAgIHZpY3RvcnkoKSB7XG4gICAgICAgIHRoaXMuZnJlZXplKCk7XG5cbiAgICAgICAgdGhpcy5pbnRyb1RleHQudGV4dCA9IHRoaXMudmljdG9yeUxhYmVsO1xuICAgICAgICB0aGlzLmludHJvVGV4dC52aXNpYmxlID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5yZXN0YXJ0QnV0dG9uLnZpc2libGUgPSB0cnVlO1xuICAgIH1cblxuICAgIHJlc3RhcnQoKSB7XG4gICAgICAgIHRoaXMuZnVlbCA9IHRoaXMuZnVlbERlZmF1bHQ7XG4gICAgICAgIHRoaXMuZW5kZWQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLmdhbWUuc3RhdGUucmVzdGFydCgpO1xuICAgIH1cbn1cblxud2luZG93Lm9ubG9hZCA9ICgpID0+IHtcbiAgICBuZXcgUm9ja2V0UG9ja2V0R2FtZSgpO1xufTsiXX0=