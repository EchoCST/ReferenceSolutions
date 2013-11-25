/**
 * Grunt build/deployment script for Echo Reference Solutions.
 *
 * Environment setup:
 * 1. npm install
 * 2. Create local grunt-aws.json with AWS credentials.
 */

module.exports = function(grunt) {
    "use strict";

    var apps = [ "gallery" ];

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                mangle: false,
                compress: true,
                report: 'gzip',
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'src/<%= pkg.name %>.js',
                dest: 'build/<%= pkg.name %>.min.js'
            }
        },
        bump: {
            options: {
                files: ['package.json'],
                updateConfigs: [],
                commit: true,
                commitMessage: 'Release v%VERSION%',
                commitFiles: [ 'package.json' ],
                createTag: false,
                push: true,
                pushTo: 'upstream',
            }
        },
        aws: grunt.file.readJSON('grunt-aws.json'),
        s3: {
            options: {
                key: '<%= aws.key %>',
                secret: '<%= aws.secret %>',
                bucket: '<%= aws.bucket %>',
                access: 'public-read',
                headers: {
                    // TODO: Increase this after first deployment.
                    // 5-minute expiration policy
                    "Cache-Control": "max-age=300, public",
                    "Expires": new Date(Date.now() + 300000).toUTCString(),
                    'X-Build': grunt.config("pkg.version")
                },
                encodePaths: true,
                maxOperations: 20
            },
            prod: {
                upload: [{
                    src: 'apps/**/**.min.js',
                    dest: 'apps/'
                }]
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-s3');
    grunt.loadNpmTasks('grunt-bump');

    // Default task builds to code base.
    grunt.registerTask('default', [ 'uglify' ]);

    // Watch dev files for recompilation requirements
    grunt.registerTask('watch', [ 'watch' ]);

    // Dev/Prod deployments
    grunt.registerTask('deploy-dev', [ 'uglify', 's3.dev' ]);
    grunt.registerTask('deploy-prod', [ 'uglify', 's3.prod' ]);
};
