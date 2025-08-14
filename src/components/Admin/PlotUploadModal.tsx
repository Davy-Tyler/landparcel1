import React, { useState, useEffect } from 'react';
import { X, Upload, MapPin } from 'lucide-react';
import { apiService } from '../../services/api';
import { Region, District, Council } from '../../types';
import { useNotifications } from '../Notifications/NotificationService';

interface PlotUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PlotFormData {
  title: string;
  description: string;
  area_sqm: number;
  price: number;
  usage_type: string;
  plot_number: string;
  council_id: number;
  image_urls: string[];
}

export const PlotUploadModal: React.FC<PlotUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addNotification } = useNotifications();
  const [formData, setFormData] = useState<PlotFormData>({
    title: '',
    description: '',
    area_sqm: 0,
    price: 0,
    usage_type: 'Residential',
    plot_number: '',
    council_id: 0,
    image_urls: [],
  });

  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [councils, setCouncils] = useState<Council[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<number>(0);
  const [selectedDistrict, setSelectedDistrict] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchRegions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedRegion) {
      fetchDistricts(selectedRegion);
    } else {
      setDistricts([]);
      setCouncils([]);
    }
  }, [selectedRegion]);

  useEffect(() => {
    if (selectedDistrict) {
      fetchCouncils(selectedDistrict);
    } else {
      setCouncils([]);
    }
  }, [selectedDistrict]);

  const fetchRegions = async () => {
    try {
      const data = await apiService.getRegions();
      setRegions(data);
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const fetchDistricts = async (regionId: number) => {
    try {
      const data = await apiService.getDistricts(regionId);
      setDistricts(data);
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const fetchCouncils = async (districtId: number) => {
    try {
      const data = await apiService.getCouncils(districtId);
      setCouncils(data);
    } catch (error) {
      console.error('Error fetching councils:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'area_sqm' || name === 'price' || name === 'council_id' 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const addImageUrl = () => {
    if (imageUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        image_urls: [...prev.image_urls, imageUrl.trim()]
      }));
      setImageUrl('');
    }
  };

  const removeImageUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiService.createPlot(formData);

      addNotification({
        type: 'success',
        title: 'Plot Created Successfully',
        message: `${formData.title} has been added to the platform.`
      });
      
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating plot:', error);
      addNotification({
        type: 'error',
        title: 'Failed to Create Plot',
        message: 'Please check your input and try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      area_sqm: 0,
      price: 0,
      usage_type: 'Residential',
      plot_number: '',
      council_id: 0,
      image_urls: [],
    });
    setSelectedRegion(0);
    setSelectedDistrict(0);
    setImageUrl('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Add New Plot</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plot Number
              </label>
              <input
                type="text"
                name="plot_number"
                value={formData.plot_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Area and Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area (sqm) *
              </label>
              <input
                type="number"
                name="area_sqm"
                value={formData.area_sqm}
                onChange={handleInputChange}
                required
                min="1"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (TSH) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="1"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Usage Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usage Type
            </label>
            <select
              name="usage_type"
              value={formData.usage_type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Industrial">Industrial</option>
              <option value="Agricultural">Agricultural</option>
            </select>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region *
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(parseInt(e.target.value))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Region</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District *
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(parseInt(e.target.value))}
                required
                disabled={!selectedRegion}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Select District</option>
                {districts.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Council *
              </label>
              <select
                name="council_id"
                value={formData.council_id}
                onChange={handleInputChange}
                required
                disabled={!selectedDistrict}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Select Council</option>
                {councils.map((council) => (
                  <option key={council.id} value={council.id}>
                    {council.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Image URLs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image URLs
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Enter image URL"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addImageUrl}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
            </div>
            
            {formData.image_urls.length > 0 && (
              <div className="space-y-2">
                {formData.image_urls.map((url, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                    <span className="flex-1 text-sm text-gray-600 truncate">{url}</span>
                    <button
                      type="button"
                      onClick={() => removeImageUrl(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Create Plot
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};