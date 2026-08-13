import SectionHeading from "./SectionHeading.jsx";
import { PROCESS } from "../data/site.js";
import "../styles/process.css";

/** Five delivery steps, in order - rendered as an ordered list. */
function Process() {
  return (
    <section className="section" id="proces" aria-labelledby="proces-naslov">
      <div className="container">
        <SectionHeading
          id="proces-naslov"
          eyebrow={PROCESS.eyebrow}
          title={PROCESS.title}
          description={PROCESS.description}
        />

        <ol className="process__steps">
          {PROCESS.steps.map((step, index) => (
            <li key={step.id} className="process-step">
              <span className="process-step__marker" aria-hidden="true">
                {index + 1}
              </span>
              <h3 className="process-step__title">{step.title}</h3>
              <p className="card__text">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default Process;
