"use client";

import React, { useState } from 'react';
import { CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { createServicePayment } from '@/services/paymentService';

const ServicePaymentForm = ({ appointmentServiceId, serviceName, amount, onSuccess }) => {
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear any previous errors
    setError(null);
    
    if (!transactionId.trim()) {
      setError('Please enter a valid transaction ID');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await createServicePayment(
        appointmentServiceId, 
        amount,
        transactionId
      );
      
      if (response.success) {
        setShowSuccess(true);
        
        // Notify parent component of success
        if (onSuccess && typeof onSuccess === 'function') {
          setTimeout(() => {
            onSuccess(response);
          }, 2000);
        }
      } else {
        setError('Payment processing failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while processing your payment');
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-4">
        <div className="w-12 h-12 rounded-full bg-success flex items-center justify-center mb-2">
          <CheckCircle size={24} className="text-white" />
        </div>
        <h3 className="text-xl font-bold mb-1">Payment Recorded!</h3>
        <p className="text-gray-600 text-center mb-2">
          Your payment for {serviceName} has been recorded successfully.
        </p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="alert alert-error mb-4 text-sm">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">Transaction ID for {serviceName}</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Enter transaction ID"
              className="input input-bordered w-full pl-10"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              required
            />
            <CreditCard className="absolute left-3 top-3 text-gray-400" size={16} />
          </div>
        </div>
        
        <div>
          <button 
            type="submit" 
            className="btn btn-primary w-full btn-sm"
            disabled={loading}
          >
            {loading ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              `Pay $${amount.toFixed(2)}`
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServicePaymentForm;
