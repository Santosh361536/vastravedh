import { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Package, Truck, Home as HomeIcon } from 'lucide-react';

export default function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = location.state?.orderId;

  useEffect(() => {
    if (!orderId) {
      navigate('/');
    }
  }, [orderId, navigate]);

  const { data: order } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*))')
        .eq('id', orderId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

  if (!order) {
    return <div className="container mx-auto px-4 py-16 text-center">Loading...</div>;
  }

  const steps = [
    { label: 'Ordered', icon: CheckCircle, status: 'ordered' },
    { label: 'Shipped', icon: Package, status: 'shipped' },
    { label: 'Out for Delivery', icon: Truck, status: 'out_for_delivery' },
    { label: 'Delivered', icon: HomeIcon, status: 'delivered' },
  ];

  const currentStepIndex = steps.findIndex((step) => step.status === order.delivery_status);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <CheckCircle className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
        <p className="text-muted-foreground">Thank you for your purchase</p>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">Order ID</p>
            <p className="font-mono font-semibold text-lg">{order.id}</p>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Order Tracking</h2>
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
            <h2 className="text-xl font-bold mb-4">Order Details</h2>
            <div className="space-y-4">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{item.products?.name}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">₹{item.price * item.quantity}</p>
                </div>
              ))}
              <div className="border-t pt-4 flex justify-between font-bold text-lg">
                <span>Total Paid</span>
                <span>₹{order.total_amount}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button asChild className="flex-1">
          <Link to="/my-orders">View All Orders</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link to="/products">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}
