Media Gallery 2.0
=================

***NOTE: This App is deprecated, and scheduled to be replaced by Media Gallery
3.0, which will be based on Conversations and support Cards and other new
features.***

General Workflow
----------------

This App is based on a standard Echo stream. Then, based on configuration
options set in the Echo AppServer Dashboard, it loads one of three visualization
plugins, found in the "visualizations/" folder:

  ***pinboard*** - A standard Pinboard display with a jQuery-isotope based
  layout engine.

  ***pinboard-streamlined*** - Similar to Pinboard, but with a streamlined
  look and feel. Only images are displayed on the main view, and additional
  elements like text and Intents are shown on the "back" side of a "flippable"
  card.

  ***fullscreen*** - Embeds the Galleria plugin into the experience for a more
  traditional slide-show style view. Stream items are shown in a thumbnail
  rail, with the actively-selected item shown in a large view above the thumbs.
  In addition, images may be clicked to activate a full-screen display with an
  auto-play mode. This could conceivably be used as the base for a Second Screen
  experience.

