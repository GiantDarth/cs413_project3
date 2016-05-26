'use strict';
// Copyright (c) 2016 Christopher Robert Philabaum
// Use self-closing anonymous function (using arrow-notation) to avoid flooding the 'namespace'
(() => {
    const TILE_SIZE = 16;
    const TILE_VIEW = 12;
    const MAP_HEIGHT = 5;
    const ZOOM = 4;
    var RENDER_WIDTH, RENDER_HEIGHT;

    var tu = new TileUtilities(PIXI);

    // Only run when the document is fully loaded.
    document.addEventListener("DOMContentLoaded", (event) => {
        let game = new Game(render);

        function render() {
            game.update();
            requestAnimationFrame(render);
        }
    }, false);

    class Game {
        constructor(render) {
            RENDER_HEIGHT = TILE_SIZE * ZOOM * MAP_HEIGHT;
            RENDER_WIDTH = TILE_SIZE * ZOOM * TILE_VIEW;

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
            let main =this.screenMap.get('main');
            main.addChild(this.screenMap.get('menu'));
            main.scale.x = ZOOM;
            main.scale.y = ZOOM;

            PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;
            PIXI.loader
                .add('zone_json', 'assets/map/zone.json')
                .add('tiles', 'assets/img/tiles/tiles.png')
                .add('assets/assets.json')
                .load(() => {
                    console.log('no')
                    this.world = tu.makeTiledWorld('zone_json', 'assets/img/tiles/tiles.png');
                    console.log('yes')
                    main.addChild(this.world);

                    this.player = new Player(this.world.getObject('player_spawn'),
                        100, 1);
                    this.world.addChild(this.player.sprite);

                    document.addEventListener('keydown', e => {
                        switch(e.keyCode) {
                            case(65):
                            case(68):
                                if(!this.player.isAlive || this.player.moving || e.repeat)
                                    return;
                        }

                        this.player.move_dir = DIRECTION.NONE;
                        switch(e.keyCode) {
                            case(65):
                                e.preventDefault();
                                this.player.move_dir = DIRECTION.LEFT;
                                break;
                            case(68):
                                e.preventDefault();
                                this.player.move_dir = DIRECTION.RIGHT;
                                break;
                        }

                        this.player.move(1);
                    });

                    document.addEventListener('keyup', e => {
                        switch(e.keyCode) {
                            case(65):
                            case(68):
                                e.preventDefault();
                        }
                        this.player.move_dir = DIRECTION.NONE;
                    });

                    // Initialize render loop
                    render();
                });
        }

        update() {
            // Final step
            this.renderer.render(this.screenMap.get(this.currentScreen));
        }

        moveCamera() {
            let x = -player.sprite.x * ZOOM + RENDER_WIDTH / 2 - player.sprite.width / 2 * ZOOM;

            this.screenMap.get('main').x = -Match.max(0, Math.min(this.world.worldWidth * ZOOM - RENDER_WIDTH, -x));
        }
    }

    // Abstract class
    class Entity {
        constructor(max, speed) {
            this.moving = false;
            this.speed = speed;
            this.MAX_HEALTH = max;
            this.health = this.MAX_HEALTH;
            this.move_dir = DIRECTION.NONE;
            this.direction = DIRECTION.NONE;
        }

        hurt(dmg) {
            this.health -= dmg;
            if(!this.isAlive) {
                this.die();
            }
        }

        attack(other) {};
        jump() {};
        walk() {};
        die() {};

        get isAlive() {
            return this.health > 0;
        }

        get danger() {
            return this.health / this.MAX_HEALTH <= 0.1;
        }

        getRelativeDir(other) {
            if(this.sprite.x < other.sprite.x) {
                return DIRECTION.RIGHT;
            }
            else {
                return DIRECTION.LEFT;
            }
        }

        move(x) {
            console.log(this.move_dir);
            if(this.move_dir === DIRECTION.NONE) {
                this.moving = false;
                return;
            }

            this.moving = true;
            switch(this.move_dir) {
                case(DIRECTION.LEFT):
                    createjs.Tween.get(this.sprite).to({x: this.sprite.x - x * this.speeed * TILE_SIZE},
                        500)
                        .call(this.move, [x]);
                    break;
                case(DIRECTION.RIGHT):
                    createjs.Tween.get(this.sprite).to({x: this.sprite.x + x * this.speed * TILE_SIZE},
                        500)
                        .call(this.move, [x]);
            }
        }
    }

    class Player extends Entity {
        constructor(spawn, max, speed) {
            super(max, speed);
            // #TODO Load player sprite from frame
            this.sprite = new PIXI.Container();
            this.sprite.x = spawn.x;
            this.sprite.y = spawn.y;

            this.direction = DIRECTION.RIGHT;

            this.stillAnim = new PIXI.Sprite(PIXI.Texture.fromFrame('player1.png'));
            this.sprite.addChild(this.stillAnim);
            let frames = new Array();
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
        constructor(enemy_spawn, max, speed) {
            super(max, speed)
            // #TODO Load enemy sprite.
            this.sprite = new PIXI.Sprite();
            this.direction = DIRECTION.LEFT;
        }

        // Override
        attack(player) {
            player.hurt(5);
        }

        follow(player) {
            this.direction = this.getRelativeDir(player);

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
