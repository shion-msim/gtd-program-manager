import { redirect } from "next/navigation";

/**
 * Inbox は整理ビューを既定とし、「いま拾う」は全画面 FAB モーダルから利用する。
 */
export default function InboxPage() {
  redirect("/inbox/table");
}
