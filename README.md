# Phoenix Platform

## 版本需求

建議使用 `nvm` 做為 Node.js 版本管理工具，本專案使用 Node.js `v20.19.4`。

## 安裝依賴

``` bash
npm install
```

## 開始開發

目前使用 Live Server 即可 Demo，未來會導入 Vite 等開發工具。

## 建立圖資

``` bash
npm run transfer
```

若要更換圖資，詳情請參考 [更換圖資](./scripts/resources/README.md)。

## 專案架構

``` bash
├── app/
│   ├── assets/         # 資源
│   │   ├── images/     # 圖片
│   │   ├── map/        # 地圖相關資源
│   │   │   ├── source/ # 地圖來源資料
│   │   │   └── style/  # 地圖樣式
│   │   └── models/     # 模型
│   ├── libs/           # 涵式庫
│   ├── index.html      # 主頁
│   └── main.js         # 主程式
└── scripts/
    ├── libs/       # 涵式庫
    ├── resources/  # 資源
    ├── utils/      # 工具涵式
    └── transfer.js # 將資源轉換成 GeoJSON（npm run transfer）
```