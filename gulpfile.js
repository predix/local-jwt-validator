'use strict';

// generator polyfill: https://github.com/babel/babel/issues/303#issuecomment-67113831
require('babel/polyfill');

var gulp             = require('gulp'),
    gutil            = require('gulp-util'),
    plumber          = require('gulp-plumber'),
    exit             = require('gulp-exit'),
    eslint           = require('gulp-eslint'),
    mocha            = require('gulp-mocha'),
    istanbul         = require('gulp-istanbul'),
    coverageEnforcer = require('gulp-istanbul-enforcer'),
    isparta          = require('isparta');

var paths = {
  src:      ['lib/*.js', 'index.js'],
  specs:    ['specs/*.js'],
  all:      ['lib/*.js', 'specs/*.spec.js', 'index.js'],
  coverage: 'coverage'
};

function logError(error) {
  gutil.log(gutil.colors.red('Error(s) were thrown by ' + error.plugin + ': \n' + error.message));
}

// Overwrite gulp.src to eliminate the need of adding the error handlers to each task
// See: https://www.timroes.de/2015/01/06/proper-error-handling-in-gulp-js/
var gulpSrc = gulp.src;
gulp.src = function() {
  return gulpSrc.apply(gulp, arguments)
    .pipe(plumber(function(error) {
      // Output an error message
      logError(error);
      // emit the end event, to properly end the task
      this.emit('end');
    }));
};

gulp.task('lint', function () {
  return gulp.src(paths.all)
    // run eslint
    .pipe(eslint({ useEslintrc: true }))
    // output results to console
    .pipe(eslint.format());
    // exit with an error code if lint issues are found
});

gulp.task('test', function() {
  gulp.src(paths.specs, {read: false})
    // Run mocha tests
    .pipe(mocha({reporter: 'spec'}))
    // Some plugins, like gulp-mocha, have problems terminating after a task is finished.
    // Using exit() guarantees that the task will terminate successfully.
    .pipe(exit());
});

gulp.task('coverage', function() {
  gulp.src(paths.src)
    // Instrument source code for code coverage
    .pipe(istanbul({
      instrumenter:    isparta.Instrumenter,
      includeUntested: true
    }))
    // Force `require` to return covered files
    .pipe(istanbul.hookRequire())
    .on('finish', function() {
      gulp.src(paths.specs, {read: false})
        // Run mocha tests
        .pipe(mocha({reporter: 'spec'}))
        // Write code coverage report(s)
        .pipe(istanbul.writeReports({
          dir:        paths.coverage,
          reportOpts: {dir: paths.coverage},
          reporters:  ['text', 'text-summary', 'json', 'html']
        }))
        // Enforce code coverage requirements
        .pipe(coverageEnforcer({
          thresholds: {
            statements: 80,
            branches:   80,
            lines:      80,
            functions:  80
          },
          coverageDirectory: paths.coverage,
          rootDirectory:     ''
        }))
        // Some plugins, like gulp-mocha, have problems terminating after a task is finished.
        // Using exit() guarantees that such tasks will terminate successfully.
        .pipe(exit());
    });
});

gulp.task('default', ['lint', 'test']);
