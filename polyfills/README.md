Polyfills for Echo Apps and Dashboards
======================================

This folder contains fill-in modules that add functionality to Echo Dashboards
and Apps, but in ways that we expect to become moot due to roadmapped
functionality in the Echo SDKs.

    dashboard-support - Misc. functions to refactor out code from multiple dashboards.

    data-sources - Code back-ported from the Media Gallery 1.0 Reference App

    ecl - Support code for generating ECL structures from Angular-compatible HTML templates.

    geo - Support code for doing Geo transforms and map displays from location data.

    media - Support code for extracting and working with images, videos, etc. in stream items.

Note that there are some images in this folder as well. They're here
temporarily while we consider where images in general should be kept. They're
either actually or potentially shared by multiple App/Dashboard callers but most
relate to things we're considering swapping out with something else (like
Bootstrap icons) so we're calling them out as potentially not permanent (hence
"polyfill" category.)