/*global window, jQuery, document, OpenLayers*/

(function ($) {
    "use strict";
    $(window).bind('mapload', function (evt, widget) {
        var map = widget.map,kml,select,player

        var styleMap = new OpenLayers.StyleMap({
                        'default': {
                            //fill: true,
                           
                            //fillOpacity: 0.1,
                            //hoverFillColor: "white",
                            //hoverFillOpacity: 0.1,
                            fillColor: "#ff00FF",
                            strokeColor: "yellow",
                            strokeOpacity: 0.4,
                            strokeWidth: 4,
                            pointRadius: 3,
                            //hoverPointRadius: 1,
                            //hoverPointUnit: "%",
                            //pointerEvents: "visiblePainted",
                            cursor: "inherit"
                        },
                        'select': {
                            //fillColor: "#ff00FF",
                            strokeColor: "#FF00FF",
                            strokeOpacity: 0.4,
                            strokeWidth: 4,
                            pointRadius: 4,
                            cursor: "pointer"
                        },
                        'temporary': {
                            fill: true,
                            fillColor: "#FF0000",
                            pointRadius: 6,
                            cursor: "pointer"
                        }
                    });


        var lookup = {
          0: {fillColor: "#ffffff",strokeColor: "yellow"},
          1: {fillColor: "#ff0000",strokeColor: "yellow"},
          2: {fillColor: "#ff00ff",strokeColor: "yellow"},
        }

        styleMap.addUniqueValueRules("default", "state", lookup);
        var countf = 0;

        map.events.register("preaddlayer", this, function(e){
            if(e.layer.protocol && e.layer.protocol.url && e.layer.protocol.url.indexOf('@@kml-document')>0){
                kml = e.layer;

                kml.events.register("beforefeatureadded", this, function(e){
                    var ret;
                    e.feature.attributes['state']=0;
                    ret = countf % 10 == 1;
                    countf++
                    return ret;
                })

                select = new OpenLayers.Control.SelectFeature(kml,{clickout: true});

                kml.styleMap = styleMap;

                select.onSelect = onFeatureSelect;
                select.onUnselect = onFeatureUnselect;

                var highlightCtrl = new OpenLayers.Control.SelectFeature(kml, {
                    hover: true,
                    highlightOnly: true,
                    renderIntent: "temporary"
                });


                map.addControl(highlightCtrl);
                map.addControl(select);
                select.activate();

            }
  
        });


        function onPopupClose(evt) {
            select.unselectAll();
        }

        function onFeatureSelect(feature, arg1, arg2) {
            var popup = new OpenLayers.Popup.FramedCloud(
                "chicken",
                feature.geometry.getBounds().getCenterLonLat(),
                new OpenLayers.Size(200, 200),
                "<h2>" + feature.attributes.name + "</h2>" + feature.attributes.description,
                null,
                true,
                onPopupClose
            );
            feature.popup = popup;
            map.addPopup(popup);

            var point, t1, t0 = kml.features.length && kml.features[0].attributes.when;
            if(!t0.getTime) return;
            t1 = e.attributes.when;
            s = (t1.getTime() - t0.getTime())/1000;
            player.setCurrentTime(s)

        }

        function onFeatureUnselect(feature, arg1, arg2) {
            if (feature.popup) {
                map.removePopup(feature.popup);
                feature.popup.destroy();
                delete feature.popup;
            }
        }


        $('audio,video').mediaelementplayer({
            // auto-select this language (instead of starting with "None")
            startLanguage:'en',
            // automatically translate into these languages
            translations:['es','ar','zh','ru'],
            // enable the dropdown list of languages
            translationSelector: true,

            success: function (mediaElement, domObject) { 
                // add event listener
                player = mediaElement;

                console.log(player)

                return;


                mediaElement.addEventListener('timeupdate', function(e) {
                    var point, t1, t0 = trackLayer.features.length && trackLayer.features[0].attributes.when;
                    if(!t0.getTime) return;
                    s0 = t0.getTime()/1000;
                    s1 = s0 + mediaElement.currentTime;
                    for (var i=0; i<trackLayer.features.length;i++){
                        point = trackLayer.features[i]
                        if (point.attributes.when.getTime()/1000 > s1) break
                    }
                    point = trackLayer.features[i-1]
                    point.attributes.state=1
                    var geom = point.geometry.clone();
                    geom.transform(mercator, geographic);
                    document.getElementById('current-time').innerHTML = mediaElement.currentTime + ' Lng: ' + geom.x + ' Lat: ' + geom.y;
                    trackLayer.redraw()

                }, false);


                                    // add event listener
                mediaElement.addEventListener('seeked', function(e) {
                     
                    console.log(mediaElement.currentTime)

                    var point, t1, t0 = trackLayer.features.length && trackLayer.features[0].attributes.when;
                    if(!t0.getTime) return;
                    s0 = t0.getTime()/1000;
                    s1 = s0 + mediaElement.currentTime;
                    for (var i=0; i<trackLayer.features.length;i++){
                        point = trackLayer.features[i]
                        if (point.attributes.when.getTime()/1000 <= s1)
                            point.attributes.state=1
                        else
                            point.attributes.state=0
                    }

                    trackLayer.redraw()
                     
                }, false);


                 
                // call the play method
                mediaElement.play();
                 
            },
            // fires when a problem is detected
            error: function () { 
             
            }



        })













    });
}(jQuery));
