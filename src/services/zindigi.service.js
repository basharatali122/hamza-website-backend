import axios from 'axios';
import crypto from 'crypto';

class ZindigiService {
  constructor() {
    this.baseURL = process.env.ZINDIGI_BASE_URL || 'https://api.zindigi.com';
    this.apiKey = process.env.ZINDIGI_API_KEY;
    this.apiSecret = process.env.ZINDIGI_API_SECRET;
    this.merchantId = process.env.ZINDIGI_MERCHANT_ID;
  }

  // Generate authentication token
  generateAuthToken() {
    const timestamp = Date.now();
    const signature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(`${this.apiKey}${timestamp}`)
      .digest('hex');
    
    return {
      'X-API-Key': this.apiKey,
      'X-Timestamp': timestamp,
      'X-Signature': signature
    };
  }

  // Account verification
  async verifyAccount(accountNumber, cnic) {
    try {
      const response = await axios.post(
        `${this.baseURL}/account/verification`,
        {
          merchant_id: this.merchantId,
          account_number: accountNumber,
          cnic: cnic
        },
        {
          headers: {
            ...this.generateAuthToken(),
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Zindigi account verification error:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Process payment
  async processPayment(paymentDetails) {
    try {
      const {
        amount,
        order_id,
        user_id,
        description,
        callback_url,
        card_details
      } = paymentDetails;
      
      const payload = {
        merchant_id: this.merchantId,
        amount: amount,
        currency: 'PKR',
        order_reference: `ORD-${order_id}-${user_id}`,
        description: description || `Payment for order #${order_id}`,
        callback_url: callback_url || `${process.env.FRONTEND_URL}/payment/callback`,
        card_number: card_details?.card_number,
        card_expiry: card_details?.expiry,
        card_cvv: card_details?.cvv,
        card_holder_name: card_details?.holder_name
      };
      
      const response = await axios.post(
        `${this.baseURL}/payment/process`,
        payload,
        {
          headers: {
            ...this.generateAuthToken(),
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        success: true,
        transaction_id: response.data.transaction_id,
        status: response.data.status,
        data: response.data
      };
      
    } catch (error) {
      console.error('Zindigi payment processing error:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Initiate payment (redirect flow)
  async initiatePayment(paymentDetails) {
    try {
      const {
        amount,
        order_id,
        user_id,
        description,
        callback_url
      } = paymentDetails;
      
      const response = await axios.post(
        `${this.baseURL}/payment/initiate`,
        {
          merchant_id: this.merchantId,
          amount: amount,
          currency: 'PKR',
          order_reference: `ORD-${order_id}-${user_id}`,
          description: description || `Payment for order #${order_id}`,
          return_url: callback_url || `${process.env.FRONTEND_URL}/payment/success`,
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`
        },
        {
          headers: {
            ...this.generateAuthToken(),
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        success: true,
        payment_url: response.data.payment_url,
        transaction_id: response.data.transaction_id,
        data: response.data
      };
      
    } catch (error) {
      console.error('Zindigi payment initiation error:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Verify payment status
  async verifyPayment(transactionId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/payment/verify/${transactionId}`,
        {
          headers: this.generateAuthToken()
        }
      );
      
      return {
        success: true,
        status: response.data.status,
        data: response.data
      };
      
    } catch (error) {
      console.error('Zindigi payment verification error:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Refund payment
  async refundPayment(transactionId, amount, reason) {
    try {
      const response = await axios.post(
        `${this.baseURL}/payment/refund`,
        {
          merchant_id: this.merchantId,
          transaction_id: transactionId,
          amount: amount,
          reason: reason
        },
        {
          headers: {
            ...this.generateAuthToken(),
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        success: true,
        refund_id: response.data.refund_id,
        data: response.data
      };
      
    } catch (error) {
      console.error('Zindigi refund error:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Get transaction details
  async getTransactionDetails(transactionId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/transaction/${transactionId}`,
        {
          headers: this.generateAuthToken()
        }
      );
      
      return {
        success: true,
        data: response.data
      };
      
    } catch (error) {
      console.error('Zindigi get transaction error:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Balance inquiry
  async balanceInquiry(accountNumber) {
    try {
      const response = await axios.post(
        `${this.baseURL}/account/balance`,
        {
          merchant_id: this.merchantId,
          account_number: accountNumber
        },
        {
          headers: {
            ...this.generateAuthToken(),
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        success: true,
        balance: response.data.balance,
        data: response.data
      };
      
    } catch (error) {
      console.error('Zindigi balance inquiry error:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }
}

// Export as default
export default new ZindigiService();