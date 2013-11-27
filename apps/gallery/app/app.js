(function($) {
"use strict";

var gallery = Echo.App.manifest("Echo.Apps.MediaGallery");

if (Echo.App.isDefined(gallery)) return;

gallery.init = function() {
	if (!this.checkAppKey()) return;

	this.render();
	this.ready();
};

gallery.labels = {
	"signin": "Please sign in..."
};

gallery.config = {
	"targetURL": undefined,
	"auth": {
		"enabled": true,
		"janrainApp": undefined
	},
	"itemsPerPage": 30,
	// We use SystemFlagged state to avoid false-positive responses from spam filter.
	"itemState": "Untouched,ModeratorApproved",
	"replies": false,
	"likes": true,
	"flags": true,
	"sharing": false,

	// May be one of: "pinboard", "streamlined", "tabbed", "full"
	"display": {
		"visualization": "pinboard"
	}
};

gallery.dependencies = [{
	"url": "{config:cdnBaseURL.sdk}/identityserver.pack.js",
	"app": "Echo.IdentityServer.Controls.Auth"
}, {
	"url": "{config:cdnBaseURL.sdk}/streamserver.pack.js",
	"app": "Echo.StreamServer.Controls.Stream"
}];

gallery.templates.main =
	'<div class="{class:container} visualization-{config:display.visualization}">' +
		'<div class="{class:auth}"></div>' +
		'<div class="{class:tabs}"></div>' +
		'<div class="{class:stream}"></div>' +
	'</div>';

gallery.renderers.tabs = function(element) {
	var plugin = this;

	if (plugin.config.get("visualization", "") === "tabbed") {
		var html = '';

		var title = plugin.config.get("title", "");
		if (title != "") {
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
		"id": "Auth",
		"component": "Echo.IdentityServer.Controls.Auth",
		"config": {
			"target": element,
			"infoMessages": {"enabled": false},
			"labels": {"login": this.labels.get("signin")},
			"plugins": [this._getAuthPluginDefinition({"name": "JanrainConnector"})]
		}
	});
	return element;
};

gallery.renderers.stream = function(element) {
	var self = this;
	var janrainApp = this.config.get("auth.janrainApp");

	// Helper to reduce a repeated code line
	var isEnabled = function(name) {
		return !!self.config.get(name);
	};

	var plugins = [{
		"name": "ItemsRollingWindow",
		"moreButton": true,
		"url": "//cdn.echoenabled.com/apps/echo/dataserver/v3/plugins/items-rolling-window.js"
	}];

	switch (self.config.get("display.visualization")) {
		case "streamlined":
			this.config.set("replies", false);
			//plugins.push({
			//	"name": "MediaGallery",
			//	"url": "//" + window.location.host + "/apps/gallery/app/plugins/media-gallery.js",
			//	"removeInvalidItems": true,
			//});
			plugins.push({
				"name": "StreamlinedPinboardVisualization",
				"url": "//echocsthost.s3.amazonaws.com/apps/gallery/app/plugins/visualizations/pinboard-streamlined.js",
				"columns": [ 0, 330, 560, 900, 1100 ]
			});
			plugins.push({"name": "TweetDisplay"});

			break;

		case "tabbed":
			plugins.push({
				"name": "MediaGallery",
				"url": "//echocsthost.s3.amazonaws.com/apps/gallery/app/plugins/media-gallery.js",
				"removeInvalidItems": true,
			});
			plugins.push({
				"name": "TabbedPinboardVisualization",
				"url": "//echocsthost.s3.amazonaws.com/apps/gallery/app/plugins/visualizations/pinboard-tabbed.js"
			});
			break;

		case "full":
			plugins.push({
				"name": "FullScreenGalleryVisualization",
				"url": "//echocsthost.s3.amazonaws.com/apps/gallery/app/plugins/visualizations/gallery-fullscreen.js"
			});
			break;

		case "pinboard":
		default:
			plugins.push({
				"name": "MediaGallery",
				"url": "//echocsthost.s3.amazonaws.com/apps/gallery/app/plugins/media-gallery.js",
				"removeInvalidItems": true,
			});
			plugins.push({
				"name": "PinboardVisualization",
				"url": "//echocsthost.s3.amazonaws.com/apps/gallery/app/plugins/visualizations/pinboard.js",
				"columns": [ 0, 330, 560, 900, 1100 ]
			});
			break;
	}

	var itemState = this.config.get("itemState");
	var childrenQuery = this.config.get("replies")
		? "children:1 state:" + itemState
		: "children:0";
	var query = "childrenof:" + this.config.get("targetURL", "") +
			" itemsPerPage:" + this.config.get("itemsPerPage") +
			" safeHTML:off" +
			//" markers:photo" +
			" state:" + itemState + " " + childrenQuery;

	if (isEnabled("replies")) {
		var reply = {"name": "Reply"};
		if (this._isAuthEnabled()) {
			var auth = this._getAuthPluginDefinition({
				"name": "JanrainAuth",
				"labels": {"login": this.labels.get("signin")}
			});
			reply.nestedPlugins = [auth];
		}
		plugins.push(reply);
	}

	if (isEnabled("sharing") && janrainApp) {
		plugins.push({
			"name": "JanrainSharing",
			"appId": janrainApp
		});
	}

	if (isEnabled("likes")) {
		plugins.push({"name": "Like"});
	}

	if (isEnabled("flags")) {
		plugins.push({"name": "CommunityFlag"});
	}

	this.initComponent({
		"id": "Stream",
		"component": "Echo.StreamServer.Controls.Stream",
		"config": {
			"target": element,
			"query": query,
			"plugins": plugins,
			"slideTimeout": 0,
			"liveUpdates": { "transport": "websockets" },
			"item": {
				"viaLabel": {"icon": true}
			}
		}
	});
	return element;
};

gallery.methods._isAuthEnabled = function() {
	// TODO: We deferred this to a later phase. We need to look at people using
	// Gigya, and what FilePicker will do in remote environments.
	return false;

	return this.config.get("auth.enabled") && !!this.config.get("auth.janrainApp");
};

gallery.methods._getAuthPluginDefinition = function(config) {
	return $.extend({
		"buttons": ["login"],
		"title": this.labels.get("signin"),
		"width": 270,
		"height": 290,
		"appId": this.config.get("auth.janrainApp")
	}, config);
};

gallery.css =
	".{class:stream} { clear: both; margin: 0; }" +

	// Auth app CSS overrides...
	".{class:container} .echo-identityserver-controls-auth-name { margin-right: 10px; }" +
	".{class:container} .echo-streamserver-controls-stream-item-plugin-Reply-submitForm .echo-identityserver-controls-auth-logout { font-size: 12px; margin-top: 0px; }" +
	".{class:container} .echo-identityserver-controls-auth-logout { font-size: 12px; margin-top: 6px; }" +
	".{class:container} .echo-identityserver-controls-auth-name { font-size: 16px; }" +

	// Stream app CSS overrides...
	".{class:container} .echo-streamserver-controls-stream-item-mediagallery-item img { width: 100% }" +
	".{class:container} .echo-streamserver-controls-stream-item-mediagallery-item iframe { width: 100% }" +
	".{class:container} .echo-streamserver-controls-stream-header { display: none; }" +

	// Visualization-specific
	".visualization-pinboard .{class:auth} { float: left; margin: 14px .5%; border: 1px solid #ddd; background: #fff; box-shadow: 1px 1px 3px #666; padding: 0.5%; margin: 0.5%; width: 98%; }" +

	".visualization-streamlined .{class:auth} { float: left; margin: 14px .5%; border: 1px solid #ddd; background: #fff; box-shadow: 1px 1px 3px #666; padding: 0.5%; margin: 0.5%; width: 98%; }" +

	".visualization-tabbed { max-width: 960px; background: #fff; margin: 0 auto; padding: 0 20px; } " +
	".{class:container}.visualization-tabbed h2 { text-align: center; color: #666; font-size: 1.5em; padding: 1em 0; margin: 0; } " +
	".visualization-tabbed .{class:auth} { float: right; background: #cfa; display: none; }" +
	".visualization-tabbed .{class:tabs} { width: 100%; border-bottom: 2px solid #ddd; }" +
	".visualization-tabbed .{class:tabs} ul { list-style: none; margin-bottom: 0; }" +
	".visualization-tabbed .{class:tabs} a { display: block; float: left; margin: 8px 8px -2px 8px; -moz-border-radius: 10px 10px 0 0; -webkit-border-radius: 10px 10px 0 0; border-radius: 10px 10px 0 0; border: 1px solid #ccc; padding: 9px 50px; background: #999; color: #fff; }" +
	".visualization-tabbed .{class:tabs} a.active { background: #b90000; }" +

	".visualization-full .{class:auth} { float: left; margin: 14px .5%; border: 1px solid #ddd; background: #fff; box-shadow: 1px 1px 3px #666; padding: 0.5%; margin: 0.5%; width: 98%; }" +

	"";

Echo.App.create(gallery);

})(Echo.jQuery);
