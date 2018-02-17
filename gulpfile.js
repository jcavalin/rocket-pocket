var gulp = require("gulp");
var browserify = require("browserify");
var source = require('vinyl-source-stream');
var watchify = require("watchify");
var tsify = require("tsify");
var gutil = require("gulp-util");

var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var buffer = require('vinyl-buffer');

var ghPages = require('gulp-gh-pages');

var paths = {
    pages: ['src/*.html']
};

var destination = 'dist';
var debug = true;
var entries = [
    'src/js/main.ts'
];

var watchedBrowserify = watchify(browserify({
    basedir: '.',
    debug: debug,
    entries: entries,
    cache: {},
    packageCache: {}
}).plugin(tsify));

gulp.task("copy-html", function () {
    return gulp.src(paths.pages)
        .pipe(gulp.dest(destination));
});

gulp.task("copy-lib", function () {
    return gulp.src("node_modules/phaser-ce/build/**/*.{js,map,css,ttf,svg,woff,eot}")
        .pipe(gulp.dest(destination + '/lib'));
});

gulp.task('deploy', function() {
    return gulp.src(gulp.dest(destination + '/**/*'))
        .pipe(ghPages());
});

function bundleWatch() {
    return watchedBrowserify
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(gulp.dest(destination));
}

function bundleUglify() {
    return browserify({
        basedir: '.',
        debug: debug,
        entries: entries,
        cache: {},
        packageCache: {}
    })
        .plugin(tsify)
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(destination));
}

gulp.task("default", ["copy-html", "copy-lib"], bundleWatch);
gulp.task("uglify", ["copy-html", "copy-lib"], bundleUglify);
gulp.task("deploy", ["deploy"]);

watchedBrowserify.on("update", bundleWatch);
watchedBrowserify.on("log", gutil.log);