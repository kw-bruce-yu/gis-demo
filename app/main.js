import VehicleMarker from './libs/VehicleMarker.js';


/**
 * --------------------------------------------------
 * 地圖初始化
 * --------------------------------------------------
 */
const map = new maplibregl.Map({
  container: 'map',
  style: './assets/map/style/map.json',
  center: [121.32329283834372, 24.997923866592842],
  bearing: 0,
  pitch: 40,
  zoom: 20,
  maxZoom: 24,
  minZoom: 18,
});

// 建立導航控制器
const navigationCtrl = new maplibregl.NavigationControl();

// 建立載具標記
const vehicleMarker = new VehicleMarker();

// 地圖點擊
function mapOnClick(event) {
  const [feature] = map.queryRenderedFeatures(event.point);
  if (!feature || Object.keys(feature.properties).length === 0) return;

  // 圖資屬性
  const propertiesArray = Object.entries(feature.properties)
    .map(([key, value]) => `${key}: ${value}`);
  const combinedArray = [
    `lng: ${event.lngLat.lng}`,
    `lat: ${event.lngLat.lat}`,
    `source: ${feature.source}`,
    `id: ${feature.id}`
  ].concat(propertiesArray);

  const content = combinedArray.join('<br>');

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
  .setLngLat([121.32329283834372, 24.997923866592842])
  .setRotation(132)
  .addTo(map);

// 新增地圖點擊事件
map.on('click', mapOnClick);
