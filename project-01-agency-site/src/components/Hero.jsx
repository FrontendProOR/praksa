import { HERO } from "../data/site.js";
import "../styles/hero.css";

/**
 * Opening section: agency positioning, the two calls to action and a
 * decorative composition built purely from CSS/layout (no external image).
 */
function Hero() {
  return (
    <section className="hero" id="pocetna" aria-labelledby="pocetna-naslov">
      <div className="container hero__inner">
        <div className="hero__content">
          <p className="eyebrow">{HERO.eyebrow}</p>
          <h1 id="pocetna-naslov" className="hero__title">
            {HERO.title}
          </h1>
          <p className="lead hero__lead">{HERO.lead}</p>

          <div className="hero__actions">
            <a className="btn btn--primary" href={HERO.primaryCta.href}>
              {HERO.primaryCta.label}
            </a>
            <a className="btn btn--secondary" href={HERO.secondaryCta.href}>
              {HERO.secondaryCta.label}
            </a>
          </div>
        </div>

        {/* Decorative only - hidden from assistive technology. */}
        <div className="hero__visual" aria-hidden="true">
          <div className="hero-window">
            <div className="hero-window__bar">
              <span className="hero-window__dot" />
              <span className="hero-window__dot" />
              <span className="hero-window__dot" />
              <span className="hero-window__address" />
            </div>

            <div className="hero-window__body">
              <div className="hero-window__rail">
                <span className="hero-window__rail-item hero-window__rail-item--active" />
                <span className="hero-window__rail-item" />
                <span className="hero-window__rail-item" />
                <span className="hero-window__rail-item" />
              </div>

              <div className="hero-window__main">
                <span className="hero-window__line hero-window__line--title" />
                <span className="hero-window__line hero-window__line--wide" />
                <span className="hero-window__line hero-window__line--narrow" />

                <div className="hero-window__cards">
                  <span className="hero-window__card" />
                  <span className="hero-window__card" />
                  <span className="hero-window__card" />
                </div>

                <div className="hero-window__chart">
                  <span className="hero-window__chart-bar" style={{ height: "38%" }} />
                  <span className="hero-window__chart-bar" style={{ height: "62%" }} />
                  <span className="hero-window__chart-bar" style={{ height: "48%" }} />
                  <span className="hero-window__chart-bar" style={{ height: "84%" }} />
                  <span className="hero-window__chart-bar" style={{ height: "70%" }} />
                </div>
              </div>
            </div>
          </div>

          <span className="hero__shape hero__shape--square" />
          <span className="hero__shape hero__shape--circle" />
        </div>
      </div>
    </section>
  );
}

export default Hero;
