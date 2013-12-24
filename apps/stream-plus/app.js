(function(jQuery) {
"use strict";

var $ = jQuery;

var stream = Echo.App.manifest("Echo.Apps.StreamPlus");

if (Echo.App.isDefined(stream)) return;

stream.config = {
	"targetURL": undefined,
	"dependencies": {
		"Janrain": {"appId": undefined},
		"StreamServer": {"appkey": undefined}
	}
};

stream.dependencies = [{
	"url": "//cdn.echoenabled.com/apps/echo/conversations/app.js",
	"app": "Echo.Apps.Conversations"
}, {
	"url": "{config:cdnBaseURL.sdk}/streamserver.pack.js",
	"app": "Echo.StreamServer.Controls.Stream"
}];

stream.templates.main =
	'<div class="{class:container}">' +
		'<div class="{class:stream}"></div>' +
	'</div>';

stream.renderers.stream = function(element) {
	var targetURL = this.config.get("targetURL");
	// FIXME: get rid of queryOverrides as soon as "type" config parameter
	//        is supported in Echo Conversations app
	var topQuery = "childrenof:" + targetURL + " sortOrder:reverseChronological itemsPerPage:5 (user.markers:Conversations.TopContributor OR markers:Conversations.TopPost) -markers:Conversations.RemovedFromTopPosts type:comment,note -state:ModeratorDeleted children:2 -state:ModeratorDeleted";
	var allQuery = "childrenof:" + targetURL + " sortOrder:reverseChronological itemsPerPage:15 type:comment,note (state:Untouched,ModeratorApproved OR (user.roles:moderator,administrator AND -state:ModeratorDeleted)) children:2 (state:Untouched,ModeratorApproved OR (user.roles:moderator,administrator AND -state:ModeratorDeleted))";
	this.initComponent({
		"id": "Conversations",
		"component": "Echo.Apps.Conversations",
		"config": {
			"target": element,
			"targetURL": this.config.get("targetURL"),
			"auth": {
				"allowAnonymousSubmission": true
			},
			"postComposer": {
				"visible": false
			},
			"topPosts": {
				"queryOverride": topQuery
			},
			"allPosts": {
				"queryOverride": allQuery
			},
			"dependencies": this.config.get("dependencies")
		}
	});
	return element;
};

stream.css = "";

Echo.App.create(stream);

})(Echo.jQuery);
