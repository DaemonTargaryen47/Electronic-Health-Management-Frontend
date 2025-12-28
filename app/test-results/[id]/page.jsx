"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated } from '@/services/authService';
import { getTestResult } from '@/services/hospitalStaffService';
import TestResultView from '@/components/staff/TestResultView';
import { ArrowLeft, AlertCircle } from 'lucide-react';

const TestResultPage = ({ params }) => {
  const router = useRouter();
  const pathname = usePathname();
  const resultId = params.id;
  
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }
      
      await fetchTestResult();
    };
    
    checkAuth();
  }, [resultId, router]);
  
  const fetchTestResult = async () => {
    try {
      setLoading(true);
      const response = await getTestResult(resultId);
      
      if (response.success) {
        setTestResult(response.test_result);
      } else {
        setError('Failed to load test result');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while loading test result');
      console.error('Error loading test result:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Replace the getBackLink function and the back button implementation
  const handleGoBack = () => {
    router.back();
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 flex justify-between items-center">
        <button 
          onClick={handleGoBack}
          className="btn btn-ghost flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        
        {/* Remove or comment out the old Link component if it exists */}
        {/* <Link href={getBackLink()} className="btn btn-ghost flex items-center gap-2">
          <ArrowLeft size={18} />
          Back
        </Link> */}
      </div>
      
      <h1 className="text-2xl font-bold mb-6">Test Result Details</h1>
      
      <TestResultView 
        testResult={testResult}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default TestResultPage;
