import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "about — what's on",
  description: "About what's on — a personal football and tennis schedule tracker.",
};

export default function AboutPage() {
  return (
    <div className="app-shell">
      <div className="app-header">
        <div className="header-top">
          <Link href="/" className="app-title" style={{ textDecoration: 'none' }}>
            what's <span>on</span>
          </Link>

          <div className="header-right">
            <Link href="/" className="about-link">← Schedule</Link>
          </div>
        </div>
      </div>

      <main className="about-body">
        <section className="about-section">
          <p className="about-p">
            A personal app for tracking football and tennis matches in one view.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-h">What's covered</h2>
          <div className="coverage-table">
            <div className="coverage-row">
              <div className="coverage-sport">
                <span className="sport-dot green" />
                <span className="coverage-label">football</span>
              </div>
              <div className="coverage-leagues">
                EPL, WSL, UCL, UEL, UWCL, World Cup
              </div>
            </div>
            <div className="coverage-row">
              <div className="coverage-sport">
                <span className="sport-dot blue" />
                <span className="coverage-label">tennis</span>
              </div>
              <div className="coverage-leagues">
                Grand Slams, Masters 1000 / WTA 1000, year-end finals
              </div>
            </div>
          </div>
          <p className="about-p" style={{ marginTop: 12 }}>
            This selection is tailored to my personal interest. If you'd like to create a customized version, check out the GitHub repo at{' '}
            <a
              href="https://github.com/fly-16/whats-on-tracker"
              target="_blank"
              rel="noopener noreferrer"
              className="about-a"
            >
              fly-16/whats-on-tracker
            </a>
            .
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-h">Data</h2>
          <p className="about-p">
            The unofficial{' '}
            <a
              href="https://github.com/pseudo-r/Public-ESPN-API"
              target="_blank"
              rel="noopener noreferrer"
              className="about-a"
            >
              ESPN Public API
            </a>
            . Limited to what ESPN carries; may change without notice.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-h">Credits</h2>
          <dl className="credits-list">
            <div className="credits-row">
              <dt>code</dt>
              <dd>Claude Code</dd>
            </div>
            <div className="credits-row">
              <dt>illustrations</dt>
              <dd>Gemini</dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  );
}
