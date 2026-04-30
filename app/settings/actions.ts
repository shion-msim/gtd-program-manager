"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { userAppSettings } from "@/db/schema";
import { normalizeHexColor } from "@/lib/hex-color";
import type { PriorityColorMap } from "@/lib/task-row-accent";
import {
  DEFAULT_PRIORITY_COLORS,
  TASK_PRIORITIES,
} from "@/lib/task-priority";

export async function updatePriorityColors(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }
  const userId = session.user.id;
  const payload: PriorityColorMap = { ...DEFAULT_PRIORITY_COLORS };
  for (const p of TASK_PRIORITIES) {
    const raw = formData.get(`priorityColor_${p}`);
    if (typeof raw !== "string") {
      return;
    }
    const n = normalizeHexColor(raw);
    if (!n) {
      return;
    }
    payload[p] = n;
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
