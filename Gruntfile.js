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
        aws_s3: {
            options: {
                accessKeyId: '<%= aws.key %>',
                secretAccessKey: '<%= aws.secret %>',
                //bucket: '<%= aws.bucket %>',
                uploadConcurrency: 5,
                downloadConcurrency: 5,
                //access: 'public-read',
                //headers: {
                //    // TODO: Increase this after first deployment.
                //    // 5-minute expiration policy
                //    "Cache-Control": "max-age=300, public",
                //    "Expires": new Date(Date.now() + 300000).toUTCString(),
                //    'X-Build': grunt.config("pkg.version")
                //},
                //encodePaths: false,
                //maxOperations: 20
            },
            production: {
                options: {
                    bucket: '<%= aws.bucket %>',
                    differential: true
                },
                files: [
                    //{dest: 'apps/', cwd: 'backup/staging/', action: 'download'},
                    {expand: true, cwd: 'apps/', src: ['**'], dest: 'apps/'},
                    //{dest: 'src/app', action: 'delete'},
                ]
            },
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-aws-s3');
    grunt.loadNpmTasks('grunt-bump');

    // Default task
    grunt.registerTask('default', [ ]);

    // Watch dev files for recompilation requirements
    grunt.registerTask('watch', [ 'watch' ]);

    // Dev/Prod deployments
    grunt.registerTask('deploy', [ 'aws_s3' ]);
};
