(function(jQuery) {
"use strict";

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Item.Plugins.FullScreenGalleryVisualization
 * Create a full-screen gallery effect from a stream of photos. Uses the
 * Galleria jQuery plugin for a sophisticated UI.
 *
 * Please note: this visualization is a work in progress and is undergoing QA
 * and code cleanup. It may be useful as-is or as a high-level example of how to
 * use an external plugin like Galleria, but please do not use it as a reference
 * for how to develop Apps in general. The Streamlined visualization follows
 * Echo's standards much more closely.
 *
 * @extends Echo.Plugin
 */

var plugin = Echo.Plugin.manifest("FullScreenGalleryVisualization", "Echo.StreamServer.Controls.Stream.Item");

if (Echo.Plugin.isDefined(plugin)) return;

/**
 * Initialize the visualization.
 */
plugin.init = function() {
	var item = this.component;

    // Add a template for the media elements Galleria needs to see
    this.extendTemplate("insertAfter", "container", plugin.templates.media);

    // We need to add a renderer to extract the media from the stream items
	item.extendRenderer("media", plugin.renderers.media);
};

plugin.templates.media = '<div class="{plugin.class:media}"></div>' +
                         '<div class="{plugin.class:thumb}"></div>';

plugin.config = {
	/**
	 * @cfg {Boolean} removeInvalidItems
	 * If an item cannot be loaded, remove it rather than showing an empty box.
	 */
	"removeInvalidItems": true,

	/**
	 * @cfg {Function} mediaSelector
	 * Override this to define the function that extracts media from arriving
	 * stream items.
	 *
	 * The default function looks for IMG, VIDEO, EMBED, and IFRAME tags using
	 * the following code:
	 *
	 * 	"mediaSelector": function(content) {
	 * 		var dom = $("<div>" + content + "</div>");
	 * 		return $("img, video, embed, iframe", dom);
	 * 	}
	 */
	"mediaSelector": function(content) {
		var dom = $("<div>" + content + "</div>");
		return $("img, video, embed, iframe", dom);
	}
};

plugin.labels = {
	/**
	 * @echo_label
	 */
	"childrenMoreItems": "View more items..."
};

plugin.enabled = function() { return true; };

(function() {

/**
 * @echo_event Echo.StreamServer.Controls.Stream.Item.Plugins.FullScreenGalleryVisualization.onChangeView
 *
 * Post an event whenever the view changes with the information required to
 * update the gallery itself.
 */
var publish = function(action) {
    if (this.component.isRoot()) {
		this.events.publish({
			"topic": "onChangeView",
			"data": { "action": action, "item": this.component }
		});
	}
};

plugin.events = {
    "Echo.StreamServer.Controls.Stream.Item.onRender": function() { publish.call(this, "insert"); },
    "Echo.StreamServer.Controls.Stream.Item.onRerender": function() { publish.call(this, "update"); },
    "Echo.StreamServer.Controls.Stream.Item.onDelete": function() { publish.call(this, "delete"); }
};

})();

/**
 * Extract the desired media element from the content block, and display:none it
 * in its original location. Also transforms some element types like Instagram
 * embed.ly IFRAMEs.
 *
 * Returns an array of media items, each of which contains a 'slide' and a
 * 'thumb' attribute.
 */
plugin.methods._getMedia = function() {
	var plugin = this, item = this.component;

    var selector = plugin.config.get("mediaSelector");
    var mediaItems = selector(item.get("data.object.content"));
	item.data.galleryItems = [];

    if (mediaItems.length < 1) {
		return;
	}

	// Normalize some media types like Embed.ly IFRAMEs.
	$.map(mediaItems, function(el) {
		switch (el.nodeName) {
			case "IFRAME":
				var src = !!el.src ? Echo.Utils.parseURL(el.src) : null;
				if (src && src.domain == 'cdn.embedly.com' && src.path == '/widgets/media.html') {
					// If this is embed.ly, the query string is non-compliant - it does not
					// actually contain a ? delimiter so we can't use the normal parser on
					// the rest of the query.
					var tokens = decodeURIComponent(src.query).split('&');

					var $thumb = null, $slide = $(el);
					$.map(tokens, function(token) {
						var fields = token.split('=');
						if (fields[0] == 'image') {
							$thumb = $('<img src="' + fields[1] + '" />');
						}
					});

					$slide.attr('width', '100%').attr('height', '100%');

					if ($thumb && $slide) {
						item.data.galleryItems.push({
							'thumb': $thumb,
							'slide': $slide
						});
					}
				} else {
					// We drop any IFRAMEs that we don't recognize
				}

				break;

			case "IMG":
				// TODO: There is also a "data-src-preview", and Twitter has a
				// "data-src-web". Re-visit for responsive considerations.
				var $img = $(el);
				item.data.galleryItems.push({
					'thumb': $img,
					'slide': $('<img src="' + $img.data('src-full') + '" />')
				});

				break;
		}
	});
};

/**
 * Extract the gallery element from the stream item content and display it in
 * its own element. This becomes the gallery "slide".
 *
 * @echo_renderer
 */
plugin.renderers.media = function(element) {
	var plugin = this,
        item = this.component;

    // Look for media to display
	plugin._getMedia();
    if (item.data.galleryItems.length < 1) {
		// If there are none, show an error and/or remove the element entirely
        var content = item.view.get('content');
        content.addClass('load-error');

        if (plugin.config.get("removeInvalidItems", false) === true) {
            content.empty();
        }
    } else {
		// If we found something to show, set it up in both the slide region and
		// a thumbnail slot.
		var item = item.data.galleryItems[0];
		element.html(item.slide);
    }

	return element;
};

// TODO: Why is .plugin.class not working?
var pc = '.echo-streamserver-controls-stream-plugin-FullScreenGalleryVisualization ';

plugin.css =
//    '.{plugin.class} .galleria-errors { display: none; }' +
    pc + ' .galleria-errors { display: none; }' +
    pc + ' .echo-linkColor { color: #b4d8f8; }' +
    pc + ' .{class:avatar-wrapper} { display: none; }' +
    pc + ' .{class:authorName} { display: none; }' +
    pc + ' .{class:footer} { display: none; }' +
    pc + ' .{class:text} { line-height: 1.5em; }' +
    pc + ' .{class:subwrapper} { margin-left: 0; padding: 10px; }' +

    // TODO: There are also styles in the gallery theme. We should refactor all
    // of these rules either to the theme or back into here.
    pc + ' .galleria-streamitem h2.echo-item-title { margin: 0; color: #eee; }' +
    pc + ' .galleria-streamitem h2.echo-item-title a { color: #99f; }' +
//    '.{plugin.class} .{class:title} { margin: 0; color: #ccc; }' +

//    '.{plugin.class} .{class:card} { display: none; color: #fff; }' +

//    '.{plugin.class} .{plugin.class:thumb} { display: none; }' +

    // TODO: Why isn't .{class:header} working here?????
//    '.{plugin.class} .echo-streamserver-controls-stream-item-header { padding: 7px; }' +
//    '.{plugin.class} .echo-streamserver-controls-stream-item-avatar { float: left; }' +
//    '.{plugin.class} .echo-streamserver-controls-stream-item-title { margin-left: 60px; }' +
//	'.{plugin.class} .echo-streamserver-controls-stream-item-footer { float: right; margin: 7px; }' +

//    '.{plugin.class} .{plugin.class:media} img { margin: 0 auto; }' +
//    '.{plugin.class} .{plugin.class:media} iframe { margin: 0 auto; }';
    '';

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function(jQuery) {
"use strict";

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Plugins.FullScreenGalleryVisualization
 * See Echo.StreamServer.Controls.Stream.Items.Plugins.FullScreenGalleryVisualization
 * above for details.
 *
 * @extends Echo.Plugin
 */
var plugin = Echo.Plugin.manifest("FullScreenGalleryVisualization", "Echo.StreamServer.Controls.Stream");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.config = {
	/**
	 * @cfg {Number} slideAspectRatio
	 * The desired aspect ratio desired for each slide. This is used to
	 * calculate the slide height from the container width to avoid jumpy
	 * displays when showing items of different sizes. Items that do not have
	 * this aspect ratio are black-barred.
	 */
	"slideAspectRatio": 1.777777777,

	/**
	 * @cfg {Array} thumbSize
	 * The width and height of each thumbnail slot. Items that cannot fit into
	 * this container are black-barred.
	 */
	"thumbSize": [ 100, 56 ]
};

plugin.init = function() {
	var self = this, stream = this.component;

	stream.set('adcounter', 0);

	self.extendTemplate("replace", "container", plugin.templates.container);
	stream.extendRenderer("gallery", plugin.renderers.gallery);
};

plugin.enabled = function() { return true; };

plugin.dependencies = [{
	"loaded": function() { return false; },
	"url": "//echocsthost.s3.amazonaws.com/apps/gallery/galleria/galleria-1.3.2.min.js"
}, {
	"loaded": function() { return false; },
	"url": "//echocsthost.s3.amazonaws.com/apps/gallery/galleria/plugins/history/galleria.history.min.js"
}];

plugin.renderers.gallery = function(element) {
	return element;
};

plugin.templates.container =
	'<div class="{class:content}">' +
		'<div class="{class:gallery}"></div>' +
		'<div class="{class:body}"></div>' +
	'</div>';

plugin.events = {
	"Echo.StreamServer.Controls.Stream.onRender": function(topic, args) {
		var stream = this.component;

		var gallery = stream.get("gallery", []);

		// Configure Galleria for our later use. For now we give it no data.
		Galleria.loadTheme('//echocsthost.s3.amazonaws.com/apps/gallery/galleria/themes/echoshow/galleria.echoshow.js');
		Galleria.configure({
			dataSource: gallery,
			debug: false
		});
		Galleria.ready(function() {
			this.attachKeyboard({
				right: this.next,
				left: this.prev
			});

			this.bind("loadstart", function(data) {
				var count = stream.get('adcounter', 0) + 1;
				stream.set('adcounter', count);

				if (count > 1) {
					$('#ad-banner').html('Banner Ad ' + count);
					$('#ad-companion').html('Companion Ad ' + count);
				}

				var $body = stream.view.get('body');
				var $item = $body.find('> div').eq(data.index);
				$('.galleria-streamitem').html($item.html());

                // TODO: This is really crude - we should probably make something
                // more specifically focused on what we're trying to do. But we
                // figured that would come from "Cards" and we don't have access
                // to that here...
                var html = '';
                html += '<div class="avatar">' +
                        $item.find('.echo-streamserver-controls-stream-item-avatar').html() +
                        '</div>';

                html += '<div class="author">' +
                        $item.find('.echo-streamserver-controls-stream-item-authorName').html() +
                        '</div>';

                html += '<div class="date">' +
                        $item.find('.echo-streamserver-controls-stream-item-date').html() +
                        '</div>';

                html += '<div class="footer">' +
                        $item.find('.echo-streamserver-controls-stream-item-footer').html() +
                        '</div>';

                $('.galleria-overlay').html(html);

                console.log(data.galleriaData);
                $('.galleria-shade').css({
                    'background': '#000 url(' + data.galleriaData.big + ') 50% 50%'
                }).html('<div></div>');
			});
		});

		Galleria.run('.echo-streamserver-controls-stream-gallery');

		this._refreshView(true);
	},

	"Echo.StreamServer.Controls.Stream.onRefresh": function(topic, args) {
		this._refreshView(true);
	},

	"Echo.StreamServer.Controls.Stream.Item.Plugins.FullScreenGalleryVisualization.onChangeView": function(topic, args) {
		var stream = this.component;

		switch (args.action) {
			case "insert":
				var gallery = stream.get("gallery", []);

				var items = args.item.data.galleryItems;
				if (items && items.length > 0) {
					var $slide = items[0].slide;
					var $thumb = items[0].thumb;
					var data = {
						thumb: $thumb.attr('src'),
						title: '', // TODO
						description: '' // TODO
					};

                    var src = $slide.attr('src');
                    if (src.indexOf('media.html') !== -1) {
                        data.iframe = src;
                        gallery.push(data);
                    } else {
                        data.image = src;
                        gallery.push(data);
                    }

					stream.set("gallery", gallery);
				}
				break;

			case "update":
				break;

			case "delete":
				break;
		}
	}
};

/**
 * NOOP for now - we used to use this and might want to again.
 * @param refresh {Boolean} If true, force-refresh the view immediately.
 */
plugin.methods._refreshView = function(refresh) {
    // NOOP
};

plugin.css =
	".{plugin.class:content} { position: relative; }" +
	".echo-streamserver-controls-stream-body { display: none; }" +
	'.{class:gallery} { width: 100%; }' +

	'.galleria-streamitem { overflow: hidden; } ';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
