import SectionHeading from "./SectionHeading.jsx";
import { SERVICES } from "../data/site.js";
import "../styles/services.css";

/** What the agency offers - four service areas. */
function Services() {
  return (
    <section className="section" id="usluge" aria-labelledby="usluge-naslov">
      <div className="container">
        <SectionHeading
          id="usluge-naslov"
          eyebrow={SERVICES.eyebrow}
          title={SERVICES.title}
          description={SERVICES.description}
        />

        <ul className="services__grid">
          {SERVICES.items.map((service, index) => (
            <li key={service.id} className="card service-card">
              <span className="service-card__index" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="card__title">{service.title}</h3>
              <p className="card__text">{service.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default Services;
