const { InfluxDB, Point } = require("@influxdata/influxdb-client");
const express = require("express");
const router = express.Router();

const token =
  "-MO9VH8LgQubOSUvS_Kh6NjTMbUWCVBOFUq8WwwQltYTRpCaaA0RxUWh38xWI2Suk3MVwcgT-FdDzkaP4OjnSA==";
const url = "http://localhost:8086";
const org = "WIT.SBY";
const bucket = "bucket@wit";

const client = new InfluxDB({ url, token });
const writeClient = client.getWriteApi(org, bucket, "ms");

function saveToInfluxDB(topic, value) {
  const point = new Point("mqtt_data")
    .tag("topic", topic)
    .floatField("value", parseFloat(value));

  writeClient.writePoint(point);

  console.log(`Data saved to InfluxDB: ${topic}: ${value}`);
}

// Endpoint API untuk menampilkan data dari InfluxDB
router.get("/api/influxdb", async (req, res) => {
  try {
    const queryApi = client.getQueryApi(org);
    const query = `from(bucket:"${bucket}")
      |> range(start: -1h) // Sesuaikan rentang waktu sesuai kebutuhan Anda
      |> filter(fn: (r) => r._measurement == "mqtt_data")
      |> limit(n: 10) // Sesuaikan jumlah data yang ingin Anda ambil
      |> sort(columns: ["_time"], desc: true)`;

    const result = await queryApi.collectRows(query);

    res.json(result);
  } catch (error) {
    console.error("Error fetching data from InfluxDB:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = { saveToInfluxDB, router };
