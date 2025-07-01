import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { Camera, Building2, UserPlus, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  role: z.enum(["admin", "photographer", "videographer", "editor"], {
    required_error: "Please select a role",
  }),
});

type SignupData = z.infer<typeof signupSchema>;

export default function Signup() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupData) => {
      return await apiRequest("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Account created successfully!",
        description: data.message,
      });
      setLocation("/login");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message || "Failed to create account. Please try again.",
      });
    },
  });

  const onSubmit = async (data: SignupData) => {
    setIsLoading(true);
    try {
      await signupMutation.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  };

  const role = watch("role");

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="p-3 rounded-full" style={{backgroundColor: '#ccb185'}}>
              <Camera className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Join our photography studio management platform
          </p>
        </div>

        {/* Signup Form */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold text-center">Sign up</CardTitle>
            <CardDescription className="text-center">
              Enter your details to create your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    {...register("firstName")}
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    {...register("lastName")}
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  {...register("email")}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className={errors.password ? "border-red-500" : ""}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  {...register("phone")}
                />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  onValueChange={(value) => setValue("role", value as any)}
                  value={role}
                >
                  <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center">
                        <Building2 className="mr-2 h-4 w-4" />
                        Studio Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="photographer">
                      <div className="flex items-center">
                        <Camera className="mr-2 h-4 w-4" />
                        Photographer
                      </div>
                    </SelectItem>
                    <SelectItem value="videographer">
                      <div className="flex items-center">
                        <Camera className="mr-2 h-4 w-4" />
                        Videographer
                      </div>
                    </SelectItem>
                    <SelectItem value="editor">
                      <div className="flex items-center">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Editor
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-red-500">{errors.role.message}</p>
                )}
              </div>

              {/* Role Description */}
              {role === "admin" && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    <Building2 className="inline mr-1 h-4 w-4" />
                    As an Admin, you'll create a new studio and have full access to all features.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full text-white" style={{backgroundColor: '#ccb185'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b8a06c'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ccb185'}
                disabled={isLoading || signupMutation.isPending}
              >
                {isLoading || signupMutation.isPending ? (
                  "Creating account..."
                ) : (
                  <>
                    Create account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Login Link */}
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login">
                  <span className="font-medium cursor-pointer" style={{color: '#ccb185'}} onMouseEnter={(e) => e.currentTarget.style.color = '#b8a06c'} onMouseLeave={(e) => e.currentTarget.style.color = '#ccb185'}>
                    Sign in
                  </span>
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}