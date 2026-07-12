"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ChildProfileManagerProps = {
  child: {
    id: string;
    nickname: string;
    birthYear: number | null;
    ageRange: string | null;
    avatarKey: string | null;
    learningPreferences: unknown;
  };
};

type Message = { kind: "success" | "error"; text: string } | null;

function focusFrom(value: unknown) {
  if (value && typeof value === "object" && "focus" in value) {
    const focus = (value as { focus?: unknown }).focus;
    if (focus === "reading" || focus === "hijaiyah" || focus === "both") return focus;
  }
  return "both";
}

export function ChildProfileManager({ child }: ChildProfileManagerProps) {
  const router = useRouter();
  const initialMode = child.birthYear == null ? "ageRange" : "birthYear";
  const initialFocus = focusFrom(child.learningPreferences);
  const [ageMode, setAgeMode] = useState<"ageRange" | "birthYear">(initialMode);
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const nickname = String(form.get("nickname") ?? "").trim();
    const avatarKey = String(form.get("avatarKey") ?? "");
    const focus = String(form.get("learningFocus") ?? "both");
    const payload: Record<string, unknown> = {};
    if (nickname !== child.nickname) payload.nickname = nickname;
    if (avatarKey !== (child.avatarKey ?? "starter-star")) payload.avatarKey = avatarKey;
    if (focus !== initialFocus) payload.learningPreferences = { focus };

    if (ageMode === "birthYear") {
      const birthYear = Number(form.get("birthYear"));
      if (initialMode !== "birthYear" || birthYear !== child.birthYear) {
        payload.birthYear = birthYear;
        payload.ageRange = null;
      }
    } else {
      const ageRange = String(form.get("ageRange") ?? "");
      if (initialMode !== "ageRange" || ageRange !== child.ageRange) {
        payload.birthYear = null;
        payload.ageRange = ageRange;
      }
    }

    if (Object.keys(payload).length === 0) {
      setPending(false);
      setMessage({ kind: "success", text: "No profile changes to save." });
      return;
    }

    const response = await fetch(`/api/v1/children/${encodeURIComponent(child.id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      setPending(false);
      setMessage({
        kind: "error",
        text:
          response.status === 403
            ? "Parent gate verification is required again."
            : (body?.error?.message ?? "Child profile could not be updated.")
      });
      return;
    }
    setPending(false);
    setMessage({ kind: "success", text: "Child profile updated." });
    router.refresh();
  }

  async function remove() {
    if (pending) return;
    setPending(true);
    setMessage(null);
    const response = await fetch(`/api/v1/children/${encodeURIComponent(child.id)}`, {
      method: "DELETE"
    });
    if (!response.ok) {
      setPending(false);
      setConfirmDelete(false);
      setMessage({
        kind: "error",
        text:
          response.status === 403
            ? "Parent gate verification is required again."
            : "Child profile could not be deleted."
      });
      return;
    }
    router.replace("/parent/children/new");
    router.refresh();
  }

  return (
    <div className="grid gap-6">
      <form className="auth-form" onSubmit={save} aria-describedby="child-profile-message">
        <label>
          <span>Nickname</span>
          <input
            name="nickname"
            defaultValue={child.nickname}
            required
            minLength={2}
            maxLength={30}
          />
        </label>
        <fieldset className="form-fieldset">
          <legend>Age input</legend>
          <label className="checkbox-row">
            <input
              checked={ageMode === "ageRange"}
              onChange={() => setAgeMode("ageRange")}
              type="radio"
            />
            <span>Use age range</span>
          </label>
          <label className="checkbox-row">
            <input
              checked={ageMode === "birthYear"}
              onChange={() => setAgeMode("birthYear")}
              type="radio"
            />
            <span>Use birth year</span>
          </label>
        </fieldset>
        <div className="form-grid">
          <label>
            <span>Age range</span>
            <select
              name="ageRange"
              defaultValue={child.ageRange ?? "6-8"}
              disabled={ageMode !== "ageRange"}
            >
              <option value="3-5">3-5</option>
              <option value="6-8">6-8</option>
              <option value="9-12">9-12</option>
            </select>
          </label>
          <label>
            <span>Birth year</span>
            <input
              name="birthYear"
              defaultValue={child.birthYear ?? new Date().getFullYear() - 6}
              disabled={ageMode !== "birthYear"}
              inputMode="numeric"
              pattern="[0-9]*"
              required={ageMode === "birthYear"}
            />
          </label>
        </div>
        <label>
          <span>Avatar</span>
          <select name="avatarKey" defaultValue={child.avatarKey ?? "starter-star"}>
            <option value="starter-star">Starter Star</option>
            <option value="forest-reader">Forest Reader</option>
            <option value="moon-scout">Moon Scout</option>
          </select>
        </label>
        <label>
          <span>Learning preference</span>
          <select name="learningFocus" defaultValue={initialFocus}>
            <option value="reading">Reading</option>
            <option value="hijaiyah">Hijaiyah</option>
            <option value="both">Both</option>
          </select>
        </label>
        {message ? (
          <p
            className={message.kind === "error" ? "form-error" : "text-sm font-bold text-green-700"}
            id="child-profile-message"
            role={message.kind === "error" ? "alert" : "status"}
          >
            {message.text}
          </p>
        ) : null}
        <button className="app-button" disabled={pending} type="submit">
          {pending ? "Saving..." : "Save changes"}
        </button>
      </form>

      <section className="surface border-red-200 p-6" aria-labelledby="delete-child-title">
        <h2 className="text-xl font-black text-red-800" id="delete-child-title">
          Delete child profile
        </h2>
        <p className="mt-2 text-[var(--muted)]">
          Remove access to this profile. Learning history remains retained internally.
        </p>
        <button
          className="app-button mt-4 bg-red-700"
          disabled={pending}
          onClick={() => setConfirmDelete(true)}
          type="button"
        >
          Delete profile
        </button>
      </section>

      {confirmDelete ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <section
            aria-describedby="delete-child-description"
            aria-labelledby="delete-child-confirm-title"
            aria-modal="true"
            className="surface max-w-lg p-6"
            role="alertdialog"
          >
            <h2 className="text-2xl font-black" id="delete-child-confirm-title">
              Delete {child.nickname}?
            </h2>
            <p className="mt-3 text-[var(--muted)]" id="delete-child-description">
              Access to this child profile will be removed. Learning history remains retained
              internally and cannot be restored from the parent portal.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="app-button bg-red-700"
                disabled={pending}
                onClick={remove}
                type="button"
              >
                {pending ? "Deleting..." : "Confirm deletion"}
              </button>
              <button
                className="app-button secondary"
                disabled={pending}
                onClick={() => setConfirmDelete(false)}
                type="button"
              >
                Cancel
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
