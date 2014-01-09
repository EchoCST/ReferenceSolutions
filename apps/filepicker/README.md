FilePicker App
==============

This App adds FilePicker.io support to the Submit App.

***NOTE: This App is based on early-release APIs and documentation, and is now
considered out of date. It was built as a reference only, and should not be
used for production deployments.***

Also, note that this App is very basic: it has several settings such as the
Echo CST FilePicker.io API key hard-coded into it, and these are additional
reasons why it is only meant for demonstration purposes. ***This App is now
considered "deprecated" and will not be further enhanced.*** The functionality
that it provides will, instead, be added to other Apps via a plugin.

It's also ugly - zero time went into CSS styling.

But it does work.

General Workflow
----------------
This App is a combination of several plugins with some workflow included to
transport data between them. Essentially it does the following:

1. Creates a Submit control (a textarea with a Submit button).
1. Adds a FileAttachment plugin to the Submit area. This adds a "URL" text
   field above the Submit box where a file URL may be placed. It also monitors
   the submission events to encode this field into a hidden element embedded
   into the stream content. **Note: This is a good example of how to add custom
   data to submitted stream items.**
1. Adds a FilePicker button to the FileAttachment field. It's hard-coded to
   target this element, so it must be loaded after FileAttachment in any App
   that uses it.
1. Adds a basic Stream below the Submit area that shares the same targetURL, as
   defined in the App's configuration in the Echo AppServer Dashboard.

Note that an index.html sample is included to load this App. It is now
recommended to use AppServer directly through its Canvas model, however this may
be a useful reference to developers who need fine-grained control over the
instantiation of a particular App.
