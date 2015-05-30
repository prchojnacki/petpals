module.exports = function(grunt){
  //Configuration/behavior for Grunt and Grunt plugins
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      build: {
        src: './client/assets/js/dev/*.js',
        dest: './client/assets/js/bootstrap.min.js'
      }
    },
    less: {
      build: {
      	options: {
      	  compress: true
      	},
      	files: {
      	  './client/assets/css/bootstrap.min.css': './client/assets/less/bootstrap.less'
      	}
      }
    },
    watch: {
      css: {
        files: './client/assets/less/*.less',
        tasks: 'less'
      }
    }
  });

  //Load plugins for Grunt
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');

  //Define Grunt behavior
  grunt.registerTask('default',['uglify','less']); // This is what is run if we call grunt without arguments
  grunt.registerTask('dev',['watch']) //This will be called if we run 'grunt dev'. Given how simple it currently is, could also use 'grunt watch'
};