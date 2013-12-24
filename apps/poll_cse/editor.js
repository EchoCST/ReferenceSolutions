(function($) {
'use strict';

// http://echocsthost.s3.amazonaws.com/apps/poll/editor.html?appKey=echo.echo.streamserver.echo-cst-dev.prod&busName=echo-cst-dev&pollURL=http://cst-dev.echoplatform.com/sample-data/polls/poll1

window.$_GET = {};
window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
    window.$_GET[key] = value;
});

var pollExists = false;

$(document).ready(function() {
    // We need at least these three parameters
    if (!$_GET['busName']) { alert('Invalid busName'); return; }
    if (!$_GET['appKey']) { alert('Invalid appKey'); return; }
    if (!$_GET['pollURL']) { alert('Invalid pollURL'); return; }

    // Set up Backplane
    var backplane = {
        serverBaseURL : "https://api.echoenabled.com/v1",
        busName: $_GET['busName']
    };

    var identityManager = {
        title: "Please login...",
        width: 400,
        height: 240,
        url: "https://" + $_GET['busName'] + ".rpxnow.com/openid/embed?flags=stay_in_window,no_immediate&token_url=http%3A%2F%2Fapps.echoenabled.com%2Fv2%2Fjanrain%2Fwaiting.html&bp_channel="
    };

    // Set up the Auth control.
    Echo.Loader.initApplication({
        script: "//cdn.echoenabled.com/sdk/v3/identityserver.pack.js",
        component: "Echo.IdentityServer.Controls.Auth",
        backplane: backplane,
        config: {
            target: document.getElementById("auth"),
            appkey: $_GET['appKey'],
            targetURL: $_GET['pollURL'],
            identityManager: {
                login: identityManager,
                signup: identityManager
            }
        }
    });

    Echo.Loader.download([
        { url: '//cdn.echoenabled.com/sdk/v3/streamserver.pack.js' },
        // NOTE: Went with this small plugin to avoid having to load all of
        // jQuery UI, and this isn't something Bootstrap really covers.
        { url: '//echocsthost.s3.amazonaws.com/plugins/jquery-sortable-min.js' }
    ], function() {
        filepicker.setKey('AVxxvNJUtRQOjN6ugyWavz');
        $("#poll-options").sortable({
            itemSelector: 'li',
            onMousedown: function($item, event, _super) {
                if (event.target.nodeName != 'INPUT' &&
                    event.target.nodeName != 'IMG' &&
                    !$(event.target).hasClass('preview')) {
                    event.preventDefault()
                }
            }
        });

        $('.default-text').focus(function() {
            var $el = $(this);
            if ($el.val() == $el.attr('rel')) {
                $el.val('');
            }
        }).blur(function() {
            var $el = $(this),
                val = $.trim($el.val());
            $el.val((val == '') ? $el.attr('rel') : val);
        }).each(function() {
            $(this).trigger('blur');
        });

        $('.inset .preview').click(function(e) {
            var $inset = $(this).closest('.inset');

            filepicker.pickAndStore({
                multiple: false,
                maxFiles: 1,
                folders: false,
                extensions: ['.png', '.jpg', '.jpeg', '.gif'],
                maxSize: 50*1024*1024
            }, {
                location: 'S3',
                path: 'polls',
                access: 'public'
            }, function(InkBlobs) {
                console.log('Success', InkBlobs);
                $.map(InkBlobs, function(blob) {
                    //blob.url = 'https://pbs.twimg.com/media/BYvzKb3CQAAlUCi.jpg:large';
                    $inset.find('img').attr('src', blob.url);
                });
            }, function(FPError) {
                console.log('Error', FPError);
            });
        });

        $('.header .preview').click(function(e) {
            var $header = $(this).closest('.header');

            filepicker.pickAndStore({
                multiple: false,
                maxFiles: 1,
                folders: false,
                extensions: ['.png', '.jpg', '.jpeg', '.gif'],
                maxSize: 50*1024*1024
            }, {
                location: 'S3',
                path: 'polls',
                access: 'public'
            }, function(InkBlobs) {
                console.log('Success', InkBlobs);
                $.map(InkBlobs, function(blob) {
                    //blob.url = 'https://pbs.twimg.com/media/BYvzKb3CQAAlUCi.jpg:large';
                    $header.find('img').attr('src', blob.url);
                });
            }, function(FPError) {
                console.log('Error', FPError);
            });
        });

        var request = Echo.StreamServer.API.request({
            endpoint: 'search',
            data: {
                q: "url:" + $_GET['pollURL'] + " safeHTML:off children:1 childrenSortOrder:reverseChronological childrenItemsPerPage:45",
                appkey: $_GET['appKey'],
            },
            onData: function(data, extra) {
                if (data.entries.length < 1) {
                    $('#no-poll').show();
                    pollExists = false;
                } else {
                    $('#no-poll').hide();
                    $('#echo-poll-editor').show();
                    pollExists = true;
                }
                console.log(data, extra);
            },
            onError: function(data, extra) {
                console.log('error', data, extra);
                // handle failed request here...
            }
        });
        request.send();
    });

    $('#create-poll').click(function(e) {
       e.preventDefault();

        var url = 'https://apps.echoenabled.com/v2/esp/activity';

        if (!exists) {
            // Post a new item and its children
            exists = true;

            var data = {
                appkey: $_GET['appKey'],
                sessionID: Backplane.getChannelID(),
                content: {
                    avatar: '',
                    name: Echo.UserSession._getName(),
                    content: '',
                    source: {},
                    target: "http://cst-dev.echoplatform.com/sample-data/polls/poll1",
                    verb: "post",
                    type: "http://activitystrea.ms/schema/1.0/article"
                },
            };
        }


        console.log(data);

        $('#echo-poll-editor').show();
        $('#no-poll').hide();
    });

    // TODO: Set this from the StreamServer query on load / update.
    var exists = false;

    // TODO: Didn't have time to work through the SDK here, so just went for the
    // ESP endpoint. Convert later?
    $('#save-changes').click(function(e) {
       e.preventDefault();

        var url = 'https://apps.echoenabled.com/v2/esp/activity';

        if (!exists) {
            // Post a new item and its children
            exists = true;

            var data = {
                appkey: $_GET['appKey'],
                sessionID: Backplane.getChannelID(),
                content: {
                    avatar: '',
                    name: Echo.UserSession._getName(),
                    content: '',
                    source: {},
                    target: "http://cst-dev.echoplatform.com/sample-data/polls/poll1",
                    verb: "post",
                    type: "http://activitystrea.ms/schema/1.0/comment"
                },
            };
        }


        console.log(data);

    });

    // https://apps.echoenabled.com/v2/esp/activity?content=%7B%22avatar%22%3A%22%22%2C%22content%22%3A%22test3%22%2C%22name%22%3A%22chad%22%2C%22source%22%3A%7B%7D%2C%22target%22%3A%22http%3A%2F%2Fcst-dev.echoplatform.com%2Fsample-data%2Fpolls%2Fpoll1%22%2C%22verb%22%3A%22post%22%2C%22type%22%3A%22http%3A%2F%2Factivitystrea.ms%2Fschema%2F1.0%2Fcomment%22%7D&appkey=echo.echo.streamserver.echo-cst-dev.prod&sessionID=https%3A%2F%2Fapi.echoenabled.com%2Fv1%2Fbus%2Fecho-cst-dev%2Fchannel%2F138758831953250149
    // appkey:echo.echo.streamserver.echo-cst-dev.prod
    // sessionID:https://api.echoenabled.com/v1/bus/echo-cst-dev/channel/138758831953250149

    // Backplane.getChannelID() ==> https://api.echoenabled.com/v1/bus/echo-cst-dev/channel/138758831953250149

var content = {
    "source":{},
    "target":"http://cst-dev.echoplatform.com/sample-data/polls/poll1",
    "verb":"post",
    "type":"http://activitystrea.ms/schema/1.0/comment"
}


});

})(Echo.jQuery);
