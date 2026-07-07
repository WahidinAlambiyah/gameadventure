"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ChildProfileForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const birthYearValue = String(form.get("birthYear") ?? "");
    const payload = {
      nickname: String(form.get("nickname") ?? ""),
      ageRange: String(form.get("ageRange") ?? "") || undefined,
      birthYear: birthYearValue ? Number(birthYearValue) : undefined,
      avatarKey: String(form.get("avatarKey") ?? "") || undefined,
      learningPreferences: {
        starterTrack: String(form.get("starterTrack") ?? "sastra-nusantara")
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
    <form className="auth-form" onSubmit={onSubmit}>
      <label>
        <span>Nickname</span>
        <input name="nickname" required minLength={2} maxLength={40} />
      </label>
      <div className="form-grid">
        <label>
          <span>Age range</span>
          <select name="ageRange" defaultValue="6-8">
            <option value="3-5">3-5</option>
            <option value="6-8">6-8</option>
            <option value="9-12">9-12</option>
          </select>
        </label>
        <label>
          <span>Birth year</span>
          <input name="birthYear" inputMode="numeric" pattern="[0-9]*" />
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
        <span>Starter track</span>
        <select name="starterTrack" defaultValue="sastra-nusantara">
          <option value="sastra-nusantara">SastraNusantara</option>
          <option value="hijaiyah-island">HijaiyahIsland</option>
        </select>
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="app-button" disabled={pending} type="submit">
        {pending ? "Creating..." : "Create child profile"}
      </button>
    </form>
  );
}
