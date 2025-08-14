# 更換圖資

1. 將 `phoenix.data/map` 中的 `.osm` 檔複製到專案中的 `phoenix-platform/scripts/resources` 資料夾。

2. 取得 `phoenix.data/map` 中 `.param.yaml` 檔裡的 X、Y 軸位移數值，並替換掉專案中 `phoenix-platform/scripts/transfer.js` 的參數。

``` js
const OFFSET_X = /* X 軸位移 */;
const OFFSET_Y = /* Y 軸位移 */;
```

**注意：** 須留意 `.param.yaml` 的 X、Y 軸方向。

3. 轉換為 GeoJSON，地圖將套用新的圖資：

``` bash
npm run transfer
```
