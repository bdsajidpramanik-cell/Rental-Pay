'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { firebaseUser, currentUser, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.push('/login');
    }
  }, [firebaseUser, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-lg font-semibold text-gray-600">Loading Rental Pay Dashboard...</div>
      </div>
    );
  }

  if (!firebaseUser) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">Rental Pay</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">
                {firebaseUser.email}
              </span>
              <button
                onClick={logout}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl p-6">
        <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800">
            Welcome to Property Management System
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Role: <span className="font-semibold text-blue-600">{currentUser?.role || 'VIEWER'}</span>
          </p>
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700">Properties & Shops</h3>
            <p className="mt-2 text-sm text-gray-500">Manage shop allocations, occupancy, and status.</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700">Agreements</h3>
            <p className="mt-2 text-sm text-gray-500">Track active tenant leases and revision versions.</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700">Payments & Bills</h3>
            <p className="mt-2 text-sm text-gray-500">Verify tenant payment proofs and issue receipts.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
