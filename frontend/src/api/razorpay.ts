import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

export const createRazorpayOrder = async (data: {
  amount: number;
  currency: string;
  receipt: string;
  userId: string;
  email: string;
}) => {
  try {
    const createOrder = httpsCallable(functions, 'createRazorpayOrder');
    const result = await createOrder(data);
    return result.data;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
}; 