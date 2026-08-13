import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import Services from "./components/Services.jsx";
import SelectedWork from "./components/SelectedWork.jsx";
import Process from "./components/Process.jsx";
import Technology from "./components/Technology.jsx";
import About from "./components/About.jsx";
import Contact from "./components/Contact.jsx";
import Footer from "./components/Footer.jsx";

/**
 * Page shell: skip link, sticky header, the content sections in the order
 * defined by the requirements, and the footer.
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
        <Services />
        <SelectedWork />
        <Process />
        <Technology />
        <About />
        <Contact />
      </main>

      <Footer />
    </>
  );
}

export default App;
