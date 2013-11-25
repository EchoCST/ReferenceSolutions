/**
 * Grunt build/deployment script for Echo Reference Solutions.
 *
 * Environment setup:
 * 1. npm install
 * 2. Create local grunt-aws.json with AWS credentials.
 */

module.exports = function(grunt) {
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
                    "Expires": new Date(Date.now() + 300000).toUTCString()
                }
            },
            dev: {

            },
            prod: {
                // These options override the defaults
                options: {
                    encodePaths: true,
                    maxOperations: 20
                },
                // Files to be uploaded.
                upload: [{
                    src: 'important_document.txt',
                    dest: 'documents/important.txt',
                    options: { gzip: true }
                }, {
                    src: 'passwords.txt',
                    dest: 'documents/ignore.txt',

                    // These values will override the above settings.
                    bucket: 'some-specific-bucket',
                    access: 'authenticated-read'
                },
                {
                    // Wildcards are valid *for uploads only* until I figure out a good implementation
                    // for downloads.
                    src: 'documents/*.txt',

                    // But if you use wildcards, make sure your destination is a directory.
                    dest: 'documents/'
                }],
                sync: [{
                    src: path.join(variable.to.release, "build/cdn/js/**/*.js"),
                    dest: "jsgz",
                    // make sure the wildcard paths are fully expanded in the dest
                    rel: path.join(variable.to.release, "build/cdn/js"),
                    options: { gzip: true }
                }]
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-s3');

    // Default task(s).
    grunt.registerTask('default', [
        'uglify'
    ]);
};
