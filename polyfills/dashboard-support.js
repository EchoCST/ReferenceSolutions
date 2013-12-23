(function($) {
'use strict';

Echo.Polyfills = Echo.Polyfills || {};

// Done as a singleton because we aren't going to instantiate this...
Echo.Polyfills.DashboardSupport = {
    // Dashboards can fill these in to pass data to their children
    configData: null,

    /**
     * Create or update a StreamServer Item.
     * TODO: Error handling
     * TODO: Clean up params
     */
    createOrUpdateItem: function(params) {
        // First see if the item exists.
        $.ajax({
            url: 'https://api.echoenabled.com/v1/search',
            data: {
                q: 'url:' + params.url + ' safeHTML:off children:0',
                appkey: params.appkey,
            },
            timeout: 5000,
            dataType: 'jsonp',
            success: function(data) {
                if (data.entries.length > 0) {
                    console.log('Entry ' + params.url + ' exists, updating...');
                    params.callback(data);
                } else {
                    console.log('Entry ' + params.url + ' does not exist, creating...');
                    params.callback(data);

                    console.log(Backplane.getChannelID());
/*
                    $.ajax({
                        url: 'https://apps.echoenabled.com/v2/esp/activity',
                        appkey: params.appkey,
                        sessionID: Backplane.getChannelID(),
                        content: {
                            avatar: '',
                            name: Echo.UserSession._getName(),
                            content: '',
                            source: {},
                            target: "http://cst-dev.echoplatform.com/sample-data/polls/poll1",
                            verb: "post",
                            type: "http://activitystrea.ms/schema/1.0/article"
                        },
                    });*/
                }
            }
        });
    },
            /*

            var data = {
            };
        }*/


    /**
     * Standard initialization routine used by most Dashboards:
     *
     *   - Load the appropriate template for this dashboard as set by the
     *     config param 'eclTemplate'.
     *
     * This routine allows dashboards that don't need custom behaviors to keep
     * their code clean.
     */
    standardInit: function() {
        var app = this,
            parent = $.proxy(this.parent, this),
            template = app.config.get('eclTemplate', ''),
            defs = [$.Deferred()];

        app.config.set('ecl', []);

        if (template == '') {
            Echo.Utils.log({
                'type': 'error',
                'message': 'Cannot load dashboard: please set eclTemplate.'
            });

            return;
        }

        // We hold off on calling our parent until everything else has loaded
        $.when.apply($, defs).done(function() {
            parent();
        });

        Echo.Polyfills.ECL.templateECL(app, template, defs[0].resolve);
    }
};

})(Echo.jQuery);
