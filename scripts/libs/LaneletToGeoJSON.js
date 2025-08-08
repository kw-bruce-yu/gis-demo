import fs from 'fs';
import path from 'path';
import twd97tolatlng from 'twd97-to-latlng';
import { convex } from '@turf/convex';


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
  return tagSnippets.reduce((accumulator ,tagSnippet) => {
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
 * @class LaneletToGeoJSON
 * @description 將 Lanelet 的檔案格式轉換為 GeoJSON
 * @param {string} filePath 檔案路徑
 * @param {Array<number>} offset X, Y 偏移（須注意 Lanelet X, Y 方位）
 */
export class LaneletToGeoJSON {
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
    this.pointFeatures.features = convertSnippetsToFeatures(
      nodeSnippets,
      this._convertNodeToPoint.bind(this)
    );
    this.lineStringFeatures.features = convertSnippetsToFeatures(
      waySnippets,
      this._convertWayToLineString.bind(this)
    );
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
   * @memberof LaneletToGeoJSON
   * @method _convertNodeToPoint
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
    // 回傳 GeoJSON 格式
    return {
      id,
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      properties: {
        altitude: attributes.ele,
      },
    }
  }


  /**
   * @memberof LaneletToGeoJSON
   * @method _convertWayToLineString
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
    // 回傳 GeoJSON 格式
    return {
      id,
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates,
      },
      properties: attributes,
    }
  }


  /**
   * @memberof LaneletToGeoJSON
   * @method _convertRelationToPolygon
   * @private
   * @description 將 Relation 轉換為 GeoJSON 的 Polygon Feature
   * @param {string} relationSnippet relation 標籤片段
   * @returns {GeoJSON.Feature} GeoJSON 的 Polygon Feauter
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
    // 取得 LineString Feature
    const features = memberSnippets.map(memberSnippet => {
      const lineStringId = getSnippetAttribute(memberSnippet, 'ref');
      const feature = this.lineStringFeatures.features.find(({ id }) => id === lineStringId);
      return feature;
    });
    // 生成 Polygon 格式，只保留外圍座標點
    const { geometry } = convex({
      type: 'LineString',
      coordinates: features
        .filter(feature => feature)
        .map(feature => feature.geometry.coordinates)
        .flat(),
    });
    // 回傳 GeoJSON 格式
    return {
      id,
      type: 'Feature',
      geometry,
      properties: attributes,
    }
  }


  /**
   * @memberof LaneletToGeoJSON
   * @method exportFiles
   * @public
   * @description 輸出 GeoJSON 檔案
   * @param {Object} options
   * @param {string} [options.exportPath="./"] 檔案輸出位置
   * @param {string} [options.pointsFileName="points.geojson"] Points 的檔案名稱
   * @param {string} [options.lineStringsFileName="lineStrings.geojson"] LineStrings 的檔案名稱
   * @param {string} [options.polygonsFileName="polygons.geojson"] Polygons 的檔案名稱
   * @returns {null}
   */
  exportFiles(options = {}) {
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
    // 輸出檔案
    fs.writeFileSync(
      path.join(exportPath, pointsFileName),
      JSON.stringify(this.pointFeatures),
      { encoding: 'utf8' }
    );
    fs.writeFileSync(
      path.join(exportPath, lineStringsFileName),
      JSON.stringify(this.lineStringFeatures),
      { encoding: 'utf8' }
    );
    fs.writeFileSync(
      path.join(exportPath, polygonsFileName),
      JSON.stringify(this.polygonFeatures),
      { encoding: 'utf8' }
    );
  }
}
