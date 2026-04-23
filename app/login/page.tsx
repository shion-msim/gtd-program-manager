import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "./actions";

export default function LoginPage() {
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
    </div>
  );
}
