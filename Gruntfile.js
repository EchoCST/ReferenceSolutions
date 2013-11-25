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
            dev: {
                upload: [{
                    src: 'apps/**',
                    dest: 'apps/'
                }]
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-s3');
    grunt.loadNpmTasks('grunt-bump');

    // Default task
    grunt.registerTask('default', [ ]);

    // Watch dev files for recompilation requirements
    grunt.registerTask('watch', [ 'watch' ]);

    // Dev/Prod deployments
    grunt.registerTask('deploy', [ 's3' ]);
};
