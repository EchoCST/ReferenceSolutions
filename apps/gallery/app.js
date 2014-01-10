(function($) {
'use strict';

var gallery = Echo.App.manifest('Echo.Apps.MediaGallery');

if (Echo.App.isDefined(gallery)) return;

gallery.init = function() {
    if (!this.checkAppKey()) return;

    this.render();
    this.ready();
};

gallery.labels = {
    'signin': 'Please sign in...'
};

/**
 * Configuration defaults.
 *
 * NOTE: These defaults must match those defined in the Dashboard template
 * _exactly_. When we receive an app config, if the user sets a setting to its
 * default value, the setting is _removed_. That means if we define a different
 * default here, we will get the default app.js defines, not the default from
 * the dashboard.
 *
 * This is especially confusing for checkboxes. If a checkbox defaults to True
 * in Dashboard and the user has it checked, if we then have it defaulting to
 * false here or simply not defined it will always evaluate to false!
 */
gallery.config = {
    appkey: '',

    datasource: {
        targetURLSource: 'canonical',
        specifiedURL: '',
        builderURL: '',
        targetMode: 'childrenof',
        itemsPerPage: '15',
        filters: '',
        safeHTML: 'off',
        children: '0',
        childFilters: '',
        childSafeHTML: ''
    },

    display: {
        visualization: 'pinboard',
        secondary: 'flip',
        sourcefilter: true,
        replies: true,
        likes: true,
        sharing: false,
        flags: true,
    },

    integration: {
        nativeinterval: 0
    },

    upload: {
        enabled: false,
        fpkey: ''
    },

    auth: {
        enabled: false,
        janrainApp: undefined
    },

    // TODO: We don't use this but StreamServer dies if we don't have it
    children: {
        maxDepth: 0,
        itemsPerPage: 15
    },
};

gallery.dependencies = [{
    url: '{config:cdnBaseURL.sdk}/identityserver.pack.js',
    app: 'Echo.IdentityServer.Controls.Auth'
}, {
    url: '{config:cdnBaseURL.sdk}/streamserver.pack.js',
    app: 'Echo.StreamServer.Controls.Stream'
}];

gallery.templates.main =
    '<div class="{class:container} visualization-{config:display.visualization}">' +
        '<div class="{class:auth}"></div>' +
        '<div class="{class:tabs}"></div>' +
        '<div class="{class:stream}"></div>' +
    '</div>';

gallery.renderers.tabs = function(element) {
    var plugin = this;

    if (plugin.config.get('visualization', '') === 'tabbed') {
        var html = '';

        var title = plugin.config.get('title', '');
        if (title != '') {
            html += '<h2>' + title + '</h2>';
        }

        html += '<ul class="clearfix">' +
                '<li><a href="#" data-source="all" class="active">All</a></li>' +
                '<li><a href="#" data-source="twitter"><i class="twitter"></i>Twitter</a></li>' +
                '<li><a href="#" data-source="facebook"><i class="facebook"></i>Facebook</a></li>' +
                '<li><a href="#" data-source="instagram"><i class="instagram"></i>Instagram</a></li>' +
                '<li><a href="#" data-source="youtube"><i class="youtube"></i>YouTube</a></li>' +
                '</ul>';

        $(element).html(html);
    }

    return element;
};

gallery.renderers.auth = function(element) {
    if (!this._isAuthEnabled()) {
        return element.hide();
    }
    this.initComponent({
        id: 'Auth',
        component: 'Echo.IdentityServer.Controls.Auth',
        config: {
            target: element,
            infoMessages: { enabled: false },
            labels: { login: this.labels.get('signin') },
            plugins: [this._getAuthPluginDefinition({ name: 'JanrainConnector' })]
        }
    });
    return element;
};

gallery.renderers.stream = function(element) {
    var self = this,
    janrainApp = this.config.get('auth.janrainApp');

    var plugins = [{
        name: 'ItemsRollingWindow',
        moreButton: true,
        url: '//cdn.echoenabled.com/apps/echo/dataserver/v3/plugins/items-rolling-window.js'
    }, {
        name: 'NativeAdvertising',
        url: '//echocsthost.s3.amazonaws.com/plugins/native-advertising.js',
        nativeAdInterval: self.config.get('integration.nativeinterval')
    }];

    switch (self.config.get('display.visualization')) {
        case 'streamlined':
            this.config.set('display.replies', false);

            plugins.push({
                name: 'StreamlinedPinboardVisualization',
                url: '//echocsthost.s3.amazonaws.com/apps/gallery/visualizations/pinboard-streamlined.js',
                minColWidth: self.config.get('display.mincolwidth', 300),
                // TODO: Is thre a better way to do this?
                cdnBaseURL: {
                    EchoCST: this.config.get('cdnBaseURL.EchoCST')
                }
            });

            plugins.push({
                name: 'ItemSourceClass',
                url: '//echocsthost.s3.amazonaws.com/plugins/item-source-class.js'
            });

            break;

        case 'slideshow':
            plugins.push({
                name: 'FullScreenGalleryVisualization',
                url: '//echocsthost.s3.amazonaws.com/apps/gallery/visualizations/gallery-fullscreen.js',
                minColWidth: self.config.get('display.mincolwidth', 300)
            });
            break;

        case 'pinboard':
        default:
            plugins.push({
                name: 'MediaGallery',
                url: '//echocsthost.s3.amazonaws.com/apps/gallery/plugins/media-gallery.js',
                removeInvalidItems: true,
            });
            plugins.push({
                name: 'PinboardVisualization',
                url: '//echocsthost.s3.amazonaws.com/apps/gallery/visualizations/pinboard.js',
                minColWidth: self.config.get('display.mincolwidth', 300)
            });
            break;
    }

    plugins.push({ name: 'TweetDisplay' });

    //if (!!self.config.get('display.replies')) {
        var reply = { name: 'Reply' };
        if (this._isAuthEnabled()) {
            var auth = this._getAuthPluginDefinition({
                name: 'JanrainAuth',
                labels: { login: this.labels.get('signin') }
            });
            reply.nestedPlugins = [auth];
        }
        plugins.push(reply);
    //}

    if (!!self.config.get('display.sharing') && janrainApp) {
        plugins.push({
            name: 'JanrainSharing',
            appId: janrainApp
        });
    }

    if (!!self.config.get('display.flags')) {
        plugins.push({'name': 'CommunityFlag'});
    }

    // TODO: Move this out to a component that Dashboard can use on the Builder
    // side.
    // Build the query. We fall back to the old query if there is one.
    var query = [self.config.get('query')],
        datasource = self.config.get('datasource');
    if (datasource && datasource.targetURLSource) {
        var source = datasource.targetMode + ':';
        switch (datasource.targetURLSource) {
            case 'actualurl': source += window.location.href; break;
            case 'specific': source += datasource.specifiedURL; break;
            case 'builder': source += datasource.builderURL; break;

            case 'canonical':
                var $canonical = $('link[rel=canonical]');
                if ($canonical.length > 0) {
                    source += $canonical.attr('href');
                } else {
                    source += window.location.href;
                }
                break;

            case 'echourl':
                var $echourl = $('meta[property="echo:url"]');
                if ($echourl.length > 0) {
                    source += $echourl.attr('content');
                } else {
                    source += window.location.href;
                }
                break;
        }

        query.push(source);
        query.push(datasource.filters);
        query.push('itemsPerPage:' + datasource.itemsPerPage);
        query.push('safeHTML:' + datasource.safeHTML);

        if (parseInt(datasource.children) > 0) {
            query.push('children:' + datasource.children);
            query.push(datasource.childFilters);
            query.push('safeHTML:' + datasource.childSafeHTML);
        } else if (datasource.children.length > 0 && datasource.children != '0') {
            query.push(datasource.children);
            query.push(datasource.childFilters);
            query.push('safeHTML:' + datasource.childSafeHTML);
        } else {
            query.push('children:0');
        }
  }

    query = query.join(' ');

    this.initComponent({
        id: 'Stream',
        component: 'Echo.StreamServer.Controls.Stream',
        config: {
            target: element,
            query: query,
            plugins: plugins,
            slideTimeout: 0,
            item: {
                reTag: false,
                viaLabel: { icon: true }
            }
        }
    });
    return element;
};

gallery.methods._isAuthEnabled = function() {
    // TODO: We deferred this to a later phase. We need to look at people using
    // Gigya, and what FilePicker will do in remote environments.
    //return false;

    return this.config.get('auth.enabled') &&
           !!this.config.get('auth.janrainApp');
};

gallery.methods._getAuthPluginDefinition = function(config) {
    return $.extend({
        buttons: ['login'],
        title: this.labels.get('signin'),
        width: 270,
        height: 290,
        appId: this.config.get('auth.janrainApp')
    }, config);
};

gallery.css =
    '.{class:stream} { clear: both; margin: 0; }' +

    // Auth app CSS overrides...
    '.{class:container} .echo-identityserver-controls-auth-name { margin-right: 10px; }' +
    '.{class:container} .echo-streamserver-controls-stream-item-plugin-Reply-submitForm .echo-identityserver-controls-auth-logout { font-size: 12px; margin-top: 0px; }' +
    '.{class:container} .echo-identityserver-controls-auth-logout { font-size: 12px; margin-top: 6px; }' +
    '.{class:container} .echo-identityserver-controls-auth-name { font-size: 16px; }' +

    // Stream app CSS overrides...
    '.{class:container} .echo-streamserver-controls-stream-item-mediagallery-item img { width: 100% }' +
    '.{class:container} .echo-streamserver-controls-stream-item-mediagallery-item iframe { width: 100% }' +
    '.{class:container} .echo-streamserver-controls-stream-header { display: none; }' +

    // Visualization-specific
    '.visualization-pinboard .{class:auth} { float: left; margin: 14px .5%; border: 1px solid #ddd; background: #fff; box-shadow: 1px 1px 3px #666; padding: 0.5%; margin: 0.5%; width: 98%; }' +
    '.visualization-pinboard h2.echo-item-title { font-size: 1em; font-weight: normal; }' +

    '.echo-streamserver-controls-stream-item-data img { display: block; }' +

    '.visualization-streamlined .{class:auth} { float: left; margin: 14px .5%; border: 1px solid #ddd; background: #fff; box-shadow: 1px 1px 3px #666; padding: 0.5%; margin: 0.5%; width: 98%; }' +

    '.visualization-tabbed { max-width: 960px; background: #fff; margin: 0 auto; padding: 0 20px; } ' +
    '.{class:container}.visualization-tabbed h2 { text-align: center; color: #666; font-size: 1.5em; padding: 1em 0; margin: 0; } ' +
    '.visualization-tabbed .{class:auth} { float: right; background: #cfa; display: none; }' +
    '.visualization-tabbed .{class:tabs} { width: 100%; border-bottom: 2px solid #ddd; }' +
    '.visualization-tabbed .{class:tabs} ul { list-style: none; margin-bottom: 0; }' +
    '.visualization-tabbed .{class:tabs} a { display: block; float: left; margin: 8px 8px -2px 8px; -moz-border-radius: 10px 10px 0 0; -webkit-border-radius: 10px 10px 0 0; border-radius: 10px 10px 0 0; border: 1px solid #ccc; padding: 9px 50px; background: #999; color: #fff; }' +
    '.visualization-tabbed .{class:tabs} a.active { background: #b90000; }' +

    '.visualization-full .{class:auth} { float: left; margin: 14px .5%; border: 1px solid #ddd; background: #fff; box-shadow: 1px 1px 3px #666; padding: 0.5%; margin: 0.5%; width: 98%; }' +

    '';

Echo.App.create(gallery);

})(Echo.jQuery);
