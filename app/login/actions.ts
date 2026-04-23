"use server";

import { signIn } from "@/auth";

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/dashboard" });
}

export async function signInWithE2eSecret(formData: FormData) {
  const secret = formData.get("secret");
  if (typeof secret !== "string" || secret === "") {
    return;
  }
  await signIn("e2e-credentials", {
    secret,
    redirectTo: "/dashboard",
  });
}
