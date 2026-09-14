import { useContext, useEffect, useRef, useState } from "react";
import { UnameContext } from "./unameContext";
import { fetchMyMessages, fetchProfile, updateProfile } from "./api";

const MAX_AVATAR_FILE_BYTES = 2 * 1024 * 1024; // 2MB

export default function Profile() {
  const { uname, accessToken } = useContext(UnameContext);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);

  const [displayName, setDisplayName] = useState("");
  const [contact, setContact] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!accessToken) return undefined;
    let cancelled = false;

    fetchProfile(accessToken)
      .then((profile) => {
        if (cancelled) return;
        setDisplayName(profile.displayName || "");
        setContact(profile.contact || "");
        setAvatar(profile.avatar || null);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load your profile.");
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return undefined;
    let cancelled = false;

    fetchMyMessages(accessToken)
      .then((history) => {
        if (!cancelled) setMessages(history);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load your saved chat history.");
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again later
    if (!file) return;
    if (file.size > MAX_AVATAR_FILE_BYTES) {
      setSaveMessage("That photo is too large - pick something under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    setSaveMessage(null);
    try {
      await updateProfile(accessToken, { displayName, contact, avatar });
      setSaveMessage("Saved!");
    } catch {
      setSaveMessage("Couldn't save your profile.");
    } finally {
      setSaving(false);
    }
  }

  if (!uname) {
    return (
      <div className="auth-page">
        <div className="card auth-form">
          <p>
            Please <a href="/login">log in</a> to view your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card profile-div">
      <h2>{uname}</h2>

      <div className="profile-header">
        <button
          type="button"
          className="profile-avatar-button"
          onClick={() => fileInputRef.current?.click()}
          title="Change photo"
        >
          {avatar ? (
            <img className="profile-avatar" src={avatar} alt="" />
          ) : (
            <span className="profile-avatar profile-avatar-placeholder">
              {uname[0].toUpperCase()}
            </span>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleAvatarChange}
        />

        <div className="profile-fields">
          <div className="formline">
            <label htmlFor="displayName">name</label>
            <input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={uname}
            />
          </div>
          <div className="formline">
            <label htmlFor="contact">contact</label>
            <input
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="email or phone"
            />
          </div>
          <button type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
          {saveMessage && (
            <p className="profile-save-message">{saveMessage}</p>
          )}
        </div>
      </div>

      <h3>Your saved chat history</h3>
      {error && <p className="profile-error">{error}</p>}
      <ul className="profile-history">
        {messages.map((m) => (
          <li key={m._id}>
            <span className="profile-history-text">{m.message}</span>
            <span className="profile-history-time">
              {new Date(m.date).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
      {messages.length === 0 && !error && <p>No saved messages yet.</p>}
    </div>
  );
}
