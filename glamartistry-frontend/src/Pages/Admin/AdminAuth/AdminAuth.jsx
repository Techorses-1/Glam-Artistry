import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser } from 'react-icons/fi';
import './AdminAuth.scss';

const AdminAuth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const loginSchema = Yup.object({
        email: Yup.string().email('Invalid email address').required('Email is required'),
        password: Yup.string().min(6, 'Minimum 6 characters').required('Password is required'),
    });

    const registerSchema = Yup.object({
        name: Yup.string().min(2, 'Minimum 2 characters').required('Name is required'),
        email: Yup.string().email('Invalid email address').required('Email is required'),
        password: Yup.string().min(6, 'Minimum 6 characters').required('Password is required'),
        confirmPassword: Yup.string()
            .oneOf([Yup.ref('password'), null], 'Passwords must match')
            .required('Confirm password is required'),
    });

    const handleLogin = async (values) => {
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(values),
            });
            const data = await response.json();
            if (response.ok) {
                toast.success('Login successful! Redirecting...');
                setTimeout(() => navigate('/admin/dashboard'), 1500);
            } else {
                toast.error(data.message || 'Login failed');
            }
        } catch {
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (values) => {
        setLoading(true);
        try {
            const { confirmPassword, ...registerData } = values;
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registerData),
            });
            const data = await response.json();
            if (response.ok) {
                toast.success('Registration successful! Please login.');
                setIsLogin(true);
            } else {
                toast.error(data.message || 'Registration failed');
            }
        } catch {
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-auth">
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                pauseOnHover
                theme="light"
            />

            {/* LEFT PANEL */}
            {/* <div className="auth-left">
                <div className="auth-left__content">
                    <div className="auth-left__logo">GA</div>
                    <h1>Glam Artistry</h1>
                    <p>Admin Dashboard — manage your products, orders, and customers from one place.</p>
                    <div className="auth-left__dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </div> */}

            {/* RIGHT PANEL */}
            <div className="auth-right">
                <div className="auth-card">

                    {/* HEADER */}
                    <div className="auth-header">
                        <h2>{isLogin ? 'Welcome back' : 'Create account'}</h2>
                        <p>{isLogin ? 'Sign in to your admin account' : 'Register a new admin account'}</p>
                    </div>

                    {/* TOGGLE */}
                    <div className="auth-toggle">
                        <button
                            className={`toggle-btn ${isLogin ? 'active' : ''}`}
                            onClick={() => setIsLogin(true)}
                        >
                            Login
                        </button>
                        <button
                            className={`toggle-btn ${!isLogin ? 'active' : ''}`}
                            onClick={() => setIsLogin(false)}
                        >
                            Register
                        </button>
                    </div>

                    {/* LOGIN FORM */}
                    {isLogin ? (
                        <Formik
                            initialValues={{ email: '', password: '' }}
                            validationSchema={loginSchema}
                            onSubmit={handleLogin}
                        >
                            {({ values, errors, touched, handleChange, handleBlur }) => (
                                <Form className="auth-form">

                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <div className="input-wrapper">
                                            <FiMail className="input-icon" />
                                            <input
                                                type="email"
                                                name="email"
                                                placeholder="admin@example.com"
                                                value={values.email}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={touched.email && errors.email ? 'error' : ''}
                                            />
                                        </div>
                                        {touched.email && errors.email && (
                                            <span className="error-message">{errors.email}</span>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label>Password</label>
                                        <div className="input-wrapper">
                                            <FiLock className="input-icon" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                placeholder="Enter your password"
                                                value={values.password}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={touched.password && errors.password ? 'error' : ''}
                                            />
                                            <button
                                                type="button"
                                                className="eye-btn"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <FiEyeOff /> : <FiEye />}
                                            </button>
                                        </div>
                                        {touched.password && errors.password && (
                                            <span className="error-message">{errors.password}</span>
                                        )}
                                    </div>

                                    <button type="submit" className="submit-btn" disabled={loading}>
                                        {loading ? <span className="btn-loader"></span> : 'Sign In'}
                                    </button>

                                </Form>
                            )}
                        </Formik>
                    ) : (
                        /* REGISTER FORM */
                        <Formik
                            initialValues={{ name: '', email: '', password: '', confirmPassword: '' }}
                            validationSchema={registerSchema}
                            onSubmit={handleRegister}
                        >
                            {({ values, errors, touched, handleChange, handleBlur }) => (
                                <Form className="auth-form">

                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <div className="input-wrapper">
                                            <FiUser className="input-icon" />
                                            <input
                                                type="text"
                                                name="name"
                                                placeholder="Your full name"
                                                value={values.name}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={touched.name && errors.name ? 'error' : ''}
                                            />
                                        </div>
                                        {touched.name && errors.name && (
                                            <span className="error-message">{errors.name}</span>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <div className="input-wrapper">
                                            <FiMail className="input-icon" />
                                            <input
                                                type="email"
                                                name="email"
                                                placeholder="admin@example.com"
                                                value={values.email}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={touched.email && errors.email ? 'error' : ''}
                                            />
                                        </div>
                                        {touched.email && errors.email && (
                                            <span className="error-message">{errors.email}</span>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label>Password</label>
                                        <div className="input-wrapper">
                                            <FiLock className="input-icon" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                placeholder="Create a password"
                                                value={values.password}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={touched.password && errors.password ? 'error' : ''}
                                            />
                                            <button
                                                type="button"
                                                className="eye-btn"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <FiEyeOff /> : <FiEye />}
                                            </button>
                                        </div>
                                        {touched.password && errors.password && (
                                            <span className="error-message">{errors.password}</span>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label>Confirm Password</label>
                                        <div className="input-wrapper">
                                            <FiLock className="input-icon" />
                                            <input
                                                type={showConfirm ? 'text' : 'password'}
                                                name="confirmPassword"
                                                placeholder="Repeat your password"
                                                value={values.confirmPassword}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={touched.confirmPassword && errors.confirmPassword ? 'error' : ''}
                                            />
                                            <button
                                                type="button"
                                                className="eye-btn"
                                                onClick={() => setShowConfirm(!showConfirm)}
                                            >
                                                {showConfirm ? <FiEyeOff /> : <FiEye />}
                                            </button>
                                        </div>
                                        {touched.confirmPassword && errors.confirmPassword && (
                                            <span className="error-message">{errors.confirmPassword}</span>
                                        )}
                                    </div>

                                    <button type="submit" className="submit-btn" disabled={loading}>
                                        {loading ? <span className="btn-loader"></span> : 'Create Account'}
                                    </button>

                                </Form>
                            )}
                        </Formik>
                    )}

                </div>
            </div>
        </div>
    );
};

export default AdminAuth;