Echo CST Reference Solutions
============================

This repository provides a set of Apps and reference implementations of
Echo-driven experiences. For questions or support on these items, please contact
the Echo Customer Solutions Team at solutions@aboutecho.com.


Setup
-----
Before using the Grunt build script or support scripts (scripts/ folder), you
need to create a config.json file. To do this, copy config-sample.json to
config.json and edit it to supply your API keys as required.


Tips
----
To avoid the need for constant edit/deploy cycles during development, consider
using a tool such as Charles Proxy or Fiddler, which allow you to "map" requests
for remote files to local assets. Example:

  http://MYCDN:80/myapp/* -> C:\myproject\myapp
