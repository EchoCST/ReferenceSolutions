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
	"url": "//echocsthost.s3.amazonaws.com/controls/app-key-list.js",
	"control": "Echo.AppServer.Controls.Configurator.Items.AppKeyList"
}, {
	"url": "//echocsthost.s3.amazonaws.com/controls/query-builder.js",
	"control": "Echo.AppServer.Controls.Configurator.Items.QueryBuilder"
}, {
	"url": "//echocsthost.s3.amazonaws.com/polyfills/ecl.js"
},  {
	"url": "//echocsthost.s3.amazonaws.com/apps/dashboard-templates.js"
}];

dashboard.config = {
	ecl: []
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

	this._templateToECL(deferreds[0].resolve);
};

/**
 * TODO: What is this used for?
 */
dashboard.methods.declareInitialConfig = function() {
	return {
	};
};

/**
 * Convert our template into ECL.
 */
dashboard.methods._templateToECL = function(callback) {
	var self = this;

	Echo.Polyfills.ECL.getTemplate("/gallery/dashboard", function(ecl) {
		self.config.set("ecl", ecl);
		callback.call(self);
    });
};

Echo.Control.create(dashboard);

})(Echo.jQuery);
