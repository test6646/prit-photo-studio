import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Camera, Building, User, UserPlus } from "lucide-react";

// Custom signup schema with firm selection logic
const signupFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  role: z.enum(["admin", "photographer", "videographer", "editor", "other"]),
  firmId: z.number().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.role !== "admin" && !data.firmId) {
    return false;
  }
  return true;
}, {
  message: "Firm selection is required for non-admin roles",
  path: ["firmId"],
});

type SignupFormData = z.infer<typeof signupFormSchema>;

export default function SignupNew() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
      role: "photographer",
      firmId: undefined,
    },
  });

  const selectedRole = useWatch({
    control: form.control,
    name: "role",
  });

  // Fetch available firms for non-admin roles
  const { data: firms = [], isLoading: firmsLoading } = useQuery({
    queryKey: ["/api/firms"],
    enabled: selectedRole !== "admin",
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          role: data.role,
          firmId: data.role === "admin" ? null : data.firmId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create account");
      }

      const result = await response.json();
      
      if (data.role === "admin") {
        setSuccess("Admin account created successfully! You'll be redirected to create your first studio.");
        setTimeout(() => {
          setLocation("/admin-setup");
        }, 2000);
      } else {
        setSuccess("Account created successfully! Please wait for admin approval to access the system.");
        setTimeout(() => {
          setLocation("/login");
        }, 3000);
      }

      form.reset();
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    { value: "admin", label: "Admin", description: "Full system access, manage studios" },
    { value: "photographer", label: "Photographer", description: "Handle photography sessions" },
    { value: "videographer", label: "Videographer", description: "Handle video production" },
    { value: "editor", label: "Editor", description: "Post-processing and editing" },
    { value: "other", label: "Other", description: "Custom role as needed" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
            <UserPlus className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Create Your Account</CardTitle>
          <CardDescription>
            Join the photography studio management platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Personal Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    {...form.register("firstName")}
                    className={form.formState.errors.firstName ? "border-red-500" : ""}
                    disabled={isLoading}
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-red-500">{form.formState.errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    {...form.register("lastName")}
                    className={form.formState.errors.lastName ? "border-red-500" : ""}
                    disabled={isLoading}
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-red-500">{form.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="you@example.com"
                  className={form.formState.errors.email ? "border-red-500" : ""}
                  disabled={isLoading}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...form.register("phone")}
                  placeholder="1234567890"
                  className={form.formState.errors.phone ? "border-red-500" : ""}
                  disabled={isLoading}
                />
                <p className="text-xs text-slate-500">Enter 10 digits only (no spaces or dashes)</p>
                {form.formState.errors.phone && (
                  <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Role & Access</h3>
              
              <div className="space-y-2">
                <Label htmlFor="role">Your Role</Label>
                <Select
                  value={form.watch("role")}
                  onValueChange={(value) => {
                    form.setValue("role", value as any);
                    // Clear firmId when switching to admin
                    if (value === "admin") {
                      form.setValue("firmId", undefined);
                    }
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-xs text-slate-500">{option.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.role && (
                  <p className="text-sm text-red-500">{form.formState.errors.role.message}</p>
                )}
              </div>

              {/* Firm Selection (only for non-admin roles) */}
              {selectedRole !== "admin" && (
                <div className="space-y-2">
                  <Label htmlFor="firmId">Select Studio/Firm</Label>
                  <Select
                    value={form.watch("firmId")?.toString()}
                    onValueChange={(value) => form.setValue("firmId", parseInt(value))}
                    disabled={isLoading || firmsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your studio" />
                    </SelectTrigger>
                    <SelectContent>
                      {firms.map((firm: any) => (
                        <SelectItem key={firm.id} value={firm.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            {firm.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {firmsLoading && (
                    <p className="text-xs text-slate-500">Loading available studios...</p>
                  )}
                  {!firmsLoading && firms.length === 0 && (
                    <p className="text-xs text-amber-600">No studios available. Contact an admin to create one first.</p>
                  )}
                  {form.formState.errors.firmId && (
                    <p className="text-sm text-red-500">{form.formState.errors.firmId.message}</p>
                  )}
                </div>
              )}

              {selectedRole === "admin" && (
                <Alert>
                  <User className="h-4 w-4" />
                  <AlertDescription>
                    As an admin, you'll be able to create and manage studios after registration.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Password */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Security</h3>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  className={form.formState.errors.password ? "border-red-500" : ""}
                  disabled={isLoading}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...form.register("confirmPassword")}
                  className={form.formState.errors.confirmPassword ? "border-red-500" : ""}
                  disabled={isLoading}
                />
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}