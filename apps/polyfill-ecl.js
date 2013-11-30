(function($) {
"use strict";

Echo.Polyfills = Echo.Polyfills || {};

// Done as a singleton because we aren't going to instantiate this...
Echo.Polyfills.ECL = {
  /**
   * Load an HTML template file and parse it into ECL JSON. Note that templates
   * load asynchronously in Angular, although we are pre-loading them via a
   * Grunt task in this Polyfill.
   *
   * @param String The name of the template to be loaded
   * @param Function A callback to execute once the template is ready
   */
  getTemplate: function(template, callback) {
    angular.module(template, []).run(["$templateCache", function($templateCache) {
      var tmpl = $templateCache.get(template);
      var ecl = Echo.Polyfills.ECL._parseTemplate(tmpl);
      console.log(ecl);
      callback(ecl);
    }]);
  },

  /**
   * Helper to convert templates to ECL. Wouldn't it be nice if we could just
   * render these?
   *
   * NOTE: This calls itself recursively to deal with FIELDSET nesting.
   *
   * @param template The DOM element nodelist to parse
   */
  _parseTemplate: function(template) {
    var ecl = [];

    $(template).each(function(index, el) {
      var append = null;

      console.dir(el);

      switch (el.nodeName) {
        case 'SELECT':
          append = {
            component: "Select",
            name: el.name,
            type: "string",
            config: {
              title: el.getAttribute('data-title'),
              desc: el.getAttribute('data-help'),
              options: []
            }
          };

          $.map(el.children, function(child) {
            if (child.nodeName == "OPTION") {
              append.config.options.push({
                value: child.value,
                title: child.text,
              });
            }
          });
          break;

        case 'INPUT':
          switch (el.type) {
            case 'checkbox':
              append = {
                component: "Checkbox",
                name: el.name,
                type: "boolean",
                "default": el.getAttribute('checked') == 'checked',
                config: {
                  title: el.getAttribute('data-title'),
                  desc: el.getAttribute('data-help'),
                }
              };
              break;

            case 'text':
              append = {
                component: "Input",
                name: el.name,
                type: "string",
                "default": el.getAttribute('value'),
                config: {
                  title: el.getAttribute('data-title'),
                  desc: el.getAttribute('data-help'),
                }
              };
              break;
          }
          break;

        case 'FIELDSET':
          append = {
            component: "Group",
            name: el.name,
            type: "object",
            config: { }
          };

          var children = [];
          $.map(el.children, function(child) {
            if (child.nodeName == "LEGEND") {
              append.config = {
                title: child.innerHTML,
                "default": {
                  type: "bootstrap",
                  source: child.classList[0]
                }
              };
            } else {
              children.push(child);
            }
          });

          append.items = Echo.Polyfills.ECL._parseTemplate(children);

          break;

        case '#comment':
        case '#text':
        default:
          break;
      }

      if (append != null) {
        ecl.push(append);
      }

      console.log(append);
    });

    return ecl;
  }
};

// Provide a stub for Angular since we aren't actually using it yet...
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
  // angular.module("/gallery/app/dashboard", []).run(["$templateCache", function($templateCache) {
  //  "use strict";
  //   $templateCache.put("/gallery/app/dashboard", "...");
  run: function(init) {
    if (!init || init.length != 2 || init[0] != "$templateCache") {
      return window.angular;
    }

    init[1](window.angular.$templateCache);

    return window.angular;
  }
};

})(Echo.jQuery);
