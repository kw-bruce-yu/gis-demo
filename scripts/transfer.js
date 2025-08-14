import { LaneletToGeojson } from './libs/LaneletToGeojson.js';
import { GeojsonToVectorTile } from './libs/GeojsonToVectorTile.js';


// ! 須注意 phoenix.data/map/map.param.yaml 的 X、Y 軸方向
const OFFSET_X = 282620.554469862079713;
const OFFSET_Y = 2765568.859902452211827;


const MIN_ZOOM = 18;
const MAX_ZOOM = 22;


/**
 * **************************************************
 * GeoJSON
 * **************************************************
 */


const geojson = new LaneletToGeojson({
  offset: [OFFSET_X, OFFSET_Y],
  filePath: './scripts/resources/lanelet2_map.osm',
});


geojson.exportGeoJSON({
  exportPath: './app/assets/map/source',
});


geojson.exportSchema({
  exportPath: './app/assets/map/source',
});


/**
 * **************************************************
 * Vector Tile
 * **************************************************
 */


const pointTiles = new GeojsonToVectorTile({
  geojsonData: geojson.pointFeatures,
  sourceLayerId: 'points',
  maxZoom: MAX_ZOOM,
  minZoom: MIN_ZOOM,
});


pointTiles.exportTiles({
  exportPath: './app/assets/map/source/points',
});


const lineStringTiles = new GeojsonToVectorTile({
  geojsonData: geojson.lineStringFeatures,
  sourceLayerId: 'lineStrings',
  maxZoom: MAX_ZOOM,
  minZoom: MIN_ZOOM,
});


lineStringTiles.exportTiles({
  exportPath: './app/assets/map/source/line-strings',
});


const polygonTiles = new GeojsonToVectorTile({
  geojsonData: geojson.polygonFeatures,
  sourceLayerId: 'polygons',
  maxZoom: MAX_ZOOM,
  minZoom: MIN_ZOOM,
});


polygonTiles.exportTiles({
  exportPath: './app/assets/map/source/polygons',
});
