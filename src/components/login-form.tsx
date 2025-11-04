"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { showToast } from "@/utils/toast";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface LoginData {
  email: string;
  password: string;
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async ({ email, password }: LoginData) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      console.log("Login success:", data);
      showToast({
        title: "Login Successful",
        description: "You are now logged in.",
        variant: "success",
      });
      setErrorMessage(null);
      router.push("/dashboard");
    },
    onError: (error: unknown) => {
      console.error("Login error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";
      setErrorMessage(message);
      showToast({
        title: "Error logging in",
        description: message,
        variant: "destructive",
      });
    },
  });

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      {...props}
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const email = (form.elements.namedItem("email") as HTMLInputElement)
          .value;
        const password = (
          form.elements.namedItem("password") as HTMLInputElement
        ).value;

        mutation.mutate({ email, password });
      }}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your email below to login to your account
        </p>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required />
        </div>

        <div className="grid gap-3">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <Input id="password" type="password" required />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={mutation.status === "pending"}
        >
          {mutation.status === "pending" ? "Logging in..." : "Login"}
        </Button>

        {/* {errorMessage && (
          <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
        )} */}
      </div>
    </form>
  );
}
