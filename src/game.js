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
    var game;

    // Only run when the document is fully loaded.
    document.addEventListener("DOMContentLoaded", (event) => {
        game = new Game(render);

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

            this.zones = new Array();
            this.currentZone = 0;

            let main =this.screenMap.get('main');
            main.scale.x = ZOOM;
            main.scale.y = ZOOM;

            this.paused = false;
            // ... Menu code...

            main.addChild(this.screenMap.get('menu'));


            PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;
            PIXI.loader
                .add('zone_json', 'assets/map/zone.json')
                .add('tiles', 'assets/img/tiles/tiles.png')
                .add('assets/assets.json')
                .load(() => {
                    this.world = new PIXI.Container();
                    this.zoneContainer = new PIXI.Container();
                    this.world.addChild(this.zoneContainer);
                    this.addZone();
                    this.worldWidth = this.zones[0].worldWidth;
                    let spawn = this.zones[0].getObject('player_spawn');
                    this.player = new Player(spawn.x, spawn.y);
                    this.world.addChild(this.player.sprite);

                    main.addChild(this.world);

                    this.enemies = new Array();

                    document.addEventListener('keydown', e => {
                        switch(e.keyCode) {
                            case(65):
                            case(68):
                                e.preventDefault();
                                if(!this.player.isAlive || this.player.moving) {
                                    return;
                                }
                                else {
                                    this.player.move_dir = MOVE_DIR.NONE;
                                }
                        }

                        switch(e.keyCode) {
                            // A
                            case(65):
                                this.player.move_dir = MOVE_DIR.LEFT;
                                break;
                            // D
                            case(68):
                                this.player.move_dir = MOVE_DIR.RIGHT;
                                break;
                            // Space
                            case(32):
                                e.preventDefault();
                                this.player.punch();
                                break;
                        }

                        this.player.move();
                    });

                    document.addEventListener('keyup', e => {
                        switch(e.keyCode) {
                            // A
                            case(65):
                            // D
                            case(68):
                                this.player.move_dir = MOVE_DIR.NONE;
                                break;
                            // Space
                            case(32):
                                e.preventDefault();
                        }
                    });

                    // Initialize render loop
                    render();
                });
        }

        update() {
            this.moveCamera();
            this.player.update(this.enemies);
            for(let enemy of this.enemies) {
                if(!enemy.isAlive) {
                    this.world.removeChild(enemy.sprite);
                }
            }
            this.enemies = this.enemies.filter(enemy => enemy.isAlive);
            for(let enemy of this.enemies) {
                enemy.update(this.player);
            }

            let zone = this.getZone();
            if(this.player.x > 0 && !this.zones[zone].entered) {
                this.zones[zone].entered = true;
                this.addZone();


                if(zone > 0) {

                }
            }

            // Final step
            this.renderer.render(this.screenMap.get(this.currentScreen));
        }

        addZone() {
            let zone = tu.makeTiledWorld('zone_json', 'assets/img/tiles/tiles.png');
            zone.zone = this.currentZone;
            zone.entered = false;
            zone.x += zone.worldWidth * this.currentZone++;

            this.spawnEnemies(zone);

            this.zones.push(zone);
            this.zoneContainer.addChild(zone);
        }

        spawnEnemies(zone) {
            let spawn = zone.getObject('enemy_spawn');
            for(let i = 0; i < zone.zone; i++) {
                let enemy = new Enemy(spawn.x + zone.x + getRandomArbitrary(-TILE_SIZE * 2, TILE_SIZE * 2), spawn.y, 100);
                this.enemies.push(enemy);
                this.world.addChild(enemy.sprite);
            }


        }

        moveCamera() {
            let x = -this.player.sprite.x * ZOOM + RENDER_WIDTH / 2 - this.player.sprite.width / 2 * ZOOM;

            this.screenMap.get('main').x = -Math.max(0, -x);
        }

        getZone() {
            return Math.floor(this.player.x / this.zones[0].worldWidth);
        }
    }

    // Abstract class
    class Entity {
        constructor(x, y, max, speed, dir, file_pre) {
            this.moving = false;
            this.punching = false;
            this.speed = speed;
            this.MAX_HEALTH = max;
            this.health = this.MAX_HEALTH;
            this.move_dir = DIRECTION.NONE;
            this.direction = dir;
            this.hasDied = false;

            this.tinted = false;

            this.sprite = new PIXI.Container();
            this.sprite.x = x;
            this.sprite.y = y;

            this.state = STATE.STILL;
            this.direction = DIRECTION.RIGHT;

            this.direction_containers = new Array();
            for(let dir in DIRECTION) {
                this.direction_containers.push(new PIXI.Container());
            }

            this.states = new Array();
            for(let dir of this.direction_containers) {
                let arr = new Array();
                for(let s in STATE) {
                    arr.push(new Array());
                }
                this.states.push(arr);
            }

            this.states[DIRECTION.RIGHT][STATE.STILL] = new PIXI.Sprite(PIXI.Texture.fromFrame(`${file_pre}1.png`));
            this.states[DIRECTION.LEFT][STATE.STILL] = new PIXI.Sprite(PIXI.Texture.fromFrame(`${file_pre}2.png`));
            let frames = new Array();
            for(let f = 3; f <= 6; f++) {
                frames.push(PIXI.Texture.fromFrame(`${file_pre}${f}.png`));
            }
            this.states[DIRECTION.RIGHT][STATE.WALK] = new PIXI.extras.MovieClip(frames);
            this.states[DIRECTION.RIGHT][STATE.WALK].animationSpeed = 0.25;
            this.states[DIRECTION.RIGHT][STATE.WALK].play();

            frames = new Array();
            for(let f = 7; f <= 10; f++) {
                frames.push(PIXI.Texture.fromFrame(`${file_pre}${f}.png`));
            }
            this.states[DIRECTION.LEFT][STATE.WALK] = new PIXI.extras.MovieClip(frames);
            this.states[DIRECTION.LEFT][STATE.WALK].animationSpeed = 0.25;
            this.states[DIRECTION.LEFT][STATE.WALK].play();

            frames = new Array();
            for(let f = 11; f <= 12; f++) {
                frames.push(PIXI.Texture.fromFrame(`${file_pre}${f}.png`));
            }
            this.states[DIRECTION.RIGHT][STATE.ATTACK] = new PIXI.extras.MovieClip(frames);
            this.states[DIRECTION.RIGHT][STATE.ATTACK].animationSpeed = 0.1;
            this.states[DIRECTION.RIGHT][STATE.ATTACK].loop = false;

            frames = new Array();
            for(let f = 13; f <= 14; f++) {
                frames.push(PIXI.Texture.fromFrame(`${file_pre}${f}.png`));
            }
            this.states[DIRECTION.LEFT][STATE.ATTACK] = new PIXI.extras.MovieClip(frames);
            this.states[DIRECTION.LEFT][STATE.ATTACK].animationSpeed = 0.1;
            this.states[DIRECTION.RIGHT][STATE.ATTACK].loop = false;

            for(let dir in DIRECTION) {
                for(let state in STATE) {
                    this.direction_containers[DIRECTION[dir]].addChild(this.states[DIRECTION[dir]][STATE[state]]);
                }

                this.sprite.addChild(this.direction_containers[DIRECTION[dir]]);
            }
        }

        hurt(dmg) {
            this.health -= dmg;
            this.damaged = true;
        }

        attack(other) {};
        jump() {};
        walk() {};
        die() {
            this.hasDied = true;
        };
        update() {
            if(this.punching && this.state !== STATE.ATTACK) {
                this.state = STATE.ATTACK;
            }
            else if(this.moving) {
                this.state = STATE.WALK;
            }
            else {
                this.state = STATE.STILL;
            }
            switch(this.move_dir) {
                case(MOVE_DIR.LEFT):
                    this.direction = DIRECTION.LEFT;
                    break;
                case(MOVE_DIR.RIGHT):
                    this.direction = DIRECTION.RIGHT;
                    break;
            }

            for(let dir in DIRECTION) {
                this.direction_containers[DIRECTION[dir]].visible = DIRECTION[dir] === this.direction;
                for(let state in STATE) {
                    this.states[DIRECTION[dir]][STATE[state]].visible = STATE[state] === this.state;
                }
            }

            if(this.state === STATE.ATTACK) {
                this.states[this.direction][this.state].play();
                this.punching = false;
            }

            if(this.damaged) {
                this.damaged = false;
                for(let dir in DIRECTION) {
                    for(let state in STATE) {
                        this.states[DIRECTION[dir]][STATE[state]].tint = 0xCC0000;
                        window.setTimeout(() => {
                            this.states[DIRECTION[dir]][STATE[state]].tint = 0xFFFFFF;
                        }, 100);
                    }
                }
            }

            if(!this.isAlive && !this.hasDied) {
                this.die();
            }

            if(!this.isAlive && this.sprite.alpha > 0) {
                this.sprite.alpha -= 0.05;
            }
        };

        punch() {
            if(this.punching)
                return;
            this.punching = true;
        }

        get isAlive() {
            return this.health > 0;
        }

        get danger() {
            return this.health / this.MAX_HEALTH <= 0.1;
        }

        getRelativeDir(other) {
            if(this.x < other.x) {
                return DIRECTION.RIGHT;
            }
            else {
                return DIRECTION.LEFT;
            }
        }

        move() {
            if(!this.move_dir || this.move_dir === MOVE_DIR.NONE) {
                this.moving = false;
                return;
            }

            // if(this.x < 0) {
            //     this.x = TILE_SIZE;
            //     this.moving = false;
            //     this.move_dir = MOVE_DIR.NONE;
            //     return;
            // }

            this.moving = true;
            switch(this.move_dir) {
                case(MOVE_DIR.LEFT):
                    createjs.Tween.get(this.sprite).to({x: this.sprite.x - TILE_SIZE / 2},
                        100 / this.speed)
                        .call(() => {
                            this.move();
                        });
                    break;
                case(MOVE_DIR.RIGHT):
                    createjs.Tween.get(this.sprite).to({x: this.sprite.x + TILE_SIZE / 2},
                        100 / this.speed)
                        .call(() => {
                            this.move();
                        });
            }
        }

        // Bounding box method.
        collide(other) {
            return Math.abs(this.x - other.x) < TILE_SIZE
            && Math.abs(this.y - other.y) < TILE_SIZE;
        }

        get x() {
            return this.sprite.x;
        }

        set x(value) {
            return Math.max(0, value);
        }

        get y() {
            return this.sprite.y;
        }
    }

    class Player extends Entity {
        constructor(x, y) {
            super(x, y, 100, 1, DIRECTION.RIGHT, 'player');
        }

        update(enemies) {
            super.update();

            if(this.punching) {
                for(let enemy of enemies) {
                    if(this.collide(enemy)) {
                        this.attack(enemy);
                    }
                }
            }
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
            enemy.hurt(25);
        }
    }

    class Enemy extends Entity {
        constructor(x, y, max) {
            super(x, y, max, 0.5, DIRECTION.LEFT, 'enemy');
            this.timer_flag = false;
        }

        // Override
        attack(player) {
            player.hurt(2);
        }

        update(player) {
            super.update();

            let isColliding = this.collide(player);
            if(!this.moving && !isColliding) {
                this.follow(player);
            }
            else {
                this.move_dir = MOVE_DIR.NONE;
                if(isColliding && !this.timer_flag && player.isAlive) {
                    this.timer_flag = true;
                    this.punch();
                    this.attack(player);
                    console.log(player.health);
                    window.setTimeout(() => {
                        this.timer_flag = false;
                    }, 1000)
                }
            }
        }

        follow(player) {
            switch(this.getRelativeDir(player)) {
                case(DIRECTION.LEFT):
                    this.move_dir = MOVE_DIR.LEFT;
                    break;
                case(DIRECTION.RIGHT):
                    this.move_dir = MOVE_DIR.RIGHT;
                    break;
            }

            this.move();
        }
    }

    const STATE = {
        STILL: 0,
        WALK: 1,
        ATTACK: 2
    }

    const MOVE_DIR = {
        NONE: 0,
        LEFT: 1,
        RIGHT: 2
    }

    const DIRECTION = {
        LEFT: 0,
        RIGHT: 1
    }

    // Returns a random number between min (inclusive) and max (exclusive)
    function getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
})();
