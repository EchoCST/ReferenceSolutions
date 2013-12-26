/**
 * ColorPicker widget for the Dashboard. Uses the JSColor plugin, since this is
 * a super lightweight control and we didn't want anything complicated.
 */

(function(jQuery) {
"use strict";

var $ = jQuery;

if (Echo.AppServer.App.isDefined("Echo.Apps.AppServer.Controls.Configurator.Items.ColorPicker")) return;

var colorpicker = Echo.AppServer.App.manifest("Echo.AppServer.Controls.Configurator.Items.ColorPicker");

colorpicker.inherits = Echo.Utils.getComponent("Echo.AppServer.Controls.Configurator.Item");

colorpicker.dependencies = [{ url: '//echocsthost.s3.amazonaws.com/plugins/jscolor/jscolor.js' }];

/**
 * Set up the color picker.
 */
colorpicker.init = function() {
	this.parent();
}

// TODO: We've been copying/pasting this from other dashboard controls. There is
// a LOT of HTML here, and most of it seems to be boilerplate. Can't this be
// refactored into separate templates so value-oriented controls can just
// extendTemplate that one thing?
colorpicker.templates.main =
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
                    // This is the only part we really care about...
                    '<input class="{class:colorField}" />' +
				'</div>' +
			'</div>' +
			'<div class="{inherited.class:error} {class:error} clearfix"></div>' +
		'</div>' +
	'</div>';

/**
 * The actual color field.
 *
 * @echo_renderer
 */
colorpicker.renderers.colorField = function(element) {
	var self = this;

    var picker = new jscolor.color(element.get(0), {
        hash: true,
        pickerClosable: true
    });
    picker.fromString(this.get('data.value'));
    self.set('picker', picker);

    element.change(function(e) {
        // TODO: Why do other components both self.set and self.changed?
        var prevValue = self.get('data.value'),
            newValue = e.target.value;

        self.set('data.value', newValue);

        if (prevValue !== newValue) {
            self.changed(newValue, prevValue);
        }
    });


	return element;
};

/**
 * TODO: Do we actually need/want this?
 */
colorpicker.methods.value = function() {
	return this.get("data.value");
};

// TODO: It seems like a lot of this is not necessary either, haven't had time
// to pick it ap0art.
colorpicker.css =
	'.{class:titleContainer} { padding-top: 2px; display: inline-block; }' +
	'.{class:container} .{class:valueSubcontainer} { max-width: 100%; }' +
	'.{class:container} .{class:valueContainer} .{class:value} { display: block; }' +
	'.{class:value} button.btn { width: auto; max-width: 100%; display: block; white-space: nowrap; }' +
	'.{class:icon} { opacity: 0.8; height: 18px; width: 16px; margin-top: -1px; padding-left: 3px; } ' +
	'.{class:help} { height: 23px; width: 16px; }';

Echo.AppServer.App.create(colorpicker);

})(Echo.jQuery);
