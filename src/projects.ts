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
  tags: string[];
  repository?: string;
  featured?: boolean;
  previewImage?: string;
  gallery: ProjectMedia[];
};

// Add future projects here. Put images in public/projects/<project-slug>/,
// then reference them as projects/<project-slug>/<filename>.
export const projects: Project[] = [
  {
    slug: 'occupancy-grid-compression',
    name: 'Occupancy Grid Compression',
    eyebrow: 'C++17 · TELEMETRY · ROBOTICS',
    summary: 'A modular pipeline for moving robot map data across constrained links.',
    overview: [
      'The system tiles 100×100 occupancy grids, applies run-length encoding and interchangeable count coders, then rebuilds the original map at the receiver.',
      'A packet layer fragments the compressed stream and uses CRC-16 checks to detect corruption. The architecture keeps compression, packetization, transport, and reconstruction independently testable.',
    ],
    sections: [
      { eyebrow: 'THE CONSTRAINT', title: 'Move more map with fewer bytes.', body: 'Occupancy grids are useful but expensive to transmit over a constrained radio link. The pipeline breaks the map into manageable tiles so each stage can operate locally and recover predictably.' },
      { eyebrow: 'THE PIPELINE', title: 'Compression stays interchangeable.', body: 'Run-length encoding captures repeated cell values, while pluggable count coders make it possible to compare representation strategies without rewriting packet or reconstruction logic.' },
      { eyebrow: 'THE LINK', title: 'Packets protect the boundary.', body: 'The encoded stream is fragmented into a defined wire format with CRC-16 integrity checks. The receiver validates, reassembles, decodes, and places every tile back into the reconstructed grid.' },
    ],
    tags: ['CMake', 'RLE', 'Rice coding', 'CRC-16', 'LoRa roadmap'],
    repository: 'https://github.com/MuhammadTA2/Occupancy-Grid-Compression',
    featured: true,
    previewImage: 'projects/occupancy-grid-compression/hardware-overview.jpg',
    gallery: [
      {
        type: 'image',
        src: 'projects/occupancy-grid-compression/hardware-overview.jpg',
        alt: 'Four-wheel omnidirectional robot platform on a laboratory workbench',
        caption: 'Robot platform used for mapping and telemetry experiments.',
        wide: true,
      },
      {
        type: 'video',
        src: 'projects/occupancy-grid-compression/hardware-demo-02.mp4',
        poster: 'projects/occupancy-grid-compression/hardware-demo-02-poster.jpg',
        title: 'Omnidirectional robot laboratory test',
        caption: 'The mobile robot operating during a laboratory test.',
        portrait: true,
      },
      {
        type: 'image',
        src: 'projects/occupancy-grid-compression/hardware-detail.jpg',
        alt: 'Top-down view of the robot electronics, ESP32, breadboards, wiring, and battery packs',
        caption: 'ESP32 control electronics, motor wiring, and onboard power.',
      },
      {
        type: 'video',
        src: 'projects/occupancy-grid-compression/compression-software-demo.mp4',
        poster: 'projects/occupancy-grid-compression/compression-software-demo-poster.jpg',
        title: 'Occupancy-grid mapping presentation',
        caption: 'Mapping concepts and the compression workflow explained onscreen.',
        wide: true,
      },
      {
        type: 'video',
        src: 'projects/occupancy-grid-compression/compression-walkthrough.mp4',
        poster: 'projects/occupancy-grid-compression/compression-walkthrough-poster.jpg',
        title: 'Compression implementation walkthrough',
        caption: 'Source-level walkthrough of the compression and transport implementation.',
        wide: true,
      },
      {
        type: 'video',
        src: 'projects/occupancy-grid-compression/hardware-demo-01.mp4',
        poster: 'projects/occupancy-grid-compression/hardware-demo-01-poster.jpg',
        title: 'Additional project footage',
        caption: 'Additional footage recorded during the project build.',
        wide: true,
      },
    ],
  },
  {
    slug: 'pid-line-following-robot',
    name: 'PID Line-Following Robot',
    eyebrow: 'ESP32 · CONTROL · SENSING',
    summary: 'Closed-loop motor control driven by a calibrated seven-photoresistor sensor array.',
    overview: [
      'The firmware calibrates its sensor array against the course, converts the readings into a weighted line-error signal, and continuously adjusts two motors with PID control.',
      'Serial diagnostics expose sensor values and controller behavior during tuning, while PWM output translates the calculated correction into real-time motion.',
    ],
    sections: [
      { eyebrow: 'THE SIGNAL', title: 'Seven sensors become one error value.', body: 'Calibration establishes the light and dark range for each photoresistor. Normalized readings are combined into a weighted position estimate that tells the controller how far the robot is from the line.' },
      { eyebrow: 'THE LOOP', title: 'Correction becomes motion.', body: 'A PID controller turns the latest line error into a steering correction. Differential PWM commands speed one motor while slowing the other, continuously pulling the chassis back toward the path.' },
      { eyebrow: 'THE TUNING', title: 'Diagnostics make behavior visible.', body: 'Serial output exposes live sensor and controller values during calibration and tuning, connecting visible robot behavior to the numbers that produced it.' },
    ],
    tags: ['Arduino C++', 'PID', 'PWM', 'Calibration'],
    repository: 'https://github.com/MuhammadTA2/ece5RobotCode',
    gallery: [],
  },
];
