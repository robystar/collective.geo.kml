/*global window, jQuery, document, OpenLayers*/

(function ($) {
    "use strict";


  $(function () {  
    Proj4js.defs["EPSG:3003"] = "+proj=tmerc +lat_0=0 +lon_0=9 +k=0.999600 +x_0=1500000 +y_0=0 +ellps=intl +units=m +no_defs +towgs84=-104.1,-49.1,-9.9,0.971,-2.917,0.714,-11.68";
    var epsg3003 = new OpenLayers.Projection('EPSG:3003');
    var $video = $("video").get(0);
    var player = new MediaElement($video, {
        // auto-select this language (instead of starting with "None")
        startLanguage:'it',
        // automatically translate into these languages
        translations:['it','es','ar','zh','ru'],
        // enable the dropdown list of languages
        translationSelector: true,

        success: function (mediaElement, domObject) { 
            var map, select, kmlLayer, player = mediaElement;
            var mercator = new OpenLayers.Projection("EPSG:900913");
            var geographic = new OpenLayers.Projection("EPSG:4326");

            $(window).bind('mapload', function (evt, widget) {
                map = widget.map,select;
                var styleMap = new OpenLayers.StyleMap({
                    'default': {
                        fill:false,
                        strokeOpacity: 0.4,
                        strokeWidth: 4,
                        pointRadius: 7,
                        cursor: "inherit"
                    },
                    'select': {
                        strokeColor: "#0000FF",
                        strokeOpacity: 0.4,
                        strokeWidth: 4,
                        pointRadius: 8,
                        cursor: "pointer"
                    },
                    'temporary': {
                        fill: true,
                        fillColor: "#FF0000",
                        pointRadius: 10,
                        cursor: "pointer"
                    }
                });

                var lookup = {
                  0: {fill:false, strokeColor: "yellow"},
                  1: {fill:true, fillColor: "#ff8000",strokeColor: "yellow"},
                  2: {fill:true, fillColor: "#0000ff",strokeColor: "yellow"}
                };

                styleMap.addUniqueValueRules("default", "state", lookup);
                var countf = 0;

                kmlLayer= map.getLayersByClass("OpenLayers.Layer.Vector")[0]
                kmlLayer.events.register("beforefeatureadded", this, function(e){
                    var ret;
                    e.feature.attributes['state']=0;
                    ret = countf % 4 == 1;
                    countf++;
                    return ret;
                })
               
                select = new OpenLayers.Control.SelectFeature(kmlLayer,{clickout: true});

                kmlLayer.styleMap = styleMap;

                select.onSelect = onFeatureSelect;
                select.onUnselect = onFeatureUnselect;

                var highlightCtrl = new OpenLayers.Control.SelectFeature(kmlLayer, {
                    hover: true,
                    highlightOnly: true,
                    renderIntent: "temporary"
                });


                map.addControl(highlightCtrl);
                map.addControl(select);
                select.activate();
                kmlLayer.redraw()


                mediaElement.addEventListener('timeupdate', function(e) {

                    if(!kmlLayer) return;
                    var point, s0, s1, t1, t0 = kmlLayer.features.length && kmlLayer.features[0].attributes.when;
                    if(!t0.getTime) return;
                    s0 = t0.getTime()/1000;
                    s1 = s0 + mediaElement.currentTime;
                    for (var i=0; i<kmlLayer.features.length;i++){
                        point = kmlLayer.features[i]
                        if (point.attributes.when.getTime()/1000 > s1) break
                    }
                    point = kmlLayer.features[i-1]
                    point.attributes.state=1
                    var geom = point.geometry.clone();

                    geom.transform(mercator, epsg3003);
                    document.getElementById('description').innerHTML = 'X: ' + geom.x.toFixed(1) + ' Y: ' + geom.y.toFixed(1) + ' Depth: ' + geom.z.toFixed(1)
                    kmlLayer.redraw()

                }, false);


                // add event listener
                mediaElement.addEventListener('seeked', function(e) {
                     
                    if(!kmlLayer) return;
                    var point, s0, s1, t1, t0 = kmlLayer.features.length && kmlLayer.features[0].attributes.when;
                    if(!t0.getTime) return;
                    s0 = t0.getTime()/1000;
                    s1 = s0 + mediaElement.currentTime;
                    for (var i=0; i<kmlLayer.features.length;i++){
                        point = kmlLayer.features[i]
                        if (point.attributes.when.getTime()/1000 <= s1)
                            point.attributes.state=1
                        else
                            point.attributes.state=0
                    }

                    kmlLayer.redraw()
                     
                }, false);


                function onPopupClose(evt) {
                    select.unselectAll();
                };

                function onFeatureSelect(feature, arg1, arg2) {
                    var geom = feature.geometry.clone();
                    geom.transform(mercator, geographic);
                    var point, s, t1, t0 = kmlLayer.features.length && kmlLayer.features[0].attributes.when;
                    if(!t0.getTime) return;
                    t1 = feature.attributes.when;
                    s = (t1.getTime() - t0.getTime())/1000;
                    player.setCurrentTime(s)
                    //var msg = "<h2>" + feature.attributes.name + "</h2>" + feature.attributes.description + " " + feature.attributes.when +  " " +  " Lng: " + geom.x + " Lat: " + geom.y;
                    var msg = "<h6>"  + feature.attributes.when +  "</h6>";
                    msg += "<p>Lng: " + geom.x.toFixed(6) + " Lat: " + geom.y.toFixed(6) + "</p>";
                    var geom3003 = feature.geometry.clone();
                    geom3003.transform(mercator, epsg3003);
                    msg += '<p>X: ' + geom3003.x.toFixed(1) + ' Y: ' + geom3003.y.toFixed(1) + '</p>';
                    msg += '<p>Depth: ' + geom.z.toFixed(1) + '</p>';
                    
                    var popup = new OpenLayers.Popup.FramedCloud(
                        "chicken",
                        feature.geometry.getBounds().getCenterLonLat(),
                        new OpenLayers.Size(150, 100),
                        msg,
                        null,
                        true,
                        onPopupClose
                    );
                    feature.popup = popup;
                    map.addPopup(popup);
                    

                };

                function onFeatureUnselect(feature, arg1, arg2) {
                    if (feature.popup) {
                        map.removePopup(feature.popup);
                        feature.popup.destroy();
                        delete feature.popup;
                    }
                };

                // call the play method
                //mediaElement.play();  

            });

        },
        // fires when a problem is detected
            
        error: function (e) { 
                console.log(e)
        }
    });
});


}(jQuery));