/*
 *        $('.inset .preview').click(function(e) {
            var $inset = $(this).closest('.inset');

            filepickercontrol.pickAndStore({
                multiple: false,
                maxFiles: 1,
                folders: false,
                extensions: ['.png', '.jpg', '.jpeg', '.gif'],
                maxSize: 50*1024*1024
            }, {
                location: 'S3',
                path: 'polls',
                access: 'public'
            }, function(InkBlobs) {
                console.log('Success', InkBlobs);
                $.map(InkBlobs, function(blob) {
                    //blob.url = 'https://pbs.twimg.com/media/BYvzKb3CQAAlUCi.jpg:large';
                    $inset.find('img').attr('src', blob.url);
                });
            }, function(FPError) {
                console.log('Error', FPError);
            });
        });
 */
/**
 * Adds an app-key select list control. This is a near 1:1 clone of .Select just
 * modified to obtain its values from an API call.
 *
 * I did it this way instead of trying to inherit from .Select because I
 * couldn't figure out how the inheritance was supposed to work...
 *
 * It's probably pretty ugly...
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
        console.log('Initializing filePicker');
        filepicker.setKey('AVxxvNJUtRQOjN6ugyWavz');
    }

    console.log('FilePicker', self);
/*
	// TODO: The SDK is not yet Open Source and there are no docs. I found
	// Echo.AppServer.API.request but couldn't quite get it to work right, so I
	// just used this.
	$.ajax({
		url: apiBaseURL + '/customer/' + customerId + '/appkeys',
		timeout: 5000,
		dataType: 'jsonp',
		success: function(data) {
			var options = [];
			$.each(data, function(i, entry) {
				options.push({
					title: entry.key,
					value: entry.key
				});
			});

			self.config.set('options', options);
			self.fillMenuItems(self.view.get('menu'));
		},
		error: function() {
			// TODO: What is an appropriate error mechanism for a control that
			// has no acceptable behavior if it cannot populate itself? Can we
			// terminate or reload the entire app?
			alert('Error loading appkey list');
		}
	});
*/
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
        value = self.get('data.value'),
        $el = $(element);

    console.log(self);
    if (value != '') {
        console.log('setting', value);
        $el.attr('src', value);
    }

    $el.click(function(e) {
        filepicker.pickAndStore({
            multiple: false,
            maxFiles: 1,
            folders: false,
            extensions: ['.png', '.jpg', '.jpeg', '.gif'],
            maxSize: 50*1024*1024
        }, {
            location: 'S3',
            path: 'dashboard',
            access: 'public'
        }, function(InkBlobs) {
            console.log('Successful Upload', InkBlobs);
            $.map(InkBlobs, function(blob) {
                //blob.url = 'https://pbs.twimg.com/media/BYvzKb3CQAAlUCi.jpg:large';
                var prevValue = $el.attr('src');
                $el.attr('src', blob.url);

                // TODO: Why do other components both self.set and self.changed?
                self.set('data.value', blob.url);
                if (prevValue !== blob.url) {
                    self.changed(blob.url, prevValue);
                }
            });
        }, function(FPError) {
            console.log('Error', FPError);
        });
    });

	return element;
};

filepickercontrol.methods.value = function() {
    console.log('Value called', this);
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
