(function($) {
'use strict';

Echo.Polyfills = Echo.Polyfills || {};

// Done as a singleton because we aren't going to instantiate this...
Echo.Polyfills.DashboardSupport = {
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
