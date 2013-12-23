(function($) {

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
	url: "//echocsthost.s3.amazonaws.com/controls/poll-editor.js",
	control: "Echo.AppServer.Controls.Configurator.Items.PollEditor"
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
	var self = this, parent = $.proxy(this.parent, this);

	// TODO: We should NOT need to do this. Dashboard controls should be able to
	// access this data themselves.
	Echo.Polyfills.DashboardSupport.configData = self.config.data.data;

	console.log('init', self);
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
	console.log('declare', this);
	return {
		datasource: {
			// This is a hidden config setting added to all polls. If the data
			// source URL is set to 'automatic', and a property is selected, we
			// will auto-generate and use a targetURL of the pattern:
			//
			//    http://DOMAIN/polls/{instanceName}/{option1..N}
			//
			instanceName: this.data.instance.name
		},
		auth: {
			janrainApp: janrainapps.length ? janrainapps[0].name : undefined
		}
	}
};

dashboard.events = {
	// TODO: Tried to hook onUpdate but it didn't get called?
	// TODO: For the moment this is pretty much hard-coded behavior just for
	// autogen polls. Everything else is assumed to be set up externally via
	// a 'submit'ted XML file. See samples/*.xml for examples.
	'Echo.AppServer.Controls.Configurator.onItemChange': function(topic, args) {
		var self = this,
		    config = $.extend({}, this.config.data.data.instance.config);

		// Figured this would mess with Dashboard's own behavior so we're
		// working with a clone of the object. That's the trouble with being
		// a post-update-hook girl in a pre-update-hook world...
		if (!config.datasource.targetURLSource) {
			config.datasource.targetURLSource = 'autogen';
		}
		Echo.Utils.set(config, args.name, args.values.current);

		if (config.datasource.targetURLSource == 'autogen') {
			var url = Echo.Polyfills.DataSources.getTargetUrl(config.datasource);

			Echo.Utils.log({
				component: 'Poll Builder',
				type: 'info',
				message: 'Auto-generating data for  ' + url,
				args: config
			});

			// TODO: The SDK provides an API.Request tool, but this isn't one of
			// its pre-defined endpoints and it doesn't seem to add much value
			// for what we're doing here. Reconsider using it later?
			$.ajax({
				url: 'https://api.echoenabled.com/v1/search',
				data: {
					q: 'url:' + url + ' safeHTML:off children:1',
					appkey: config.datasource.appkey,
				},
				timeout: 5000,
				dataType: 'jsonp',
				success: function(data) {
					console.log(data);
				},
				error: function(data) {
					console.log(data);
				}
			});
		}
	}
};

Echo.Control.create(dashboard);

})(Echo.jQuery);
