import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Razorpay from 'razorpay';

admin.initializeApp();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_c7G4chBa5Iqwf6',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_key_secret'
});

export const createRazorpayOrder = functions.https.onCall(async (data, context) => {
  try {
    // Verify user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to create an order'
      );
    }

    const { amount, currency, receipt, userId, email } = data;

    // Validate required fields
    if (!amount || !currency || !receipt || !userId || !email) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields'
      );
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt,
      notes: {
        userId,
        email
      }
    });

    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to create order'
    );
  }
}); 