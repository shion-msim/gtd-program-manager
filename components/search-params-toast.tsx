"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

const TOAST_MESSAGES: Record<string, string> = {
  saved: "保存しました",
  moved: "移動しました",
  done: "完了にしました",
  deleted: "削除しました",
  created: "追加しました",
};

export function SearchParamsToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const key = searchParams.get("toast");
  const processed = useRef<string | null>(null);

  useEffect(() => {
    const token = `${pathname}?toast=${key ?? ""}`;
    if (!key) {
      return;
    }
    const msg = TOAST_MESSAGES[key];
    if (!msg || processed.current === token) {
      return;
    }
    processed.current = token;
    toast.success(msg);
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("toast");
    const q = sp.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  }, [key, pathname, router, searchParams]);

  return null;
}
