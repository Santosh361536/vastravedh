import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, Truck, Home as HomeIcon, ShoppingBag } from 'lucide-react';

export default function MyOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Please sign in to view your orders</h2>
        <Button onClick={() => navigate('/signin')}>Sign In</Button>
      </div>
    );
  }

  if (isLoading) {
    return <div className="container mx-auto px-4 py-16 text-center">Loading...</div>;
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-4">No orders yet</h2>
        <Button onClick={() => navigate('/products')}>Start Shopping</Button>
      </div>
    );
  }

  const steps = [
    { label: 'Ordered', icon: CheckCircle, status: 'ordered' },
    { label: 'Shipped', icon: Package, status: 'shipped' },
    { label: 'Out for Delivery', icon: Truck, status: 'out_for_delivery' },
    { label: 'Delivered', icon: HomeIcon, status: 'delivered' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>
      <div className="space-y-6">
        {orders.map((order) => {
          const currentStepIndex = steps.findIndex((step) => step.status === order.delivery_status);
          return (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">₹{order.total_amount}</p>
                    <p className="text-sm text-muted-foreground capitalize">{order.payment_status}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h3 className="font-semibold mb-4">Order Tracking</h3>
                  <div className="relative">
                    <div className="absolute top-5 left-0 right-0 h-1 bg-muted">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                      />
                    </div>
                    <div className="relative flex justify-between">
                      {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isCompleted = index <= currentStepIndex;
                        return (
                          <div key={step.status} className="flex flex-col items-center">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                                isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <p className={`text-xs text-center ${isCompleted ? 'font-semibold' : 'text-muted-foreground'}`}>
                              {step.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Items</h3>
                  <div className="space-y-2">
                    {order.order_items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <span>{item.products?.name} × {item.quantity}</span>
                        <span className="font-semibold">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
