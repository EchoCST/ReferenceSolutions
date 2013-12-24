(function(jQuery) {
'use strict';

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Item.Plugins.TugOfWar
 * Displays a two-bar-overlaid tug-of-war visualization.
 *
 * @extends Echo.Plugin
 */
var plugin = Echo.Plugin.manifest('TugOfWar',
                                  'Echo.StreamServer.Controls.Stream.Item');

if (Echo.Plugin.isDefined(plugin)) return;

/**
 * Add a media container for the 'front' side of the card
 */
plugin.init = function() {
    this.extendTemplate('insertBefore', 'body', plugin.templates.bar);
    this.extendTemplate('insertBefore', 'body', plugin.templates.result);
};

/**
 * We add a bar to the visualization as a container for our percentage. Note
 * that we don't use a renderer because we fill the bar later using an event.
 *
 * @echo_template
 */
plugin.templates.bar = '<div class="{plugin.class:bar} tugofwar-bar"></div>';

/**
 * We draw the result as a separate element so the bar's width doesn't interfere
 * with it.
 *
 * @echo_template
 */
plugin.templates.result= '<div class="{plugin.class:result}"></div>';

plugin.css =
	// Do not display these data elements
    //'.{plugin.class} .{class:depth-0}, ' +
	'.{plugin.class} .{class:footer}, ' +
	'.{plugin.class} .{class:avatar-wrapper}, ' +
	'.{plugin.class} .{class:authorName}, ' +
	'.{plugin.class} .{class:expandChildren}, ' +
	'.{plugin.class} .{class:childrenMarker}, ' +
	'.{plugin.class} .{class:text} .header, ' +
    '.{plugin.class} .{class:modeSwitch}, ' +
	'.{plugin.class} .{class} .{class:children} { display: none !important; }' +

    // General layout
	'.{plugin.class} div { box-sizing: border-box; }' +
	'.{plugin.class} .{class:subwrapper} { margin: 0; }' +
    '.{plugin.class} .{class:children} { width: 100%; height: 100px; position: relative; }' +
	'.{plugin.class} .{class:depth-1} { margin: 0; padding: 0; background-color: transparent; }' +
	'.{plugin.class} .echo-primaryColor { color: #fff; }' +
	'.{plugin.class} .percentage { margin: 0 12px; }' +
    '.{plugin.class} .{class} .{class:data} { position: relative; height: 140px; }' +

    // Header
    '.{plugin.class} .{class:container-root-thread} { padding: 0; }' +
    '.{plugin.class} .{class:container-root-thread} .{class:body} { background: #333; padding: 6px 12px; text-transform: uppercase; margin: 0 0 5px 0; font-size: 16px; }' +

	// Bars
	'.{plugin.class} .{class} { width: 100%; height: 140px; position: absolute; top: 0; left: 0; }' +
    '.{plugin.class} .{class} .{plugin.class:bar} { height: 100px; position: absolute; top: 0; border: 1px solid #fff; }' +
	'.{plugin.class} .{class}:first-child .{plugin.class:bar} { background: #ea9101; z-index: 0; right: 0; width: 100%; }' +
	'.{plugin.class} .{class}:last-child .{plugin.class:bar} { background: #55a3cc; z-index: 1; left: 0; }' +

    // Text display. Note that tug of war polls may include an IMG with a class
    // of "inset" that acts as a graphic badge on the bar.
    '.{plugin.class} .{class} .{plugin.class:result} { position: absolute; top: 0; height: 100px; color: #fff; line-height: 100px; font-size: 30px; z-index: 2; }' +
    '.{plugin.class} .{class}:first-child .{plugin.class:result} { right: 0; }' +
    '.{plugin.class} .{class}:last-child .{plugin.class:result} { left: 0; }' +

    '.{plugin.class} .{class} .{plugin.class:result} img { display: block; height: 77px; overflow: hidden; margin: 12px; }' +
    '.{plugin.class} .{class}:first-child .{plugin.class:result} img { float: right; }' +
    '.{plugin.class} .{class}:last-child .{plugin.class:result} img { float: left; }' +

    '.{plugin.class} .{class}:first-child .{plugin.class:result} .percentage { float: right; }' +
    '.{plugin.class} .{class}:last-child .{plugin.class:result} .percentage { float: left; }' +

    // Action buttons are shown below the bars.
    '.{plugin.class} .{class} .{class:body} { position: absolute; bottom: 0; }' +
    '.{plugin.class} .{class} .{class:body} img { display: none; }' +
    '.{plugin.class} .{class}:first-child .{class:body} { right: 0; }' +
    '.{plugin.class} .{class}:last-child .{class:body} { left: 0; }' +

    // Buttons and other data
    '.{plugin.class} .{class} .{class:text} a { display: block; padding: 6px 20px; border-radius: 9px; background: #333; text-decoration: none; font-weight: bold; margin: 10px 20px 0 20px; color: #fff; }' +
	'.{plugin.class} .{class}:first-child .{class:text} a { float: right; }' +
	'.{plugin.class} .{class}:last-child .{class:text} a { float: left; }' +

    // Some responsive styling. Note that since phone resolutions are now all
    // over the place we deliberately used widths IN BETWEEN their typical sizes
    // to help make sure we get the edge cases.
    '@media all and (max-width: 900px) {'+
    	'.{plugin.class} .{class:data} { height: 120px; }' +
        '.{plugin.class} .{class:children} { height: 80px; }' +
        '.{plugin.class} .{plugin.class:bar} { height: 80px; }' +
        '.{plugin.class} .{plugin.class:result} { font-size: 24px; line-height: 80px; }' +
        '.{plugin.class} .{plugin.class:result} img { margin: 10px; height: 60px; }' +
        '.{plugin.class} .{class:text} a { margin: 8px 16px 0 16px; }' +
    '}' +

    '@media all and (max-width: 600px) {'+
    	'.{plugin.class} .{class:data} { height: 100px; }' +
        '.{plugin.class} .{class:children} { height: 60px; }' +
        '.{plugin.class} .{plugin.class:bar} { height: 60px; }' +
        '.{plugin.class} .{plugin.class:result} { font-size: 20px; line-height: 60px; }' +
        '.{plugin.class} .{plugin.class:result} img { margin: 8px; height: 46px; }' +
        '.{plugin.class} .{class:text} a { margin: 7px 12px 0 12px; }' +
    '}' +

    '@media all and (max-width: 400px) {'+
    	'.{plugin.class} .{class:data} { height: 80px; }' +
        '.{plugin.class} .{class:children} { height: 40px; }' +
        '.{plugin.class} .{plugin.class:bar} { height: 40px; }' +
        '.{plugin.class} .{plugin.class:result} { font-size: 16px; line-height: 40px; }' +
        '.{plugin.class} .{plugin.class:result} img { margin: 6px; height: 28px; }' +
        '.{plugin.class} .{class:text} a { margin: 6px 10px 0 10px; }' +
    '}' +

    '';

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function(jQuery) {
'use strict';

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Plugins.TugOfWar
 * Same functionalty but for the Stream itself, collating data from all Items.
 *
 * @extends Echo.Plugin
 */
var plugin = Echo.Plugin.manifest('TugOfWar',
                                  'Echo.StreamServer.Controls.Stream');

if (Echo.Plugin.isDefined(plugin)) return;

plugin.events = {
    'Echo.StreamServer.Controls.Stream.Plugins.VoteDataProcessor.onProcessed':
    function(topic, args) {
        this.processData();
    },
    'Echo.StreamServer.Controls.Stream.Plugins.VoteDataProcessor.onVoted':
    function(topic, args) {
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
            $bar = item.plugins.TugOfWar.view.get('bar'),
            $result = item.plugins.TugOfWar.view.get('result'),
            percentage = item.get('percentage') || 50,
            html = '';

        // Set up the result text/image elements
		var $img = $('<div>' + item.get('data.object.content') + '</div>').find('img');
        if ($img.length > 0) {
            html += $img.wrapAll('<div></div>').parent().html();
        }

        if (item.config.get('showPercent')) {
            html += '<span class="percentage">' + Math.round(percentage) + '%</span>';
        }

        if (item.config.get('showCount')) {
            html += '<span class="count">' + item.get('votes') + '</span>';
        }

        $result.html(html);

        // Animate only the LEFT bar (which is the second Stream Item...)
        if (i == 1) {
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
        }
    });
};

plugin.css =
    '.{plugin.class} { width: 100%; height: 185px; padding: 20px 0 60px 0; }' +

    '@media all and (max-width: 900px) {'+
        '.{plugin.class} { height: 160px; }' +
    '}' +

    '@media all and (max-width: 600px) {'+
        '.{plugin.class} { height: 140px; }' +
    '}' +

    '@media all and (max-width: 400px) {'+
        '.{plugin.class} { height: 120px; }' +
    '}' +

Echo.Plugin.create(plugin);

})(Echo.jQuery);
