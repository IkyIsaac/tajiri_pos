"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userLogin } from "@/app/api/api";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { showToast } from "@/utils/toast";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: { Username: string; password: string }) =>
      userLogin(data),
    onSuccess: (data) => {
      console.log("Login success:", data);
      showToast({
        title: "Login Successful",
        description: "You are now Logged in",
        variant:"success",
      });
      setErrorMessage(null); 
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
        variant:"destructive",
      });
    },
  });

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      {...props}
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate({
          Username: (e.target as HTMLFormElement).username.value,
          password: (e.target as HTMLFormElement).password.value,
        });
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
          <Label htmlFor="username">Username</Label>
          <Input id="username" type="text" required />
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
