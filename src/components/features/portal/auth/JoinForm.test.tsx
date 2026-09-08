import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StubAuthProvider } from "@/lib/auth";
import { JoinForm } from "./JoinForm";

const signUpWithPassword = vi.fn();
const signInWithPassword = vi.fn();
const assign = vi.fn();

function renderJoin() {
  return render(
    <StubAuthProvider
      value={{
        status: "signedOut",
        configured: true,
        signUpWithPassword,
        signInWithPassword,
      }}
    >
      <JoinForm />
    </StubAuthProvider>,
  );
}

describe("JoinForm", () => {
  beforeEach(() => {
    signUpWithPassword.mockReset();
    signInWithPassword.mockReset();
    assign.mockReset();
    sessionStorage.clear();
    vi.stubGlobal("location", {
      ...window.location,
      search: "?email=Owner%40Example.com",
      assign,
    });
  });

  it("prefills email from the query string", async () => {
    renderJoin();
    await waitFor(() => {
      expect(screen.getByLabelText(/^email$/i)).toHaveValue(
        "Owner@Example.com",
      );
    });
  });

  it("creates a new account and sends them to confirm", async () => {
    signUpWithPassword.mockResolvedValue("confirm");
    const user = userEvent.setup();
    renderJoin();
    await waitFor(() => {
      expect(screen.getByLabelText(/^email$/i)).toHaveValue(
        "Owner@Example.com",
      );
    });
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(signUpWithPassword).toHaveBeenCalledWith(
      "Owner@Example.com",
      "password123",
    );
    expect(assign).toHaveBeenCalledWith(
      "/portal/confirm/?email=owner%40example.com",
    );
  });

  it("signs in when the email already has a portal login", async () => {
    signUpWithPassword.mockRejectedValue(
      Object.assign(new Error("User already exists"), {
        name: "UsernameExistsException",
      }),
    );
    signInWithPassword.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderJoin();
    await waitFor(() => {
      expect(screen.getByLabelText(/^email$/i)).toHaveValue(
        "Owner@Example.com",
      );
    });
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(signInWithPassword).toHaveBeenCalledWith(
      "Owner@Example.com",
      "password123",
    );
    expect(assign).not.toHaveBeenCalled();
  });

  it("sends existing users to sign in when the password is not theirs", async () => {
    signUpWithPassword.mockRejectedValue(new Error("User already exists"));
    signInWithPassword.mockRejectedValue(new Error("Incorrect username or password"));
    const user = userEvent.setup();
    renderJoin();
    await waitFor(() => {
      expect(screen.getByLabelText(/^email$/i)).toHaveValue(
        "Owner@Example.com",
      );
    });
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(assign).toHaveBeenCalledWith(
      "/portal/login/?email=Owner%40Example.com",
    );
  });
});
