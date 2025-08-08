import { LaneletToGeoJSON } from './libs/LaneletToGeoJSON.js';

const geojsonTransfer = new LaneletToGeoJSON({
  offset: [
    282620.554469862079713,
    2765568.859902452211827,
  ],
  filePath: './scripts/resources/map.osm',
});

geojsonTransfer.exportFiles({
  exportPath: './demos/assets/map/source',
});
