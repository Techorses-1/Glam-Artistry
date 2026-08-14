import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FiX, FiEye, FiEyeOff } from "react-icons/fi";
import "./ForgotPasswordModal.scss";

const ForgotPasswordModal = ({ onClose }) => {
    const [step, setStep] = useState(1); // 1=email, 2=otp, 3=newPassword
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resetToken, setResetToken] = useState("");
    const [timeLeft, setTimeLeft] = useState(0);
    const [canResend, setCanResend] = useState(false);

    // Timer for OTP expiry
    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [timeLeft]);

    const startTimer = () => {
        setTimeLeft(300); // 5 minutes = 300 seconds
        setCanResend(false);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // Step 1: Send OTP
    const handleSendOTP = async (e) => {
        e.preventDefault();

        if (!email) {
            toast.error("Please enter your email");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/users/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success("OTP sent to your email!");
                setStep(2);
                startTimer();
            } else {
                toast.error(data.message || "Failed to send OTP");
            }
        } catch (error) {
            toast.error("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault();

        if (!otp || otp.length !== 6) {
            toast.error("Please enter valid 6-digit OTP");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/users/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success("OTP verified successfully!");
                setResetToken(data.resetToken);
                setStep(3);
            } else {
                toast.error(data.message || "Invalid OTP");
            }
        } catch (error) {
            toast.error("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/users/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    resetToken: resetToken,
                    newPassword: newPassword
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Password reset successful! Please login.");
                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                toast.error(data.message || "Failed to reset password");
            }
        } catch (error) {
            toast.error("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResendOTP = async () => {
        if (!canResend) return;

        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/users/resend-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success("New OTP sent to your email!");
                startTimer();
            } else {
                toast.error(data.message || "Failed to resend OTP");
            }
        } catch (error) {
            toast.error("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fpm__overlay" onClick={onClose}>
            <div className="fpm__modal" onClick={(e) => e.stopPropagation()}>
                <div className="fpm__header">
                    <h2>Reset Password</h2>
                    <button className="fpm__close-btn" onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                <div className="fpm__body">
                    {/* STEP 1: EMAIL */}
                    {step === 1 && (
                        <>
                            <p className="fpm__description">
                                Enter your email address and we'll send you a 6-digit OTP to reset your password.
                            </p>
                            <form onSubmit={handleSendOTP} className="fpm__form">
                                <div className="fpm__form-group">
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="fpm__input"
                                    />
                                </div>
                                <button type="submit" className="fpm__submit-btn" disabled={loading}>
                                    {loading ? "Sending..." : "Send OTP"}
                                </button>
                            </form>
                        </>
                    )}

                    {/* STEP 2: OTP VERIFICATION */}
                    {step === 2 && (
                        <>
                            <p className="fpm__description">
                                Enter the 6-digit OTP sent to <strong>{email}</strong>
                            </p>
                            <form onSubmit={handleVerifyOTP} className="fpm__form">
                                <div className="fpm__form-group">
                                    <input
                                        type="text"
                                        placeholder="Enter 6-digit OTP"
                                        maxLength="6"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                        required
                                        className="fpm__input fpm__otp-input"
                                    />
                                </div>

                                <div className="fpm__timer">
                                    {timeLeft > 0 ? (
                                        <span className="fpm__timer-text">
                                            ⏱️ OTP expires in: {formatTime(timeLeft)}
                                        </span>
                                    ) : (
                                        <span className="fpm__timer-expired">OTP expired</span>
                                    )}
                                </div>

                                <button type="submit" className="fpm__submit-btn" disabled={loading}>
                                    {loading ? "Verifying..." : "Verify OTP"}
                                </button>

                                <button
                                    type="button"
                                    className="fpm__resend-btn"
                                    onClick={handleResendOTP}
                                    disabled={!canResend || loading}
                                >
                                    {canResend ? "Resend OTP" : `Resend available in ${formatTime(timeLeft)}`}
                                </button>
                            </form>
                        </>
                    )}

                    {/* STEP 3: NEW PASSWORD */}
                    {step === 3 && (
                        <>
                            <p className="fpm__description">
                                Create a new password for your account
                            </p>
                            <form onSubmit={handleResetPassword} className="fpm__form">
                                <div className="fpm__form-group">
                                    <div className="fpm__password-wrapper">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="New Password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            className="fpm__input"
                                        />
                                        <button
                                            type="button"
                                            className="fpm__eye-btn"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <FiEyeOff /> : <FiEye />}
                                        </button>
                                    </div>
                                </div>

                                <div className="fpm__form-group">
                                    <div className="fpm__password-wrapper">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirm New Password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="fpm__input"
                                        />
                                        <button
                                            type="button"
                                            className="fpm__eye-btn"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" className="fpm__submit-btn" disabled={loading}>
                                    {loading ? "Resetting..." : "Reset Password"}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordModal;