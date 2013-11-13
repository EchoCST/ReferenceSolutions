// initEnvironment works a bit like $(document).ready() - its callback will be
// fired once the base Echo dependencies have been loaded. It is a good wrapper
// to use before calling other Echo Loader methods directly.
Echo.Loader.initEnvironment(function() {
    // Echo loads jQuery 1.10.x, which we are happy with. We do this before we
    // start the loader because when the dependency-management kicks in it may
    // load jQuery plugins. We must have a window.jQuery object for them to
    // install into.
    window.jQuery = window.$ = Echo.jQuery;

    // Authentication transport between apps. For production use, change
    // "busName" to the correct value for your environment.
    var backplane = {
        "serverBaseURL": "http://api.echoenabled.com/v1",
        "busName": "jskit"
    };

    // DataServer has been pre-configured to supply media items to this target
    // URL. Note that target URLs do not have to be real - they just establish
    // the parent/child hierarchy in the database. In practice, this would
    // typically be the URL of the page the user is viewing, the URL of a
    // related-items category landing page, or similar.
    var targetURL = "http://example.com/media-gallery-app/";

    // This is a rate-limited key for demonstration purposes. For production
    // use, change this to the real API key for your account.
    var appkey = "echo.jssdk.demo.aboutecho.com";

    // Sample Janrain authentication config for demonstration purposes. For
    // production use, change this to the correct auth setup for your site.
    var authconfig = {
        "janrainApp": "echo"
    };

    // Pinboard
    Echo.Loader.initApplication({
        "script": "//echosandbox.com/reference/apps/gallery/app/app.js",
        "component": "Echo.Apps.MediaGallery",
        "backplane": backplane,
        "config": {
            "appkey": appkey,
            "targetURL": targetURL,
            "auth": authconfig,
            "target": document.getElementById("gallery-pinboard"),
            "visualization": "pinboard"
        }
    });
/*
    // Streamlined Pinboard
    Echo.Loader.initApplication({
        "script": "//echosandbox.com/reference/apps/gallery/app.js",
        "component": "Echo.Apps.MediaGallery",
        "backplane": backplane,
        "config": {
            "appkey": appkey,
            "targetURL": targetURL,
            "auth": authconfig,
            "target": document.getElementById("gallery-streamlined"),
            "visualization": "streamlined"
        }
    });

    // Tabbed Pinboard
    Echo.Loader.initApplication({
        "script": "//echosandbox.com/reference/apps/gallery/app.js",
        "component": "Echo.Apps.MediaGallery",
        "backplane": backplane,
        "config": {
            "appkey": appkey,
            "targetURL": targetURL,
            "auth": authconfig,
            "target": document.getElementById("gallery-tabbed"),
            "visualization": "tabbed"
        }
    });

    // Full Screen Experience
    Echo.Loader.initApplication({
        "script": "//echosandbox.com/reference/apps/gallery/app.js",
        "component": "Echo.Apps.MediaGallery",
        "backplane": backplane,
        "config": {
            "appkey": appkey,
            "targetURL": targetURL,
            "auth": authconfig,
            "target": document.getElementById("gallery-full"),
            "visualization": "full"
        }
    });
*/
    (function($) {
        $(document).ready(function() {
            // Very simple tab interface for the top nav - no plugins required!
            $('nav a').click(function(e) {
                e.preventDefault();

                var visualization = $(this).data('visualization');
                $('#apps > div').hide();
                $('#gallery-' + visualization).show();

                $('nav a').removeClass('active');
                $(this).addClass('active');
            });
        });
    })(Echo.jQuery);
});
