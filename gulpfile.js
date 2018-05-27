/* Namespace and sub-folders for Demo project */
var namespace = 'demo-project';
var folders = ['commons'];

/* Requires */
var gulp        = require('gulp'),
    watch       = require('gulp-watch'),
    // Utilities
    gutil       = require('gulp-util'),
    plumber     = require('gulp-plumber'),
    slang       = require('gulp-slang'),
    debug       = require('gulp-debug'),
    options     = require('gulp-options'),
    gulpif      = require('gulp-if'),

// Styles
    sass        = require('gulp-sass'),
    sourcemaps  = require('gulp-sourcemaps'),
    // Scripts
    eslint      = require('gulp-eslint');

/**
 * Helper: eachFolder
 * Iterate each folder and add path to this folder
 *
 * @param {String} path - Path to be added into each folder array.
 * @param {String} prefixPath - prefixPath to be added into each folder array.
 * @return {Array} newFolders - Return new array with new folders paths.
 */
function eachFolder(prefixPath, path){
    var newFolders = folders.map(function (val, index) {
        return prefixPath + val + '/' + path
    })
    return newFolders;
}


/**
 * Options
 */

function Options() {
    var opts = {
        prod:false,
        debug:false,
        env:'local'
    }
    if (options.has('env')) {
        opts.env = options.get('env');
    }
    if (options.has('debug')) {
        opts.debug = options.get('debug');
    }

    if (options.has('prod')) {
        opts.prod = options.get('prod');
    }


    return opts;
}

/* Paths */
var root        = 'ui.apps/src/main/content/jcr_root/',
    components  = eachFolder(root + 'apps/' + namespace + '/' , 'components/'),
    designs     = root + 'etc/designs/' + namespace + '/',
    clientlibs  = root + 'etc/clientlibs/' + namespace + '/';

// Styles

var cssPath     = eachFolder(clientlibs,'site/css/'),
    sassPath    = eachFolder(clientlibs,'site/scss/'),
    sassVendorPath = eachFolder(clientlibs,'site/scss/vendors'),
    mainCss     = eachFolder(clientlibs,'site/styles/main.scss'),
    cssBuild    = eachFolder(clientlibs,'site/css/main.css'),
    cssSrcMaps  = eachFolder(clientlibs,'site/css/main.css.map');

// Scripts
var jsPath      = eachFolder(clientlibs,'site/js/internal/'),
    vendorPath  = eachFolder(clientlibs,'site/js/external/'),

    // Images
    imgPath     = designs + 'images/';

/**
 * Helper: changeNotification
 * Logs an event to the console.
 *
 * @param {String} fType - The file type that was changed.
 * @param {String} eType - The event that occured.
 * @param {String} msg - Short description of the actions that are being taken.
 */

function changeNotification(fType, eType, msg) {
    gutil.log(gutil.colors.cyan.bold(fType), 'was', gutil.colors.yellow.bold(eType) + '.', msg);
}

/**
 * Task: `sass:build`
 * Compiles the sass and writes sourcemaps.
 */
gulp.task('sass:build', function () {
    return mainCss.forEach(function (maincss, index) {
        if (Options().debug){
            gutil.log('File ' + gutil.colors.cyan.bold(maincss));
        }
        var compressed = 'compressed';
        if (Options().debug){
            compressed = 'expanded';
        }

        return gulp.src(maincss)
            .pipe(plumber()) // Prevents pipe breaking due to error (for watch task)
            .pipe(sourcemaps.init())
            .pipe(sass({
                outputStyle: compressed,
                omitSourceMapUrl: true, // This is hardcoded in the main.scss due to resource path issues
                includePaths: [sassPath[index], components]
            }).on('error', sass.logError))
            .pipe(sourcemaps.write('./', {
                addComment: false
            }))
            .pipe(plumber.stop())
            .pipe(gulpif(Options().debug == 'true',debug()))
            .pipe(gulp.dest(cssPath[index]));
    })

});

/**
 * Task: `sass:sling`
 * Slings the compiled stylesheet and sourcemaps to AEM.
 */
gulp.task('sass:sling', ['sass:build'], function () {
    var cssFiles = cssBuild.concat();
    return gulp.src(cssFiles)
        .pipe(slang());
});

/**
 * Task: `sass`
 * Runs the sass build and slings the results to AEM.
 */
gulp.task('sass', ['sass:build', 'sass:sling']);

/**
 * Task: `js:lint`
 * Lints project JS, excluding vendor libs.
 */
gulp.task('js:lint', function () {
    var jslintPaths = components.concat(jsPath);
    jslintPaths = jslintPaths.map(function(path, index) {
        return path + '**/*.js';
    });

    return gulp.src(jslintPaths)
        .pipe(eslint({
            "rules": {
                "linebreak-style": [
                    "error",
                    "windows"
                ]
            }
        }))
        .pipe(eslint.format())
        .pipe(eslint.results(function(results) {
            // Called once for all ESLint results.
            console.log('Total Results: ' + results.length);
            console.log('Total Warnings: ' + results.warningCount);
            console.log('Total Errors: ' + results.errorCount);
        }))
        .pipe(eslint.failAfterError());
});

/**
 * Task: `bs4`
 * Copy Boostrap 4 and dependencies into the project
 */
gulp.task('bs4:sass', function () {
    return gulp.src(['node_modules/bootstrap/scss/**/*'])
        .pipe(gulp.dest(sassVendorPath[3] + '/bs4'))
});




/**
 * Task: `watch`
 * Watches the HTML, Sass, and JS for changes. On a file change,
 * will run builds file-type dependently and sling the new files
 * up to AEM.
 */
gulp.task('watch', function () {
    gutil.log('Waiting for changes.');

    // Set up our streams
    var jsWatchPath = components.concat(jsPath);
    jsWatchPath = jsWatchPath.map(function(path, index){
        return path + '**/*.js'
    });

    var sassWatchPath = components.concat(sassPath);
    sassWatchPath = sassWatchPath.map(function(path, index){
        return path + '**/*.scss'
    });
    sassWatchPath.concat(mainCss);

    var markupWatchPath = components.map(function(path, index){
        return path + '**/**/*.html'
    });
    markupWatchPath = markupWatchPath.concat(components.map(function(path, index){
        return path + '**/**/*.jsp'
    }))


    var jsWatch = gulp.watch(jsWatchPath, ['js:lint']),
        sassWatch = gulp.watch(sassWatchPath, ['sass']),
        markupWatch = gulp.watch(markupWatchPath),
        imgWatch = gulp.watch([imgPath + '**/*']),
        htmlWatch = gulp.watch([components + '**/*.html']);

    // js needs to be linted
    jsWatch.on('change', function (ev) {
        changeNotification('JS file', ev.type, 'Linting code & slinging to AEM.');

        return gulp.src(ev.path)
            .pipe(slang(ev.path));
    });

    // Sass needs to get built and slung up
    sassWatch.on('change', function (ev) {
        changeNotification('Sass file', ev.type, 'Running compilation & slinging to AEM.');

        return gulp.src(ev.path)
            .pipe(slang(ev.path));
    });


    // Markup just needs to be slung to AEM
    markupWatch.on('change', function (ev) {
        changeNotification('Sightly file', ev.type, 'Slinging file to AEM.');

        return gulp.src(ev.path)
            .pipe(slang(ev.path));
    });

    // Images just need to be slung to AEM\
    imgWatch.on('change', function (ev) {
        changeNotification('Image file', ev.type, 'Slinging file to AEM.');

        return gulp.src(ev.path)
            .pipe(slang(ev.path));
    });

    // Images just need to be slung to AEM
    htmlWatch.on('change', function (ev) {
        changeNotification('html file', ev.type, 'Slinging file to AEM.');

        return gulp.src(ev.path)
            .pipe(slang(ev.path));
    });
});


gulp.task('build', ['bs4:sass' ,'sass:build','js:lint']);

gulp.task('default', ['build']);
