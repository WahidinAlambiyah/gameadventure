"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ChildProfileForm() {
  const router = useRouter();
  const [ageInputMode, setAgeInputMode] = useState<"ageRange" | "birthYear">("ageRange");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const birthYearValue = ageInputMode === "birthYear" ? String(form.get("birthYear") ?? "") : "";
    const payload = {
      nickname: String(form.get("nickname") ?? ""),
      ageRange:
        ageInputMode === "ageRange" ? String(form.get("ageRange") ?? "") || undefined : undefined,
      birthYear: birthYearValue ? Number(birthYearValue) : undefined,
      avatarKey: String(form.get("avatarKey") ?? "") || undefined,
      learningPreferences: {
        focus: String(form.get("learningFocus") ?? "both")
      }
    };

    const response = await fetch("/api/v1/children", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error?.message ?? "Child profile could not be created.");
      setPending(false);
      return;
    }

    router.replace("/parent");
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} aria-describedby="child-profile-error">
      <label>
        <span>Nickname</span>
        <input name="nickname" required minLength={2} maxLength={30} />
      </label>
      <fieldset className="form-fieldset">
        <legend>Age input</legend>
        <label className="checkbox-row">
          <input
            checked={ageInputMode === "ageRange"}
            name="ageInputMode"
            onChange={() => setAgeInputMode("ageRange")}
            type="radio"
            value="ageRange"
          />
          <span>Use age range</span>
        </label>
        <label className="checkbox-row">
          <input
            checked={ageInputMode === "birthYear"}
            name="ageInputMode"
            onChange={() => setAgeInputMode("birthYear")}
            type="radio"
            value="birthYear"
          />
          <span>Use birth year</span>
        </label>
      </fieldset>
      <div className="form-grid">
        <label>
          <span>Age range</span>
          <select name="ageRange" defaultValue="6-8" disabled={ageInputMode !== "ageRange"}>
            <option value="3-5">3-5</option>
            <option value="6-8">6-8</option>
            <option value="9-12">9-12</option>
          </select>
        </label>
        <label>
          <span>Birth year</span>
          <input
            name="birthYear"
            disabled={ageInputMode !== "birthYear"}
            inputMode="numeric"
            pattern="[0-9]*"
            required={ageInputMode === "birthYear"}
          />
        </label>
      </div>
      <label>
        <span>Avatar</span>
        <select name="avatarKey" defaultValue="starter-star">
          <option value="starter-star">Starter Star</option>
          <option value="forest-reader">Forest Reader</option>
          <option value="moon-scout">Moon Scout</option>
        </select>
      </label>
      <label>
        <span>Learning preference</span>
        <select name="learningFocus" defaultValue="both">
          <option value="reading">Reading</option>
          <option value="hijaiyah">Hijaiyah</option>
          <option value="both">Both</option>
        </select>
      </label>
      {error ? (
        <p className="form-error" id="child-profile-error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="app-button" disabled={pending} type="submit">
        {pending ? "Creating..." : "Create child profile"}
      </button>
    </form>
  );
}
