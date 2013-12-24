(function(jQuery) {

var $ = jQuery;

if (Echo.Control.isDefined("Echo.Apps.StreamPlus.Dashboard")) return;

var dashboard = Echo.Control.manifest("Echo.Apps.StreamPlus.Dashboard");

dashboard.inherits = Echo.Utils.getComponent("Echo.AppServer.Dashboards.AppSettings");

dashboard.mappings = {
	"dependencies.appkey": {
		"key": "dependencies.StreamServer.appkey"
	},
	"dependencies.janrainapp": {
		"key": "dependencies.Janrain.appId"
	}
};

dashboard.labels = {
	"failedToFetchToken": "Failed to fetch customer dataserver token: {reason}"
};

dashboard.dependencies = [{
	"url": "{config:cdnBaseURL.apps.appserver}/controls/configurator.js",
	"control": "Echo.AppServer.Controls.Configurator"
}, {
	"url": "{config:cdnBaseURL.apps.dataserver}/full.pack.js",
	"control": "Echo.DataServer.Controls.Pack"
}, {
	"url": "http://cdn.echoenabled.com/apps/echo/media-gallery/dashboard/data-source.js",
	"control": "Echo.Apps.StreamPlus.InstanceDataSource"
}];

dashboard.config = {
	"appkeys": [],
	"janrainapps": []
};

dashboard.config.ecl = [
/*
{
	"name": "replies",
	"component": "Checkbox",
	"type": "boolean",
	"default": true,
	"config": {
		"title": "Allow users to post replies",
		"desc": "Check to display replies for each item and provide an ability for the users to post their replies"
	}
}, {
	"name": "likes",
	"component": "Checkbox",
	"type": "boolean",
	"default": true,
	"config": {
		"title": "Allow users to Like items",
		"desc": "Check to enable Likes for the items"
	}
}, {
	"name": "sharing",
	"component": "Checkbox",
	"type": "boolean",
	"default": false,
	"config": {
		"title": "Allow users to share items",
		"desc": "Check to provide an ability for the users to share the items with their friends via social networks"
	}
}, {
	"name": "flags",
	"component": "Checkbox",
	"type": "boolean",
	"default": true,
	"config": {
		"title": "Allow community flagging",
		"desc": "Check to add a button for the users to mark inappropriate content"
	}
}, {
	"name": "itemsPerPage",
	"component": "Input",
	"type": "number",
	"default": 15,
	"config": {
		"title": "Items per page",
		"desc": "Defines the amount of root items per page"
	}
}, */
{
	"name": "targetURL",
	"component": "Echo.Apps.MediaGallery.DataSourceGroup",
	"type": "string",
	"required": true,
	"config": {
		"title": "",
		"labels": {
			"dataserverBundleName": "Echo Stream+ Auto-Generated Bundle for {instanceName}"
		},
		"apiBaseURLs": {
			"DataServer": "http://nds.echoenabled.com/api/"
		}
	}
}, {
	"component": "Group",
	"name": "dependencies",
	"type": "object",
	"config": {
		"title": "Dependencies"
	},
	"items": [{
		"component": "Select",
		"name": "appkey",
		"type": "string",
		"config": {
			"title": "StreamServer application key",
			"desc": "Specifies the application key for this instance",
			"options": []
		}
	}, {
		"component": "Select",
		"name": "janrainapp",
		"type": "string",
		"config": {
			"title": "Janrain application ID",
			"validators": ["required"],
			"options": []
		}
	}]
}];

dashboard.init = function() {
	var self = this, parent = $.proxy(this.parent, this);
	this._fetchDataServerToken(function() {
		self.config.set("ecl", self._prepareECL(self.config.get("ecl")));
		parent();
	});
};

dashboard.methods.declareInitialConfig = function() {
	var keys = this.config.get("appkeys", []);
	var apps = this.config.get("janrainapps", []);
	return {
		"targetURL": this._assembleTargetURL(),
		"dependencies": {
			"Janrain": {
				"appId": apps.length ? apps[0].name : undefined
			},
			"StreamServer": {
				"appkey": keys.length ? keys[0].key : undefined
			}
		}
	};
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
		"dependencies.appkey": function(item) {
			item.config.options = $.map(self.config.get("appkeys"), function(appkey) {
				return {
					"title": appkey.key,
					"value": appkey.key
				};
			});
			return item;
		},
		"dependencies.janrainapp": function(item) {
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

dashboard.methods._fetchDataServerToken = function(callback) {
	var self = this;
	Echo.AppServer.API.request({
		"endpoint": "customer/{id}/subscriptions",
		"id": this.config.get("customer").id,
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
