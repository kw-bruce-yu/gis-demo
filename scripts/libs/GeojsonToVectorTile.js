import fs from 'fs';
import path from 'path';
import { bbox as turfBbox } from '@turf/bbox';
import geojsonvt from 'geojson-vt';
import vtpbf from 'vt-pbf';
import { exportJson } from '../utils/exportJson.js';
import { rebuildDirectory } from '../utils/rebuildDirectory.js';


/**
 * @function lngLatToTileCoords
 * @description 將經緯度轉換為圖磚座標
 * @param {number} lng 經度
 * @param {number} lat 緯度
 * @param {number} zoom 縮放級距
 * @returns {Object} Tag 標籤所有屬性
 */
function lngLatToTileCoords(lng, lat, zoom) {
  const latRadius = lat * Math.PI / 180;
  const n = Math.pow(2, zoom);
  const x = Math.floor(n * ((lng + 180) / 360));
  const y = Math.floor(n * (1 - (Math.log(Math.tan(latRadius) + 1 / Math.cos(latRadius)) / Math.PI)) / 2);
  return { x, y };
}


/**
 * @class GeojsonToVectorTile
 * @description 將 GeoJSON 轉換為 Vector Tile
 * @param {Object} options
 * @param {Object} options.geojsonData GeoJSON 資料
 * @param {string} options.sourceLayerId 圖層 ID
 * @param {number} [options.maxZoom=22] 最大縮放級距
 * @param {number} [options.minZoom=18] 最小縮放級距
 */
export class GeojsonToVectorTile {


  constructor(options = {}) {
    const defaultOptions = {
      geojsonData: undefined,
      sourceLayerId: undefined,
      maxZoom: 22,
      minZoom: 18,
    }
    const {
      geojsonData,
      sourceLayerId,
      maxZoom,
      minZoom,
    } = Object.assign(defaultOptions, options);

    this._sourceLayerId = sourceLayerId;
    this._maxZoom = maxZoom;
    this._minZoom = minZoom;

    // 取得經緯度邊界
    this._bbox = turfBbox(geojsonData);

    // 建立 GeoJSON 向量圖磚
    this._tiles = geojsonvt(geojsonData, {
      indexMaxZoom: minZoom,
      maxZoom,
      buffer: 64,
    });
  }


  /**
   * 圖層 ID
   */
  _sourceLayerId;
  /**
   * 最大縮放級距
   */
  _maxZoom;
  /**
   * 最小縮放級距
   */
  _minZoom;
  /**
   * 經緯度邊界
   */
  _bbox;
  /**
   * GeoJSON 向量圖磚
   */
  _tiles;


  /**
   * @method _exportTile
   * @memberof GeojsonToVectorTile
   * @private
   * @description 將圖磚轉換為 pbf 格式並輸出
   * @param {number} x 圖磚 X 座標
   * @param {number} y 圖磚 Y 座標
   * @param {number} z 圖磚 Z 座標
   * @param {string} exportPath 輸出路徑
   * @returns {void}
   */
  _exportTile(x, y, z, exportPath) {
    const tile = this._tiles.getTile(z, x, y);

    if (tile && tile.features.length > 0) {
      // 轉換為 pbf
      const buffer = vtpbf.fromGeojsonVt({
        [this._sourceLayerId]: tile,
      });

      // 輸出 pbf 圖磚
      const zDir = path.join(exportPath, z.toString());
      const xDir = path.join(zDir, x.toString());
      fs.mkdirSync(xDir, { recursive: true });
      fs.writeFileSync(path.join(xDir, `${y}.pbf`), buffer);
    }
  }


  /**
   * @method _exportInfo
   * @memberof GeojsonToVectorTile
   * @private
   * @description 輸出圖磚資訊
   * @param {string} exportPath 輸出路徑
   * @returns {void}
   */
  _exportInfo(exportPath) {
    const info = {
      minZoom: this._minZoom,
      maxZoom: this._maxZoom,
      bounds: this._bbox,
      'source-layer': this._sourceLayerId,
    }
    exportJson(exportPath, 'info.json', info, true);
  }


  /**
   * @method exportTiles
   * @memberof GeojsonToVectorTile
   * @public
   * @description 輸出圖磚
   * @param {Object} options
   * @param {string} [options.exportPath="tiles"] 輸出路徑
   * @returns {void}
   */
  exportTiles(options = {}) {
    const defaultOptions = {
      exportPath: 'tiles',
    }
    const {
      exportPath,
    } = Object.assign(defaultOptions, options);

    // 清除並重建輸出資料夾
    rebuildDirectory(exportPath);

    // 取得經緯度邊界
    const [minLng, minLat, maxLng, maxLat] = this._bbox;

    // 依 X、Y、Z 遍歷圖磚
    for (let z = this._minZoom; z <= this._maxZoom; z++) {
      // 取得 X、Y 邊界
      const { x: minX, y: maxY } = lngLatToTileCoords(minLng, minLat, z);
      const { x: maxX, y: minY } = lngLatToTileCoords(maxLng, maxLat, z);

      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          this._exportTile(x, y, z, exportPath);
        }
      }
    }

    // 輸出 info.json
    this._exportInfo(exportPath);
    console.log(`[SUCCESS]: ${this._sourceLayerId} tiles exported.`);
  }


}
