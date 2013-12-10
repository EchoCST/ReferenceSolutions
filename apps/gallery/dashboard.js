(function($) {

if (Echo.Control.isDefined("Echo.Apps.MediaGallery.Dashboard")) return;

var dashboard = Echo.Control.manifest("Echo.Apps.MediaGallery.Dashboard");

dashboard.inherits = Echo.Utils.getComponent("Echo.AppServer.Dashboards.AppSettings");

/**
 * Convert our template into ECL when we get loaded.
 */
dashboard.dependencies = [{
	"url": "{config:cdnBaseURL.apps.appserver}/controls/configurator.js",
	"control": "Echo.AppServer.Controls.Configurator"
}, {
	"url": "{config:cdnBaseURL.apps.dataserver}/full.pack.js",
	"control": "Echo.DataServer.Controls.Pack"
}, {
	"url": "//echocsthost.s3.amazonaws.com/polyfills/ecl.js"
}, {
	"url": "//cdn.echoenabled.com/apps/echo/media-gallery/dashboard/data-source.js",
	"control": "Echo.Apps.MediaGallery.InstanceDataSource"
}, {
	"url": "//echocsthost.s3.amazonaws.com/controls/app-key-list.js",
	"control": "Echo.AppServer.Controls.Configurator.Items.AppKeyList"
}, {
	"url": "//echocsthost.s3.amazonaws.com/apps/dashboard-templates.js"
}];

dashboard.config = {
	ecl: [],
	janrainapps: []
};

/**
 * Convert our template into ECL when we get loaded.
 */
dashboard.init = function() {
	var self = this, parent = $.proxy(this.parent, this);

	var deferreds = [$.Deferred()];
	$.when.apply($, deferreds).done(function() {
		// We hold off on calling our parent until everything else has loaded
		parent();
	});

	Echo.Polyfills.ECL.templateECL(self, "/gallery/dashboard", deferreds[0].resolve);
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
//		targetURL: this._assembleTargetURL(),
		//appkey: appkeys.length ? appkeys[0].key : undefined,
		auth: {
			janrainApp: janrainapps.length ? janrainapps[0].name : undefined
		}
	}
};

Echo.Control.create(dashboard);

})(Echo.jQuery);
