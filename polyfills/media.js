(function($) {
'use strict';

Echo.Polyfills = Echo.Polyfills || {};

// Done as a singleton because we aren't going to instantiate this...
Echo.Polyfills.Media = {
	defaultMediaSelector: function(content) {
		var dom = $("<div>" + content + "</div>");
		return $("img, video, embed, iframe", dom);
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

        return $.map(_sel(item.get("data.object.content")), function(e) {
            // Remove hard-coded sizes to support responsive layouts
            e.setAttribute('width', '100%');
            e.removeAttribute('height');

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
