(function($) {
'use strict';

var poll = Echo.App.manifest('Echo.Apps.Poll');

if (Echo.App.isDefined(poll)) return;

poll.init = function() {
	// TODO: Set up the appropriate CDN URL based on our channel.
	// console.log(this);

	this.render();
	this.ready();
};

poll.labels = {
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
		header: '',
		footer: '',
		visualization: 'list',
		showResults: 'after',
		percent: true,
		count: false
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
//		'<div class="{class:auth}"></div>' +
//		'<div class="{class:publish}"></div>' +
	    '<div class="{class:header}">{config:display.header}</div>' +
		'<div class="{class:stream} {config:display.visualization}"></div>' +
	    '<div class="{class:footer}">{config:display.footer}</div>' +
	'</div>';

poll.renderers.stream = function(element) {
	var app = this,
	    plugins = [],
		// TODO: Better way to do this?
		cdnURL = '//echocsthost.s3.amazonaws.com';

	element.addClass('show-results-' + app.config.get('display.showResults'));

	plugins.push({
		name: 'VoteDataProcessor',
		url: cdnURL + '/apps/poll/plugins/vote-data-processor.js'
	});

	var childrenItems = 2;
	switch (app.config.get('display.visualization')) {
		case 'tugofwar':
			plugins.push({
				name: 'TugOfWar',
				url: cdnURL + '/apps/poll/plugins/tug-of-war.js'
			});
			break;

		case 'list':
			plugins.push({
				name: 'VerticalList',
				url: cdnURL + '/apps/poll/plugins/vertical-list.js'
			});
			childrenItems = 10;
			break;

		case 'sidebyside':
			plugins.push({
				name: 'SideBySide',
				url: cdnURL + '/apps/poll/plugins/side-by-side.js'
			});
			break;

		case 'reaction':
			plugins.push({
				name: 'Reaction',
				url: cdnURL + '/apps/poll/plugins/reaction.js'
			});
			childrenItems = 10;
			break;

		case 'textbuttons':
			plugins.push({
				name: 'TextButtons',
				url: cdnURL + '/apps/poll/plugins/textbuttons.js'
			});
			break;

		case 'updown':
			plugins.push({
				name: 'UpDownButtons',
				url: cdnURL + '/apps/poll/plugins/updownbuttons.js'
			});
			break;
	}

	var url = Echo.Polyfills.DataSources.getTargetUrl(app.config.get('datasource'));
	var query = 'url:' + url + ' safeHTML:off children:1 childrenItemsPerPage:' +
				childrenItems + ' childrenSortOrder:reverseChronological';

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
/*
poll.renderers.auth = function(element) {
	var app = this,
		datasource = app.config.get('datasource');

	if (window.location.href.indexOf('third-party/preview.html') != -1) {
		var identityManager = {
			width: 400,
			height: 240,
			url: 'https://' + datasource.busName + '.rpxnow.com/openid/embed?flags=stay_in_window,no_immediate&token_url=http%3A%2F%2Fechoenabled.com%2Fapps%2Fjanrain%2Fwaiting.html&bp_channel='
		};

        Echo.Loader.initApplication({
            script: '//cdn.echoenabled.com/sdk/v3/identityserver.pack.js',
            component: 'Echo.IdentityServer.Controls.Auth',
            backplane: {
                serverBaseURL: 'https://api.echoenabled.com/v1',
                busName: datasource.busName
            },
            config: {
                target: element,
                appkey: datasource.appkey.replace('streamserver', 'auth'),
                targetURL: Echo.Polyfills.DataSources.getTargetUrl(datasource),
				identityManager: {
					"login": identityManager,
					"signup": identityManager
				}
            }
		});
	}

	return element;
};

poll.renderers.publish = function(element) {
	var app = this,
		config = app.config.data,
		datasource = app.config.get('datasource');

	if (window.location.href.indexOf('third-party/preview.html') != -1) {
		element.html('<a href="#">Publish Poll Data</a><br /><hr /><br />');
		element.click(function(e) {
			e.preventDefault();
			console.log('publish', Backplane.getChannelID());
			console.log(datasource);

			var url = Echo.Polyfills.DataSources.getTargetUrl(datasource);

			Echo.Utils.log({
				component: 'Poll Builder',
				type: 'info',
				message: 'Publishing data for ' + url,
				args: app.config
			});

			// TODO: The SDK provides an API.Request tool, but this isn't one of
			// its pre-defined endpoints and it doesn't seem to add much value
			// for what we're doing here. Reconsider using it later?

			var updates = [];
			updates.push({
				url: url,
				content: '<div class="header">' + (config.display.header) ? config.display.header : '' + '</div>',
			});

			// TODO: TITLE tags or other 'A' tag sweetness?
			var registerUpdateRequest = function(subpath, option) {
				updates.push({
					url: url + '/' + subpath,
					content: ((option.image) ? '<img src="' + option.image + '" />' : '') +
							 ((option.answer) ? '<a href="#" class="submit-vote">' + option.answer + '</a>' : ''),
				});
			}

			registerUpdateRequest('option1', config.pollbuilder.option1);
			registerUpdateRequest('option2', config.pollbuilder.option2);
			registerUpdateRequest('option3', config.pollbuilder.option3);
			registerUpdateRequest('option4', config.pollbuilder.option4);
			registerUpdateRequest('option5', config.pollbuilder.option5);
			registerUpdateRequest('option6', config.pollbuilder.option6);
			registerUpdateRequest('option7', config.pollbuilder.option7);
			registerUpdateRequest('option8', config.pollbuilder.option8);

			(function handleUpdates() {
				if (updates.length < 1) return;
				var update = updates.shift();

				app._createOrUpdateItem(app, update, function() {
					//handleUpdates();
				});
			})();
		});
	}

	return element;
};

poll.methods._createOrUpdateItem = function(app, update, callback) {
	// First see if the item exists.
	$.ajax({
		url: 'https://api.echoenabled.com/v1/search',
		data: {
			q: 'url:' + update.url + ' safeHTML:off children:0',
			appkey: app.config.get('datasource.appkey'),
		},
		timeout: 5000,
		dataType: 'jsonp',
		success: function(data) {
			if (data.entries.length > 0) {
				console.log('Entry ' + update.url + ' exists, updating...');
				callback();
			} else {
				console.log('Entry ' + update.url + ' does not exist, creating...');
				callback();

				console.log(Backplane.getChannelID());
				var target = update.url.split('/');
				target.pop();

				$.ajax({
					url: 'https://apps.echoenabled.com/v2/esp/activity',
					data: {
						appkey: app.config.get('datasource.appkey'),
						sessionID: Backplane.getChannelID(),
						content: {
							avatar: '',
							name: Echo.UserSession._getName(),
							// ESP will reject a posting with an empty content
							// block. Spaces don't count.
							content: update.content,
							source: {},
							target: target.join('/'),
							verb: 'post',
							type: 'http://activitystrea.ms/schema/1.0/article'
						},
					},
					timeout: 5000,
					success: function(data) {
						console.log('success', data);
					},
					error: function(data) {
						// TODO: Error handling
						console.log('error', data);
					}
				});
			}
		}
	});
};
*/
poll.css = '.{class:publish} { text-align: center; }';

Echo.App.create(poll);

})(Echo.jQuery);
