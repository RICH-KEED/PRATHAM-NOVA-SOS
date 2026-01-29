'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, MapPin, Phone, MessageSquare } from 'lucide-react';

export default function Home() {
  const [formData, setFormData] = useState({
    name: '',
    subject: 'Accident',
    description: '',
    lat: '',
    lng: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get user's geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6),
          }));
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!formData.name.trim()) {
        setError('Please enter your name');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        name: formData.name,
        subject: formData.subject,
        description: formData.description,
        lat: formData.lat || 'N/A',
        lng: formData.lng || 'N/A',
      });

      const response = await fetch(`/api/report?${params.toString()}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || 'Failed to report emergency');
      } else {
        setSuccess('🚨 Emergency reported successfully! Help is on the way.');
        setFormData({
          name: '',
          subject: 'Accident',
          description: '',
          lat: formData.lat,
          lng: formData.lng,
        });
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <AlertCircle className="w-10 h-10 text-red-500" />
            <h1 className="text-4xl font-bold text-white">NOVA-SOS</h1>
          </div>
          <p className="text-xl text-gray-300">Emergency Response System</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Form Card */}
          <Card className="bg-white/95 backdrop-blur p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Report Emergency</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Incident Type
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                >
                  <option>Accident</option>
                  <option>Fire</option>
                  <option>Theft</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Provide additional details about the emergency"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Latitude
                  </label>
                  <input
                    type="text"
                    name="lat"
                    value={formData.lat}
                    onChange={handleInputChange}
                    placeholder="Auto-detected"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 outline-none"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude
                  </label>
                  <input
                    type="text"
                    name="lng"
                    value={formData.lng}
                    onChange={handleInputChange}
                    placeholder="Auto-detected"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 outline-none"
                    readOnly
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
                  {success}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition"
              >
                {loading ? 'Reporting...' : '🚨 Report Emergency'}
              </Button>
            </form>
          </Card>

          {/* Info Card */}
          <Card className="bg-white/95 backdrop-blur p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">How It Works</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-900">Report Incident</h3>
                  <p className="text-gray-600 text-sm">Fill out the form with incident details</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Phone className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-900">Instant Call Alert</h3>
                  <p className="text-gray-600 text-sm">
                    Emergency responders are contacted via phone
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <MessageSquare className="w-6 h-6 text-purple-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-900">Live Location Tracking</h3>
                  <p className="text-gray-600 text-sm">Your coordinates are sent automatically</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-900">
                  <strong>⚠️ Emergency Use Only:</strong> Only report genuine emergencies. False reports
                  may result in penalties.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
