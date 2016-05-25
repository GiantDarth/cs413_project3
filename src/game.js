'use strict';
// Copyright (c) 2016 Christopher Robert Philabaum
// Use self-closing anonymous function (using arrow-notation) to avoid flooding the 'namespace'
(() => {
    // Only run when the document is fully loaded.
    document.addEventListener("DOMContentLoaded", (event) => {
        var game = new Game(15);

        // Self-execute animate
        (function animate() {
            game.update();
            requestAnimationFrame(animate);
        })();
    }, false);

    class Game {
        constructor(gridSize) {
            // Number of tiles for grid
            this.GRID_SIZE = gridSize;

            this.TILE_SIZE = 32;
            this.RENDER_ASPECT_RATIO = 4 / 3;
            this.RENDER_HEIGHT = this.GRID_SIZE * this.TILE_SIZE;
            this.RENDER_WIDTH = Math.floor(this.RENDER_HEIGHT * this.RENDER_ASPECT_RATIO);
            this.SIDE_OFFSET = Math.floor((this.RENDER_WIDTH - this.RENDER_HEIGHT) / 2);

            // Append renderer to gameport
            this.gameport = document.getElementById("gameport");
            this.renderer = PIXI.autoDetectRenderer(this.RENDER_WIDTH, this.RENDER_HEIGHT, { backgroundColor: 0x000000 });
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
            this.screenMap.get('main').addChild(this.screenMap.get('menu'))

            this.tiles = new Array();
            this.pipes = new Array();
            for(let p = 0; p < this.GRID_SIZE; p++) {
                this.pipes.push(new Array(this.GRID_SIZE));
            }

            PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;
            PIXI.loader.add('assets/img/assets.json').load(() => {
                this.currentPipe = { type: Object.keys(PipeType)[getRandomInt(0, Object.keys(PipeType).length)],
                    container: new PIXI.Container()
                };

                this.currentPipe.status = new Pipe(this.currentPipe.type);
                this.currentPipe.status.sprite.position.x = this.RENDER_WIDTH - this.SIDE_OFFSET / 2;
                this.currentPipe.status.sprite.position.y = this.TILE_SIZE * 4;
                this.currentPipe.status.sprite.children.forEach(c => { c.anchor.x = 0.5, c.anchor.y = 0.5 });

                this.currentPipe.hover = new Pipe(this.currentPipe.type);
                this.currentPipe.hover.sprite.children.forEach(c => { c.anchor.x = 0.5, c.anchor.y = 0.5 });
                this.currentPipe.hover.sprite.interactive = true;
                this.currentPipe.hover.sprite.alpha = 0.6;
                this.currentPipe.hover.sprite.on('mousemove', (e) => {
                    let coords = this.getTileCoordsFromMouse(e.data.global.x, e.data.global.y);
                    let pos = this.getPosFromTileCoords(coords.i, coords.j);

                    this.currentPipe.hover.sprite.position.x = pos.x + Math.floor(this.TILE_SIZE / 2);
                    this.currentPipe.hover.sprite.position.y = pos.y + Math.floor(this.TILE_SIZE / 2);
                });

                this.currentPipe.hover.sprite.on('mouseup', (e) => {
                    let coords = this.getTileCoordsFromMouse(e.data.global.x, e.data.global.y);

                    if(!this.pipes[coords.i][coords.j]) {
                        let pipe = new Pipe(this.currentPipe.type);
                        pipe.sprite.rotation = this.currentPipe.hover.sprite.rotation;
                        pipe.sprite.children.forEach(c => { c.anchor.x = 0.5, c.anchor.y = 0.5 });
                        pipe.sprite.position.x += Math.floor(this.TILE_SIZE / 2);
                        pipe.sprite.position.y += Math.floor(this.TILE_SIZE / 2);
                        this.pipes[coords.i][coords.j] = pipe
                        this.tiles[coords.i][coords.j].getChildAt(0).addChild(pipe.sprite);

                        let type = Object.keys(PipeType)[getRandomInt(0, Object.keys(PipeType).length)];
                        // Generate new type
                        this.currentPipe.type = Object.keys(PipeType)[getRandomInt(0, Object.keys(PipeType).length)];

                        this.currentPipe.status.setType(this.currentPipe.type);
                        this.currentPipe.hover.setType(this.currentPipe.type);

                        this.currentPipe.status.sprite.children.forEach(c => { c.anchor.x = 0.5, c.anchor.y = 0.5 });
                        this.currentPipe.hover.sprite.children.forEach(c => { c.anchor.x = 0.5, c.anchor.y = 0.5 });
                    }
                });

                let grid = new PIXI.Container();
                for(let x = 0; x < this.GRID_SIZE; x++) {
                    this.tiles.push(new Array(this.GRID_SIZE));

                    for(let y = 0; y < this.GRID_SIZE; y++) {
                        let tile = new PIXI.Container();

                        // Set pixel-based position
                        tile.position.x = this.SIDE_OFFSET + (x * this.TILE_SIZE);
                        tile.position.y = y * this.TILE_SIZE;

                        // Set overlay for tile.
                        let overlay = new PIXI.Sprite(PIXI.Texture.fromFrame('grid.png'));

                        tile.addChild(overlay);
                        this.tiles[x][y] = tile;

                        grid.addChild(tile);
                    }
                }

                this.screenMap.get('main').addChild(grid);

                this.currentPipe.container.addChild(this.currentPipe.status.sprite);
                this.currentPipe.container.addChild(this.currentPipe.hover.sprite);

                this.screenMap.get('main').addChild(this.currentPipe.container);
            });

            document.addEventListener('keydown', (e) => {
                switch(e.keyCode) {
                    case(82):
                        if(this.currentPipe) {
                            this.currentPipe.status.sprite.rotation += Math.PI / 2;
                            this.currentPipe.hover.sprite.rotation += Math.PI / 2;
                        }
                    case(13):
                        if(this.currentScreen === 'title') {
                        }
                }
            });
        }

        update() {
            this.renderer.render(this.screenMap.get(this.currentScreen));
        }

        getTileCoordsFromMouse(x, y) {
            let i = Math.floor((x - this.SIDE_OFFSET) / this.TILE_SIZE);
            let j = Math.floor(y / this.TILE_SIZE);
            return {i: i < 0 ? 0 : i >= this.GRID_SIZE ? this.GRID_SIZE - 1 : i,
                j: j < 0 ? 0 : j >= this.GRID_SIZE ? this.GRID_SIZE - 1 : j
            };
        }

        getPosFromTileCoords(i, j) {
            return { x: i * this.TILE_SIZE + this.SIDE_OFFSET, y: j * this.TILE_SIZE };
        }
    }

    class Pipe {
        constructor(type) {
            this.sprite = new PIXI.Container();
            this.empty = false;
            this.setType(type);
        }

        swapEmpty() {
            this.flowAnim.visible = !this.flowAnim.visible;
            this.emptySprite.visible = !this.emptySprite.visible;
            this.empty = !this.empty;
        }

        setType(type) {
            this.type = type;

            let flowFrames = new Array();
            switch(this.type) {
                case(PipeType.CORNER):
                    this.emptySprite = new PIXI.Sprite(PIXI.Texture.fromFrame('pipe_corner1.png'));
                    for(let f = 1; f <= 8; f++) {
                        flowFrames.push(PIXI.Texture.fromFrame(`pipe_corner${f}.png`));
                    }
                    break;
                case(PipeType.STRAIGHT):
                default:
                    this.emptySprite = new PIXI.Sprite(PIXI.Texture.fromFrame('pipe_straight1.png'));
                    for(let f = 1; f <= 8; f++) {
                        flowFrames.push(PIXI.Texture.fromFrame(`pipe_straight${f}.png`));
                    }
                    break;
            }

            this.flowAnim = new PIXI.extras.MovieClip(flowFrames);
            this.flowAnim.animationSpeed = 0.2;
            this.flowAnim.play();

            this.sprite.removeChildren();

            this.emptySprite.visible = !this.empty;
            this.flowAnim.visible = this.empty;

            this.sprite.addChild(this.emptySprite);
            this.sprite.addChild(this.flowAnim);
        }
    }

    // Treated as an enum.
    const PipeType = {
        STRAIGHT: 'STRAIGHT',
        CORNER: 'CORNER'
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
})();
