/**
 * filePickerReference App
 *
 * Questions:
 * Most appropriate method for a page to use Echo's jQuery?
 *
 * Loading jQuery plugins from Echo plugins if the window jQuery is different.
 *
 * Getting a reference to the app from a component to share config params like
 * stream URLs.
 *
 * Getting a reference to plugin X from plugin Y for plugins that enhance
 * others.
 *
 * ActivityStream content_type - setting from submission. (Support JSON?)
 *
 * JSON encoding/decoding plugin.
 */

(function(jQuery) {
"use strict";

var $ = jQuery;

var filePickerReference = Echo.App.manifest("Echo.Apps.filePickerReference");

if (Echo.App.isDefined("filePickerReference")) return;

filePickerReference.dependencies = [
    {"loaded": function() {
        return Echo.Control.isDefined("Echo.StreamServer.Controls.Submit") &&
            Echo.Control.isDefined("Echo.StreamServer.Controls.Stream");
    }, "url": "{config:cdnBaseURL.sdk}/streamserver.pack.js" }
];

filePickerReference.templates.main =
	'<div class="{class:container}">' +
		'<div class="{class:submit}"></div>' +
		'<div class="{class:entries}"></div>' +
	'</div>';

filePickerReference.renderers.submit = function(element) {
    this.initComponent({
        "id": "Submit",
        "component": "Echo.StreamServer.Controls.Submit",
        "config": {
            "target": element,
            "plugins": [{
				"name": "FileAttachment",
				"url": "http://echosandbox.com/filepicker/file-attachment.js"
			}, {
				"name": "FilePicker",
				"url": "http://echosandbox.com/filepicker/file-picker.js"
			}, {
                "name": "FormAuth",
                "identityManager": "{config:identityManager}"
            }]
        }
    });

    return element;
}

filePickerReference.renderers.entries = function(element) {
    this.initComponent({
        "id": "Stream",
        "component": "Echo.StreamServer.Controls.Stream",
        "config": {
            "target": element,
			"item": { "reTag": false },
            "plugins": [{
				"name": "PhotoContent",
				"url": "http://echosandbox.com/filepicker/photo-content.js"
			}]
        }
    });
    return element;
};

filePickerReference.css =
	'.{class:container} { width: 980px; margin: 20px auto; }';

Echo.App.create(filePickerReference);

})(Echo.jQuery);
