import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

function degreeToRadian(degree) {
  return degree * Math.PI / 180;
}

export default function ThreeModel(options = {}) {
  const defaultOptions = {
    /**
     * 模型網址
     */
    url: undefined,
    /**
     * 模型類型
     */
    type: 'gltf',
    /**
     * 模型座標位置
     */
    coordinates: [0, 0],
    /**
     * 模型海拔高度
     */
    altitude: 0,
    /**
     * 模型旋轉角度
     */
    rotate: { x: 0, y: 0, z: 0 },
    /**
     * 模型縮放比例
     */
    scale: 1,
  }
  const {
    url,
    type,
    coordinates,
    altitude,
    rotate,
    scale,
  } = Object.assign(defaultOptions, options);

  const modelAsMercatorCoordinate = maplibregl.MercatorCoordinate.fromLngLat(
    coordinates,
    altitude,
  );

  const modelTransform = {
    translateX: modelAsMercatorCoordinate.x,
    translateY: modelAsMercatorCoordinate.y,
    translateZ: modelAsMercatorCoordinate.z,
    rotateX: degreeToRadian(rotate.x),
    rotateY: degreeToRadian(rotate.y),
    rotateZ: degreeToRadian(rotate.z),
    scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * scale,
  }

  // Three.js 模型圖層
  const threeModelLayer = {
    id: '3d-model',
    type: 'custom',
    renderingMode: '3d',
    onAdd(map, gl) {
      this.camera = new THREE.Camera();
      this.scene = new THREE.Scene();

      // 光源
      const directionalLight1 = new THREE.DirectionalLight(0xffffff, 15);
      directionalLight1.position.set(0, -70, 50).normalize();
      this.scene.add(directionalLight1);

      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 15);
      directionalLight2.position.set(0, 70, 50).normalize();
      this.scene.add(directionalLight2);

      // Model 載入器，載入 3D 模型
      if (type === 'gltf') {
        const loader = new GLTFLoader();
        loader.load(
          url,
          (gltf) => {
            this.scene.add(gltf.scene);
          }
        );
      } else if (type === 'fbx') {
        const loader = new FBXLoader();
        loader.load(
          url,
          (fbx) => {
            this.scene.add(fbx);
          }
        );
      }

      // 渲染於 maplibre 的地圖上
      this.renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true
      });

      this.map = map;
      this.renderer.autoClear = false;
    },
    render(gl, args) {
      const rotationX = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(1, 0, 0),
        modelTransform.rotateX,
      );
      const rotationY = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 1, 0),
        modelTransform.rotateY,
      );
      const rotationZ = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 0, 1),
        modelTransform.rotateZ,
      );

      const m = new THREE.Matrix4().fromArray(args.defaultProjectionData.mainMatrix);
      const l = new THREE.Matrix4()
        .makeTranslation(
          modelTransform.translateX,
          modelTransform.translateY,
          modelTransform.translateZ
        )
        .scale(
          new THREE.Vector3(
            modelTransform.scale,
            -modelTransform.scale,
            modelTransform.scale,
          )
        )
        .multiply(rotationX)
        .multiply(rotationY)
        .multiply(rotationZ);

      this.camera.projectionMatrix = m.multiply(l);
      this.renderer.resetState();
      this.renderer.render(this.scene, this.camera);
      this.map.triggerRepaint();
    }
  }

  return threeModelLayer;
}