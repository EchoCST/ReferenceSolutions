Social Heat Map
===============

This App provides a visual map, currently of the United States but with planned
support and configuration options for other countries and/or a world map. As
stream items arrive with Geo-tagged data, radar "pings" are displayed to
indicate their locations.

Please note that since the inclusion of Geo data is optional (up to the user
posting the Tweet or other item, and typically opt-in rather than opt-out), only
a small percentage of items from any source will typically contain Geo-tagged
data. Additionally, because many devices or installations will use interval-
based polling rather than live updates via WebSockets, update rates can be very
slow if the data is shown directly.

To provide a more "active" look and feel, recently received items are cached
and displayed on an interval in between live udpates. This provides a more
realistic display of activity, so site visitors do not see an empty map.

General Workflow
----------------

Twitter is the recommended data source at this time. To prepare a feed for use,
set up a stream in Echo DataServer, and add the following rule:

    streamserver.add-markers:"geo.location:${geo.longitude};${geo.latitude},geo.marker" | geo

This will add two markers to each post if it contains Geo-data. One will include
the raw latitude/longitude from the post, and the other is a generic marker that
simply indicates that Geo-data is available. This is then used as the filter
by this app, via a "markers:geo.marker" filter.

When installing the App, note that the Dashboard options include a setting for
the map type. This is intended for future expansion because only "US Flat" is
included in the visualization.
