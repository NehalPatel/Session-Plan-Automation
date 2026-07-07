const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error ?? "Request failed");
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json() as Promise<T>;
  }

  return response as unknown as T;
}

function parseFilename(disposition: string | null, fallback: string): string {
  if (!disposition) return fallback;
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const plainMatch = disposition.match(/filename="([^"]+)"/i);
  if (plainMatch?.[1]) return plainMatch[1];
  return fallback;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: async (path: string) => {
    const token = getToken();
    const response = await fetch(`${API_URL}${path}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error ?? "Delete failed");
    }
  },
  download: async (path: string, fallbackName: string) => {
    const token = getToken();
    const response = await fetch(`${API_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error ?? "Download failed");
    }

    const contentType = response.headers.get("content-type") ?? "";
    const disposition = response.headers.get("content-disposition");
    let filename = parseFilename(disposition, fallbackName);

    if (filename === fallbackName && contentType.includes("zip") && !filename.endsWith(".zip")) {
      filename = fallbackName.replace(/\.docx$/i, ".zip");
    }

    const blob = await response.blob();
    const typedBlob =
      contentType && blob.type !== contentType ? new Blob([blob], { type: contentType }) : blob;
    const url = URL.createObjectURL(typedBlob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    return { filename, contentType };
  },
};
