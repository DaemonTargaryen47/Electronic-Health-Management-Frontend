"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { getHospitalById } from "@/services/hospitalService";
import HospitalManagement from "@/components/hospitals/HospitalManagement";

const HospitalDetailsPage = ({ params }) => {
  const router = useRouter();
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshData = async () => {
    try {
      setLoading(true);
      const data = await getHospitalById(params.id);
      setHospital(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching hospital data:", err);
      setError("Failed to load hospital data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!params.id) {
      router.push("/admin/hospitals");
      return;
    }
    refreshData();
  }, [params.id, router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Hospital Details</h1>

      {loading ? (
        <div className="flex justify-center items-center min-h-[60vh]">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : error ? (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      ) : hospital ? (
        <HospitalManagement hospital={hospital} refreshData={refreshData} />
      ) : (
        <div className="alert alert-warning">
          <AlertCircle size={20} />
          <span>Hospital not found</span>
        </div>
      )}
    </div>
  );
};

export default HospitalDetailsPage;