import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

/**
 * Shared test setup.
 *
 * Every test starts from an empty DOM and empty browser storage, so one test
 * cannot leave a cart or a rendered tree behind for the next one.
 */
beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
