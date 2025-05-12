import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase/config';
import { User, Order, WasteRequest, FoodRequest } from '../types';
import { 
  User as UserIcon, 
  ShoppingBag, 
  Recycle, 
  Utensils,
  Award,
  Settings,
  LogOut,
  Package,
  Clock,
  Calendar,
  Edit,
  AlertTriangle,
  Camera,
  X
} from 'lucide-react';
import Button from '../components/ui/Button';

const ProfilePage: React.FC = () => {
  const [user, loading] = useAuthState(auth);
  const [profileData, setProfileData] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wasteRequests, setWasteRequests] = useState<WasteRequest[]>([]);
  const [foodRequests, setFoodRequests] = useState<FoodRequest[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      
      try {
        setLoadingData(true);
        setError(null);
        
        // Fetch user profile data
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setProfileData(userData);
        } else {
          // If user document doesn't exist, create it with default values
          const defaultUserData: User = {
            id: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            photoURL: user.photoURL || null,
            ecoPoints: 0,
            wasteRecycled: 0,
            mealsRescued: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          await setDoc(userDocRef, defaultUserData);
          setProfileData(defaultUserData);
        }
        
        // Fetch orders
        const ordersQuery = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        
        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersData = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Order[];
        
        setOrders(ordersData);
        
        // Fetch waste requests
        const wasteRequestsQuery = query(
          collection(db, 'wasteRequests'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        
        const wasteRequestsSnapshot = await getDocs(wasteRequestsQuery);
        const wasteRequestsData = wasteRequestsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          scheduledPickupDate: doc.data().scheduledPickupDate?.toDate() || null,
          completedDate: doc.data().completedDate?.toDate() || null,
        })) as WasteRequest[];
        
        setWasteRequests(wasteRequestsData);
        
        // Fetch food requests
        const foodRequestsQuery = query(
          collection(db, 'foodRequests'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        
        const foodRequestsSnapshot = await getDocs(foodRequestsQuery);
        const foodRequestsData = foodRequestsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          scheduledPickupDate: doc.data().scheduledPickupDate?.toDate() || null,
          completedDate: doc.data().completedDate?.toDate() || null,
          expiryDate: doc.data().expiryDate?.toDate() || null,
        })) as FoodRequest[];
        
        setFoodRequests(foodRequestsData);
        
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load profile data. Please try again later.');
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchProfileData();
  }, [user]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) {
      setError('Please select an image file');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      setError(null);
      
      // Create a unique filename
      const fileExtension = file.name.split('.').pop();
      const fileName = `${user.uid}_${Date.now()}.${fileExtension}`;
      
      // Create a reference to the file location in Firebase Storage
      const storageRef = ref(storage, `profile_images/${fileName}`);
      
      // Upload the file with metadata
      const metadata = {
        contentType: file.type,
        customMetadata: {
          userId: user.uid
        }
      };
      
      const snapshot = await uploadBytes(storageRef, file, metadata);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Update the user's profile in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        photoURL: downloadURL,
        updatedAt: new Date()
      });
      
      // Update local state
      setProfileData(prev => prev ? { ...prev, photoURL: downloadURL } : null);
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  // Skeleton loaders
  const ProfileSkeleton = () => (
    <div className="animate-pulse">
      <div className="flex items-center">
        <div className="rounded-full bg-gray-200 h-20 w-20"></div>
        <div className="ml-4">
          <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-24 bg-gray-200 rounded"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning-100 text-warning-800';
      case 'scheduled':
        return 'bg-primary-100 text-primary-800';
      case 'processing':
        return 'bg-primary-100 text-primary-800';
      case 'shipped':
        return 'bg-secondary-100 text-secondary-800';
      case 'completed':
      case 'delivered':
        return 'bg-success-100 text-success-800';
      case 'cancelled':
        return 'bg-error-100 text-error-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="md:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-24">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col items-center">
                  <div className="relative group">
                    <div 
                      className="h-20 w-20 rounded-full overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={handleImageClick}
                    >
                      {profileData?.photoURL ? (
                        <img
                          src={profileData.photoURL}
                          alt={profileData.displayName || 'User'}
                          className="h-full w-full object-cover border-2 border-primary-500"
                          onError={(e) => {
                            // Handle image loading error
                            const target = e.target as HTMLImageElement;
                            target.src = ''; // Clear the src
                            setProfileData(prev => prev ? { ...prev, photoURL: null } : null);
                          }}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-primary-100 border-2 border-primary-500">
                          <UserIcon className="h-10 w-10 text-primary-600" />
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/jpeg,image/png,image/gif"
                      className="hidden"
                    />
                    {uploadingImage && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                        <div className="animate-spin h-6 w-6 border-2 border-white rounded-full border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-gray-900">
                    {profileData?.displayName || user.displayName || 'User'}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    {profileData?.email || user.email}
                  </p>
                </div>
              </div>
              
              <nav className="py-2">
                <button
                  className={`w-full flex items-center px-6 py-3 text-sm font-medium ${
                    activeTab === 'overview'
                      ? 'text-primary-700 bg-primary-50 border-l-4 border-primary-500'
                      : 'text-gray-600 hover:text-primary-700 hover:bg-gray-50'
                  }`}
                  onClick={() => handleTabChange('overview')}
                >
                  <UserIcon className="mr-3 h-5 w-5" />
                  Overview
                </button>
                <button
                  className={`w-full flex items-center px-6 py-3 text-sm font-medium ${
                    activeTab === 'orders'
                      ? 'text-primary-700 bg-primary-50 border-l-4 border-primary-500'
                      : 'text-gray-600 hover:text-primary-700 hover:bg-gray-50'
                  }`}
                  onClick={() => handleTabChange('orders')}
                >
                  <ShoppingBag className="mr-3 h-5 w-5" />
                  Orders
                </button>
                <button
                  className={`w-full flex items-center px-6 py-3 text-sm font-medium ${
                    activeTab === 'waste'
                      ? 'text-primary-700 bg-primary-50 border-l-4 border-primary-500'
                      : 'text-gray-600 hover:text-primary-700 hover:bg-gray-50'
                  }`}
                  onClick={() => handleTabChange('waste')}
                >
                  <Recycle className="mr-3 h-5 w-5" />
                  Recycling
                </button>
                <button
                  className={`w-full flex items-center px-6 py-3 text-sm font-medium ${
                    activeTab === 'food'
                      ? 'text-primary-700 bg-primary-50 border-l-4 border-primary-500'
                      : 'text-gray-600 hover:text-primary-700 hover:bg-gray-50'
                  }`}
                  onClick={() => handleTabChange('food')}
                >
                  <Utensils className="mr-3 h-5 w-5" />
                  Food Donations
                </button>
              </nav>
              
              <div className="p-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  fullWidth
                  className="mb-2"
                  icon={<Settings size={18} />}
                >
                  Settings
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={handleSignOut}
                  icon={<LogOut size={18} />}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1">
            {error && (
              <div className="bg-error-50 text-error-700 p-4 rounded-md mb-6 flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Overview</h2>
                  
                  {loadingData ? (
                    <ProfileSkeleton />
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-primary-50 rounded-lg p-4 border border-primary-100">
                          <div className="flex items-center mb-2">
                            <Award className="h-8 w-8 text-primary-500 mr-2" />
                            <h3 className="text-lg font-medium text-gray-900">EcoPoints</h3>
                          </div>
                          <p className="text-3xl font-bold text-primary-600">{profileData?.ecoPoints || 0}</p>
                          <Link to="/shop" className="text-sm text-primary-700 hover:underline mt-1 inline-block">
                            Redeem Points →
                          </Link>
                        </div>
                        
                        <div className="bg-secondary-50 rounded-lg p-4 border border-secondary-100">
                          <div className="flex items-center mb-2">
                            <Recycle className="h-8 w-8 text-secondary-500 mr-2" />
                            <h3 className="text-lg font-medium text-gray-900">Waste Recycled</h3>
                          </div>
                          <p className="text-3xl font-bold text-secondary-600">
                            {(profileData?.wasteRecycled || 0).toFixed(1)} <span className="text-lg">kg</span>
                          </p>
                          <Link to="/sell-waste" className="text-sm text-secondary-700 hover:underline mt-1 inline-block">
                            Recycle More →
                          </Link>
                        </div>
                        
                        <div className="bg-accent-50 rounded-lg p-4 border border-accent-100">
                          <div className="flex items-center mb-2">
                            <Utensils className="h-8 w-8 text-accent-500 mr-2" />
                            <h3 className="text-lg font-medium text-gray-900">Meals Rescued</h3>
                          </div>
                          <p className="text-3xl font-bold text-accent-600">{profileData?.mealsRescued || 0}</p>
                          <Link to="/food-waste" className="text-sm text-accent-700 hover:underline mt-1 inline-block">
                            Donate Food →
                          </Link>
                        </div>
                      </div>

                      <div className="mt-8">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                        
                        <div className="space-y-4">
                          {orders.length === 0 && wasteRequests.length === 0 && foodRequests.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                              <p className="text-gray-500">No recent activity found.</p>
                              <div className="mt-4 space-x-4">
                                <Link to="/shop">
                                  <Button variant="outline" size="sm">Shop Now</Button>
                                </Link>
                                <Link to="/sell-waste">
                                  <Button variant="outline" size="sm">Recycle Waste</Button>
                                </Link>
                              </div>
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-200">
                              {orders.slice(0, 2).map(order => (
                                <div key={order.id} className="py-4 flex items-start">
                                  <div className="rounded-full bg-primary-100 p-2 mr-4">
                                    <Package className="h-6 w-6 text-primary-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      Order #{order.id.substring(0, 8)}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {formatDate(order.createdAt)} · {order.items.length} items · ${order.totalAmount.toFixed(2)}
                                    </p>
                                    <div className="mt-1">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              {wasteRequests.slice(0, 2).map(request => (
                                <div key={request.id} className="py-4 flex items-start">
                                  <div className="rounded-full bg-secondary-100 p-2 mr-4">
                                    <Recycle className="h-6 w-6 text-secondary-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      Waste Pickup: {request.wasteType.charAt(0).toUpperCase() + request.wasteType.slice(1)}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {formatDate(request.createdAt)} · {request.weight} kg · {request.ecoPointsAwarded} points
                                    </p>
                                    <div className="mt-1">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              {foodRequests.slice(0, 2).map(request => (
                                <div key={request.id} className="py-4 flex items-start">
                                  <div className="rounded-full bg-accent-100 p-2 mr-4">
                                    <Utensils className="h-6 w-6 text-accent-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      Food Donation: {request.foodType}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {formatDate(request.createdAt)} · {request.quantity} units · {request.ecoPointsAwarded} points
                                    </p>
                                    <div className="mt-1">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
                  
                  {loadingData ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="font-medium">{profileData?.displayName || user.displayName || 'Not set'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Email Address</p>
                        <p className="font-medium">{profileData?.email || user.email}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Phone Number</p>
                        <p className="font-medium">{profileData?.phoneNumber || 'Not set'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        {profileData?.address ? (
                          <p className="font-medium">
                            {profileData.address.street}, {profileData.address.city}, {profileData.address.state} {profileData.address.postalCode}, {profileData.address.country}
                          </p>
                        ) : (
                          <p className="text-gray-500">No address set</p>
                        )}
                      </div>
                      
                      <div className="pt-4 flex">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Edit size={16} />}
                        >
                          Edit Profile
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <ShoppingBag className="h-5 w-5 mr-2 text-primary-500" />
                      Your Orders
                    </h2>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {loadingData ? (
                      Array(3).fill(null).map((_, index) => (
                        <div key={`order-skeleton-${index}`} className="p-6 animate-pulse">
                          <div className="flex justify-between mb-2">
                            <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-5 bg-gray-200 rounded w-20"></div>
                          </div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                          <div className="h-16 bg-gray-200 rounded"></div>
                        </div>
                      ))
                    ) : orders.length > 0 ? (
                      orders.map(order => (
                        <div key={order.id} className="p-6">
                          <div className="flex flex-wrap justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                Order #{order.id.substring(0, 8)}
                              </h3>
                              <p className="text-sm text-gray-500 flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                Placed on {formatDate(order.createdAt)}
                              </p>
                            </div>
                            <div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="border rounded-md overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2 border-b">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium text-gray-900">Items ({order.items.length})</span>
                                <span className="font-medium text-gray-900">Total: ${order.totalAmount.toFixed(2)}</span>
                              </div>
                            </div>
                            
                            <div className="divide-y divide-gray-200">
                              {order.items.map((item, index) => (
                                <div key={`${order.id}-item-${index}`} className="flex p-4">
                                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                    <img
                                      src={item.imageUrl || 'https://via.placeholder.com/150'}
                                      alt={item.name}
                                      className="h-full w-full object-cover object-center"
                                    />
                                  </div>
                                  <div className="ml-4 flex flex-1 flex-col">
                                    <div>
                                      <div className="flex justify-between text-base font-medium text-gray-900">
                                        <h4>{item.name}</h4>
                                        <p className="ml-4">${item.price.toFixed(2)}</p>
                                      </div>
                                    </div>
                                    <div className="flex flex-1 items-end justify-between text-sm">
                                      <p className="text-gray-500">Qty {item.quantity}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="mt-4 flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                            >
                              Track Order
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="mt-2 text-lg font-medium text-gray-900">No orders yet</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          You haven't placed any orders yet. Start shopping to see your orders here.
                        </p>
                        <div className="mt-6">
                          <Link to="/shop">
                            <Button>
                              Browse Products
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Waste Recycling Tab */}
            {activeTab === 'waste' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <Recycle className="h-5 w-5 mr-2 text-primary-500" />
                      Waste Recycling Requests
                    </h2>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {loadingData ? (
                      Array(3).fill(null).map((_, index) => (
                        <div key={`waste-skeleton-${index}`} className="p-6 animate-pulse">
                          <div className="flex justify-between mb-2">
                            <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-5 bg-gray-200 rounded w-20"></div>
                          </div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                          <div className="h-16 bg-gray-200 rounded"></div>
                        </div>
                      ))
                    ) : wasteRequests.length > 0 ? (
                      wasteRequests.map(request => (
                        <div key={request.id} className="p-6">
                          <div className="flex flex-wrap justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {request.wasteType.charAt(0).toUpperCase() + request.wasteType.slice(1)} Waste
                              </h3>
                              <div className="flex flex-wrap items-center text-sm text-gray-500 mt-1">
                                <div className="flex items-center mr-4">
                                  <Clock className="h-4 w-4 mr-1" />
                                  Requested on {formatDate(request.createdAt)}
                                </div>
                                {request.scheduledPickupDate && (
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    Pickup on {formatDate(request.scheduledPickupDate)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 rounded-md p-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Weight</p>
                                <p className="font-medium">{request.weight} kg</p>
                              </div>
                              <div>
                                <p className="text-gray-500">EcoPoints</p>
                                <p className="font-medium">{request.ecoPointsAwarded || 0} points</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-gray-500">Description</p>
                                <p className="font-medium">{request.description}</p>
                              </div>
                            </div>
                            
                            {request.imageUrl && (
                              <div className="mt-4">
                                <div className="h-48 w-full md:w-1/2 lg:w-1/3 overflow-hidden rounded-md">
                                  <img
                                    src={request.imageUrl}
                                    alt="Waste"
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-4 flex space-x-2">
                            {request.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-error-600 border-error-300 hover:bg-error-50"
                              >
                                Cancel Request
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <Recycle className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="mt-2 text-lg font-medium text-gray-900">No recycling requests</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          You haven't submitted any waste recycling requests yet.
                        </p>
                        <div className="mt-6">
                          <Link to="/sell-waste">
                            <Button>
                              Recycle Waste
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Food Donations Tab */}
            {activeTab === 'food' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <Utensils className="h-5 w-5 mr-2 text-primary-500" />
                      Food Donation Requests
                    </h2>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {loadingData ? (
                      Array(3).fill(null).map((_, index) => (
                        <div key={`food-skeleton-${index}`} className="p-6 animate-pulse">
                          <div className="flex justify-between mb-2">
                            <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-5 bg-gray-200 rounded w-20"></div>
                          </div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                          <div className="h-16 bg-gray-200 rounded"></div>
                        </div>
                      ))
                    ) : foodRequests.length > 0 ? (
                      foodRequests.map(request => (
                        <div key={request.id} className="p-6">
                          <div className="flex flex-wrap justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {request.foodType}
                              </h3>
                              <div className="flex flex-wrap items-center text-sm text-gray-500 mt-1">
                                <div className="flex items-center mr-4">
                                  <Clock className="h-4 w-4 mr-1" />
                                  Requested on {formatDate(request.createdAt)}
                                </div>
                                {request.scheduledPickupDate && (
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    Pickup on {formatDate(request.scheduledPickupDate)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 rounded-md p-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Quantity</p>
                                <p className="font-medium">{request.quantity} units</p>
                              </div>
                              <div>
                                <p className="text-gray-500">EcoPoints</p>
                                <p className="font-medium">{request.ecoPointsAwarded || 0} points</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Expiry Date</p>
                                <p className="font-medium">{request.expiryDate ? formatDate(request.expiryDate) : 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Description</p>
                                <p className="font-medium">{request.description}</p>
                              </div>
                            </div>
                            
                            {request.imageUrl && (
                              <div className="mt-4">
                                <div className="h-48 w-full md:w-1/2 lg:w-1/3 overflow-hidden rounded-md">
                                  <img
                                    src={request.imageUrl}
                                    alt="Food"
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-4 flex space-x-2">
                            {request.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-error-600 border-error-300 hover:bg-error-50"
                              >
                                Cancel Request
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <Utensils className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="mt-2 text-lg font-medium text-gray-900">No food donations</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          You haven't submitted any food donation requests yet.
                        </p>
                        <div className="mt-6">
                          <Link to="/food-waste">
                            <Button>
                              Donate Food
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;