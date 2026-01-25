"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function clearLicense() {
  const cookieStore = await cookies();
  cookieStore.delete("selected-license");

  redirect("/");
}
