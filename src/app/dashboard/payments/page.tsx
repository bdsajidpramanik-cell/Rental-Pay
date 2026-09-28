'use client';

import React, { useState } from 'react';
import { apiClient } from '../../../lib/axios';

export default function PaymentsPage() {
  const [propertyId, setPropertyId] = useState('prop-1');
  const [shopId, setShopId] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [amount, setAmount] = useState('');
  const [txId, setTxId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BKASH');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Tenant: Submit Payment Proof
  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await apiClient.post(
        `/properties/${propertyId}/shops/${shopId}/payments/proof`,
        {
          amount: Number(amount),
          transactionId: txId,
          paymentMethod,
        }
      );
      setMessage('Payment proof submitted successfully for verification!');
      setAmount('');
      setTxId('');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to submit payment proof');
    } finally {
      setLoading(false);
    }
  };

  // Admin/Owner: Verify Payment
  const handleVerifyPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await apiClient.patch(
        `/properties/${propertyId}/shops/${shopId}/payments/${paymentId}/verify`,
        {
          status: 'VERIFIED',
        }
      );
      setMessage('Payment successfully verified!');
      setPaymentId('');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to verify payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Payment Management</h1>

      {message && (
        <div className="mb-6 rounded bg-blue-50 p-4 text-sm font-medium text-blue-700">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Submit Payment Proof Section */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">Submit Payment Proof (Tenant)</h2>
          <form onSubmit={handleSubmitProof} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Shop ID</label>
              <input
                type="text"
                required
                value={shopId}
                onChange={(e) => setShopId(e.target.value)}
                placeholder="Enter Shop ID"
                className="mt-1 w-full rounded border p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount (BDT)</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 15000"
                className="mt-1 w-full rounded border p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Transaction ID / Ref</label>
              <input
                type="text"
                required
                value={txId}
                onChange={(e) => setTxId(e.target.value)}
                placeholder="e.g. TRX12345678"
                className="mt-1 w-full rounded border p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mt-1 w-full rounded border p-2 text-sm"
              >
                <option value="BKASH">bKash</option>
                <option value="NAGAD">Nagad</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Proof'}
            </button>
          </form>
        </div>

        {/* Verify Payment Section */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">Verify Payment (Owner/Admin)</h2>
          <form onSubmit={handleVerifyPayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Shop ID</label>
              <input
                type="text"
                required
                value={shopId}
                onChange={(e) => setShopId(e.target.value)}
                placeholder="Enter Shop ID"
                className="mt-1 w-full rounded border p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Payment ID</label>
              <input
                type="text"
                required
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
                placeholder="Enter Payment ID to verify"
                className="mt-1 w-full rounded border p-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-green-600 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Approve & Verify Payment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
