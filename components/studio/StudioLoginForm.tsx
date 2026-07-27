"use client";

import { useActionState } from "react";
import { loginStudio } from "@/app/studio/actions";

export default function StudioLoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(loginStudio, {});

  return (
    <form className="studio-login-card" action={formAction}>
      <h1>Studio Access</h1>
      <p>Sign in to open the internal social content studio.</p>

      <label htmlFor="studio-username">Username</label>
      <input id="studio-username" name="username" type="text" autoComplete="username" required />

      <label htmlFor="studio-password">Password</label>
      <input id="studio-password" name="password" type="password" autoComplete="current-password" required />

      <input type="hidden" name="next" value={next} />

      {state?.error ? <p className="studio-login-error">{state.error}</p> : null}

      <button type="submit" disabled={pending}>
        {pending ? "Signing in..." : "Open Studio"}
      </button>
    </form>
  );
}
