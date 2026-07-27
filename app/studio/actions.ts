"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const STUDIO_COOKIE = "pyp_studio_auth";
const STUDIO_COOKIE_VALUE = "granted";

function getExpectedUsername() {
  return process.env.STUDIO_USERNAME ?? "admin";
}

function getExpectedPassword() {
  return process.env.STUDIO_PASSWORD ?? "admin";
}

type LoginState = {
  error?: string;
};

export async function loginStudio(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/studio").trim();

  const expectedUsername = getExpectedUsername();
  const expectedPassword = getExpectedPassword();

  if (!expectedPassword) {
    return { error: "STUDIO_PASSWORD is not configured on the server." };
  }

  if (username !== expectedUsername || password !== expectedPassword) {
    return { error: "Invalid studio credentials." };
  }

  const cookieStore = await cookies();
  cookieStore.set(STUDIO_COOKIE, STUDIO_COOKIE_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  redirect(next.startsWith("/") ? next : "/studio");
}

export async function logoutStudio() {
  const cookieStore = await cookies();
  cookieStore.delete(STUDIO_COOKIE);
  redirect("/studio/login");
}

export async function isStudioAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(STUDIO_COOKIE)?.value;
  return token === STUDIO_COOKIE_VALUE;
}
