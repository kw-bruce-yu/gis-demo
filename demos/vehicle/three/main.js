import ThreeModel from './map/ThreeModel.js';

// 初始化地圖
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  center: [121.5220610889968, 25.026993744917547],
  zoom: 22,
  maxZoom: 22,
  pitch: 60,
  canvasContextAttributes: {
    antialias: true,
  },
});

// 建立 Three.js 模型
const threeModel = new ThreeModel({
  url: './assets/models/car.fbx',
  type: 'fbx',
  coordinates: [121.5220610889968, 25.026993744917547],
  altitude: 0,
  rotate: { x: 90, y: 0, z: 0 },
  scale: 0.01,
})

// 地圖載入完
await new Promise(resolve => map.on('style.load', resolve));

// 添加 Three.js 模型圖層
map.addLayer(threeModel);