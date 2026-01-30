import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function RegisterPage() {
    const [firstName, setFirstName] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");

    const { register } = useUser();
    const { toast } = useToast();
    const [, setLocation] = useLocation();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await register(firstName, password, email);
            setLocation("/");
            toast({ title: "Welcome!", description: "Account created successfully." });
        } catch (error) {
            toast({
                title: "Registration Failed",
                description: (error as Error).message,
                variant: "destructive",
            });
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <Card className="w-full max-w-md neo-box p-6">
                <CardHeader>
                    <CardTitle className="text-3xl font-black uppercase text-center">Create Account</CardTitle>
                </CardHeader>
                <form onSubmit={handleRegister}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>First Name</Label>
                            <Input
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="neo-input w-full"
                                placeholder="Your Name"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="neo-input"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Password</Label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="neo-input"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button
                            type="submit"
                            className="w-full neo-btn-primary bg-[#E1306C] text-white"
                        >
                            Sign Up
                        </Button>
                        <p className="text-center text-sm text-muted-foreground font-bold">
                            Already have an account? <span className="underline cursor-pointer hover:text-primary" onClick={() => setLocation("/login")}>Log in</span>
                        </p>
                        <p className="text-center text-xs text-muted-foreground mt-2 font-bold">
                            <span className="underline cursor-pointer hover:text-primary" onClick={() => setLocation("/")}>← Back to Home</span>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
