'use strict';
// Copyright (c) 2016 Christopher Robert Philabaum
// Use self-closing anonymous function (using arrow-notation) to avoid flooding the 'namespace'
(() => {
    const TILE_SIZE = 16;
    const RENDER_HEIGHT = 480;
    const RENDER_WIDTH = 640;

    // Only run when the document is fully loaded.
    document.addEventListener("DOMContentLoaded", (event) => {
        let game = new Game();
    }, false);

    class Game {
        constructor() {
            // Append renderer to gameport
            this.gameport = document.getElementById("gameport");
            this.renderer = PIXI.autoDetectRenderer(RENDER_WIDTH, RENDER_HEIGHT, { backgroundColor: 0x000000 });
            gameport.appendChild(this.renderer.view);

            // Add screens
            this.screenMap = new Map();
            this.currentScreen = 'main';
            this.screenMap.set('title', new PIXI.Container());
            this.screenMap.set('tutorial', new PIXI.Container());
            this.screenMap.set('main', new PIXI.Container());
            this.screenMap.set('menu', new PIXI.Container());
            this.screenMap.set('lose', new PIXI.Container());
            this.screenMap.set('win', new PIXI.Container());
            this.screenMap.set('credits', new PIXI.Container());

            this.paused = false;
            // ... Menu code...
            this.screenMap.get('main').addChild(this.screenMap.get('menu'));

            PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;
            PIXI.loader.add('assets/img/assets.json').load(() => {
                this.player = new Player(x);
                this.world;

                document.addEventListener('keydown', (e) => {
                    e.preventDefault();
                    if(this.player.moving || e.repeat)
                        return;

                    this.player.direction = DIRECTION.NONE;
                    switch(e.keyCode) {
                        case(65):
                            this.player.direction = DIRECTION.LEFT;
                            break;
                        case(68):
                            this.player.direction = DIRECTION.RIGHT;
                            break;
                    }

                    this.player.move(TILE_SIZE);
                });

                // Initialize game loop
                this.animate();
            }
        }

        update() {
            // Final step
            this.renderer.render(this.screenMap.get(this.currentScreen));
        }

        animate() {
            this.update();
            requestAnimationFrame(this.animate);
        }

        moveCamera() {
            let x = -player.sprite.x + RENDER_WIDTH / 2 - player.sprite.width / 2;

            this.screenMap.get('main').x = -Match.max(0, Math.min(this.world.worldWidth - RENDER_WIDTH, -x));
        }
    }

    // Abstract class
    class Entity {
        constructor(max) {
            this.moving = false;
            this.MAX_HEALTH = max;
            this.health = this.MAX_HEALTH;
            this.direction = DIRECTION.NONE;
        }

        hurt(dmg) {
            this.health -= dmg;
            if(!this.isAlive) {
                this.die();
            }
        }

        attack(other);
        jump();
        walk();
        die();

        get isAlive() {
            return this.health > 0;
        }

        get danger() {
            return this.health / this.MAX_HEALTH <= 0.1;
        }

        get relative(other) {
            if(this.sprite.x < other.sprite.x) {
                return DIRECTION.RIGHT;
            }
            else {
                return DIRECTION.LEFT;
            }
        }

        move(x) {
            if(this.direction === DIRECTION.NONE) {
                this.moving = false;
                return;
            }

            this.moving = true;
            switch(this.direction) {
                case(DIRECTION.LEFT):
                    createjs.Tween.get(this.sprite).to({x: player.sprite.x - x},
                        500)
                        .call(this.move);
                    break;
                case(DIRECTION.RIGHT):
                    createjs.Tween.get(this.sprite).to({x: player.sprite.x + x},
                        500)
                        .call(this.move);
            }
        }
    }

    class Player extends Entity {
        constructor() {
            super();
            // #TODO Load player sprite from frame
            this.sprite = new PIXI.Sprite();
        }

        jump() {
            // #TODO Is this necessary?
        }

        walk() {
            // #TODO Walk cycle animation
        }

        die() {
            // #TODO Death animation
        }

        // Override
        attack(enemy) {
            enemy.hurt(10);
        }
    }

    class Enemy extends Entity {
        constructor() {
            // #TODO Load enemy sprite.
            this.sprite = new PIXI.Sprite();
        }

        // Override
        attack(player) {
            player.hurt(5);
        }

        follow(player) {
            this.direction = this.relative(player);

            move(Math.trunc(TILE_SIZE / 4));
        }
    }

    const DIRECTION = {
        NONE: 0,
        LEFT: 1,
        RIGHT: 2
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
})();
