import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

// Import product images
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

const productImages = [
  saree1, saree2, saree3, saree4, saree5, saree6,
  saree7, saree8, saree9, saree10, saree11, saree12
];

export default function Products() {
  const navigate = useNavigate();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold">Our Collection</h1>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(12)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-64 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Our Collection</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products?.map((product, index) => (
          <Card key={product.id} className="group overflow-hidden transition-all hover:shadow-lg">
            <CardHeader className="p-0">
              <div className="aspect-square overflow-hidden">
                <img
                  src={productImages[index]}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {product.description}
              </p>
              <p className="text-xl font-bold text-primary">₹{product.price}</p>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button
                className="w-full"
                onClick={() => navigate(`/product/${product.id}`, { state: { imageIndex: index } })}
              >
                View Details
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
