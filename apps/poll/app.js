(function($) {
'use strict';

// TODO: We re-branded this LivePoll but had too many things running by that
// time to really rename it...
var poll = Echo.App.manifest('Echo.Apps.Poll');

if (Echo.App.isDefined(poll)) return;

/**
 * Initialize the LivePoll app
 */
poll.init = function() {
	var app = this;

	// TODO: Set up the appropriate CDN URL based on our channel.

	// TODO: Is there something better we can use? We need a unique ID for our
	// app to help scope the CSS we're about to add. HTML5 supports CSS scoping
	// but we can't use it yet cross-browser, and the polyfill is bulky and does
	// not always work. This is different from namespacing (which we also need).
	// What we're doing here is making sure if you have two polls on the page,
	// their CSS can't break each other. Currently we do this cooperatively -
	// the apps' CSS config fields must include {pollid} prefixes...
	// This only works if we use a canvas... Maybe a singleton somewhere would
	// be better?
	// TODO: Deferred for later use, went with a skin name for now
	// var uniqueid = this.config.get('canvasId', 'livepoll').replace('/', '-');

	// Initializers calls the css hook BEFORE the init hook. So we have to
	// pretty much do this ourselves... Note that although most sample code puts
	// config blocks before the init() hook in the code, that is ALSO called
	// before init... That one is actually good for us because at least we have
	// our config data by the time we get here...
/*	 Echo.Utils.addCSS(Echo.Utils.substitute({
		template: this.config.get('display.css'),
		instructions:
	}), uniqueid);*/

	app.config.get('target')
		.addClass('show-results-' + app.config.get('display.showResults'))
	    .addClass('poll-skin-' + app.config.get('display.skinname')
				                           .replace(' ', '-'));

	app.render();
	app.ready();
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
	datasource: {
		appkey: '',
		domain: '',
		// Here's an example of where this is a pain. The default in the
		// Dashboard 'autogen'. If we don't specify it as a default here as well
		// then it will arrive as an empty string!
		targetURLSource: 'autogen',
		specifiedURL: '',
		instanceName: '',
	},

	display: {
		visualization: 'list',
		showResults: 'after',
		percent: true,
		count: false,
		skinname: '',
		css: ''
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
	url: '{config:cdnBaseURL.sdk}/streamserver.pack.js',
	app: 'Echo.StreamServer.Controls.Stream'
},
{ url: '//echocsthost.s3.amazonaws.com/polyfills/data-sources.js' }
];

poll.templates.main =
	'<div class="{class:container}">' +
		'<div class="{class:stream} {config:display.visualization}"></div>' +
	'</div>';

poll.renderers.stream = function(element) {
	var app = this,
	    plugins = [],
		// TODO: Better way to do this?
		cdnURL = '//echocsthost.s3.amazonaws.com';

	plugins.push({
		name: 'VoteDataProcessor',
		url: cdnURL + '/apps/poll/plugins/vote-data-processor.js'
	});

	var childrenItems = 10;
	switch (app.config.get('display.visualization')) {
		case 'tugofwar':
			plugins.push({
				name: 'TugOfWar',
				url: cdnURL + '/apps/poll/plugins/tug-of-war.js'
			});
			childrenItems = 2;
			break;

		case 'list':
			plugins.push({
				name: 'VerticalList',
				url: cdnURL + '/apps/poll/plugins/vertical-list.js'
			});
			break;

		case 'sidebyside':
			plugins.push({
				name: 'SideBySide',
				url: cdnURL + '/apps/poll/plugins/side-by-side.js'
			});
			childrenItems = 2;
			break;

		case 'reaction':
			plugins.push({
				name: 'Reaction',
				url: cdnURL + '/apps/poll/plugins/reaction.js'
			});
			break;

		case 'textbuttons':
			plugins.push({
				name: 'TextButtons',
				url: cdnURL + '/apps/poll/plugins/textbuttons.js'
			});
			childrenItems = 2;
			break;

		case 'updown':
			plugins.push({
				name: 'UpDownButtons',
				url: cdnURL + '/apps/poll/plugins/updownbuttons.js'
			});
			childrenItems = 2;
			break;
	}

	var url = Echo.Polyfills.DataSources.getTargetUrl(app.config.get('datasource'));
	var query = 'url:' + url + ' safeHTML:off children:1 childrenItemsPerPage:' +
				childrenItems + ' childrenSortOrder:chronological';

	// TODO: AppServer does not allow us to run a config-update hook. We had a
	// schema change on where we store the appkey, so we need some special cases
	// here for the different spots.
	var appkey = app.config.get('datasource.appkey');
	if (!appkey) appkey = app.config.get('appkey');

	var stream = this.initComponent({
		id: 'Stream',
		component: 'Echo.StreamServer.Controls.Stream',
		config: {
			target: element,
			appkey: appkey,
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
				viaLabel: { icon: false, text: false  },
				showCount: app.config.get('display.count'),
				showPercent: app.config.get('display.percent')
			}
		}
	});

	return element;
};

poll.css =
	// Note that there are more app styles in the VoteDataProcessor plugin. We
	// had to put them there because Stream.Item substitutions don't work here.
	'.{class} div { box-sizing: border-box; }' +
	'.{class} img { max-width: 100%; display: block; }';

Echo.App.create(poll);

})(Echo.jQuery);
