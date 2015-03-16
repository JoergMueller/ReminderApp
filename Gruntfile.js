module.exports = function(grunt) {

    grunt.initConfig({
        nggettext_extract: {
            pot: {
                options: {
                    startDelim: '[[',
                    endDelim: ']]'
                },
                files: {
                    'po/template.pot': ['src/views/*.html']
                }
            },
        },
        nggettext_compile: {
            all: {
                options: {
                    format: 'json'
                },
                files: [{
                    expand: true,
                    cwd: "./",
                    dest: "js/",
                    src: ["language/*.po"],
                    ext: ".json"
                }],
            },
        },
    });
    
    grunt.loadNpmTasks('grunt-angular-gettext');
    
    grunt.registerTask('default', ['nggettext_compile']);
};