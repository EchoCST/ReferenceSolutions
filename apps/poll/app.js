(function($) {
"use strict";

var poll = Echo.App.manifest("Echo.Apps.Poll");

if (Echo.App.isDefined(poll)) return;

poll.init = function() {
	if (!this.checkAppKey()) return;

	this.render();
	this.ready();
};

poll.labels = {
	"signin": "Please sign in..."
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
poll.config = {
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

poll.dependencies = [{
	"url": "{config:cdnBaseURL.sdk}/streamserver.pack.js",
	"app": "Echo.StreamServer.Controls.Stream"
}];

poll.templates.main =
	'<div class="{class:container}">' +
	    '<div class="{class:header}">{config:display.header}</div>' +
		'<div class="{class:stream} {config:display.visualization}"></div>' +
	    '<div class="{class:footer}">{config:display.footer}</div>' +
	'</div>';

poll.renderers.stream = function(element) {
	var app = this,
	    plugins = [];

	plugins.push({
		name: 'VoteDataProcessor',
		url: '//echocsthost.s3.amazonaws.com/apps/poll/plugins/vote-data-processor.js'
	});

	switch (app.config.get('display.visualization')) {
		case "tugofwar":
			plugins.push({
				name: 'TugOfWar',
				url: '//echocsthost.s3.amazonaws.com/apps/poll/plugins/tug-of-war.js'
			});
			break;
	}

	var query = 'url:' +
	            app.config.get("datasource.specifiedURL") +
				' sortOrder:repliesDescending children:1';

	var stream = this.initComponent({
		id: 'Stream',
		component: 'Echo.StreamServer.Controls.Stream',
		config: {
			target: element,
			query: query,
			plugins: plugins,
			slideTimeout: 0,
			infoMessages: { enabled: false },
			liveUpdates: {
				enabled: false
			},
			state: {
				label: { icon: false, text: false },
				toggleBy: 'none'
			},
			item: {
				infoMessages: { enabled: false },
				reTag: false,
				viaLabel: { icon: false, text: false  }
			}
		}
	});

/*	setInterval(function() {
		console.log('Refreshing stream');
		stream.refresh();
	}, 60000);
*/
	return element;
};

Echo.App.create(poll);

})(Echo.jQuery);
