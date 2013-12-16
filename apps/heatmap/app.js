(function($) {
"use strict";

var heatmap = Echo.App.manifest("Echo.Apps.HeatMap");

if (Echo.App.isDefined(heatmap)) return;

heatmap.init = function() {
	if (!this.checkAppKey()) return;

	this.set('stream', null);

	this.render();
	this.ready();
};

heatmap.labels = {
	"signin": "Please sign in..."
};

/**
 * Configuration defaults.
 *
 * NOTE: These defaults must match those defined in the Dashboard template
 * _exactly_. When we receive an app config, if the user sets a setting to its
 * default value, the setting is _remove.d_ That means if we define a different
 * default here, we will get the default app.js defines, not the default from
 * the dashboard.
 *
 * This is especially confusing for checkboxes. If a checkbox defaults to True
 * in Dashboard and the user has it checked, if we then have it defaulting to
 * false here or simply not defined it will always evaluate to false!
 */
heatmap.config = {
	appkey: "",
	query: "",

	display: {
		header: "",
		footer: "",
		visualization: "pinboard",
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
		fpkey: ""
	},

	auth: {
		enabled: false,
		janrainApp: undefined
	},

	// We don't use this but StreamServer dies if we don't have it
	children: {
		maxDepth: 0,
		itemsPerPage: 15
	},
};

heatmap.dependencies = [{
	"url": "{config:cdnBaseURL.sdk}/streamserver.pack.js",
	"app": "Echo.StreamServer.Controls.Stream"
}];

heatmap.templates.main =
	'<div class="{class:container}">' +
	    '<div class="{class:map}"></div>' +
		'<div class="{class:stream}"></div>' +
	'</div>';

heatmap.renderers.stream = function(element) {
	var app = this;

	//streamserver.add-markers:"geo.location:${geo.longitude};${geo.latitude},geo.marker" | geo
	var query = 'childrenof:' +
	            app.config.get("datasource.specifiedURL") +
				' markers:geo.marker itemsPerPage:45';

	var stream = this.initComponent({
		id: 'Stream',
		component: 'Echo.StreamServer.Controls.Stream',
		config: {
			target: element,
			query: query,
			plugins: [{
				name: "HeatMapDataHandler",
				url: "//echocsthost.s3.amazonaws.com/apps/heatmap/plugins/heatmap-data.js"
			}],
		}
	});

	app.set('stream', stream);

	console.log(this);

	// We don't actually show the stream. We just listen to its events.
	//element.hide();

	return element;
};

heatmap.renderers.map = function(element) {
	var app = this;

	element.html('Map Goes Here');

	return element;
};

Echo.App.create(heatmap);

})(Echo.jQuery);
