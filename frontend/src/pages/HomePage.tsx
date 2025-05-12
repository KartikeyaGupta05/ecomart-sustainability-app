import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Recycle, Utensils, Trophy, ChevronRight } from 'lucide-react';
import Button from '../components/ui/Button';

const HomePage: React.FC = () => {
  const features = [
    {
      title: 'Shop Sustainably',
      description: 'Browse our curated collection of eco-friendly products that minimize environmental impact.',
      icon: <ShoppingBag size={24} className="text-primary-500" />,
      link: '/shop',
      buttonText: 'Shop Now',
    },
    {
      title: 'Recycle Waste',
      description: 'Schedule pickups for your recyclable waste and earn EcoPoints for your contribution.',
      icon: <Recycle size={24} className="text-primary-500" />,
      link: '/sell-waste',
      buttonText: 'Recycle Now',
    },
    {
      title: 'Donate Food',
      description: 'Reduce food waste by donating your surplus meals to those in need through our network.',
      icon: <Utensils size={24} className="text-primary-500" />,
      link: '/food-waste',
      buttonText: 'Donate Food',
    },
    {
      title: 'EcoPoints Rewards',
      description: 'Track your impact and compete on our leaderboard. Redeem EcoPoints for discounts and rewards.',
      icon: <Trophy size={24} className="text-primary-500" />,
      link: '/leaderboard',
      buttonText: 'View Leaderboard',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-900 to-primary-700 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative z-10">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0 md:pr-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight animate-fade-in">
                Shop Sustainably, <br /> Recycle Responsibly
              </h1>
              <p className="text-lg md:text-xl mb-8 text-gray-100 max-w-lg animate-slide-up">
                Join our community of eco-conscious consumers making a difference through sustainable shopping and responsible waste management.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/shop">
                  <Button size="lg" className="shadow-lg">
                    Shop Now
                  </Button>
                </Link>
                <Link to="/sell-waste">
                  <Button variant="outline" size="lg" className="bg-white bg-opacity-10 border-white">
                    Recycle Waste
                  </Button>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center md:justify-end">
              <div className="relative w-full max-w-md">
                <div className="absolute -top-6 -left-6 w-24 h-24 bg-secondary-500 rounded-full opacity-20"></div>
                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-accent-500 rounded-full opacity-20"></div>
                <div className="relative bg-white rounded-lg shadow-xl overflow-hidden p-6">
                  <div className="text-center mb-6">
                    <div className="inline-block p-3 bg-primary-100 rounded-full mb-4">
                      <Leaf className="h-8 w-8 text-primary-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Join EcoMart Today</h3>
                    <p className="text-gray-600 mt-2">Make a positive impact with every purchase</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center text-gray-700">
                      <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                      <span>Sustainable products</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                      <span>Easy waste recycling</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                      <span>Earn rewards for eco-actions</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                      <span>Reduce your carbon footprint</span>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Link to="/register">
                      <Button fullWidth>Create Free Account</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How EcoMart Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform connects eco-conscious consumers with sustainable products and services while making recycling and food waste reduction simple.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-white rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-lg hover:translate-y-[-4px]"
              >
                <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary-100 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <Link to={feature.link}>
                  <Button 
                    variant="ghost" 
                    className="text-primary-600 hover:text-primary-700"
                    icon={<ChevronRight size={16} />}
                    iconPosition="right"
                  >
                    {feature.buttonText}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="bg-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Our Environmental Impact</h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Together with our community, we're making measurable progress toward a more sustainable future.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="p-6">
              <div className="text-4xl md:text-5xl font-bold mb-2">2.5M</div>
              <div className="text-xl opacity-80">Products Sold</div>
            </div>
            <div className="p-6">
              <div className="text-4xl md:text-5xl font-bold mb-2">135K</div>
              <div className="text-xl opacity-80">Kg Waste Recycled</div>
            </div>
            <div className="p-6">
              <div className="text-4xl md:text-5xl font-bold mb-2">42K</div>
              <div className="text-xl opacity-80">Meals Rescued</div>
            </div>
            <div className="p-6">
              <div className="text-4xl md:text-5xl font-bold mb-2">75K</div>
              <div className="text-xl opacity-80">Active Members</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-xl p-8 md:p-10 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-primary-100 rounded-l-full transform translate-x-1/2 opacity-50"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
              <div className="md:w-2/3 mb-6 md:mb-0">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to start your sustainability journey?</h2>
                <p className="text-lg text-gray-600 max-w-2xl">
                  Join thousands of eco-conscious individuals making a difference with every purchase, waste recycling, and food donation.
                </p>
              </div>
              <div className="space-y-4 md:space-y-0 md:space-x-4 flex flex-col md:flex-row">
                <Link to="/register">
                  <Button size="lg">Join EcoMart</Button>
                </Link>
                <Link to="/about">
                  <Button variant="outline" size="lg">Learn More</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Adding missing components used in this file
const Leaf = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="lucide lucide-leaf"
  >
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

const CheckCircle = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="lucide lucide-check-circle"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export default HomePage;