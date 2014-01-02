(function($) {

// NOTE: When previewing this app you will get two errors in your console log:
// [Echo SDK] error : Unexpected token _  | args:  undefined environment.pack.js:205
// [Echo SDK] error : Unexpected token _  | args:  undefined environment.pack.js:205
//
// These can be safely ignored. They're actually postMessages from Twitter, and
// Echo is intercepting but not processing them correctly. They don't affect the
// functionality of the app.

if (Echo.Control.isDefined("Echo.Apps.Poll.Dashboard")) return;

var dashboard = Echo.Control.manifest("Echo.Apps.Poll.Dashboard");

dashboard.inherits = Echo.Utils.getComponent("Echo.AppServer.Dashboards.AppSettings");

/**
 * We have a LOT of dependencies here - can we clean this up?
 * TODO: Probably we need to start working on a CST build pack.
 */
dashboard.dependencies = [{
	url: "{config:cdnBaseURL.apps.appserver}/controls/configurator.js",
	control: "Echo.AppServer.Controls.Configurator"
}, {
	url: "{config:cdnBaseURL.apps.dataserver}/full.pack.js",
	control: "Echo.DataServer.Controls.Pack"
},
{ url: "//echocsthost.s3.amazonaws.com/polyfills/ecl.js" },
{ url: "//echocsthost.s3.amazonaws.com/polyfills/dashboard-support.js" },
{ url: "//echocsthost.s3.amazonaws.com/polyfills/data-sources.js" },
{ url: "//echocsthost.s3.amazonaws.com/apps/dashboard-templates.js" },
{
	url: "//cdn.echoenabled.com/apps/echo/media-gallery/dashboard/data-source.js",
	control: "Echo.Apps.MediaGallery.InstanceDataSource"
}, {
	url: "//echocsthost.s3.amazonaws.com/controls/app-key-list.js",
	control: "Echo.AppServer.Controls.Configurator.Items.AppKeyList"
}, {
	url: "//echocsthost.s3.amazonaws.com/controls/domain-list.js",
	control: "Echo.AppServer.Controls.Configurator.Items.DomainList"
}, {
	url: "//echocsthost.s3.amazonaws.com/controls/file-picker.js",
	control: "Echo.AppServer.Controls.Configurator.Items.FilePicker"
}, {
	url: "//echocsthost.s3.amazonaws.com/controls/hidden-value.js",
	control: "Echo.AppServer.Controls.Configurator.Items.HiddenValue"
}, {
	url: "//echocsthost.s3.amazonaws.com/controls/color-picker.js",
	control: "Echo.AppServer.Controls.Configurator.Items.ColorPicker"
}
];

dashboard.config = {
	ecl: [],
	janrainapps: []
};

/**
 * Convert our template into ECL when we get loaded.
 */
dashboard.init = function() {
	var self = this,
	    parent = $.proxy(this.parent, this);

	// TODO: We should NOT need to do this. Dashboard controls should be able to
	// access this data themselves.
	Echo.Polyfills.DashboardSupport.configData = self.config.data.data;

	self.events.subscribe({
		topic: 'Echo.AppServer.Controls.Configurator.onItemChange',
        handler: function(topic, args) {
			// TODO: Refactor out into separate method
			var config = $.extend({}, self.config.data.data.instance.config);

			// Figured this would mess with Dashboard's own behavior so we're
			// working with a clone of the object. That's the trouble with being
			// a post-update-hook girl in a pre-update-hook world...
			if (!config.datasource.targetURLSource) {
				config.datasource.targetURLSource = 'autogen';
			}
			Echo.Utils.set(config, args.name, args.values.current);

			if (config.datasource.targetURLSource == 'autogen') {
				var url = Echo.Polyfills.DataSources.getTargetUrl(config.datasource);

				if (config.pollbuilder.manual) {
					return;
				}

				Echo.Utils.log({
					component: 'Poll Builder',
					type: 'info',
					message: 'Auto-generating data for  ' + url,
					args: config
				});

				// TODO: The SDK provides an API.Request tool, but this isn't one of
				// its pre-defined endpoints and it doesn't seem to add much value
				// for what we're doing here. Reconsider using it later?
				var updates = [];
				updates.push({
					url: url,
					// TODO: A template would be nice here.
					content: '<div class="header">' +
							 ((config.pollbuilder.heading.title) ? '<div class="title">' + config.pollbuilder.heading.title + '</div>' : '') +
							 ((config.pollbuilder.heading.image) ? '<img src="' + config.pollbuilder.heading.image + '" class="image" />' : '') +
							 ((config.pollbuilder.heading.question) ? '<div class="question">' + config.pollbuilder.heading.question + '</div>' : '') +
							 '</div>'
				});

				// TODO: TITLE tags or other 'A' tag sweetness?
				// This helper just cleans up the code below a bit. We really
				// should use templates for this...
				var registerUpdateRequest = function(subpath, option) {
					if (!option) return;

					updates.push({
						url: url + '/' + subpath,
						// TODO: A template would be nice here.
						content: '<div class="answer">' +
								 ((option.image) ? '<img src="' + option.image + '" />' : '') +
								 ((option.answer) ? '<span>' + option.answer + '</span>' : '') +
								 '</div>',
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
				registerUpdateRequest('option9', config.pollbuilder.option9);
				registerUpdateRequest('option10', config.pollbuilder.option10);
				registerUpdateRequest('option11', config.pollbuilder.option1);
				registerUpdateRequest('option12', config.pollbuilder.option12);

				console.log('Sending proxy submission now...');
				$.ajax({
					url: 'http://echosandbox.com/cst/poll-proxy/index.php',
					data: {
						busname: config.datasource.busName,
						updates: updates
					},
					timeout: 5000,
					dataType: 'jsonp',
					success: function(data) {
						console.log('Success!');
					},
					error: function(data) {
						console.log('Error: ', data);
					}
				});
			}
		}
	});

	var deferreds = [$.Deferred()];
	$.when.apply($, deferreds).done(function() {
		// We hold off on calling our parent until everything else has loaded
		parent();
	});

	Echo.Polyfills.ECL.templateECL(self, "/poll/dashboard", deferreds[0].resolve);
};

/**
 * DeclareInitialConfig() does the same thing plugin.config={} does in a plugin.
 * Except this is a method where that one is an object...
 *
 * To avoid the need to do duplicate work, the ECL Polyfill provides a helper
 * that can convert from ECL to a default config object. Whether you use it or
 * not, make SURE this method is defined and returns an object with a default
 * value for every config form field. Otherwise you can get Reference Error
 * exceptions and break the dashboard, as it tries to look for these values.
 */
dashboard.methods.declareInitialConfig = function() {
	//var appkeys = this.config.get("appkeys");
	var janrainapps = this.config.get("janrainapps");

	return {
		display: {
			header: '',
			footer: '',
			visualization: 'list',
			showResults: 'after',
			percent: true,
			count: false,
			css: '',
			skinname: ''
		},
		datasource: {
			appkey: '',
			domain: '',
			targetURLSource: 'autogen',
			specifiedURL: '',

			// This is a hidden config setting added to all polls. If the data
			// source URL is set to 'automatic', and a property is selected, we
			// will auto-generate and use a targetURL of the pattern:
			//
			//    http://DOMAIN/polls/{instanceName}/{option1..N}
			//
			instanceName: this.data.instance.name,
			busName: this.data.customer.echo.backplane.busName
		},
		pollbuilder: {
			manual: false,
			// This is getting annoying keeping these in sync. Can we at least
			// access our ECL by the time we get here so we can define them
			// automatically?
			//
			// TODO: Yes, actually we have access to our ECL by the time we get
			// here. Write a polyfill to convert from ECL to defaults using the
			// values defined there. It would be awesome if the Grunt build task
			// could also export that to something app.js could use. The only
			// risk is that since there's no way to "upgrade" the schema for an
			// app's stored settings, a developer should probably stay involved
			// after a change because there may need to be init code in the app
			// for every possible combination of options that have ever existed.
			heading: { title: '', image: '', question: '' },
			option1: { image: '', answer: '' },
			option2: { image: '', answer: '' },
			option3: { image: '', answer: '' },
			option4: { image: '', answer: '' },
			option5: { image: '', answer: '' },
			option6: { image: '', answer: '' },
			option7: { image: '', answer: '' },
			option8: { image: '', answer: '' },
			option9: { image: '', answer: '' },
			option10: { image: '', answer: '' },
			option11: { image: '', answer: '' },
			option12: { image: '', answer: '' }
		},
		auth: {
			janrainApp: janrainapps.length ? janrainapps[0].name : undefined
		}
	}
};

Echo.Control.create(dashboard);

})(Echo.jQuery);
