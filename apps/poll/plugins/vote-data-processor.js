(function(jQuery) {
'use strict';

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Item.Plugins.VoteDataProcessor
 * Post-process arriving poll items to add useful elements to them. These are
 * shared by all poll visualizations.
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
        id = item.get('data.object.id'),
        elements = id.split('/');

    // The classes are for CSS targeting for specific polls. The ID is so we
    // can find ourselves again if a Tweet is posted.
    item.config.get('target').addClass(elements.pop() + ' ' + elements.pop())
                             .attr('data-echo-id', id);

    // If this option is empty, hide it
    var $content = $(item.data.object.content).wrapAll('<div></div>').parent();
    var answer = $content.find('.answer').html(),
        question = $content.find('.question').html();
    if (!answer && !question) {
        item.config.get('target').hide();
    }
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

plugin.dependencies = [{
    loaded: function() { return !!window.twttr; },
    url: '//platform.twitter.com/widgets.js'
}, {
    url: '//echocsthost.s3.amazonaws.com/plugins/jstorage.min.js'
}];

/**
 * Periodically get updated vote counts.
 *
 * TODO: Refactor.
 */
plugin.init = function() {
    var plugin = this,
        stream = this.component;

    // Hook the Twitter 'tweet' Intent. When it's fired, if it points to one of
    // our options, mark the poll as having been voted-on, and fire and event
    // so the visualizations can show their results (if they're going to).
    if (!!window.twttr) {
        twttr.events.bind('tweet', function (event) {
            if (event.type == 'tweet' && event.region == 'intent') {
                var $el = $(event.target);
                if (!$el.hasClass('answer')) return;

                var $item = $el.closest('.echo-streamserver-controls-stream-item'),
                    id = $item.data('echo-id');

                plugin._recordVote(id);
            }
        });
    }

    setInterval(function() {
        if (!stream.threads[0]) return;

        var request = Echo.StreamServer.API.request({
            endpoint: 'search',
            data: {
                q: stream.config.get('query').replace(
                    ' children:',
                    ' sortOrder:repliesDescending children:'
                ),
                appkey: stream.config.get('appkey')
            },
            onData: function(data, extra) {
                var voteCounts = {};

                $.map(data.entries, function(entry) {
                    var id = entry.object.id,
                        votes = entry.object.accumulators &&
                                entry.object.accumulators.repliesCount ?
                                entry.object.accumulators.repliesCount : 0;
                    voteCounts[id] = parseInt(votes);
                });

                $.map(stream.threads[0].children, function(item) {
                    var object = item.data.object;
                    if (voteCounts[object.id]) {
                        object.accumulators.repliesCount = voteCounts[object.id];
                    }
                });

                plugin.processData();
            },
            onError: function(data, extra) {
                // TODO: What kinds of errors can we get?
                console.log(data, extra);
            }
        });

        request.send();
        // TODO: Make this interval configurable.
    }, 30000);
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
 * Helper method to determine whether we've voted already.
 *
 * NOTE: We are using jStorage for localStorage/cookie support here as a "basic"
 * have-we-voted implementation. In a future version we may want to revisit this
 * to provide something harder to fake. If the customer is willing to "spend" an
 * API call on page load, we could go look for our submission (for API-based
 * polls anyway).
 */
plugin.methods._getVote = function(poll) {
    var id = this._mungeId(poll);
    return $.jStorage.get(id, null);
}

/**
 * Helper method to set the flags when we vote.
 *
 * TODO: We have hard-coded this to expire in 30 days - make it an option?
 */
plugin.methods._recordVote = function(answer) {
    var plugin = this,
        stream = this.component,
        poll = stream.threads[0],
        id = this._mungeId(poll.data.object.id);

    $.jStorage.set(id, answer, { TTL: 30 * 86400 * 1000 });

    stream.config.get('target').addClass('voted');
    stream.set('voted', true);
    if (stream.config.get('display.showResults') == 'after') {
        stream.set('showResults', true);
    }

    // Post an event so others can update themselves.
    plugin.events.publish({
        topic: 'onVoted',
        data: {
            method: 'twitter-intent',
            stream: stream,
            poll: poll,
            answer: answer
        }
    });
}

/**
 * Convert an Echo ID URI into something more friendly for storage. Produces a
 * cookie-key-friendly but still relatively unique key like the following:
 *
 *   _echoPoll_cst_dev_echoplatform_com_sample_data_polls_conanwatch
 *
 * TODO: code cleanup once we know what we want.
 */
plugin.methods._mungeId = function(id) {
    return '_echoPoll_' + id.replace('http://', '')
                            .replace('https://', '')
                            .replace(/[\.,-\/#!$%\^&\*;:{}=\-`~()]/g, '_');
}

/**
 * Process the stream data. Called by the event handlers, and may also be called
 * manually.
 */
plugin.methods.processData = function() {
    var plugin = this,
        stream = this.component,
        voteCount = 0,
        showResults = false;

    // First count all the votes.
    if (!stream.threads[0]) return;
    var poll = stream.threads[0];

    $.map(poll.children, function(item) {
        var votes = item.get('data.object.accumulators.repliesCount', 0);
        item.set('votes', votes);
        voteCount += votes;
    });

    // Now set percentages to support other plugins like visualizations.
    stream.set('voteCount', voteCount);
    $.map(poll.children, function(item) {
        var showPercent = item.config.get('parent.display.percent'),
            showCount = item.config.get('parent.display.count'),
            resultText = '',
            votes = item.get('votes');

        // Actual percentage value
        var percentage = (voteCount > 0)
                            ? (100 * votes / voteCount)
                            : 100 / stream.threads[0].children.length;
        item.set('percentage', percentage);

        // Displayable text label
        if (showPercent && showCount) {
            resultText = Math.round(percentage) + '% (' +
                         plugin._formatCount(votes) + ')';
        } else if (showPercent) {
            resultText = Math.round(percentage) + '%';
        } else {
            resultText = plugin._formatCount(votes);
        }

        item.set('resultText', resultText);
    });

    // TODO: Determine whether the user has already voted. Cookie?
    var vote = this._getVote(poll.data.object.id);

    // Set a 'selected' flag on that item
    $.map(poll.children, function(item) {
        if (item.data.object.id == vote) {
            item.config.get('target').addClass('selected');
            item.set('selected', true);
        } else {
            item.set('selected', false);
        }
    });

    // Should we show the results?
    if (stream.config.get('display.showResults') == 'before' ||
        (stream.config.get('display.showResults') == 'after' && vote)) {
        showResults = true;
        stream.config.get('target').addClass('voted');
    }

    // Cache these values for later use
    stream.set('vote', vote);
    stream.set('showResults', showResults);

    // Post an event so others can update themselves.
    plugin.events.publish({
        topic: 'onProcessed',
        data: {
            stream: stream
        }
    });
};

/**
 * Provides a comma-separated-thousands format display.
 */
plugin.methods._formatCount = function(count) {
    return count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

Echo.Plugin.create(plugin);

})(Echo.jQuery);
