"use client";

import { useState } from "react";

type SettingsFormProps = {
  dailyLimitMinutes: number;
  timezone: string;
  energyEnabled: boolean;
};

export function SettingsForm(props: SettingsFormProps) {
  const [state, setState] = useState({ pending: false, error: "", success: "" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.pending) return;
    setState({ pending: true, error: "", success: "" });
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/v1/parent/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        dailyLimitMinutes: Number(form.get("dailyLimitMinutes")),
        timezone: String(form.get("timezone")),
        energyEnabled: form.get("energyEnabled") === "on"
      })
    });
    if (!response.ok) {
      setState({ pending: false, error: "Settings could not be saved.", success: "" });
      return;
    }
    setState({ pending: false, error: "", success: "Settings saved." });
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} aria-describedby="settings-status">
      <label>
        <span>Daily limit</span>
        <select name="dailyLimitMinutes" defaultValue={props.dailyLimitMinutes}>
          {[10, 15, 20, 25, 30, 45, 60, 90, 120].map((value) => (
            <option key={value} value={value}>
              {value} minutes
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Timezone</span>
        <select name="timezone" defaultValue={props.timezone}>
          <option value="Asia/Jakarta">Asia/Jakarta</option>
          <option value="Asia/Makassar">Asia/Makassar</option>
          <option value="Asia/Jayapura">Asia/Jayapura</option>
        </select>
      </label>
      <label className="checkbox-row">
        <input name="energyEnabled" type="checkbox" defaultChecked={props.energyEnabled} />
        <span>Energy enabled</span>
      </label>
      <div id="settings-status" aria-live="polite">
        {state.error ? <p className="form-error">{state.error}</p> : null}
        {state.success ? <p className="form-success">{state.success}</p> : null}
      </div>
      <button className="app-button" disabled={state.pending} type="submit">
        {state.pending ? "Saving..." : "Save settings"}
      </button>
    </form>
  );
}
