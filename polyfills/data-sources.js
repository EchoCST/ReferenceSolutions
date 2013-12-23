(function($) {
'use strict';

Echo.Polyfills = Echo.Polyfills || {};

// This isn't REALLY a polyfill, it's just a support method that we use in a lot
// of Apps. We've put it here because of that, but it may become a real polyfill
// later if we add more functionality to it.

// Done as a singleton because we aren't going to instantiate this...
Echo.Polyfills.DataSources = {
    /**
     * Get a target URL based on a combination of Dashboard config options.
     *
     * @param {Object} datasource The dataSource portion of the app config block
     * @return {String} A targetURL to use for queries.
     */
    getTargetUrl: function(datasource) {
        switch (datasource.targetURLSource) {
            // 'actualurl' means the URL we've browsed to
            case 'actualurl': return window.location.href;

            // 'specific' means a URL manually entered by the editor
            case 'specific': return datasource.specifiedURL;

            // 'builder' is the DataSourceBuilder. It stores its value in
            // specifiedURL just like 'specific'.
            case 'builder': return datasource.specifiedURL;

            // 'autogen' means we make up a URL in the format
            //    http://DOMAIN/apps/INSTANCE
            case 'autogen':
                if (datasource.domain && datasource.instanceName) {
                    return 'http://' + datasource.domain + '/apps/data/' +
                           datasource.instanceName;
                }
                break;

            // 'canonical' means the rel=canonical tag. We fall back to the
            // browser URL if it's not specified.
            case 'canonical':
                var $canonical = $('link[rel=canonical]');
                if ($canonical.length > 0) {
                    return $canonical.attr('href');
                }
                break;

            // 'echourl' means a META name="echo:url" tag in the page
            case 'echourl':
                var $echourl = $('meta[property="echo:url"]');
                if ($echourl.length > 0) {
                    return $echourl.attr('content');
                }
                break;
        }

        // Always fall back to SOMETHING.
        return window.location.href;
    }
};

})(Echo.jQuery);
