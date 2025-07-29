import VehicleMarker from './map/VehicleMarker.js';

// 初始化地圖
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  center: [121.5220610889968, 25.026993744917547],
  zoom: 18,
  maxZoom: 22,
  pitch: 60,
});

// 初始化載具標記
const vehicleMarker = new VehicleMarker();

// 地圖載入完
await new Promise(resolve => map.on('style.load', resolve));

// 添加載具標記
vehicleMarker
  .setLngLat([121.5220610889968, 25.026993744917547])
  .setRotation(45)
  .addTo(map);