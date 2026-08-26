import { useEffect, useState } from 'react';
import { projects, type Project } from './projects';

const githubProfile = 'https://github.com/MuhammadTA2';
const siteUrl = 'https://muhammadta2.github.io/ECE5_website/';

type Route =
  | { kind: 'home'; section?: 'about' }
  | { kind: 'projects' }
  | { kind: 'project'; slug: string; project?: Project };

function getRoute(): Route {
  const path = window.location.hash.replace(/^#\/?/, '').replace(/\/$/, '');
  if (path === 'projects') return { kind: 'projects' };
  if (path === 'about') return { kind: 'home', section: 'about' };
  if (path.startsWith('projects/')) {
    const slug = decodeURIComponent(path.slice('projects/'.length));
    return { kind: 'project', slug, project: projects.find((item) => item.slug === slug) };
  }
  return { kind: 'home' };
}

function setMeta(name: string, content: string) {
  document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.setAttribute('content', content);
}

function setPropertyMeta(property: string, content: string) {
  document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)?.setAttribute('content', content);
}

function assetUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}

export function App() {
  const [route, setRoute] = useState<Route>(getRoute);

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const project = route.kind === 'project' ? route.project : undefined;
    const title = project
      ? `${project.name} · Muhammad Abouelkhir`
      : route.kind === 'projects'
        ? 'Projects · Muhammad Abouelkhir'
        : 'Muhammad Abouelkhir · Engineering Portfolio';
    const description = project?.summary
      ?? (route.kind === 'projects'
        ? 'Explore Muhammad Abouelkhir’s embedded systems, robotics, telemetry, and software projects.'
        : 'Muhammad Abouelkhir builds embedded systems, robotics controls, and bandwidth-aware telemetry software.');

    document.title = title;
    setMeta('description', description);
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setPropertyMeta('og:title', title);
    setPropertyMeta('og:description', description);
    setPropertyMeta('og:url', `${siteUrl}${window.location.hash}`);

    const projectImage = project?.previewImage ? `${siteUrl}${project.previewImage}` : `${siteUrl}og.png`;
    setMeta('twitter:image', projectImage);
    setPropertyMeta('og:image', projectImage);

    if (route.kind === 'home' && route.section === 'about') {
      window.setTimeout(() => document.getElementById('about')?.scrollIntoView(), 0);
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [route]);

  if (route.kind === 'projects') return <ProjectsPage />;
  if (route.kind === 'project') return route.project
    ? <ProjectPage project={route.project} />
    : <NotFoundPage />;
  return <HomePage />;
}

function SiteHeader({ active }: { active: 'home' | 'projects' }) {
  return <header className="site-header">
    <a className="wordmark" href="#/" aria-label="Muhammad Abouelkhir, home">
      <span>MA</span><strong>Muhammad Abouelkhir</strong>
    </a>
    <nav aria-label="Primary navigation">
      <a className={active === 'home' ? 'active' : ''} href="#/" aria-current={active === 'home' ? 'page' : undefined}>Home</a>
      <a className={active === 'projects' ? 'active' : ''} href="#/projects" aria-current={active === 'projects' ? 'page' : undefined}>Projects <sup>{String(projects.length).padStart(2, '0')}</sup></a>
      <a href="#/about">About</a>
      <a className="nav-cta" href={githubProfile} target="_blank" rel="noreferrer">GitHub ↗</a>
    </nav>
  </header>;
}

function HomePage() {
  return <main>
    <SiteHeader active="home" />

    <section className="hero" id="top">
      <div className="hero-copy">
        <p className="kicker"><span /> Electrical &amp; computer engineering</p>
        <h1>Engineering systems that <em>move, map,</em> and communicate.</h1>
        <p className="hero-intro">I build across the boundary between hardware and software—from closed-loop robot control to bandwidth-aware telemetry.</p>
        <div className="hero-actions">
          <a className="button button-primary" href="#/projects">Explore projects <span>→</span></a>
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

    <section className="project-preview" aria-labelledby="work-title">
      <div className="section-label"><span>01 / Selected work</span><p>Each preview opens a dedicated page with the project story, technical breakdown, media, and source links.</p></div>
      <div className="section-heading-row">
        <h2 id="work-title">From raw signal<br />to reliable result.</h2>
        <a className="text-link" href="#/projects">View every project →</a>
      </div>
      <div className="preview-grid">
        {projects.slice(0, 2).map((project, index) => <ProjectCard key={project.slug} project={project} index={index} />)}
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

    <ContactSection index="04" />
    <Footer />
  </main>;
}

function ProjectsPage() {
  return <main className="projects-page">
    <SiteHeader active="projects" />
    <section className="projects-hero">
      <p className="kicker"><span /> Project index · {String(projects.length).padStart(2, '0')} documented builds</p>
      <h1>Every build,<br /><em>one place.</em></h1>
      <p>Browse the complete project archive. Each tab opens its own page with the problem, implementation, images, and technical links.</p>
    </section>

    <nav className="project-tabs" aria-label="Project pages">
      {projects.map((project, index) => <a href={`#/projects/${project.slug}`} key={project.slug}>
        <span>{String(index + 1).padStart(2, '0')}</span>
        <strong>{project.name}</strong>
        <small>{project.eyebrow}</small>
        <b aria-hidden="true">→</b>
      </a>)}
    </nav>

    <section className="project-library" aria-labelledby="library-title">
      <div className="section-label"><span>PROJECT LIBRARY</span><p id="library-title">Preview images, names, and summaries are all controlled from one project-data file.</p></div>
      <div className="library-grid">
        {projects.map((project, index) => <ProjectCard key={project.slug} project={project} index={index} />)}
      </div>
    </section>

    <section className="catalog-note">
      <span>BUILT TO GROW</span>
      <h2>New project, same clean structure.</h2>
      <p>Every project supports a preview image, full-width cover, descriptive sections, an image gallery, technology tags, and a source link.</p>
    </section>
    <Footer />
  </main>;
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return <a className={`project-card ${project.featured ? 'featured' : ''}`} href={`#/projects/${project.slug}`}>
    <ProjectVisual project={project} index={index} compact />
    <div className="project-card-copy">
      <p><span>P.{String(index + 1).padStart(2, '0')}</span>{project.eyebrow}</p>
      <h3>{project.name}</h3>
      <p className="project-description">{project.summary}</p>
      <ul className="project-tags">{project.tags.slice(0, 4).map((tag) => <li key={tag}>{tag}</li>)}</ul>
      <span className="card-link">Open project page <b>→</b></span>
    </div>
  </a>;
}

function ProjectVisual({ project, index, compact = false }: { project: Project; index: number; compact?: boolean }) {
  if (project.previewImage) {
    return <div className={`project-visual has-image ${compact ? 'compact' : ''}`}>
      <img src={assetUrl(project.previewImage)} alt={`${project.name} preview`} />
    </div>;
  }

  return <div className={`project-visual generated-visual visual-${index % 3} ${compact ? 'compact' : ''}`} aria-label={`${project.name} technical placeholder`}>
    <span className="visual-grid" aria-hidden="true" />
    <span className="visual-orbit orbit-one" aria-hidden="true" />
    <span className="visual-orbit orbit-two" aria-hidden="true" />
    <div><small>PROJECT / {String(index + 1).padStart(2, '0')}</small><strong>{project.name}</strong><span>TECHNICAL FIELD NOTE</span></div>
  </div>;
}

function ProjectPage({ project }: { project: Project }) {
  const index = projects.findIndex((item) => item.slug === project.slug);
  const nextProject = projects[(index + 1) % projects.length];

  return <main className="project-page">
    <SiteHeader active="projects" />
    <article>
      <header className="project-detail-hero">
        <div className="project-breadcrumb"><a href="#/projects">Projects</a><span>/</span><span>{String(index + 1).padStart(2, '0')}</span></div>
        <div className="project-title-layout">
          <div className="project-title-copy">
            <p className="kicker"><span /> {project.eyebrow}</p>
            <h1>{project.name}</h1>
            <p className="detail-summary">{project.summary}</p>
            <ul className="project-tags">{project.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
            {project.repository && <a className="button button-primary" href={project.repository} target="_blank" rel="noreferrer">View source on GitHub <span>↗</span></a>}
          </div>
          <ProjectVisual project={project} index={index} />
        </div>
      </header>

      <section className="project-overview" aria-labelledby="overview-title">
        <div><span>01 / OVERVIEW</span><h2 id="overview-title">Inside the system.</h2></div>
        <div>{project.overview.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      </section>

      <section className="detail-sections" aria-label="Technical breakdown">
        {project.sections.map((section, sectionIndex) => <article key={section.title}>
          <span>{String(sectionIndex + 2).padStart(2, '0')}</span>
          <p>{section.eyebrow}</p>
          <h2>{section.title}</h2>
          <p>{section.body}</p>
        </article>)}
      </section>

      {project.gallery.length > 0 && <section className="project-gallery" aria-labelledby="gallery-title">
        <div className="section-label"><span>MEDIA / BUILD LOG</span><h2 id="gallery-title">Process &amp; details.</h2></div>
        <div className="gallery-grid">{project.gallery.map((image, imageIndex) => <figure key={image.src} className={imageIndex % 3 === 0 ? 'wide' : ''}>
          <img src={assetUrl(image.src)} alt={image.alt} loading="lazy" />
          {image.caption && <figcaption><span>{String(imageIndex + 1).padStart(2, '0')}</span>{image.caption}</figcaption>}
        </figure>)}</div>
      </section>}

      <nav className="next-project" aria-label="Next project">
        <span>NEXT PROJECT</span>
        <a href={`#/projects/${nextProject.slug}`}><strong>{nextProject.name}</strong><b>→</b></a>
      </nav>
    </article>
    <Footer />
  </main>;
}

function NotFoundPage() {
  return <main className="not-found">
    <SiteHeader active="projects" />
    <section><p>404 / PROJECT NOT FOUND</p><h1>This build isn’t in the archive.</h1><a className="button button-primary" href="#/projects">Browse all projects <span>→</span></a></section>
    <Footer />
  </main>;
}

function ContactSection({ index }: { index: string }) {
  return <section className="contact" aria-labelledby="contact-title">
    <p>{index} / LET’S BUILD</p>
    <h2 id="contact-title">Have a hard systems problem?</h2>
    <div><p>Explore the code, follow the work, or reach out through GitHub.</p><a className="button contact-button" href={githubProfile} target="_blank" rel="noreferrer">Open GitHub profile <span>↗</span></a></div>
  </section>;
}

function Footer() {
  return <footer><span>© {new Date().getFullYear()} Muhammad Abouelkhir</span><span>Built in TypeScript · Hosted on GitHub Pages</span><a href="#/">Back home ↑</a></footer>;
}
