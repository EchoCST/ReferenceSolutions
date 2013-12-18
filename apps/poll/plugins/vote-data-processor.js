(function(jQuery) {
'use strict';

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Item.Plugins.VoteDataProcessor
 * Post-process arriving poll items to add useful elements to them.
 *
 * @extends Echo.Plugin
 */
var plugin = Echo.Plugin.manifest('VoteDataProcessor',
                                  'Echo.StreamServer.Controls.Stream.Item');

if (Echo.Plugin.isDefined(plugin)) return;

/**
 * Add support classes to allow targeting of specific polls and options. Note
 * that we don't do anything else here because some Item fields haven't even
 * been populated yet - important concepts like "depth" (because it has not
 * yet been rendered).
 */
plugin.init = function() {
    var item = this.component,
        id = item.get('data.object.id').split('/');

    item.config.get("target").addClass(id.pop() + ' ' + id.pop());
};

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function(jQuery) {
'use strict';

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Plugins.VoteDataProcessor
 * Provides support methods to extract data from Stream Items for the
 * visualizations to use when rendering themselves.
 *
 * @extends Echo.Plugin
 */
var plugin = Echo.Plugin.manifest('VoteDataProcessor',
                                  'Echo.StreamServer.Controls.Stream');

if (Echo.Plugin.isDefined(plugin)) return;

/**
 * TODO: setInterval();
 */
plugin.init = function() {

};

/**
 * Trigger off onRender and onRefresh events.
 */
plugin.events = {
    'Echo.StreamServer.Controls.Stream.onRender': function(entry) {
        this.processData();
    },
    'Echo.StreamServer.Controls.Stream.onRefresh': function(entry) {
        this.processData();
    }
};

/**
 * Process the stream data. Called by the event handlers, and may also be called
 * manually.
 */
plugin.methods.processData = function() {
    var plugin = this,
        stream = this.component,
        voteCount = 0;

    // First count all the votes.
    $.map(stream.threads[0].children, function(item) {
        var votes = item.get('data.object.accumulators.repliesCount', 0);
        item.set('votes', votes);
        voteCount += votes;
    });

    // Now set percentages to support other plugins like visualizations.
    stream.set('voteCount', voteCount);
    $.map(stream.threads[0].children, function(item) {
        var percentage = (voteCount > 0)
                         ? (100 * item.get('votes') / voteCount)
                         : 0;
        item.set('percentage', percentage);
    });

    // Post an event so others can update themselves.
    plugin.events.publish({
        topic: 'onProcessed',
        data: {
            stream: stream
        }
    });
};

Echo.Plugin.create(plugin);

})(Echo.jQuery);