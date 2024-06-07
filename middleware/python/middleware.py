import paho.mqtt.client as mqtt
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
import mysql.connector
import logging

# Setting up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MQTT config
mqtt_server = "192.168.18.63"
mqtt_port = 1883
topic_temperature = "wit/simulasi/temperature"
topic_RPM = "wit/simulasi/RPM"
topic_Heartbeat = "wit/simulasi/heartbeat"

# InfluxDB config
influxdb_url = "http://localhost:8086"
influxdb_token = "Kt6RQgjODJw4Dt8bCdes0iKEadx3E2G-xSySDQQfyQMu6AH8WW3wccf6j1DZt0mQk-2UGextsXdJJwm7of0e4A=="
influxdb_org = "WIT.SBY"
influxdb_bucket = "bucket@wit"

# MySQL config
mysql_host = "localhost"
mysql_user = "akbar@wit.com"
mysql_password = "akbarWIT2024"
mysql_database = "db@wit"

def save_to_influxdb(topic, value):
    try:
        client_influxdb = InfluxDBClient(url=influxdb_url, token=influxdb_token)
        write_api = client_influxdb.write_api(write_options=SYNCHRONOUS)
        
        point = Point(topic).field("value", value)
        write_api.write(influxdb_bucket, influxdb_org, point)
    except Exception as e:
        logger.error("Error saving to InfluxDB: %s", e)

def save_to_mysql(topic, value):
    try:
        conn = mysql.connector.connect(
            host=mysql_host,
            user=mysql_user,
            password=mysql_password,
            database=mysql_database
        )
        
        cursor = conn.cursor()

        # Menentukan nama tabel berdasarkan topik
        if topic == topic_temperature:
            mysql_table = "table_temperature"
        elif topic == topic_RPM:
            mysql_table = "table_rpm"
        elif topic == topic_Heartbeat:
            mysql_table = "table_heartbeat"
        else:
            # Jika topik tidak cocok dengan salah satu yang ditentukan, abaikan
            logger.warning("Topic not recognized, skipping...")
            return

        # Menyimpan data ke tabel yang sesuai
        sql = f"INSERT INTO {mysql_table} (topic, value) VALUES (%s, %s)"
        val = (topic, value)
        cursor.execute(sql, val)
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error("Error saving to MySQL: %s", e)

def on_message(client, userdata, message):
    logger.info("Received message on topic: %s", message.topic)
    logger.info("Message payload: %s", message.payload.decode())

    # Simpan data ke InfluxDB
    save_to_influxdb(message.topic, float(message.payload.decode()))

    # Simpan data ke MySQL
    save_to_mysql(message.topic, float(message.payload.decode()))

client_mqtt = mqtt.Client()
client_mqtt.on_message = on_message

client_mqtt.connect(mqtt_server, mqtt_port)

client_mqtt.subscribe([(topic_temperature, 0), (topic_RPM, 0), (topic_Heartbeat, 0)])

# Handler untuk menangani sinyal SIGINT dan SIGTERM
def handle_signal(signal, frame):
    logger.info("Exiting...")
    client_mqtt.disconnect()
    sys.exit(0)

# Menangani sinyal SIGINT dan SIGTERM
import signal, sys
signal.signal(signal.SIGINT, handle_signal)
signal.signal(signal.SIGTERM, handle_signal)

client_mqtt.loop_forever()