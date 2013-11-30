(function(jQuery) {

var $ = jQuery;

if (Echo.Control.isDefined("Echo.Apps.MediaGallery.Dashboard")) return;

var dashboard = Echo.Control.manifest("Echo.Apps.MediaGallery.Dashboard");

dashboard.inherits = Echo.Utils.getComponent("Echo.AppServer.Dashboards.AppSettings");

dashboard.dependencies = [{
	"url": "{config:cdnBaseURL.apps.appserver}/controls/configurator.js",
	"control": "Echo.AppServer.Controls.Configurator"
}, {
	"url": "{config:cdnBaseURL.apps.dataserver}/full.pack.js",
	"control": "Echo.DataServer.Controls.Pack"
}, {
	"url": "//echocsthost.s3.amazonaws.com/apps/gallery/app/data-source.js",
	"control": "Echo.Apps.MediaGallery.InstanceDataSource"
}, {
	"url": "//echocsthost.s3.amazonaws.com/polyfills/ecl.js"
},
//{
//	"url": "//code.angularjs.org/1.2.3/angular.min.js"
//},
{
	"url": "//echocsthost.s3.amazonaws.com/apps/dashboard-templates.js"
}];

dashboard.labels = {
	"failedToFetchToken": "Failed to fetch customer dataserver token: {reason}",
	"dataserverSubscriptionNotFound": "DataServer product subscription not found.",
	"failedToFetchDomains": "Failed to fetch customer domains: {reason}"
};

// TODO: Discuss refactoring
dashboard.config = {
	"appkeys": [],
	"janrainapps": []
};

// We will fill this in with an Angular-compatible template
dashboard.config.ecl = [];

dashboard.init = function() {
	var self = this, parent = $.proxy(this.parent, this);

	var deferreds = [$.Deferred(), $.Deferred(), $.Deferred()];
	$.when.apply($, deferreds).done(function() {
		var ecl = self._prepareECL(self.config.get("ecl"));
		self.config.set("ecl", ecl);
		parent();
	});

	this._fetchCustomerDomains(deferreds[0].resolve);
	this._fetchDataServerToken(deferreds[1].resolve);
	this._templateToECL(deferreds[2].resolve);
};

dashboard.methods.declareInitialConfig = function() {
	var appkeys = this.config.get("appkeys");
	var janrainapps = this.config.get("janrainapps");
	return {
		"targetURL": this._assembleTargetURL(),
		"appkey": appkeys.length ? appkeys[0].key : undefined,
		"auth": {
			"janrainApp": janrainapps.length ? janrainapps[0].name : undefined
		}
	}
};

dashboard.methods._prepareECL = function(items) {
	var self = this;

	var instructions = {
		"targetURL": function(item) {
			item.config = $.extend({
				"instanceName": self.config.get("instance.name"),
				"domains": self.config.get("domains"),
				"apiToken": self.config.get("dataserverToken"),
				"valueHandler": function() {
					return self._assembleTargetURL();
				}
			}, item.config);
			return item;
		},
		"appkey": function(item) {
			item.config.options = $.map(self.config.get("appkeys"), function(appkey) {
				return {
					"title": appkey.key,
					"value": appkey.key
				};
			});
			return item;
		},
		"auth.janrainApp": function(item) {
			item.config.options = $.map(self.config.get("janrainapps"), function(app) {
				return {
					"title": app.name,
					"value": app.name
				};
			});
			return item;
		}
	};
	return (function traverse(items, path) {
		return $.map(items, function(item) {
			var _path = path ? path + "." + item.name : item.name;
			if (item.type === "object" && item.items) {
				item.items = traverse(item.items, _path);
			} else if (instructions[_path]) {
				item = instructions[_path](item);
			}
			return item;
		});
	})(items, "");
};

dashboard.methods._templateToECL = function(callback) {
	var self = this;

	console.log("Loading template...");
	Echo.Polyfills.ECL.getTemplate("/gallery/app/dashboard", function(ecl) {
		self.config.set("ecl", ecl);
		console.log(ecl);
		callback.call(self);
    });
};

// TODO F:1629 get rid of this function when we have the ability to recieve
// this parameters through config
dashboard.methods._fetchCustomerDomains = function(callback) {
	var self = this;

	Echo.AppServer.API.request({
		"endpoint": "customer/{id}/domains",
		"id": this.data.customer.id,
		"onData": function(response) {
			self.config.set("domains", response);
			callback.call(self);
		},
		"onError": function(response) {
			self._displayError(self.labels.get("failedToFetchDomains", {"reason": response.data.msg}));
		}
	}).send();
};

// TODO F:1629 get rid of this function when we have the ability to recieve this parameter
// through config
dashboard.methods._fetchDataServerToken = function(callback) {
	var self = this;

	Echo.AppServer.API.request({
		"endpoint": "customer/{id}/subscriptions",
		"id": this.data.customer.id,
		"onData": function(response) {
			var token = Echo.Utils.foldl("", response, function(subscription, acc) {
				return subscription.product.name === "dataserver"
					? subscription.extra.token
					: acc;
			});
			if (token) {
				self.config.set("dataserverToken", token);
				callback.call(self);
			} else {
				self._displayError(
					self.labels.get("failedToFetchToken", {
						"reason": self.labels.get("dataserverSubscriptionNotFound")
					})
				);
			}
		},
		"onError": function(response) {
			self._displayError(self.labels.get("failedToFetchToken", {"reason": response.data.msg}));
		}
	}).send();
};

dashboard.methods._displayError = function(message) {
	this.showMessage({
		"type": "error",
		"message": message,
		"target": this.config.get("target")
	});
	this.ready();
};

dashboard.methods._assembleTargetURL = function() {
	var re =  new RegExp("\/" + this.config.get("instance.name") + "$");
	var targetURL = this.config.get("instance.config.targetURL");

	if (!targetURL || !targetURL.match(re)) {
		targetURL =  "http://" + this.config.get("domains")[0] + "/social-source-input/" + this.config.get("instance.name");
	}

	return targetURL;
};

Echo.Control.create(dashboard);

})(Echo.jQuery);
