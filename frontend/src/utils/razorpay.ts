import { loadScript } from './loadScript';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_c7G4chBa5Iqwf6';

export const initializeRazorpay = async () => {
  try {
    const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
    if (!res) {
      throw new Error('Razorpay SDK failed to load');
    }
    return true;
  } catch (error) {
    console.error('Error loading Razorpay SDK:', error);
    return false;
  }
};

export const makePayment = async (amount: number, orderId: string, user: any) => {
  try {
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: amount * 100, // amount in smallest currency unit (paise)
      currency: 'INR',
      name: 'EcoShop',
      description: 'Payment for your eco-friendly products',
      order_id: orderId,
      handler: function (response: any) {
        console.log('Payment successful:', response);
        // Handle successful payment
        return response;
      },
      prefill: {
        name: user?.displayName || '',
        email: user?.email || '',
        contact: user?.phoneNumber || '',
      },
      theme: {
        color: '#10B981', // Green color matching your theme
      },
      modal: {
        ondismiss: function() {
          console.log('Payment modal closed');
        }
      }
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  } catch (error) {
    console.error('Error initializing payment:', error);
    throw error;
  }
}; 