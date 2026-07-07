"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { resolvePostLoginPath } from "@/features/authentication/routing";

type FormState = {
  error?: string;
  pending: boolean;
};

async function nextParentPath() {
  const response = await fetch("/api/v1/me", { cache: "no-store" });
  if (!response.ok) return "/";
  const body = await response.json();
  return resolvePostLoginPath(body.data ?? {});
}

export function RegisterForm() {
  const router = useRouter();
  const [state, setState] = useState<FormState>({ pending: false });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.pending) return;
    setState({ pending: true });

    const form = new FormData(event.currentTarget);
    const displayName = String(form.get("displayName") ?? "");
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    const acceptedTerms = form.get("acceptedTerms") === "on";

    if (password !== confirmPassword) {
      setState({ pending: false, error: "Password confirmation does not match." });
      return;
    }

    if (!acceptedTerms) {
      setState({ pending: false, error: "Terms and privacy acceptance is required." });
      return;
    }

    const result = await authClient.signUp.email({
      name: displayName,
      email,
      password
    });

    if (result.error) {
      setState({ pending: false, error: "Registration could not be completed." });
      return;
    }

    const bootstrap = await fetch("/api/v1/auth/bootstrap-parent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ displayName })
    });

    if (!bootstrap.ok) {
      setState({ pending: false, error: "Account created, but parent onboarding failed." });
      return;
    }

    router.replace(await nextParentPath());
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} aria-describedby="register-error">
      <label>
        <span>Parent name</span>
        <input autoComplete="name" name="displayName" required minLength={2} maxLength={80} />
      </label>
      <label>
        <span>Email</span>
        <input autoComplete="email" name="email" required type="email" />
      </label>
      <label>
        <span>Password</span>
        <input
          autoComplete="new-password"
          name="password"
          required
          type="password"
          minLength={12}
          maxLength={128}
        />
      </label>
      <label>
        <span>Confirm password</span>
        <input
          autoComplete="new-password"
          name="confirmPassword"
          required
          type="password"
          minLength={12}
          maxLength={128}
        />
      </label>
      <label className="checkbox-row">
        <input name="acceptedTerms" required type="checkbox" />
        <span>I accept the terms and privacy policy.</span>
      </label>
      {state.error ? (
        <p className="form-error" id="register-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className="app-button" disabled={state.pending} type="submit">
        {state.pending ? "Creating..." : "Create parent account"}
      </button>
    </form>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [state, setState] = useState<FormState>({ pending: false });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.pending) return;
    setState({ pending: true });

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const rememberMe = form.get("rememberMe") === "on";

    const result = await authClient.signIn.email({ email, password, rememberMe });

    if (result.error) {
      setState({ pending: false, error: "Invalid email or password." });
      return;
    }

    router.replace(await nextParentPath());
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} aria-describedby="login-error">
      <label>
        <span>Email</span>
        <input autoComplete="email" name="email" required type="email" />
      </label>
      <label>
        <span>Password</span>
        <input autoComplete="current-password" name="password" required type="password" />
      </label>
      <label className="checkbox-row">
        <input name="rememberMe" type="checkbox" />
        <span>Remember me</span>
      </label>
      {state.error ? (
        <p className="form-error" id="login-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className="app-button" disabled={state.pending} type="submit">
        {state.pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
