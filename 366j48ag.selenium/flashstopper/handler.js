"use strict;"

function registerHandlers(handlers, TRACE, isHandlingUserInput, setHandlingUserInput)
{     
    var dummyid = Math.floor(Math.random() * 100);

                                     // htmlmedia
    handlers.add(function handleHtmlMedia(aElement){
    
        const simEvents = {play: 0, playing: 50, pause: 350}, eventTypes = Object.keys(simEvents), props = ["preload","autoplay","setAttribute"];
        const window = aElement.ownerDocument.defaultView;
        if (aElement instanceof window.HTMLMediaElement)
        {
            aElement.id || (aElement.id = "dummyid" + (++dummyid % 100));
            TRACE('handleElement html5 media - tag: %S id: %S autoplay: %S preload: "%S" poster: %S paused: %S', aElement.localName, aElement.id, aElement.autoplay, aElement.preload, !!aElement.poster, aElement.paused);
                                                                                            // Yendifplayer  .autoplay = 1 => ...
            Object.defineProperties(aElement.wrappedJSObject, { preload: {configurable: true, set: (a) => TRACE('%S.preload = "%S"', aElement.id, a)/* || (aElement.preload = "metadata")*/, get: () => aElement.preload}
                , autoplay: {configurable: true, set: (a) => TRACE("%S.autoplay = %S", aElement.id, a) || (a && aElement.addEventListener("loadeddata", simPlay)), get: () => aElement.autoplay}});
            aElement.wrappedJSObject.setAttribute = (a, b) => (props.indexOf(a) != -1) ? TRACE("%S.setAttribute(%S, %S)", aElement.id, a, b) || (aElement.wrappedJSObject[a] = b): aElement.setAttribute(a, b);

            function simPlay(e) {
                e && aElement.removeEventListener(e.type, simPlay);
                if (aElement.paused)
                    eventTypes.forEach((key) => window.setTimeout(() => TRACE("aElement.%S", key) || aElement.dispatchEvent(new window.Event(key)), simEvents[key]));
            };
            var count = 0, autoplay = aElement.autoplay;
            aElement.autoplay && !aElement.addEventListener("loadeddata", simPlay);   // flowplayer            
            aElement.wrappedJSObject.play = (force = aElement.allowPlay) => {
                var userInput = isHandlingUserInput(window);
                TRACE("%S.play(%S) - force: %S state: %S user: %S", aElement.id, count, !!force, aElement.readyState, userInput);     
                if (!userInput && !force)
                   return count++ == 0 && (aElement.preload = "metadata") && !autoplay && (aElement.readyState >= 2 ? simPlay() : aElement.addEventListener("loadeddata", simPlay));
                delete aElement.wrappedJSObject.play;   // jwplayer: zapiks.fr rottentomatoes baeblemusic
                force && !userInput && setHandlingUserInput(window);                
                aElement.play();
            };
            aElement.autoplay = false;
            aElement.preload != "none" && (aElement.preload = "metadata");    // mediaelement.js
            !aElement.paused ? aElement.pause() : window.setTimeout(() => aElement.wrappedJSObject.hasOwnProperty("play") && aElement.pause(), 0);    // dbtv.no html5box                        
            aElement.addEventListener("play", function cleanup(e){ e.isTrusted && !aElement.paused && (aElement.removeEventListener("play", cleanup),
                TRACE("%S cleanup...", aElement.id), props.forEach((prop) => delete aElement.wrappedJSObject[prop]), delete aElement.wrappedJSObject.play)});    
        };
    });
                                     // YouTube
    handlers.add(function handleYouTube(aElement){

        const document = aElement.ownerDocument, window = document.defaultView, jsWin = window.wrappedJSObject;
        if (document.location.hostname.search("\.youtube(-nocookie)?\.com$") != -1)
        {
            TRACE("handleElement ytplayer - tag: %S player: %S", aElement.localName, aElement.id);
            if ( aElement.id.search("player") != -1 && document.location.search.indexOf("feature=youtube-anywhere-player") == -1)
            {
                function stopPlayer(ytplayer){
                    var vid = ytplayer.getVideoData && ytplayer.getVideoData().video_id;
                    TRACE("ytplayer stopPlayer(%S) - videoId: %S", ytplayer.id || "", vid);
                    !vid ? window.setTimeout(() => ytplayer.cueVideoById(vid = ytplayer.getVideoData().video_id, ytplayer.getCurrentTime())) :
                             ytplayer.cueVideoById(vid, ytplayer.getCurrentTime());
                    var nop = false, _seekTo = ytplayer.seekTo, _playVideo = ytplayer.playVideo;
                    ytplayer.playVideo = function doNothing() { nop ? _playVideo.apply(this) : TRACE("@@@@@@ ytplayer doNothing @@@@@")};
                    ytplayer.seekTo = function seekTo(tm) { nop ? _seekTo.apply(this, arguments) : ytplayer.cueVideoById(vid, tm), TRACE("ytplayer seekTo(%S)", tm); };
                    window.setTimeout(function(){ nop = true; ytplayer.playVideo = _playVideo; ytplayer.seekTo = _seekTo; TRACE("ytplayer - removed doNothing"); }, 2500)
                }
                function player() { try{ var res = jsWin.yt.player.getPlayerByElement(aElement.parentNode)} catch(e){}; return res && res.isReady() ? res : null;}
                var _onYTPlayerReady = jsWin.onYouTubePlayerReady || function(){}
                if (aElement.localName == "div")
                    window.setTimeout(() => stopPlayer(player() || aElement.wrappedJSObject || aElement), 0);
                else
                    jsWin.onYouTubePlayerReady = (ytplayer) => (jsWin.onYouTubePlayerReady = _onYTPlayerReady)(ytplayer) || stopPlayer(aElement.wrappedJSObject || aElement)
            }
            if (aElement.localName == "video") aElement.allowPlay = true;
            return true;
        }
    });    
                                     // vimeo
    handlers.add(function handleVimeo(aElement){
    
        if (aElement.localName == "video" && aElement.ownerDocument.location.hostname.search("vimeo\.com$") != -1)
            return (TRACE("handleVimeo - id: %S", aElement.id), aElement.allowPlay = true);
    });    
                                 // nfl.com
    handlers.add(function handleNfl(aElement){

        const document = aElement.ownerDocument, window = document.defaultView, jsWin = window.wrappedJSObject;
        if (aElement.localName == "object" && (aElement.id || "").indexOf("yuiswfyui") != -1 && jsWin.Y && jsWin.Y.NFL)
        {
            TRACE("handleElement nflplayer - swf: %S ", aElement.id);
            var obj = aElement.wrappedJSObject;
            obj.loadContentId = function(vid, ap) {TRACE("obj(%S).loadContentId(%S, %S)", obj.id, vid, ap); delete obj.loadContentId; obj.loadContentId(vid, false);};
            window.setTimeout(function() { delete obj.loadContentId; TRACE("nflplayer - removed play listener"); }, 2500);
        }
    });
                                 // msn.com
    handlers.add(function handleMsn(aElement){

        const document = aElement.ownerDocument, window = document.defaultView, jsWin = window.wrappedJSObject;
        if (document.location.hostname.search(/\.msn\.com$/) != -1)
        {
            var obj = aElement.wrappedJSObject;
            if (aElement.className.indexOf("vxFlashPlayer") != -1 && aElement.localName == "embed"){
                obj.MsnVideoCallback = function(msg) { msg == "playVideo" ? delete obj.MsnVideoCallback : obj.__proto__.MsnVideoCallback.apply(obj, arguments)};
                var flashvars = (aElement.getAttribute("flashvars") || "").replace(/(&ap=)true/gi, "$1false")
                aElement.setAttribute("flashvars", flashvars);
                TRACE("handleElement msnplayer - tag: %S id: %S ", aElement.localName, aElement.id);
                return true;
            }
            if (aElement.localName == "video")
                document.querySelector("button.play.circle.mvp_btn").onclick = function(){ this.onclick = null; obj.play(true); };
        }
    });
                                  // BBC
    handlers.add(function handleBBC(aElement){

        const document = aElement.ownerDocument, window = document.defaultView, jsWin = window.wrappedJSObject;
        if (jsWin.embeddedMedia && jsWin.embeddedMedia.players)
            for (var player of jsWin.embeddedMedia.players || []) if (player._swf && player._swf.id == aElement.id) {
                TRACE("handleElement BBC - embeddedMedia.players id: %S autoplay: %S", player._swf.id, player._settings.autoplay);
                Object.defineProperty(player._settings, "autoplay", {get: () => false});
                player.setData = (info) => ( info.data && (info.data.autoPlayFirstItem = false), player.__proto__.setData.call(player, info));
                window.setTimeout(function(){ player._settings.autoplay = true; handlers.remove(window, handleBBC); }, 2500);
                return true;
            };
    });
                                  // metacafe
    handlers.add(function handleMetacafe(aElement){

        if (aElement.localName == "object" && (aElement.data || "").search(/s.mcstatic.com\/Flash\/.*\.swf/) != -1)
        {
            var param = aElement.querySelector("#" + aElement.id + ">param[name=flashvars]");
            param.value = param.value.replace(/&beacons=.*(?=&)/,"");
            var id = param.value.match(/itemID=([^&]*)(?=&)/)[1];
            var data = aElement.data;
            aElement.data = "http://www.metacafe.com/fplayer/" + id + "/.swf";
            function onClick(aEvent){
                aEvent.stopImmediatePropagation();
                aElement.removeEventListener(aEvent.type, onClick, true);
                aElement.data = data;
            }
            aElement.addEventListener("mouseup", onClick, true);
            TRACE("handleElement metacafe - data: %S", aElement.data);
            return true;
        }
    });
                                  // jwplayer
    handlers.add(function handleJWPlayer(aElement){  // return;

        const document = aElement.ownerDocument, window = document.defaultView, jsWin = window.wrappedJSObject;
        aElement.id ||  (aElement.id = "dummyid" + (++dummyid % 100));
        if (jsWin.jwplayer && !aElement.querySelector("[id='" + aElement.id + "']>param[name=flashvars]"))
        {
            function closest(node, selector) { while(node && !node.matches(selector)) node = node.parentElement; return node};
            var res, ar, player = jsWin.jwplayer(aElement).config ?
                jsWin.jwplayer(aElement) : (res = closest(aElement, ".jwplayer")) ? jsWin.jwplayer(res) : null;
            
            if (player && (player.config || (player.config = player.getConfig())) && player.config.autostart != false)
            {
                TRACE("handleElement jwplayer setup - id: %S autostart: %S", player.id, player.config.autostart);

                player.config.autoStart = player.config.autostart = false;
                (ar = player.config.aspectratio) && ar.indexOf("%") != -1 && (player.config.aspectratio = "100:" + ar.slice(0,-1));
                aElement.localName == "video" && window.setTimeout(() => aElement.src = "");
                player.setup(player.config);
            }
            if (player &&  aElement.localName == "video")
                window.setTimeout(() =>(res = player.getContainer().querySelector(".jw-display-icon-container") || player.getContainer().querySelector (".jwdisplay")) 
                   && (res.onmouseup = aElement.onmouseup = (e) => (aElement.onmouseup = null, aElement.allowPlay = true)));            

            TRACE("handleElement jwplayer - id: %S config: %S", (player && player.id), !!(player && player.config));
            return player && player.config;
        }
    });
                                 // flowplayer
    handlers.add(function handleFlowplayer(aElement){ //return;

        aElement.id ||  (aElement.id = "dummyid" + (++dummyid % 100));
        var param = aElement.querySelector("[id='" + aElement.id + "']>param[name=flashvars]")
        var config, flashvars = param ? param.value : aElement.getAttribute("flashvars");
        if (flashvars && flashvars.search(/^config={/) != -1)
            if ((config = JSON.parse(flashvars.slice(7).replace(/'/g,'"').replace(/("autoPlay":)true/g,"$1false"))) && (config.playlist || config.clip))
            {
                var playlist = (config.playlist = (config.playlist || [config.clip]));
                (typeof playlist[0] == 'string') && (playlist[0] = {url: playlist[0]});
                playlist[0].autoPlay = (typeof playlist[0].url == 'string' && playlist[0].url.search(/(.png|.jpg)/) != -1);
                (playlist[0].autoBuffering && (playlist[0].autoBuffering = false)) || (playlist[0].autoPlay && playlist[1] && (playlist[1].autoPlay = false));
                flashvars = "config=" + JSON.stringify(config);
                param ? param.value = flashvars : aElement.setAttribute("flashvars", flashvars);
                TRACE("handleElement flowplayer - id: %S flashvars: %S", aElement.id, flashvars);
                return true;
            }
    })
                                  // Ndn
    handlers.add(function handleNdn(aElement){ //return;

        const document = aElement.ownerDocument, window = document.defaultView, jsWin = window.wrappedJSObject;
        if (jsWin._nw2e && aElement.localName == "object" && (aElement.data || "").search(/launch.newsinc.com\/.*\.swf/) != -1)
        {
            var obj = aElement.wrappedJSObject;
            obj.playFile = function(a, b){
                TRACE("ndnplayer.playFile");
                delete obj.playFile;
                return obj.playFile(a, false);
            }
            TRACE("handleElement Ndn");
            return true;
        }
    });
                                   // bypass espn.com
    handlers.add(function handleEspn(aElement){
        if (aElement.ownerDocument.defaultView.wrappedJSObject.espn && (aElement.data || "").search(/^http:\/\/player.ooyala.com/) != -1)
            return !TRACE("handleElement espn");
    });
                                  // aol
    handlers.add(function handleAol(aElement){

        if (aElement.localName == "object" && (aElement.data || "").search(/cdn(-ssl)?.vidible.tv\/.*\.swf/) != -1)
        {
            aElement.id ||  (aElement.id = "dummyid" + (++dummyid % 100));
            var param = aElement.querySelector("[id='" + aElement.id + "']>param[name=flashvars]");
            if (param)
            {
               param.value = param.value.replace(/(initialization%22%3A%22)autoplay/, "$1click");
               aElement.wrappedJSObject.doPlay = function() { TRACE("doNothing - doPlay")};
               aElement.ownerDocument.defaultView.setTimeout(() => {delete aElement.wrappedJSObject.doPlay; TRACE("handleElement aol - removed doPlay")}, 5000);
               return !TRACE("handleElement aol - data: %S", aElement.data);
            }
        }
    });
                                   // general
    var colValues = {"true":"false", "1":"0", "yes":"no", "on":"off", "y":"n", "Y":"N"}
    function replace(match,p0,p1,p2) {
        var res = p0 + (!p1 && p2 && colValues[p2] ? colValues[p2] : !!p1);
        TRACE(">>> handleElement replace - match: %S p0: %S p1: %S p2: %S res: %S <<<", match, p0, p1, p2, res);
        return res;
    }
    function modifyParams(str) { return (str || "").replace(/((no)?auto_?(?:play|start|run)\w*(?:["']?\s?[=:]\s?["']?|%22%3A))(true|1|yes|y|on|null|)(?=\W|$)/gi, replace)};

    function handleGeneral(aElement){

        if (aElement.localName != "object" && aElement.localName != "embed")
            return;

        var data = modifyParams(aElement.getAttribute("data"));
        if (data != aElement.getAttribute("data") && data != "")
        {
            aElement.setAttribute("data", data);
            TRACE("handleElement - %S.data: %S", aElement.localName, data);
        }

        var flashvars = modifyParams(aElement.getAttribute("flashvars")); // cnn | (remove) neulion nhl embed
        if (aElement.localName == "embed" )
        {
            aElement.setAttribute("menu","true");

            if (flashvars == aElement.getAttribute("flashvars") || flashvars == "" )
            {
                flashvars += "&autoplay=false&autostart=false&autoPlay=0";      // youtube(autoplay) | ustream live
                aElement.setAttribute("play","false");							// basic flash
            }
            aElement.setAttribute("flashvars", flashvars);
            if (aElement.src)
            {
                var src = modifyParams(aElement.src);   // embed dailymotion
                aElement.src = src;
                TRACE("handleElement embed.src: %S", src);
            }
        }

        aElement.id ||  (aElement.id = "dummyid" + (++dummyid % 100));   // [id =''] works with numeric ids!!!
        var param = aElement.querySelector("[id='" + aElement.id + "']>param[name=flashvars], [id='" + aElement.id + "']>param[name=FlashVars], [id='" + aElement.id + "']>param[name=flashVars]");
        if (param)
        {
            flashvars = modifyParams(param.value); // ustream(autoplay=false) | bbc / metacafe.embed(no) / tv.com(vid)
            if (flashvars == param.value && (flashvars.search(/auto(_?play(vid)?|start|run)["']?\s?[=:]/i) == -1))  // no false already exists...
	            flashvars += "&autoplay=false&autostart=false&autoPlay=0&autoStart=0&_autoPlay=no&auto_start=off"; // justin.tv(autoPlay=0)|nba.com(autostart)|espn(!autoplay)|discovery(_autoPlay=no)|56.com(auto_start)
            param.value = flashvars;
            if (aElement.data) aElement.data = aElement.data;
        }
        (param = aElement.querySelector("[id='" + aElement.id + "']>param[name=play]")) && (param.value = false);
        TRACE("handleElement - id: %S %S.flashvars: %S", aElement.id, aElement.localName, flashvars);
    };

    handlers.add(handleGeneral);
};

