(function(jQuery) {
"use strict";

var $ = jQuery;

if (Echo.AppServer.App.isDefined("Echo.AppServer.Controls.Configurator.Items.PollEditor")) return;

var polleditor = Echo.AppServer.App.manifest("Echo.AppServer.Controls.Configurator.Items.PollEditor");

polleditor.inherits = Echo.Utils.getComponent("Echo.AppServer.Controls.Configurator.Item");

polleditor.config = {
	"titlePosition": "right" // "left" or "right"
};

polleditor.init = function() {
  console.log(this, this.component, this.configurator);
  this.parent();
};

polleditor.templates.main =
	'<div class="{inherited.class:container} {class:container}">' +
		'<div class="subcontainer clearfix">' +
			'<div class="{inherited.class:titleContainer} {class:titleContainer} pull-left">' +
				'<div class="{inherited.class:titleSubcontainer} {class:titleSubcontainer}">' +
          '<a href="#" class="{class:link} btn">Edit Poll</a>' +
				'</div>' +
			'</div>' +
		'</div>' +
		'<div class="{inherited.class:error} {class:error} clearfix"></div>' +
	'</div>';

polleditor.renderers.link = function(element) {
	var self = this;

  return element.click(function(e) {
    e.preventDefault();


    console.log(self);
	});
};

polleditor.events = {
	"Echo.AppServer.Controls.Configurator.onItemChange": function(topic, args) {
    if (args.name == "datasource.specifiedURL") {
      console.log(args.values.current);
    }
	}
};

// TODO: Do we need this?
polleditor.methods.value = function() {
	return '';
};

// TODO: Not sure we actually need CSS
polleditor.css = '';

Echo.AppServer.App.create(polleditor);

})(Echo.jQuery);
