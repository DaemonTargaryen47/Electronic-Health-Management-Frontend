"use client";

import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, X, Edit, Trash2, Search, AlertCircle, 
  CheckCircle, DollarSign, FileText, Upload 
} from 'lucide-react';
import {
  getHospitalServices,
  addHospitalService,
  updateHospitalService,
  deleteHospitalService,
  addBulkHospitalServices
} from '@/services/hospitalServices';

// Common medical tests and services
const SERVICE_SUGGESTIONS = [
  { service_name: 'X-Ray', description: 'Radiographic imaging', price: 150 },
  { service_name: 'Ultrasound', description: 'Diagnostic sonography', price: 250 },
  { service_name: 'MRI Scan', description: 'Magnetic Resonance Imaging', price: 1200 },
  { service_name: 'CT Scan', description: 'Computed Tomography scan', price: 800 },
  { service_name: 'Blood Test - Complete Blood Count', description: 'CBC test', price: 120 },
  { service_name: 'Electrocardiogram (ECG)', description: 'Heart activity test', price: 150 },
  { service_name: 'Endoscopy', description: 'Internal organ examination', price: 600 },
  { service_name: 'Colonoscopy', description: 'Large intestine examination', price: 700 },
  { service_name: 'Mammogram', description: 'Breast cancer screening', price: 300 },
  { service_name: 'Biopsy', description: 'Tissue sample examination', price: 500 },
  { service_name: 'Physical Therapy Session', description: '1-hour therapy session', price: 120 }
];

const HospitalServices = ({ hospitalId, refreshData }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredServices, setFilteredServices] = useState([]);
  
  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showBulkAddForm, setShowBulkAddForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  // New service form data
  const [newService, setNewService] = useState({
    service_name: '',
    description: '',
    price: ''
  });
  
  // Edit service form data
  const [editService, setEditService] = useState({
    service_id: null,
    service_name: '',
    description: '',
    price: ''
  });
  
  // Bulk add services
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);
  const [customServices, setCustomServices] = useState([{
    service_name: '',
    description: '',
    price: ''
  }]);
  const [bulkError, setBulkError] = useState(null);
  
  // Success message
  const [successMessage, setSuccessMessage] = useState('');
  
  useEffect(() => {
    fetchServices();
  }, [hospitalId]);
  
  useEffect(() => {
    if (searchQuery) {
      const filtered = services.filter(service => 
        service.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredServices(filtered);
    } else {
      setFilteredServices(services);
    }
  }, [searchQuery, services]);
  
  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getHospitalServices(hospitalId);
      
      if (response.success) {
        setServices(response.services || []);
        setFilteredServices(response.services || []);
      } else {
        setError('Failed to fetch hospital services');
      }
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('An error occurred while fetching services');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddService = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!newService.service_name) {
      setError('Service name is required');
      return;
    }
    
    if (!newService.price || isNaN(parseFloat(newService.price)) || parseFloat(newService.price) < 0) {
      setError('Please enter a valid price');
      return;
    }
    
    try {
      setFormLoading(true);
      setError(null);
      
      const serviceData = {
        ...newService,
        price: parseFloat(newService.price)
      };
      
      const response = await addHospitalService(hospitalId, serviceData);
      
      if (response.success) {
        // Reset form and refresh services
        setNewService({ service_name: '', description: '', price: '' });
        setShowAddForm(false);
        showSuccessMessage('Service added successfully');
        await fetchServices();
      } else {
        setError(response.message || 'Failed to add service');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while adding the service');
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleEditService = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!editService.service_name) {
      setError('Service name is required');
      return;
    }
    
    if (!editService.price || isNaN(parseFloat(editService.price)) || parseFloat(editService.price) < 0) {
      setError('Please enter a valid price');
      return;
    }
    
    try {
      setFormLoading(true);
      setError(null);
      
      const serviceData = {
        service_name: editService.service_name,
        description: editService.description,
        price: parseFloat(editService.price)
      };
      
      const response = await updateHospitalService(hospitalId, editService.service_id, serviceData);
      
      if (response.success) {
        // Reset form and refresh services
        setEditService({ service_id: null, service_name: '', description: '', price: '' });
        setShowEditForm(false);
        showSuccessMessage('Service updated successfully');
        await fetchServices();
      } else {
        setError(response.message || 'Failed to update service');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while updating the service');
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleDeleteService = async (serviceId) => {
    try {
      setFormLoading(true);
      setError(null);
      
      const response = await deleteHospitalService(hospitalId, serviceId);
      
      if (response.success) {
        setShowDeleteConfirm(null);
        showSuccessMessage('Service deleted successfully');
        await fetchServices();
      } else {
        setError(response.message || 'Failed to delete service');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while deleting the service');
    } finally {
      setFormLoading(false);
    }
  };
  
  const openEditForm = (service) => {
    setEditService({
      service_id: service.service_id,
      service_name: service.service_name,
      description: service.description || '',
      price: service.price.toString()
    });
    setShowEditForm(true);
  };
  
  const toggleSuggestion = (suggestion) => {
    setSelectedSuggestions(prevSelected => {
      const isAlreadySelected = prevSelected.some(
        s => s.service_name === suggestion.service_name
      );
      
      if (isAlreadySelected) {
        return prevSelected.filter(s => s.service_name !== suggestion.service_name);
      } else {
        return [...prevSelected, { ...suggestion }];
      }
    });
  };
  
  const addCustomServiceRow = () => {
    setCustomServices([
      ...customServices,
      { service_name: '', description: '', price: '' }
    ]);
  };
  
  const removeCustomServiceRow = (index) => {
    setCustomServices(customServices.filter((_, i) => i !== index));
  };
  
  const updateCustomService = (index, field, value) => {
    const updatedServices = [...customServices];
    updatedServices[index][field] = value;
    setCustomServices(updatedServices);
  };
  
  const handleBulkAdd = async (e) => {
    e.preventDefault();
    
    // Filter out invalid custom services
    const validCustomServices = customServices.filter(
      service => service.service_name && !isNaN(parseFloat(service.price)) && parseFloat(service.price) >= 0
    );
    
    // Combine selected suggestions with valid custom services
    const servicesToAdd = [
      ...selectedSuggestions,
      ...validCustomServices.map(service => ({
        ...service,
        price: parseFloat(service.price)
      }))
    ];
    
    if (servicesToAdd.length === 0) {
      setBulkError('Please select at least one service to add');
      return;
    }
    
    try {
      setFormLoading(true);
      setBulkError(null);
      
      const response = await addBulkHospitalServices(hospitalId, servicesToAdd);
      
      if (response.success) {
        // Reset form and refresh services
        setSelectedSuggestions([]);
        setCustomServices([{ service_name: '', description: '', price: '' }]);
        setShowBulkAddForm(false);
        showSuccessMessage(`Successfully added ${response.created_count} services`);
        await fetchServices();
      } else {
        setBulkError(response.message || 'Failed to add services');
      }
    } catch (err) {
      setBulkError(err.message || 'An error occurred while adding services');
    } finally {
      setFormLoading(false);
    }
  };
  
  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };
  
  if (loading && services.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    );
  }
  
  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Hospital Services</h2>
      
      {error && (
        <div className="alert alert-error mb-4">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button 
            className="btn btn-sm btn-ghost" 
            onClick={() => setError(null)}
          >Dismiss</button>
        </div>
      )}
      
      {successMessage && (
        <div className="alert alert-success mb-4">
          <CheckCircle size={18} />
          <span>{successMessage}</span>
        </div>
      )}
      
      {/* Actions bar */}
      <div className="flex flex-wrap gap-3 mb-4 justify-between">
        <div className="flex gap-2">
          <button 
            className="btn btn-primary" 
            onClick={() => setShowAddForm(true)}
          >
            <PlusCircle size={18} />
            Add Service
          </button>
          
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowBulkAddForm(true)}
          >
            <Upload size={18} />
            Bulk Add Services
          </button>
        </div>
        
        <div className="form-control">
          <div className="input-group">
            <input
              type="text"
              placeholder="Search services..."
              className="input input-bordered"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="btn btn-square btn-primary">
              <Search size={18} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Services list */}
      {filteredServices.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((service) => (
                <tr key={service.service_id}>
                  <td>{service.service_name}</td>
                  <td className="max-w-xs truncate">{service.description || '-'}</td>
                  <td>${parseFloat(service.price).toFixed(2)}</td>
                  <td className="flex gap-2">
                    <button 
                      className="btn btn-sm btn-info"
                      onClick={() => openEditForm(service)}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="btn btn-sm btn-error"
                      onClick={() => setShowDeleteConfirm(service.service_id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : searchQuery ? (
        <div className="text-center py-10">
          <FileText size={48} className="mx-auto mb-2 text-gray-400" />
          <p className="text-lg font-medium">No services match your search</p>
          <p className="text-gray-500">Try a different search term</p>
        </div>
      ) : (
        <div className="text-center py-10">
          <FileText size={48} className="mx-auto mb-2 text-gray-400" />
          <p className="text-lg font-medium">No services available</p>
          <p className="text-gray-500">Add services to display them here</p>
        </div>
      )}
      
      {/* Add service modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="modal-box">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add New Service</h3>
              <button className="btn btn-sm btn-circle" onClick={() => setShowAddForm(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddService}>
              <div className="form-control mb-4">
                <label className="label font-medium">Service Name*</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="e.g., X-Ray, Blood Test"
                  value={newService.service_name}
                  onChange={(e) => setNewService({...newService, service_name: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-control mb-4">
                <label className="label font-medium">Description</label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  placeholder="Service description"
                  value={newService.description}
                  onChange={(e) => setNewService({...newService, description: e.target.value})}
                ></textarea>
              </div>
              
              <div className="form-control mb-6">
                <label className="label font-medium">Price ($)*</label>
                <div className="input-group">
                  <span className="bg-base-300 flex items-center px-3"><DollarSign size={18} /></span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input input-bordered w-full"
                    placeholder="0.00"
                    value={newService.price}
                    onChange={(e) => setNewService({...newService, price: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="modal-action">
                <button 
                  type="button" 
                  className="btn" 
                  onClick={() => setShowAddForm(false)}
                >Cancel</button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <span>Add Service</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit service modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="modal-box">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Edit Service</h3>
              <button className="btn btn-sm btn-circle" onClick={() => setShowEditForm(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditService}>
              <div className="form-control mb-4">
                <label className="label font-medium">Service Name*</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="e.g., X-Ray, Blood Test"
                  value={editService.service_name}
                  onChange={(e) => setEditService({...editService, service_name: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-control mb-4">
                <label className="label font-medium">Description</label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  placeholder="Service description"
                  value={editService.description}
                  onChange={(e) => setEditService({...editService, description: e.target.value})}
                ></textarea>
              </div>
              
              <div className="form-control mb-6">
                <label className="label font-medium">Price ($)*</label>
                <div className="input-group">
                  <span className="bg-base-300 flex items-center px-3"><DollarSign size={18} /></span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input input-bordered w-full"
                    placeholder="0.00"
                    value={editService.price}
                    onChange={(e) => setEditService({...editService, price: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="modal-action">
                <button 
                  type="button" 
                  className="btn" 
                  onClick={() => setShowEditForm(false)}
                >Cancel</button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <span>Update Service</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="modal-box">
            <h3 className="text-xl font-bold">Confirm Delete</h3>
            <p className="py-4">
              Are you sure you want to delete this service? This action cannot be undone.
            </p>
            <div className="modal-action">
              <button 
                className="btn" 
                onClick={() => setShowDeleteConfirm(null)}
              >Cancel</button>
              <button 
                className="btn btn-error"
                onClick={() => handleDeleteService(showDeleteConfirm)}
                disabled={formLoading}
              >
                {formLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Bulk add services modal */}
      {showBulkAddForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="modal-box max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Bulk Add Services</h3>
              <button className="btn btn-sm btn-circle" onClick={() => setShowBulkAddForm(false)}>
                <X size={20} />
              </button>
            </div>
            
            {bulkError && (
              <div className="alert alert-error mb-4 text-sm">
                <AlertCircle size={16} />
                <span>{bulkError}</span>
              </div>
            )}
            
            <div className="mb-6">
              <h4 className="font-medium mb-2">Common Medical Services</h4>
              <p className="text-sm text-gray-500 mb-3">
                Select from common medical services or add your own below
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {SERVICE_SUGGESTIONS.map((suggestion, index) => {
                  const isSelected = selectedSuggestions.some(
                    s => s.service_name === suggestion.service_name
                  );
                  
                  return (
                    <div 
                      key={index}
                      className={`border rounded p-2 cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-base-200'
                      }`}
                      onClick={() => toggleSuggestion(suggestion)}
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">{suggestion.service_name}</span>
                        <span className="text-sm">${suggestion.price.toFixed(2)}</span>
                      </div>
                      {suggestion.description && (
                        <p className="text-xs text-gray-500 mt-1">{suggestion.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Add Custom Services</h4>
              
              {customServices.map((service, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <div className="w-1/3">
                    <input
                      type="text"
                      className="input input-bordered w-full input-sm"
                      placeholder="Service name"
                      value={service.service_name}
                      onChange={(e) => updateCustomService(index, 'service_name', e.target.value)}
                    />
                  </div>
                  <div className="w-1/3">
                    <input
                      type="text"
                      className="input input-bordered w-full input-sm"
                      placeholder="Description (optional)"
                      value={service.description}
                      onChange={(e) => updateCustomService(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="w-1/4">
                    <div className="input-group input-group-sm">
                      <span className="bg-base-300">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input input-bordered w-full input-sm"
                        placeholder="Price"
                        value={service.price}
                        onChange={(e) => updateCustomService(index, 'price', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <button
                      type="button"
                      className="btn btn-error btn-sm btn-square"
                      onClick={() => removeCustomServiceRow(index)}
                      disabled={customServices.length === 1}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                className="btn btn-outline btn-sm mt-2 w-full"
                onClick={addCustomServiceRow}
              >
                <PlusCircle size={16} />
                Add Another Custom Service
              </button>
            </div>
            
            <div className="modal-action mt-6">
              <button 
                type="button" 
                className="btn" 
                onClick={() => setShowBulkAddForm(false)}
              >Cancel</button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleBulkAdd}
                disabled={formLoading}
              >
                {formLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <span>Add Selected Services</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalServices;
