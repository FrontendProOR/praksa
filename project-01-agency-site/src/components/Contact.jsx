import SectionHeading from "./SectionHeading.jsx";
import ContactForm from "./ContactForm.jsx";
import { CONTACT } from "../data/site.js";
import "../styles/contact.css";

/**
 * Contact section: enquiry guidance and location on the left, the demo
 * contact form on the right.
 */
function Contact() {
  return (
    <section className="section" id="kontakt" aria-labelledby="kontakt-naslov">
      <div className="container contact__inner">
        <div className="contact__info">
          <SectionHeading
            id="kontakt-naslov"
            eyebrow={CONTACT.eyebrow}
            title={CONTACT.title}
            description={CONTACT.description}
          />

          <h3 className="contact__subtitle">{CONTACT.checklistTitle}</h3>
          <ul className="contact__checklist">
            {CONTACT.checklist.map((item) => (
              <li key={item} className="contact__checklist-item">
                {item}
              </li>
            ))}
          </ul>

          <div className="card contact__panel">
            <h3 className="contact__subtitle">{CONTACT.location.title}</h3>
            <p className="contact__location">{CONTACT.location.value}</p>
            <p className="card__text">{CONTACT.location.note}</p>
          </div>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}

export default Contact;
