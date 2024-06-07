const mqtt = require("mqtt");
const { saveToInfluxDB } = require("./influxdbHandler");

// Konfigurasi koneksi ke broker MQTT
const mqttClient = mqtt.connect("https://localhost:1883");

const dataStore = {
  topic1: null,
  topic2: null,
  topic3: null,
};

mqttClient.on("connect", () => {
  console.log("Terhubung ke broker MQTT");

  // Berlangganan ke beberapa topik
  const topics = [
    "wit/simulasi/temperature",
    "wit/simulasi/RPM",
    "wit/simulasi/heartbeat",
  ];
  mqttClient.subscribe(topics, (err) => {
    if (!err) {
      console.log(`Berlangganan ke topik: ${topics.join(", ")}`);
    } else {
      console.error("Gagal berlangganan ke topik:", err);
    }
  });
});

mqttClient.on("message", (topic, message) => {
  console.log(`Menerima pesan dari ${topic}: ${message.toString()}`);
  // Simpan data ke dataStore
  if (topic === "wit/simulasi/temperature") {
    dataStore.topic1 = message.toString();
  } else if (topic === "wit/simulasi/RPM") {
    dataStore.topic2 = message.toString();
  } else if (topic === "wit/simulasi/heartbeat") {
    dataStore.topic3 = message.toString();
  }
  // Simpan data ke InfluxDB
  saveToInfluxDB(topic, message.toString());
});

module.exports = {
  mqttClient,
  dataStore,
};
