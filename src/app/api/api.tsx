const BASE_URL = "http://localhost:8089";

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

// Helper to set token cookie
const setCookie = (name: string, value: string, days = 7) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; expires=${expires}; path=/`;
};

export const apiClient = async <T = unknown,>(
  endpoint: string,
  method: RequestMethod = "POST",
  body?: Record<string, unknown> | FormData | URLSearchParams,
  isFormData: boolean = false,
  isUrlEncoded: boolean = false,
  skipAuth: boolean = false
): Promise<T> => {
  const headers: HeadersInit = {};

  // Authentication
  if (!skipAuth) {
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      console.warn("No authentication token found.");
    }
  }

  // Content-Type
  if (!isFormData && !isUrlEncoded) {
    headers["Content-Type"] = "application/json";
  } else if (isUrlEncoded) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  }
  //Console log the body if request is POSt
  // console.log("API Request:", {
  //   endpoint,
  //   method,
  //   body,
  //   headers,
  // });
  if (method === "POST" || method === "PUT" || method === "PATCH") {
    console.log("Request Body:", body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      body: isFormData
        ? (body as FormData)
        : isUrlEncoded
        ? (body as URLSearchParams)
        : body
        ? JSON.stringify(body)
        : undefined,
    });

    const contentType = response.headers.get("Content-Type") || "";
    const isJson = contentType.includes("application/json");

    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const msg =
        (data as any)?.detail ||
        (data as any)?.message ||
        response.statusText ||
        "Unknown error";
      throw new Error(`API Error (${response.status}): ${msg}`);
    }

    return data as T;
  } catch (error) {
    console.error("API client error:", error);
    throw error;
  }
};

export const loginClient = async <T = unknown,>(
  endpoint: string,
  method: "POST" = "POST",
  body?: Record<string, string>
): Promise<T> => {
  try {
    const response = await apiClient<{
      code:number;
      data:{
        branchId:string;
        memberId:string;
        role:string;
        token:string;
        userId:string;
        username:string;
      }
      message:string;
    }>(endpoint, method, body, false, false);

    console.log("Login response:", response);

    if (!response?.data.token) {
      throw new Error("Login failed: No token received");
    }

    const { code,message,data } = response;

    // Store token
    localStorage.setItem("ktc_token", data.token);
    setCookie("ktc_token", data.token);

    // Store user info
    localStorage.setItem("userId", data.userId);
    localStorage.setItem("userName", data.username);
    localStorage.setItem("userRole", data.role);

    console.log("Login successful");

    // Redirect to dashboard
    window.location.href = "/dashboard";

    return response as T;
  } catch (error) {
  console.error("API client error:", error);

  // Normalize the error
  if (error instanceof Error) {
    throw new Error(error.message || "Something went wrong. Please try again.");
  }

  throw new Error("Unexpected error. Please try again.");
  };
};

export const userLogin = async (formData: Record<string, string>) => {
  return await loginClient<{
    token: string;
  }>("/api/user/auth", "POST", formData);
};
