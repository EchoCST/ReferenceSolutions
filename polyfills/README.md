Polyfills for Echo Apps and Dashboards
======================================

This folder contains modules that add functionality to Echo Dashboards and Apps,
but in ways that we expect to become moot due to roadmapped functionality in
Echo's Product development plans. Thus, we recommend that these components be
treated as informational rather than officially supported elements.

  ***dashboard-support*** - Misc. functions to refactor out code from multiple
  dashboards. *(Not used by any Apps at this time.)*

  ***data-sources*** - This is the Data Source Builder from the Media Gallery
  1.0 Reference App. It provides examples of how to integrate with DataServer
  for Apps that need to do so. *(Not used by any Apps at this time.)*

  ***ecl*** - As a conceptual exercise, Echo CST developed the Dashboards for
  the Apps in this repository using Angular-compatible HTML templates for the
  forms, rather than raw ECL. This module provides the bridge to convert from
  one to the other. (Note: A Grunt task in ../Gruntfile.js provides the other
  half, run "grunt cc" to compile the templates.) Echo does not officially
  endorse any specific third-party framework other than Twitter Bootstrap, but
  this module shows how easy it is to integrate with whatever you might be
  using. *(Used by all Apps.)*

  ***geo*** - Support code for doing Geo transforms and map displays from
  location data. *(Used by the Heat Map.)*

  ***media*** - The Media Gallery needs help extracting and working with images,
  videos, etc. in stream items. We envisioned using this in more Apps in the
  future, so we re-factored that code into this module. *(Used by the Media
  Gallery.)*

Note that there are some images in this folder as well. They're here
temporarily while we consider where images in general should be kept. They're
either actually or potentially shared by multiple App/Dashboard callers but most
relate to things we're considering swapping out with something else (like
Bootstrap icons) so we're calling them out as potentially not permanent (hence
"polyfill" category.)
