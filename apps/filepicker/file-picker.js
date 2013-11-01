(function(jQuery) {
"use strict";

var $ = jQuery;

/**
 * @class filePicker
 * This plugin MUST be loaded after the file-attachment plugin.
 */

var plugin = Echo.Plugin.manifest("FilePicker", "Echo.StreamServer.Controls.Submit");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.config = {
    "apikey": "AVxxvNJUtRQOjN6ugyWavz"
};

plugin.dependencies = [{
    "loaded": function() { return false; },
    "url": "//api.filepicker.io/v1/filepicker.js"
}];

plugin.labels = {
};

plugin.init = function() {
	var self = this, submit = this.component;
 };

plugin.events = {
    "Echo.StreamServer.Controls.Submit.onRender": function(topic, args) {
    	var self = this, submit = this.component;

        var attach = submit.view.get("plugin-FileAttachment-attachURL");
        var field = submit.view.get('plugin-FileAttachment-field');

        if (!attach) {
            !!console && !!console.log && console.log("FilePicker requires the FileAttachment plugin.");
            return;
        }

        attach.after('<a href="#" class="file-picker">Select</a>');
        field.on('click', '.file-picker', function() {
            filepicker.pick({
                multiple: false,
                mimetypes: ['image/*'],
                container: 'modal',
                services:['COMPUTER', 'DROPBOX', 'FACEBOOK', 'FLICKR', 'INSTAGRAM'],
                openTo: 'COMPUTER',
            //    store_options: {location: 'S3', path: 'hdgameday', access: 'public'}
            },
            function(InkBlob) {
                console.log(InkBlob);
                console.log(field);

                var url = InkBlob.url;
                $(field).find('.echo-streamserver-controls-submit-plugin-FileAttachment-attachURL').val(url).trigger('blur');
            },
            function(FPError){
                console.log(FPError);
            });
            /*filepicker.pickAndStore({
                multiple: false,
                mimetypes: ['image/*'],
                container: 'modal',
                services:['COMPUTER', 'DROPBOX', 'FACEBOOK', 'FLICKR', 'INSTAGRAM'],
                openTo: 'COMPUTER',
                store_options: {location: 'S3', path: 'hdgameday', access: 'public'}
            },
            function(InkBlob) {
                console.log(InkBlob);
                console.log(field);

                var url = InkBlob.url;
                $(field).find('.echo-streamserver-controls-submit-plugin-FileAttachment-attachURL').val(url).trigger('blur');
            },
            function(FPError){
                console.log(FPError);
            });*/
        });

        window.filepicker && window.filepicker.setKey(this.config.get("apikey"));
    }
}

plugin.renderers.attachURL = function(element) {
	var self = this;

    console.log(self);
    this.parentRenderer("attachURL", arguments);
    console.log(self);

    return element;
//	return element.on("blur focus keyup keypress", handler);
};

plugin.css =
    '{plugin:class} .file-picker { display: inline-block; width: 30px; height: 30px; overflow: hidden; text-indent: -999px; zoom: 1; margin: 0 3px; background-image: url(http://echosandbox.com/filepicker/upload.png); } ' +
    '{plugin:class} .echo-streamserver-controls-submit-plugin-FileAttachment-field label { display: none; } ' +
    '{plugin:class} .echo-streamserver-controls-submit-plugin-FileAttachment-field input { display: none; }';


Echo.Plugin.create(plugin);

})(Echo.jQuery);
