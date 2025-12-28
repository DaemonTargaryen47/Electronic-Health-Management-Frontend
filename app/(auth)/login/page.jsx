"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { loginUser, isAuthenticated } from "../../../services/authService";
import { useRouter } from "next/navigation";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset errors and messages
    setErrors({});
    setGeneralError("");
    setSuccessMessage("");
    
    if (!email || !password) {
      setGeneralError("Email and password are required");
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await loginUser(email, password);
      
      // Show success message
      setSuccessMessage("Login successful! Redirecting...");
      
      // Redirect to dashboard on successful login
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000); // Short delay to show success message
      
    } catch (error) {
      if (error.errors) {
        // Handle field-specific errors
        setErrors(error.errors);
      } else if (error.error_type) {
        // Handle single field error with error_type
        const errors = {};
        errors[error.error_type] = error.message;
        setErrors(errors);
      } else {
        // Handle general error
        setGeneralError(error.message || "Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[90vh] items-center justify-center">
      <div className="w-full max-w-md space-y-6 rounded border p-8">
        <h2 className="text-center text-2xl font-bold">Login</h2>
        
        {generalError && (
          <div className="alert alert-error">
            <span>{generalError}</span>
          </div>
        )}
        
        {successMessage && (
          <div className="alert alert-success">
            <span>{successMessage}</span>
          </div>
        )}
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="input input-bordered flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-4 w-4 opacity-70"
              >
                <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
                <path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
              </svg>
              <input
                type="text"
                className="grow"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            {errors.email && <div className="text-sm text-error mt-1">{errors.email}</div>}
          </div>
          
          <div>
            <label className="input input-bordered flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-4 w-4 opacity-70"
              >
                <path
                  fillRule="evenodd"
                  d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type="password"
                className="grow"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {errors.password && <div className="text-sm text-error mt-1">{errors.password}</div>}
          </div>

          <div className="w-full text-center">
            <button
              type="submit"
              className="btn btn-primary mt-5 w-full rounded-lg font-bold"
              disabled={loading}
            >
              {loading ? <span className="loading loading-spinner"></span> : "Login"}
            </button>
          </div>

          <p className="text-center text-base">
            Don't have an account?{" "}
            <Link href={"/signup"} className="text-blue-700">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
