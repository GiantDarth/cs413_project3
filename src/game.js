'use strict';
// Copyright (c) 2016 Christopher Robert Philabaum
// Use self-closing anonymous function (using arrow-notation) to avoid flooding the 'namespace'
(() => {
    // Only run when the document is fully loaded.
    document.addEventListener("DOMContentLoaded", (event) => {
        var game = new Game();

        // Self-execute animate
        (function animate() {
            game.update();
            requestAnimationFrame(animate);
        })();
    }, false);

    class Game {
        constructor() {
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

            PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;
            PIXI.loader.add('assets/img/assets.json').load(() => {
            }
        }

        update() {
            this.renderer.render(this.screenMap.get(this.currentScreen));
        }
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
})();
