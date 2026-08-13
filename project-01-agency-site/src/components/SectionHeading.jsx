import "../styles/section-heading.css";

/**
 * Shared heading block for content sections: eyebrow, section title and an
 * optional introduction. The `id` is placed on the <h2> so each section can
 * reference it with aria-labelledby.
 */
function SectionHeading({ id, eyebrow, title, description }) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id} className="section-heading__title">
        {title}
      </h2>
      {description ? (
        <p className="lead section-heading__description">{description}</p>
      ) : null}
    </div>
  );
}

export default SectionHeading;
