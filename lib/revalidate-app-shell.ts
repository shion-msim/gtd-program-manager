import { revalidatePath } from "next/cache";

/** ルートレイアウトのサイドバー等を最新化する */
export function revalidateAppShell() {
  revalidatePath("/", "layout");
}
