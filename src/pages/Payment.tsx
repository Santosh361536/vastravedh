import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: cartItems } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('cart_items')
        .select('*, products(*)')
        .eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createOrder = useMutation({
    mutationFn: async () => {
      if (!user || !cartItems || cartItems.length === 0) {
        throw new Error('Cart is empty');
      }

      // Validate payment method
      if (paymentMethod === 'upi') {
        upiSchema.parse({ upiId });
      } else if (paymentMethod === 'card') {
        cardSchema.parse({ cardNumber, expiry, cvv });
      } else if (paymentMethod === 'netbanking' && !selectedBank) {
        throw new Error('Please select a bank');
      }

      const total = cartItems.reduce((sum, item) => sum + (item.products?.price || 0) * item.quantity, 0);

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: total,
          payment_method: paymentMethod,
          payment_status: 'completed',
          delivery_status: 'ordered',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.products?.price || 0,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // Clear cart
      const { error: clearError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);
      if (clearError) throw clearError;

      return order;
    },
    onSuccess: (order) => {
      toast.success('Order placed successfully!');
      navigate('/order-confirmation', { state: { orderId: order.id } });
    },
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

  if (!cartItems || cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  const total = cartItems.reduce((sum, item) => sum + (item.products?.price || 0) * item.quantity, 0);
  const codPrepayment = 399;

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
              <CardTitle>Select Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="space-y-6">
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
                        onChange={(e) => setUpiId(e.target.value)}
                      />
                    </div>
                  )}

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
                          placeholder="1234 5678 9012 3456"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, ''))}
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
                            onChange={(e) => setExpiry(e.target.value)}
                            maxLength={5}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            placeholder="123"
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value)}
                            maxLength={3}
                            type="password"
                          />
                        </div>
                      </div>
                    </div>
                  )}

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
                            <SelectItem key={bank} value={bank}>
                              {bank}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex-1 cursor-pointer">
                      Cash on Delivery (₹{codPrepayment} prepayment required)
                    </Label>
                  </div>
                  {paymentMethod === 'cod' && (
                    <div className="ml-6 space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Please pay ₹{codPrepayment} now. Remaining amount to be paid on delivery.
                      </p>
                      <RadioGroup defaultValue="upi">
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="upi" id="cod-upi" />
                              <Label htmlFor="cod-upi">UPI</Label>
                            </div>
                            <div className="ml-6 mt-2">
                              <Input placeholder="username@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
                            </div>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{total}</span>
                </div>
                {paymentMethod === 'cod' && (
                  <>
                    <div className="flex justify-between text-primary">
                      <span>Pay Now</span>
                      <span>₹{codPrepayment}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Pay on Delivery</span>
                      <span>₹{total - codPrepayment}</span>
                    </div>
                  </>
                )}
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{paymentMethod === 'cod' ? codPrepayment : total}</span>
                </div>
              </div>
              <Button className="w-full" onClick={handlePayment} disabled={loading}>
                {loading ? 'Processing...' : 'Pay Now'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
