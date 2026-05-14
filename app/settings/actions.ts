"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { userAppSettings } from "@/db/schema";
import { isAccentToken } from "@/lib/design-tokens";
import type { PriorityColorMap } from "@/lib/task-row-accent";
import {
  DEFAULT_PRIORITY_TOKENS,
  TASK_PRIORITIES,
} from "@/lib/task-priority";

export async function updatePriorityColors(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }
  const userId = session.user.id;
  const payload: PriorityColorMap = { ...DEFAULT_PRIORITY_TOKENS };
  for (const p of TASK_PRIORITIES) {
    const raw = formData.get(`priorityColor_${p}`);
    if (typeof raw !== "string") {
      return;
    }
    if (!isAccentToken(raw)) {
      return;
    }
    payload[p] = raw;
  }
  const json = JSON.stringify(payload);
  await db
    .insert(userAppSettings)
    .values({
      userId,
      priorityColorsJson: json,
    })
    .onConflictDoUpdate({
      target: userAppSettings.userId,
      set: { priorityColorsJson: json },
    });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/workload");
  revalidatePath("/inbox");
  revalidatePath("/inbox/table");
  revalidatePath("/programs");
}
