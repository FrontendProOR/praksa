import { useState } from "react";
import "../styles/catalog-controls.css";

/**
 * Catalogue search.
 *
 * Submitted explicitly rather than on every keystroke: typing would otherwise
 * fire a request per character and push a history entry per character, which
 * would also make Back/Forward useless. The field keeps its own transient
 * value while typing; the URL stays authoritative for what is actually shown.
 *
 * The term is sent to the API's `q` parameter, which searches name, short
 * description and tags. Regex metacharacters are escaped server-side, so any
 * text is safe to type.
 */
function SearchBar({ value, onSearch }) {
  const [draft, setDraft] = useState(value);

  // Adopt the URL's term when it changes elsewhere (reset, Back/Forward, a
  // shared link), without discarding what the user is currently typing.
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    onSearch(draft.trim());
  };

  const handleClear = () => {
    setDraft("");
    onSearch("");
  };

  return (
    <form className="search-bar" role="search" onSubmit={handleSubmit}>
      <label className="search-bar__label" htmlFor="catalog-search">
        Pretraga proizvoda
      </label>

      <div className="search-bar__row">
        <input
          id="catalog-search"
          className="search-bar__input"
          type="search"
          name="q"
          value={draft}
          placeholder="Naziv, opis ili oznaka"
          autoComplete="off"
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="submit" className="btn btn--primary">
          Traži
        </button>
        {value ? (
          <button type="button" className="btn btn--secondary" onClick={handleClear}>
            Poništi
          </button>
        ) : null}
      </div>
    </form>
  );
}

export default SearchBar;
