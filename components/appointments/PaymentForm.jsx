"use client";

import React, { useState } from 'react';
import { CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { createAppointmentPayment } from '@/services/paymentService';

const PaymentForm = ({ appointmentId, amount, onSuccess, paymentType = 'full' }) => {
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
      
      const response = await createAppointmentPayment(
        appointmentId, 
        amount,
        transactionId,
        paymentType // Pass the payment type to the API
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

  const getPaymentDescription = () => {
    if (paymentType === 'consultation') {
      return 'consultation fee';
    } else {
      return 'payment';
    }
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center mb-4">
          <CheckCircle size={32} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Payment Recorded Successfully!</h2>
        <p className="text-gray-600 text-center mb-6">
          Your {getPaymentDescription()} of ${amount.toFixed(2)} has been recorded successfully and is being processed.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {error && (
        <div className="alert alert-error mb-4">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">Transaction ID</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Enter your transaction ID"
              className="input input-bordered w-full pl-11"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              required
            />
            <CreditCard className="absolute left-4 top-3 text-gray-400" size={18} />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enter the transaction ID from your payment method (e.g., bank transfer reference number)
          </p>
        </div>
        
        <div className="mt-6">
          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              `Submit Payment for $${amount.toFixed(2)}`
            )}
          </button>
        </div>
      </form>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>Please ensure you have completed the payment through your bank or mobile banking app before submitting.</p>
      </div>
    </div>
  );
};

export default PaymentForm;
