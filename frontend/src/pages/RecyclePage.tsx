import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase/config';
import { WasteRequest } from '../types';
import { Recycle, Upload, Calendar, MapPin, Info, AlertTriangle, Truck, Check } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const RecyclePage: React.FC = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  
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

  const recyclableItems = [
    {
      category: 'Electronics',
      items: ['Phones', 'Laptops', 'Tablets', 'Printers', 'Batteries'],
      points: 100,
      icon: <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    },
    {
      category: 'Plastics',
      items: ['PET Bottles', 'HDPE Containers', 'Plastic Bags', 'Packaging'],
      points: 30,
      icon: <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    },
    {
      category: 'Paper',
      items: ['Newspapers', 'Magazines', 'Cardboard Boxes', 'Office Paper'],
      points: 25,
      icon: <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    },
    {
      category: 'Glass',
      items: ['Bottles', 'Jars', 'Containers'],
      points: 40,
      icon: <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    }
  ];

  const environmentalImpact = [
    {
      title: "Energy Saved",
      description: "Recycling aluminum saves 95% of the energy needed to make new aluminum",
      icon: <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    },
    {
      title: "Water Conservation",
      description: "Recycling paper saves 7,000 gallons of water per ton",
      icon: <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    },
    {
      title: "Carbon Reduction",
      description: "Recycling one ton of plastic saves 2,000 pounds of CO2 emissions",
      icon: <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    },
    {
      title: "Landfill Space",
      description: "Recycling one ton of paper saves 3.3 cubic yards of landfill space",
      icon: <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    }
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
      
      if (imageFiles.length + newFiles.length > 5) {
        setError('You can upload a maximum of 5 images.');
        return;
      }
      
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

      if (!validateForm()) {
        setLoading(false);
        return;
      }

      const imageUrls = await Promise.all(
        imageFiles.map(async (file) => {
          const storageRef = ref(storage, `waste_images/${user.uid}/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          return getDownloadURL(storageRef);
        })
      );

      const wasteType = wasteTypes.find(type => type.value === formData.wasteType);
      const basePoints = wasteType ? wasteType.points : 5;
      const weight = parseFloat(formData.weight);
      const ecoPoints = Math.round(basePoints * weight);

      const wasteRequest: WasteRequest = {
        id: '',
        userId: user.uid,
        wasteType: formData.wasteType as "plastic" | "paper" | "glass" | "metal" | "electronic" | "organic" | "other",
        weight: parseFloat(formData.weight),
        description: formData.description,
        imageUrls,
        status: 'pending',
        ecoPointsAwarded: ecoPoints,
        createdAt: new Date(),
        updatedAt: new Date(),
        scheduledPickupDate: undefined,
        completedDate: undefined,
        wasteTypePoints: basePoints,
        weightPoints: weight,
        totalPoints: ecoPoints
      };

      const wasteRequestRef = await addDoc(collection(db, 'wasteRequests'), wasteRequest);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ecoPoints: increment(ecoPoints),
        wasteRecycled: increment(weight),
        totalWasteRecycled: increment(weight),
        wasteRecyclingCount: increment(1),
        lastRecyclingDate: new Date(),
        updatedAt: new Date()
      });

      setSuccess(true);
      
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
    <div className="pt-16">
      {/* Recycle Hero */}
      <section className="relative bg-gradient-to-r from-green-600 to-green-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Schedule a Recycling Pickup</h1>
            <p className="text-xl mb-8">
              Properly dispose of recyclable items and earn GreenPoints.
              We'll pick up, process, and ensure your items are recycled responsibly.
            </p>
            <button 
              onClick={() => {
                if (!user) {
                  navigate('/login');
                  return;
                }
                setShowForm(true);
                document.getElementById('pickup-form')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-primary bg-white text-green-700 hover:bg-gray-100 py-3 px-8 text-lg"
            >
              Schedule a Pickup
            </button>
          </div>
        </div>
      </section>

      {/* Environmental Impact Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Your Recycling Impact</h2>
            <p className="text-gray-600 text-lg">
              Every item you recycle makes a significant difference to our environment
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {environmentalImpact.map((impact, index) => (
              <div key={index} className="bg-green-50 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 p-3 bg-white rounded-full">
                    {impact.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-green-800">{impact.title}</h3>
                  <p className="text-green-700">{impact.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button 
              onClick={() => {
                if (!user) {
                  navigate('/login');
                  return;
                }
                setShowForm(true);
                document.getElementById('pickup-form')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-primary bg-green-600 text-white hover:bg-green-700 py-3 px-8 text-lg"
            >
              Start Making an Impact
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How Recycling Pickup Works</h2>
            <p className="text-gray-600 text-lg">
              Our easy 3-step process ensures your recyclables are handled responsibly
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="card card-hover text-center">
                <div className="flex flex-col items-center">
                  <div className="mb-5 p-4 bg-green-100 rounded-full">
                    <Calendar className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">1. Schedule</h3>
                  <p className="text-gray-600">
                    Choose a convenient date and time for your pickup through our app or website
                  </p>
                </div>
              </div>

              <div className="card card-hover text-center">
                <div className="flex flex-col items-center">
                  <div className="mb-5 p-4 bg-green-100 rounded-full">
                    <Truck className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">2. Collection</h3>
                  <p className="text-gray-600">
                    Our team arrives at your location to collect your sorted recyclables
                  </p>
                </div>
              </div>

              <div className="card card-hover text-center">
                <div className="flex flex-col items-center">
                  <div className="mb-5 p-4 bg-green-100 rounded-full">
                    <Check className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">3. Earn & Track</h3>
                  <p className="text-gray-600">
                    Receive GreenPoints for your contribution and track the impact of your recyclables
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You Can Recycle */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What You Can Recycle</h2>
            <p className="text-gray-600 text-lg">
              We accept a wide range of recyclable materials. Each category earns different GreenPoints.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {recyclableItems.map((category, index) => (
              <div key={index} className="card card-hover">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-green-50 rounded-full">
                    {category.icon}
                  </div>
                  <div>
                    <div className="flex items-center mb-2">
                      <h3 className="text-xl font-semibold mr-2">{category.category}</h3>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        +{category.points} points
                      </span>
                    </div>
                    <ul className="text-gray-600 space-y-1">
                      {category.items.map((item, idx) => (
                        <li key={idx} className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pickup Form */}
      {showForm && (
        <section id="pickup-form" className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-8 text-white">
                <h1 className="text-3xl font-bold flex items-center">
                  <Recycle className="mr-3 h-8 w-8" />
                  Schedule Your Pickup
                </h1>
                <p className="mt-3 text-lg opacity-90">
                  Fill out the form below to schedule your waste pickup and earn EcoPoints.
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
        </section>
      )}
    </div>
  );
};

export default RecyclePage; 