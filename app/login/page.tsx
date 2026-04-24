import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithE2eSecret, signInWithGoogle } from "./actions";

export default function LoginPage() {
  const e2eEnabled = process.env.E2E_AUTH_ENABLED === "1";
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">ログイン</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Google アカウントでサインインしてください。
        </p>
      </div>
      <form action={signInWithGoogle}>
        <Button type="submit" size="lg">
          Google で続行
        </Button>
      </form>
      {e2eEnabled ? (
        <form
          action={signInWithE2eSecret}
          className="border-border flex w-full max-w-sm flex-col gap-3 rounded-lg border p-4"
        >
          <p className="text-muted-foreground text-xs">
            E2E 専用（本番では無効にしてください）
          </p>
          <div className="space-y-2">
            <Label htmlFor="e2e-secret">E2E シークレット</Label>
            <Input
              id="e2e-secret"
              name="secret"
              type="password"
              autoComplete="off"
              placeholder="E2E_AUTH_SECRET と同じ値"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            E2E ログイン
          </Button>
        </form>
      ) : null}
    </div>
  );
}
