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
                    '<a href="http://echocsthost.s3.amazonaws.com/apps/poll/editor.html?appKey=echo.echo.streamserver.echo-cst-dev.prod&busName=echo-cst-dev&pollURL=http://cst-dev.echoplatform.com/sample-data/polls/poll1#" class="{class:link} btn" target="_blank">Poll Editor</a>' +
				'</div>' +
			'</div>' +
		'</div>' +
		'<div class="{inherited.class:error} {class:error} clearfix"></div>' +
	'</div>';

polleditor.renderers.link = function(element) {
	var self = this;

  return element.click(function(e) {
    e.preventDefault();

      var myModal = new Echo.GUI.Modal({
    "show": true,
    "backdrop": true,
    "keyboard": true,
    "closeButton": false,
    "remote": false,
    "extraClass": "",
    href: 'http://echocsthost.s3.amazonaws.com/apps/poll/editor.html?appKey=echo.echo.streamserver.echo-cst-dev.prod&busName=echo-cst-dev&pollURL=http://cst-dev.echoplatform.com/sample-data/polls/poll1',
    "width": "1000",
    "height": "700",
    "padding": "0",
    "footer": false,
    "header": false,
    "fade": true,
    "onShow": function() {
        return;
    },
    "onHide": function() {
        return;
    },
  });


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
