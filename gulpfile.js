// main
const {
  dest, parallel, src, watch, series,
} = require('gulp');
const rename = require('gulp-rename');
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');

// server
const fs = require('fs');
const browserify = require('gulp-bro');
const sync = require('browser-sync').create();
const notify = require('gulp-notify');

// js
const babelify = require('babelify');
const ts = require('gulp-typescript');
const uglJS = require('gulp-uglify');

// fonts
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');
const svg = require('gulp-svg-sprite');

// scss
const csso = require('gulp-csso');
const prefix = require('gulp-autoprefixer');
const gcmq = require('gulp-group-css-media-queries');
const sass = require('gulp-sass');

// pug
const pug = require('gulp-pug');
const data = require('gulp-data');
const mergeData = require('gulp-merge-json');

// media
const imgMin = require('gulp-imagemin');
const pngQuant = require('imagemin-pngquant');
const webp = require('gulp-webp');

// vars
const isProd = (process.env.NODE_ENV === 'prod');
const root = {
  dev: './app/',
  prod: './docs/',
};
const assetsURI = `${root.dev}assets/`;
const dev = {
  fonts: `${assetsURI}fonts/**/*.ttf`,
  img: `${assetsURI}img/**/*.+(png|jpg|jpeg)`,
  webp: `${assetsURI}webp/**/*.+(png|jpg|jpeg)`,
  svg: `${assetsURI}svg/*.svg`,
  scripts: `${assetsURI}ts/*.ts`,
  merged_data: `${assetsURI}data/data.json`,
  no_merged_data: `${root.dev}**/data.json`,
  pages: `${root.dev}pages/*.pug`,
  libs: `${root.dev}libs/libs.js`,
  scss: `${root.dev}scss/main.scss`,
};
const prod = {
  scripts: `${root.prod}js`,
  media: `${root.prod}img`,
  css: `${root.prod}css`,
  fonts: `${root.prod}fonts`,
};
// --------------- Таски на сборку ----------------- //

/* Работа со шрифтами */
const getWoffFonts = () => {
  return src(dev.fonts)
    .pipe(ttf2woff())
    .pipe(sync.stream())
    .pipe(dest(prod.fonts));
};

const getWoff2Fonts = () => {
  return src(dev.fonts)
    .pipe(ttf2woff2())
    .pipe(sync.stream())
    .pipe(dest(prod.fonts));
};
/* Работа со шрифтами */

/* Работа с иконками и картинками */
const getSVGSprite = () => {
  return src(dev.svg)
    .pipe(svg({
      mode: {
        stack:   {
          sprite: '../sprite.svg',
        },
        symbol:  false,
        padding: 0,
      },
    }))
    .pipe(sync.stream())
    .pipe(dest(prod.media));
};

const getWEBPImages = () => {
  return src(dev.webp)
    .pipe(imgMin({
      interlaced: true,
      progressive: true,
      svgoPlugins: {
        removeViewBox: false,
      },
      verbose:     true,
      use:         pngQuant(),
    }))
    .pipe(webp())
    .pipe(sync.stream())
    .pipe(dest(prod.media));
};

const getImages = () => {
  return src(dev.img)
    .pipe(imgMin({
      interlaced: true,
      progressive: true,
      svgoPlugins: {
        removeViewBox: false,
      },
      verbose:     true,
      use:         pngQuant(),
    }))
    .pipe(sync.stream())
    .pipe(dest(prod.media));
};
/* Работа с иконками и картинками */

/* Работа с библиотеками  */
const getLibs = () => {
  return src(dev.libs, {
    allowEmpty: true,
  })
    .pipe(browserify({
      transform: [
        babelify.configure({
          presets: ['@babel/env'],
        }),
      ],
    }))
    .pipe(rename('libs.min.js'))
    .pipe(uglJS())
    .pipe(dest(prod.scripts));
};
/* Работа с библиотеками  */

/* Работа со скриптами */
const getJS = () => {
  return src(dev.scripts)
    .pipe(concat('app.min.ts'))
    .pipe(ts({
      outFile: 'app.min.js',
    }))
    .pipe(uglJS())
    .pipe(dest(prod.scripts));
};
/* Работа со скриптами */

/* Работа со стилями */
const getStyles = () => {
  if (!isProd) {
    return src(dev.scss)
      .pipe(sourcemaps.init())
      .pipe(sass({
        outputStyle: 'expanded',
      }).on('error', notify.onError()))
      .pipe(prefix([
        '> 1%',
        'ie 8',
        'ie 7',
        'last 15 versions',
      ]))
      .pipe(rename({
        basename: 'styles',
        suffix: '.min',
      }))
      .pipe(gcmq())
      .pipe(sourcemaps.write('.'))
      .pipe(sync.stream())
      .pipe(dest(prod.css));
  } else {
    return src(dev.scss)
      .pipe(sass({
        outputStyle: 'expanded',
      }).on('error', notify.onError()))
      .pipe(prefix([
        '> 1%',
        'ie 8',
        'ie 7',
        'last 15 versions',
      ]))
      .pipe(rename({
        basename: 'styles',
        suffix:   '.min',
      }))
      .pipe(gcmq())
      .pipe(csso())
      .pipe(dest(prod.css));
  }
};
/* Работа со стилями */

/* Работа с шаблонизатором */
const getData = () => {
  return src([dev.no_merged_data, `!${dev.merged_data}`])
    .pipe(mergeData({
      fileName: 'data.json',
    }))
    .pipe(dest(`${root.dev}assets/data`));
};

const getHTML = () => {
  return src(dev.pages)
    .pipe(data(() => JSON.parse(fs.readFileSync(dev.merged_data, 'utf-8'))))
    .pipe(pug({
      pretty: !isProd,
      locals: dev.merged_data,
    }))
    .pipe(sync.stream())
    .pipe(dest(root.prod));
};
/* Работа с шаблонизатором */

/* работа с localhost */
const watchFiles = () => {
  sync.init({
    server: {
      baseDir: root.prod,
      serveStaticOptions: {
        extensions: ['html'],
      },
    },
    notify: false,
  });

  watch(dev.fonts, parallel([getWoffFonts, getWoff2Fonts]));
  watch(dev.svg, getSVGSprite);
  watch(dev.img, getImages);
  watch(dev.webp, getWEBPImages);
  watch(dev.scripts, getJS);
  watch(`${root.dev}libs/**/*.ts`, getLibs);
  watch([`${root.dev}**/*.scss`, 'uiKit/**/*.scss'], getStyles);
  watch([dev.no_merged_data, `!${dev.merged_data}`], getData);
  watch([`${root.dev}**/*.pug`, dev.merged_data], getHTML);
};

const getAssets = series([
  parallel(getWoffFonts, getWoff2Fonts),
  parallel(getSVGSprite, getWEBPImages, getImages),
  parallel(getLibs, getJS, getStyles),
  series(getData, getHTML),
]);
/* работа с localhost */

/* Работа с изначальной сборкой проекта */
const buildProd = series([getAssets, watchFiles]);
/* Работа с изначальной сборкой проекта */

/* Таски проекта */
exports.build = buildProd;
exports.default = watchFiles;
/* Таски проекта */
