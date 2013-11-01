(function(jQuery) {
"use strict";

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Submit.Plugins.FileAttachment
 * Adds a file-attachment URL text field to a submit form.
 */

var plugin = Echo.Plugin.manifest("FileAttachment", "Echo.StreamServer.Controls.Submit");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.config = {
    /**
     * @cfg {Boolean} mandatory
     * Set to true if the field is required.
     */
    "mandatory": false,

    /**
     * @cfg {String} location
     * Set to "before" or "after", to set where the attachment field is placed.
     */
    "location": "after"
};

plugin.labels = {
    /**
     * @echo_label
     * Label for the file-attachment URL field.
     */
    "fieldLabel": "Attachment URL: ",
};

plugin.init = function() {
	var self = this, submit = this.component;

	// Add our field to the template.
    var location = this.config.get("location") == "after" ? "insertAfter" : "insertBefore";
	this.extendTemplate(location, "body", plugin.templates.main);

	// If the field is mandatory, check that it is set.
	submit.addPostValidator(function() {
        var valid = true;

        if (self.get("previewURL", "") === "") {
            valid = false;
        } else if (self.config.get("mandatory")) {
            var element = self.view.get("attachURL");
            valid = !submit.highlightMandatory(element);
        }

        return valid;
	}, "low");
};

plugin.events = {
    // Add the field to the submission data block
	"Echo.StreamServer.Controls.Submit.onPostInit": function(topic, args) {
		var self = this, submit = this.component;

        var object = args.postData.content[0].object;

        object.content = Echo.Utils.objectToJSON({
            "content": object.content,
            "attachURL": self.view.get("attachURL").val(),
			"media": self.get("mediaContent", ""),
			"previewURL": self.get("previewURL", "")
		});
	},
};

/**
 * @echo_template
 */
plugin.templates.main =
	'<div class="{plugin.class:container}">' +
        '<div class="{plugin.class:previewThumb}"></div>' +
        '<div class="{plugin.class:field}">' +
            '<label>{plugin.label:fieldLabel}</label>' +
            '<input type="text" class="{plugin.class:attachURL}" />' +
        '</div>' +
    '</div>';

/**
 * @echo_renderer
 */
plugin.renderers.attachURL = function(element) {
	var self = this;
    var preview = this.view.get('previewThumb');

    // Did the user upload a valid file?
	element.blur(function() {
		var link = $.trim(element.val());
		if (!link) {
			preview.empty();
			return;
		}

		// Avoid resolving the same link twice in a row due to repeated events
		if (self.get("lastProcessedLink") === link) return;
		self.set("lastProcessedLink", link);
		self.set("link", link);

        // Visual indicators...
		element.parent().removeClass(self.component.cssPrefix + "mandatory");
		preview.show().html('<span>' + self.labels.get("loading") + '</span>');

        // Set a loading... status on the preview box


        // TODO: Don't hard-code this.
        // TODO: Move to Echo.Utils?
        // TODO: Should Echo have an internal proxy for this?
        // TODO: Should this use the Echo Request API?
        // TODO: Prevent submitting before this callback completes
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

					var mediaContent = '<img src="' + response.url + '" />';
					self.set("mediaContent", encodeURIComponent(mediaContent));

					preview.append(mediaContent);
					break;

				default:
					preview.append('<span class="echo-streamserver-controls-submit-plugin-FileAttachment-noMediaFound">' + self.labels.get('noMediaFound') + '</span>');
			}
		}, "jsonp");
	});

	return element;
};

plugin.css =
    '.{plugin.class:container} { height: 75px; margin: 10px 0; }' +
    '.{plugin.class:previewThumb} { width: 75px; height: 75px; background-image: url(http://echosandbox.com/filepicker/no-photo.png); margin: 0 10px 0 0; }' +
    '.{plugin.class} label { font-family: sans-serif; margin: 4px 0; }' +
    '.{plugin.class:previewThumb}, .{plugin.class:field} { float: left; }' +
    '.{plugin.class:attachURL} { width: 300px; }' +
    '.{class:message-loading} { background-image: url({config:cdnBaseURL.sdk-assets}/images/loading.gif); }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
