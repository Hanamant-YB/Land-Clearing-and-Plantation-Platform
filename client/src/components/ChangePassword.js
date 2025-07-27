import React, { useState } from "react";
import axios from "axios";

function ChangePassword({ defaultEmail = "" }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(defaultEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(''); // 'error' or 'success'
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const sendOtp = async () => {
    setLoading(true);
    setMessage("");
    try {
      await axios.post("/api/users/send-otp", { email });
      setStep(2);
      setMessage("OTP sent to your email.");
      setMessageType('success');
    } catch (err) {
      setMessage(err.response?.data?.message || "Error sending OTP");
      setMessageType('error');
    }
    setLoading(false);
  };

  const verifyOtp = async () => {
    setLoading(true);
    setMessage("");
    try {
      await axios.post("/api/users/verify-otp", { email, otp });
      setStep(3);
      setMessage("OTP verified. Enter your new password.");
      setMessageType('success');
    } catch (err) {
      setMessage(err.response?.data?.message || "Error verifying OTP");
      setMessageType('error');
    }
    setLoading(false);
  };

  const changePassword = async () => {
    setMessage("");
    if (step !== 3) {
      setMessage("OTP not verified");
      setMessageType('error');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      setMessageType('error');
      return;
    }
    setLoading(true);
    try {
      await axios.post("/api/users/change-password", { email, newPassword });
      setMessage("Password changed successfully!");
      setMessageType('success');
      setStep(1);
      setEmail(defaultEmail);
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setMessage(err.response?.data?.message || "Error changing password");
      setMessageType('error');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: 24, border: "1px solid #ccc", borderRadius: 8 }}>
      <h2>Change Password</h2>
      {message && (
        <div style={{ color: messageType === 'success' ? 'green' : 'red' }}>
          {message}
        </div>
      )}
      {step === 1 && (
        <>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: "100%", marginBottom: 12, padding: 8 }}
            disabled={loading || !!defaultEmail}
            readOnly={!!defaultEmail}
          />
          <button onClick={sendOtp} disabled={loading || !email} style={{ width: "100%", padding: 10 }}>
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </>
      )}
      {step === 2 && (
        <>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            style={{ width: "100%", marginBottom: 12, padding: 8 }}
            disabled={loading}
          />
          <button onClick={verifyOtp} disabled={loading || !otp} style={{ width: "100%", padding: 10 }}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </>
      )}
      {step === 3 && (
        <>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
            <input
              type={showNewPassword ? "text" : "password"}
              placeholder="New Password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              style={{ width: "100%", padding: 8 }}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(prev => !prev)}
              style={{ marginLeft: 8, padding: '8px 12px', cursor: 'pointer' }}
              tabIndex={-1}
            >
              {showNewPassword ? "Hide" : "Show"}
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              style={{ width: "100%", padding: 8 }}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(prev => !prev)}
              style={{ marginLeft: 8, padding: '8px 12px', cursor: 'pointer' }}
              tabIndex={-1}
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>
          <button onClick={changePassword} disabled={loading || !newPassword || !confirmPassword} style={{ width: "100%", padding: 10 }}>
            {loading ? "Changing..." : "Change Password"}
          </button>
        </>
      )}
    </div>
  );
}

export default ChangePassword;
