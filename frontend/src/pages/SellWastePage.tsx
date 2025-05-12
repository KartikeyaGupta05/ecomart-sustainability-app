import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase/config';
import { WasteRequest } from '../types';
import { Recycle, Upload, Calendar, MapPin, Info, AlertTriangle } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const SellWastePage: React.FC = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    wasteType: '',
    weight: '',
    description: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    pickupDate: '',
  });
  
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const wasteTypes = [
    { value: 'plastic', label: 'Plastic', points: 15, description: 'Most common recyclable material' },
    { value: 'paper', label: 'Paper', points: 10, description: 'Includes cardboard and mixed paper' },
    { value: 'glass', label: 'Glass', points: 12, description: 'All glass containers and bottles' },
    { value: 'metal', label: 'Metal', points: 20, description: 'Aluminum, steel, and other metals' },
    { value: 'electronic', label: 'Electronic', points: 25, description: 'E-waste and electronic components' },
    { value: 'organic', label: 'Organic', points: 8, description: 'Food waste and garden materials' },
    { value: 'other', label: 'Other', points: 5, description: 'Other recyclable materials' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      // Check if adding new files would exceed the limit
      if (imageFiles.length + newFiles.length > 5) {
        setError('You can upload a maximum of 5 images.');
        return;
      }
      
      // Check file sizes and types
      const validFiles = newFiles.filter(file => {
        if (file.size > 5 * 1024 * 1024) {
          setError('Each image must be less than 5MB.');
          return false;
        }
        if (!file.type.startsWith('image/')) {
          setError('Only image files are allowed.');
          return false;
        }
        return true;
      });
      
      if (validFiles.length === 0) return;
      
      // Create previews for new files
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      
      setImageFiles(prev => [...prev, ...validFiles]);
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index]);
      return newPreviews.filter((_, i) => i !== index);
    });
  };

  const validateForm = () => {
    if (!user) {
      setError('You must be logged in to submit a waste pickup request.');
      return false;
    }
    
    if (!formData.wasteType) {
      setError('Please select a waste type.');
      return false;
    }
    
    if (!formData.weight) {
      setError('Please enter the estimated weight.');
      return false;
    }
    
    if (isNaN(parseFloat(formData.weight)) || parseFloat(formData.weight) <= 0) {
      setError('Please enter a valid weight.');
      return false;
    }
    
    if (!formData.description) {
      setError('Please provide a brief description of the waste.');
      return false;
    }
    
    if (!formData.street || !formData.city || !formData.state || !formData.postalCode) {
      setError('Please provide your complete address for pickup.');
      return false;
    }
    
    if (!formData.pickupDate) {
      setError('Please select a preferred pickup date.');
      return false;
    }
    
    // Check if pickup date is in the future
    const pickupDate = new Date(formData.pickupDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (pickupDate < today) {
      setError('Pickup date must be today or in the future.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Upload images first
      const imageUrls = await Promise.all(
        imageFiles.map(async (file) => {
          const storageRef = ref(storage, `waste_images/${user.uid}/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          return getDownloadURL(storageRef);
        })
      );

      // Calculate eco points based on waste type and weight
      const wasteType = wasteTypes.find(type => type.value === formData.wasteType);
      const basePoints = wasteType ? wasteType.points : 5;
      const weight = parseFloat(formData.weight);
      const ecoPoints = Math.round(basePoints * weight);

      // Create waste request
      const wasteRequest: WasteRequest = {
        id: '', // Will be set by Firestore
        userId: user.uid,
        wasteType: formData.wasteType,
        weight: formData.weight,
        description: formData.description,
        imageUrls,
        status: 'pending',
        ecoPointsAwarded: ecoPoints,
        createdAt: new Date(),
        updatedAt: new Date(),
        scheduledPickupDate: null,
        completedDate: null,
        wasteTypePoints: basePoints,
        weightPoints: weight,
        totalPoints: ecoPoints
      };

      // Add to waste requests collection
      const wasteRequestRef = await addDoc(collection(db, 'wasteRequests'), wasteRequest);

      // Update user's stats
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ecoPoints: increment(ecoPoints),
        wasteRecycled: increment(weight),
        totalWasteRecycled: increment(weight),
        wasteRecyclingCount: increment(1),
        lastRecyclingDate: new Date(),
        updatedAt: new Date()
      });

      // Show success message with points earned
      setSuccess(true);
      
      // Reset form
      setFormData({
        wasteType: '',
        weight: '',
        description: '',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'United States',
        pickupDate: '',
      });
      setImageFiles([]);
      setImagePreviews([]);

      // Redirect to profile page after 3 seconds
      setTimeout(() => {
        navigate('/profile');
      }, 3000);

    } catch (err) {
      console.error('Error submitting waste request:', err);
      setError('Failed to submit waste request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If user is not logged in, prompt them to login
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-6">
            <Recycle className="h-12 w-12 text-primary-500 mx-auto" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Login Required</h2>
            <p className="mt-2 text-gray-600">
              You need to be logged in to request waste pickup services.
            </p>
          </div>
          <div className="space-y-4">
            <Button 
              fullWidth 
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
            <Button 
              variant="outline" 
              fullWidth 
              onClick={() => navigate('/register')}
            >
              Create an Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-8 text-white">
            <h1 className="text-3xl font-bold flex items-center">
              <Recycle className="mr-3 h-8 w-8" />
              Recycle Your Waste
            </h1>
            <p className="mt-3 text-lg opacity-90">
              Schedule a pickup for your recyclable waste and earn EcoPoints.
            </p>
          </div>
          
          {success ? (
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-success-100 rounded-full mx-auto flex items-center justify-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-10 w-10 text-success-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">Request Submitted!</h2>
              <p className="mt-2 text-gray-600">
                Your waste pickup request has been submitted successfully. 
                We'll notify you once it's scheduled.
              </p>
              <p className="mt-1 text-gray-600">
                Redirecting to your profile page...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-8">
              {error && (
                <div className="mb-6 bg-error-50 text-error-700 p-4 rounded-lg flex items-start">
                  <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
              
              <div className="space-y-8">
                <div className="bg-primary-50 p-6 rounded-lg border border-primary-100">
                  <div className="flex items-start">
                    <Info className="h-6 w-6 text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-medium text-primary-900">Earn EcoPoints</h3>
                      <p className="mt-1 text-primary-700">
                        You'll earn EcoPoints based on the type and weight of waste recycled. 
                        Points can be redeemed for discounts on future purchases.
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-primary-800">
                    {wasteTypes.map(type => (
                      <div key={type.value} className="flex items-center bg-white p-2 rounded-md">
                        <span className="w-3 h-3 bg-primary-500 rounded-full mr-2"></span>
                        <span>
                          {type.label}: {type.points} points/kg
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Waste Type*
                    </label>
                    <select
                      name="wasteType"
                      value={formData.wasteType}
                      onChange={handleChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-lg"
                      required
                    >
                      <option value="">Select waste type</option>
                      {wasteTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <Input
                    label="Estimated Weight (kg)*"
                    name="weight"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.weight}
                    onChange={handleChange}
                    required
                    fullWidth
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description*
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Briefly describe the waste materials..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Waste Images (Optional, up to 5)
                  </label>
                  
                  <div className="mt-1 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Waste preview ${index + 1}`}
                          className="h-32 w-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    
                    {imagePreviews.length < 5 && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors">
                        <label className="w-full h-32 flex flex-col items-center justify-center cursor-pointer">
                          <Upload className="h-8 w-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">Upload Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                            multiple
                          />
                        </label>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Upload up to 5 images. Each image should be less than 5MB.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <MapPin className="mr-2 h-5 w-5 text-primary-500" />
                    Pickup Address
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        label="Street Address*"
                        name="street"
                        type="text"
                        value={formData.street}
                        onChange={handleChange}
                        required
                        fullWidth
                      />
                    </div>
                    
                    <Input
                      label="City*"
                      name="city"
                      type="text"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      fullWidth
                    />
                    
                    <Input
                      label="State/Province*"
                      name="state"
                      type="text"
                      value={formData.state}
                      onChange={handleChange}
                      required
                      fullWidth
                    />
                    
                    <Input
                      label="ZIP/Postal Code*"
                      name="postalCode"
                      type="text"
                      value={formData.postalCode}
                      onChange={handleChange}
                      required
                      fullWidth
                    />
                    
                    <Input
                      label="Country*"
                      name="country"
                      type="text"
                      value={formData.country}
                      onChange={handleChange}
                      required
                      fullWidth
                    />
                  </div>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Calendar className="mr-2 h-5 w-5 text-primary-500" />
                    Preferred Pickup Date
                  </h3>
                  
                  <Input
                    label="Pickup Date*"
                    name="pickupDate"
                    type="date"
                    value={formData.pickupDate}
                    onChange={handleChange}
                    required
                    fullWidth
                  />
                  
                  <p className="mt-2 text-sm text-gray-500">
                    We'll try to accommodate your preferred date, but actual pickup times may vary based on availability.
                  </p>
                </div>
              </div>
              
              <div className="mt-8">
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  isLoading={loading}
                  icon={<Recycle size={20} />}
                  className="shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  Submit Pickup Request
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellWastePage;