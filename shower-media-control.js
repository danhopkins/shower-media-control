/**
 * @fileOverview
 * HTML5 media elements control plugin for shower.
 * - any slides containing media elements intercept 'next' events and play
 *   media sequentially, one per 'next' event
 * - all media elements reset played state on slide (re)activation, or slidemodeexit
 * - autoplay is supported with data-autoplay attributes (native autoplay attributes
 *   will obviously play all media on page/presentation load rather than slide activation)
 */
shower.modules.define('shower-media-control', [
    'util.extend'
], function (provide, extend) {

    var DEFAULT_MEDIA_SELECTORS = ['video', 'audio'];

    /**
     * @class
     * HTML5 media element control plugin for shower.
     * @name plugin.MediaControl
     * @param {Shower} shower
     * @param {Object} [options] Plugin options.
     * @param {String} [options.selectors = ['video','audio'] ]
     * @constructor
     */
    function MediaControl (shower, options) {
        options = options || {};

        // Construct a query selector for all the media elements we manage
        // (restricted to children of the slide class, so we ignore the live region)
        var mediaSelectors  = options.selectors || DEFAULT_MEDIA_SELECTORS;
        this._mediaSelector = '.slide > ' + mediaSelectors.join(', .slide > ');

        this._mediaQueue = [ ];
        this._shower = shower;
        this._setupListeners();
    }

    extend(MediaControl.prototype, /** @lends plugin.MediaControl.prototype */{

        destroy: function () {
            this._clearListeners();
            this._mediaQueue = null;
            this._shower = null;
        },

        _setupListeners: function () {
            var shower = this._shower;

            this._showerListeners = shower.events.group()
                .on('destroy', this.destroy, this);

            this._showerListeners = shower.events.group()
                .on('slidemodeexit', this._onSlideModeExit, this);

            this._playerListeners = shower.player.events.group()
                .on('activate', this._onSlideActivate, this);

            this._playerListeners = shower.player.events.group()
                .on('next', this._onNext, this);
        },

        _onSlideModeExit: function() {
            // When exiting back to list mode, ensure we stop any playing media
            var mediaNodes = document.body.querySelectorAll(this._mediaSelector);
            mediaNodes.forEach(function(media) {
                if (media.currentTime > 0) {
                    media.pause();
                    media.currentTime = 0;
                }
            });
        },

        _clearListeners: function () {
            this._showerListeners.offAll();
            this._playerListeners.offAll();
        },

        _onSlideActivate: function () {
            var shower     = this._shower;
            var slide      = shower.player.getCurrentSlide();
            var slideMode  = shower.container.isSlideMode();
            var mediaNodes = slide.layout.getElement().querySelectorAll(this._mediaSelector);

            if (slideMode) {
                if (mediaNodes.length > 0) {
                    for (var i=0; i < mediaNodes.length; i++) {
                        var media = mediaNodes.item(i);
                        media.currentTime = 0;  // always reset all media

                        if (typeof media.dataset.autoplay !== 'undefined') {
                            // autoplay. Note this follows typical HTML5 handling
                            // in that all autoplay media on a slide will be played
                            // at once rather than sequentially. That's all we
                            // currently need, but logical sequential playing
                            // should be added at some point.
                            media.play();
                        }
                        else {
                            // manual play. Add the media to a queue, each played
                            // sequentially on nextPage events
                            this._mediaQueue.push(media);
                        }
                    }
                }
                else {
                    // Explicitly reset the queue in case we're sliding in reverse
                    this._mediaQueue = [ ];
                }
            }
        },

        _onNext: function (e) {
            var slideMode = this._shower.container.isSlideMode();
            var hasUnplayedMedia = this._mediaQueue.length;

            if (slideMode && hasUnplayedMedia) {
                e.preventDefault();
                this._playNextMedia();
            }
        },

        _playNextMedia: function() {
            var media = this._mediaQueue.shift();
            media.play();
        }
    });

    provide(MediaControl);
});

shower.modules.require(['shower'], function (sh) {
    sh.plugins.add('shower-media-control');
});
