'use client';

import React, { useState } from 'react';
import { apiClient } from '../../../lib/axios';

export default function QrOnboardingPage() {
  const [propertyId, setPropertyId] = useState('prop-1');
  const [shopId, setShopId] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');
  const [claimToken, setClaimToken] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Admin/Owner: Generate Onboarding QR Token
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await apiClient.post(
        `/properties/${propertyId}/shops/${shopId}/qr-onboarding/generate`
      );
      setGeneratedToken(res.data.token || res.data.id || JSON.stringify(res.data));
      setMessage('QR Token generated successfully!');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to generate QR token');
    } finally {
      setLoading(false);
    }
  };

  // Tenant: Claim Shop using Token
  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await apiClient.post(
        `/properties/${propertyId}/shops/${shopId}/qr-onboarding/claim`,
        {
          token: claimToken,
          tenantName,
        }
      );
      setMessage('Shop claimed successfully!');
      setClaimToken('');
      setTenantName('');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to claim shop');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">QR Onboarding Management</h1>

      {message && (
        <div className="mb-6 rounded bg-blue-50 p-4 text-sm font-medium text-blue-700">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Generate Token Section */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">Generate Onboarding Token</h2>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Shop ID</label>
              <input
                type="text"
                required
                value={shopId}
                onChange={(e) => setShopId(e.target.value)}
                placeholder="Enter Shop ID (e.g. shop-123)"
                className="mt-1 w-full rounded border p-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Token'}
            </button>
          </form>

          {generatedToken && (
            <div className="mt-6 rounded border border-dashed border-gray-300 p-4 text-center">
              <p className="text-xs text-gray-500">Generated Token / QR Data:</p>
              <p className="mt-2 break-all font-mono text-sm font-bold text-gray-800">
                {generatedToken}
              </p>
            </div>
          )}
        </div>

        {/* Claim Token Section */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">Claim Shop (Tenant)</h2>
          <form onSubmit={handleClaim} className="space-y-4">
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
              <label className="block text-sm font-medium text-gray-700">Onboarding Token</label>
              <input
                type="text"
                required
                value={claimToken}
                onChange={(e) => setClaimToken(e.target.value)}
                placeholder="Paste token here"
                className="mt-1 w-full rounded border p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tenant Name / Details</label>
              <input
                type="text"
                required
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="Enter Tenant Name"
                className="mt-1 w-full rounded border p-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-green-600 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Claiming...' : 'Claim Shop'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
