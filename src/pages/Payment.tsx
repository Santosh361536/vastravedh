import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { z } from 'zod';

const banks = [
  'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank',
  'Punjab National Bank', 'Bank of Baroda', 'Canara Bank', 'Union Bank of India', 'Bank of India'
];

const upiSchema = z.object({
  upiId: z.string().regex(/^[\w.-]+@[\w.-]+$/, 'Invalid UPI ID format'),
});
const cardSchema = z.object({
  cardNumber: z.string().regex(/^\d{16}$/, 'Card number must be 16 digits'),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Invalid expiry format (MM/YY)'),
  cvv: z.string().regex(/^\d{3}$/, 'CVV must be 3 digits'),
});

export default function Payment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();

  // Detect Buy Now state
  const buyNowState = location.state || {};
  const isBuyNow = buyNowState.buyNow;
  const buyNowProduct = buyNowState.product;
  const buyNowQuantity = buyNowState.quantity || 1;

  // Payment, contact, and bank states
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  // Query for cart items if not Buy Now
  const { data: cartItems } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      if (!user || isBuyNow) return [];
      const { data, error } = await supabase
        .from('cart_items')
        .select('*, products(*)')
        .eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user && !isBuyNow,
  });

  // Items to show/pay for
  const itemsForPayment = isBuyNow
    ? [{ ...buyNowProduct, quantity: buyNowQuantity }]
    : cartItems || [];

  const codPrepayment = 399;
  const total = itemsForPayment.reduce((sum, item) => sum + (item.price || item.products?.price || 0) * (item.quantity || 1), 0);

  const createOrder = useMutation({
    mutationFn: async () => {
      if (!user || !itemsForPayment || itemsForPayment.length === 0) {
        throw new Error('Cart is empty');
      }
      if (!address) throw new Error("Please enter your address");
      if (!phone) throw new Error("Please enter your phone number");

      // Validate payment method fields
      if (paymentMethod === 'upi') {
        upiSchema.parse({ upiId });
      } else if (paymentMethod === 'card') {
        cardSchema.parse({ cardNumber, expiry, cvv });
      } else if (paymentMethod === 'netbanking' && !selectedBank) {
        throw new Error('Please select a bank');
      }

      // 1. Create order record
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: total,
          payment_method: paymentMethod,
          payment_status: 'completed',
          delivery_status: 'ordered',
          address,
          phone
        })
        .select()
        .single();
      if (orderError) throw orderError;

      // 2. Ensure product IDs are valid
      const { data: productsInDb, error: prodErr } = await supabase.from('products').select('id');
      if (prodErr) throw prodErr;
      const validProductIds = productsInDb.map((p) => p.id);

      // Build order_items, only for valid product IDs
      const orderItems = itemsForPayment
        .map((item) => {
          const prodId = item.product_id || item.id;
          if (!validProductIds.includes(prodId)) {
            // Skip this item if product is invalid
            console.warn('Skipping invalid product_id:', prodId);
            return null;
          }
          return {
            order_id: order.id,
            product_id: prodId,
            quantity: item.quantity,
            price: item.price || item.products?.price || 0,
          };
        })
        .filter(Boolean); // Remove nulls

      if (orderItems.length === 0) throw new Error('No valid products found for this order');

      // 3. Insert order_items records
      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // 4. Clear cart (only if normal cart flow)
      if (!isBuyNow) {
        const { error: clearError } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id);
        if (clearError) throw clearError;
      }
      return order;
    },
    onSuccess: (order) => {
      toast.success('Order placed successfully!');
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
      navigate('/order-confirmation', { state: { orderId: order.id } });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || 'Failed to place order');
      }
    },
  });

  if (!user) {
    navigate('/signin');
    return null;
  }
  if (!isBuyNow && (!cartItems || cartItems.length === 0)) {
    navigate('/cart');
    return null;
  }
  if (isBuyNow && itemsForPayment.length === 0) {
    navigate('/products');
    return null;
  }

  const handlePayment = async () => {
    setLoading(true);
    try {
      await createOrder.mutateAsync();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Payment</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Details & Payment</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Address and Phone */}
              <div className="space-y-4 mb-6">
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="Enter your address"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
              {/* --- Payment Method Radios --- */}
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mb-6">
                <div className="space-y-6">
                  {/* UPI */}
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="upi" id="upi" />
                    <Label htmlFor="upi" className="flex-1 cursor-pointer">UPI (Google Pay / PhonePe)</Label>
                  </div>
                  {paymentMethod === 'upi' && (
                    <div className="ml-6 space-y-2">
                      <Label htmlFor="upiId">UPI ID</Label>
                      <Input
                        id="upiId"
                        placeholder="username@upi"
                        value={upiId}
                        onChange={e => setUpiId(e.target.value)}
                      />
                    </div>
                  )}
                  {/* Card */}
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex-1 cursor-pointer">Credit/Debit Card</Label>
                  </div>
                  {paymentMethod === 'card' && (
                    <div className="ml-6 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          placeholder="1234567812345678"
                          value={cardNumber}
                          onChange={e => setCardNumber(e.target.value.replace(/\s/g, ''))}
                          maxLength={16}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiry">Expiry (MM/YY)</Label>
                          <Input
                            id="expiry"
                            placeholder="12/25"
                            value={expiry}
                            onChange={e => setExpiry(e.target.value)}
                            maxLength={5}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            placeholder="123"
                            value={cvv}
                            onChange={e => setCvv(e.target.value)}
                            maxLength={3}
                            type="password"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Net Banking */}
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="netbanking" id="netbanking" />
                    <Label htmlFor="netbanking" className="flex-1 cursor-pointer">Net Banking</Label>
                  </div>
                  {paymentMethod === 'netbanking' && (
                    <div className="ml-6 space-y-2">
                      <Label htmlFor="bank">Select Bank</Label>
                      <Select value={selectedBank} onValueChange={setSelectedBank}>
                        <SelectTrigger id="bank">
                          <SelectValue placeholder="Choose your bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {banks.map((bank) => (
                            <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {/* COD */}
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex-1 cursor-pointer">
                      Cash on Delivery (₹{codPrepayment} prepayment required)
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>
        {/* --- Order Summary --- */}
        <div>
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                {itemsForPayment.map((item, i) =>
                  <div key={i + (item.id || item.product_id)} className="flex justify-between text-sm mb-1">
                    <span>
                      {item.products?.name || item.name} x <span className="font-bold">{item.quantity}</span>
                    </span>
                    <span>
                      ₹{(item.products?.price || item.price) * item.quantity}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex justify-between mt-4 font-semibold text-lg">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
              <Button className="w-full mt-4" onClick={handlePayment} disabled={loading}>
                {loading ? 'Processing...' : 'Pay Now'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
