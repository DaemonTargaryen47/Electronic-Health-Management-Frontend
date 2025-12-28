"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserProfile, updateUserProfile } from "@/services/profileService";
import { getHealthInfo, createHealthInfo, updateHealthInfo, deleteHealthInfo } from "@/services/healthService";
import { isAuthenticated } from "@/services/authService";
import { AlertCircle, Heart, Trash2, PlusCircle, Edit3, Activity } from "lucide-react";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    mfa_enabled: false,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [healthInfo, setHealthInfo] = useState(null);
  const [healthEditing, setHealthEditing] = useState(false);
  const [healthFormData, setHealthFormData] = useState({
    blood_group: "",
    allergies: "",
    drug_reactions: "",
    complexities: "",
    details: {
      height: "",
      weight: "",
      emergency_contact: "",
      chronic_conditions: ""
    }
  });
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    // Fetch user profile data
    const fetchUserProfile = async () => {
      try {
        setFetchLoading(true);
        const response = await getCurrentUserProfile();
        if (response.success) {
          setUser(response.user);
          setFormData({
            name: response.user.name || "",
            email: response.user.email || "",
            phone: response.user.phone || "",
            mfa_enabled: response.user.mfa_enabled || false,
          });
        }

        // Fetch health information
        await fetchHealthInfo();
      } catch (error) {
        setMessage({
          text: error.message || "Failed to load profile. Please try again later.",
          type: "error",
        });
      } finally {
        setFetchLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  const fetchHealthInfo = async () => {
    try {
      const response = await getHealthInfo();

      if (response.success && response.health_info) {
        setHealthInfo(response.health_info);

        // Initialize form with current data
        setHealthFormData({
          blood_group: response.health_info.blood_group || "",
          allergies: response.health_info.allergies || "",
          drug_reactions: response.health_info.drug_reactions || "",
          complexities: response.health_info.complexities || "",
          details: response.health_info.details || {
            height: "",
            weight: "",
            emergency_contact: "",
            chronic_conditions: ""
          }
        });
      }
    } catch (error) {
      console.error("Failed to load health information:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleHealthChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      // Handle nested details fields
      const [parent, child] = name.split('.');
      setHealthFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setHealthFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name || formData.name.length < 3) {
      newErrors.name = "Name is required and must be at least 3 characters";
    }

    if (!formData.email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      newErrors.email = "Valid email is required";
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
      setMessage({ text: "", type: "" });

      const response = await updateUserProfile(formData);

      if (response.success) {
        setUser(response.user);
        setMessage({
          text: "Profile updated successfully!",
          type: "success",
        });
        setIsEditing(false);
      }
    } catch (error) {
      // Handle field-specific errors
      if (error.errors) {
        setErrors(error.errors);
      }

      setMessage({
        text: error.message || "Failed to update profile. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHealthSubmit = async (e) => {
    e.preventDefault();
    setHealthLoading(true);
    setHealthError("");

    try {
      // Prepare data for submission - all fields are optional on the backend
      const healthData = {
        blood_group: healthFormData.blood_group || null,
        allergies: healthFormData.allergies || null,
        drug_reactions: healthFormData.drug_reactions || null,
        complexities: healthFormData.complexities || null,
        details: healthFormData.details || {}
      };

      let response;

      if (healthInfo) {
        // Update existing health info
        response = await updateHealthInfo(healthData);
      } else {
        // Create new health info
        response = await createHealthInfo(healthData);
      }

      if (response.success) {
        if (response.health_info) {
          setHealthInfo(response.health_info);
        } else {
          // Refetch to get the complete data if not returned by create endpoint
          await fetchHealthInfo();
        }

        setHealthEditing(false);
        setMessage({
          text: healthInfo ? "Health information updated successfully!" : "Health information saved successfully!",
          type: "success"
        });
      }
    } catch (error) {
      setHealthError(error.message || "Failed to save health information");
    } finally {
      setHealthLoading(false);
    }
  };

  const handleDeleteHealthInfo = async () => {
    if (!confirm("Are you sure you want to delete your health information? This action cannot be undone.")) {
      return;
    }

    setHealthLoading(true);
    try {
      const response = await deleteHealthInfo();

      if (response.success) {
        setHealthInfo(null);
        setHealthFormData({
          blood_group: "",
          allergies: "",
          drug_reactions: "",
          complexities: "",
          details: {
            height: "",
            weight: "",
            emergency_contact: "",
            chronic_conditions: ""
          }
        });

        setMessage({
          text: "Health information deleted successfully",
          type: "success"
        });
      }
    } catch (error) {
      setHealthError(error.message || "Failed to delete health information");
    } finally {
      setHealthLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center py-10">
      <div className="w-full max-w-3xl rounded-lg border p-8 shadow-md">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">User Profile</h1>
          <button
            className="btn btn-primary"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {message.text && (
          <div className={`alert mt-4 ${message.type === "error" ? "alert-error" : "alert-success"}`}>
            <span>{message.text}</span>
          </div>
        )}

        {/* Basic Profile Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Basic Information</h2>

          {/* Always show user info */}
          {user && !isEditing && (
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-base-content/70">Name</span>
                  <span className="text-lg">{user.name}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-base-content/70">Email</span>
                  <span className="text-lg">{user.email}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-base-content/70">Phone</span>
                  <span className="text-lg">{user.phone || "Not provided"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-base-content/70">Two-Factor Authentication</span>
                  <span className="text-lg">{user.mfa_enabled ? "Enabled" : "Disabled"}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-base-content/70">Account Created</span>
                  <span className="text-lg">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-base-content/70">User ID</span>
                  <span className="text-lg truncate">{user.user_id}</span>
                </div>
              </div>
            </div>
          )}

          {/* Only show editing form when isEditing is true */}
          {isEditing && (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Full Name</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Your full name"
                />
                {errors.name && <p className="mt-1 text-sm text-error">{errors.name}</p>}
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Your email address"
                />
                {errors.email && <p className="mt-1 text-sm text-error">{errors.email}</p>}
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Phone (optional)</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Your phone number"
                />
                {errors.phone && <p className="mt-1 text-sm text-error">{errors.phone}</p>}
              </div>

              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Enable Two-Factor Authentication</span>
                  <input
                    type="checkbox"
                    name="mfa_enabled"
                    checked={formData.mfa_enabled}
                    onChange={handleChange}
                    className="checkbox checkbox-primary"
                  />
                </label>
              </div>

              <div className="mt-6 flex space-x-4">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? <span className="loading loading-spinner"></span> : "Save Changes"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setIsEditing(false);
                    setErrors({});
                    setFormData({
                      name: user?.name || "",
                      email: user?.email || "",
                      phone: user?.phone || "",
                      mfa_enabled: user?.mfa_enabled || false,
                    });
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Health Information Section */}
        <div className="mt-10 pt-6 border-t">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Heart className="text-primary" size={20} />
              Health Information
            </h2>

            {healthInfo && !healthEditing ? (
              <div className="flex gap-2">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setHealthEditing(true)}
                >
                  <Edit3 size={16} />
                  Edit
                </button>
                <button
                  className="btn btn-error btn-sm"
                  onClick={handleDeleteHealthInfo}
                  disabled={healthLoading}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            ) : !healthEditing && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setHealthEditing(true)}
              >
                <PlusCircle size={16} />
                Add Health Information
              </button>
            )}

            {healthEditing && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setHealthEditing(false)}
              >
                Cancel
              </button>
            )}
          </div>

          {healthError && (
            <div className="alert alert-error mb-4">
              <AlertCircle size={16} />
              <span>{healthError}</span>
            </div>
          )}

          {/* Display Health Information */}
          {healthInfo && !healthEditing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-primary">Personal Health</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-base-content/70">Blood Group</span>
                      <span className="text-lg">{healthInfo.blood_group || "Not specified"}</span>
                    </div>

                    {healthInfo.details?.height && (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-base-content/70">Height</span>
                        <span className="text-lg">{healthInfo.details.height}</span>
                      </div>
                    )}

                    {healthInfo.details?.weight && (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-base-content/70">Weight</span>
                        <span className="text-lg">{healthInfo.details.weight}</span>
                      </div>
                    )}
                  </div>
                </div>

                {healthInfo.details?.emergency_contact && (
                  <div>
                    <h3 className="font-semibold text-primary">Emergency Contact</h3>
                    <div className="mt-2">
                      <span className="text-lg">{healthInfo.details.emergency_contact}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-primary">Medical Information</h3>
                  <div className="mt-2 space-y-2">
                    {healthInfo.allergies && (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-base-content/70">Allergies</span>
                        <span className="text-lg">{healthInfo.allergies}</span>
                      </div>
                    )}

                    {healthInfo.drug_reactions && (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-base-content/70">Drug Reactions</span>
                        <span className="text-lg">{healthInfo.drug_reactions}</span>
                      </div>
                    )}

                    {healthInfo.complexities && (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-base-content/70">Medical Complexities</span>
                        <span className="text-lg">{healthInfo.complexities}</span>
                      </div>
                    )}

                    {healthInfo.details?.chronic_conditions && (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-base-content/70">Chronic Conditions</span>
                        <span className="text-lg">{healthInfo.details.chronic_conditions}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Health Information Form */}
          {healthEditing && (
            <form onSubmit={handleHealthSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Blood Group</span>
                  </label>
                  <select
                    name="blood_group"
                    className="select select-bordered w-full"
                    value={healthFormData.blood_group}
                    onChange={handleHealthChange}
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Emergency Contact</span>
                  </label>
                  <input
                    type="text"
                    name="details.emergency_contact"
                    className="input input-bordered w-full"
                    placeholder="Name and phone number"
                    value={healthFormData.details.emergency_contact || ""}
                    onChange={handleHealthChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Height</span>
                  </label>
                  <input
                    type="text"
                    name="details.height"
                    className="input input-bordered w-full"
                    placeholder="e.g., 5'10&quot; or 178 cm"
                    value={healthFormData.details.height || ""}
                    onChange={handleHealthChange}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Weight</span>
                  </label>
                  <input
                    type="text"
                    name="details.weight"
                    className="input input-bordered w-full"
                    placeholder="e.g., 70 kg or 154 lbs"
                    value={healthFormData.details.weight || ""}
                    onChange={handleHealthChange}
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Allergies</span>
                </label>
                <textarea
                  name="allergies"
                  className="textarea textarea-bordered w-full"
                  placeholder="List any allergies you have"
                  value={healthFormData.allergies || ""}
                  onChange={handleHealthChange}
                  rows={2}
                ></textarea>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Drug Reactions</span>
                </label>
                <textarea
                  name="drug_reactions"
                  className="textarea textarea-bordered w-full"
                  placeholder="List any adverse reactions to medications"
                  value={healthFormData.drug_reactions || ""}
                  onChange={handleHealthChange}
                  rows={2}
                ></textarea>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Medical Complexities</span>
                </label>
                <textarea
                  name="complexities"
                  className="textarea textarea-bordered w-full"
                  placeholder="Any medical complexities doctors should know about"
                  value={healthFormData.complexities || ""}
                  onChange={handleHealthChange}
                  rows={2}
                ></textarea>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Chronic Conditions</span>
                </label>
                <textarea
                  name="details.chronic_conditions"
                  className="textarea textarea-bordered w-full"
                  placeholder="List any chronic conditions you have"
                  value={healthFormData.details.chronic_conditions || ""}
                  onChange={handleHealthChange}
                  rows={2}
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setHealthEditing(false)}
                  disabled={healthLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={healthLoading}
                >
                  {healthLoading ? <span className="loading loading-spinner"></span> : "Save Health Information"}
                </button>
              </div>
            </form>
          )}

          {/* No health information message */}
          {!healthInfo && !healthEditing && (
            <div className="bg-base-200 p-6 rounded-lg text-center">
              <Activity size={48} className="mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-semibold mb-2">No Health Information Added</h3>
              <p className="text-gray-500 mb-4">Adding your health information helps doctors provide better care during appointments.</p>
              <button
                className="btn btn-primary"
                onClick={() => setHealthEditing(true)}
              >
                Add Health Information
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
