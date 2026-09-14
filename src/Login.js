import { useContext, useState } from "react";
import { useNavigate } from "react-router";
import { UnameContext } from "./unameContext";
import { login } from "./api";

export default function Login() {
  const { setAuth } = useContext(UnameContext);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handleLogin(formData) {
    setError(null);
    try {
      const { uname, accessToken } = await login(
        formData.get("username"),
        formData.get("password"),
      );
      setAuth(uname, accessToken);
      navigate("/chat");
    } catch {
      setError("Login failed. Check your username and password.");
    }
  }

  return (
    <div className="auth-page">
      <form action={handleLogin} className="card auth-form">
        <h2>Welcome back</h2>
        <div className="formline">
          <label htmlFor="username">username</label>
          <input
            id="username"
            name="username"
            type="text"
            placeholder="username"
            required
          />
        </div>
        <div className="formline">
          <label htmlFor="password">password</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="password"
            required
          />
        </div>
        <button type="submit">Login</button>
        {error && <p className="login-error">{error}</p>}
      </form>
    </div>
  );
}
