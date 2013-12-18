(function($) {
'use strict';

Echo.Polyfills = Echo.Polyfills || {};

// Done as a singleton because we aren't going to instantiate this...
Echo.Polyfills.Media = {
	/**
	 * Default extractor to obtain media elements from an Item's content
	 * property, and mark them as processed. May be used as-is, or may be copied
	 * to serve as a template for making new selectors.
	 *
	 * @param {Stream.Item} item The item to process.
	 */
	defaultMediaSelector: function(item) {
		// We need a DIV wrapper because some items may just be text.
		var $dom = $("<div>" + item.get("data.object.content") + "</div>");

		// Find our media, and mark it processed.
		var $media = $("img, video, embed, iframe", $dom);
		$media.addClass('media-processed');

		// Update the item so our classes 'stick'
		item.set("data.object.content", $dom.html());

		return $media;
	},

    /**
     * Given a Stream Item, extract and post-process media items to prepare them
     * for display in visualizations that need raw access to their data.
     *
     * @param {Echo.StreamServer.Controls.Stream.Item} item The Stream.Item to
     * examine
     * @param {Function} selector A function that will examine a content string
     * and extract and return the desired media elements from it. Optional. If
     * not provided, Echo.Polyfills.Media.defaultMediaSelector will be used.
     */
    processMedia: function(item, selector) {
        var _sel = selector || Echo.Polyfills.Media.defaultMediaSelector;

        return $.map(_sel(item), function(e) {
            // Remove hard-coded sizes to support responsive layouts
			var w = e.getAttribute('width'),
			    h = e.getAttribute('height');

			// TODO: This is a hack to deal with embed.ly and Twitter Vine
			// videos looking so fugly. Since they're IFRAME elements they can't
			// resize responsively, and their thumb sizes are all over the
			// place. But they're square, so we force them to a specific size
			// that's at least tolerable.
			if (w && h && w == h && w > 300) {
				e.setAttribute('width', '300');
				e.setAttribute('height', '300');
			} else {
				e.setAttribute('width', '100%');
				e.removeAttribute('height');
			}

            // Type-specific transforms
            switch (e.nodeName) {
                case "IMG":
                    // The standard thumb is almost always too small for
                    // galleries, so use the preview or full size, if specified.
                    var src = null;
                    if (e.hasAttribute('data-src-preview')) {
                        src = e.getAttribute('data-src-preview');
                    } else if (e.hasAttribute('data-src-full')) {
                        src = e.getAttribute('data-src-full');
                    }

                    if (src) {
                        e.setAttribute('src', src);
                    }
                    break;

                case "IFRAME":
                    // TODO:
                    break;

                case "VIDEO":
                    // TODO:
                    break;

                case "EMBED":
                    // TODO:
                    break;
            }

    		return e;
		});
    }
};

})(Echo.jQuery);
