import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import {
  Heart,
  ArrowRight,
  Shield,
  Users,
  Brain,
  Search,
  Menu,
  X,
  FlaskRound,
  BarChart3,
  Calendar,
  Smartphone,
  MapPin,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ArrowUp,
} from 'lucide-react';
import './HomePage.css';
import { RecoveryRoadLogoMark } from '../components/common/RecoveryRoadLogoMark';
import facilityFrontImg from '../assets/doctorimagee.jpg';
import facilityRearImg from '../assets/treatment.jpg';

const HERO_IMG =
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=85&w=900';

const SCROLL_SHOW_MIN = 40;

/** Reliable document scroll Y (avoids NaN / stale branch combos from Math.max on misreported values). */
function getScrollY() {
  if (typeof window === 'undefined') return 0;
  const y = window.scrollY ?? window.pageYOffset;
  if (typeof y === 'number' && Number.isFinite(y)) return y;
  const se = typeof document !== 'undefined' ? document.scrollingElement : null;
  if (se && typeof se.scrollTop === 'number' && Number.isFinite(se.scrollTop)) return se.scrollTop;
  const elTop = document.documentElement?.scrollTop;
  const bodyTop = document.body?.scrollTop;
  const fallback = Math.max(
    typeof elTop === 'number' && Number.isFinite(elTop) ? elTop : 0,
    typeof bodyTop === 'number' && Number.isFinite(bodyTop) ? bodyTop : 0,
  );
  return fallback;
}

/**
 * Scroll-triggered variants — repeating when scrolling up/down past the section.
 * Each section can use a different motion so the page doesn’t feel monotonous.
 */
const SECTION_VARIANTS = {
  tiltIn: {
    initial: { opacity: 0, y: 40, rotateX: 11, scale: 0.98 },
    enter: { opacity: 1, y: 0, rotateX: 0, scale: 1 },
    transition: { type: 'spring', stiffness: 68, damping: 24, mass: 0.85 },
    origin: '50% 8%',
    perspective: true,
  },
  fromLeft: {
    initial: { opacity: 0, x: -56 },
    enter: { opacity: 1, x: 0 },
    transition: { type: 'spring', stiffness: 74, damping: 26, mass: 0.9 },
    perspective: false,
  },
  fromRight: {
    initial: { opacity: 0, x: 56 },
    enter: { opacity: 1, x: 0 },
    transition: { type: 'spring', stiffness: 74, damping: 26, mass: 0.9 },
    perspective: false,
  },
  popUp: {
    initial: { opacity: 0, scale: 0.86, rotateZ: -1.8 },
    enter: { opacity: 1, scale: 1, rotateZ: 0 },
    transition: { type: 'spring', stiffness: 200, damping: 26, mass: 0.75 },
    origin: '50% 90%',
    perspective: false,
  },
  riseSmooth: {
    initial: { opacity: 0, y: 36 },
    enter: { opacity: 1, y: 0 },
    transition: { type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.68 },
    perspective: false,
  },
  zoomBlur: {
    initial: { opacity: 0, scale: 0.94, filter: 'blur(8px)' },
    enter: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    transition: { type: 'tween', ease: [0.19, 1, 0.32, 1], duration: 0.78 },
    perspective: false,
  },
};

function SectionReveal({ children, delay = 0, variant = 'tiltIn' }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return children;

  const cfg = SECTION_VARIANTS[variant] || SECTION_VARIANTS.tiltIn;

  return (
    <div
      className={
        cfg.perspective
          ? 'rr-med-section-reveal rr-med-section-reveal--persp'
          : 'rr-med-section-reveal'
      }
    >
      <motion.div
        className="rr-med-section-reveal-inner"
        initial={cfg.initial}
        whileInView={cfg.enter}
        viewport={{
          once: false,
          amount: 0.12,
          margin: '0px 0px -10% 0px',
        }}
        transition={{ ...cfg.transition, delay }}
        style={{
          transformStyle: cfg.perspective ? 'preserve-3d' : undefined,
          transformOrigin: cfg.origin || '50% 50%',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/** Duplicated strip + CSS animation = seamless infinite horizontal scroll */
function PartnerMarquee({ brands }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div className="rr-med-partners-static" role="list" aria-label="Partner organizations">
        {brands.map((p) => (
          <div key={p.label} role="listitem" className="rr-med-partner-chip" style={{ borderColor: p.hue }}>
            <span className="rr-med-partner-name" style={{ color: p.hue }}>
              {p.label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  const group = (suffix) => (
    <div className="rr-med-partners-marquee-group" aria-hidden={suffix === 'b' ? true : undefined}>
      {brands.map((p, idx) => (
        <div
          key={`${suffix}-${idx}-${p.label}`}
          className="rr-med-partner-chip"
          style={{ borderColor: p.hue }}
        >
          <span className="rr-med-partner-name" style={{ color: p.hue }}>
            {p.label}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div
      className="rr-med-partners-marquee-outer"
      role="region"
      aria-label="Partner organizations scrolling"
    >
      <div className="rr-med-partners-marquee-inner">
        <div className="rr-med-partners-marquee-track">
          {group('a')}
          {group('b')}
        </div>
      </div>
    </div>
  );
}

/** Subtle pointer-based 3D tilt — spring-smoothed targets (no raw MV jitter / scale fighting) */
function Tilt3DCard({ className, children }) {
  const ref = useRef(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const springCfg = { stiffness: 110, damping: 32, mass: 0.85 };
  const sx = useSpring(x, springCfg);
  const sy = useSpring(y, springCfg);
  const rotateX = useTransform(sy, [0, 1], [5, -5]);
  const rotateY = useTransform(sx, [0, 1], [-6, 6]);

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    x.set(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
    y.set(Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)));
  };

  const onLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <div className="rr-med-tilt-shell">
      <motion.div
        ref={ref}
        className={className}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          transformPerspective: 1100,
          backfaceVisibility: 'hidden',
        }}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        <div className="rr-med-tilt-inner">{children}</div>
      </motion.div>
    </div>
  );
}

const HomePage = () => {
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef(null);

  const [headerVisible, setHeaderVisible] = useState(true);
  const [scrollStarted, setScrollStarted] = useState(false);

  const lastScrollY = useRef(0);

  /* Freeze rubber-band overscroll on this route */
  useEffect(() => {
    document.documentElement.classList.add('rr-med-overscroll');
    document.body.classList.add('rr-med-overscroll', 'rr-med-page-body');
    return () => {
      document.documentElement.classList.remove('rr-med-overscroll');
      document.body.classList.remove('rr-med-overscroll', 'rr-med-page-body');
    };
  }, []);

  /* Hide header on scroll down, show on scroll up; always visible near top */
  useEffect(() => {
    const run = () => {
      const y = getScrollY();
      const prev = lastScrollY.current;
      setScrollStarted(y > SCROLL_SHOW_MIN);
      if (y < 72) {
        setHeaderVisible(true);
      } else if (y > prev + 2) {
        setHeaderVisible(false);
      } else if (y < prev - 2) {
        setHeaderVisible(true);
      }
      lastScrollY.current = y;
    };

    /* Coalesce to rAF — don’t drop the last event: always schedule one pending update */
    let raf = null;
    const schedule = () => {
      if (raf != null) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        run();
      });
    };

    lastScrollY.current = getScrollY();
    run();

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('wheel', schedule, { passive: true });
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    vv?.addEventListener('scroll', schedule, { passive: true });
    vv?.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('wheel', schedule);
      vv?.removeEventListener('scroll', schedule);
      vv?.removeEventListener('resize', schedule);
      window.removeEventListener('resize', schedule);
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const navSections = [
    ['Recovery plans', '#services'],
    ['Care team', '#doctors'],
    ['Partners', '#partners'],
    ['Platforms', '#facilities'],
    ['Stories', '#testimonials'],
    ['Contact', '#contact'],
  ];

  const navTo = (href) => {
    setNavOpen(false);
    const id = href.replace('#', '');
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const servicesEight = [
    {
      icon: Shield,
      title: 'Safety & escalation',
      text: 'Configurable alerts so supervisors intervene before small slips become setbacks.',
      long: 'Triggers from missed check-ins or risk inputs route to the right responder with full timeline context.',
    },
    {
      icon: Heart,
      title: 'Patient engagement',
      text: 'Goals, mood notes, and appointment nudges that feel supportive—not clinical cold.',
      long: 'Keep individuals grounded with digestible dashboards and humane microcopy baked into every workflow.',
    },
    {
      icon: FlaskRound,
      title: 'Assessments & reviews',
      text: 'Standardized questionnaires with longitudinal views for clinicians and auditors.',
      long: 'Capture structured screenings while surfacing deltas week over week inside the NGO console.',
    },
    {
      icon: Brain,
      title: 'Behavioral workflows',
      text: 'Flows tuned for addiction recovery, co-occurring care, and community programs.',
      long: 'Milestones inherit stage-aware templates but stay editable by supervising clinicians.',
    },
    {
      icon: Users,
      title: 'Supervisor workspaces',
      text: 'Queues, tagging, and handoffs so no caseload balloons out of sight.',
      long: 'Workload transparency helps leadership balance coverage across regions.',
    },
    {
      icon: BarChart3,
      title: 'Impact metrics',
      text: 'Live engagement and outcome tiles for admins without exporting CSV chaos.',
      long: 'Drill downs respect role privacy while still powering board-ready storytelling.',
    },
    {
      icon: Calendar,
      title: 'Attendance rhythm',
      text: 'Visits sync to reminders across mobile and web portals.',
      long: 'No-show patterns highlight who needs proactive outreach sooner.',
    },
    {
      icon: Smartphone,
      title: 'Mobile-first access',
      text: 'Touch-friendly surfaces for bedside rounds and field nonprofits alike.',
      long: 'Responsive layouts mirror desktop permissions so supervisors keep working offline-friendly.',
    },
  ];

  const doctors = [
    {
      name: 'Dr. Alex Morgan',
      ageLine: '12 yrs specialty practice',
      field: 'Addiction Medicine',
      img: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=480',
    },
    {
      name: 'Dr. Priya Sharma',
      ageLine: '9 yrs nonprofit programs',
      field: 'Behavioral Health Lead',
      img: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=480',
    },
    {
      name: 'Dr. Jordan Ellis',
      ageLine: '15 yrs peer services',
      field: 'Clinical Operations',
      img: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=480',
    },
  ];

  const partnerBrands = [
    { label: 'ClearPath', hue: '#1a56b4' },
    { label: 'HealBridge', hue: '#0f766e' },
    { label: 'AnchorCare', hue: '#7c3aed' },
    { label: 'RiseTogether', hue: '#c2410c' },
    { label: 'KindMetrics', hue: '#0e7490' },
    { label: 'VitalSprings', hue: '#0369a1' },
    { label: 'CompassAid', hue: '#854d0e' },
    { label: 'BeaconNGO', hue: '#7e22ce' },
    { label: 'UnityHealth', hue: '#b45309' },
    { label: 'NorthStar HR', hue: '#0d9488' },
  ];

  const testimonials = [
    {
      quote:
        'RecoveryRoad finally gave my supervisor the timeline they needed—I felt seen instead of punished for asking for help.',
      name: 'Andrea Reeves',
      detail: 'Recovery participant • 38',
      img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
    },
    {
      quote:
        'Our NGO replaced four spreadsheets overnight. Grants review now references one trusted dashboard tied to milestones.',
      name: 'Marcus Nguyen',
      detail: 'Program director • NGO partner',
      img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    },
    {
      quote:
        'Escalations surface with context—not panic alerts. Morning rounds moved from 90-minute syncs to 20 focused minutes.',
      name: 'Elena Ortiz',
      detail: 'Lead supervisor • 44',
      img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    },
  ];

  return (
    <div className="rr-med">
      <header
        className={`rr-med-header ${headerVisible ? 'rr-med-header--show' : 'rr-med-header--hide'}`}
        aria-hidden={!headerVisible}
      >
        <div className="rr-med-shell rr-med-header-row">
          <button type="button" className="rr-med-logo-btn" onClick={scrollTop} aria-label="Recovery Road home">
            <span className="rr-med-logo-mark-wrap" aria-hidden>
              <RecoveryRoadLogoMark className="rr-med-logo-mark-svg text-white" title="" />
            </span>
            <span className="rr-med-logo-title">
              <span className="rr-med-logo-word">Recovery</span>
              <span className="rr-med-logo-road"> Road</span>
            </span>
          </button>

          <nav className={`rr-med-nav ${navOpen ? 'rr-med-nav--open' : ''}`} aria-label="Page sections">
            {navSections.map(([label, href]) => (
              <button
                key={href}
                type="button"
                className="rr-med-nav-link"
                onClick={() => navTo(href)}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="rr-med-actions">
            <div className={`rr-med-search-wrap ${searchOpen ? 'rr-med-search-wrap--open' : ''}`}>
              <button
                type="button"
                className="rr-med-search-icon"
                aria-expanded={searchOpen}
                aria-label={searchOpen ? 'Close section search' : 'Search sections'}
                onClick={() => setSearchOpen((s) => !s)}
              >
                <Search size={20} strokeWidth={2} aria-hidden />
              </button>
              <label className="rr-med-search-field">
                <span className="rr-med-sr-only">Filter sections visually</span>
                <input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Jump to wording…"
                  className="rr-med-search-input"
                  aria-hidden={!searchOpen}
                  tabIndex={searchOpen ? 0 : -1}
                  onBlur={() => setSearchOpen(false)}
                />
              </label>
            </div>
            <button type="button" className="rr-med-login-link" onClick={() => navigate('/login')}>
              Login
            </button>
            <button
              type="button"
              className="rr-med-menu-toggle"
              aria-expanded={navOpen}
              aria-label={navOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setNavOpen((o) => !o)}
            >
              {navOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="rr-med-main">
        {/* Hero — reference layout: blobs + circular clinician */}
        <section className="rr-med-hero" aria-labelledby="rr-hero-heading">
          <SectionReveal variant="fromLeft">
            <div className="rr-med-shell rr-med-hero-grid">
            <div className="rr-med-hero-copy">
              <h1 id="rr-hero-heading" className="rr-med-hero-title">
                Every strong recovery starts with{' '}
                <span className="rr-med-hero-highlight">trusted, coordinated care.</span>
              </h1>
              <p className="rr-med-hero-sub">
                RecoveryRoad keeps patients, supervisors, NGOs, and administrators aligned with one secure view of
                plans, milestones, messaging, and measurable outcomes—the same calm professionalism you expect from a
                leading health system, purpose-built for recovery journeys.
              </p>
              <div className="rr-med-hero-btns">
                <motion.button
                  type="button"
                  className="rr-med-btn rr-med-btn-primary"
                  onClick={() => navigate('/login?flow=register')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  Request access
                  <ArrowRight size={18} aria-hidden />
                </motion.button>
                <motion.button
                  type="button"
                  className="rr-med-btn rr-med-btn-secondary"
                  onClick={() => navTo('#services')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                >
                  Learn more
                </motion.button>
              </div>
            </div>

            <div className="rr-med-hero-visual">
              <div className="rr-med-blob rr-med-blob--a" aria-hidden />
              <div className="rr-med-blob rr-med-blob--b" aria-hidden />

              <motion.div
                className="rr-med-hero-photo-ring"
                initial={{ opacity: 0.4, rotateX: 22, rotateY: -14, scale: 0.94 }}
                whileInView={{ opacity: 1, rotateX: 0, rotateY: 0, scale: 1 }}
                viewport={{ once: false, amount: 0.25, margin: '-12% 0px -18% 0px' }}
                transition={{ type: 'spring', stiffness: 72, damping: 22, mass: 0.9 }}
                style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
                whileHover={{ rotateY: 3, rotateX: -2, scale: 1.015 }}
              >
                <div className="rr-med-circle-frame">
                  <img
                    src={HERO_IMG}
                    alt=""
                    className="rr-med-circle-photo"
                    decoding="async"
                  />
                  <Heart className="rr-med-photo-badge" strokeWidth={1.85} aria-hidden />
                </div>
              </motion.div>
            </div>
          </div>
          </SectionReveal>
        </section>

        <section id="services" className="rr-med-section rr-med-section--a">
          <SectionReveal variant="fromRight" delay={0.04}>
          <div className="rr-med-shell">
            <h2 className="rr-med-h2-center">
              Our services
            </h2>
            <p className="rr-med-intro-center">
              Two rows of purposeful modules—from crisis-aware routing to cheerful mobile check-ins—all narrated with
              your mission in mind instead of filler copy.
            </p>

            <div className="rr-med-services-grid">
              {servicesEight.map((s) => (
                <Tilt3DCard key={s.title} className="rr-med-service-card">
                  <span className="rr-med-svc-icon-wrap" aria-hidden>
                    <s.icon className="rr-med-svc-icon" strokeWidth={1.85} />
                  </span>
                  <h3 className="rr-med-svc-title">{s.title}</h3>
                  <p className="rr-med-svc-text">{s.text}</p>
                  <p className="rr-med-svc-long">{s.long}</p>
                </Tilt3DCard>
              ))}
            </div>
          </div>
          </SectionReveal>
        </section>

        <section id="doctors" className="rr-med-section rr-med-section--b">
          <SectionReveal variant="popUp" delay={0.06}>
          <div className="rr-med-shell">
            <h2 className="rr-med-h2-center">Our doctors</h2>
            <p className="rr-med-intro-center">
              Physician partners who steward clinical nuance behind every RecoveryRoad rollout—balancing empathy with
              auditable safeguards.
            </p>

            <div className="rr-med-docs-grid">
              {doctors.map((d) => (
                <motion.article
                  key={d.name}
                  className="rr-med-doc-card"
                  initial={{ opacity: 0.25, rotateY: 22, z: -16 }}
                  whileInView={{ opacity: 1, rotateY: 0, z: 0 }}
                  viewport={{ once: false, amount: 0.2, margin: '0px 0px -12% 0px' }}
                  transition={{ type: 'spring', stiffness: 85, damping: 24, mass: 0.85 }}
                  style={{ transformStyle: 'preserve-3d' }}
                  whileHover={{ rotateY: 4, rotateX: -2.5, z: 6 }}
                >
                  <img src={d.img} alt="" className="rr-med-doc-photo" loading="lazy" />
                  <div className="rr-med-doc-body">
                    <h3 className="rr-med-doc-name">
                      {d.name}, <span className="rr-med-doc-age">{d.ageLine}</span>
                    </h3>
                    <p className="rr-med-doc-field">{d.field}</p>
                  </div>
                </motion.article>
              ))}
            </div>

            <div className="rr-med-see-all">
              <button type="button" className="rr-med-see-all-link" onClick={() => navigate('/login?flow=register')}>
                See all
              </button>
              <span className="rr-med-see-all-rule" aria-hidden />
            </div>
          </div>
          </SectionReveal>
        </section>

        <section id="partners" className="rr-med-section rr-med-section--soft">
          <div className="rr-med-shell">
            <SectionReveal variant="riseSmooth" delay={0.04}>
              <div className="rr-med-partners-heading">
                <h2 className="rr-med-h2-center">Our health partners</h2>
                <p className="rr-med-intro-center">
                  Recovery-focused nonprofits, payer pilots, and community hospitals that lend their playbooks—so ROI is
                  measured in lives, not vanity metrics.
                </p>
              </div>
            </SectionReveal>
            <PartnerMarquee brands={partnerBrands} />
          </div>
        </section>

        <section id="facilities" className="rr-med-section rr-med-section--c">
          <SectionReveal variant="zoomBlur" delay={0.04}>
          <div className="rr-med-shell rr-med-fac-grid">
            <motion.div
              className="rr-med-fac-copy"
              initial={{ opacity: 0, x: -44, rotateY: -6 }}
              whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
              viewport={{ once: false, amount: 0.22 }}
              transition={{ duration: 0.5 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <h2 className="rr-med-fac-title">Our facilities</h2>
              <p className="rr-med-fac-lead">
                Clinical facilities are the backbone of modern recovery systems—RecoveryRoad mirrors that reliability
                in software.
              </p>
              <p className="rr-med-fac-body">
                Whether you operate brick-and-mortar clinics, mobile outreach, or hybrid NGO networks, the platform
                layers permissions, documentation, and analytics so distributed teams feel as grounded as a flagship
                hospital floor.
              </p>
              <motion.button
                type="button"
                className="rr-med-btn rr-med-btn-primary"
                onClick={() => navTo('#contact')}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Find out more
                <ArrowRight size={18} aria-hidden />
              </motion.button>
            </motion.div>

            <div className="rr-med-fac-visual">
              <motion.div
                className="rr-med-fac-img rr-med-fac-img--front"
                initial={{ opacity: 0.2, rotateY: -24, rotateX: -4 }}
                whileInView={{ opacity: 1, rotateY: 0, rotateX: 0 }}
                viewport={{ once: false, amount: 0.18 }}
                transition={{ type: 'spring', stiffness: 84, damping: 16 }}
                style={{ transformStyle: 'preserve-3d' }}
                whileHover={{ rotateY: 5, rotateX: -3 }}
              >
                <img
                  src={facilityFrontImg}
                  alt="Clinical care team discussing a patient treatment plan"
                  loading="lazy"
                />
              </motion.div>
              <motion.div
                className="rr-med-fac-img rr-med-fac-img--rear"
                initial={{ opacity: 0.2, rotateY: 24, rotateX: 4 }}
                whileInView={{ opacity: 1, rotateY: 0, rotateX: 0 }}
                viewport={{ once: false, amount: 0.18 }}
                transition={{ type: 'spring', stiffness: 84, damping: 16 }}
                style={{ transformStyle: 'preserve-3d' }}
                whileHover={{ rotateY: -6, rotateX: 4 }}
              >
                <img
                  src={facilityRearImg}
                  alt="Patient-focused treatment session in a modern care setting"
                  loading="lazy"
                />
              </motion.div>
            </div>
          </div>
          </SectionReveal>
        </section>

        <section id="testimonials" className="rr-med-section rr-med-section--grey">
          <SectionReveal variant="tiltIn" delay={0.06}>
          <div className="rr-med-shell">
            <h2 className="rr-med-h2-center">What people say</h2>
            <p className="rr-med-intro-center">Voices spanning patients, NGOs, and working supervisors alike.</p>

            <div className="rr-med-testimonials">
              {testimonials.map((t) => (
                <Tilt3DCard key={t.name} className="rr-med-test-card">
                  <blockquote className="rr-med-test-quote">{t.quote}</blockquote>
                  <div className="rr-med-test-foot">
                    <img src={t.img} alt="" className="rr-med-test-avatar" loading="lazy" />
                    <div>
                      <p className="rr-med-test-name">{t.name}</p>
                      <p className="rr-med-test-detail">{t.detail}</p>
                    </div>
                  </div>
                </Tilt3DCard>
              ))}
            </div>
          </div>
          </SectionReveal>
        </section>
      </main>

      <footer id="contact" className="rr-med-footer">
        <div className="rr-med-shell rr-med-footer-inner">
          <div className="rr-med-footer-cols">
            <div className="rr-med-footer-brand">
              <div className="rr-med-logo-btn rr-med-footer-logo" aria-hidden>
                <span className="rr-med-logo-mark-wrap">
                  <RecoveryRoadLogoMark className="rr-med-logo-mark-svg text-white" title="" />
                </span>
                <span className="rr-med-logo-title">
                  <span className="rr-med-logo-word">Recovery</span>
                  <span className="rr-med-logo-road"> Road</span>
                </span>
              </div>
              <p className="rr-med-footer-about">
                Technology that protects dignity while aligning payers, frontline NGOs, families, and patients around
                the same truthful recovery roadmap.
              </p>
              <Heart className="rr-med-footer-icon" aria-hidden strokeWidth={1.5} />
            </div>

            <nav className="rr-med-footer-nav" aria-label="Recover">
              <h3 className="rr-med-ft-head">Recover</h3>
              <button type="button" onClick={scrollTop} className="rr-med-ft-link">
                Home
              </button>
              <button type="button" onClick={() => navTo('#services')} className="rr-med-ft-link">
                Patient care paths
              </button>
              <button type="button" onClick={() => navTo('#doctors')} className="rr-med-ft-link">
                Clinical advisers
              </button>
              <button type="button" onClick={() => navTo('#partners')} className="rr-med-ft-link">
                Coalition partners
              </button>
            </nav>

            <nav className="rr-med-footer-nav" aria-label="About">
              <h3 className="rr-med-ft-head">About</h3>
              <span className="rr-med-ft-muted">Mission pillars</span>
              <span className="rr-med-ft-muted">Research & audits</span>
              <button type="button" onClick={() => navTo('#facilities')} className="rr-med-ft-link">
                Implementation footprint
              </button>
              <button type="button" className="rr-med-ft-link" onClick={() => navigate('/login')}>
                Sign in securely
              </button>
            </nav>

            <div className="rr-med-footer-nav">
              <h3 className="rr-med-ft-head">Social media</h3>
              <div className="rr-ft-social-icons">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <Twitter size={20} />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <Facebook size={20} />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <Instagram size={20} />
                </a>
              </div>
            </div>

            <address className="rr-med-footer-nav rr-med-footer-contact">
              <h3 className="rr-med-ft-head">Contact</h3>
              <p className="rr-ft-line">
                <MapPin size={18} aria-hidden />
                <span>
                  RecoveryRoad HQ Suite
                  <br />
                  Portland, ME 04102
                </span>
              </p>
              <p className="rr-ft-line">
                <Phone size={18} aria-hidden />
                <a href="tel:+18005559111">1 (800) 555-9111</a>
              </p>
              <p className="rr-ft-line">
                <Mail size={18} aria-hidden />
                <a href="mailto:hello@recoveryroad.app">hello@recoveryroad.app</a>
              </p>
              <div className="rr-ft-social-icons" style={{ marginTop: 8 }}>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                  <Linkedin size={20} />
                </a>
              </div>
            </address>
          </div>

          <div className="rr-ft-bottom">
            <p>&copy; {new Date().getFullYear()} RecoveryRoad+. All rights reserved.</p>
            <div className="rr-ft-legal-links">
              <span className="rr-ft-muted-link">Legal notice</span>
              <span className="rr-ft-muted-link">Cookies</span>
              <button type="button" className="rr-ft-muted-link rr-ft-muted-btn" onClick={() => navTo('#contact')}>
                Contact
              </button>
            </div>
          </div>
        </div>
      </footer>

      {createPortal(
        <motion.button
          type="button"
          className="rr-med-to-top"
          aria-label="Back to top"
          aria-hidden={!scrollStarted}
          tabIndex={scrollStarted ? 0 : -1}
          onClick={scrollTop}
          animate={
            scrollStarted ? { scale: 1, opacity: 1 } : { scale: 0.92, opacity: 0 }
          }
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          whileHover={{
            scale: scrollStarted ? 1.06 : undefined,
            boxShadow:
              '0 20px 44px rgba(26,86,180,0.4), inset 0 1px 0 rgba(255,255,255,0.65)',
            transition: { duration: 0.22 },
          }}
          style={{
            transformStyle: 'preserve-3d',
            pointerEvents: scrollStarted ? 'auto' : 'none',
          }}
        >
          <ArrowUp strokeWidth={2.35} aria-hidden />
        </motion.button>,
        document.body
      )}
    </div>
  );
};

export default HomePage;
