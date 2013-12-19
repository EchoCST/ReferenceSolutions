(function(jQuery) {
'use strict';

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Item.Plugins.VerticalList
 * Displays a two-bar-overlaid tug-of-war visualization.
 *
 * @extends Echo.Plugin
 */
var plugin = Echo.Plugin.manifest('VerticalList',
                                  'Echo.StreamServer.Controls.Stream.Item');

if (Echo.Plugin.isDefined(plugin)) return;

/**
 * Add a media container for the 'front' side of the card
 */
plugin.init = function() {
    this.extendTemplate('insertBefore', 'body', plugin.templates.bar);
};

/**
 * We add a bar to the visualization as a container for our percentage. Note
 * that we don't use a renderer because we fill the bar later using an event.
 *
 * @echo_template
 */
plugin.templates.bar = '<div class="{plugin.class:bar} result-bar"></div><div class="percentage"></div><div class="count"></div>';

plugin.css =
	// Do not display these data elements
	'.{plugin.class} .{class:authorName}, ' +
	'.{plugin.class} .{class:expandChildren}, ' +
	'.{plugin.class} .{class:childrenMarker}, ' +
	'.{plugin.class} .{class:footer}, ' +
	'.{plugin.class} .{class:avatar-wrapper} { display: none !important; }' +

    // General layout
	'.{plugin.class} .{class:subwrapper} { margin: 0; }' +
    '.{plugin.class} .{class:container-root-thread} { padding: 0; }' +
	'.{plugin.class} .{class:depth-1} { margin: 0; padding: 0; background-color: transparent; }' +
	'.{plugin.class} .{class:children} .{class} { margin: 7px 0; background: #444; color: #fff; font-size: 13px; }' +

    // We don't show header or inset images in this visual even if they're there
	'.{plugin.class} .{class:children} .{class:text} img.header { display: none; }' +
	'.{plugin.class} .{class:children} .{class:text} img.inset { display: none; }' +

    // Visual styles
    '.{plugin.class} .{class:text} .question { width: 100%; padding: 7px 10px; line-height: 18px; font-size: 14px; text-transform: uppercase; background: #111; color: #fff; -moz-box-sizing: border-box; -webkit-box-sizing: border-box; box-sizing: border-box; }' +

	'.{plugin.class} .{class:children} .{class} { font-size: 16px; line-height: 40px; }' +
	'.{plugin.class} .{class:children} .{class:text} a { color: #fff; text-decoration: none; text-transform: uppercase; font-weight: bold; display: block; padding: 0 10px; }' +
    '.{plugin.class} .{class:text} img.header { max-width: 100%; display: block; }' +
    '.{plugin.class} .{class:data} .percentage { float: right; margin: 0 7px; }' +
    '.{plugin.class} .{class:data} .count { float: right; margin: 0 7px; }' +

    // Body/Result bar layering
    '.{plugin.class} .{class:children} .{class:data} { position: relative; height: 40px; width: 100%; }' +
	'.{plugin.class} .{class:children} .{class:body} { position: absolute; z-index: 2; top: 0; left: 0; bottom: 0; right: 0; padding: 0; }' +
    '.{plugin.class} .{class:children} .{plugin.class:bar} { position: absolute; z-index: 1; top: 0; left: 0; bottom: 0; color: #fff; line-height: 40px; font-size: 18px; background: #417DC1; border-right: 1px solid #ccc; }' +

    // Some responsive styling. Note that since phone resolutions are now all
    // over the place we deliberately used widths IN BETWEEN their typical sizes
    // to help make sure we get the edge cases.
    '@media all and (max-width: 900px) {'+
        '.{plugin.class} .{class:children} .{class:data} { height: 34px; }' +
    	'.{plugin.class} .{class:children} .{class} { font-size: 15px; line-height: 34px; }' +
    '}' +

    '@media all and (max-width: 600px) {'+
        '.{plugin.class} .{class:children} .{class:data} { height: 28px; }' +
    	'.{plugin.class} .{class:children} .{class} { font-size: 14px; line-height: 28px; }' +
    '}' +

    '@media all and (max-width: 400px) {'+
        '.{plugin.class} .{class:children} .{class:data} { height: 24px; }' +
    	'.{plugin.class} .{class:children} .{class} { font-size: 12px; line-height: 24px; }' +
    '}' +

    '';

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function(jQuery) {
'use strict';

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Plugins.VerticalList
 * Same functionalty but for the Stream itself, collating data from all Items.
 *
 * @extends Echo.Plugin
 */
var plugin = Echo.Plugin.manifest('VerticalList',
                                  'Echo.StreamServer.Controls.Stream');

if (Echo.Plugin.isDefined(plugin)) return;

plugin.events = {
    'Echo.StreamServer.Controls.Stream.Plugins.VoteDataProcessor.onProcessed': function(topic, args) {
        this.processData();
    }
};

plugin.methods.processData = function() {
    var plugin = this,
        stream = this.component,
        $body = stream.view.get('body'),
        voteCount = 0;

    $.map(stream.threads[0].children, function(item, i) {
        var $wrapper = item.config.get('target'),
            $bar = item.plugins.VerticalList.view.get('bar'),
            percentage = item.get('percentage') || (100 / stream.threads[0].children.length),
            html = '';

        // Also see if we have an inset image
//		var $img = $('<div>' + item.get('data.object.content') + '</div>').find('.inset');
//        if ($img.length > 0) {
//            html += $img.wrapAll('<div></div>').parent().html();
//            console.log(html);
//        }

        if (item.config.get('showPercent')) {
            $wrapper.find('.percentage').html(Math.round(percentage) + '%');
        }

        if (item.config.get('showCount')) {
            $wrapper.find('.count').html(item.get('votes'));
        }

        $bar.html(html);

        // jQuery sets overflow:hidden during animations, and we're using
        // overflow to position the buttons.
        $bar.animate({
            width: percentage + '%'
        }, {
            duration: 2000,
            queue: false,
            step: function() {
                $bar.css({ overflow: 'visible' });
            },
            complete: function() {
                $bar.css({ overflow: 'visible' });
            }
        });
    });
};

plugin.css = '';

Echo.Plugin.create(plugin);

})(Echo.jQuery);