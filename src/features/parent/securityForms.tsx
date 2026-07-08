"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type FormState = {
  pending: boolean;
  error?: string;
  success?: string;
};

function genericPinError(status: number) {
  if (status === 429) return "Parent PIN is temporarily locked. Try again later.";
  return "PIN verification failed.";
}

export function SetPinForm({ mode }: { mode: "set" | "change" }) {
  const router = useRouter();
  const [state, setState] = useState<FormState>({ pending: false });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.pending) return;
    setState({ pending: true });

    const form = new FormData(event.currentTarget);
    const payload =
      mode === "change"
        ? {
            currentPin: String(form.get("currentPin") ?? ""),
            pin: String(form.get("pin") ?? ""),
            confirmPin: String(form.get("confirmPin") ?? "")
          }
        : {
            pin: String(form.get("pin") ?? ""),
            confirmPin: String(form.get("confirmPin") ?? "")
          };

    const response = await fetch("/api/v1/parent/security/pin", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      setState({ pending: false, error: "PIN could not be saved." });
      return;
    }

    router.replace("/parent");
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} aria-describedby="pin-error">
      {mode === "change" ? (
        <label>
          <span>Current PIN</span>
          <input
            name="currentPin"
            required
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            type="password"
          />
        </label>
      ) : null}
      <label>
        <span>{mode === "change" ? "New PIN" : "PIN"}</span>
        <input
          name="pin"
          required
          inputMode="numeric"
          pattern="[0-9]{4}"
          maxLength={4}
          type="password"
        />
      </label>
      <label>
        <span>Confirm PIN</span>
        <input
          name="confirmPin"
          required
          inputMode="numeric"
          pattern="[0-9]{4}"
          maxLength={4}
          type="password"
        />
      </label>
      {state.error ? (
        <p className="form-error" id="pin-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className="app-button" disabled={state.pending} type="submit">
        {state.pending ? "Saving..." : "Save PIN"}
      </button>
    </form>
  );
}

export function VerifyPinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<FormState>({ pending: false });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.pending) return;
    setState({ pending: true });
    const form = new FormData(event.currentTarget);
    const returnTo = searchParams.get("returnTo") ?? "/parent";

    const response = await fetch("/api/v1/auth/parent-gate/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        pin: String(form.get("pin") ?? ""),
        returnTo
      })
    });

    if (!response.ok) {
      setState({ pending: false, error: genericPinError(response.status) });
      return;
    }

    const body = await response.json();
    router.replace(body.data?.returnTo ?? "/parent");
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} aria-describedby="verify-pin-error">
      <label>
        <span>Parent PIN</span>
        <input
          name="pin"
          required
          inputMode="numeric"
          pattern="[0-9]{4}"
          maxLength={4}
          type="password"
        />
      </label>
      {state.error ? (
        <p className="form-error" id="verify-pin-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className="app-button" disabled={state.pending} type="submit">
        {state.pending ? "Verifying..." : "Unlock"}
      </button>
    </form>
  );
}

export function LockParentPortalButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    if (pending) return;
    setPending(true);
    await fetch("/api/v1/auth/parent-gate", { method: "DELETE" });
    router.replace("/child/select-profile");
    router.refresh();
  }

  return (
    <button className="app-button secondary" disabled={pending} onClick={onClick} type="button">
      {pending ? "Locking..." : "Lock Parent Portal"}
    </button>
  );
}
