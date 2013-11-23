/**
 * Galleria Echo-Show Theme
 */

(function($) {

Galleria.addTheme({
    name: 'echoshow',
    author: 'Echo',
    css: 'galleria.echoshow.css',

    defaults: {
        carousel: true,
        fullscreenDoubleTap: true,
        showImagenav: true,
        showInfo: false,
        swipe: true,
        thumbnails: true,
        trueFullscreen: true,
        responsive: true,
        pauseOnInteraction: true,

        transition: "fade",
        transitionSpeed: 500,

        height: 0.5625,

        imageCrop: false,
        thumbCrop: "height",
        fullscreenCrop: false,

        idleMode: "hover",
        idleSpeed: 500,
        fullscreenTransition: !1,
        _locale: {
            show_captions: "Show captions",
            hide_captions: "Hide captions",
            play: "Play slideshow",
            pause: "Pause slideshow",
            enter_fullscreen: "Enter fullscreen",
            exit_fullscreen: "Exit fullscreen",
            next: "Next image",
            prev: "Previous image",
            showing_image: "Showing image %s of %s"
        },
    },

    init: function(options) {
        Galleria.requires(1.28, 'Echo-Show requires Galleria 1.2.8 or later');

        var gallery = this;

        this.addElement("streamitem", "bar", "fullscreen", "play")
            .append({
                container: [ "streamitem", "bar" ],
                bar: [ "fullscreen", "play", "thumbnails-container" ]
            });

        // cache some stuff
        var info = this.$('info-text'),
            touch = Galleria.TOUCH,
            click = touch ? 'touchstart' : 'click';

        // show loader & counter with opacity
        this.$('loader,counter').show().css('opacity', 0.4);

        // some stuff for non-touch browsers
        if (! touch ) {
            this.addIdleState( this.get('image-nav-left'), { left:-50 });
            this.addIdleState( this.get('image-nav-right'), { right:-50 });
            this.addIdleState( this.get('counter'), { opacity:0 });
        }

        info.show();

        // bind some stuff
        this.bind('thumbnail', function(e) {

            if (! touch ) {
                // fade thumbnails
                $(e.thumbTarget).css('opacity', 0.6).parent().hover(function() {
                    $(this).not('.active').children().stop().fadeTo(100, 1);
                }, function() {
                    $(this).not('.active').children().stop().fadeTo(400, 0.6);
                });

                if ( e.index === this.getIndex() ) {
                    $(e.thumbTarget).css('opacity',1);
                }
            } else {
                $(e.thumbTarget).css('opacity', this.getIndex() ? 1 : 0.6).click( function() {
                    $(this).css( 'opacity', 1 ).parent().siblings().children().css('opacity', 0.6);
                });
            }
        });

        var activate = function(e) {
            $(e.thumbTarget).css('opacity',1).parent().siblings().children().css('opacity', 0.6);
        };

        this.bind('loadstart', function(e) {
            if (!e.cached) {
                this.$('loader').show().fadeTo(200, 0.4);
            }
            window.setTimeout(function() {
                activate(e);
            }, touch ? 300 : 0);
            gallery.$('info').toggle( this.hasInfo() );
        });

        this.bind('loadfinish', function(e) {
            gallery.$('loader').fadeOut(200);
        });

        this.bind("play", function () {
            gallery.$("play").addClass("pause");
        });

        this.bind("pause", function () {
            gallery.$("play").removeClass("pause");
        });

        this.$("play").on("click", function (e) {
            e.preventDefault();
            gallery.playToggle()
        });

        this.$("fullscreen").on("click", function (e) {
            e.preventDefault();
            gallery.toggleFullscreen()
        });
    }
});

}(jQuery));
