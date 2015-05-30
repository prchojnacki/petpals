module.exports = function(grunt){
  //Configuration/behavior for Grunt and Grunt plugins
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: '\n'
      },
      build: {
        src: [
          './client/assets/js/dev/transition.js',
          './client/assets/js/dev/alert.js',
          './client/assets/js/dev/button.js',
          './client/assets/js/dev/carousel.js',
          './client/assets/js/dev/collapse.js',
          './client/assets/js/dev/dropdown.js',
          './client/assets/js/dev/modal.js',
          './client/assets/js/dev/tooltip.js',
          './client/assets/js/dev/popover.js',
          './client/assets/js/dev/scrollspy.js',
          './client/assets/js/dev/tab.js',
          './client/assets/js/dev/affix.js'
        ],
        dest: './client/assets/js/bootstrap.js'
      }
    },
    less: {
      build: {
      	options: {
      	  compress: true
      	},
      	files: {
      	  './client/assets/css/bootstrap.min.css': './client/assets/less/bootstrap.less',
          './client/assets/css/styles.min.css':'./client/assets/less/styles.less'
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
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');

  //Define Grunt behavior
  grunt.registerTask('default',['concat','less']); // This is what is run if we call grunt without arguments
  grunt.registerTask('dev',['watch']) //This will be called if we run 'grunt dev'. Given how simple it currently is, could also use 'grunt watch'
};