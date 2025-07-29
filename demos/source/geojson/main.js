// 初始化地圖
const map = new maplibregl.Map({
  container: 'map',
  style: './assets/map/style/example.json',
  center: [121.5225610889968, 25.026993744917547],
  zoom: 16,
  maxZoom: 22,
  minZoom: 14,
  pitch: 40,
});

// 地圖載入完
await new Promise(resolve => map.on('style.load', resolve));
