import { register } from "./api";
import { useNavigate } from "react-router";
import { useState } from "react";

export default function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  function handleRegister(formdata) {
    setError(null);
    register(formdata.get("username"), formdata.get("password"))
      .then(() => navigate("/login"))
      .catch((err) => {
        console.error(err);
        setError("Registration failed. Try a different username.");
      });
  }

  return (
    <div className="auth-page">
      <form action={handleRegister} className="card auth-form">
        <h2>Create an account</h2>
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
        <button type="submit">Register</button>
        {error && <p className="login-error">{error}</p>}
      </form>
    </div>
  );
}
