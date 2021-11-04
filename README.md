# juejin-post-tracker

This template should help get you started developing Tampermonkey UserScript.

- Support ESNext and ES Modules
- Support CSS Modules and sass, scss, less, stylus
- Support SVG Sprite
- Support deal with static resources
- Support international languages
- It's build with rollup, thus you can add external plugins to achieve needed helpers

## Settings

### How to use CSS Processor(sass, scss, less, stylus)?

Install corresponding dependency:

- For Sass install node-sass: yarn add node-sass --dev
- For Stylus Install stylus: yarn add stylus --dev
- For Less Install less: yarn add less --dev

That's it, you can now import .styl .scss .sass .less files in your library.

([Follow this guide](https://www.npmjs.com/package/rollup-plugin-postcss/v/2.4.1#with-sassstylusless))

### How to add SVG to Sprite?

Settle the svg file to + `src/svg`folder, and import it to sprite.js.

### How to add plugins to rollup?

Config it in `src/rollup_configs/default.js`.

## Project Setup

```sh
yarn
```

### Watch and Compile for Development

```sh
yarn dev
```

### Type-Check, Compile and Minify for Production

```sh
yarn build
```
