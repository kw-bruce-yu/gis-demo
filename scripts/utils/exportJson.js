import fs from 'fs';
import path from 'path';


/**
 * @function exportJson
 * @description 輸出檔案
 * @param {string} exportPath 檔案輸出位置
 * @param {string} fileName 檔案名稱
 * @param {object} content 檔案內容
 * @param {boolean} [formatted=false] 是否格式化，預設為 false
 * @returns {void}
 */
export function exportJson(exportPath, fileName, content, formatted = false) {
  fs.writeFileSync(
    path.join(exportPath, fileName),
    JSON.stringify(content , null, formatted ? 2 : null),
    { encoding: 'utf8' }
  );
}
