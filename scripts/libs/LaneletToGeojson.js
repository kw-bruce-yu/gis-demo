import fs from 'fs';
import twd97tolatlng from 'twd97-to-latlng';
import { exportJson } from '../utils/exportJson.js';
import { rebuildDirectory } from '../utils/rebuildDirectory.js';


/**
 * @function distance
 * @description 計算兩點距離
 * @param {Array<number>} coordA 座標點 A
 * @param {Array<number>} coordB 座標點 B
 * @returns {number} 距離
 * ? 目前因效能考量，不將經緯度轉成實際距離
 */
function distance(coordA, coordB) {
  return Math.sqrt(
    Math.pow(coordA[0] - coordB[0], 2) +
    Math.pow(coordA[1] - coordB[1], 2)
  );
}


/**
 * @function recordSchema
 * @description 記錄 schema
 * @param {object} schema schema
 * @param {object} attributes 屬性
 * @returns {void}
 */
function recordSchema(schema, attributes) {
  Object.entries(attributes).forEach(([key, value]) => {
    if (!schema[key]) {
      schema[key] = new Set();
    }
    schema[key].add(value);
  });
}


/**
 * @function getSnippetsByTagName
 * @description 使用標籤名稱去從文本中，取得符合的節點片段
 * @param {string} content 文本
 * @param {string} tagName 標籤名稱
 * @returns {Array<string>} 節點片段陣列
 */
function getSnippetsByTagName(content, tagName) {
  // 1. <tag ... > ... </tag>
  // 2. <tag ... />
  const regex = new RegExp(`<${tagName}([^>]*)>(.*?)<\\/${tagName}>|<${tagName}([^>]*)\/>`, 'gs')
  const matches = content.matchAll(regex);
  const snippets = [...matches].map(match => match[0]);
  return snippets;
}


/**
 * @function getSnippetAttributes
 * @description 取得該標籤片段中的指定屬性
 * @param {string} snippet 標籤片段
 * @param {string} attributeName 屬性名稱
 * @returns {string} 該屬性的值
 */
function getSnippetAttribute(snippet, attributeName) {
  const regex = new RegExp(`${attributeName}=\"(.*?)\"`);
  const match = snippet.match(regex);
  if (match) {
    return match[1];
  }
  return null;
}


/**
 * @function getTagSnippetsAttributes
 * @description 取得 Tag 標籤片段中的所有屬性
 * @param {string} snippet Tag 標籤片段
 * @returns {Object} Tag 標籤所有屬性
 */
function getTagSnippetsAttributes(tagSnippets) {
  return tagSnippets.reduce((accumulator, tagSnippet) => {
    const key = getSnippetAttribute(tagSnippet, 'k');
    const value = getSnippetAttribute(tagSnippet, 'v');
    accumulator[key] = value;
    return accumulator;
  }, {});
}


/**
 * @function getTagSnippetsAttributes
 * @description 取得 Tag 標籤片段中的所有屬性
 * @param {string} snippet Tag 標籤片段
 * @returns {Object} Tag 標籤所有屬性
 */
function convertSnippetsToFeatures(snippets, convertCallback) {
  return snippets
    .map(convertCallback)
    .filter(feature => feature);
}


/**
 * @class LaneletToGeojson
 * @description 將 Lanelet 的檔案格式轉換為 GeoJSON
 * @param {Object} options
 * @param {string} options.filePath 檔案路徑
 * @param {Array<number>} options.offset X, Y 偏移（須注意 Lanelet X, Y 方位）
 */
export class LaneletToGeojson {


  constructor(options = {}) {
    const defaultOptions = {
      filePath: undefined,
      offset: [0, 0],
    }
    const {
      filePath,
      offset,
    } = Object.assign(defaultOptions, options);

    // 取得檔案文字內容
    const osmContent = fs.readFileSync(filePath, { encoding: 'utf8' });
    // 設定偏移量
    this._offset = offset;

    // 擷取 node、way、relation 標籤片段
    const nodeSnippets = getSnippetsByTagName(osmContent, 'node');
    const waySnippets = getSnippetsByTagName(osmContent, 'way');
    const relationSnippets = getSnippetsByTagName(osmContent, 'relation');

    // 將 Snippets 轉換為 Features
    console.log('[INFO]: Convert Point features...');
    this.pointFeatures.features = convertSnippetsToFeatures(
      nodeSnippets,
      this._convertNodeToPoint.bind(this)
    );
    console.log('[INFO]: Convert LineString features...');
    this.lineStringFeatures.features = convertSnippetsToFeatures(
      waySnippets,
      this._convertWayToLineString.bind(this)
    );
    console.log('[INFO]: Convert Polygon features...');
    this.polygonFeatures.features = convertSnippetsToFeatures(
      relationSnippets,
      this._convertRelationToPolygon.bind(this)
    );
  }


  /**
   * X, Y 偏移
   */
  _offset = [0, 0];
  /**
   * 資料格式
   */
  schema = {
    PointFeature: {},
    LineStringFeature: {},
    PolygonFeature: {},
  }
  /**
   * Point
   */
  pointFeatures = {
    type: 'FeatureCollection',
    features: [],
  }
  /**
   * LineString
   */
  lineStringFeatures = {
    type: 'FeatureCollection',
    features: [],
  }
  /**
   * Polygon
   */
  polygonFeatures = {
    type: 'FeatureCollection',
    features: [],
  }


  /**
   * @method _convertNodeToPoint
   * @memberof LaneletToGeojson
   * @private
   * @description 將 Node 轉換為 GeoJSON 的 Point Feature
   * @param {string} nodeSnippet node 標籤片段
   * @returns {GeoJSON.Feature} GeoJSON 的 Point Feauter
   */
  _convertNodeToPoint(nodeSnippet) {
    // 取得 ID
    const id = getSnippetAttribute(nodeSnippet, 'id');
    // 所有 <tag /> 片段
    const tagSnippets = getSnippetsByTagName(nodeSnippet, 'tag');
    // 所有屬性
    const attributes = getTagSnippetsAttributes(tagSnippets);

    // Twd97 轉換為 LngLat
    const { lng, lat } = twd97tolatlng(
      this._offset[0] + Number(attributes.local_x),
      this._offset[1] + Number(attributes.local_y),
    );

    // 紀錄 schema
    recordSchema(this.schema.PointFeature, attributes);

    // 回傳 GeoJSON 格式
    return {
      id,
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      properties: {
        id,
        ...attributes,
        ele: Number(attributes.ele),
      }
    }
  }


  /**
   * @method _convertWayToLineString
   * @memberof LaneletToGeojson
   * @private
   * @description 將 Way 轉換為 GeoJSON 的 LineString Feature
   * @param {string} waySnippet way 標籤片段
   * @returns {GeoJSON.Feature} GeoJSON 的 LineString Feauter
   */
  _convertWayToLineString(waySnippet) {
    // 取得 ID
    const id = getSnippetAttribute(waySnippet, 'id');
    // 所有 <tag /> 片段
    const tagSnippets = getSnippetsByTagName(waySnippet, 'tag');
    // 取得所有屬性
    const attributes = getTagSnippetsAttributes(tagSnippets);
    // 所有 <nd /> 片段
    const ndSnippets = getSnippetsByTagName(waySnippet, 'nd');

    // 取得所有座標點
    const coordinates = ndSnippets.map(ndSnippet => {
      const pointId = getSnippetAttribute(ndSnippet, 'ref');
      const feature = this.pointFeatures.features.find(({ id }) => id === pointId);
      return feature.geometry.coordinates;
    });

    // 紀錄 schema
    recordSchema(this.schema.LineStringFeature, attributes);

    // 回傳 GeoJSON 格式
    return {
      id,
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates,
      },
      properties: {
        id,
        ...attributes,
      },
    }
  }


  /**
   * @method _convertRelationToPolygon
   * @memberof LaneletToGeojson
   * @private
   * @description 將 Relation 轉換為 GeoJSON 的 Polygon Feature
   * @param {string} relationSnippet relation 標籤片段
   * @returns {GeoJSON.Feature} GeoJSON 的 Polygon Feauter
   * TODO 優化：取得 <tag /> 即判斷是否須處理
   */
  _convertRelationToPolygon(relationSnippet) {
    // 取得 ID
    const id = getSnippetAttribute(relationSnippet, 'id');
    // 所有 <tag /> 片段
    const tagSnippets = getSnippetsByTagName(relationSnippet, 'tag');
    // 取得所有屬性
    const attributes = getTagSnippetsAttributes(tagSnippets);
    // 所有 <member /> 片段
    const memberSnippets = getSnippetsByTagName(relationSnippet, 'member');

    // 取得 左側線、右側線、中心線
    const {
      left: leftLine,
      right: rightLine,
      centerline: centerLine,
    } = memberSnippets.reduce((accumulator, memberSnippet) => {
      const lineStringId = getSnippetAttribute(memberSnippet, 'ref');
      const role = getSnippetAttribute(memberSnippet, 'role');
      const feature = this.lineStringFeatures.features.find(({ id }) => id === lineStringId);
      if (accumulator[role]) {
        accumulator[role] = feature.geometry.coordinates;
      }
      return accumulator;
    }, {
      left: [],
      right: [],
      centerline: [],
    });

    // 資料不齊
    if (!centerLine.length || !leftLine.length || !rightLine.length) {
      return null;
    }

    let coordinates = [];

    // 中心線起點，與左側線「起點」相近
    if (distance(centerLine.at(0), leftLine.at(0)) < distance(centerLine.at(0), leftLine.at(-1))) {
      coordinates = coordinates.concat(leftLine);
    }
    // 中心線起點，與左側線「終點」相近
    else {
      coordinates = coordinates.concat(leftLine.reverse());
    }

    // 中心線起點，與右側線「起點」相近
    if (distance(centerLine.at(0), rightLine.at(0)) < distance(centerLine.at(0), rightLine.at(-1))) {
      coordinates = coordinates.concat(rightLine.reverse());
    }
    // 中心線起點，與右側線「終點」相近
    else {
      coordinates = coordinates.concat(rightLine);
    }

    // 閉合 Polygon
    coordinates.push(coordinates.at(0));

    // 紀錄 schema
    recordSchema(this.schema.PolygonFeature, attributes);

    // 回傳 GeoJSON 格式
    return {
      id,
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates],
      },
      properties: {
        id,
        ...attributes,
      },
    }
  }


  /**
   * @method exportGeoJSON
   * @memberof LaneletToGeojson
   * @public
   * @description 輸出 GeoJSON 檔案
   * @param {Object} options
   * @param {string} [options.exportPath="./"] 檔案輸出位置
   * @param {string} [options.pointsFileName="points.geojson"] Points 的檔案名稱
   * @param {string} [options.lineStringsFileName="lineStrings.geojson"] LineStrings 的檔案名稱
   * @param {string} [options.polygonsFileName="polygons.geojson"] Polygons 的檔案名稱
   * @returns {void}
   */
  exportGeoJSON(options = {}) {
    const defaultOptions = {
      exportPath: './',
      pointsFileName: 'points.geojson',
      lineStringsFileName: 'lineStrings.geojson',
      polygonsFileName: 'polygons.geojson',
    }
    const {
      exportPath,
      pointsFileName,
      lineStringsFileName,
      polygonsFileName,
    } = Object.assign(defaultOptions, options);

    // 清除並重建輸出資料夾
    rebuildDirectory(exportPath);

    // 輸出檔案
    exportJson(exportPath, pointsFileName, this.pointFeatures);
    exportJson(exportPath, lineStringsFileName, this.lineStringFeatures);
    exportJson(exportPath, polygonsFileName, this.polygonFeatures);
    console.log('[SUCCESS]: GeoJSON exported.');
  }


  /**
   * @method exportSchema
   * @memberof LaneletToGeojson
   * @public
   * @description 輸出 Schema 檔案
   * @param {Object} options
   * @param {string} [options.exportPath="./"] 檔案輸出位置
   * @param {string} [options.schemaFileName="schema.json"] 檔案名稱
   * @param {number} [options.arrayLimit=20] Array 限制
   * @returns {void}
   */
  exportSchema(options = {}) {
    const defaultOptions = {
      exportPath: './',
      schemaFileName: 'schema.json',
      arrayLimit: 20,
    }
    const {
      exportPath,
      schemaFileName,
      arrayLimit,
    } = Object.assign(defaultOptions, options);

    // 轉換 schema 格式
    Object.values(this.schema).forEach(featureSchema => {
      Object.entries(featureSchema).forEach(([key, value]) => {
        featureSchema[key] = value.size > arrayLimit
          ? 'Array<any>'
          : [...value];
      });
    });

    // 輸出檔案
    exportJson(exportPath, schemaFileName, this.schema, true);
    console.log('[SUCCESS]: Schema exported.');
  }


}
