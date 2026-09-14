import { useContext } from "react";
import { NavLink } from "react-router";
import { UnameContext } from "./unameContext";

export default function NavBar() {
  const { uname } = useContext(UnameContext);

  return (
    <nav className="navbar">
      <NavLink to="/" end className="navbar-brand">
        Let's Chat
      </NavLink>
      <ul>
        <li>
          <NavLink to="/" end>
            Home
          </NavLink>
        </li>
        <li>
          <NavLink to="/chat">Chat</NavLink>
        </li>
        {uname !== null ? (
          <>
            <li>
              <NavLink to="/profile">Profile</NavLink>
            </li>
            <li>
              <NavLink to="/logout">Logout</NavLink>
            </li>
          </>
        ) : (
          <>
            <li>
              <NavLink to="/login">Login</NavLink>
            </li>
            <li>
              <NavLink to="/register">Register</NavLink>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
