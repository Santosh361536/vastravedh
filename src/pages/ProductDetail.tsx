import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
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

export default function ProductDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const imageIndex = location.state?.imageIndex || 0;

  const { data: product } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
  });

  const addToCart = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Please sign in');
      const { error } = await supabase.from('cart_items').upsert({
        user_id: user.id,
        product_id: id,
        quantity: 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
      toast.success('Added to cart!');
    },
    onError: (error: any) => {
      toast.error(error.message === 'Please sign in' ? 'Please sign in to add items to cart' : 'Failed to add to cart');
    },
  });

  if (!product) return <div className="container mx-auto p-8">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate('/products')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Products
      </Button>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-lg">
          <img src={productImages[imageIndex]} alt={product.name} className="h-full w-full object-cover" />
        </div>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-2xl font-bold text-primary">₹{product.price}</p>
          </div>
          <p className="text-muted-foreground">{product.description}</p>
          <div className="flex gap-4">
            <Button onClick={() => addToCart.mutate()} className="flex-1" disabled={!user}>
              {user ? 'Add to Cart' : 'Sign In to Add'}
            </Button>
            <Button onClick={() => { addToCart.mutate(); navigate('/cart'); }} className="flex-1" disabled={!user}>
              Buy Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
