var gulp = require('gulp');
var gutil = require('gulp-util');
var critical = require('critical').stream;

gulp.task('critical', function () {
    return gulp.src(['build/index.html',
                     'build/2014/01/08/testing-collections-with-guava-' +
                     'testlib-and-junit-4/index.html'], { base: 'build/'})
        .pipe(critical({base: 'build/',
                        dimensions: [{height: 1200, width: 1920},
                                     {height: 900, width: 1300},
                                     {height: 600, width: 480}],
                        include: [/\.thumbnail.*/, /\.caption.*/],
                        minify: true}))
        .on('error', function(err) { 
            gutil.log(gutil.colors.red(err.message)); 
        })
        .pipe(gulp.dest('build_critical/'));
});

gulp.task('default', ['critical']);
