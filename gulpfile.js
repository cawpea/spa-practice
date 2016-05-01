var gulp = require('gulp');
var webserver = require('gulp-webserver');

var paths = {
	destDir: 'src'
};

gulp.task('default', ['serve'])

gulp.task('serve', function () {
	gulp.src( paths.destDir )
		.pipe( webserver({
			livereload: true
		}));
});