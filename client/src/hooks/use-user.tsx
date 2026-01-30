
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { User, InsertUser } from "@shared/schema";

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    error: Error | null;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string, email: string) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        fetch("/api/user")
            .then((res) => {
                if (res.ok) return res.json();
                return null;
            })
            .then((u) => setUser(u))
            .catch(() => setUser(null))
            .finally(() => setIsLoading(false));
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                let errorMsg = "Login failed";
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await res.json();
                    errorMsg = errorData.message || errorMsg;
                } else {
                    errorMsg = await res.text() || errorMsg;
                }
                throw new Error(errorMsg);
            }

            const data = await res.json();
            setUser(data);
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (firstName: string, password: string, email: string) => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ firstName, password, email }),
            });

            if (!res.ok) {
                let errorMsg = "Registration failed";
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await res.json();
                    errorMsg = errorData.message || errorMsg;
                } else {
                    errorMsg = await res.text() || errorMsg;
                }
                throw new Error(errorMsg);
            }

            const data = await res.json();
            setUser(data);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        await fetch("/api/logout", { method: "POST" });
        setUser(null);
        setIsLoading(false);
        toast({ title: "Logged out", description: "You have been logged out successfully." });
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, error, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useUser() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useUser must be used within an AuthProvider");
    }
    return context;
}
