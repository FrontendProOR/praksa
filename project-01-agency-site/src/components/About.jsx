import SectionHeading from "./SectionHeading.jsx";
import { ABOUT } from "../data/site.js";
import "../styles/about.css";

/**
 * Company profile and the figures supplied by the company. The note under the
 * metrics states their source so they are not read as measured statistics.
 */
function About() {
  return (
    <section
      className="section section--dark"
      id="o-nama"
      aria-labelledby="o-nama-naslov"
    >
      <div className="container about__inner">
        <div className="about__intro">
          <SectionHeading
            id="o-nama-naslov"
            eyebrow={ABOUT.eyebrow}
            title={ABOUT.title}
          />
          {ABOUT.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="about__paragraph">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="about__metrics">
          <dl className="about__metrics-list">
            {ABOUT.metrics.map((metric) => (
              <div key={metric.id} className="about__metric">
                <dt className="about__metric-label">{metric.label}</dt>
                <dd className="about__metric-value">{metric.value}</dd>
              </div>
            ))}
          </dl>
          <p className="about__metrics-note">{ABOUT.metricsNote}</p>
        </div>
      </div>
    </section>
  );
}

export default About;
