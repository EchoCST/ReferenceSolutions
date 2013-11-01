(function(jQuery) {
"use strict";

var $ = jQuery;

var plugin = Echo.Plugin.manifest("PhotoSubmitForm", "Echo.StreamServer.Controls.Submit");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.config = {
	"descriptionLimit": 300,
	"photoMaxWidth": 210 // in px
};

plugin.labels = {
	"personalNameHint": "Name",
	"personalEmailHint": "Email",
	"businessNameHint": "Your Business Name",
	"photoURLHint": "Upload Your Photo to Twitter or Instagram, and Paste the URL Here",
	"descriptionHint": "Enter a Description of the Photo Here",
	"processingMedia": "Processing media link. Please wait...",
	"noMediaFound": "No media content was detected. The link will be displayed as is.",
	"notValidYoutubeURL": "Not a valid media link. Please enter a valid media URL.",
	"submitConfirmation": "Thanks, your entry has been submitted.",
	"counterText": "Description limit is {limit} characters, {typed} typed so far.",
	"loginMessage": "Please login to submit your entry",
	"termsAndConditions": "I have read and accept the <a href=\"javascript:void(0)\" class=\"rules\">Terms and Conditions</a>"
};

plugin.init = function() {
	var self = this, submit = this.component;

	// replace the whole template
	this.extendTemplate("replace", "container", plugin.templates.main);

	// validator to define non-empty values for the name and text values
	submit.addPostValidator(function() {
		self.component.view.get("name").val("-");
		self.component.view.get("text").val("-");
		return true;
	}, "high");

	// define validators for the newly added fields
	submit.addPostValidator(function() {
		var valid = true;
		$.each([/*"personalName", "personalEmail", "businessName",*/ "photoURL", "description"], function (i, field) {
			var element = self.view.get(field);
			if (field !== "photoURL") {
				valid = !submit.highlightMandatory(element);
			}
			return valid;
		});
		return valid;
	}, "low");
	submit.addPostValidator(function() {
		
		return submit.user.is("logged");
	});
};

plugin.events = {
	"Echo.StreamServer.Controls.Submit.onPostInit": function(topic, args) {
		var self = this, submit = this.component;
		var valueOf = function(name) {
			return self.view.get(name).val();
		};
		args.postData.content[0].object.content = Echo.Utils.objectToJSON({
			"user": submit.user.get("name"),
			"media": self.get("mediaContent", ""),
			"link": self.get("link", ""),
			"previewURL": self.get("previewURL", ""),
			"videoWidth": self.config.get("photoMaxWidth"),
			"previewWidth": self.get("previewWidth", ""),
			"description": valueOf("description")
		});
		this.view.get("confirmation").hide();
	},
	"Echo.StreamServer.Controls.Submit.onPostComplete": function(topic, args) {
		var self = this;
		// reset fields after successful submission...
		$.map(["photoURL", "description"], function(name) {
			self.view.render({"name": name});
		});
		this.set("mediaContent", "");
		this.view.get("videoPreview").hide();
		this.view.render({"name": "charsCounter"});
		this.view.get("confirmation").show();
	}
};

plugin.templates.main =
	'<div class="{class:container}">' +
		'<div class="alert alert-success {plugin.class:confirmation}">' +
			'{plugin.label:submitConfirmation}' +
		'</div>' +
		'<div class="alert alert-danger {plugin.class:loginMessage}">' +
			'{plugin.label:loginMessage}' +
		'</div>' +
		'<div class="{plugin.class:inputContainer}">' +
			'<input class="{plugin.class:photoURL} {plugin.class:input}" type="text">' +
		'</div>' +
		'<div class="{plugin.class:videoPreview}"></div>' +
		'<div class="{plugin.class:inputContainer} {plugin.class:descriptionContainer}">' +
			'<textarea class="{plugin.class:description} {plugin.class:input}"></textarea>' +
		'</div>' +

		// define the set of "hidden" fields to pass Submit validation
		'<input type="hidden" class="{class:text}">' +
		'<input type="hidden" class="{class:name}">' +
		'<input type="hidden" class="{class:tags}">' +
		'<input type="hidden" class="{class:markers}">' +

		'<div class="{class:controls}">' +
			'<div class="{plugin.class:footer}">' +
				'<div class="{plugin.class:charsCounter}"></div>' +
			'</div>' +
			'<div class="{class:postContainer}">' +
				'<div class="btn echo-primaryFont {class:postButton}"></div>' +
			'</div>' +
			'<div class="echo-clear"></div>' +
		'</div>' +
	'</div>';

plugin.renderers.photoURL = function(element) {
	var self = this;
	var preview = this.view.get("videoPreview");
	this._putHint(element, "photoURL");
	element.blur(function() {
		var value = element.val();
		var link = $.trim(value);
		if (!link) {
			preview.empty().hide();
			return;
		}
		// do not resolve the same link twice
		if (self.get("lastProcessedLink") === link) return;
		self.set("lastProcessedLink", link);
		element.parent().removeClass(self.component.cssPrefix + "mandatory");
		preview.show().html('<span>' + self.labels.get("processingMedia") + '</span>');
		self.set("link", link);
		$.get("http://api.embed.ly/1/oembed", {
			"key": "20f6f47f7e584690ac9c29524a43fa55",
			"url": link,
			"format": "json"
		}, function(response) {
			preview.empty();
			response = response || {};
			switch (response.type) {
				case "photo":
					self.set("previewURL", response.url);
					self.set("previewWidth", self.config.get("photoMaxWidth"));
					var mediaContent = '<img src="' + response.url + '" width="' + self.get("previewWidth") + '">';
					self.set("mediaContent", encodeURIComponent(mediaContent));
					preview.append(mediaContent);
					break;
				default:
					preview.append('<span class="echo-streamserver-controls-submit-plugin-PhotoSubmitForm-noMediaFound">' + self.labels.get('noMediaFound') + '</span>');
			}
		}, "jsonp");
	});
	return element;
};

plugin.renderers.description = function(element) {
	var self = this, limit = this.config.get("descriptionLimit", 0);
	element.css({"height": "55px"}).autosize({"append": "\n"});
	this._putHint(element, "description");
	var handler = function() {
		if (limit) {
			var text = element.val();
			if (text.length <= limit) {
				self.set("text", text);
			} else if (text.length > limit) {
				element.val(self.get("text"));
				return;
			}
		}
		self.view.render({"name": "charsCounter"});
	};
	return element.on("blur focus keyup keypress", handler);
};

plugin.renderers.loginMessage = function(element) {
	return element[this.component.user.is("logged") ? "hide" : "show"]();
};

$.map(["photoURL", "description", "postButton"], function(name) {
	var object = name in plugin.renderers
		? plugin.renderers
		: plugin.component.renderers;
	var renderer = object[name] || function() {
		return this.parentRenderer(name, arguments);
	};
	object[name] = function(element) {
		if (!this.component.user.is("logged")) {
			element.attr("disabled", true);
			element.addClass("disabled");
			element.parent().addClass(this.cssPrefix + "disabled");
		}
		return renderer.apply(this, arguments);
	};
});

plugin.methods._putHint = function(element, label) {
	return element.val("").blur().iHint({
		"text": this.labels.get(label + "Hint"),
		"className": "echo-secondaryColor"
	});
};

plugin.css =
	'.echo-sdk-ui .echo-streamserver-controls-submit-mandatory { border: 1px solid red; }' +
	'.echo-sdk-ui input[type="text"].{plugin.class:input}, .echo-sdk-ui textarea.{plugin.class:input} { outline: 0 !important; box-shadow: none !important; padding: 0px; margin: 0px; border: 0px; width: 100%; }' +
	'.echo-sdk-ui .echo-streamserver-controls-submit-plugin-PhotoSubmitForm-input.echo-secondaryColor { color: #bbb; }' +
	'.echo-sdk-ui .{plugin.class:confirmation}.alert { font-weight: bold; margin: 10px 0px; }' +
	'.echo-sdk-ui .{class:postButton}.btn { letter-spacing: normal; margin-top: 15px; text-shadow: none; }' +
	'.echo-sdk-ui .{plugin.class:confirmation} { display: none; }' +
	'.echo-streamserver-controls-submit-plugin-PhotoSubmitForm-noMediaFound { color: red; }' +
	'.{plugin.class:footer} { float: left; margin: 0px 0px 0px 2px; }' +
	'.{plugin.class:charsCounter} { font-size: 12px; color: #555555; }' +
	'.{plugin.class:loginMessage} { display: none; }' +
	'.echo-sdk-ui textarea.{plugin.class:description} { resize: none; }' +
	'.{plugin.class:inputContainer} { margin: 5px 0px; padding: 3px 5px; border: 1px solid #bbb; }' +
	'.{plugin.class:termsAndConditionsContainer} { margin-top: 5px; }' +
	'.{plugin.class:termsAndConditionsContainer} span { font-size: 12px; }' +
	'.echo-sdk-ui input[type="checkbox"].{plugin.class:termsAndConditions} { margin: -2px 3px 0px 0px; }' +
	'.{plugin.class:mandatory} { color: red; }' +
	'.echo-sdk-ui .echo-apps-crowdrules-container .{plugin.class:mandatory} a { color: red; }' +
	'.{plugin.class:disabled} { padding: 0; }' +
	'.{plugin.class:disabled} input[type="text"].{plugin.class:input}, .{plugin.class:disabled} textarea.{plugin.class:input} { border-radius: 0; }' +
	'.{plugin.class:disabled} input[type="text"].{plugin.class:input} { height: 26px; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
