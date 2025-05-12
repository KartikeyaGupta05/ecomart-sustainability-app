import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase/config';
import { FoodRequest } from '../types';
import { Utensils, Upload, Calendar, MapPin, Info, AlertTriangle, Heart, Truck, BarChart2, Users } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import CallToAction from '../components/common/CallToAction';

interface DonationFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  foodType: string;
  quantity: string;
  pickupDate: string;
  pickupTime: string;
  notes: string;
}

const FoodWastePage: React.FC = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<DonationFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    foodType: '',
    quantity: '',
    pickupDate: '',
    pickupTime: '',
    notes: ''
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const foodTypes = [
    'Cooked Meals',
    'Fresh Produce',
    'Dairy Products',
    'Bakery Items',
    'Canned Goods',
    'Beverages',
    'Other',
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      
      // Check file size (limit to 5MB)
      const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024);
      if (validFiles.length === 0) {
        setError('No valid image files uploaded. Maximum size is 5MB per file.');
        return;
      }
      
      setImageFiles(validFiles);
      
      // Create previews
      const previews = validFiles.map(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
        return reader.result as string;
      });
    }
  };

  const validateForm = () => {
    if (!user) {
      setError('You must be logged in to submit a food donation request.');
      return false;
    }
    
    if (!formData.foodType) {
      setError('Please select a food type.');
      return false;
    }
    
    if (!formData.quantity) {
      setError('Please enter the quantity.');
      return false;
    }
    
    if (isNaN(parseFloat(formData.quantity)) || parseFloat(formData.quantity) <= 0) {
      setError('Please enter a valid quantity.');
      return false;
    }
    
    if (!formData.description) {
      setError('Please provide a brief description of the food.');
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
    
    if (!formData.expiryDate) {
      setError('Please provide the expiry date of the food.');
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
    
    // Check if expiry date is after pickup date
    const expiryDate = new Date(formData.expiryDate);
    
    if (expiryDate < today) {
      setError('Expiry date must be today or in the future.');
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
          const storageRef = ref(storage, `food_images/${user.uid}/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          return getDownloadURL(storageRef);
        })
      );

      // Calculate eco points based on quantity and food type
      const ecoPoints = Math.round(formData.quantity * 5); // 5 points per unit

      // Create food request
      const foodRequest: FoodRequest = {
        id: '', // Will be set by Firestore
        userId: user.uid,
        foodType: formData.foodType,
        quantity: formData.quantity,
        description: formData.description,
        imageUrls,
        status: 'pending',
        ecoPointsAwarded: ecoPoints,
        createdAt: new Date(),
        updatedAt: new Date(),
        scheduledPickupDate: null,
        completedDate: null,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined
      };

      // Add to food requests collection
      const foodRequestRef = await addDoc(collection(db, 'foodRequests'), foodRequest);

      // Update user's stats
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ecoPoints: increment(ecoPoints),
        mealsRescued: increment(formData.quantity),
        updatedAt: new Date()
      });

      // Show success message
      setSuccess(true);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        foodType: '',
        quantity: '',
        pickupDate: '',
        pickupTime: '',
        notes: ''
      });
      setImageFiles([]);
      setImagePreviews([]);

      // Redirect to profile page after 3 seconds
      setTimeout(() => {
        navigate('/profile');
      }, 3000);

    } catch (err) {
      console.error('Error submitting food donation:', err);
      setError('Failed to submit food donation. Please try again.');
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
            <Utensils className="h-12 w-12 text-primary-500 mx-auto" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Login Required</h2>
            <p className="mt-2 text-gray-600">
              You need to be logged in to donate surplus food.
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
      {/* Donate Hero */}
      <section className="relative bg-gradient-to-r from-amber-500 to-amber-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Donate Surplus Food</h1>
            <p className="text-xl mb-8">
              Help reduce food waste and feed local communities by donating your excess food.
              We connect you with local NGOs and food banks to ensure your donations reach those in need.
            </p>
            <button 
              onClick={() => setShowForm(true)}
              className="btn-primary bg-white text-amber-600 hover:bg-gray-100 py-3 px-8 text-lg"
            >
              Schedule a Donation Pickup
            </button>
          </div>
        </div>
      </section>

      {/* Donation Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Schedule Your Donation</h2>
                <button 
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Food Type</label>
                    <select
                      name="foodType"
                      value={formData.foodType}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">Select food type</option>
                      <option value="packaged">Packaged Foods</option>
                      <option value="fresh">Fresh Produce</option>
                      <option value="prepared">Prepared Foods</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (kg)</label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
                    <input
                      type="date"
                      name="pickupDate"
                      value={formData.pickupDate}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time</label>
                    <input
                      type="time"
                      name="pickupTime"
                      value={formData.pickupTime}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  ></textarea>
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-amber-600 rounded-md hover:bg-amber-700"
                  >
                    Schedule Pickup
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How Food Donation Works</h2>
            <p className="text-gray-600 text-lg">
              Our streamlined process ensures your food donations reach those in need quickly and safely
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="card card-hover text-center">
                <div className="flex flex-col items-center">
                  <div className="mb-5 p-4 bg-amber-100 rounded-full">
                    <Calendar className="w-10 h-10 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">1. Schedule</h3>
                  <p className="text-gray-600">
                    Tell us what food you have to donate and schedule a convenient pickup time
                  </p>
                </div>
              </div>

              <div className="card card-hover text-center">
                <div className="flex flex-col items-center">
                  <div className="mb-5 p-4 bg-amber-100 rounded-full">
                    <Truck className="w-10 h-10 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">2. Pickup</h3>
                  <p className="text-gray-600">
                    Our verified food rescue partners collect your donation following safety protocols
                  </p>
                </div>
              </div>

              <div className="card card-hover text-center">
                <div className="flex flex-col items-center">
                  <div className="mb-5 p-4 bg-amber-100 rounded-full">
                    <Heart className="w-10 h-10 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">3. Impact</h3>
                  <p className="text-gray-600">
                    Track where your donation went and the difference you've made in your community
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <h2 className="text-3xl font-bold mb-6">Our Donation Impact</h2>
                <p className="text-gray-600 text-lg mb-8">
                  Your donations make a real difference in your community. Here's the impact our donors have made so far:
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-100">
                    <div className="flex items-start space-x-4">
                      <div className="bg-green-100 p-3 rounded-full">
                        <Heart className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-gray-800">87,320</div>
                        <div className="text-gray-600">Meals Donated</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-100">
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-gray-800">3,450</div>
                        <div className="text-gray-600">Families Supported</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-100">
                    <div className="flex items-start space-x-4">
                      <div className="bg-amber-100 p-3 rounded-full">
                        <BarChart2 className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-gray-800">42,150</div>
                        <div className="text-gray-600">kg Food Rescued</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-100">
                    <div className="flex items-start space-x-4">
                      <div className="bg-purple-100 p-3 rounded-full">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-gray-800">32</div>
                        <div className="text-gray-600">NGO Partners</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="order-1 lg:order-2 relative">
                <img 
                  src="https://images.pexels.com/photos/6591164/pexels-photo-6591164.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Food Donation Impact" 
                  className="rounded-lg shadow-lg"
                />
                
                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-lg shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-amber-100 p-2 rounded-full">
                      <Heart className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">2,450 meals</div>
                      <div className="text-sm text-gray-600">Donated This Week</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CallToAction />
    </div>
  );
};

export default FoodWastePage;