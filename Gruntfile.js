module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        coffee: {
            compile: {
                files: {
                    '<%= pkg.name %>.js': 'src/<%= pkg.name %>.coffee'
                }
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.description %> <%= pkg.version %> (<%= grunt.template.today("yyyy-mm-dd") %>) | <%= pkg.author %> | <%= pkg.license %> license */\n',
                sourceMap: true
            },
            all: {
                files: {
                    '<%= pkg.name %>.min.js': '<%= pkg.name %>.js'
                }
            }
        },
        bump: {
            options: {
                files: ['package.json', 'bower.json'],
                commit: true,
                commitMessage: 'Release v%VERSION%',
                commitFiles: ['-a'],
                createTag: true,
                tagName: 'v%VERSION%',
                tagMessage: 'Version %VERSION%',
                push: true,
                pushTo: "origin"
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-coffee');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-bump');

    grunt.registerTask('build', ['coffee', 'uglify']);
    grunt.registerTask('default', ['build']);
    grunt.registerTask('release', "Release a new version", function(target){
        if (!target) {
            target = 'patch';
        }

        grunt.task.run('bump-only:' + target, 'build')
    });
};