export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    // 除外: 静的; favicon; app/icon 等の拡張子なしメタルート（.png パターンにマッチしない）
    "/((?!_next/static|_next/image|favicon\\.ico|icon$|apple-icon$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
