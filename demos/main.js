import VehicleMarker from './map/VehicleMarker.js';
import ThreeModel from './map/ThreeModel.js';

/**
 * --------------------------------------------------
 * 地圖初始化
 * --------------------------------------------------
 */
const map = new maplibregl.Map({
  container: 'map',
  style: './assets/map/style/map.json',
  center: [121.5223610889968, 25.026193744917547],
  bearing: 180,
  pitch: 60,
  zoom: 18,
  maxZoom: 22,
  minZoom: 17,
});

// 建立導航控制器
const navigationCtrl = new maplibregl.NavigationControl();

// 建立載具標記
const vehicleMarker = new VehicleMarker();

// 建立 Three.js 模型
const threeModel = new ThreeModel({
  url: './assets/models/car.fbx',
  type: 'fbx',
  coordinates: [121.5222615942642, 25.027008070806062],
  altitude: 0,
  rotate: { x: 90, y: 0, z: 0 },
  scale: 0.01,
});

// 地圖點擊
function mapOnClick(event) {
  const [feature] = map.queryRenderedFeatures(event.point);
  if (!feature || Object.keys(feature.properties).length === 0) return;

  // 圖資屬性
  const content = Object.entries(feature.properties)
    .map(([key, value]) =>
      `${key}: ${value}`
    )
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
 * --------------------------------------------------
 * 地圖載入完成
 * --------------------------------------------------
 */
await new Promise(resolve => map.on('style.load', resolve));

// 添加導航控制器
map.addControl(navigationCtrl, 'top-right');

// 添加載具標記
vehicleMarker
  .setLngLat([121.52246414041844, 25.026997523305297])
  .setRotation(155)
  .addTo(map);

// 添加 Three.js 模型圖層
map.addLayer(threeModel);

// 新增地圖點擊事件
map.on('click', mapOnClick);