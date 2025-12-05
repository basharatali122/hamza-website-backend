import zindigiService from '../services/zindigi.service.js';
import Transaction from '../models/Transaction.js';
import Orders from '../models/Orders.js';
import Payment from '../models/Payment.js';

class PaymentController {
  
  // Initiate payment
  async initiatePayment(req, res) {
    try {
      const { order_id, amount } = req.body;
      const userId = req.user.id;
      
      // Verify order exists and belongs to user
      const order = await Orders.findOne({
        where: { id: order_id, user_id: userId }
      });
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
      
      // Initiate Zindigi payment
      const paymentResult = await zindigiService.initiatePayment({
        amount,
        order_id,
        user_id: userId,
        description: `Payment for order #${order_id}`,
        callback_url: `${process.env.FRONTEND_URL}/payment/callback`
      });
      
      if (!paymentResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to initiate payment',
          error: paymentResult.error
        });
      }
      
      return res.status(200).json({
        success: true,
        payment_url: paymentResult.payment_url,
        transaction_id: paymentResult.transaction_id
      });
      
    } catch (error) {
      console.error('Initiate payment error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to initiate payment'
      });
    }
  }

  // Handle payment callback
  async handlePaymentCallback(req, res) {
    try {
      const { transaction_id, status } = req.body;
      
      // Verify payment with Zindigi
      const verificationResult = await zindigiService.verifyPayment(transaction_id);
      
      if (!verificationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Payment verification failed'
        });
      }
      
      // Update transaction status
      await Transaction.update(
        { 
          status: verificationResult.status === 'success' ? 'completed' : 'failed',
          payment_gateway_response: verificationResult.data
        },
        { where: { zindigi_transaction_id: transaction_id } }
      );
      
      return res.status(200).json({
        success: true,
        status: verificationResult.status
      });
      
    } catch (error) {
      console.error('Payment callback error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process payment callback'
      });
    }
  }

  // Verify payment
  async verifyPayment(req, res) {
    try {
      const { transaction_id } = req.params;
      
      const result = await zindigiService.verifyPayment(transaction_id);
      
      return res.status(200).json(result);
      
    } catch (error) {
      console.error('Verify payment error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify payment'
      });
    }
  }
}

// Export as default
export default new PaymentController();