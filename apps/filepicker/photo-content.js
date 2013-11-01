(function(jQuery) {
"use strict";

var plugin = Echo.Plugin.manifest("PhotoContent", "Echo.StreamServer.Controls.Stream");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {
	this.extendTemplate("insertBefore", "more", plugin.templates.cleaner);
};

plugin.dependencies = [
	{
		"loaded": function() {
			return !!window && !!window.jQuery && !!window.jQuery.fn.nested;
		},
		"url": "http://echosandbox.com/filepicker/jquery.nested.js"
	},
	{
		"loaded": function() {
			return !!window && !!window.jQuery && !!window.jQuery.fn.imagesLoaded;
		},
		"url": "http://echosandbox.com/filepicker/imagesloaded.pkgd.min.js"
	}
];

plugin.events = {
	"Echo.StreamServer.Controls.Stream.onDataReceive": function(topic, args) {
/*		imagesLoaded('#app', function() {
			console.log('loaded');
			$(".echo-streamserver-controls-stream-plugin-PhotoContent").nested({
				selector: '.echo-streamserver-controls-stream-item-plugin-PhotoContent',
				animate: true,
				minWidth: 300,
			});
		}); */
	}
};

plugin.templates.cleaner =
	'<div class="{plugin.class:cleaner}"></div>';

plugin.css =
	'.{plugin.class:cleaner} { clear:both; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function(jQuery) {
"use strict";

var $ = jQuery;

var plugin = Echo.Plugin.manifest("PhotoContent", "Echo.StreamServer.Controls.Stream.Item");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.config = {
	"previewMaxWidth": "210px"
};

plugin.component.renderers.text = function(element) {
	var data, el, self = this;
	var item = this.component;
	var text = item.get("data.object.content");
	var isAdmin = this.component.user.is("admin");
	// FIXME: remove try/catch before production init

//	try {
		data = $.parseJSON(text);
	/*	if (item.config.get("contentTransformations." + item.get("data.object.content_type"), {}).newlines) {
			data.description = data.description.replace(/\n\n+/g, "\n\n");
			data.description = data.description.replace(/\n/g, "&nbsp;<br>");
		}*/
		data.media = decodeURIComponent(data.media);
		data.user = data.personalName || data.user;
		data.email = isAdmin ? data.personalEmail : "";
		el = $(this.substitute({
			"template": plugin.templates.content("full", !!data.media),
			"data": data
		}));
//	} catch (ex) {
//		console.log(ex);
//	}
	return element.empty().append(data ? el : text);
};

plugin.component.renderers.date = function(element) {
	var item = this.component;
	return !item.user.is("admin") && item.isRoot()
		? element.hide()
		: this.parentRenderer("date", arguments);
};

plugin.component.renderers.buttons = function(element) {
	var item = this.component;
	element = this.parentRenderer("buttons", arguments);
	if (!item.user.is("admin") && item.isRoot()) {
		element.children(":first").hide();
	}
	return element;
};

plugin.templates.content = function(mode, hasHTML) {
	if(window.location.href.indexOf("mediaGallery") != -1) {
		var embed = ' <a href="{data:previewURL}" target="_blank" border=0><img src="{data:previewURL}" class="{plugin.class:previewImg} echo-clickable" title="Click to see full image" width="{data:previewWidth}"></a>';
	}
	else {
		var embed = '<img src="{data:previewURL}" class="{plugin.class:previewImg} echo-clickable" title="Click to see full image" width="{data:previewWidth}">';
		}

	return '<div class="{plugin.class:container}">' +
			'<div class="{plugin.class:embed-code}">' + embed + '</div>' +
			'<div class="{plugin.class:description}"><span class="echo-streamserver-controls-stream-item-text">{data:description}</span></div>' +
	'</div>';
};
/* */
plugin.css =
	'.{plugin.class:business-name} { font: 16px Arial; line-height: 18px; font-weight: bold; cursor: pointer; }' +
	'.{plugin.class:posted-by} { line-height: 16px; margin: 3px 0px 7px 0px; }' +
	'.{plugin.class:description} { margin: 10px 0px; color: white;}' +
	'.{plugin.class} { width: 33%; float: left; margin: 0; }' +
	'.echo-streamserver-controls-stream-item-avatar-wrapper { display: none; } ' +
	'.echo-streamserver-controls-stream-item-subwrapper { margin-left: 0; } ' +
	'.{plugin.class:embed-code} { margin: 3px 0px; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
