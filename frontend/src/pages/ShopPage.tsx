import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Product } from '../types';
import { Filter, ShoppingCart, Star, ShoppingBag, Search, X } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { initializeRazorpay, makePayment } from '../utils/razorpay';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/config';

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Bamboo Toothbrush Set',
    description: 'Pack of 4 biodegradable bamboo toothbrushes with charcoal-infused bristles.',
    price: 299,
    imageUrl: 'https://images.pexels.com/photos/3737579/pexels-photo-3737579.jpeg',
    ecoRating: 5,
    recyclable: true,
    category: 'bathroom',
    createdAt: new Date(),
    stockQuantity: 50,
    sustainabilityFeatures: ['Biodegradable', 'Natural Materials', 'Plastic-Free']
  },
  {
    id: '2',
    name: 'Reusable Produce Bags',
    description: 'Set of 5 mesh bags for grocery shopping. Machine washable and durable.',
    price: 399,
    imageUrl: 'https://images.pexels.com/photos/4065876/pexels-photo-4065876.jpeg',
    ecoRating: 4.5,
    recyclable: true,
    category: 'kitchen',
    createdAt: new Date(),
    stockQuantity: 100,
    sustainabilityFeatures: ['Reusable', 'Washable', 'Durable']
  },
  {
    id: '3',
    name: 'Stainless Steel Water Bottle',
    description: 'Double-walled insulated bottle keeps drinks hot for 12 hours and cold for 24 hours.',
    price: 799,
    imageUrl: 'https://images.pexels.com/photos/4239013/pexels-photo-4239013.jpeg',
    ecoRating: 4,
    recyclable: true,
    category: 'kitchen',
    createdAt: new Date(),
    stockQuantity: 75,
    sustainabilityFeatures: ['Reusable', 'Durable', 'Insulated']
  },
  {
    id: '4',
    name: 'Organic Cotton T-Shirt',
    description: 'Made from 100% organic cotton, using eco-friendly dyes and ethical manufacturing.',
    price: 899,
    imageUrl: 'https://images.pexels.com/photos/5698851/pexels-photo-5698851.jpeg',
    ecoRating: 4.5,
    recyclable: false,
    category: 'clothing',
    createdAt: new Date(),
    stockQuantity: 60,
    sustainabilityFeatures: ['Organic Materials', 'Ethical Manufacturing', 'Natural Dyes']
  },
  {
    id: '5',
    name: 'Solar Power Bank',
    description: 'Charge your devices using solar energy. Includes 20000mAh battery and dual USB ports.',
    price: 1499,
    imageUrl: 'https://images.pexels.com/photos/6667359/pexels-photo-6667359.jpeg',
    ecoRating: 3.5,
    recyclable: false,
    category: 'electronics',
    createdAt: new Date(),
    stockQuantity: 40,
    sustainabilityFeatures: ['Solar Powered', 'Energy Efficient', 'Long Lasting']
  },
  {
    id: '6',
    name: 'Beeswax Food Wraps',
    description: 'Reusable alternative to plastic wrap. Set of 3 different sizes.',
    price: 449,
    imageUrl: 'https://images.pexels.com/photos/5501994/pexels-photo-5501994.jpeg',
    ecoRating: 5,
    recyclable: true,
    category: 'kitchen',
    createdAt: new Date(),
    stockQuantity: 80,
    sustainabilityFeatures: ['Natural Materials', 'Reusable', 'Biodegradable']
  },
  {
    id: '7',
    name: 'Bamboo Cutlery Set',
    description: 'Portable cutlery set with knife, fork, spoon, and chopsticks in a canvas pouch.',
    price: 349,
    imageUrl: 'https://images.pexels.com/photos/5908232/pexels-photo-5908232.jpeg',
    ecoRating: 4.5,
    recyclable: true,
    category: 'kitchen',
    createdAt: new Date(),
    stockQuantity: 90,
    sustainabilityFeatures: ['Bamboo Material', 'Reusable', 'Portable']
  },
  {
    id: '8',
    name: 'Biodegradable Phone Case',
    description: 'Made from plant-based materials that fully decompose after disposal.',
    price: 599,
    imageUrl: 'https://images.pexels.com/photos/1447254/pexels-photo-1447254.jpeg',
    ecoRating: 4,
    recyclable: true,
    category: 'electronics',
    createdAt: new Date(),
    stockQuantity: 70,
    sustainabilityFeatures: ['Biodegradable', 'Plant-Based', 'Eco-Friendly']
  },
  {
    id: '9',
    name: 'Eco-Friendly Yoga Mat',
    description: 'Made from natural rubber and recycled materials. Non-slip and biodegradable.',
    price: 1299,
    imageUrl: 'https://images.pexels.com/photos/4662438/pexels-photo-4662438.jpeg',
    ecoRating: 4.5,
    recyclable: true,
    category: 'fitness',
    createdAt: new Date(),
    stockQuantity: 45,
    sustainabilityFeatures: ['Natural Rubber', 'Recycled Materials', 'Non-Toxic']
  },
  {
    id: '10',
    name: 'Reusable Coffee Cup',
    description: 'Double-walled bamboo coffee cup with silicone lid and sleeve.',
    price: 499,
    imageUrl: 'https://images.pexels.com/photos/1207918/pexels-photo-1207918.jpeg',
    ecoRating: 4.5,
    recyclable: true,
    category: 'kitchen',
    createdAt: new Date(),
    stockQuantity: 85,
    sustainabilityFeatures: ['Bamboo Material', 'Reusable', 'Insulated']
  },
  {
    id: '11',
    name: 'Hemp Backpack',
    description: 'Durable hemp backpack with laptop compartment and multiple pockets.',
    price: 1899,
    imageUrl: 'https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg',
    ecoRating: 4,
    recyclable: false,
    category: 'accessories',
    createdAt: new Date(),
    stockQuantity: 55,
    sustainabilityFeatures: ['Hemp Material', 'Durable', 'Ethical Manufacturing']
  },
  {
    id: '12',
    name: 'Solar Garden Lights',
    description: 'Set of 4 solar-powered LED garden lights with auto on/off.',
    price: 999,
    imageUrl: 'https://images.pexels.com/photos/1123262/pexels-photo-1123262.jpeg',
    ecoRating: 4,
    recyclable: true,
    category: 'outdoor',
    createdAt: new Date(),
    stockQuantity: 65,
    sustainabilityFeatures: ['Solar Powered', 'LED Technology', 'Energy Efficient']
  },
  {
    id: '13',
    name: 'Organic Cotton Face Masks',
    description: 'Pack of 5 reusable face masks made from organic cotton with adjustable ear loops.',
    price: 599,
    imageUrl: 'https://images.pexels.com/photos/6311387/pexels-photo-6311387.jpeg',
    ecoRating: 4.5,
    recyclable: true,
    category: 'personal-care',
    createdAt: new Date(),
    stockQuantity: 120,
    sustainabilityFeatures: ['Organic Cotton', 'Reusable', 'Washable']
  },
  {
    id: '14',
    name: 'Bamboo Toothpaste Tablets',
    description: 'Zero-waste toothpaste tablets in a glass jar. Mint flavored, fluoride-free.',
    price: 349,
    imageUrl: 'https://images.pexels.com/photos/3735643/pexels-photo-3735643.jpeg',
    ecoRating: 5,
    recyclable: true,
    category: 'bathroom',
    createdAt: new Date(),
    stockQuantity: 95,
    sustainabilityFeatures: ['Zero Waste', 'Plastic-Free', 'Natural Ingredients']
  },
  {
    id: '15',
    name: 'Recycled Paper Notebook',
    description: 'A5 size notebook made from 100% recycled paper with 200 pages.',
    price: 249,
    imageUrl: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg',
    ecoRating: 4,
    recyclable: true,
    category: 'office',
    createdAt: new Date(),
    stockQuantity: 150,
    sustainabilityFeatures: ['Recycled Paper', 'Tree-Free', 'Biodegradable']
  },
  {
    id: '16',
    name: 'Natural Loofah Sponge',
    description: 'Organic loofah sponge for body and dish washing. Biodegradable and compostable.',
    price: 199,
    imageUrl: 'https://images.pexels.com/photos/3735643/pexels-photo-3735643.jpeg',
    ecoRating: 5,
    recyclable: true,
    category: 'bathroom',
    createdAt: new Date(),
    stockQuantity: 110,
    sustainabilityFeatures: ['Natural Material', 'Biodegradable', 'Compostable']
  }
];

const ShopPage: React.FC = () => {
  const [user] = useAuthState(auth);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    ecoRating: 0,
    recyclable: false,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Categories for filter
  const categories = [
    'Home & Kitchen',
    'Personal Care',
    'Food & Beverages',
    'Fashion',
    'Electronics',
    'Office Supplies',
    'Garden & Outdoors',
  ];

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('ecomart-cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    // Apply filters to mockProducts
    let filteredProducts = [...mockProducts];

    // Apply category filter
    if (filters.category) {
      filteredProducts = filteredProducts.filter(product => 
        product.category.toLowerCase() === filters.category.toLowerCase()
      );
    }

    // Apply eco rating filter
    if (filters.ecoRating > 0) {
      filteredProducts = filteredProducts.filter(product => 
        product.ecoRating >= filters.ecoRating
      );
    }

    // Apply recyclable filter
    if (filters.recyclable) {
      filteredProducts = filteredProducts.filter(product => 
        product.recyclable === true
      );
    }

    // Apply price range filters
    if (filters.minPrice) {
      const minPrice = parseFloat(filters.minPrice);
      filteredProducts = filteredProducts.filter(product => 
        product.price >= minPrice
      );
    }

    if (filters.maxPrice) {
      const maxPrice = parseFloat(filters.maxPrice);
      filteredProducts = filteredProducts.filter(product => 
        product.price <= maxPrice
      );
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredProducts = filteredProducts.filter(
        product => 
          product.name.toLowerCase().includes(query) || 
          product.description.toLowerCase().includes(query)
      );
    }

    setProducts(filteredProducts);
  }, [filters, searchQuery]);

  const handleAddToCart = (product: Product) => {
    setCart(prevCart => {
      const updatedCart = { 
        ...prevCart, 
        [product.id]: (prevCart[product.id] || 0) + 1 
      };
      
      // Save to localStorage
      localStorage.setItem('ecomart-cart', JSON.stringify(updatedCart));
      
      return updatedCart;
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prevCart => {
      const updatedCart = { ...prevCart };
      
      if (updatedCart[productId] > 1) {
        updatedCart[productId]--;
      } else {
        delete updatedCart[productId];
      }
      
      // Save to localStorage
      localStorage.setItem('ecomart-cart', JSON.stringify(updatedCart));
      
      return updatedCart;
    });
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((total, quantity) => total + quantity, 0);
  };

  const handleFilterChange = (key: string, value: string | number | boolean) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      ecoRating: 0,
      recyclable: false,
    });
    setSearchQuery('');
  };

  const handleCheckout = async () => {
    if (!user) {
      alert('Please login to proceed with checkout');
      return;
    }

    const cartItems = Object.keys(cart).map(productId => {
      const product = products.find(p => p.id === productId);
      return { 
        product, 
        quantity: cart[productId] 
      };
    }).filter(item => item.product !== undefined);

    const totalPrice = cartItems.reduce((total, item) => {
      return total + (item.product?.price || 0) * item.quantity;
    }, 0);

    try {
      // Initialize Razorpay
      const isRazorpayLoaded = await initializeRazorpay();
      if (!isRazorpayLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      // Create order in your database
      const orderRef = await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        items: cartItems.map(item => ({
          productId: item.product?.id,
          name: item.product?.name,
          price: item.product?.price,
          quantity: item.quantity,
          imageUrl: item.product?.imageUrl
        })),
        totalAmount: totalPrice,
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Generate a unique order ID
      const orderId = `order_${orderRef.id}_${Date.now()}`;

      // Initialize payment
      await makePayment(totalPrice, orderId, user);

      // Clear cart after successful payment
      setCart({});
      localStorage.removeItem('ecomart-cart');
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('Failed to process payment. Please try again.');
    }
  };

  // Filter panel component
  const FilterPanel = () => (
    <div 
      className={`${
        showFilters ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      } transition-transform duration-300 ease-in-out fixed md:sticky top-16 h-[calc(100vh-4rem)] md:h-auto overflow-auto bg-white md:bg-transparent shadow-lg md:shadow-none p-6 z-30 w-72 md:w-auto`}
    >
      <div className="md:hidden flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Filters</h3>
        <button 
          onClick={() => setShowFilters(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-6">
        {/* Category filter */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Category</h4>
          <select
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Price range */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Price Range</h4>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              fullWidth
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              fullWidth
            />
          </div>
        </div>

        {/* Eco Rating */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Eco Rating</h4>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                className={`p-2 rounded-md ${
                  filters.ecoRating >= rating
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
                onClick={() => handleFilterChange('ecoRating', rating)}
              >
                <Star
                  size={18}
                  fill={filters.ecoRating >= rating ? 'currentColor' : 'none'}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Recyclable checkbox */}
        <div>
          <div className="flex items-center">
            <input
              id="recyclable"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              checked={filters.recyclable}
              onChange={(e) => handleFilterChange('recyclable', e.target.checked)}
            />
            <label
              htmlFor="recyclable"
              className="ml-2 block text-sm text-gray-900"
            >
              Recyclable Products
            </label>
          </div>
        </div>

        {/* Clear filters */}
        <Button
          variant="outline"
          size="sm"
          fullWidth
          onClick={clearFilters}
          className="mt-4"
        >
          Clear Filters
        </Button>
      </div>
    </div>
  );

  // Cart sidebar component
  const CartSidebar = () => {
    const cartItems = Object.keys(cart).map(productId => {
      const product = products.find(p => p.id === productId);
      return { 
        product, 
        quantity: cart[productId] 
      };
    }).filter(item => item.product !== undefined);

    const totalPrice = cartItems.reduce((total, item) => {
      return total + (item.product?.price || 0) * item.quantity;
    }, 0);

    if (cartItems.length === 0) return null;

    return (
      <div className="bg-white border rounded-xl shadow-lg p-6">
        <h3 className="font-semibold text-xl mb-6 flex items-center">
          <ShoppingCart size={24} className="mr-2 text-primary-500" />
          Your Cart ({getTotalItems()} items)
        </h3>
        
        <div className="space-y-4 max-h-96 overflow-auto">
          {cartItems.map(({ product, quantity }) => product && (
            <div key={product.id} className="flex justify-between items-center py-3 border-b">
              <div className="flex items-center">
                <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 mr-4 overflow-hidden">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-gray-500 text-sm">₹{product.price.toFixed(2)} × {quantity}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => handleRemoveFromCart(product.id)} 
                  className="p-1.5 text-gray-500 hover:text-error-500 rounded-full hover:bg-gray-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="text-gray-900 font-medium">{quantity}</span>
                <button 
                  onClick={() => handleAddToCart(product)} 
                  className="p-1.5 text-gray-500 hover:text-primary-500 rounded-full hover:bg-gray-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t">
          <div className="flex justify-between mb-6">
            <span className="font-medium text-lg">Total:</span>
            <span className="font-bold text-xl">₹{totalPrice.toFixed(2)}</span>
          </div>
          <Button 
            fullWidth 
            onClick={handleCheckout}
            icon={<ShoppingBag size={20} />}
            className="shadow-md hover:shadow-lg transition-shadow duration-300"
          >
            Proceed to Checkout
          </Button>
        </div>
      </div>
    );
  };

  // Render placeholder products while loading
  const ProductPlaceholder = () => (
    <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
      <div className="w-full h-56 bg-gray-200"></div>
      <div className="p-5">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  // Sample placeholder products
  const placeholders = Array(8).fill(null).map((_, index) => (
    <ProductPlaceholder key={`placeholder-${index}`} />
  ));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Eco-Friendly Products</h1>
          <p className="text-gray-600 max-w-2xl">
            Shop our curated collection of sustainable and eco-friendly products. Every purchase contributes to a greener future.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap gap-4 items-center justify-between mb-8">
          <div className="relative w-full md:w-auto flex-grow max-w-md">
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={18} className="text-gray-500" />}
              fullWidth
            />
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Filter size={18} />}
              className="md:hidden"
              onClick={() => setShowFilters(true)}
            >
              Filters
            </Button>
            <select
              className="rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              onChange={(e) => {
                const value = e.target.value;
                const [field, direction] = value.split('-');
              }}
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="ecoRating-desc">Eco Rating</option>
            </select>
          </div>
        </div>

        {/* Overlay for mobile filter panel */}
        {showFilters && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-30 z-20"
            onClick={() => setShowFilters(false)}
          ></div>
        )}

        {/* Main Content */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filter Panel */}
          <div className="md:w-64 flex-shrink-0">
            <FilterPanel />
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {error && (
              <div className="bg-error-50 text-error-700 p-4 rounded-md mb-6">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {loading ? placeholders : (
                products.length === 0 ? (
                  <div className="col-span-full text-center py-16">
                    <p className="text-gray-500">No products found matching your criteria.</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={clearFilters}
                    >
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  products.map((product) => (
                    <div 
                      key={product.id} 
                      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full"
                    >
                      <div className="relative h-80 bg-gray-100 overflow-hidden group">
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                        />
                        {product.recyclable && (
                          <div className="absolute top-3 right-3 bg-success-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                            Recyclable
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={16}
                                className={i < product.ecoRating ? 'text-warning-500' : 'text-gray-300'}
                                fill={i < product.ecoRating ? 'currentColor' : 'none'}
                              />
                            ))}
                            <span className="ml-1 text-xs text-white">Eco Rating</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-8 flex flex-col flex-grow">
                        <h3 className="font-semibold text-xl text-gray-900 mb-3 line-clamp-1">{product.name}</h3>
                        <p className="text-gray-600 text-base mb-6 line-clamp-2 flex-grow">{product.description}</p>
                        
                        <div className="mb-6">
                          <div className="flex flex-wrap gap-2">
                            {product.sustainabilityFeatures.map((feature, index) => (
                              <span 
                                key={index}
                                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-primary-50 text-primary-700"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mt-auto pt-6 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-2xl text-gray-900">₹{product.price.toFixed(2)}</span>
                              <span className="text-sm text-gray-500 ml-2">({product.stockQuantity} in stock)</span>
                            </div>
                            <Button
                              size="md"
                              variant={cart[product.id] ? 'secondary' : 'primary'}
                              icon={<ShoppingCart size={18} />}
                              onClick={() => handleAddToCart(product)}
                              className="shadow-md hover:shadow-lg transition-shadow duration-300"
                            >
                              {cart[product.id] ? `Add More (${cart[product.id]})` : 'Add to Cart'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>

          {/* Cart Sidebar */}
          <div className="md:w-80 flex-shrink-0">
            <div className="md:sticky md:top-24">
              <CartSidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;