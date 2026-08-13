import SectionHeading from "./SectionHeading.jsx";
import { TECHNOLOGY } from "../data/site.js";
import "../styles/technology.css";

/** Technology the team works with, grouped by layer. */
function Technology() {
  return (
    <section
      className="section section--alt"
      id="tehnologije"
      aria-labelledby="tehnologije-naslov"
    >
      <div className="container">
        <SectionHeading
          id="tehnologije-naslov"
          eyebrow={TECHNOLOGY.eyebrow}
          title={TECHNOLOGY.title}
          description={TECHNOLOGY.description}
        />

        <ul className="tech__grid">
          {TECHNOLOGY.groups.map((group) => (
            <li key={group.id} className="card tech-group">
              <h3 className="tech-group__label">{group.label}</h3>
              <ul className="tech-group__items">
                {group.items.map((item) => (
                  <li key={item} className="tech-chip">
                    {item}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        <p className="tech__note">{TECHNOLOGY.note}</p>
      </div>
    </section>
  );
}

export default Technology;
