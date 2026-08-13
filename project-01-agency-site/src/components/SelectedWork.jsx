import SectionHeading from "./SectionHeading.jsx";
import { PROJECTS } from "../data/site.js";
import "../styles/selected-work.css";

/**
 * Selected work, described by project category only - the company supplied no
 * client names or project metrics, so none are shown.
 */
function SelectedWork() {
  return (
    <section
      className="section section--alt"
      id="projekti"
      aria-labelledby="projekti-naslov"
    >
      <div className="container">
        <SectionHeading
          id="projekti-naslov"
          eyebrow={PROJECTS.eyebrow}
          title={PROJECTS.title}
          description={PROJECTS.description}
        />

        <ul className="work__grid">
          {PROJECTS.items.map((project) => (
            <li key={project.id} className="card work-card">
              <span className="work-card__preview" aria-hidden="true">
                <span className="work-card__preview-bar" />
                <span className="work-card__preview-bar work-card__preview-bar--short" />
                <span className="work-card__preview-block" />
              </span>

              <p className="work-card__category">{project.category}</p>
              <h3 className="card__title">{project.title}</h3>
              <p className="card__text">{project.description}</p>

              <ul className="work-card__tags">
                {project.tags.map((tag) => (
                  <li key={tag} className="work-card__tag">
                    {tag}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default SelectedWork;
