/**
 * FilePicker widget for the Dashboard. Note that this is hard-coded to CST's
 * S3 and FilePicker.io accounts.
 */

(function(jQuery) {
"use strict";

var $ = jQuery;

if (Echo.AppServer.App.isDefined("Echo.Apps.AppServer.Controls.Configurator.Items.FilePicker")) return;

var filepickercontrol = Echo.AppServer.App.manifest("Echo.AppServer.Controls.Configurator.Items.FilePicker");

filepickercontrol.inherits = Echo.Utils.getComponent("Echo.AppServer.Controls.Configurator.Item");

filepickercontrol.config = {
	"defaultTitle": ""
};

filepickercontrol.dependencies = [{ url: '//api.filepicker.io/v1/filepicker.js' }];

filepickercontrol.init = function() {
	// TODO: SURELY there is a better way to get this...?
	var self = this,
	    customerId = Echo.AppServer.User.data.customer.id,     // 312
		customerName = Echo.AppServer.User.data.customer.name, // echo-apps-chad
		apiBaseURL = this.config.get('apiBaseURL', 'http://api.appserver.aboutecho.com');

    // TODO: Could not figure out a better way to do this
    if (!window.filePickerInitialized) {
        window.filePickerInitialized = true;
        filepicker.setKey('AVxxvNJUtRQOjN6ugyWavz');
    }

	this.parent();
}

filepickercontrol.templates.main =
	'<div class="{inherited.class:container} {class:container} clearfix">' +
		'<div class="{inherited.class:subcontainer} {class:subcontainer} clearfix">' +
			'<div class="{inherited.class:titleContainer} {class:titleContainer}">' +
				'<div class="{inherited.class:titleSubcontainer} {class:titleSubcontainer}">' +
					'<span class="{inherited.class:title} {class:title}">' +
						'<span class="{inherited.class:titleText} {class:titleText}">{config:title}</span>' +
						'<span class="{inherited.class:additionalInfo} {class:additionalInfo}">{config:info}</span>' +
					'</span>' +
					'<div class="{inherited.class:toolbar} {class:toolbar}">' +
						'<div class="echo-clickable {inherited.class:icon} {class:icon} {inherited.class:help} {class:help} pull-left">' +
							'<i class="icon-question-sign"></i>' +
						'</div>' +
					'</div>' +
				'</div>' +
			'</div>' +
			'<div class="{inherited.class:valueContainer} {class:valueContainer} clearfix">' +
				'<div class="{inherited.class:value} {class:value} btn-group">' +
                    '<div class="{class:preview}"><img src="//echocsthost.s3.amazonaws.com/plugins/blank.gif" class="{class:previewImage}"/></div>' +
				'</div>' +
			'</div>' +
			'<div class="{inherited.class:error} {class:error} clearfix"></div>' +
		'</div>' +
	'</div>';

filepickercontrol.renderers.preview = function(element) {
	var self = this;

	return element;
};

filepickercontrol.renderers.previewImage = function(element) {
	var self = this,
        value = self.get('data.value');

    if (value != '') {
        element.attr('src', value);
    }

    element.click(function(e) {
        filepicker.pickAndStore({
            multiple: false,
            maxFiles: 1,
            folders: false,
            extensions: ['.png', '.jpg', '.jpeg', '.gif'],
            maxSize: 50*1024*1024
        }, {
            location: 'S3',
            path: 'dashboard/',
            access: 'public'
        }, function(InkBlobs) {
            $.map(InkBlobs, function(blob) {
                var s3Url = '//' + blob.container + '.s3.amazonaws.com/' + blob.key;

                var prevValue = element.attr('src');
                element.attr('src', s3Url);

                // TODO: Why do other components both self.set and self.changed?
                self.set('data.value', s3Url);
                if (prevValue !== s3Url) {
                    self.changed(s3Url, prevValue);
                }
            });
        }, function(FPError) {
            console.log('Error', FPError);
        });
    });

	return element;
};

filepickercontrol.methods.value = function() {
	return this.get("data.value");
};

filepickercontrol.css =
	'.{class:previewImage} { background: #666; }' +
	'.{class:previewImage} { width: 64px; height: 64px; }' +

	'.{class:titleContainer} { padding-top: 2px; display: inline-block; }' +
	'.{class:container} .{class:valueSubcontainer} { max-width: 100%; }' +
	'.{class:container} .{class:valueContainer} .{class:value} { display: block; }' +
	'.{class:value} button.btn { width: auto; max-width: 100%; display: block; white-space: nowrap; }' +
	'.{class:icon} { opacity: 0.8; height: 18px; width: 16px; margin-top: -1px; padding-left: 3px; } ' +
	'.{class:help} { height: 23px; width: 16px; }' +
	'.{class:container} .{class:menu} a.{class:option} { cursor: pointer; font: 12px Arial; font-weight: bold; color: #787878; text-decoration: none; line-height: 15px; }' +
	'.{class:container} .{class:dropdown}.btn { text-align: left; padding: 0; }' +
	'.{class:container} .{class:dropdown} span.{class:selected} { min-height: 20px; min-width: 50px; display: block; margin-left: 6px; margin-right: 18px; overflow: hidden; text-overflow: ellipsis; }' +
	'.{class:container} .{class:dropdown} span.caret { margin-top: 8px; margin-right: 6px; }';

Echo.AppServer.App.create(filepickercontrol);

})(Echo.jQuery);
