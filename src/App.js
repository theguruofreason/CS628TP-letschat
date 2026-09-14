import { BrowserRouter, Routes, Route } from "react-router";
import { useCallback, useEffect, useState } from "react";
import { UnameContext } from "./unameContext";
import { decodeJwtPayload, refreshSession } from "./api";
import Chat from "./Chat";
import Home from "./Home";
import Login from "./Login";
import Logout from "./Logout";
import NavBar from "./Navbar";
import Profile from "./Profile";
import Register from "./Register";

function App() {
  const [uname, setUname] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  const setAuth = useCallback((newUname, newAccessToken) => {
    setUname(newUname);
    setAccessToken(newAccessToken);
  }, []);

  // Try to restore a session on load using the httpOnly refresh cookie, so
  // a returning user's profile/chat keep working without logging in again.
  useEffect(() => {
    let cancelled = false;
    refreshSession().then((session) => {
      if (!cancelled && session) {
        setAuth(session.uname, session.accessToken);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [setAuth]);

  // Access tokens only last 5 minutes. Rather than let the chat socket die
  // when one expires, quietly get a new one shortly before it does, using
  // the same httpOnly refresh cookie. Re-runs each time accessToken changes,
  // so it keeps rescheduling itself against the newest token's expiry.
  useEffect(() => {
    if (!accessToken) return undefined;

    const payload = decodeJwtPayload(accessToken);
    if (!payload?.exp) return undefined;

    const msUntilExpiry = payload.exp * 1000 - Date.now();
    const refreshInMs = Math.max(msUntilExpiry - 30_000, 5_000);

    const timeoutId = setTimeout(async () => {
      const session = await refreshSession();
      if (session) {
        setAuth(session.uname, session.accessToken);
      } else {
        // Refresh cookie is gone/expired/invalidated (e.g. logged out
        // elsewhere) - drop back to logged-out state instead of keeping a
        // dead token around.
        setAuth(null, null);
      }
    }, refreshInMs);

    return () => clearTimeout(timeoutId);
  }, [accessToken, setAuth]);

  return (
    <div className="app">
      <UnameContext value={{ uname, accessToken, setAuth }}>
        <BrowserRouter>
          <NavBar />
          <div className="page">
            <Routes>
              <Route exact path="/" element={<Home />} />
              <Route exact path="/chat" element={<Chat preview={false} />} />
              <Route exact path="/login" element={<Login />} />
              <Route exact path="/profile" element={<Profile />} />
              <Route exact path="/register" element={<Register />} />
              <Route
                exact
                path="/logout"
                element={<Logout {...{ setAuth }} />}
              />
            </Routes>
          </div>
        </BrowserRouter>
      </UnameContext>
    </div>
  );
}

export default App;
