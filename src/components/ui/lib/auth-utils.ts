"use client";

import { toast } from "sonner";
import { jwtDecode } from "jwt-decode";

/**
 * LocalStorage-safe wrapper
 */
const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (err) {
      console.error(
        `[auth-util] localStorage getItem failed for "${key}"`,
        err
      );
      toast.error(
        "Local storage access denied. Please check your browser settings."
      );
      return null;
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.error(
        `[auth-util] localStorage removeItem failed for "${key}"`,
        err
      );
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      console.error(
        `[auth-util] localStorage setItem failed for "${key}"`,
        err
      );
      toast.error("Could not save to local storage.");
    }
  },
};

export const TOKEN_KEY = "token";

/**
 * Generic toast function for consistency
 */
type ToastVariant =
  | "default"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "destructive";

export const showToast = ({
  variant = "default",
  title,
  description,
}: {
  variant?: ToastVariant;
  title?: string;
  description?: string;
}) => {
  const mappedVariant = variant === "destructive" ? "error" : variant;

  if (title) {
    toast[mappedVariant === "default" ? "message" : mappedVariant](title, {
      description,
    });
  } else if (description) {
    toast[mappedVariant === "default" ? "message" : mappedVariant](description);
  }
};

/**
 * Handles logout: clears token + shows feedback
 */
export const handleLogout = async () => {
  try {
    safeLocalStorage.removeItem(TOKEN_KEY);
    // Remove other auth keys if needed
    toast.success("Logged out", {
      description: "You have been successfully logged out.",
    });
  } catch (err) {
    console.error("Logout failed:", err);
    toast.error("Logout Failed", {
      description: "Something went wrong during logout.",
    });
  }
};

/**
 * Reads token from localStorage
 */
export const getToken = (): string | null => {
  return safeLocalStorage.getItem(TOKEN_KEY);
};

/**
 * JWT payload type
 */
interface JWTPayload {
  exp: number;
  iat?: number;
}

/**
 * Parses expiry from JWT
 */
export const getTokenExpiry = (): number | null => {
  const token = getToken();
  if (!token) return null;
  try {
    const { exp } = jwtDecode<JWTPayload>(token);
    return exp ? exp * 1000 : null;
  } catch (err) {
    console.warn("[auth-util] Failed to decode JWT:", err);
    return null;
  }
};

/**
 * Checks if token is expired
 */
export const isTokenExpired = (): boolean => {
  const expiry = getTokenExpiry();
  return expiry !== null && Date.now() > expiry;
};

/**
 * User module + data type
 */
export interface UserModule {
  id: string;
  name: string;
}
export interface UserData {
  userAvatar: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  userCompany: string;
  accountStatus: string;
  userModules: UserModule[];
}

/**
 * Extract user data from localStorage
 */
export const getUserDataFromLocalStorage = (): UserData | null => {
  if (typeof window === "undefined") return null;

  try {
    const userId = safeLocalStorage.getItem("userId");
    const userName = safeLocalStorage.getItem("userName");
    const userEmail = safeLocalStorage.getItem("userEmail");
    const userRole = safeLocalStorage.getItem("userRole");
    const userCompany = safeLocalStorage.getItem("userCompany");
    const accountStatus = safeLocalStorage.getItem("accountStatus");
    const userModulesRaw = safeLocalStorage.getItem("userModules");

    if (!userId || !userName) return null;

    const userModules: UserModule[] = userModulesRaw
      ? JSON.parse(userModulesRaw)
      : [];

    return {
      userId,
      userName,
      userEmail: userEmail || "",
      userRole: userRole || "",
      userCompany: userCompany || "",
      accountStatus: accountStatus || "",
      userModules,
      userAvatar: "", // Add if stored separately
    };
  } catch (err) {
    console.error("[auth-util] Failed to parse user data:", err);
    toast.error("Error reading your user profile.");
    return null;
  }
};
