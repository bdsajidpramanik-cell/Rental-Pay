'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/axios';
import { Shop, ShopStatus } from '../../../types';

export default function PropertiesPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertyId, setPropertyId] = useState('prop-1'); // Default/Selected Property ID
  const [shopNumber, setShopNumber] = useState('');
  const [floor, setFloor] = useState(1);
  const [sizeSqFt, setSizeSqFt] = useState('');
  const [baseRent, setBaseRent] = useState('');
  const [error, setError] = useState('');

  const fetchShops = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/properties/${propertyId}/shops`);
      setShops(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, [propertyId]);

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post(`/properties/${propertyId}/shops`, {
        shopNumber,
        floor: Number(floor),
        sizeSqFt: Number(sizeSqFt),
        baseRent: Number(baseRent),
      });
      setShopNumber('');
      setSizeSqFt('');
      setBaseRent('');
      fetchShops();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create shop');
    }
  };

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Shop Management</h1>

      {/* Create Shop Form */}
      <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-700">Add New Shop</h2>
        <form onSubmit={handleCreateShop} className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Shop Number</label>
            <input
              type="text"
              required
              value={shopNumber}
              onChange={(e) => setShopNumber(e.target.value)}
              className="mt-1 w-full rounded border p-2 text-sm"
              placeholder="e.g. A-101"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Floor</label>
            <input
              type="number"
              required
              value={floor}
              onChange={(e) => setFloor(Number(e.target.value))}
              className="mt-1 w-full rounded border p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Size (Sq Ft)</label>
            <input
              type="number"
              required
              value={sizeSqFt}
              onChange={(e) => setSizeSqFt(e.target.value)}
              className="mt-1 w-full rounded border p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Base Rent (BDT)</label>
            <input
              type="number"
              required
              value={baseRent}
              onChange={(e) => setBaseRent(e.target.value)}
              className="mt-1 w-full rounded border p-2 text-sm"
            />
          </div>
          <div className="md:col-span-4">
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
            >
              Add Shop
            </button>
          </div>
        </form>
      </div>

      {/* Shop List */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-700">Shops List</h2>
        {loading ? (
          <p className="text-gray-500">Loading shops...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : shops.length === 0 ? (
          <p className="text-gray-500">No shops found for this property.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Shop No</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Floor</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Size</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Base Rent</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {shops.map((shop) => (
                  <tr key={shop.id}>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{shop.shopNumber}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{shop.floor}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{shop.sizeSqFt} sqft</td>
                    <td className="px-4 py-2 text-sm text-gray-500">৳{shop.baseRent}</td>
                    <td className="px-4 py-2 text-sm">
                      <span
                        className={`rounded px-2 py-1 text-xs font-semibold ${
                          shop.status === ShopStatus.OCCUPIED
                            ? 'bg-green-100 text-green-800'
                            : shop.status === ShopStatus.AVAILABLE
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {shop.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
