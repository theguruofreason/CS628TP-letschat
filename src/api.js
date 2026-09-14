const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";
const WS_BASE_URL =
  process.env.REACT_APP_WS_BASE_URL || API_BASE_URL.replace(/^http/, "ws");

export function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

async function apiFetch(path, options = {}) {
  const { accessToken, headers, ...rest } = options;
  const finalHeaders = { ...headers };
  if (accessToken) finalHeaders["Authorization"] = `bearer ${accessToken}`;
  if (rest.body && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }
  return fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    credentials: "include",
  });
}

// The backend currently responds with res.json(JSON.stringify({ accessToken })),
// which double-encodes the body, so it has to be parsed twice.
async function parseTokenResponse(res) {
  const raw = await res.json();
  const data = typeof raw === "string" ? JSON.parse(raw) : raw;
  return data.accessToken;
}

export async function login(user, password) {
  const res = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ user, password }),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  const accessToken = await parseTokenResponse(res);
  return { uname: user, accessToken };
}

export async function logout() {
  const res = await apiFetch("/auth/logout");
  if (!res.ok) {
    throw new Error(await res.text());
  }
}

export async function register(user, password) {
  const res = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ user, password }),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return;
}

// Called on app load: use the httpOnly refresh cookie (if any) to get a
// fresh access token so a returning user doesn't have to log in again.
export async function refreshSession() {
  try {
    const res = await apiFetch("/auth/refresh");
    if (!res.ok) return null;
    const accessToken = await parseTokenResponse(res);
    const payload = decodeJwtPayload(accessToken);
    if (!payload?.user) return null;
    return { uname: payload.user, accessToken };
  } catch {
    return null;
  }
}

export async function fetchProfile(accessToken) {
  const res = await apiFetch("/profile", { accessToken });
  if (!res.ok) throw new Error("Failed to load profile.");
  return res.json();
}

export async function updateProfile(accessToken, updates) {
  const res = await apiFetch("/profile", {
    method: "PUT",
    accessToken,
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to save profile.");
  return res.json();
}

export async function fetchChatHistory() {
  const res = await apiFetch("/chat/history");
  if (!res.ok) throw new Error("Failed to load chat history.");
  return res.json();
}

export async function fetchMyMessages(accessToken) {
  const res = await apiFetch("/chat/mine", { accessToken });
  if (!res.ok) throw new Error("Failed to load saved chat history.");
  return res.json();
}

export function getWebSocketUrl(accessToken) {
  return `${WS_BASE_URL}/ws?token=${encodeURIComponent(accessToken)}`;
}
