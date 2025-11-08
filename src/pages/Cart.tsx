import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import saree1 from '@/assets/products/saree-1.jpg';
import saree2 from '@/assets/products/saree-2.jpg';
import saree3 from '@/assets/products/saree-3.jpg';
import saree4 from '@/assets/products/saree-4.jpg';
import saree5 from '@/assets/products/saree-5.jpg';
import saree6 from '@/assets/products/saree-6.jpg';
import saree7 from '@/assets/products/saree-7.jpg';
import saree8 from '@/assets/products/saree-8.jpg';
import saree9 from '@/assets/products/saree-9.jpg';
import saree10 from '@/assets/products/saree-10.jpg';
import saree11 from '@/assets/products/saree-11.jpg';
import saree12 from '@/assets/products/saree-12.jpg';

const productImages = [saree1, saree2, saree3, saree4, saree5, saree6, saree7, saree8, saree9, saree10, saree11, saree12];

export default function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cartItems, isLoading } = useQuery({
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

  const updateQuantity = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
    },
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cart_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
      toast.success('Item removed from cart');
    },
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-4">Please sign in to view your cart</h2>
        <Button onClick={() => navigate('/signin')}>Sign In</Button>
      </div>
    );
  }

  if (isLoading) {
    return <div className="container mx-auto px-4 py-16 text-center">Loading...</div>;
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <Button onClick={() => navigate('/products')}>Continue Shopping</Button>
      </div>
    );
  }

  const total = cartItems.reduce((sum, item) => sum + (item.products?.price || 0) * item.quantity, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item, index) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <img
                    src={productImages[index % productImages.length]}
                    alt={item.products?.name}
                    className="h-24 w-24 rounded object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.products?.name}</h3>
                    <p className="text-xl font-bold text-primary mt-2">₹{item.products?.price}</p>
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            if (item.quantity > 1) {
                              updateQuantity.mutate({ id: item.id, quantity: item.quantity - 1 });
                            }
                          }}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => updateQuantity.mutate({ id: item.id, quantity: item.quantity + 1 })}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeItem.mutate(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-primary">Free</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              </div>
              <Button className="w-full" onClick={() => navigate('/payment')}>
                Proceed to Payment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
