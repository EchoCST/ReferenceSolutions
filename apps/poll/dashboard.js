(function($) {

if (Echo.Control.isDefined("Echo.Apps.Poll.Dashboard")) return;

var dashboard = Echo.Control.manifest("Echo.Apps.Poll.Dashboard");

dashboard.inherits = Echo.Utils.getComponent("Echo.AppServer.Dashboards.AppSettings");
dashboard.config = { 'eclTemplate': '/poll/dashboard' };
dashboard.init = Echo.Polyfills.DashboardSupport.standardInit;

/**
 * Convert our template into ECL when we get loaded.
 */
dashboard.dependencies = [{
	"url": "{config:cdnBaseURL.apps.appserver}/controls/configurator.js",
	"control": "Echo.AppServer.Controls.Configurator"
}, {
	"url": "{config:cdnBaseURL.apps.dataserver}/full.pack.js",
	"control": "Echo.DataServer.Controls.Pack"
},
// TODO: Move these three into a minified build pack once they're stable.
{
	"url": "//echocsthost.s3.amazonaws.com/controls/app-key-list.js",
	"control": "Echo.AppServer.Controls.Configurator.Items.AppKeyList"
}, {
	"url": "//echocsthost.s3.amazonaws.com/polyfills/ecl.js"
}, {
	"url": "//echocsthost.s3.amazonaws.com/polyfills/dashboard-support.js"
}, {
	"url": "//echocsthost.s3.amazonaws.com/apps/dashboard-templates.js"
}
];

/**
 * Placeholder for future expansion.
 *
dashboard.methods.declareInitialConfig = function() {
	return {};
};

*/

Echo.Control.create(dashboard);

})(Echo.jQuery);
