'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth-guard';
import { useGetSuppliersQuery, useCreateSupplierMutation } from '@/store/purchaseApi';

import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';

export default function SuppliersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useGetSuppliersQuery({ search: searchTerm });
  const [createSupplier, { isLoading: isCreating }] = useCreateSupplierMutation();

  // Form state
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [openingPayable, setOpeningPayable] = useState(0);
  const [formError, setFormError] = useState('');

  const suppliers = data?.data?.suppliers || [];

  const formatBdt = (paisas: number) => {
    return (paisas / 100).toLocaleString('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!/^01[3-9]\d{8}$/.test(phone.trim())) {
      setFormError('Please enter a valid 11-digit Bangladeshi mobile number.');
      return;
    }

    try {
      await createSupplier({
        name: name.trim(),
        contactPerson: contactPerson.trim() || undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        openingPayable: openingPayable * 100, // convert BDT to paisa
      }).unwrap();

      setIsModalOpen(false);
      setName('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setAddress('');
      setOpeningPayable(0);
    } catch (err: any) {
      setFormError(err?.data?.message || 'Failed to create supplier.');
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Suppliers & Vendors</h1>
              <p className="text-sm text-slate-600">
                Manage vendor profiles, contact details, and outstanding payable balances.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/purchases"
                className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                Purchase History
              </Link>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
              >
                <Plus className="w-4 h-4" />
                Add Supplier
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 max-w-md">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by company or contact name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
          </div>

          {/* Suppliers Table */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-slate-500">Loading suppliers...</div>
            ) : suppliers.length === 0 ? (
              <div className="p-12 text-center">
                <Truck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-800">No Suppliers Listed</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                  Add wholesale vendors and distributors to record purchase bills and track payables.
                </p>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                >
                  Add First Supplier
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Supplier Name</th>
                      <th className="py-3 px-4">Contact Person</th>
                      <th className="py-3 px-4">Phone / Mobile</th>
                      <th className="py-3 px-4">Address</th>
                      <th className="py-3 px-4 text-right">Payable Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {suppliers.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {s.name}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          {s.contactPerson || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono text-slate-700">
                          {s.phone}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">
                          {s.address || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                          {s.payableBalance > 0 ? (
                            <span className="text-amber-700">৳{formatBdt(s.payableBalance)}</span>
                          ) : (
                            <span className="text-slate-400">৳0.00</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add Supplier Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900">Add New Supplier</h3>

                <form onSubmit={handleCreateSupplier} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Company / Supplier Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Acme Consumer Goods Ltd"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="e.g. Tanvir Ahmed"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mobile Phone *
                      </label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Opening Payable (৳)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={openingPayable}
                        onChange={(e) => setOpeningPayable(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="sales@vendor.com"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Warehouse / Office Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Tejgaon Industrial Area, Dhaka"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  {formError && (
                    <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-200">
                      {formError}
                    </p>
                  )}

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                    >
                      {isCreating ? 'Saving...' : 'Save Supplier'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
      </div>
    </AuthGuard>
  );
}

