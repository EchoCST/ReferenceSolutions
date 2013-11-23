(function(jQuery) {
"use strict";

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Item.Plugins.FullScreenGalleryVisualization
 * Create a full-screen gallery effect from a stream of photos. Uses the
 * Galleria jQuery plugin for a sophisticated UI.
 *
 * @extends Echo.Plugin
 */

var plugin = Echo.Plugin.manifest("FullScreenGalleryVisualization", "Echo.StreamServer.Controls.Stream.Item");

if (Echo.Plugin.isDefined(plugin)) return;

/**
 * Initialize the visualization.
 */
plugin.init = function() {
	var self = this, item = this.component;

    // We completely replace the content template so we can customize it heavily
	this.extendTemplate("replace", "content", plugin.templates.content);

    // We need to add a renderer to extract the media from the stream items
	item.extendRenderer("media", plugin.renderers.media);
};

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
	},
};

plugin.labels = {
	/**
	 * @echo_label
	 */
	"childrenMoreItems": "View more items..."
};

plugin.enabled = function() { return true; }

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
	var plugin = this, item = this.component;

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

/**
 * @echo_template
 */
plugin.templates.content =
	'<div class="{class:content} cf">' +
		'<div class="{class:card}">' +
            '<div class="{class:header} cf">' +
            	'<div class="{class:avatar}"></div>' +
            	'<div class="{class:title}">' +
                  '<div class="{class:authorName}"></div>' +
                '</div>' +
            	'<div class="{class:headerControls}"></div>' +
            '</div>' +
            '<div class="{class:body}">' +
                '<span class="{class:text}"></span>' +
                '<span class="{class:textEllipses}">...</span>' +
                '<span class="{class:textToggleTruncated}"></span>' +
            '</div>' +
            '<div class="{class:footer} clearfix">' +
                '<img class="{class:sourceIcon}" />' +
                '<div class="{class:date}"></div>' +
                '<div class="{class:from}"></div>' +
                '<div class="{class:via}"></div>' +
                '<div class="{class:buttons}"></div>' +
            '</div>' +
        '</div>' +
		'<div class="{plugin.class:media}"></div>' +
		'<div class="{plugin.class:thumb}"></div>' +
	'</div>';

plugin.css =
    // TODO: Refactor out to SDK
    '.cf:before, .cf:after { content: " "; display: table; }' +
    '.cf:after { clear: both; }' +

    '.{plugin.class} .{class:card} { display: none; }' +

    '.{plugin.class} .{plugin.class:thumb} { display: none; }' +

    '.{plugin.class} .{plugin.class:media} img { margin: 0 auto; }' +
    '.{plugin.class} .{plugin.class:media} iframe { margin: 0 auto; }' +

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
	 * @cfg {Double} slideAspectRatio
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
	"thumbSize": [ 100, 56 ],
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
	"url": "//echosandbox.com/reference/apps/gallery/galleria/galleria-1.3.2.min.js"
}, {
	"loaded": function() { return false; },
	"url": "//echosandbox.com/reference/apps/gallery/galleria/plugins/history/galleria.history.min.js"
}];

plugin.renderers.gallery = function(element) {
	var stream = this;

	return element;
}

plugin.templates.container =
	'<div class="{class:content}">' +
		'<div class="{class:gallery}"></div>' +
		'<div class="{class:body}"></div>' +
	'</div>';

plugin.events = {
	"Echo.StreamServer.Controls.Stream.onRender": function(topic, args) {
		var plugin = this, stream = this.component;

		var gallery = stream.get("gallery", []);
		var ad = {
			image: 'http://theswash.com/wp-content/uploads/2012/07/univision.png', //'//echosandbox.com/reference/apps/gallery/empty.gif',
			layer: '<div class="ad-region">Native Ad</div>'
		};
		gallery.splice(8, 0, ad);
		gallery.splice(4, 0, ad);

		// Configure Galleria for our later use. For now we give it no data.
		Galleria.loadTheme('galleria/themes/classic/galleria.classic.min.js');
		Galleria.configure({
			carousel: true,
			dataSource: gallery,
			debug: true,
			fullscreenDoubleTap: true,
			showImagenav: true,
			swipe: true,
			thumbnails: true,
			trueFullscreen: true,
			responsive: true,
			pauseOnInteraction: true
		});
		Galleria.ready(function() {
			this.attachKeyboard({
				right: this.next,
				left: this.prev
			});

			this.bind("loadstart", function(galleriaData, imageTarget, thumbTarget, index) {
				var count = stream.get('adcounter', 0) + 1;
				stream.set('adcounter', count);

				if (count > 1) {
					$('#ad-banner').html('Banner Ad ' + count);
					$('#ad-companion').html('Companion Ad ' + count);
				}
			});
		});

		Galleria.run('.echo-streamserver-controls-stream-gallery');

		this._refreshView(true);
	},

	"Echo.StreamServer.Controls.Stream.onRefresh": function(topic, args) {
		this._refreshView(true);
	},

	"Echo.StreamServer.Controls.Stream.Item.Plugins.FullScreenGalleryVisualization.onChangeView": function(topic, args) {
		var plugin = this, stream = this.component;

		switch (args.action) {
			case "insert":
				var gallery = stream.get("gallery", []);

				var items = args.item.data.galleryItems;
				if (items.length > 0) {
					var $slide = items[0].slide;
					var $thumb = items[0].thumb;
					var data = {
						image: $slide.attr('src'),
						thumb: $thumb.attr('src'),
						title: 'TODO',
						description: 'TODO',
//						link: 'TODO',
						// iframe
					};
					gallery.push(data);
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

plugin.methods._refreshView = function(refresh) {
	var plugin = this, stream = this.component;
	var hasEntries = stream.threads.length;

	var $body = stream.view.get("body");
	if ($body.length < 1) {
		return;
	}

};

plugin.css =
	'.echo-streamserver-controls-stream-body { display: none; }' +
	'.{class:gallery} { width: 100%; height: 500px; }' +

	'.{class:gallery} .ad-region { height: 100%; }' +

	'';
//	'.{plugin.class} .isotope { -webkit-transition-property: height, width; -moz-transition-property: height, width; -o-transition-property: height, width; transition-property: height, width;  -webkit-transition-duration: 0.8s; -moz-transition-duration: 0.8s; -o-transition-duration: 0.8s; transition-duration: 0.8s; }' +
//	'.{plugin.class} .isotope .isotope-item { -webkit-transition-property: -webkit-transform, opacity; -moz-transition-property: -moz-transform, opacity; -o-transition-property: top, left, opacity; transition-property:transform, opacity; -webkit-transition-duration: 0.8s; -moz-transition-duration: 0.8s; -o-transition-duration: 0.8s; transition-duration: 0.8s; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
