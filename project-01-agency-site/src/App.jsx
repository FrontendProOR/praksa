import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";

/**
 * Page shell: skip link, sticky header and the main content landmark.
 * Content sections are added to <main> as the site grows.
 */
function App() {
  return (
    <>
      <a className="skip-link" href="#glavni-sadrzaj">
        Preskoči na glavni sadržaj
      </a>

      <Header />

      <main id="glavni-sadrzaj" tabIndex={-1}>
        <Hero />
      </main>
    </>
  );
}

export default App;
