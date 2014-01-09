Reference Solution Support Scripts
==================================

This directory provides support tools and scripts to assist in the development
process.

Contents
--------

  ***config.php*** - Included by all files. Loads and processess ../config.json.
  See ../README.md for details.

  ***submit-xml.php*** - May be used to send an XML representation of
  ActivityStream objects to the Echo Submit API. You must set up ../config.json
  first to use this script. A sample XML for a submission is in
  apps/poll/samples/sixoptions.xml. To submit it, you would run (from ../):

      php scripts/submit-xml.php myaccount poll/samples/sixoptions.xml
