import VehicleMarker from './libs/VehicleMarker.js';


const MIN_ZOOM = 18;
const MAX_ZOOM = 22;
const BOUNDS = [
  121.32294558242126, 24.997544578880664,
  121.32500838513005, 24.99930641638292,
];


const { origin } = window.location;
const basePath = window.location.pathname.includes('gis-demo') ? '/gis-demo' : '';


// 地圖樣式（此為方便測試使用）
const styleJson = {
  "id": "map",
  "name": "Kingway Map",
  "version": 8,
  "glyphs": "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  "sources": {
    "points": {
      "type": "vector",
      "tiles": [
        origin + basePath + "/app/assets/map/source/points/{z}/{x}/{y}.pbf",
      ],
      "maxzoom": MAX_ZOOM,
      "minzoom": MIN_ZOOM,
      "bounds": BOUNDS
    },
    "lineStrings": {
      "type": "vector",
      "tiles": [
        origin + basePath + "/app/assets/map/source/line-strings/{z}/{x}/{y}.pbf",
      ],
      "maxzoom": MAX_ZOOM,
      "minzoom": MIN_ZOOM,
      "bounds": BOUNDS
    },
    "polygons": {
      "type": "vector",
      "tiles": [
        origin + basePath + "/app/assets/map/source/polygons/{z}/{x}/{y}.pbf",
      ],
      "maxzoom": MAX_ZOOM,
      "minzoom": MIN_ZOOM,
      "bounds": BOUNDS
    }
  },
  "layers": [
    {
      "id": "background",
      "type": "background",
      "paint": {
        "background-color": "#1e293b"
      }
    },
    {
      "id": "road",
      "type": "fill",
      "source": "polygons",
      "source-layer": "polygons",
      "paint": {
        "fill-color": "#94a3b8"
      }
    },
    {
      "id": "path",
      "type": "line",
      "source": "lineStrings",
      "source-layer": "lineStrings",
      "layout": {
        "line-join": "round",
        "line-cap": "round"
      },
      "paint": {
        "line-color": "#bae6fd",
        "line-opacity": 0.5,
        "line-width": 3
      }
    },
    {
      "id": "dots",
      "type": "circle",
      "source": "points",
      "source-layer": "points",
      "paint": {
        "circle-radius": 5,
        "circle-color": ["get", "color"]
      },
      "filter": ["!=", ["get", "color"], null]
    }
  ]
}


/**
 * **************************************************
 * 地圖初始化
 * **************************************************
 */
const map = new maplibregl.Map({
  container: 'map',
  style: styleJson,
  center: [121.32329283834372, 24.997923866592842],
  bearing: 0,
  pitch: 40,
  zoom: 20,
  maxZoom: MAX_ZOOM,
  minZoom: MIN_ZOOM,
  maxPitch: 60,
});

// 建立導航控制器
const navigationCtrl = new maplibregl.NavigationControl();

// 建立載具標記
const vehicleMarker = new VehicleMarker();

// 地圖點擊
function mapOnClick(event) {
  const [feature] = map.queryRenderedFeatures(event.point);
  if (!feature || Object.keys(feature.properties).length === 0) return;

  // 圖資資訊
  const featureInfo = {
    lng: event.lngLat.lng,
    lat: event.lngLat.lat,
    source: feature.source,
    ...feature.properties,
  }

  console.table(featureInfo);

  const content = Object.entries(featureInfo)
    .map(([key, value]) => `${key}: ${value}`)
    .join('<br>');

  // 顯示 popup
  new maplibregl.Popup({
    closeButton: true,
    closeOnClick: true,
  })
    .setLngLat(event.lngLat)
    .setHTML(content)
    .addTo(map);
}


/**
 * **************************************************
 * 地圖載入完成
 * **************************************************
 */
await new Promise(resolve => map.on('style.load', resolve));

// 添加導航控制器
map.addControl(navigationCtrl, 'top-right');

// 添加載具標記
vehicleMarker
  .setLngLat([121.32334935554434, 24.99788628972979])
  .setRotation(132)
  .addTo(map);

// 新增地圖點擊事件
map.on('click', mapOnClick);
