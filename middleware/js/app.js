const express = require("express");
const { dataStore } = require("./mqttClient"); // Impor dataStore dari mqttClient.js
const { InfluxDB } = require("@influxdata/influxdb-client"); // Impor InfluxDB client
const influxdbAPI = require("./influxdbHandler"); // Impor router dari influxdbAPI.js

const app = express();
const port = 3001;

// Menggunakan router dari influxdbAPI.js untuk endpoint API InfluxDB
app.use(influxdbAPI.router);

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
