import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiEye, FiEyeOff } from "react-icons/fi";
import ForgotPasswordModal from "./ForgotPassword/ForgotPasswordModal";
import "./UserAuth.scss";

const UserAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const navigate = useNavigate();

  // Login validation schema
  const loginSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  // Register validation schema
  const registerSchema = Yup.object({
    name: Yup.string()
      .min(2, "Name must be at least 2 characters")
      .required("Name is required"),
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    phone: Yup.string()
      .matches(/^[0-9]{10}$/, "Phone number must be 10 digits")
      .optional(),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords must match")
      .required("Confirm password is required"),
  });

  // Handle Login
  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Login successful! Redirecting...");
        setTimeout(() => {
          navigate("/");
        }, 1500);
      } else {
        toast.error(data.message || "Login failed");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Register
  const handleRegister = async (values) => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
          phone: values.phone || "",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Registration successful! Please login.");
        setIsLogin(true);
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ua">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <div className="ua__container">
        <div className="ua__card">
          {/* Header */}
          <div className="ua__header">
            <h1 className="ua__title">{isLogin ? "Welcome Back" : "Create Account"}</h1>
            <p className="ua__subtitle">
              {isLogin ? "Login to your account" : "Register to get started"}
            </p>
          </div>

          {/* Toggle Buttons */}
          <div className="ua__toggle">
            <button
              className={`ua__toggle-btn ${isLogin ? "ua__toggle-btn--active" : ""}`}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button
              className={`ua__toggle-btn ${!isLogin ? "ua__toggle-btn--active" : ""}`}
              onClick={() => setIsLogin(false)}
            >
              Register
            </button>
          </div>

          {/* Login Form */}
          {isLogin ? (
            <Formik
              initialValues={{ email: "", password: "" }}
              validationSchema={loginSchema}
              onSubmit={handleLogin}
            >
              {({ values, errors, touched, handleChange, handleBlur }) => (
                <Form className="ua__form">
                  <div className="ua__form-group">
                    <input
                      type="email"
                      name="email"
                      placeholder="Email Address"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={touched.email && errors.email ? "ua__input--error" : "ua__input"}
                    />
                    {touched.email && errors.email && (
                      <span className="ua__error">{errors.email}</span>
                    )}
                  </div>

                  <div className="ua__form-group">
                    <div className="ua__password-wrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Password"
                        value={values.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={touched.password && errors.password ? "ua__input--error" : "ua__input"}
                      />
                      <button
                        type="button"
                        className="ua__eye-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                    {touched.password && errors.password && (
                      <span className="ua__error">{errors.password}</span>
                    )}
                  </div>

                  {/* FORGOT PASSWORD LINK */}
                  <div className="ua__forgot-link">
                    <button
                      type="button"
                      className="ua__forgot-btn"
                      onClick={() => setShowForgotModal(true)}
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="ua__submit-btn"
                    disabled={loading}
                  >
                    {loading ? "Please wait..." : "Login"}
                  </button>

                  <div className="ua__footer">
                    <p>
                      Don't have an account?{" "}
                      <button
                        type="button"
                        className="ua__link-btn"
                        onClick={() => setIsLogin(false)}
                      >
                        Register
                      </button>
                    </p>
                  </div>
                </Form>
              )}
            </Formik>
          ) : (
            // Register Form
            <Formik
              initialValues={{ name: "", email: "", phone: "", password: "", confirmPassword: "" }}
              validationSchema={registerSchema}
              onSubmit={handleRegister}
            >
              {({ values, errors, touched, handleChange, handleBlur }) => (
                <Form className="ua__form">
                  <div className="ua__form-group">
                    <input
                      type="text"
                      name="name"
                      placeholder="Full Name"
                      value={values.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={touched.name && errors.name ? "ua__input--error" : "ua__input"}
                    />
                    {touched.name && errors.name && (
                      <span className="ua__error">{errors.name}</span>
                    )}
                  </div>

                  <div className="ua__form-group">
                    <input
                      type="email"
                      name="email"
                      placeholder="Email Address"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={touched.email && errors.email ? "ua__input--error" : "ua__input"}
                    />
                    {touched.email && errors.email && (
                      <span className="ua__error">{errors.email}</span>
                    )}
                  </div>

                  <div className="ua__form-group">
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone Number (Optional)"
                      value={values.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={touched.phone && errors.phone ? "ua__input--error" : "ua__input"}
                    />
                    {touched.phone && errors.phone && (
                      <span className="ua__error">{errors.phone}</span>
                    )}
                  </div>

                  <div className="ua__form-group">
                    <div className="ua__password-wrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Password"
                        value={values.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={touched.password && errors.password ? "ua__input--error" : "ua__input"}
                      />
                      <button
                        type="button"
                        className="ua__eye-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                    {touched.password && errors.password && (
                      <span className="ua__error">{errors.password}</span>
                    )}
                  </div>

                  <div className="ua__form-group">
                    <div className="ua__password-wrapper">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        value={values.confirmPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={touched.confirmPassword && errors.confirmPassword ? "ua__input--error" : "ua__input"}
                      />
                      <button
                        type="button"
                        className="ua__eye-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                    {touched.confirmPassword && errors.confirmPassword && (
                      <span className="ua__error">{errors.confirmPassword}</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="ua__submit-btn"
                    disabled={loading}
                  >
                    {loading ? "Please wait..." : "Register"}
                  </button>

                  <div className="ua__footer">
                    <p>
                      Already have an account?{" "}
                      <button
                        type="button"
                        className="ua__link-btn"
                        onClick={() => setIsLogin(true)}
                      >
                        Login
                      </button>
                    </p>
                  </div>
                </Form>
              )}
            </Formik>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />
      )}
    </div>
  );
};

export default UserAuth;