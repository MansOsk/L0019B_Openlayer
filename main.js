import './style.css';
import {Map, View} from 'ol';
import {Group as LayerGroup, Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import TileWMS from 'ol/source/TileWMS';
import Geolocation from 'ol/Geolocation';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import {OSM, Vector as VectorSource} from 'ol/source';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';

window.onload = init;

function init(){
  let view = new View({
    center: [0, 0],
    zoom: 2,
  });

  const map = new Map({
    target: 'map',
    layers: [
      new TileLayer({
        source: new OSM()
      }),
    ],
    view: view
  });
  
  var campusLayer = new TileLayer({
    source: new TileWMS({
    url: 'http://localhost:8080/geoserver/wms',
    params: { LAYERS: 'lulecampus' },
    visible: true,
    title: 'lulea campus',
  })
  })

  var roadLayer = new TileLayer({
    source: new TileWMS({
    url: 'http://localhost:8080/geoserver/wms',
    params: { LAYERS: 'lulecampus_line' },
    visible: true,
    title: 'luleacampus_line',
  })
  })

  console.log(roadLayer);
  
  const baseLayerGroup = new LayerGroup({
    layers: [campusLayer, roadLayer]
  })
  map.addLayer(baseLayerGroup);
  
  const baseLayerElements = document.querySelectorAll('.sidebar > input[type=checkbox]');
  for(let baseLayerElement of baseLayerElements){
    baseLayerElement.addEventListener('change', function(){
      let baseLayerElementValue = this.value;
      baseLayerGroup.getLayers().forEach(function(element){
        let key = element.values_.source.key_;
        if(key === baseLayerElementValue){
          element.setVisible(!element.getVisible());
          console.log('', element.getVisible());
        }
      })
    });
  }

  const geolocation = new Geolocation({
    trackingOptions: {
      enableHighAccuracy: true,
    },
    projection: view.getProjection(),
  });
  
  function el(id) {
    return document.getElementById(id);
  }
  
  el('track').addEventListener('change', function () {
    geolocation.setTracking(this.checked);
  });
  
  geolocation.on('change', function () {
    el('accuracy').innerText = geolocation.getAccuracy() + ' [m]';
    el('altitude').innerText = geolocation.getAltitude() + ' [m]';
    el('altitudeAccuracy').innerText = geolocation.getAltitudeAccuracy() + ' [m]';
    el('heading').innerText = geolocation.getHeading() + ' [rad]';
    el('speed').innerText = geolocation.getSpeed() + ' [m/s]';
  });
  
  geolocation.on('error', function (error) {
    const info = document.getElementById('info');
    info.innerHTML = error.message;
    info.style.display = '';
  });
  
  const accuracyFeature = new Feature();
  geolocation.on('change:accuracyGeometry', function () {
    accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
  });
  
  const positionFeature = new Feature();
  positionFeature.setStyle(
    new Style({
      image: new CircleStyle({
        radius: 6,
          color: '#3399CC',
        }),
        stroke: new Stroke({
          color: '#fff',
          width: 2,
        }),
      }),
    })
  );
  
  geolocation.on('change:position', function () {
    const coordinates = geolocation.getPosition();
    positionFeature.setGeometry(coordinates ? new Point(coordinates) : null);
  });
  
  new VectorLayer({
    map: map,
    source: new VectorSource({
      features: [accuracyFeature, positionFeature],
    }),
  });
  
}

