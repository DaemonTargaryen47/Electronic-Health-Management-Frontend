"use client";
import Link from "next/link";
import React, { useState } from "react";
import { registerUser } from "../../../services/authService";
import { useRouter } from "next/navigation";

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name || formData.name.length < 3) {
      newErrors.name = "Name is required and must be at least 3 characters";
    }
    
    if (!formData.email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      newErrors.email = "Valid email is required";
    }
    
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = "Password is required and must be at least 8 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setGeneralError("");
      
      const { name, email, password, phone } = formData;
      const response = await registerUser(name, email, password, phone);
      
      if (response.success) {
        // Display success message
        setGeneralError("Successfully signed-up");
        // Redirect to login page after successful registration
        router.push("/login");
      }
    } catch (error) {
      console.error("Registration error:", error);
      
      // Check if the error contains backend validation errors
      if (error.response && error.response.data && error.response.data.errors) {
        // Set field-specific errors from the backend
        setErrors(error.response.data.errors);
        
        // If there's a specific email conflict error, highlight it
        if (error.response.data.errors.email === 'Email already in use') {
          setGeneralError("An account with this email already exists.");
        } else {
          setGeneralError("Please correct the errors below.");
        }
      } else if (error.errors) {
        // Alternative error format
        setErrors(error.errors);
        
        if (error.errors.email === 'Email already in use') {
          setGeneralError("An account with this email already exists.");
        } else {
          setGeneralError("Please correct the errors below.");
        }
      } else {
        // For general errors without field specifics
        setGeneralError(error.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[90vh] items-center justify-center">
      <div className="w-full max-w-md space-y-6 rounded border p-8">
        <h2 className="text-center text-2xl font-bold">Sign Up</h2>
        
        {generalError && (
          <div className="alert alert-error">
            <span>{generalError}</span>
          </div>
        )}
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="input input-bordered flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-4 w-4 opacity-70"
            >
              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
            </svg>
            <input
              type="text"
              className="grow"
              placeholder="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </label>
          {errors.name && <p className="text-error text-sm">{errors.name}</p>}

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
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </label>
          {errors.email && <p className="text-error text-sm">{errors.email}</p>}

          <label className="input input-bordered flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-4 w-4 opacity-70"
            >
              <path d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm0-8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm-1 4a1 1 0 1 1 2 0v3a1 1 0 1 1-2 0v-3Z" />
            </svg>
            <input
              type="tel"
              className="grow"
              placeholder="Phone (optional)"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </label>

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
              placeholder="Password (min 8 characters)"
              name="password"
              value={formData.password}
              onChange={handleChange}
            />
          </label>
          {errors.password && <p className="text-error text-sm">{errors.password}</p>}

          <div className="w-full text-center">
            <button
              type="submit"
              className="btn btn-primary mt-5 w-full rounded-lg font-bold"
              disabled={loading}
            >
              {loading ? <span className="loading loading-spinner"></span> : "Register"}
            </button>
          </div>

          <p className="text-center text-base">
            Already have an account?{" "}
            <Link href={"/login"} className="text-blue-700">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUpPage;
