/**
 * @fileOverview
 * HTML5 media elements control plugin for shower.
 * - any slides containing media elements intercept 'next' events and play
 *   media sequentially, one per 'next' event
 * - all media elements reset played state on slide (re)activation
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
        var mediaSelectors  = options.selectors || DEFAULT_MEDIA_SELECTORS;
        this._mediaSelector = mediaSelectors.join();
        this._mediaElements = [ ];
        this._shower = shower;
        this._setupListeners();
    }

    extend(MediaControl.prototype, /** @lends plugin.MediaControl.prototype */{
        destroy: function () {
            this._clearListeners();
            this._mediaElements = null;
            this._shower = null;
        },

        _setupListeners: function () {
            var shower = this._shower;

            this._showerListeners = shower.events.group()
                .on('destroy', this.destroy, this);

            this._playerListeners = shower.player.events.group()
                .on('activate', this._onSlideActivate, this);

            this._playerListeners = shower.player.events.group()
                .on('next', this._onNext, this);
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
                        this._mediaElements.push(media);
                    }
                }
                else {
                    // reset explicitly in case we're sliding in reverse
                    this._mediaElements = [ ];
                }
            }
        },

        _onNext: function (e) {
            var slideMode = this._shower.container.isSlideMode();
            var hasUnplayedMedia = this._mediaElements.length;

            if (slideMode && hasUnplayedMedia) {
                e.preventDefault();
                this._playNextMedia();
            }
        },

        _playNextMedia: function() {
            var media = this._mediaElements.shift();
            media.play();
        }
    });

    provide(MediaControl);
});

shower.modules.require(['shower'], function (sh) {
    sh.plugins.add('shower-media-control');
});
