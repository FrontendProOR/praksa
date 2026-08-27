import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test, vi } from "vitest";
import LoginPage from "../pages/LoginPage.jsx";
import { AuthContext } from "../context/auth-context.js";

/**
 * Section 12: a validation test for the login form.
 *
 * The point is not that red text appears - it is that an invalid form never
 * reaches the API, that the error is announced rather than merely coloured,
 * and that a second click cannot fire a second request.
 */
function renderLogin(auth = {}) {
  const value = {
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    authReady: true,
    bootstrapError: null,
    login: vi.fn().mockResolvedValue({ id: "1", role: "user" }),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    ...auth,
  };

  render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={["/login"]}>
        <LoginPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );

  return value;
}

describe("LoginPage validation", () => {
  test("an empty form is not submitted to the API", async () => {
    const user = userEvent.setup();
    const auth = renderLogin();

    await user.click(screen.getByRole("button", { name: /prijav/i }));

    expect(auth.login).not.toHaveBeenCalled();
    expect(await screen.findByText("Unesite email adresu.")).toBeInTheDocument();
    expect(screen.getByText("Unesite lozinku.")).toBeInTheDocument();
  });

  test("the error is linked to its field, not just coloured", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole("button", { name: /prijav/i }));

    const email = screen.getByLabelText(/email/i);
    expect(email).toHaveAttribute("aria-invalid", "true");

    const describedBy = email.getAttribute("aria-describedby");
    expect(describedBy).toContain("email-error");
    expect(document.getElementById("email-error")).toHaveTextContent("Unesite email adresu.");
  });

  test("a missing password alone is still caught", async () => {
    const user = userEvent.setup();
    const auth = renderLogin();

    await user.type(screen.getByLabelText(/email/i), "ana@example.com");
    await user.click(screen.getByRole("button", { name: /prijav/i }));

    expect(auth.login).not.toHaveBeenCalled();
    expect(screen.getByText("Unesite lozinku.")).toBeInTheDocument();
  });

  test("a valid form calls the API exactly once, with trimmed input", async () => {
    const user = userEvent.setup();
    const auth = renderLogin();

    await user.type(screen.getByLabelText(/email/i), "  ana@example.com  ");
    await user.type(screen.getByLabelText(/lozink/i), "StrongPass123");
    await user.click(screen.getByRole("button", { name: /prijav/i }));

    await waitFor(() => expect(auth.login).toHaveBeenCalledTimes(1));
    expect(auth.login).toHaveBeenCalledWith({
      email: "ana@example.com",
      password: "StrongPass123",
    });
  });

  test("rapid clicks cannot fire a second request", async () => {
    const user = userEvent.setup();
    let resolveLogin;
    const auth = renderLogin({
      login: vi.fn(() => new Promise((resolve) => { resolveLogin = resolve; })),
    });

    await user.type(screen.getByLabelText(/email/i), "ana@example.com");
    await user.type(screen.getByLabelText(/lozink/i), "StrongPass123");

    const submit = screen.getByRole("button", { name: /prijav/i });
    await user.click(submit);
    await user.click(submit);
    await user.click(submit);

    expect(auth.login).toHaveBeenCalledTimes(1);
    expect(submit).toBeDisabled();

    resolveLogin({ id: "1", role: "user" });
  });

  test("an API failure is shown as an alert and the email is kept", async () => {
    const user = userEvent.setup();
    const failure = Object.assign(new Error("Invalid email or password"), {
      code: "UNAUTHORIZED",
      details: [],
    });
    renderLogin({ login: vi.fn().mockRejectedValue(failure) });

    await user.type(screen.getByLabelText(/email/i), "ana@example.com");
    await user.type(screen.getByLabelText(/lozink/i), "WrongPass123");
    await user.click(screen.getByRole("button", { name: /prijav/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/invalid email or password/i);
    // The user should not have to retype what they already entered.
    expect(screen.getByLabelText(/email/i)).toHaveValue("ana@example.com");
  });

  test("the password field is a real password input", () => {
    renderLogin();
    expect(screen.getByLabelText(/lozink/i)).toHaveAttribute("type", "password");
  });
});
