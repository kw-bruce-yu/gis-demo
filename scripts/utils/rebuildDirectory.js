import fs from 'fs';


/**
 * @method rebuildDirectory
 * @description 重新建立資料夾
 * @param {string} directory 資料夾
 * @returns {void}
 */
export function rebuildDirectory(directory) {
  if (fs.existsSync(directory)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
  fs.mkdirSync(directory, { recursive: true });
}
