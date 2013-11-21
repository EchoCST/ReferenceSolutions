(function(jQuery) {
"use strict";

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Item.Plugins.StreamlinedPinboardVisualization
 * The StreamlinedPinboardVisualization plugin transforms Stream.Item control into a
 * pinboard-style block.
 *
 * __Note__: This plugin modifies both Stream.Item and Stream itself to achieve
 * its effects. It also disables some options like "reTag" that are not
 * compatible with its display.
 *
 * @extends Echo.Plugin
 */

var plugin = Echo.Plugin.manifest("StreamlinedPinboardVisualization", "Echo.StreamServer.Controls.Stream.Item");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {
	var self = this, item = this.component;

	this.extendTemplate("replace", "container", plugin.templates.container);
};

plugin.dependencies = [{
	"loaded": function() { return !!Echo.jQuery().isotope; },
	"url": "{config:cdnBaseURL.sdk}/third-party/jquery/jquery.isotope.min.js"
}, {
	"loaded": function() { return !!Echo.jQuery().smartresize; },
	"url": "//echosandbox.com/reference/apps/gallery/app/smartresize.js"
}];

plugin.config = {
	/**
	 * @cfg {Number} maxChildrenBodyCharacters
	 * Truncate the reply text displayed under t6he root item to N characters.
	 */
	"maxChildrenBodyCharacters": 50,

	/**
	 * @cfg {Function} mediaSelector
	 * Override this to define the function that extracts media from arriving
	 * stream items.
	 *
	 * The default function looks for IMG, VIDEO, EMBED, and IFRAME tags using
	 * the following code:
	 *
	 * 	"mediaSelector": function(content) {
	 * 		var dom = $("<div>" + content + "</div>");
	 * 		return $("img, video, embed, iframe", dom);
	 * 	}
	 */
	"mediaSelector": function(content) {
		var dom = $("<div>" + content + "</div>");
		return $("img, video, embed, iframe", dom);
	},

	/**
	 * @cfg {Object} gallery
	 * Pinboard requires the MediaGallery plugin. Any settings defined here will
	 * be passed through to it.
	 */
	"gallery": {
		"resizeDuration": 250
	}
};

plugin.enabled = function() {
	return document.compatMode !== "BackCompat"
};

plugin.labels = {
	/**
	 * @echo_label
	 */
	"childrenMoreItems": "View more items..."
};

(function() {

/**
 * @echo_event Echo.StreamServer.Controls.Stream.Item.Plugins.StreamlinedPinboardVisualization.onChangeView
 * Triggered if the view was changed.
 */
var publish = function(force) {
	this.events.publish({
		"topic": "onChangeView",
		"data": {
			"force": force
		}
	});
};

/**
 * @echo_renderer
 */
plugin.component.renderers.container = function(element) {
	var plugin = this, item = this.component;

	element = item.parentRenderer(name, arguments);
	if (plugin.get("rendered")) {
		element.queue("fx", function(next) {
			next();
			publish.call(plugin, true);
		});
		publish.call(plugin, name === "expandChildren");
	}

	element.on('mouseover', function() {
		var hoverview = plugin.view.get('hoverview');
		hoverview.addClass('over');
	}).on('mouseout', function() {
		var hoverview = plugin.view.get('hoverview');
		hoverview.removeClass('over');
	});

	return element;
}

/**
 * @echo_renderer
 */
plugin.component.renderers.textToggleTruncated = function(element) {
	var plugin = this, item = this.component;
	return item.parentRenderer("textToggleTruncated", arguments).one('click', function() {
		publish.call(plugin, true);
	});
};

$.map(["Echo.StreamServer.Controls.Stream.Item.onRerender",
	"Echo.StreamServer.Controls.Stream.Item.onDelete",
	"Echo.StreamServer.Controls.Stream.Item.MediaGallery.onResize",
	"Echo.StreamServer.Controls.Stream.Item.MediaGallery.onLoadMedia"], function(topic) {
		plugin.events[topic] = function() {
			var force = topic !== "Echo.StreamServer.Controls.Stream.Item.onDelete";
			publish.call(this, force);
		};
});

$.map(["Echo.StreamServer.Controls.Submit.onRender",
	"Echo.StreamServer.Controls.Submit.Plugins.Edit.onEditError",
	"Echo.StreamServer.Controls.Submit.Plugins.Edit.onEditComplete",
	"Echo.StreamServer.Controls.Stream.Item.Plugins.Reply.onCollapse"], function(event) {
	plugin.events[event] = function(topic, args) {
		var plugin = this;
		// in some cases we need to refresh isotope layout immediately
		if (!plugin.get("rendered")) return;
		setTimeout(function() {
			publish.call(plugin, true);
		}, 0);
	};
});

// TODO: avoid coherence between plugin components
plugin.events["Echo.StreamServer.Controls.Stream.Item.onRender"] = function(topic, args) {
	var plugin = this, item = this.component;
	var body = $(".echo-streamserver-controls-stream-body", item.config.get("parent.target"));
	if (!body.data("isotope")) {
		plugin.set("rendered", true);
		return;
	}
	if (item.isRoot()) {
		if (!plugin.get("rendered") && !item.config.get("live")) {
			body.isotope("insert", item.config.get("target"));
		} else {
			publish.call(this, true);
		}
		plugin.set("rendered", true);
	} else {
		publish.call(this, true);
	}
};

})();

/**
 * @echo_renderer
 */
plugin.component.renderers.body = function(element) {
	var plugin = this, item = this.component;
	element = item.parentRenderer("body", arguments);
	var filteredElements = plugin.config.get("mediaSelector")(item.get("data.object.content"));
	$(filteredElements.selector, item.view.get("text")).remove();
	var text = Echo.Utils.stripTags(item.get("data.object.content"));

	return element;
};

/**
 * @echo_renderer
 */
plugin.renderers.childBody = function(element) {
	var plugin = this, item = this.component;
	if (item.isRoot()) {
		return element.empty();
	}
	var text = Echo.Utils.htmlTextTruncate(
		Echo.Utils.stripTags(item.get("data.object.content")),
		plugin.config.get("maxChildrenBodyCharacters"),
		"..."
	);
	return element.empty().append(text);
};

/**
 * @echo_renderer
 */
plugin.renderers.media = function(element) {
	var plugin = this, item = this.component;
	var mediaItems = plugin.config.get("mediaSelector")(item.get("data.object.content"));
	if (mediaItems.length) {
		var config = $.extend(plugin.config.get("gallery"), {
			"target": element,
			"appkey": item.config.get("appkey"),
			"elements": mediaItems,
			"item": item
		});
		new Echo.StreamServer.Controls.Stream.Item.MediaGallery(plugin.config.assemble(config));
	} else {
		element.hide();
	}
	return element;
};

/**
 * @echo_renderer
 */
plugin.renderers.mediafull = function(element) {
	var plugin = this, item = this.component;

	var mediaItems = plugin.config.get("mediaSelector")(item.get("data.object.content"));
	element.append(mediaItems);
	return element;
};

/**
 * @echo_template
 */
plugin.templates.container =
	// TODO: Move ontouchstart out
	'<div class="{class:container}" ontouchstart="this.classList.toggle(\'hover\');">' +
		'<div class="flipper">' +
			'<div class="{plugin.class:mediafull} front"></div>' +
			'<div class="{plugin.class:hoverview} back">' +
				'<div class="{class:header}">' +
					'<div class="{class:avatar-wrapper}">' +
						'<div class="{class:avatar}"></div>' +
					'</div>' +
					'<div class="{plugin.class:topContentWrapper}">' +
						'<div class="{class:authorName} echo-linkColor"></div>' +
						'<div class="{plugin.class:childBody}"></div>' +
						'<div class="echo-clear"></div>' +
					'</div>' +
					'<div class="echo-clear"></div>' +
				'</div>' +
				'<input type="hidden" class="{class:modeSwitch}">' +
				'<div class="echo-clear"></div>' +
				'<div class="{class:wrapper}">' +
					'<div class="{class:subcontainer}">' +
						'<div class="{class:data}">' +
							'<div class="{plugin.class:media}"></div>' +
							'<div class="{class:body} echo-primaryColor"> ' +
								'<span class="{class:text}"></span>' +
								'<span class="{class:textEllipses}">...</span>' +
								'<span class="{class:textToggleTruncated} echo-linkColor echo-clickable"></span>' +
							'</div>' +
						'</div>' +
						'<div class="{class:footer} echo-secondaryColor echo-secondaryFont">' +
							'<img class="{class:sourceIcon} echo-clickable">' +
							'<div class="{class:date}"></div>' +
							'<div class="{class:from}"></div>' +
							'<div class="{class:via}"></div>' +
							'<div class="{class:buttons}"></div>' +
							'<div class="echo-clear"></div>' +
						'</div>' +
					'</div>' +
				'</div>' +
			'</div>' +
		'</div>' +
	'</div>';

plugin.css =
	'.{plugin.class} { perspective: 1000; -webkit-perspective: 1000; }' +
	'.{plugin.class} .flipper { transition: 0.6s; transform-style: preserve-3d; }' +
	'.{plugin.class}:hover .flipper { transform: rotateY(180deg); }' +
	'.{plugin.class}.hover .flipper { transform: rotateY(180deg); }' +
	'.{plugin.class:media} { margin-top: 7px; text-align: center; }' +
	'.{plugin.class:mediafull} img { width: 100%; backface-visibility: hidden; }' +
	'.{plugin.class:topContentWrapper} { margin-left: 5px; padding-left: 35px; }' +
	'.{plugin.class:childBody} { float: none; display: inline; margin-left: 5px; }' +
	'.{plugin.class:childBody} a { text-decoration: none; font-weight: bold; color: #524D4D; }' +
	'.{plugin.class:hoverview} { display: none; backface-visibility: hidden; }' +
	'.{plugin.class:hoverview}.over { display: block; position: absolute; top: 0; right: 0px; bottom: 0px; left: 0px; z-index: 2; border: 1px solid #999; background: #fff; padding: 20px; box-shadow: 1px 1px 4px #999; overflow: hidden; }' +
	'.{plugin.class}.over .{plugin.class:hoverview} { display: block; }' +
	'.{plugin.class} .{class:container} { position: relative; padding: 0px; }' +
	'.{plugin.class} .{class:content} { padding-bottom: 0px; background: white; box-shadow: 1px 1px 2px rgba(34, 25, 25, 0.4); margin: 4px; border: 1px solid #D9D4D4; border-bottom: none; border-right: none; }' +
	'.{plugin.class} .{class:authorName} { float: none; display: inline; margin-left: 0px; }' +
	'.{plugin.class} .{class:body} { margin: 0px; }' +
	'.{plugin.class} .{class:avatar} { float: left; width: 30px; height: 30px; padding-right: 10px; }' +
	'.{plugin.class} .{class:depth-1} { margin-left: 0px; border-bottom: none; }' +
	'.{plugin.class} .{class:depth-1} .{class:authorName} { display: inline; font-size: 12px; }' +
	'.{plugin.class} .{class:depth-0} { padding: 0; }' +
	'.{plugin.class} .{class:depth-0} .{class:authorName} { font-size: 15px; margin-top: 4px; }' +
	'.{plugin.class} .{class:wrapper} { float: none; }' +
	'.{plugin.class} .{class:subcontainer} { float: none; }' +
	'.{plugin.class} .{class:date} { color: #C6C6C6; text-decoration: none; font-weight: normal; }' +
	'.{plugin.class} .{class:footer} a { color: #C6C6C6; text-decoration: none; font-weight: normal; }' +
	'.{plugin.class} .{class:footer} a:hover { text-decoration: underline; }' +
	'.{plugin.class} .{class:container} .{class:footer} { margin-top: 5px; }' +
	'.{plugin.class} .{class:children} .{class:header} { margin-left: 0px; }' +
	'.{plugin.class} .{class:children} .{class:container} { background-color: #F2F0F0; }' +
	'.{plugin.class} .{class:childrenByCurrentActorLive} .{class:container} { background-color: #F2F0F0; }' +
	'.{plugin.class} .{class:children} .{class:wrapper}  { display: none; }' +
	'.{plugin.class} .{class:childrenByCurrentActorLive} .{class:wrapper} {display: none}' +
	'.{plugin.class} .{class:children} .{class:content} { box-shadow: none; margin: 0px; padding: 0px; border: none; border-bottom: 1px solid #d9d4d4; background-color: #F2F0F0; }' +
	'.{plugin.class} .{class:childrenByCurrentActorLive} .{class:content} { box-shadow: none; margin: 0px; padding: 0px; border: none; border-bottom: 1px solid #d9d4d4; background-color: #F2F0F0; }' +
	'.{plugin.class} .{class:container-child} { margin: 0px; padding: 10px 15px; }' +
	'.{plugin.class} .echo-linkColor { text-decoration: none; font-weight: bold; color: #524D4D; }' +
	'.{plugin.class} .echo-linkColor a { text-decoration: none; font-weight: bold; color: #524D4D; }' +
	'.{plugin.class} .{class:buttons} .echo-linkColor { font-weight: normal; color: #C6C6C6; }' +
	'.{plugin.class} .{class:buttons} .echo-linkColor:hover { font-weight: normal; color: #C6C6C6; }' +
	'.{plugin.class} .{class:expandChildren} .echo-message-icon { background-image: none; }' +
	'.{plugin.class} .{class:expandChildren} { border-bottom: 1px solid #D9D4D4; background-color: #F2F0F0; }' +
	'.{plugin.class} .{class:expandChildren} .{class:message-loading} { background-image: none; font-weight: bold; }' +
	'.{plugin.class} .{class:expandChildren} .{class:expandChildrenLabel} { padding-left: 0px; background-image: none; }' +
	// plugins styles
	'.{plugin.class} .{class:plugin-Like-likedBy} { margin-top: 5px; }' +
	'.{plugin.class} .{class:plugin-Reply-submitForm} { box-shadow: none; margin: 0px; border: none; background-color: #F2F0F0; }' +
	'.{plugin.class} .{class:plugin-Reply-compactForm} { box-shadow: none; margin: 0px; border: none; background-color: #F2F0F0; }' +
	'.{plugin.class} .{class:plugin-Reply-replyForm} .echo-identityserver-controls-auth-name { font-size: 12px; }' +
	'.{plugin.class} .{class:plugin-Reply-replyForm} .echo-identityserver-controls-auth-logout { line-height: 24px; }' +
	'.{plugin.class} .{class:plugin-Reply-replyForm} .echo-streamserver-controls-submit-userInfoWrapper {  margin: 5px 0px; }' +
	'.{plugin.class} .{class:plugin-Reply-replyForm} .echo-streamserver-controls-submit-plugin-FormAuth-forcedLoginMessage { font-size: 13px; }' +
	'.{plugin.class} .{class:plugin-Moderation-status}  { width: 30px; clear: both; }' +
	'.{plugin.class} .{class:plugin-TweetDisplay-tweetUserName}, .{plugin.class} .{class:authorName} { float: none; word-wrap: normal; display: block; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; }' +
	'.{plugin.class} .{class:plugin-TweetDisplay-tweetUserName} { margin-left: 0px; }' +
	'.{class:plugin-TweetDisplay} .{plugin.class:childBody} { margin-left: 0; }' +

	// TODO: Remove this block after TwitterIntents removing
	'.{plugin.class} .{class:plugin-TwitterIntents-tweetUserName}, .{plugin.class} .{class:authorName} { float: none; word-wrap: normal; display: block; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; }' +
	'.{plugin.class} .{class:plugin-TwitterIntents-tweetUserName} { margin-left: 0px; }' +
	'.{class:plugin-TwitterIntents} .{plugin.class:childBody} { margin-left: 0; }' +

	((typeof document.createElement("div").style.boxShadow === "undefined")
		? '.{plugin.class} .{class:content} { border: 1px solid #d9d4d4; box-shadow: none; }'
		: '');

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function(jQuery) {
"use strict";

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Plugins.StreamlinedPinboardVisualization
 * See Echo.StreamServer.Controls.Stream.Items.Plugins.StreamlinedPinboardVisualization
 * above for details.
 *
 * @extends Echo.Plugin
 */
var plugin = Echo.Plugin.manifest("StreamlinedPinboardVisualization", "Echo.StreamServer.Controls.Stream");

if (Echo.Plugin.isDefined(plugin)) return;

var ua = navigator.userAgent.toLowerCase();
var isMozillaBrowser = !!(
		!~ua.indexOf("chrome")
		&& !~ua.indexOf("webkit")
		&& !~ua.indexOf("opera")
		&& (
			/(msie) ([\w.]+)/.exec(ua)
			|| ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua)
		)
	);

plugin.config = {
	/**
	 * @cfg {Array} columns
	 * A single integer column count, or an array of breakpoint widths. If
	 * supplied as an array, each value should be a pixel width for each
	 * desired column count. The index of the array is columnCount-1. Examples:
	 *
	 *   Always use four columns, specify integer 4:
	 *   "columns": 4
	 *
	 *   Use one column minimum, two columns at >=330px wide, three columns at
	 *   >=560px wide, four columns at >=900px wide, and five columns for any
	 *   width >=1100px:
	 *   "columns": [ 0, 330, 560, 900, 1100 ]
	 */
	"columns": 4,

	/**
	 * @cfg {Object} isotope
	 * Allows to configure the Isotope jQuery plugin, used by the plugin as the
	 * rendering engine. The possible config values can be found at the Isotope
	 * plugin homepage ([http://isotope.metafizzy.co/](http://isotope.metafizzy.co/)). It's NOT recommended to
	 * change the settings of the Isotope unless it's really required.
	 *
	 *__Note__: the Isotope JS library doesn't work in IE <a href="http://en.wikipedia.org/wiki/Quirks_mode">quirks mode</a>.
	 * Due to this fact you should declare the necessary <a href="http://en.wikipedia.org/wiki/DOCTYPE">\<DOCTYPE\></a>
	 * on the page. We recommend to use a
	 * <a href="http://en.wikipedia.org/wiki/DOCTYPE#HTML5_DTD-less_DOCTYPE">HTML5 DOCTYPE</a> declaration.
	 */
	"isotope": {
		"resizable": false,
		"animationOptions": {
			// change duration for mozilla browsers
			"duration": isMozillaBrowser ? 0 : 2750,
			"easing": "linear",
			"queue": false
		},
		// use only jQuery engine for animation in mozilla browsers
		// due to the issues with video display with CSS transitions
		"animationEngine": isMozillaBrowser ? "jquery" : "best-available"
	}
};

plugin.init = function() {
	var plugin = this, stream = this.component;

	// display an item immediately (cancel the slide down animation)
	// to let the Isotope library work with the final state of the DOM element
	// representing the item, to avoid its incorrect positioning in the grid
	this.component.config.set("slideTimeout", 0);

	// update columnWidth on window resize
	$(window).smartresize(function() {
		plugin._refreshView();
	});
};

plugin.enabled = function() {
	return document.compatMode !== "BackCompat"
};

plugin.dependencies = [{
	"loaded": function() { return !!Echo.jQuery().isotope; },
	"url": "{config:cdnBaseURL.sdk}/third-party/jquery/jquery.isotope.min.js"
}];

plugin.events = {
	"Echo.StreamServer.Controls.Stream.onRender": function(topic, args) {
		this._refreshView();
	},
	"Echo.StreamServer.Controls.Stream.onRefresh": function(topic, args) {
		this._refreshView();
	},
	"Echo.StreamServer.Controls.Stream.Item.Plugins.StreamlinedPinboardVisualization.onChangeView": function(topic, args) {
		var plugin = this;
		if (args.force) {
			plugin._refreshView();
		} else {
			plugin.component.queueActivity({
				"action": "rerender",
				"item": plugin.component.items[args.item.data.unique],
				"priority": "high",
				"handler": function() {
					plugin._refreshView();
					plugin.component._executeNextActivity();
				}
			});
		}
	}
};

plugin.methods._refreshView = function() {
	var plugin = this, stream = this.component;
	var hasEntries = stream.threads.length;

	var $body = stream.view.get("body");
	if ($body.length < 1) {
		return;
	}

	var bodyWidth = $body.width();

	var columns = plugin.config.get("columns", 4);
	if ($.isArray(columns)) {
		var length = columns.length;
		for (var i = 0; i < length; i++) {
			if (bodyWidth < columns[i]) {
				break;
			}
		}

		columns = i;
	}

	var config = $.extend({
		sortBy: "original-order",
		masonry: {
			columnWidth: Math.floor(bodyWidth / columns)
		}
	}, plugin.config.get("isotope"));

	$body.children().css({ "width": config.masonry.columnWidth + "px" });
	$body.data("isotope")
		? (hasEntries
			? $body.isotope("reloadItems").isotope(config)
			: $body.isotope("destroy"))
		: hasEntries && $body.isotope(config);
};

plugin.css =
	'.{plugin.class} { background: #fff; }' +
	'.{plugin.class} .isotope { -webkit-transition-property: height, width; -moz-transition-property: height, width; -o-transition-property: height, width; transition-property: height, width;  -webkit-transition-duration: 0.8s; -moz-transition-duration: 0.8s; -o-transition-duration: 0.8s; transition-duration: 0.8s; }' +
	// TODO: These classes below should probably move up to the Stream.Item plugin
	'.{plugin.class} .isotope .isotope-item { -webkit-transition-property: -webkit-transform, opacity; -moz-transition-property: -moz-transform, opacity; -o-transition-property: top, left, opacity; transition-property:transform, opacity; -webkit-transition-duration: 0.8s; -moz-transition-duration: 0.8s; -o-transition-duration: 0.8s; transition-duration: 0.8s; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
