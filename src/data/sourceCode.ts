export interface SourceFile {
  id: string;
  name: string;
  category: 'FIRMWARE' | 'PERCEPTION' | 'COORDINATOR' | 'BRIDGE';
  language: 'cpp' | 'python' | 'json';
  description: string;
  code: string;
}

export const SWARM_SOURCE_FILES: SourceFile[] = [
  {
    id: 'config-h',
    name: 'Config.h',
    category: 'FIRMWARE',
    language: 'cpp',
    description: 'Central configuration header defining frozen motor GPIOs, I2C addresses, PCA9685 servo channels, and DICT_4X4_50 marker IDs.',
    code: `/*
 * =========================================================================
 * 1. SWARM IDENTITY & ARUCO DICTIONARY (DICT_4X4_50)
 * =========================================================================
 */
#define MY_ROBOT_ID         0
#define PEER_ROBOT_ID       1
#define ARUCO_DICT_NAME     "DICT_4X4_50"

// Marker ID Mapping (DICT_4X4_50):
// ID 0: ROBOT_1 | ID 1: ROBOT_2 | ID 2: RACK_1 | ID 3: RACK_2 | ID 4: RACK_3 | ID 5: RACK_4
// ID 6: ROBOT_1_START | ID 7: ROBOT_2_START | ID 8: DELIVERY_ZONE
// ID 9: BOUNDARY_TL | ID 10: BOUNDARY_TR | ID 11: BOUNDARY_BR | ID 12: BOUNDARY_BL

#define WIFI_SSID           "YOUR_HOTSPOT_NAME"
#define WIFI_PASS           "YOUR_HOTSPOT_PASSWORD"
#define UDP_CMD_PORT        8888  // Direct velocity streaming port
#define UDP_SWARM_PORT      5005  // Global ArUco swarm state broadcast port

// =========================================================================
// 2. TB6612FNG MOTOR CONTROLLER PINS (FROZEN PHYSICAL BASELINE)
// =========================================================================
#define PIN_PWM_LEFT        4     // Spliced Front-Left and Rear-Left PWMA
#define PIN_PWM_RIGHT       5     // Spliced Front-Right and Rear-Right PWMB

#define PIN_F_AIN1          25    // Front-Left Direction 1
#define PIN_F_AIN2          26    // Front-Left Direction 2
#define PIN_F_BIN1          27    // Front-Right Direction 1
#define PIN_F_BIN2          14    // Front-Right Direction 2

#define PIN_R_AIN1          12    // Rear-Left Direction 1
#define PIN_R_AIN2          13    // Rear-Left Direction 2
#define PIN_R_BIN1          32    // Rear-Right Direction 1
#define PIN_R_BIN2          33    // Rear-Right Direction 2

// =========================================================================
// 3. I2C BUS ALLOCATION (GPIO 21 = SDA, GPIO 22 = SCL)
// =========================================================================
#define ADDR_PCA9685        0x40  // 16-Channel PWM Servo Driver
#define ADDR_OLED           0x3C  // 0.96" 128x64 SSD1306 Display
#define ADDR_VL53L0X        0x29  // Time-of-Flight Laser Distance Sensor

#define SERVO_CH_BASE       0
#define SERVO_CH_SHOULDER   1
#define SERVO_CH_ELBOW      2
#define SERVO_CH_WRIST      3
#define SERVO_CH_GRIPPER    4
`
  },
  {
    id: 'integrated-robot-ino',
    name: 'integrated_robot.ino',
    category: 'FIRMWARE',
    language: 'cpp',
    description: 'Master integrated ESP32 firmware running autonomous warehouse mission state machine with ToF obstacle braking.',
    code: `/*
 * MASTER INTEGRATED AUTONOMOUS SWARM MOBILE MANIPULATOR FIRMWARE
 */
#include "Config.h"
#include "MotorDriver.h"
#include "ArmController.h"
#include "SensorSuite.h"
#include "DisplayManager.h"
#include "SwarmComms.h"

MotorDriver    motors;
ArmController  arm;
SensorSuite    sensors;
DisplayManager display;
SwarmComms     comms;

enum RobotMissionState {
  STATE_IDLE, STATE_NAV_TO_PICK, STATE_RACK_VERIFY,
  STATE_PRECISION_DOCK, STATE_PICK_PAYLOAD, STATE_NAV_TO_DROP,
  STATE_RELEASE_PAYLOAD, STATE_YIELDING
};

void setup() {
  Serial.begin(115200);
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  display.init();
  motors.init();
  arm.init();
  sensors.init();
  comms.init();
}

void loop() {
  comms.update();
  sensors.update();
  SwarmPose myPose = comms.getMyPose();

  // Safety Override: ToF obstacle braking
  if (sensors.isForwardPathBlocked() && currentState != STATE_PRECISION_DOCK) {
    motors.stop();
    display.render("SAFETY STOP", myPose.x, myPose.y, myPose.ang, sensors.getLastScannedRFID().c_str(), comms.isConnected());
    return;
  }
}
`
  },
  {
    id: 'warehouse-central-server',
    name: 'warehouse_central_server.py',
    category: 'PERCEPTION',
    language: 'python',
    description: 'Global perception server: DICT_4X4_50 ArUco tracker, dynamic 4-corner homography calibration (H-Matrix), and UDP 5005 broadcaster.',
    code: `#!/usr/bin/env python3
import cv2, cv2.aruco as aruco, numpy as np, socket, json, math, time

ARENA_WIDTH_CM = 120.0
ARENA_HEIGHT_CM = 120.0
ID_TL = 9; ID_TR = 10; ID_BR = 11; ID_BL = 12

aruco_dict = aruco.getPredefinedDictionary(aruco.DICT_4X4_50)
aruco_params = aruco.DetectorParameters()
detector = aruco.ArucoDetector(aruco_dict, aruco_params)

# Dynamic Homography Matrix Computation
def compute_homography(detected_corners):
    src = np.float32([detected_corners[ID_TL], detected_corners[ID_TR], detected_corners[ID_BR], detected_corners[ID_BL]])
    dst = np.float32([[0,0], [ARENA_WIDTH_CM, 0], [ARENA_WIDTH_CM, ARENA_HEIGHT_CM], [0, ARENA_HEIGHT_CM]])
    return cv2.getPerspectiveTransform(src, dst)
`
  },
  {
    id: 'telemetry-bridge',
    name: 'telemetry_bridge.py',
    category: 'BRIDGE',
    language: 'python',
    description: 'WebSocket & UDP Telemetry Bridge hosting ws://0.0.0.0:8080/ws to stream real-time perception state to Website_Swram.',
    code: `#!/usr/bin/env python3
import asyncio, websockets, json, socket, threading, time

UDP_VISION_PORT = 5005
WS_PORT = 8080

async def ws_handler(websocket, path):
    connected_clients.add(websocket)
    async for message in websocket:
        data = json.loads(message)
        if data.get("type") == "send_command":
            # Dispatch command over UDP to physical ESP32
            pass
`
  },
  {
    id: 'uno-q-agent',
    name: 'uno_q_swarm_agent.py',
    category: 'COORDINATOR',
    language: 'python',
    description: 'Arduino UNO Q Linux MPU high-level swarm agent communicating via hardware UART (115200 baud) with ESP32.',
    code: `#!/usr/bin/env python3
import serial, socket, json, time

ser = serial.Serial('/dev/ttyS0', 115200, timeout=0.1)
rx_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
rx_sock.bind(("", 5005))

while True:
    data, _ = rx_sock.recvfrom(2048)
    packet = json.loads(data.decode('utf-8'))
    # High-level edge reasoning and UART dispatch to ESP32
`
  }
];
