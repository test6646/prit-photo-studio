import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { loginSchema, type LoginData } from "@shared/schema";

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login, isLoading } = useAuth();

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      firmPin: "",
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginData) => {
    try {
      setError("");
      await login(data);
      setLocation("/");
    } catch (err) {
      setError("Invalid credentials. Please check your firm PIN, username, and password.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Camera className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">StudioFlow</h1>
          </div>
          <CardTitle className="text-xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your studio management dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="firmPin">Firm PIN</Label>
              <Input
                id="firmPin"
                type="text"
                placeholder="Enter your firm PIN"
                {...form.register("firmPin")}
                disabled={isLoading}
              />
              {form.formState.errors.firmPin && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.firmPin.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                {...form.register("username")}
                disabled={isLoading}
              />
              {form.formState.errors.username && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  {...form.register("password")}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Want to create your own studio account?
              </p>
              <div className="space-y-2">
                <Button variant="outline" asChild className="w-full">
                  <a href="/login-email">Use Email Login</a>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <a href="/signup">Create New Studio Account</a>
                </Button>
              </div>
            </div>

            <div className="text-center text-sm text-gray-600">
              <p className="mb-2">Demo Credentials:</p>
              <div className="text-xs space-y-1 bg-gray-50 p-3 rounded-md">
                <p><strong>Firm PIN:</strong> 1234</p>
                <p><strong>Username:</strong> admin</p>
                <p><strong>Password:</strong> password123</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
