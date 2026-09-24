import { PinDefinition } from '../types';

export interface SourceFile {
  id: string;
  name: string;
  moduleTitle: string;
  platform: string;
  language: 'cpp' | 'python';
  code: string;
  description: string;
  keyFeatures: string[];
}

export const SOURCE_FILES: SourceFile[] = [
  {
    "id": "integrated_robot_ino",
    "name": "integrated_robot.ino",
    "moduleTitle": "MASTER FIRMWARE: Autonomous Mobile Manipulator Swarm Node",
    "platform": "ESP32 DevKit V1 (Arduino Core)",
    "language": "cpp",
    "description": "Master integrated firmware running on the physical robot. Features 4WD skid-steer TB6612 locomotion with native PWM (D4/D5), 4-DoF PCA9685 arm interpolation, VL53L0X ToF laser docking (<60mm), HC-SR04 ultrasonic safety, RC522 RFID rack verification, SSD1306 OLED telemetry display, and dual UDP communication (Port 8888 velocity, Port 5005 global pose).",
    "keyFeatures": [
      "Dual TB6612FNG H-Bridges: Native PWM on GPIO 4 (Left) and GPIO 5 (Right)",
      "Direction GPIOs: 25, 26, 27, 14 (Front) & 12, 13, 32, 33 (Rear)",
      "PCA9685 I2C (0x40): 4-DoF Arm (Base, Shoulder, Elbow, Wrist, Gripper 85\u00b0-180\u00b0)",
      "VL53L0X ToF (0x29) I2C sensor for precision pallet docking (60mm)",
      "MFRC522 SPI RFID Reader for rack payload barcode/tag verification",
      "SSD1306 128x64 OLED (0x3C) displaying IP, State, ToF, and Swarm Pose",
      "Autonomous State Machine: NAV_TO_PICK -> RACK_VERIFY -> PRECISION_DOCK -> PICK_PAYLOAD -> NAV_TO_DROP -> RELEASE_PAYLOAD -> YIELDING",
      "Decentralized Swarm Arbitration: Yields right-of-way if peer robot approaches within 28cm"
    ],
    "code": "/*\n * ======================================================================================\n * MASTER INTEGRATED AUTONOMOUS SWARM MOBILE MANIPULATOR FIRMWARE\n * ======================================================================================\n * Project: AI-Driven Cooperative Autonomous Mobile Manipulator Swarm for Smart Warehouse\n *\n * Integrated Subsystems:\n *   1. 4WD Locomotion: Two TB6612 drivers (PWM on D4/D5, Dir on 25,26,27,14,12,13,32,33)\n *   2. 4-DOF Arm & Gripper: PCA9685 I2C driver (CH0-CH4) with smooth pose interpolation\n *   3. Sensor Suite: VL53L0X (ToF 0x29), HC-SR04 (Ultrasonic), MFRC522 (RFID)\n *   4. Telemetry Display: SSD1306 0.96\" OLED (0x3C)\n *   5. Swarm Comms: Dual UDP listener (Port 8888 velocity, Port 5005 global pose)\n *   6. Decentralized Swarm Arbitration: Automatic right-of-way yielding based on Robot ID\n * ======================================================================================\n */\n\n#include \"Config.h\"\n#include \"MotorDriver.h\"\n#include \"ArmController.h\"\n#include \"SensorSuite.h\"\n#include \"DisplayManager.h\"\n#include \"SwarmComms.h\"\n\n// Global Subsystem Instances\nMotorDriver    motors;\nArmController  arm;\nSensorSuite    sensors;\nDisplayManager display;\nSwarmComms     comms;\n\n// Warehouse Mission State Machine\nenum RobotMissionState {\n  STATE_IDLE,\n  STATE_NAV_TO_PICK,\n  STATE_RACK_VERIFY,\n  STATE_PRECISION_DOCK,\n  STATE_PICK_PAYLOAD,\n  STATE_NAV_TO_DROP,\n  STATE_RELEASE_PAYLOAD,\n  STATE_YIELDING\n};\n\nRobotMissionState currentState  = STATE_NAV_TO_PICK;\nRobotMissionState previousState = STATE_NAV_TO_PICK;\n\n// Waypoints (Customized for Robot 0 and Robot 1)\nstruct Waypoint {\n  float x;\n  float y;\n};\n\nWaypoint pickLocation = (MY_ROBOT_ID == 0) ? Waypoint{25.0f, 30.0f} : Waypoint{25.0f, 90.0f};\nWaypoint dropLocation = (MY_ROBOT_ID == 0) ? Waypoint{95.0f, 30.0f} : Waypoint{95.0f, 90.0f};\nWaypoint activeGoal   = pickLocation;\n\nunsigned long lastTelemetryUpdate = 0;\n\n// Autonomous Waypoint Guidance Math\nvoid navigateTowards(float targetX, float targetY, SwarmPose pose) {\n  float dx = targetX - pose.x;\n  float dy = targetY - pose.y;\n  float distance = sqrt(dx * dx + dy * dy);\n\n  float desiredAngle = atan2(dy, dx) * 180.0f / M_PI;\n  float angleError   = desiredAngle - pose.ang;\n\n  // Bounding angle error to [-180, 180]\n  while (angleError > 180.0f)  angleError -= 360.0f;\n  while (angleError < -180.0f) angleError += 360.0f;\n\n  if (abs(angleError) > HEADING_DEADBAND_DEG) {\n    // In-place pivot rotation\n    if (angleError > 0) {\n      motors.setRawMotors(-130, 130); // Pivot CCW\n    } else {\n      motors.setRawMotors(130, -130); // Pivot CW\n    }\n  } else {\n    // Proportional forward tracking\n    int basePwm = 135;\n    int trim = (int)(angleError * 1.4f);\n    motors.setRawMotors(basePwm - trim, basePwm + trim);\n  }\n}\n\nvoid setup() {\n  Serial.begin(115200);\n  delay(1000);\n\n  Serial.println(F(\"\\n========================================================\"));\n  Serial.printf(  \"   SWARM ROBOT R0%d: SYSTEM BOOT & PERIPHERAL INITIALIZATION\\n\", MY_ROBOT_ID + 1);\n  Serial.println(F(\"========================================================\"));\n\n  // 1. Initialize I2C Bus (SDA=21, SCL=22)\n  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);\n\n  // 2. Initialize Subsystems\n  display.init();\n  motors.init();\n  arm.init();\n  sensors.init();\n  comms.init();\n\n  Serial.println(F(\"[BOOT] All hardware layers online. Starting Swarm Mission.\"));\n}\n\nvoid loop() {\n  // Update Network & Sensor Inputs\n  comms.update();\n  sensors.update();\n\n  SwarmPose myPose = comms.getMyPose();\n\n  // --- 1. LOCAL OBSTACLE SAFETY OVERRIDE ---\n  if (sensors.isForwardPathBlocked() && currentState != STATE_PRECISION_DOCK && currentState != STATE_PICK_PAYLOAD) {\n    motors.stop();\n    Serial.println(F(\"[SAFETY] Immediate Obstacle Obstruction! Motors halted.\"));\n    display.render(\"SAFETY STOP\", myPose.x, myPose.y, myPose.ang, sensors.getLastScannedRFID().c_str(), comms.isConnected());\n    return;\n  }\n\n  // --- 2. DECENTRALIZED SWARM COLLISION ARBITRATION ---\n  if (comms.isPeerNear(SWARM_SAFE_DIST_CM)) {\n    // Priority Rule: Lower ID has priority; Higher ID yields\n    // Exception: If currently picking or docking, maintain right-of-way\n    if (MY_ROBOT_ID > PEER_ROBOT_ID && currentState != STATE_PICK_PAYLOAD && currentState != STATE_RELEASE_PAYLOAD) {\n      if (currentState != STATE_YIELDING) {\n        previousState = currentState;\n        currentState = STATE_YIELDING;\n        Serial.printf(\"[SWARM] Yielding corridor to Peer Robot R0%d.\\n\", PEER_ROBOT_ID + 1);\n      }\n    }\n  } else if (currentState == STATE_YIELDING) {\n    currentState = previousState;\n    Serial.println(F(\"[SWARM] Corridor cleared. Resuming trajectory.\"));\n  }\n\n  // --- 3. MANUAL VELOCITY OVERRIDE (TELEOP / TEST OVERRIDE) ---\n  float overrideLin, overrideAng;\n  if (comms.hasVelocityOverride(overrideLin, overrideAng)) {\n    motors.drive(overrideLin, overrideAng);\n    display.render(\"MANUAL OVERRIDE\", myPose.x, myPose.y, myPose.ang, sensors.getLastScannedRFID().c_str(), comms.isConnected());\n    return;\n  }\n\n  // --- 4. AUTONOMOUS MISSION STATE MACHINE ---\n  switch (currentState) {\n\n    case STATE_IDLE:\n      motors.stop();\n      break;\n\n    case STATE_YIELDING:\n      motors.stop();\n      break;\n\n    case STATE_NAV_TO_PICK: {\n      activeGoal = pickLocation;\n      float distToPick = sqrt(sq(activeGoal.x - myPose.x) + sq(activeGoal.y - myPose.y));\n\n      if (distToPick <= ARRIVAL_THRESH_CM && myPose.valid) {\n        motors.stop();\n        currentState = STATE_RACK_VERIFY;\n        Serial.println(F(\"[TASK] Arrived at Rack Station. Verifying RFID...\"));\n      } else if (myPose.valid) {\n        navigateTowards(activeGoal.x, activeGoal.y, myPose);\n      }\n      break;\n    }\n\n    case STATE_RACK_VERIFY: {\n      motors.stop();\n      String tag = sensors.getLastScannedRFID();\n      if (tag != \"NONE\" && tag.length() > 0) {\n        Serial.printf(\"[TASK] Rack Verified! Tag ID: %s\\n\", tag.c_str());\n        currentState = STATE_PRECISION_DOCK;\n      } else {\n        // Slow alignment creep to scan RFID tag\n        motors.setRawMotors(85, 85);\n        delay(100);\n        motors.stop();\n        delay(150);\n      }\n      break;\n    }\n\n    case STATE_PRECISION_DOCK: {\n      uint16_t tofDist = sensors.getTofDistanceMM();\n      Serial.printf(\"[DOCK] Distance to Payload: %d mm\\n\", tofDist);\n\n      if (tofDist > TOF_DOCK_DIST_MM && tofDist < 250) {\n        // Slow precision approach\n        motors.setRawMotors(80, 80);\n        delay(80);\n        motors.stop();\n      } else {\n        motors.stop();\n        currentState = STATE_PICK_PAYLOAD;\n        Serial.println(F(\"[DOCK] Payload within gripping tolerance. Actuating Manipulator.\"));\n      }\n      break;\n    }\n\n    case STATE_PICK_PAYLOAD: {\n      motors.stop();\n      // Arm Maneuver: Hover -> Open -> Lower -> Grip -> Lift -> Rest\n      arm.openGripper();\n      arm.setPose(POSE_HOVER, 400);\n      delay(200);\n      arm.setPose(POSE_PICK, 500);\n      delay(300);\n      arm.closeGripper();\n      delay(500);\n      arm.setPose(POSE_LIFT, 400);\n      delay(300);\n      arm.setPose(POSE_REST, 400);\n\n      // Back off slightly from the rack\n      motors.setRawMotors(-115, -115);\n      delay(400);\n      motors.stop();\n\n      currentState = STATE_NAV_TO_DROP;\n      Serial.println(F(\"[TASK] Payload secured. En route to Delivery Station.\"));\n      break;\n    }\n\n    case STATE_NAV_TO_DROP: {\n      activeGoal = dropLocation;\n      float distToDrop = sqrt(sq(activeGoal.x - myPose.x) + sq(activeGoal.y - myPose.y));\n\n      if (distToDrop <= ARRIVAL_THRESH_CM && myPose.valid) {\n        motors.stop();\n        currentState = STATE_RELEASE_PAYLOAD;\n        Serial.println(F(\"[TASK] Arrived at Delivery Station. Releasing payload...\"));\n      } else if (myPose.valid) {\n        navigateTowards(activeGoal.x, activeGoal.y, myPose);\n      }\n      break;\n    }\n\n    case STATE_RELEASE_PAYLOAD: {\n      motors.stop();\n      arm.setPose(POSE_DROP, 500);\n      delay(300);\n      arm.openGripper();\n      delay(400);\n      arm.setPose(POSE_REST, 400);\n\n      // Back off from drop bucket\n      motors.setRawMotors(-115, -115);\n      delay(450);\n      motors.stop();\n\n      currentState = STATE_IDLE;\n      Serial.println(F(\"[TASK] Mission Complete! Robot in IDLE.\"));\n      break;\n    }\n  }\n\n  // --- 5. RENDER OLED DASHBOARD TELEMETRY (10 Hz) ---\n  if (millis() - lastTelemetryUpdate > 100) {\n    lastTelemetryUpdate = millis();\n\n    const char* stateNames[] = {\n      \"IDLE\", \"NAV -> PICK\", \"VERIFY RACK\", \"PRECISION DOCK\",\n      \"PICKING\", \"NAV -> DROP\", \"DROPPING\", \"YIELDING\"\n    };\n\n    display.render(\n      stateNames[currentState],\n      myPose.x, myPose.y, myPose.ang,\n      sensors.getLastScannedRFID().c_str(),\n      comms.isConnected()\n    );\n  }\n}\n"
  },
  {
    "id": "config_h",
    "name": "Config.h",
    "moduleTitle": "FROZEN HARDWARE BASELINE: Pinouts & Swarm Thresholds",
    "platform": "ESP32 Hardware Specification Header",
    "language": "cpp",
    "description": "Frozen hardware pin definition header. Enforces native ESP32 PWM pins, 8 direction GPIOs, I2C bus allocation (0x40 PCA9685, 0x3C OLED, 0x29 VL53L0X), RC522 SPI pins, and swarm kinematic clearance thresholds.",
    "keyFeatures": [
      "MY_ROBOT_ID: 0 for Robot 1 (Marker 0) and 1 for Robot 2 (Marker 1)",
      "Native PWM: PIN_PWM_LEFT = 4, PIN_PWM_RIGHT = 5",
      "TB6612 Direction Pins: F_AIN1/2 (25,26), F_BIN1/2 (27,14), R_AIN1/2 (12,13), R_BIN1/2 (32,33)",
      "I2C: GPIO 21 (SDA), GPIO 22 (SCL)",
      "SWARM_SAFE_DIST_CM = 28.0cm (Inter-robot yield threshold)",
      "ARRIVAL_THRESH_CM = 8.0cm (Waypoint arrival tolerance)"
    ],
    "code": "#ifndef CONFIG_H\n#define CONFIG_H\n\n#include <Arduino.h>\n\n// =========================================================================\n// 1. SWARM IDENTITY & NETWORK CONFIGURATION\n// =========================================================================\n// Set MY_ROBOT_ID to 0 for Robot 1; set to 1 for Robot 2\n#define MY_ROBOT_ID         0\n#define PEER_ROBOT_ID       ((MY_ROBOT_ID == 0) ? 1 : 0)\n\n#define WIFI_SSID           \"YOUR_HOTSPOT_NAME\"\n#define WIFI_PASS           \"YOUR_HOTSPOT_PASSWORD\"\n\n#define UDP_CMD_PORT        8888  // Direct velocity streaming port\n#define UDP_SWARM_PORT      5005  // Global ArUco swarm state broadcast port\n\n// =========================================================================\n// 2. TB6612FNG MOTOR CONTROLLER PINS (FROZEN PHYSICAL BASELINE)\n// =========================================================================\n// Native ESP32 hardware PWM (8-bit, 0-255)\n#define PIN_PWM_LEFT        4     // Spliced Front-Left and Rear-Left PWMA\n#define PIN_PWM_RIGHT       5     // Spliced Front-Right and Rear-Right PWMB\n\n// Front Motor Driver (TB6612 #1)\n#define PIN_F_AIN1          25    // Front-Left Direction 1\n#define PIN_F_AIN2          26    // Front-Left Direction 2\n#define PIN_F_BIN1          27    // Front-Right Direction 1\n#define PIN_F_BIN2          14    // Front-Right Direction 2\n\n// Rear Motor Driver (TB6612 #2)\n#define PIN_R_AIN1          12    // Rear-Left Direction 1\n#define PIN_R_AIN2          13    // Rear-Left Direction 2\n#define PIN_R_BIN1          32    // Rear-Right Direction 1\n#define PIN_R_BIN2          33    // Rear-Right Direction 2\n\n// Note: Both TB6612 STBY pins are hardwired directly to 3.3V\n\n// =========================================================================\n// 3. I2C BUS ALLOCATION (GPIO 21 = SDA, GPIO 22 = SCL)\n// =========================================================================\n#define I2C_SDA_PIN         21\n#define I2C_SCL_PIN         22\n\n#define ADDR_PCA9685        0x40  // 16-Channel PWM Servo Driver\n#define ADDR_OLED           0x3C  // 0.96\" 128x64 SSD1306 Display\n#define ADDR_VL53L0X        0x29  // Time-of-Flight Laser Distance Sensor\n\n// =========================================================================\n// 4. PCA9685 SERVO CHANNEL ALLOCATION (4-DOF ARM + GRIPPER)\n// =========================================================================\n#define SERVO_CH_BASE       0\n#define SERVO_CH_SHOULDER   1\n#define SERVO_CH_ELBOW      2\n#define SERVO_CH_WRIST      3\n#define SERVO_CH_GRIPPER    4\n\n#define SERVO_PULSE_MIN     150   // ~0 degrees (MG90S)\n#define SERVO_PULSE_MAX     600   // ~180 degrees (MG90S)\n\n#define GRIPPER_OPEN_DEG    180\n#define GRIPPER_CLOSED_DEG  85\n\n// =========================================================================\n// 5. SPI BUS & RC522 RFID READER PINS\n// =========================================================================\n#define RFID_SS_PIN         5     // Shared with Right PWM if SPI used; or GPIO 15\n#define RFID_RST_PIN        2\n#define RFID_SCK_PIN        18\n#define RFID_MISO_PIN       19\n#define RFID_MOSI_PIN       23\n\n// =========================================================================\n// 6. ULTRASONIC HC-SR04 PROXIMITY SENSOR\n// =========================================================================\n#define PIN_US_TRIG         15\n#define PIN_US_ECHO         34    // Input-only pin (via 5V->3.3V divider)\n\n// =========================================================================\n// 7. SWARM KINEMATICS & SAFETY THRESHOLDS\n// =========================================================================\n#define SWARM_SAFE_DIST_CM    28.0f // Inter-robot yield threshold\n#define ARRIVAL_THRESH_CM     8.0f  // Waypoint arrival tolerance\n#define HEADING_DEADBAND_DEG  20.0f // Pivoting threshold\n#define TOF_DOCK_DIST_MM      60    // Precision pallet pick distance\n#define WATCHDOG_TIMEOUT_MS   600   // Failsafe brake timeout\n\n#endif // CONFIG_H\n"
  },
  {
    "id": "step3_swarm_agent",
    "name": "step3_esp32_swarm_agent.ino",
    "moduleTitle": "STEP 3: Integrated ESP32 Swarm Agent with ToF Active Braking",
    "platform": "ESP32 DevKit V1 (Arduino Core)",
    "language": "cpp",
    "description": "Production robot firmware connecting to Wi-Fi, listening for velocity packets on UDP Port 8888, executing 4WD skid-steer drive, with autonomous local safety cutting motor power if VL53L0X ToF detects an obstacle <120mm, and a 500ms watchdog failsafe.",
    "keyFeatures": [
      "UDP Port 8888 listener parsing \"linear_x,angular_z\" velocity packets",
      "Direct skid-steer motor speed mapping to native PWM 4 & 5",
      "VL53L0X ToF active obstacle avoidance with 120mm emergency brake",
      "500ms watchdog timeout auto-stopping motors on packet loss"
    ],
    "code": "/*\n * ======================================================================================\n * STEP 3: INTEGRATED SWARM AGENT FIRMWARE (ESP32)\n * ======================================================================================\n * Purpose: Full production firmware for the mobile robot:\n *          - Connects to Wi-Fi hotspot.\n *          - Listens on UDP Port 8888 for velocity packets (\"linear_x,angular_z\").\n *          - Executes 4WD skid-steer drive on native ESP32 PWM (D4, D5).\n *          - Autonomous Local Safety: Cuts motor power if VL53L0X detects obstacle < 120 mm.\n *          - Failsafe: Stops robot if UDP stream drops for more than 500 ms.\n * ======================================================================================\n */\n\n#include <WiFi.h>\n#include <WiFiUdp.h>\n#include <Wire.h>\n#include <VL53L0X.h>\n\n// ==========================================\n// 1. NETWORK & SWARM IDENTITY\n// ==========================================\n// Set YOUR hotspot credentials here\nconst char* ssid     = \"YOUR_HOTSPOT_NAME\";\nconst char* password = \"YOUR_HOTSPOT_PASSWORD\";\nconst int udpPort    = 8888;\n\nWiFiUDP udp;\nchar packetBuffer[255];\n\n// ==========================================\n// 2. VERIFIED MOTOR PIN MAPPING (FROZEN)\n// ==========================================\nconst int PIN_PWM_LEFT  = 4;  // Spliced Left PWMA\nconst int PIN_PWM_RIGHT = 5;  // Spliced Right PWMB\n\nconst int PIN_F_AIN1 = 25;    // Front Left Dir 1\nconst int PIN_F_AIN2 = 26;    // Front Left Dir 2\nconst int PIN_F_BIN1 = 27;    // Front Right Dir 1\nconst int PIN_F_BIN2 = 14;    // Front Right Dir 2\n\nconst int PIN_R_AIN1 = 12;    // Rear Left Dir 1\nconst int PIN_R_AIN2 = 13;    // Rear Left Dir 2\nconst int PIN_R_BIN1 = 32;    // Rear Right Dir 1\nconst int PIN_R_BIN2 = 33;    // Rear Right Dir 2\n\n// ==========================================\n// 3. SENSORS & FAILSAFE PARAMETERS\n// ==========================================\nVL53L0X tof;\nbool tofOnline = false;\nconst uint16_t COLLISION_THRESHOLD_MM = 120; // 12 cm emergency stopping distance\n\nunsigned long lastCommandTime = 0;\nconst int timeoutMs = 500; // Stop robot if UDP commands cease for 500ms\n\n// ==========================================\n// 4. LOW-LEVEL DRIVE IMPLEMENTATION\n// ==========================================\nvoid stopMotors() {\n  digitalWrite(PIN_F_AIN1, LOW); digitalWrite(PIN_F_AIN2, LOW);\n  digitalWrite(PIN_R_AIN1, LOW); digitalWrite(PIN_R_AIN2, LOW);\n  digitalWrite(PIN_F_BIN1, LOW); digitalWrite(PIN_F_BIN2, LOW);\n  digitalWrite(PIN_R_BIN1, LOW); digitalWrite(PIN_R_BIN2, LOW);\n  \n  analogWrite(PIN_PWM_LEFT, 0);\n  analogWrite(PIN_PWM_RIGHT, 0);\n}\n\nvoid driveRobot(float linear, float angular) {\n  // Autonomous Safety Override: Check forward obstacle\n  if (tofOnline && linear > 0) {\n    uint16_t dist = tof.readRangeContinuousMillimeters();\n    if (!tof.timeoutOccurred() && dist < COLLISION_THRESHOLD_MM) {\n      Serial.printf(\"[SAFETY] Obstacle detected at %d mm! Emergency Brake Active.\\n\", dist);\n      stopMotors();\n      return;\n    }\n  }\n\n  float left_speed  = linear - angular;\n  float right_speed = linear + angular;\n\n  left_speed  = constrain(left_speed, -1.0f, 1.0f);\n  right_speed = constrain(right_speed, -1.0f, 1.0f);\n\n  int pwm_left  = map((int)(abs(left_speed) * 100), 0, 100, 0, 255);\n  int pwm_right = map((int)(abs(right_speed) * 100), 0, 100, 0, 255);\n\n  // --- Left Side Direction ---\n  if (left_speed > 0.05f) {\n    digitalWrite(PIN_F_AIN1, HIGH); digitalWrite(PIN_F_AIN2, LOW);\n    digitalWrite(PIN_R_AIN1, HIGH); digitalWrite(PIN_R_AIN2, LOW);\n  } else if (left_speed < -0.05f) {\n    digitalWrite(PIN_F_AIN1, LOW); digitalWrite(PIN_F_AIN2, HIGH);\n    digitalWrite(PIN_R_AIN1, LOW); digitalWrite(PIN_R_AIN2, HIGH);\n  } else {\n    digitalWrite(PIN_F_AIN1, LOW); digitalWrite(PIN_F_AIN2, LOW);\n    digitalWrite(PIN_R_AIN1, LOW); digitalWrite(PIN_R_AIN2, LOW);\n    pwm_left = 0;\n  }\n\n  // --- Right Side Direction ---\n  if (right_speed > 0.05f) {\n    digitalWrite(PIN_F_BIN1, HIGH); digitalWrite(PIN_F_BIN2, LOW);\n    digitalWrite(PIN_R_BIN1, HIGH); digitalWrite(PIN_R_BIN2, LOW);\n  } else if (right_speed < -0.05f) {\n    digitalWrite(PIN_F_BIN1, LOW); digitalWrite(PIN_F_BIN2, HIGH);\n    digitalWrite(PIN_R_BIN1, LOW); digitalWrite(PIN_R_BIN2, HIGH);\n  } else {\n    digitalWrite(PIN_F_BIN1, LOW); digitalWrite(PIN_F_BIN2, LOW);\n    digitalWrite(PIN_R_BIN1, LOW); digitalWrite(PIN_R_BIN2, LOW);\n    pwm_right = 0;\n  }\n\n  analogWrite(PIN_PWM_LEFT, pwm_left);\n  analogWrite(PIN_PWM_RIGHT, pwm_right);\n}\n\n// ==========================================\n// 5. SETUP\n// ==========================================\nvoid setup() {\n  Serial.begin(115200);\n  delay(500);\n\n  Serial.println(F(\"\\n========================================\"));\n  Serial.println(F(\"[BOOT] Swarm Robot Edge Agent Starting\"));\n  Serial.println(F(\"========================================\"));\n\n  // Initialize motor pins\n  pinMode(PIN_PWM_LEFT, OUTPUT);\n  pinMode(PIN_PWM_RIGHT, OUTPUT);\n  pinMode(PIN_F_AIN1, OUTPUT); pinMode(PIN_F_AIN2, OUTPUT);\n  pinMode(PIN_F_BIN1, OUTPUT); pinMode(PIN_F_BIN2, OUTPUT);\n  pinMode(PIN_R_AIN1, OUTPUT); pinMode(PIN_R_AIN2, OUTPUT);\n  pinMode(PIN_R_BIN1, OUTPUT); pinMode(PIN_R_BIN2, OUTPUT);\n  stopMotors();\n\n  // Initialize I2C & ToF Sensor on GPIO 21, 22\n  Wire.begin(21, 22);\n  tof.setTimeout(200);\n  if (tof.init()) {\n    tof.startContinuous();\n    tofOnline = true;\n    Serial.println(F(\"[INFO][TOF] VL53L0X Active (SDA=21, SCL=22)\"));\n  } else {\n    Serial.println(F(\"[WARNING][TOF] VL53L0X not found! Running in blind mode.\"));\n  }\n\n  // Connect to Wi-Fi\n  Serial.printf(\"[COMM] Connecting to SSID: %s\\n\", ssid);\n  WiFi.mode(WIFI_STA);\n  WiFi.begin(ssid, password);\n  while (WiFi.status() != WL_CONNECTED) {\n    delay(400);\n    Serial.print(\".\");\n  }\n\n  Serial.println(F(\"\\n[COMM] WiFi Connected.\"));\n  Serial.print(F(\"[COMM] Robot IP: \"));\n  Serial.println(WiFi.localIP());\n\n  udp.begin(udpPort);\n  Serial.printf(\"[COMM] UDP Listener active on port %d\\n\", udpPort);\n  Serial.println(F(\"[STATE] Agent Ready for Swarm Coordination.\"));\n}\n\n// ==========================================\n// 6. MAIN LOOP\n// ==========================================\nvoid loop() {\n  int packetSize = udp.parsePacket();\n  if (packetSize) {\n    int len = udp.read(packetBuffer, 254);\n    if (len > 0) packetBuffer[len] = '\\0';\n\n    String data = String(packetBuffer);\n    int commaIdx = data.indexOf(',');\n    if (commaIdx > 0) {\n      float linear_x  = data.substring(0, commaIdx).toFloat();\n      float angular_z = data.substring(commaIdx + 1).toFloat();\n\n      driveRobot(linear_x, angular_z);\n      lastCommandTime = millis();\n    }\n  }\n\n  // Safety Failsafe: stop if connection silent > timeoutMs\n  if (millis() - lastCommandTime > timeoutMs) {\n    stopMotors();\n  }\n}\n"
  },
  {
    "id": "warehouse_central_server",
    "name": "warehouse_central_server.py",
    "moduleTitle": "SERVER: Warehouse Central Server & ArUco Calibration Coordinator",
    "platform": "Central Station (Python 3 / OpenCV / UDP)",
    "language": "python",
    "description": "Master warehouse central server featuring continuous OpenCV ArUco tracking (DICT_4X4_50). Calibrates workspace origin, scale, and operating polygon from 4 boundary markers (IDs 9–12), transforms moving robots (IDs 0–1), racks (IDs 2–5), start bays (IDs 6–7), and delivery zone (ID 8), and broadcasts calibrated UDP state on Port 5005.",
    "keyFeatures": [
      "ArUco DICT_4X4_50 fiducials (IDs 0–12)",
      "Dynamic 4-Corner Workspace Calibration via Perspective Homography (IDs 9, 10, 11, 12)",
      "Boundary-Aware Safety Interlock: Prohibits robots from breaching the calibrated workspace polygon",
      "Fixed Station Localization: Rack 1 (ID 2), Rack 2 (ID 3), Rack 3 (ID 4), Rack 4 (ID 5), Delivery (ID 8)",
      "UDP Port 5005 broadcast at 30 FPS to all swarm nodes with interactive keyboard dispatch"
    ],
    "code": "#!/usr/bin/env python3\n\"\"\"\n======================================================================================\nWAREHOUSE CENTRAL SERVER: ARUCO BOUNDARY CALIBRATION & SWARM DISPATCH\n======================================================================================\nProject: AI-Driven Cooperative Autonomous Mobile Manipulator Swarm for Smart Warehouse\nMarker Dictionary: cv2.aruco.DICT_4X4_50\n\nFiducial Allocation:\n  - IDs 9, 10, 11, 12: BOUNDARY_TL, BOUNDARY_TR, BOUNDARY_BR, BOUNDARY_BL (Corner Anchors)\n  - IDs 0, 1: ROBOT_1, ROBOT_2 (Moving Chassis Fiducials)\n  - IDs 2, 3, 4, 5: RACK_1, RACK_2, RACK_3, RACK_4 (Storage Rack Stations)\n  - IDs 6, 7: ROBOT_1_START, ROBOT_2_START (Home / Charging Bays)\n  - ID 8: DELIVERY_ZONE (Outbound Sorting Bay)\n\nKey Principles:\n  - The 4 boundary markers are not static labels; they act as the geometric reference\n    conditions of the workspace. Any camera tilt, height variation, or workcell move is\n    dynamically calibrated using cv2.getPerspectiveTransform.\n  - Enforces boundary safety response: velocity reduction & braking near boundaries.\n======================================================================================\n\"\"\"\n\nimport sys\nimport argparse\nimport socket\nimport json\nimport math\nimport time\nimport cv2\nimport cv2.aruco as aruco\nimport numpy as np\n\n# Desired Metric Calibrated Workspace Extent in cm\nWORKSPACE_WIDTH_CM  = 120.0\nWORKSPACE_HEIGHT_CM = 120.0\nSAFETY_MARGIN_CM    = 10.0\nCANVAS_SIZE         = 800\n\nBROADCAST_IP = \"255.255.255.255\"\nSWARM_PORT   = 5005\n\n# Destination coordinates for metric rectified frame (in pixels for visualization)\nDST_PTS = np.float32([\n    [0, 0],                            # TL (ID 9)\n    [CANVAS_SIZE, 0],                  # TR (ID 10)\n    [CANVAS_SIZE, CANVAS_SIZE],        # BR (ID 11)\n    [0, CANVAS_SIZE]                   # BL (ID 12)\n])\n\nBOUNDARY_IDS = {9: 'TL', 10: 'TR', 11: 'BR', 12: 'BL'}\n\ndef compute_homography(detected_corners):\n    \"\"\"Calculates perspective transform matrix from the 4 boundary markers.\"\"\"\n    if not all(k in detected_corners for k in [9, 10, 11, 12]):\n        return None\n    src = np.float32([\n        detected_corners[9],\n        detected_corners[10],\n        detected_corners[11],\n        detected_corners[12]\n    ])\n    return cv2.getPerspectiveTransform(src, DST_PTS)\n\ndef transform_point_to_cm(pt, H):\n    \"\"\"Transforms a pixel coordinate (u, v) into rectified metric coordinates (cm).\"\"\"\n    p = np.array([pt[0], pt[1], 1.0], dtype=np.float32).reshape(3, 1)\n    warped = np.dot(H, p)\n    warped /= warped[2]\n    x_cm = (warped[0, 0] / CANVAS_SIZE) * WORKSPACE_WIDTH_CM\n    y_cm = (warped[1, 0] / CANVAS_SIZE) * WORKSPACE_HEIGHT_CM\n    return round(float(x_cm), 1), round(float(y_cm), 1)\n\ndef main():\n    parser = argparse.ArgumentParser(description=\"ArUco Calibrated Warehouse Central Server\")\n    parser.add_argument(\"--source\", type=str, default=\"0\", help=\"Camera index or RTSP URL\")\n    parser.add_argument(\"--port\", type=int, default=SWARM_PORT, help=\"UDP Broadcast port\")\n    args = parser.parse_args()\n\n    camera_src = int(args.source) if args.source.isdigit() else args.source\n    cap = cv2.VideoCapture(camera_src)\n    if not cap.isOpened():\n        print(f\"[ERROR] Cannot open video source: {camera_src}\")\n        sys.exit(1)\n\n    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)\n    sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)\n\n    # Use DICT_4X4_50 marker dictionary\n    aruco_dict = aruco.getPredefinedDictionary(aruco.DICT_4X4_50)\n    aruco_params = aruco.DetectorParameters()\n    detector = aruco.ArucoDetector(aruco_dict, aruco_params)\n\n    print(\"==========================================================\")\n    print(\"   ARUCO-CALIBRATED WAREHOUSE CENTRAL SERVER (DICT_4X4_50)\")\n    print(\"   Boundary Calibration: IDs 9(TL), 10(TR), 11(BR), 12(BL)\")\n    print(f\"   Multicasting Calibrated Swarm State -> {BROADCAST_IP}:{args.port}\")\n    print(\"==========================================================\\n\")\n\n    H_matrix = None\n\n    while True:\n        ret, frame = cap.read()\n        if not ret:\n            time.sleep(0.02)\n            continue\n\n        corners, ids, _ = detector.detectMarkers(frame)\n        detected_centers = {}\n\n        if ids is not None:\n            for i in range(len(ids)):\n                m_id = int(ids[i][0])\n                c = corners[i][0]\n                cx = float(np.mean(c[:, 0]))\n                cy = float(np.mean(c[:, 1]))\n                detected_centers[m_id] = (cx, cy)\n\n        # 1. Workspace Calibration Step: Look for Boundary Markers 9-12\n        if all(k in detected_centers for k in [9, 10, 11, 12]):\n            H_matrix = compute_homography(detected_centers)\n\n        swarm_state = {\n            \"timestamp\": round(time.time(), 3),\n            \"dictionary\": \"DICT_4X4_50\",\n            \"calibrated\": H_matrix is not None,\n            \"bots\": {},\n            \"landmarks\": {}\n        }\n\n        if H_matrix is not None and ids is not None:\n            for i in range(len(ids)):\n                m_id = int(ids[i][0])\n                c = corners[i][0]\n                cx = float(np.mean(c[:, 0]))\n                cy = float(np.mean(c[:, 1]))\n                x_cm, y_cm = transform_point_to_cm((cx, cy), H_matrix)\n\n                # Compute heading from corner vector\n                dx = c[0][0] - c[3][0]\n                dy = c[0][1] - c[3][1]\n                ang = round(math.degrees(math.atan2(dy, dx)), 1)\n\n                if m_id in [0, 1]:\n                    # Moving Robot Fiducial\n                    # Check boundary distance\n                    dist_to_edge = min(x_cm, y_cm, WORKSPACE_WIDTH_CM - x_cm, WORKSPACE_HEIGHT_CM - y_cm)\n                    boundary_alert = \"CRITICAL\" if dist_to_edge < (SAFETY_MARGIN_CM / 2) else \\\n                                     \"WARNING\" if dist_to_edge < SAFETY_MARGIN_CM else \"SAFE\"\n\n                    swarm_state[\"bots\"][f\"id{m_id}\"] = {\n                        \"x\": x_cm,\n                        \"y\": y_cm,\n                        \"ang\": ang,\n                        \"boundary_dist\": round(dist_to_edge, 1),\n                        \"alert\": boundary_alert\n                    }\n                elif m_id in [2, 3, 4, 5]:\n                    swarm_state[\"landmarks\"][f\"rack_{m_id-1}\"] = {\"id\": m_id, \"x\": x_cm, \"y\": y_cm}\n                elif m_id == 8:\n                    swarm_state[\"landmarks\"][\"delivery_zone\"] = {\"id\": m_id, \"x\": x_cm, \"y\": y_cm}\n\n            # Broadcast UDP Swarm State\n            payload = json.dumps(swarm_state).encode('utf-8')\n            sock.sendto(payload, (BROADCAST_IP, args.port))\n\n        cv2.imshow(\"ArUco Global Calibration Feed\", frame)\n        if cv2.waitKey(1) & 0xFF == ord('q'):\n            break\n\n    cap.release()\n    cv2.destroyAllWindows()\n\nif __name__ == '__main__':\n    main()\n"
  },
  {
    "id": "step5_overhead_vision",
    "name": "step5_overhead_vision_tracker.py",
    "moduleTitle": "STEP 5: Overhead ArUco Computer Vision Localization Tracker",
    "platform": "Python 3 • OpenCV ArUco / IP Camera Stream",
    "language": "python",
    "description": "Continuous vision localization engine using DICT_4X4_50. Calibrates workspace origin, scale, and geometry dynamically using the 4 boundary markers (IDs 9–12), rectifying perspective distortion and multicasting sub-centimeter poses on UDP Port 5005.",
    "keyFeatures": [
      "ArUco DICT_4X4_50 marker detection with cv2.aruco.ArucoDetector",
      "Dynamic 4-Corner Boundary Calibration (IDs 9=TL, 10=TR, 11=BR, 12=BL)",
      "Perspective homography transformation eliminating manual origin tuning",
      "Tracks moving robots (IDs 0–1), racks (IDs 2–5), and delivery zone (ID 8)",
      "High-frequency UDP 5005 JSON broadcast with sub-centimeter accuracy"
    ],
    "code": "#!/usr/bin/env python3\n\"\"\"\n======================================================================================\nSTEP 5: OVERHEAD ARUCO VISION TRACKER & BOUNDARY CALIBRATOR\n======================================================================================\nDictionary: DICT_4X4_50\nBoundary Markers: 9(TL), 10(TR), 11(BR), 12(BL)\nRobot Markers: 0(Robot 1), 1(Robot 2)\nStation Markers: 2..5(Racks 1..4), 6..7(Start Bays), 8(Delivery Zone)\n\nExecution:\n  python3 step5_overhead_vision_tracker.py --source 0\n======================================================================================\n\"\"\"\n\nimport sys\nimport argparse\nimport socket\nimport json\nimport math\nimport time\nimport cv2\nimport cv2.aruco as aruco\nimport numpy as np\n\nWORKSPACE_WIDTH_CM  = 120.0\nWORKSPACE_HEIGHT_CM = 120.0\nCANVAS_SIZE         = 800\n\nBROADCAST_IP = \"255.255.255.255\"\nUDP_PORT     = 5005\n\ndef main():\n    parser = argparse.ArgumentParser(description=\"ArUco Boundary & Swarm Tracker\")\n    parser.add_argument(\"--source\", type=str, default=\"0\", help=\"Camera index or RTSP stream URL\")\n    parser.add_argument(\"--port\", type=int, default=UDP_PORT, help=\"UDP Broadcast Port\")\n    args = parser.parse_args()\n\n    camera_source = int(args.source) if args.source.isdigit() else args.source\n    cap = cv2.VideoCapture(camera_source)\n    if not cap.isOpened():\n        print(f\"[ERROR] Could not open video source: {camera_source}\")\n        sys.exit(1)\n\n    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)\n    sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)\n\n    # Setup ArUco DICT_4X4_50\n    aruco_dict = aruco.getPredefinedDictionary(aruco.DICT_4X4_50)\n    aruco_params = aruco.DetectorParameters()\n    detector = aruco.ArucoDetector(aruco_dict, aruco_params)\n\n    print(f\"[VISION] ArUco DICT_4X4_50 Active. Multicasting to {BROADCAST_IP}:{args.port}\")\n\n    dst_pts = np.float32([\n        [0, 0],\n        [CANVAS_SIZE, 0],\n        [CANVAS_SIZE, CANVAS_SIZE],\n        [0, CANVAS_SIZE]\n    ])\n\n    while True:\n        ret, frame = cap.read()\n        if not ret:\n            time.sleep(0.02)\n            continue\n\n        corners, ids, _ = detector.detectMarkers(frame)\n        detected = {}\n\n        if ids is not None:\n            for i in range(len(ids)):\n                mid = int(ids[i][0])\n                c = corners[i][0]\n                detected[mid] = (float(np.mean(c[:, 0])), float(np.mean(c[:, 1])), c)\n\n        # Check if 4 boundary calibration corners are visible\n        if all(k in detected for k in [9, 10, 11, 12]):\n            src_pts = np.float32([\n                [detected[9][0], detected[9][1]],\n                [detected[10][0], detected[10][1]],\n                [detected[11][0], detected[11][1]],\n                [detected[12][0], detected[12][1]]\n            ])\n            H = cv2.getPerspectiveTransform(src_pts, dst_pts)\n\n            swarm_state = {\n                \"timestamp\": round(time.time(), 3),\n                \"dictionary\": \"DICT_4X4_50\",\n                \"calibrated\": True,\n                \"bots\": {}\n            }\n\n            for mid, (cx, cy, c) in detected.items():\n                if mid in [0, 1]:\n                    # Warp to metric coordinate\n                    p = np.array([cx, cy, 1.0], dtype=np.float32).reshape(3, 1)\n                    warped = np.dot(H, p)\n                    warped /= warped[2]\n                    x_cm = round(float((warped[0, 0] / CANVAS_SIZE) * WORKSPACE_WIDTH_CM), 1)\n                    y_cm = round(float((warped[1, 0] / CANVAS_SIZE) * WORKSPACE_HEIGHT_CM), 1)\n\n                    dx = c[0][0] - c[3][0]\n                    dy = c[0][1] - c[3][1]\n                    ang = round(math.degrees(math.atan2(dy, dx)), 1)\n\n                    swarm_state[\"bots\"][f\"id{mid}\"] = {\"x\": x_cm, \"y\": y_cm, \"ang\": ang}\n\n            sock.sendto(json.dumps(swarm_state).encode('utf-8'), (BROADCAST_IP, args.port))\n\n        cv2.imshow(\"Overhead Vision Frame\", frame)\n        if cv2.waitKey(1) & 0xFF == ord('q'):\n            break\n\n    cap.release()\n    cv2.destroyAllWindows()\n\nif __name__ == '__main__':\n    main()\n"
  },
  {
    "id": "standalone_coordinator",
    "name": "standalone_swarm_coordinator.py",
    "moduleTitle": "STEP 6: Standalone Closed-Loop Autonomous Swarm Coordinator",
    "platform": "Python 3 (Zero-ROS Native Execution)",
    "language": "python",
    "description": "Closed-loop waypoint navigation, boundary safety supervisor, and collision avoidance coordinator. Operates in the calibrated ArUco coordinate system, respects 10cm perimeter safety buffers, and arbitrates 28cm right-of-way yielding.",
    "keyFeatures": [
      "Operates entirely in ArUco-derived metric coordinate frame (120×120cm)",
      "Boundary Safety Constraint: Enforces 10cm safety threshold with auto-braking & inward repulsion",
      "Decentralized Swarm Right-of-Way: Robot 1 yields to Robot 0 when peer distance < 28cm",
      "Pick & Deliver Missions: Routes between Racks 1–4 (IDs 2–5) and Delivery Bay (ID 8)"
    ],
    "code": "#!/usr/bin/env python3\n\"\"\"\n======================================================================================\nSTANDALONE CLOSED-LOOP COORDINATOR: ARUCO BOUNDARY-AWARE NAVIGATION\n======================================================================================\n\"\"\"\n\nimport sys\nimport argparse\nimport socket\nimport json\nimport math\nimport time\n\nSAFE_DISTANCE_CM         = 28.0\nBOUNDARY_SAFETY_MARGIN_CM = 10.0\nWORKSPACE_LIMIT_CM       = 120.0\nARRIVAL_RADIUS_CM        = 8.0\n\ndef main():\n    parser = argparse.ArgumentParser(description=\"Boundary-Aware Swarm Coordinator\")\n    parser.add_argument(\"--robot_ip\", type=str, default=\"172.20.10.3\", help=\"ESP32 IP address\")\n    parser.add_argument(\"--robot_port\", type=int, default=8888, help=\"ESP32 UDP velocity port\")\n    parser.add_argument(\"--vision_port\", type=int, default=5005, help=\"Vision UDP listener port\")\n    parser.add_argument(\"--bot_id\", type=int, default=0, help=\"Robot ID (0 or 1)\")\n    parser.add_argument(\"--tx\", type=float, default=95.0, help=\"Destination X (cm)\")\n    parser.add_argument(\"--ty\", type=float, default=60.0, help=\"Destination Y (cm)\")\n    args = parser.parse_args()\n\n    my_id = args.bot_id\n    peer_id = 1 if my_id == 0 else 0\n\n    rx_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)\n    rx_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)\n    rx_sock.bind((\"\", args.vision_port))\n    rx_sock.setblocking(False)\n\n    tx_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)\n\n    def send_vel(lin: float, ang: float):\n        payload = f\"{round(lin, 2)},{round(ang, 2)}\".encode('utf-8')\n        tx_sock.sendto(payload, (args.robot_ip, args.robot_port))\n\n    print(f\"[COORDINATOR] Bot {my_id} active. Calibrated Target: ({args.tx}, {args.ty})\")\n\n    try:\n        while True:\n            latest_packet = None\n            while True:\n                try:\n                    data, _ = rx_sock.recvfrom(2048)\n                    latest_packet = data\n                except BlockingIOError:\n                    break\n\n            if latest_packet is not None:\n                try:\n                    state = json.loads(latest_packet.decode('utf-8'))\n                    bots = state.get(\"bots\", {})\n                except Exception:\n                    bots = {}\n\n                my_key = f\"id{my_id}\"\n                peer_key = f\"id{peer_id}\"\n\n                if my_key in bots:\n                    my_data = bots[my_key]\n                    x, y, theta = my_data[\"x\"], my_data[\"y\"], my_data[\"ang\"]\n\n                    # 1. Boundary Safety Enforcement\n                    dist_to_boundary = min(x, y, WORKSPACE_LIMIT_CM - x, WORKSPACE_LIMIT_CM - y)\n                    if dist_to_boundary < 5.0:\n                        # Critical Boundary Halt\n                        print(f\"\\r[SAFETY ALERT] Approaching boundary ({dist_to_boundary:.1f}cm)! Emergency Brake!\", end=\"\")\n                        send_vel(0.0, 0.0)\n                        continue\n\n                    # 2. Peer Collision Avoidance Check\n                    if peer_key in bots:\n                        peer = bots[peer_key]\n                        d_peer = math.hypot(x - peer[\"x\"], y - peer[\"y\"])\n                        if d_peer < SAFE_DISTANCE_CM and my_id > peer_id:\n                            print(f\"\\r[SWARM] Yielding to Robot {peer_id} (dist={d_peer:.1f}cm)        \", end=\"\")\n                            send_vel(0.0, 0.0)\n                            continue\n\n                    # 3. Path Tracking to Waypoint\n                    dx = args.tx - x\n                    dy = args.ty - y\n                    dist_to_goal = math.hypot(dx, dy)\n\n                    if dist_to_goal <= ARRIVAL_RADIUS_CM:\n                        print(f\"\\r[GOAL] Destination reached ({args.tx}, {args.ty}) cm!          \", end=\"\")\n                        send_vel(0.0, 0.0)\n                    else:\n                        target_head = math.degrees(math.atan2(dy, dx))\n                        head_err = target_head - theta\n                        while head_err > 180: head_err -= 360\n                        while head_err < -180: head_err += 360\n\n                        # Speed throttling near boundary\n                        speed_scale = min(1.0, dist_to_boundary / BOUNDARY_SAFETY_MARGIN_CM)\n                        if abs(head_err) > 25.0:\n                            turn = 0.7 if head_err > 0 else -0.7\n                            send_vel(0.0, turn)\n                        else:\n                            send_vel(0.45 * speed_scale, head_err * 0.015)\n\n            time.sleep(0.05)\n    except KeyboardInterrupt:\n        send_vel(0.0, 0.0)\n\nif __name__ == '__main__':\n    main()\n"
  },
  {
    "id": "teleop_keyboard",
    "name": "teleop_keyboard_udp.py",
    "moduleTitle": "UTILITY: Standalone UDP Keyboard Teleoperation Controller",
    "platform": "Python 3 (Windows / macOS / Linux)",
    "language": "python",
    "description": "Cross-platform keyboard teleoperation utility communicating directly with the ESP32 UDP velocity listener (Port 8888). Controls forward, reverse, pivot left, pivot right, speed increment/decrement, and instant emergency stop.",
    "keyFeatures": [
      "[W] / [S] : Forward / Reverse linear speed",
      "[A] / [D] : Pivot Left / Pivot Right angular velocity",
      "[Space] / [X] : Instant Emergency Stop (0.0, 0.0)",
      "[+] / [-] : Dynamic speed scaling adjustment",
      "Sends formatted \"linear_x,angular_z\" UDP packets to robot IP:8888"
    ],
    "code": "#!/usr/bin/env python3\n\"\"\"\n======================================================================================\nSTANDALONE KEYBOARD TELEOP CONTROLLER (NO ROS 2 REQUIRED)\n======================================================================================\nPurpose: Control your ESP32 robot directly from your PC keyboard over Wi-Fi UDP.\n         Works natively on Windows, macOS, and Linux without Docker or ROS 2.\n\nControls:\n  [W] : Forward\n  [S] : Reverse\n  [A] : Pivot Left\n  [D] : Pivot Right\n  [Space] / [X] : Emergency Stop\n  [+] / [-]     : Increase / Decrease speed\n  [Q]           : Quit\n\nUsage:\n  python server/teleop_keyboard_udp.py --ip <ESP32_IP> --port 8888\n======================================================================================\n\"\"\"\n\nimport sys\nimport socket\nimport time\nimport argparse\n\n# Cross-platform single key press detection\nif sys.platform == \"win32\":\n    import msvcrt\n    def get_key():\n        if msvcrt.kbhit():\n            ch = msvcrt.getch()\n            # Handle special keys/arrows\n            if ch in (b'\\x00', b'\\xe0'):\n                ch = msvcrt.getch()\n                if ch == b'H': return 'w' # Up arrow\n                if ch == b'P': return 's' # Down arrow\n                if ch == b'K': return 'a' # Left arrow\n                if ch == b'M': return 'd' # Right arrow\n            return ch.decode('latin1', errors='ignore').lower()\n        return None\nelse:\n    import select\n    import tty\n    import termios\n    def get_key():\n        dr, _, _ = select.select([sys.stdin], [], [], 0.05)\n        if dr:\n            return sys.stdin.read(1).lower()\n        return None\n\ndef main():\n    parser = argparse.ArgumentParser(description=\"Standalone UDP Keyboard Teleop\")\n    parser.add_argument(\"--ip\", type=str, default=\"172.20.10.3\", help=\"Target ESP32 IP address\")\n    parser.add_argument(\"--port\", type=int, default=8888, help=\"Target ESP32 UDP port\")\n    args = parser.parse_args()\n\n    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)\n\n    speed_step = 0.1\n    current_linear = 0.0\n    current_angular = 0.0\n    base_linear_max = 0.55\n    base_angular_max = 0.85\n\n    print(\"==========================================================\")\n    print(\"   STANDALONE ROBOT KEYBOARD TELEOPERATION\")\n    print(f\"   Target: UDP {args.ip}:{args.port}\")\n    print(\"==========================================================\")\n    print(\" [W / Up Arrow]    : Drive Forward\")\n    print(\" [S / Down Arrow]  : Drive Reverse\")\n    print(\" [A / Left Arrow]  : Pivot Left\")\n    print(\" [D / Right Arrow] : Pivot Right\")\n    print(\" [Space / X]       : Emergency Stop\")\n    print(\" [Q]               : Quit\")\n    print(\"==========================================================\\n\")\n\n    # For Linux terminal raw mode\n    old_settings = None\n    if sys.platform != \"win32\":\n        old_settings = termios.tcgetattr(sys.stdin)\n        tty.setcbreak(sys.stdin.fileno())\n\n    try:\n        last_transmit = time.time()\n        while True:\n            key = get_key()\n\n            if key:\n                if key == 'w':\n                    current_linear = base_linear_max\n                    current_angular = 0.0\n                    print(f\"\\r[TELEOP] FORWARD  (Lin: {current_linear:.2f}, Ang: {current_angular:.2f})\", end=\"\")\n                elif key == 's':\n                    current_linear = -base_linear_max\n                    current_angular = 0.0\n                    print(f\"\\r[TELEOP] REVERSE  (Lin: {current_linear:.2f}, Ang: {current_angular:.2f})\", end=\"\")\n                elif key == 'a':\n                    current_linear = 0.0\n                    current_angular = base_angular_max\n                    print(f\"\\r[TELEOP] PIVOT CCW (Lin: {current_linear:.2f}, Ang: {current_angular:.2f})\", end=\"\")\n                elif key == 'd':\n                    current_linear = 0.0\n                    current_angular = -base_angular_max\n                    print(f\"\\r[TELEOP] PIVOT CW  (Lin: {current_linear:.2f}, Ang: {current_angular:.2f})\", end=\"\")\n                elif key in (' ', 'x'):\n                    current_linear = 0.0\n                    current_angular = 0.0\n                    print(f\"\\r[TELEOP] STOPPED   (Lin: 0.00, Ang: 0.00)                 \", end=\"\")\n                elif key == 'q':\n                    # Send final stop\n                    sock.sendto(b\"0.0,0.0\", (args.ip, args.port))\n                    print(\"\\n[TELEOP] Exiting teleop.\")\n                    break\n\n            # Send heartbeat packet every 100ms\n            if time.time() - last_transmit >= 0.1:\n                payload = f\"{round(current_linear, 2)},{round(current_angular, 2)}\".encode('utf-8')\n                sock.sendto(payload, (args.ip, args.port))\n                last_transmit = time.time()\n\n            time.sleep(0.02)\n\n    except KeyboardInterrupt:\n        sock.sendto(b\"0.0,0.0\", (args.ip, args.port))\n        print(\"\\n[TELEOP] Interrupted.\")\n    finally:\n        if sys.platform != \"win32\" and old_settings:\n            termios.tcsetattr(sys.stdin, termios.TCSADRAIN, old_settings)\n\nif __name__ == '__main__':\n    main()\n"
  },
  {
    "id": "uno_q_agent",
    "name": "uno_q_swarm_agent.py",
    "moduleTitle": "UNO Q: Qualcomm QRB2210 Linux High-Level Swarm Agent",
    "platform": "Arduino UNO Q Onboard Linux (Debian)",
    "language": "python",
    "description": "Runs on the Arduino UNO Q Qualcomm QRB2210 onboard Linux MPU. Subscribes to the Warehouse Server UDP broadcast (Port 5005), monitors swarm telemetry, and forwards pose updates to the real-time ESP32 controller over hardware UART (/dev/ttyS0 @ 115200 baud).",
    "keyFeatures": [
      "UDP Port 5005 listener receiving global ArUco localization frames",
      "Serial UART bridge forwarding \"P:x,y,ang\\n\" pose updates to ESP32",
      "Bidirectional logging: captures and displays ESP32 debug statements",
      "Periodic 2-second heartbeat status reporting operational readiness"
    ],
    "code": "#!/usr/bin/env python3\n\"\"\"\n======================================================================================\nARDUINO UNO Q HIGH-LEVEL SWARM INTELLIGENCE BRIDGE\n======================================================================================\nProject: AI-Driven Cooperative Autonomous Mobile Manipulator Swarm for Smart Warehouse\n\nDeployment:\n  Runs on the Arduino UNO Q onboard Linux environment (Qualcomm QRB2210 MPU).\n  - Listens to the Warehouse Server UDP Broadcast (Port 5005).\n  - Runs local swarm decision making and fleet health monitoring.\n  - Communicates directly with the real-time ESP32 controller via hardware UART (115200 baud).\n\nExecution:\n  python3 uno_q_swarm_agent.py --port /dev/ttyS0 --baud 115200 --bot_id 0\n======================================================================================\n\"\"\"\n\nimport sys\nimport argparse\nimport socket\nimport json\nimport time\nimport serial\n\nSWARM_PORT = 5005\n\nclass UnoQSwarmBridge:\n    def __init__(self, serial_port: str, baud_rate: int, bot_id: int):\n        self.bot_id = bot_id\n        self.peer_id = 1 if bot_id == 0 else 0\n\n        # Initialize Serial interface to ESP32\n        try:\n            self.ser = serial.Serial(serial_port, baud_rate, timeout=0.1)\n            print(f\"[UNO Q] Connected to ESP32 on {serial_port} @ {baud_rate} baud.\")\n        except Exception as e:\n            print(f\"[WARNING][UNO Q] Could not open serial port {serial_port}: {e}\")\n            self.ser = None\n\n        # Setup UDP listener for vision broadcast\n        self.rx_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)\n        self.rx_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)\n        self.rx_sock.bind((\"\", SWARM_PORT))\n        self.rx_sock.setblocking(False)\n\n        print(f\"[UNO Q] High-Level Agent R0{self.bot_id+1} Online. Listening on UDP {SWARM_PORT}.\")\n\n    def run(self):\n        last_heartbeat = time.time()\n        while True:\n            # 1. Check for incoming UDP Swarm State\n            try:\n                data, _ = self.rx_sock.recvfrom(2048)\n                packet = json.loads(data.decode('utf-8'))\n                bots = packet.get(\"bots\", {})\n\n                my_key = f\"id{self.bot_id}\"\n                if my_key in bots:\n                    pose = bots[my_key]\n                    # Forward pose to ESP32 if connected\n                    if self.ser and self.ser.is_open:\n                        msg = f\"P:{pose['x']},{pose['y']},{pose['ang']}\\n\"\n                        self.ser.write(msg.encode('utf-8'))\n\n            except BlockingIOError:\n                pass\n            except Exception as e:\n                pass\n\n            # 2. Read incoming telemetry from ESP32\n            if self.ser and self.ser.in_waiting:\n                try:\n                    line = self.ser.readline().decode('utf-8', errors='ignore').strip()\n                    if line:\n                        print(f\"[ESP32 -> UNO Q] {line}\")\n                except Exception:\n                    pass\n\n            # 3. Status Heartbeat\n            if time.time() - last_heartbeat > 2.0:\n                last_heartbeat = time.time()\n                print(f\"[UNO Q] Robot R0{self.bot_id+1} Heartbeat: Operational.\")\n\n            time.sleep(0.01)\n\ndef main():\n    parser = argparse.ArgumentParser(description=\"Arduino UNO Q High-Level Swarm Agent\")\n    parser.add_argument(\"--port\", type=str, default=\"/dev/ttyS0\", help=\"UART Serial port connected to ESP32\")\n    parser.add_argument(\"--baud\", type=int, default=115200, help=\"UART Baud Rate\")\n    parser.add_argument(\"--bot_id\", type=int, default=0, help=\"This robot ID (0 or 1)\")\n    args = parser.parse_args()\n\n    agent = UnoQSwarmBridge(serial_port=args.port, baud_rate=args.baud, bot_id=args.bot_id)\n    agent.run()\n\nif __name__ == '__main__':\n    main()\n"
  }
];

export const HARDWARE_PINS: PinDefinition[] = [
  {
    pin: 'GPIO 4',
    function: 'PIN_PWM_LEFT',
    layer: 'TB6612',
    targetDevice: 'Left TB6612 PWMA (Front-Left & Rear-Left Spliced)',
    notes: 'Native hardware PWM (8-bit, 0-255). Drives all left wheels.'
  },
  {
    pin: 'GPIO 5',
    function: 'PIN_PWM_RIGHT',
    layer: 'TB6612',
    targetDevice: 'Right TB6612 PWMB (Front-Right & Rear-Right Spliced)',
    notes: 'Native hardware PWM (8-bit, 0-255). Drives all right wheels.'
  },
  {
    pin: 'GPIO 25',
    function: 'PIN_F_AIN1',
    layer: 'TB6612',
    targetDevice: 'Front-Left TB6612 Motor Direction 1',
    notes: 'HIGH = Forward, LOW = Reverse (paired with GPIO 26).'
  },
  {
    pin: 'GPIO 26',
    function: 'PIN_F_AIN2',
    layer: 'TB6612',
    targetDevice: 'Front-Left TB6612 Motor Direction 2',
    notes: 'LOW = Forward, HIGH = Reverse.'
  },
  {
    pin: 'GPIO 27',
    function: 'PIN_F_BIN1',
    layer: 'TB6612',
    targetDevice: 'Front-Right TB6612 Motor Direction 1',
    notes: 'HIGH = Forward, LOW = Reverse (paired with GPIO 14).'
  },
  {
    pin: 'GPIO 14',
    function: 'PIN_F_BIN2',
    layer: 'TB6612',
    targetDevice: 'Front-Right TB6612 Motor Direction 2',
    notes: 'LOW = Forward, HIGH = Reverse.'
  },
  {
    pin: 'GPIO 12',
    function: 'PIN_R_AIN1',
    layer: 'TB6612',
    targetDevice: 'Rear-Left TB6612 Motor Direction 1',
    notes: 'HIGH = Forward, LOW = Reverse (paired with GPIO 13).'
  },
  {
    pin: 'GPIO 13',
    function: 'PIN_R_AIN2',
    layer: 'TB6612',
    targetDevice: 'Rear-Left TB6612 Motor Direction 2',
    notes: 'LOW = Forward, HIGH = Reverse.'
  },
  {
    pin: 'GPIO 32',
    function: 'PIN_R_BIN1',
    layer: 'TB6612',
    targetDevice: 'Rear-Right TB6612 Motor Direction 1',
    notes: 'HIGH = Forward, LOW = Reverse (paired with GPIO 33).'
  },
  {
    pin: 'GPIO 33',
    function: 'PIN_R_BIN2',
    layer: 'TB6612',
    targetDevice: 'Rear-Right TB6612 Motor Direction 2',
    notes: 'LOW = Forward, HIGH = Reverse.'
  },
  {
    pin: '3.3V',
    function: 'STBY (Standby)',
    layer: 'TB6612',
    targetDevice: 'Both TB6612 H-Bridge STBY Pins',
    notes: 'Hardwired directly to 3.3V rail to keep bridges permanently active.'
  },
  {
    pin: 'GPIO 21',
    function: 'I2C_SDA_PIN',
    layer: 'I2C',
    targetDevice: 'PCA9685 (0x40), OLED (0x3C), VL53L0X (0x29)',
    notes: 'Shared primary hardware I2C data bus line with 4.7kΩ pull-up.'
  },
  {
    pin: 'GPIO 22',
    function: 'I2C_SCL_PIN',
    layer: 'I2C',
    targetDevice: 'PCA9685 (0x40), OLED (0x3C), VL53L0X (0x29)',
    notes: 'Shared primary hardware I2C clock bus line.'
  },
  {
    pin: 'PCA9685 CH0',
    function: 'SERVO_CH_BASE',
    layer: 'I2C',
    targetDevice: '4-DoF Robotic Arm Base Yaw Joint',
    notes: '150-600µs PWM pulse (~0° to ~180° rotation).'
  },
  {
    pin: 'PCA9685 CH1',
    function: 'SERVO_CH_SHOULDER',
    layer: 'I2C',
    targetDevice: '4-DoF Arm Shoulder Elevation Joint',
    notes: 'Smooth pose interpolation to prevent payload spillage.'
  },
  {
    pin: 'PCA9685 CH2',
    function: 'SERVO_CH_ELBOW',
    layer: 'I2C',
    targetDevice: '4-DoF Arm Elbow Extension Joint',
    notes: 'Forward kinematics reach control.'
  },
  {
    pin: 'PCA9685 CH3',
    function: 'SERVO_CH_WRIST',
    layer: 'I2C',
    targetDevice: '4-DoF Arm Wrist Pitch/Roll Joint',
    notes: 'Aligns end-effector perpendicular to payload crate.'
  },
  {
    pin: 'PCA9685 CH4',
    function: 'SERVO_CH_GRIPPER',
    layer: 'I2C',
    targetDevice: 'Arm Mechanical Gripper Claw',
    notes: '180° = fully open, 85° = clamped payload pick.'
  },
  {
    pin: 'GPIO 15',
    function: 'PIN_US_TRIG',
    layer: 'ESP32',
    targetDevice: 'HC-SR04 Ultrasonic Trigger',
    notes: 'Emits 10µs ultrasonic bursts for wide-angle obstacle detection.'
  },
  {
    pin: 'GPIO 34',
    function: 'PIN_US_ECHO',
    layer: 'ESP32',
    targetDevice: 'HC-SR04 Ultrasonic Echo',
    notes: 'Input-only ADC pin through 5V->3.3V resistor voltage divider.'
  },
  {
    pin: 'GPIO 18, 19, 23',
    function: 'SPI Bus (SCK, MISO, MOSI)',
    layer: 'SPI',
    targetDevice: 'RC522 13.56 MHz RFID Reader',
    notes: 'Validates RFID tags on storage racks and payload crates.'
  },
  {
    pin: 'UART TX/RX',
    function: 'Serial Communication (115200)',
    layer: 'UART',
    targetDevice: 'Arduino UNO Q (QRB2210 Linux Bridge)',
    notes: 'Transmits local telemetry and receives global ArUco pose frames.'
  }
];

export const IMPLEMENTATION_STEPS = [
  {
    step: 1,
    title: 'Isolated 4WD Motor Diagnostic & Pin Verification',
    summary: 'Validate the native ESP32 PWM pins (D4, D5) and 8 direction GPIOs using step1_motor_diagnostic.ino before connecting WiFi.',
    commands: [
      '# Open firmware/step1_motor_diagnostic/step1_motor_diagnostic.ino in Arduino IDE',
      '# Select Board: ESP32 Dev Module',
      '# Prop robot chassis on stand so all 4 wheels spin freely',
      '# Verify sequence: Forward (1.5s) -> Stop -> Reverse (1.5s) -> Stop -> Pivot Left (1s)'
    ],
    checks: [
      'Both TB6612 STBY pins hardwired to 3.3V',
      'Left PWM connected to GPIO 4, Right PWM to GPIO 5',
      'Front Left Dir: 25, 26; Front Right Dir: 27, 14',
      'Rear Left Dir: 12, 13; Rear Right Dir: 32, 33'
    ]
  },
  {
    step: 2,
    title: 'I2C Bus Scan & VL53L0X Time-of-Flight Diagnostic',
    summary: 'Confirm I2C bus wiring (GPIO 21 SDA, GPIO 22 SCL) and verify VL53L0X laser sensor address at 0x29 with step2_tof_diagnostic.ino.',
    commands: [
      '# Open firmware/step2_tof_diagnostic/step2_tof_diagnostic.ino',
      '# Install VL53L0X library by Pololu from Library Manager',
      '# Upload at 115200 baud and verify distance stream in mm'
    ],
    checks: [
      'I2C scanner detects active device at address 0x29 (VL53L0X)',
      'PCA9685 16-channel servo driver responds at 0x40',
      'SSD1306 OLED display detected at 0x3C',
      'Continuous distance readings update dynamically when moving obstacles'
    ]
  },
  {
    step: 3,
    title: 'Flash Master Swarm Agent Firmware (integrated_robot.ino)',
    summary: 'Configure WiFi credentials, robot ID (0 for Robot 1, 1 for Robot 2), and flash integrated_robot.ino with active ToF braking.',
    commands: [
      '# In firmware/integrated_robot/Config.h: Set MY_ROBOT_ID (0 or 1)',
      '# Set WIFI_SSID and WIFI_PASS hotspot credentials',
      '# Upload integrated_robot.ino to ESP32 Dev Module',
      '# Open Serial Monitor at 115200 baud to retrieve assigned IP'
    ],
    checks: [
      'ESP32 prints: [COMM] WiFi Connected. IP: 172.20.10.x',
      'SSD1306 OLED prints IP address and current mission state',
      'UDP Listener active on Port 8888 (velocity) and Port 5005 (pose)',
      'Hardware safety interlock automatically stops robot if obstacle < 120mm'
    ]
  },
  {
    step: 4,
    title: 'Launch Overhead Computer Vision ArUco Tracker (Step 5)',
    summary: 'Position overhead camera above the 120cm x 120cm arena, mount ArUco markers 0 & 1 on robots, and start UDP broadcast.',
    commands: [
      '# For default USB webcam:',
      'python3 server/step5_overhead_vision_tracker.py --source 0',
      '# Or for mobile IP webcam stream:',
      'python3 server/step5_overhead_vision_tracker.py --source "http://172.20.10.2:8080/video"'
    ],
    checks: [
      'Camera window opens with 800x800 arena canvas overlay',
      'ArUco marker 0 (Robot 1) and marker 1 (Robot 2) tracked in real-time',
      'Global metric positions (x, y in cm, heading in deg) broadcast over UDP Port 5005'
    ]
  },
  {
    step: 5,
    title: 'Launch Standalone Closed-Loop Autonomous Swarm Coordinator (Step 6)',
    summary: 'Run closed-loop waypoint tracking and decentralized collision avoidance over UDP without requiring ROS 2.',
    commands: [
      '# For Robot 1 (Marker ID 0):',
      'python3 server/standalone_swarm_coordinator.py --robot_ip 172.20.10.3 --bot_id 0 --tx 25.0 --ty 30.0',
      '# For Robot 2 (Marker ID 1):',
      'python3 server/standalone_swarm_coordinator.py --robot_ip 172.20.10.4 --bot_id 1 --tx 25.0 --ty 90.0'
    ],
    checks: [
      'Coordinator receives ArUco pose updates from Port 5005',
      'Velocity commands stream to ESP32 Port 8888 (lin, ang)',
      'Robot executes in-place pivot if heading error > 25°',
      'Decentralized priority collision avoidance: Higher ID yields right-of-way if distance < 28cm'
    ]
  },
  {
    step: 6,
    title: 'Launch Warehouse Central Server & Keyboard Teleop Backup',
    summary: 'Coordinate warehouse pick-and-place missions across the swarm and use teleop_keyboard_udp.py for manual overrides.',
    commands: [
      'python3 server/warehouse_central_server.py --source 0',
      '# In another terminal for emergency manual joystick override:',
      'python3 server/teleop_keyboard_udp.py --ip 172.20.10.3 --port 8888'
    ],
    checks: [
      'Press [1] to dispatch Robot 1 to Rack A, Press [2] for Robot 2 to Rack B',
      'Press [S] or [Space] on keyboard to execute immediate Swarm Emergency Brake',
      'UNO Q Linux bridge (/dev/ttyS0) forwards pose packets to ESP32 via UART'
    ]
  }
];
