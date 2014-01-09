Reference Apps
==============

This directory provides a set of Apps that may either be used as-is or as the
base for new Apps of your own. Several also include support plugins.

Contents
--------

  ***filepicker*** - An implementation of the FilePicker.io widget.

  ***gallery*** - Media Gallery 2.0 with several new visualizations.

  ***heatmap*** - Social Heat Map: displays stream items such as Tweets as radar
  "pings" on a map, as they arrive.

  ***poll*** - Polling experience with six different visualizations, plus
  support for both social and API-driven vote counting.

  ***stream-plus*** - Wrapper for the new Conversations core product that allows
  it to be easily re-used as the base for new apps. One reason to do so would be
  to take advantage of the new Cards visualizations for stream items.

Building Apps
-------------
Please see ../README.md for a high-level overview of how to use the contents of
this repository. However, specifically for Apps, there are some additional
concepts to note.

First, Echo Apps are defined using a "manifest" file, typically named
manifest.json or similar. Each App has a unique ID, listed in this file. To use
one of the Apps provided here as the basis for a new one of your own, the best
way to start is to copy an entire app subdirectory to a new name, then edit the
manifest file to give your app a new (unique) ID.

You can create the manifest "stub" for an App before the App itself exists.
YOu do not have to deploy or even write your App code files before registering
them in AppServer, which makes it easy to stub out an empty App and begin
development right away. (See ../README.md for tips on using Charles or similar
to work "offline". This is also helpful for developers using Node.JS, Express,
or similar as a local development environment.)

However, note that the manifest DOES need to be publicly visible before
AppServer can see it. Ideally, create an Amazon AWS account and an S3 bucket,
and upload your manifest there to get a URL to use in AppServer. (Make sure you
make the file publicly readable!) Manifest files receive very little traffic,
so their hosting requirements are minimal - it does not need to be on a CDN.
It is also acceptable to use something like Dropbox, just bear in mind that if
the manifest becomes inaccessible the App could break.

The manifest is only read during App registration/installation events, not on
every page load. This means you do NOT need to update the file or AppServer
during your normal development process. It is only necessary to do this if
the contents of the manifest itself change - usually because you are moving the
JS assets to a new location, or changing something basic about your App, such as
its name or author meta-data.
