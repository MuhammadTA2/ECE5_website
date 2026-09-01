export type ProjectMedia =
  | {
      type: 'image';
      src: string;
      alt: string;
      caption?: string;
      wide?: boolean;
    }
  | {
      type: 'video';
      src: string;
      poster: string;
      title: string;
      caption?: string;
      wide?: boolean;
      portrait?: boolean;
    };

export type CodeHighlight = {
  eyebrow: string;
  title: string;
  description: string;
  language: string;
  file: string;
  sourceUrl: string;
  startLine: number;
  code: string;
};

export type Project = {
  slug: string;
  name: string;
  eyebrow: string;
  summary: string;
  overview: string[];
  sections: Array<{
    eyebrow: string;
    title: string;
    body: string;
  }>;
  codeHighlights?: CodeHighlight[];
  tags: string[];
  repository?: string;
  featured?: boolean;
  previewImage?: string;
  gallery: ProjectMedia[];
};

// Put assets in:
// public/projects/<project-slug>/
//
// Reference them as:
// projects/<project-slug>/<filename>

export const projects: Project[] = [
  {
    slug: 'occupancy-grid-compression',
    name: 'Occupancy Grid Compression',
    eyebrow: 'C++17 · TELEMETRY · ROBOTICS',
    summary:
      'A modular pipeline for moving robot map data across constrained links.',

    overview: [
      'The system tiles 100×100 occupancy grids, applies run-length encoding and interchangeable count coders, then rebuilds the original map at the receiver.',
      'A packet layer fragments the compressed stream and uses CRC-16 checks to detect corruption. The architecture keeps compression, packetization, transport, and reconstruction independently testable.',
    ],

    sections: [
      {
        eyebrow: 'THE CONSTRAINT',
        title: 'Move more map with fewer bytes.',
        body:
          'Occupancy grids are useful but expensive to transmit over a constrained radio link. The pipeline breaks the map into manageable tiles so each stage can operate locally and recover predictably.',
      },
      {
        eyebrow: 'THE PIPELINE',
        title: 'Compression stays interchangeable.',
        body:
          'Run-length encoding captures repeated cell values, while pluggable count coders make it possible to compare representation strategies without rewriting packet or reconstruction logic.',
      },
      {
        eyebrow: 'THE LINK',
        title: 'Packets protect the boundary.',
        body:
          'The encoded stream is fragmented into a defined wire format with CRC-16 integrity checks. The receiver validates, reassembles, decodes, and places every tile back into the reconstructed grid.',
      },
    ],

    codeHighlights: [
      {
        eyebrow: 'RLE / ENCODE',
        title: 'Collapse repeated cells into runs.',
        description:
          'The encoder walks the symbol stream once, pairing each cell value with its repeat count. A run is deliberately capped before the 16-bit counter can wrap and corrupt the decoded map.',
        language: 'C++',
        file: 'src/rle.cpp',
        sourceUrl:
          'https://github.com/MuhammadTA2/Occupancy-Grid-Compression/blob/main/src/rle.cpp#L5-L23',
        startLine: 5,
        code: `RLERuns rleEncode(const std::vector<uint8_t>& data){
    RLERuns runs;
    if(data.empty()) return runs;

    size_t i = 0;
    while(i < data.size()){
        uint8_t value = data[i];
        uint16_t count = 0;

        while(i < data.size() && data[i] == value && count < 65535){
            count++;
            i++;
        }

        runs.values.push_back(value);
        runs.counts.push_back(count);
    }

    return runs;
}`,
      },

      {
        eyebrow: 'INTEGRITY / CRC-16-CCITT',
        title: 'Turn corruption into a hard rejection.',
        description:
          'Every serialized packet carries a CRC calculated over its header and payload. The receiver repeats the same calculation and rejects the packet instead of attempting to decode bytes that changed in transit.',
        language: 'C++',
        file: 'src/packetizer.cpp',
        sourceUrl:
          'https://github.com/MuhammadTA2/Occupancy-Grid-Compression/blob/main/src/packetizer.cpp#L6-L16',
        startLine: 6,
        code: `uint16_t crc16(const std::vector<uint8_t>& data){
    uint16_t crc = 0xFFFF;

    for(uint8_t byte : data){
        crc ^= static_cast<uint16_t>(byte) << 8;

        for(int i = 0; i < 8; i++){
            if(crc & 0x8000u)
                crc = static_cast<uint16_t>((crc << 1) ^ 0x1021);
            else
                crc = static_cast<uint16_t>(crc << 1);
        }
    }

    return crc;
}`,
      },

      {
        eyebrow: 'TRANSPORT / PACKETIZATION',
        title: 'Split one stream into ordered fragments.',
        description:
          'The packetizer calculates exactly how many payload-sized fragments are required, then stamps each one with a message, stream, position, total count, and actual payload length for deterministic reassembly.',
        language: 'C++',
        file: 'src/packetizer.cpp',
        sourceUrl:
          'https://github.com/MuhammadTA2/Occupancy-Grid-Compression/blob/main/src/packetizer.cpp#L18-L39',
        startLine: 18,
        code: `std::vector<Packet> fragment(
    uint16_t messageId,
    uint8_t streamId,
    const std::vector<uint8_t>& data
){
    std::vector<Packet> packets;

    size_t totalFragments =
        data.empty()
        ? 1
        : (data.size() + MAX_PAYLOAD_SIZE - 1) / MAX_PAYLOAD_SIZE;

    for(size_t i = 0; i < totalFragments; i++){
        size_t start = i * MAX_PAYLOAD_SIZE;
        size_t len =
            data.empty()
            ? 0
            : std::min(MAX_PAYLOAD_SIZE, data.size() - start);

        Packet p;
        p.header.version = 1;
        p.header.messageId = messageId;
        p.header.streamId = streamId;
        p.header.fragmentIndex = static_cast<uint16_t>(i);
        p.header.totalFragments =
            static_cast<uint16_t>(totalFragments);
        p.header.payloadLength = static_cast<uint8_t>(len);

        p.payload.assign(
            data.begin() + static_cast<long>(start),
            data.begin() + static_cast<long>(start + len)
        );

        packets.push_back(std::move(p));
    }

    return packets;
}`,
      },
    ],

    tags: ['CMake', 'RLE', 'Rice coding', 'CRC-16', 'LoRa roadmap'],

    repository:
      'https://github.com/MuhammadTA2/Occupancy-Grid-Compression',

    featured: true,

    previewImage:
      'projects/occupancy-grid-compression/oc-intro-poster.png',

    gallery: [
      {
        type: 'video',
        src: 'projects/occupancy-grid-compression/oc-intro.mp4',
        poster:
          'projects/occupancy-grid-compression/oc-intro-poster.png',
        title: 'Kratos introduction',
        caption: 'Introduction to Kratos and our team.',
        wide: true,
      },

      {
        type: 'video',
        src:
          'projects/occupancy-grid-compression/hardware-demo-02.mp4',
        poster:
          'projects/occupancy-grid-compression/hardware-demo-02-poster.jpg',
        title: 'Omnidirectional robot laboratory test',
        caption:
          'First test of communications, controls, and motors being integrated.',
        portrait: true,
      },

      {
        type: 'image',
        src:
          'projects/occupancy-grid-compression/hardware-detail.jpg',
        alt:
          'Top-down view of the robot electronics, ESP32, breadboards, wiring, and battery packs',
        caption:
          'ESP32 control electronics, motor wiring, and onboard power.',
      },

      {
        type: 'video',
        src:
          'projects/occupancy-grid-compression/compression-software-demo.mp4',
        poster:
          'projects/occupancy-grid-compression/compression-software-demo-poster.jpg',
        title: 'Occupancy-grid mapping presentation',
        caption:
          'Mapping concepts and the compression workflow explained by Tri Cao.',
        wide: true,
      },

      {
        type: 'video',
        src:
          'projects/occupancy-grid-compression/compression-walkthrough.mp4',
        poster:
          'projects/occupancy-grid-compression/compression-walkthrough-poster.jpg',
        title: 'Compression implementation walkthrough',
        caption:
          'Source-level walkthrough of the compression and transport implementation explained by Muhammad Abouelkhir.',
        wide: true,
      },

      {
        type: 'video',
        src:
          'projects/occupancy-grid-compression/hardware-demo-01.mp4',
        poster:
          'projects/occupancy-grid-compression/hardware-demo-01-poster.jpg',
        title: 'Additional project footage',
        caption: 'First working test of wireless communications.',
        wide: true,
      },
    ],
  },

  {
  slug: 'pid-line-following-robot',
  name: 'PID Line-Following Robot',
  eyebrow: 'ESP32 · CONTROL · SENSING · SOLDERING',

  summary:
    'Closed-loop motor control driven by a calibrated seven-photoresistor sensor array.',

  overview: [
    'The firmware calibrates its sensor array against the course, converts the readings into a weighted line-error signal, and continuously adjusts two motors with PID control.',
    'Serial diagnostics expose sensor values and controller behavior during tuning, while PWM output translates the calculated correction into real-time motion.',
  ],

  sections: [
    {
      eyebrow: 'THE SIGNAL',
      title: 'Seven sensors become one error value.',
      body:
        'Calibration establishes the light and dark range for each photoresistor. Normalized readings are combined into a weighted position estimate that tells the controller how far the robot is from the line.',
    },
    {
      eyebrow: 'THE LOOP',
      title: 'Correction becomes motion.',
      body:
        'A PID controller turns the latest line error into a steering correction. Differential PWM commands speed one motor while slowing the other, continuously pulling the chassis back toward the path.',
    },
    {
      eyebrow: 'THE TUNING',
      title: 'Diagnostics make behavior visible.',
      body:
        'Serial output exposes live sensor and controller values during calibration and tuning, connecting visible robot behavior to the numbers that produced it.',
    },
  ],

  codeHighlights: [
    {
      eyebrow: 'SENSING / ERROR ESTIMATION',
      title: 'Convert seven photoresistors into one line error.',
      description:
        'The controller identifies the strongest sensor response, includes its neighboring sensors, and computes a weighted position estimate. The result becomes the signed error used by the PID controller.',
      language: 'Arduino C++',
      file: 'Line Following Robot PID',
      sourceUrl: 'https://github.com/MuhammadTA2/ece5RobotCode/blob/main/LF_original.ino',
      startLine: 295,
      code: `void CalcError() {
  MxRead = -99;
  AveRead = 0.0;

  for (int i = 0; i < totalPhotoResistors; i++) {
    if (MxRead < LDR[i]) {
      MxRead = LDR[i];
      MxIndex = -1 * (i - 3);
      highestPResistor = (float)i;
    }

    AveRead =
      AveRead +
      (float)LDR[i] / (float)totalPhotoResistors;
  }

  CriteriaForMax = 1.5;

  if (MxRead > CriteriaForMax * AveRead) {

    if (highestPResistor != 0)
      leftHighestPR = highestPResistor - 1;
    else
      leftHighestPR = highestPResistor;

    if (highestPResistor != totalPhotoResistors - 1)
      rightHighestPR = highestPResistor + 1;
    else
      rightHighestPR = highestPResistor;

    float numerator =
      (float)(LDR[leftHighestPR] * leftHighestPR) +
      (float)(LDR[highestPResistor] * highestPResistor) +
      (float)(LDR[rightHighestPR] * rightHighestPR);

    float denominator =
      (float)LDR[leftHighestPR] +
      (float)LDR[highestPResistor] +
      (float)LDR[rightHighestPR];

    WeightedAve = numerator / denominator;

    error =
      WeightedAve -
      totalPhotoResistors / 2;
  }
}`,
    },

    {
      eyebrow: 'CONTROL / PID',
      title: 'Turn line error into a steering correction.',
      description:
        'The proportional term reacts to current position error, the integral term accumulates persistent bias, and the derivative term responds to changes in error. Integral limiting helps prevent windup.',
      language: 'Arduino C++',
      file: 'Line Following Robot PID',
      sourceUrl: 'https://github.com/MuhammadTA2/ece5RobotCode/blob/main/LF_original.ino',
      startLine: 335,
      code: `void PID_Turn() {
  kP = (float)kPRead * 1.;
  kI = (float)kIRead * 0.001;
  kD = (float)kDRead * 0.01;

  Turn =
    error * kP +
    sumerror * kI +
    (error - lasterror) * kD;

  if (sumerror > 5)
    sumerror = 5;
  else if (sumerror < -5)
    sumerror = -5;

  if (error == 0)
    sumerror = 0;

  if (Turn < 0) {
    M1P = -Turn;
    M2P = Turn;
  }
  else if (Turn > 0) {
    M1P = -Turn;
    M2P = Turn;
  }
  else {
    M1P = 0;
    M2P = 0;
  }

  lasterror = error;
  sumerror = sumerror + error;
}`,
    },

    {
      eyebrow: 'ACTUATION / PWM',
      title: 'Translate controller output into motor motion.',
      description:
        'Each motor is driven through two ESP32 PWM outputs. The sign of the requested speed selects motor direction while the magnitude determines PWM duty cycle.',
      language: 'Arduino C++',
      file: 'Line Following Robot PID',
      sourceUrl: 'https://github.com/MuhammadTA2/ece5RobotCode/blob/main/LF_original.ino',
      startLine: 270,
      code: `void runMotorAtSpeed(side _side, int speed) {

  if (_side == LEFT) {

    if (speed > 0) {
      ledcWrite(M1H, speed);
      ledcWrite(M1L, 0);
    }
    else {
      ledcWrite(M1H, 0);
      ledcWrite(M1L, abs(speed));
    }
  }

  if (_side == RIGHT) {

    if (speed > 0) {
      ledcWrite(M2H, speed);
      ledcWrite(M2L, 0);
    }
    else {
      ledcWrite(M2H, 0);
      ledcWrite(M2L, abs(speed));
    }
  }
}`,
    },
  ],

  tags: [
    'Arduino C++',
    'ESP32',
    'PID',
    'PWM',
    'Calibration',
    'Soldering',
  ],

  repository:
    'https://github.com/MuhammadTA2/ece5RobotCode',

  previewImage:
    'projects/pid-line-following-robot/tin-lightshield.jpg',

  gallery: [
    {
      type: 'image',
      src:
        'projects/pid-line-following-robot/chassis-model.jpg',
      alt:
        'Onshape CAD model of the proposed line-following robot chassis and front sensor array',
      caption:
        'CAD concept for the custom chassis and front-mounted sensor array.',
    },

    {
      type: 'image',
      src:
        'projects/pid-line-following-robot/breadboarded-prototype.jpg',
      alt:
        'Breadboarded PID line-following robot prototype on a lab bench with an ESP32, photoresistors, wheels, and wire harness',
      caption:
        'Early breadboarded prototype used to bring up the ESP32, sensor array, and motor drive.',
    },

    {
      type: 'image',
      src:
        'projects/pid-line-following-robot/tin-lightshield.jpg',
      alt:
        'Line-following robot prototype following a black tape track with a foil light shield around the front sensor array',
      caption:
        'Temporary foil light shield added around the front sensor array to reduce ambient-light interference.',
    },

    {
      type: 'video',
      src:
        'projects/pid-line-following-robot/first-test-PID.mp4',
      poster:
        'projects/pid-line-following-robot/first-test-poster.png',
      title: 'First PID line-following test',
      caption:
        'First closed-loop test of the PID line-following controller on the taped course.',
      portrait: true,
    },
  ],
},
];
