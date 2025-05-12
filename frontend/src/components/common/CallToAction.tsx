import React from 'react';
import { ArrowRight } from 'lucide-react';

const CallToAction: React.FC = () => {
  return (
    <section className="bg-amber-600 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-amber-100 text-lg mb-8">
            Join our community of food donors and help reduce waste while supporting those in need.
            Every donation counts towards creating a more sustainable and caring community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary bg-white text-amber-600 hover:bg-gray-100 py-3 px-8 text-lg flex items-center justify-center">
              Start Donating
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
            <button className="btn-primary border-2 border-white text-white hover:bg-amber-700 py-3 px-8 text-lg">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction; 