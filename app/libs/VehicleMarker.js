// 載具標記
export default function VehicleMarker() {
  // ICON 元素
  const iconElement = document.createElement('div');
  iconElement.style.width = '40px';
  iconElement.style.height = '40px';
  iconElement.style.backgroundColor = '#FFFFFF';
  iconElement.style.backgroundImage = 'url(./assets/images/car.svg)';
  iconElement.style.backgroundRepeat = 'no-repeat';
  iconElement.style.backgroundPosition = 'center center';
  iconElement.style.backgroundSize = '80%';
  iconElement.style.border = '2px solid #74C0FC';
  iconElement.style.borderRadius = '50%';

  // 圓形元素
  const circleElement = document.createElement('div');
  circleElement.style.width = '100px';
  circleElement.style.height = '100px';
  circleElement.style.backgroundColor = '#BAE6FD90';
  circleElement.style.borderRadius = '50%';

  // 箭頭元素
  const arrowElement = document.createElement('div');
  arrowElement.style.width = '0';
  arrowElement.style.height = '0';
  arrowElement.style.position = 'absolute';
  arrowElement.style.left = '50%';
  arrowElement.style.bottom = '110%';
  arrowElement.style.transform = 'translateX(-50%)';
  arrowElement.style.borderLeft = '10px solid transparent';
  arrowElement.style.borderRight = '10px solid transparent';
  arrowElement.style.borderBottom = '20px solid #bae6fd';

  // 位置元素
  const locationElement = document.createElement('div');
  locationElement.appendChild(arrowElement);
  locationElement.appendChild(circleElement);

  // 新增標記
  const marker = new maplibregl.Marker({
    element: iconElement,
  });

  // 新增區域
  const location = new maplibregl.Marker({
    element: locationElement,
    pitchAlignment: 'map',
    rotationAlignment: 'map',
  });

  // 設置經緯度
  this.setLngLat = (lngLat) => {
    location.setLngLat(lngLat);
    marker.setLngLat(lngLat);
    return this;
  }

  // 設置旋轉角
  this.setRotation = (rotation) => {
    location.setRotation(rotation);
    return this;
  }

  // 添加到地圖
  this.addTo = (map) => {
    location.addTo(map);
    marker.addTo(map);
    return this;
  }
}
