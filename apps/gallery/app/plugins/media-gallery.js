(function(jQuery) {
"use strict";

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Item.MediaGallery
 * The MediaGallery control is used to display different media (pictures, video,
 * flash objects, etc).
 *
 * @extends Echo.Control
 *
 * @package streamserver/plugins/pinboard-visualization.js
 */

var mediaGallery = Echo.Control.manifest("Echo.StreamServer.Controls.Stream.Item.MediaGallery");

if (Echo.Control.isDefined(mediaGallery)) return;

/** @hide @method getRelativeTime */
/** @hide @echo_label justNow */
/** @hide @echo_label today */
/** @hide @echo_label yesterday */
/** @hide @echo_label lastWeek */
/** @hide @echo_label lastMonth */
/** @hide @echo_label secondAgo */
/** @hide @echo_label secondsAgo */
/** @hide @echo_label minuteAgo */
/** @hide @echo_label minutesAgo */
/** @hide @echo_label hourAgo */
/** @hide @echo_label hoursAgo */
/** @hide @echo_label dayAgo */
/** @hide @echo_label daysAgo */
/** @hide @echo_label weekAgo */
/** @hide @echo_label weeksAgo */
/** @hide @echo_label monthAgo */
/** @hide @echo_label monthsAgo */
/** @hide @echo_label loading */
/** @hide @echo_label retrying */
/** @hide @echo_label error_busy */
/** @hide @echo_label error_timeout */
/** @hide @echo_label error_waiting */
/** @hide @echo_label error_view_limit */
/** @hide @echo_label error_view_update_capacity_exceeded */
/** @hide @echo_label error_result_too_large */
/** @hide @echo_label error_wrong_query */
/** @hide @echo_label error_incorrect_appkey */
/** @hide @echo_label error_internal_error */
/** @hide @echo_label error_quota_exceeded */
/** @hide @echo_label error_incorrect_user_id */
/** @hide @echo_label error_unknown */

/**
 * @echo_event Echo.StreamServer.Controls.Stream.Item.MediaGallery.onReady
 * Triggered when the app initialization is finished completely.
 */
/**
 * @echo_event Echo.StreamServer.Controls.Stream.Item.MediaGallery.onRefresh
 * Triggered when the app is refreshed. For example after the user
 * login/logout action or as a result of the "refresh" function call.
 */
/**
 * @echo_event Echo.StreamServer.Controls.Stream.Item.MediaGallery.onRender
 * Triggered when the app is rendered.
 */
/**
 * @echo_event Echo.StreamServer.Controls.Stream.Item.MediaGallery.onRerender
 * Triggered when the app is rerendered.
 */

mediaGallery.labels = {
	"mediaIsNotAvailable": "<i>Media is not available at this moment...</i>"
};

/**
 * @cfg {Number} resizeDuration
 * Duration of the resize animation media content
 *
 * @cfg {Array} elements
 * List of the jQuery elements which will be displayed (media content)
 *
 * @cfg {Object} item
 * An instance of the Echo.StreamServer.Controls.Stream.Item object
 * which may use its state for some reasons (context, data, etc)
 */
mediaGallery.config = {
	"resizeDuration": 250,
	"removeInvalidItems": true,
	"elements": [],
	"item": undefined
};

/**
 * @echo_template
 */
mediaGallery.templates.main =
	'<div class="{class:container}">' +
		'<div class="{class:thumbnails}">' +
			'<div class="{class:items}"></div>' +
		'</div>' +
		'<div class="{class:controls}"></div>' +
	'</div>';

/**
 * @echo_template
 */
mediaGallery.templates.mediaError =
	'<span class="{class:itemErrorLoading}">{label:mediaIsNotAvailable}</span>';

/**
 * @echo_renderer
 */
mediaGallery.renderers.controls = function(element) {
	var self = this;
	var item = this.config.get("item");
	this.elements = this.config.get("elements");
	this.currentIndex = 0;
	var publish = function(topic) {
		self.events.publish({
			"topic": topic,
			"context": item ? item.config.get("context") : self.config.get("context")
		});
	};
	var controlsContainer = element;
	var itemsContainer = this.view.get("items");
	var itemClass = this.cssPrefix + "item";
	var controlClass = this.cssPrefix + "control";
	var activeControlClass = this.cssPrefix + 'activeControl';
	$.each(this.elements, function(i, element) {
		element = $(element);
		self._normalizeFlashContent(element);
		var ratio;
		var isCurrentControl = (i === self.currentIndex);
		var itemContainer = $('<div></div>').append(element).addClass(itemClass);
		var showCurrentMedia = function() {
			/**
			 * @echo_event Echo.StreamServer.Controls.Stream.Item.MediaGallery.onLoadMedia
			 * Triggered when corresponding media is loaded.
			 */
			i === self.currentIndex && itemContainer.css("display", "block") && publish("onLoadMedia");
		};
		var controlContainer = $('<a href="#"></a>').addClass(controlClass);
		controlContainer.click(function() {
			var control = $(this);
			var currentItem = itemsContainer.children().eq(self.currentIndex);
			$("." + controlClass, controlsContainer).removeClass(activeControlClass);
			control.addClass(activeControlClass);
			itemsContainer.animate({
				"height": itemContainer.height()
			}, self.config.get("resizeDuration"), function() {
				/**
				 * @echo_event Echo.StreamServer.Controls.Stream.Item.MediaGallery.onResize
				 * Triggered when corresponding media is resized.
				 */
				publish("onResize");
			});
			currentItem.fadeOut(function() {
				itemContainer.fadeIn(function() {
					self.currentIndex = i;
					/**
					 * @echo_event Echo.StreamServer.Controls.Stream.Item.MediaGallery.onChangeMedia
					 * Triggered when media is changed.
					 */
					publish("onChangeMedia");
				});
			});
			return false;
		});

		if (isCurrentControl) {
			controlContainer.addClass(activeControlClass);
		}

		element.one("error", function() {
			itemContainer.empty().append(self.substitute({"template": self.templates.mediaError}));
			var $parentItem = itemContainer.closest('.echo-streamserver-controls-stream-item').addClass('load-error');
			if (self.config.get("removeInvalidItems", false) === true) {
				$parentItem.remove();
			}

			showCurrentMedia();
		}).one("load", function() {
			self._loadMediaHandler(element, itemContainer);
			showCurrentMedia();
		});
		itemsContainer.append(itemContainer);
		controlsContainer.append(controlContainer);
	});
	if (this.elements.length === 1) {
		controlsContainer.hide();
	}
	return element;
};

// To avoid bugs with flash content when we show/hide it
// we should try fix it with wmode parameter if needed
mediaGallery.methods._normalizeFlashContent = function(element) {
	var tagName = element.get(0).tagName.toLowerCase();
	if (tagName === "iframe") {
		var parts = Echo.Utils.parseURL(element.attr("src") || "");
		// We only process YouTube links at the moment
		if (!/(www\.)?youtube\.com/.test(parts.domain)) return;

		// Responsive...
		element.removeAttr('height').attr('width', '100%');
		console.log(element);

		var query = parts.query;
		query = query && ~query.indexOf("wmode")
			? query.replace(/(wmode=)([^&?]+)/g, function($0, $1, $2) {
				if ($2 != "opaque" || $2 != "transparent") {
					return $1 + "opaque";
				}
			})
			: (query ? (query += "&wmode=opaque") : "wmode=opaque");
		parts.path = parts.path || "";
		parts.fragment = parts.fragment ? "#" + parts.fragment : "";
		parts.query = query ? "?" + query : "";
		element.attr("src", this.substitute({
			"template": "{data:scheme}://{data:domain}{data:path}{data:query}{data:fragment}",
			"data": parts
		}));
	} else if (tagName === "embed") {
		var wmode = element.attr("wmode");
		if (wmode != "opaque" || wmode != "transparent") {
			element.attr("wmode", "opaque");
		}
	}
};

mediaGallery.methods._getHiddenElementDimensions = function(parent, element) {
	var dimensions;
	parent.css({
		"postion": "absolute",
		"visibility": "hidden",
		"display": "block"
	});
	dimensions = {
		"width": element.width(),
		"height": element.height()
	};
	parent.css({
		"postion": "",
		"visibility": "",
		"display": ""
	});
	return dimensions;
};

mediaGallery.methods._loadMediaHandler = function(element, elementContainer) {
	var self = this;
	var target = this.config.get("target");
	var viewportDimensions = {
		"width": target.width(),
		"height": target.width()
	};
	var getElementDimensions = function() {
		return !elementContainer.is(":visible")
			? self._getHiddenElementDimensions(elementContainer, element)
			: {
				"width": element.width(),
				"height": element.height()
			};
	};
	var ratio;
	var elementDimensions = getElementDimensions();
	if (elementDimensions.width > viewportDimensions.width) {
		ratio = viewportDimensions.width / elementDimensions.width;
		element.css({
			"width": viewportDimensions.width,
			"height": elementDimensions.height * ratio
		});
		elementDimensions = getElementDimensions();
	}
	if (elementDimensions.height > viewportDimensions.height) {
		ratio = viewportDimensions.height / elementDimensions.height;
		element.css({
			"width": elementDimensions.width * ratio,
			"height": viewportDimensions.height
		});
	}
};

mediaGallery.css =
	'.{class:thumbnails} { overflow: hidden; }' +
	'.{class:item} { width: 100%; display: none; box-sizing: border-box; border: 1px solid #666; }' +
	'.{class:controls} { text-align: center; margin-top: 10px; }' +
	'.{class:control} { display: inline-block; width: 8px; height: 8px; font-size: 0px; line-height: 8px; outline: none; border-radius: 4px; vertical-align: middle; margin-left: 8px; cursor: pointer; background-color: #c6c6c6; text-decoration: none; transition: all .2s ease-in 0; -moz-transition-property: all; -moz-transition-duration: .2s; -moz-transition-timing-function: ease-in; -moz-transition-delay: 0; -webkit-transition-property: all; -webkit-transition-duration: .2s; -webkit-transition-timing-function: ease-in; -webkit-transition-delay: 0; }' +
	'.{class:control}:hover { background-color: #ee7b11; }' +
	'.{class:activeControl}, .{class:activeControl}:hover { background-color: #524d4d; }';

Echo.Control.create(mediaGallery);

})(Echo.jQuery);
