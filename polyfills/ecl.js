(function($) {
'use strict';

Echo.Polyfills = Echo.Polyfills || {};

// Done as a singleton because we aren't going to instantiate this...
Echo.Polyfills.ECL = {
  /**
   * Load an HTML template file and parse it into ECL JSON. Note that templates
   * load asynchronously in Angular, although we are pre-loading them via a
   * Grunt task in this Polyfill.
   *
   * This method is a service function that may be called directly, but most
   * Apps will typically want to call templateECL() instead, which will return
   * an ECL object instead of the raw template.
   *
   * @param {String} template The name of the template to be loaded
   * @param {Function} callback A callback to execute once the template is ready
   */
  getTemplate: function(template, callback) {
    angular.module(template, [])
           .run(['$templateCache', function($templateCache) {
      var tmpl = $templateCache.get(template);
      callback(Echo.Polyfills.ECL._parseTemplate(tmpl));
    }]);
  },

  /**
   * Load an HTML template file and parse it into ECL JSON. Note that templates
   * load asynchronously in Angular, although we are pre-loading them via a
   * Grunt task in this Polyfill.
   *
   * This method is a service function that may be called directly, but most
   * Apps will typically want to call templateECL() instead, which will return
   * an ECL object instead of the raw template.
   *
   * @param {Echo.Apps.Poll.Dashboard} dashboard The App Dashboard that needs the ECL
   * @param {String} template The name of the template to load
   * @param {Function} A callback to execute once the template is ready
   */
  templateECL: function(dashboard, template, callback) {
	Echo.Polyfills.ECL.getTemplate(template, function(ecl) {
		dashboard.config.set("ecl", ecl);
		callback.call(dashboard);
    });
  },

  /**
   * Helper to convert templates to ECL. Wouldn't it be nice if we could just
   * render these?
   *
   * NOTE: This calls itself recursively to deal with FIELDSET nesting.
   *
   * @param {Element} template The DOM element nodelist to parse
   */
  _parseTemplate: function(template) {
    var ecl = [];

    $(template).each(function(i, el) {
      // ECL currently has no way to represent static HTML
      if (el.nodeName == '#comment' || el.nodeName == '#text') return;

      // Defaults for all elements
      var append = {
        component: 'Input',
        name: 'undefined',
        type: 'string',
        'default': '',
        config: {
          title: '',
          desc: ''
        }
      };

      // Defaults based on node type
      switch (el.nodeName) {
        // TODO: Special cases for InputList, TextArea, Label, RadioGroup

        case 'SELECT':
          append.component = 'Select';
          append.config.options = [];

          // Don't recurse - we only support OPTION children for SELECTs
          $.map(el.children, function(child) {
            if (child.nodeName != 'OPTION') return;

            append.config.options.push({
              title: child.innerHTML,
              value: child.getAttribute('value')
            });

            if (child.getAttribute('selected') === 'selected') {
              append['default'] = child.getAttribute('value');
            }
          });
          break;

        case 'FIELDSET':
          // ECL supports Fieldset and Group, but HTML only has fieldsets. Since
          // HTML fieldsets act a lot like ECL Groups, that's how we map them...
          append.component = 'Group';
          append.type = 'object';

          var children = [];
          $.map(el.children, function(child) {
            if (child.nodeName == 'LEGEND') {
              append.config.title = child.innerHTML;
              append.config.icons = {
                'default': {
                  type: 'bootstrap',
                  source: child.classList[0]
                }
              };
            } else {
              children.push(child);
            }
          });

          append.items = Echo.Polyfills.ECL._parseTemplate(children);

          break;
      }

      // Then fill in overrides as necessary
      $.each(el.attributes, function(i, attribute) {
        var v = attribute.nodeValue;
        switch (attribute.nodeName) {
          // These map directly to various fields
          case 'name':           append.name         = v; break;
          case 'value':          append['default']   = v; break;
          case 'data-storage':   append.type         = v; break;
          case 'data-component': append.component    = v; break;
          case 'data-url':       append.url          = v; break;
          case 'title':          append.config.title = v; break;
          case 'data-help':      append.config.desc  = v; break;

          // These are a little more special...
          case 'data-required':  append.required = (v === 'true'); break;
          case 'checked':        append['default'] = (v === 'checked'); break;

          // The "type" attribute indicates an element sub-type, like CHECKBOX
          case 'type':
            switch (v) {
              case 'checkbox':
                append.component = 'Checkbox';
                append['default'] = !!append['default'];
                if (append.type == 'string') append.type = 'boolean';
                break;
            }
            break;
        }
      });

      ecl.push(append);
    });

    return ecl;
  }
};

// Provide a stub for Angular since we aren't actually using it yet...
// NOTE: TODO: This will break Angular if it actually exists on the page!
// This polyfill needs more work to disable itself if Angular is found.
window.angular = {
  $templateCache: {
    _templates: {},

    get: function(name) {
      return this._templates[name];
    },

    put: function(name, template) {
      this._templates[name] = template;
    }
  },

  // The template compiler will call this like:
  // angular.module('templates-main', ['/gallery/app/dashboard']);
  module: function(name, requires) {
    return window.angular;
  },

  // The template compiler will call this like:
  // angular.module('/gallery/app/dashboard', [])
  //        .run(['$templateCache', function($templateCache) {
  //  'use strict';
  //   $templateCache.put('/gallery/app/dashboard', '...');
  run: function(init) {
    if (!init || init.length != 2 || init[0] != '$templateCache') {
      return window.angular;
    }

    init[1](window.angular.$templateCache);

    return window.angular;
  }
};

})(Echo.jQuery);
