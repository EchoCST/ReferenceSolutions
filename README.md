Echo CST Reference Solutions
============================

This repository provides a set of Apps and reference implementations of
Echo-driven experiences. For questions or support on these items, please contact
the Echo Customer Solutions Team at solutions@aboutecho.com.


Contents
--------

  ***apps*** - Fully functional Echo Applications that may be used as-is, or as
  the basis for new applications of your own.

  ***controls*** - Dashboard controls that provide extra functionality for
  the configuration / management side of Apps.

  ***plugins*** - Re-usable code modules that provide new or enhanced behaviors
  for the end-user side of Apps.

  ***polyfills*** - Support routines that may be shared by Apps. Where Plugins
  and Controls provide native add-ons, these Polyfills provide "bridge"
  functionality that might one day become part of the SDK itself, such as
  support for Angular-compatible templates.

  scripts - Support routines to do things like upload or manipulate sample
  data in DataServer / StreamServer when building and deploying Apps.

Setup
-----
To start using this repository, do the following:

1. Clone it to a local working directory.
1. Copy config-sample.json to config.json, and edit the file.
1. Run "npm install" to install the dependencies.

Development Workflow
--------------------
Typical workflow involves the following steps:

1. Use an HTTP proxy such as Charles or Fiddler and "Map Local" to redirect
   requests for cloud assets to your development directory.
1. Create a Git branch off 'master' in which to work.
1. Create new apps, plugins, etc. as desired. The HTTP proxy will allow you
   to use them on pages and test them as if they were deployed in production.
1. If you make a new App, edit Gruntfile.js to add it to the build list.
1. Run "grunt cc" to compile/recompile dashboard templates from their
   *.tpl.html sources. (A Grunt watch task may be useful here as well.)
1. Run "grunt deploy-dev" to send your development files to an S3 bucket for
   testing by others. You must do this step at least once for AppServer to
   see your manifest.json file the first time you register an App.
1. Run "grunt deploy-prod" to do the same thing, but also invalidate a
   CloudFront distribution. This would be a Production deployment task.

The Gruntfile contains several other build tools - feel free to poke
around and even suggest or contribute changes back!
