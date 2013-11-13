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
	"itemsPerPage": 15,
	// We use SystemFlagged state to avoid false-positive responses from spam filter.
	"itemState": "Untouched,SystemFlagged,ModeratorApproved",
	"replies": true,
	"likes": true,
	"flags": true,
	"sharing": false,

	// May be one of: "pinboard", "streamlined", "tabbed", "full"
	"visualization": "pinboard"
};

gallery.dependencies = [{
	"url": "{config:cdnBaseURL.sdk}/identityserver.pack.js",
	"app": "Echo.IdentityServer.Controls.Auth"
}, {
	"url": "{config:cdnBaseURL.sdk}/streamserver.pack.js",
	"app": "Echo.StreamServer.Controls.Stream"
}];

gallery.templates.main =
	'<div class="{class:container}">' +
		'<div class="{class:auth}"></div>' +
		'<div class="{class:tabs}"></div>' +
		'<div class="{class:stream}"></div>' +
	'</div>';

gallery.renderers.tabs = function(element) {
/*	$(element).html('<ul class="{class:container}">' +
	'<li><a href="#" data-source="all">All</a></li>' +
	'<li><a href="#" data-source="twitter"><i class="twitter"></i>Twitter</a></li>' +
	'<li><a href="#" data-source="facebook"><i class="facebook"></i>Facebook</a></li>' +
	'<li><a href="#" data-source="instagram"><i class="instagram"></i>Instagram</a></li>' +
	'<li><a href="#" data-source="youtube"><i class="youtube"></i>YouTube</a></li>' +
	'</ul>');
*/
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
		"url": "http://cdn.echoenabled.com/apps/echo/dataserver/v3/plugins/items-rolling-window.js"
	}, {
		"name": "MediaGallery",
		"url": "//echosandbox.com/reference/apps/gallery/app/plugins/media-gallery.js",
		"removeInvalidItems": true,
	}];

	switch (self.config.get("visualization")) {
		case "streamlined":
			plugins.push({
				"name": "StreamlinedPinboardVisualization",
				"url": "//echosandbox.com/reference/apps/gallery/app/plugins/visualizations/pinboard-streamlined.js"
			});
			break;
		case "tabbed":
			plugins.push({
				"name": "TabbedPinboardVisualization",
				"url": "//echosandbox.com/reference/apps/gallery/app/plugins/visualizations/pinboard-tabbed.js"
			});
			break;
		case "full":
			plugins.push({
				"name": "FullScreenGalleryVisualization",
				"url": "//echosandbox.com/reference/apps/gallery/app/plugins/visualizations/gallery-fullscreen.js"
			});
			break;
		case "pinboard":
		default:
			plugins.push({
				"name": "PinboardVisualization",
				"url": "//echosandbox.com/reference/apps/gallery/app/plugins/visualizations/pinboard.js"
			});
			break;
	}

	var itemState = this.config.get("itemState");
	var childrenQuery = this.config.get("replies")
		? "children:1 state:" + itemState
		: "children:0";
	var query = "childrenof:" + this.config.get("targetURL", "") +
			" itemsPerPage:" + this.config.get("itemsPerPage") +
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
	".{class:auth} { float: left; margin: 14px .5%; }" +
	".{class:stream} { clear: both; margin: 14px .25%; }" +

	// Auth app CSS overrides...
	".{class:container} .echo-identityserver-controls-auth-name { margin-right: 10px; }" +
	".{class:container} .echo-streamserver-controls-stream-item-plugin-Reply-submitForm .echo-identityserver-controls-auth-logout { font-size: 12px; margin-top: 0px; }" +
	".{class:container} .echo-identityserver-controls-auth-logout { font-size: 12px; margin-top: 6px; }" +
	".{class:container} .echo-identityserver-controls-auth-name { font-size: 16px; }" +

	// Stream app CSS overrides...
	".{class:container} .echo-streamserver-controls-stream-item-mediagallery-item img { width: 100% }" +
	".{class:container} .echo-streamserver-controls-stream-item-mediagallery-item iframe { width: 100% }" +
	".{class:container} .echo-streamserver-controls-stream-header { display: none; }";

Echo.App.create(gallery);

})(Echo.jQuery);
