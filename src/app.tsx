const githubProfile = 'https://github.com/MuhammadTA2';

export function App() {
  return <main>
    <header className="site-header">
      <a className="wordmark" href="#top" aria-label="Muhammad Abouelkhir, home">
        <span>MA</span><strong>Muhammad Abouelkhir</strong>
      </a>
      <nav aria-label="Primary navigation">
        <a href="#work">Work</a>
        <a href="#about">About</a>
        <a className="nav-cta" href={githubProfile} target="_blank" rel="noreferrer">GitHub ↗</a>
      </nav>
    </header>

    <section className="hero" id="top">
      <div className="hero-copy">
        <p className="kicker"><span /> Electrical &amp; computer engineering</p>
        <h1>Engineering systems that <em>move, map,</em> and communicate.</h1>
        <p className="hero-intro">I build across the boundary between hardware and software—from closed-loop robot control to bandwidth-aware telemetry.</p>
        <div className="hero-actions">
          <a className="button button-primary" href="#work">Explore selected work <span>↓</span></a>
          <a className="text-link" href={githubProfile} target="_blank" rel="noreferrer">github.com/MuhammadTA2 ↗</a>
        </div>
      </div>
      <div className="signal-panel" aria-label="Engineering focus areas">
        <div className="panel-head"><span>LIVE SYSTEM MAP</span><span className="live-dot">ACTIVE</span></div>
        <div className="signal-map" aria-hidden="true">
          <span className="trace trace-a" /><span className="trace trace-b" /><span className="trace trace-c" />
          <div className="node node-sense"><small>01</small><strong>SENSE</strong><span>photoresistors<br />occupancy grids</span></div>
          <div className="node node-compute"><small>02</small><strong>COMPUTE</strong><span>PID control<br />compression</span></div>
          <div className="node node-link"><small>03</small><strong>LINK</strong><span>packets + CRC<br />LoRa roadmap</span></div>
        </div>
        <div className="panel-foot"><span>C++ / ESP32</span><span>TYPE-SAFE SYSTEMS</span><span>TESTED PIPELINES</span></div>
      </div>
    </section>

    <section className="project-preview" id="work" aria-labelledby="work-title">
      <div className="section-label"><span>01 / Selected work</span><p>Projects built to learn the whole system, not just one layer.</p></div>
      <h2 id="work-title">From raw signal<br />to reliable result.</h2>
      <div className="preview-grid">
        <a className="preview-card featured" href="https://github.com/MuhammadTA2/Occupancy-Grid-Compression" target="_blank" rel="noreferrer">
          <span className="project-number">P.01 / FEATURED</span><div><p>C++17 · TELEMETRY · ROBOTICS</p><h3>Occupancy Grid Compression</h3><p className="project-description">A modular pipeline for moving robot map data across constrained links. The system tiles 100×100 occupancy grids, applies RLE and interchangeable count coders, fragments streams into CRC-protected packets, and reconstructs the map at the receiver.</p><ul className="project-tags"><li>CMake</li><li>RLE</li><li>Rice coding</li><li>CRC-16</li><li>LoRa roadmap</li></ul><span>Explore source and wire spec ↗</span></div>
        </a>
        <a className="preview-card" href="https://github.com/MuhammadTA2/ece5RobotCode" target="_blank" rel="noreferrer">
          <span className="project-number">P.02</span><div><p>ESP32 · CONTROL · SENSING</p><h3>PID Line-Following Robot</h3><p className="project-description">Embedded control software for a two-motor robot using a seven-photoresistor array. The firmware calibrates against the course, computes weighted line error, and turns that signal into real-time PID motor commands.</p><ul className="project-tags"><li>Arduino C++</li><li>PID</li><li>PWM</li><li>Calibration</li></ul><span>Inspect firmware ↗</span></div>
        </a>
      </div>
    </section>

    <section className="capabilities" aria-labelledby="capabilities-title">
      <div className="section-label"><span>02 / Capabilities</span><p>Comfortable moving from a physical signal to a software model, then proving the path back to reality.</p></div>
      <div className="capability-layout">
        <h2 id="capabilities-title">Build the loop.<br /><em>Measure the result.</em></h2>
        <div className="capability-list">
          <article><span>01</span><div><h3>Embedded control</h3><p>ESP32 and Arduino development, sensor calibration, PWM motor drive, PID tuning, and serial diagnostics.</p></div></article>
          <article><span>02</span><div><h3>Data &amp; telemetry</h3><p>Compact representations, RLE and entropy coding, packet formats, integrity checks, reassembly, and link-aware design.</p></div></article>
          <article><span>03</span><div><h3>Software architecture</h3><p>Modern C++, CMake, modular interfaces, explicit wire contracts, unit tests, and maintainable boundaries between subsystems.</p></div></article>
          <article><span>04</span><div><h3>Web systems</h3><p>TypeScript, React, GitHub Actions, static deployment, accessible interfaces, and security-conscious delivery.</p></div></article>
        </div>
      </div>
      <div className="tool-rail" aria-label="Tools and technologies"><span>C++17</span><span>ESP32</span><span>CMake</span><span>Arduino</span><span>Git</span><span>TypeScript</span><span>React</span><span>GitHub Actions</span></div>
    </section>

    <section className="about" id="about" aria-labelledby="about-title">
      <div className="about-index">03 / ABOUT</div>
      <div className="about-copy">
        <p className="kicker"><span /> Systems-minded engineering</p>
        <h2 id="about-title">I like projects where software has to answer to the physical world.</h2>
        <p>My work sits where sensing, computation, and communication meet. I’m interested in robotics and autonomous systems—especially the details that turn a promising demo into a dependable system: calibration, bandwidth, error handling, testability, and clear interfaces.</p>
        <p>Right now I’m extending an occupancy-grid telemetry stack toward adaptive compression, LoRa transport, retransmission, and hardware-in-the-loop testing.</p>
      </div>
      <aside className="principles" aria-label="Engineering principles">
        <p>WORKING PRINCIPLES</p>
        <ol><li><span>01</span>Make the data path explicit.</li><li><span>02</span>Measure before optimizing.</li><li><span>03</span>Design failures into the test plan.</li><li><span>04</span>Keep hardware replaceable.</li></ol>
      </aside>
    </section>

    <section className="contact" aria-labelledby="contact-title">
      <p>04 / LET’S BUILD</p>
      <h2 id="contact-title">Have a hard systems problem?</h2>
      <div><p>Explore the code, follow the work, or reach out through GitHub.</p><a className="button contact-button" href={githubProfile} target="_blank" rel="noreferrer">Open GitHub profile <span>↗</span></a></div>
    </section>

    <footer><span>© {new Date().getFullYear()} Muhammad Abouelkhir</span><span>Built in TypeScript · Hosted on GitHub Pages</span><a href="#top">Back to top ↑</a></footer>
  </main>;
}
