Echo CST Reference Solutions
============================

This repository provides a set of reference implementations of Echo-driven
experiences. The modules provided here are fully functional, but they are not
meant to be used directly in production deployments but rather as starting
points for new applications that take advantage of everything Echo has to offer.

For questions or support on these items, please contact the Echo Customer
Solutions Team at solutions@aboutecho.com.

Tips
----
When developing Echo Apps, a good dev/debug workflow helps a lot. Since these
apps are best hosted on a CDN it can be tricky deal with upload/purge cycles to
test iterations. Try using Charles Proxy and a Map Local rule like the following:

  http://MYCDN:80/myapp/* -> C:\myproject\myapp
