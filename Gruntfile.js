/**
 * Grunt build/deployment script for Echo Reference Solutions.
 *
 * Environment setup:
 * 1. npm install
 * 2. Create local grunt-aws.json with AWS credentials. See sample below.
 * 3. Run "grunt deploy" to update production.
 *
 * Sample grunt-aws.json:
 *
 *   {
 *     "key": "AWSACCESSKEY",
 *     "secret": "AWSSECRETKEY",
 *     "bucket": "AWSBUCKET"
 *   }
 *
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
                uploadConcurrency: 5,
                downloadConcurrency: 5,
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
