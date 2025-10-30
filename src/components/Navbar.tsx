import { Link, useNavigate } from 'react-router-dom';
import { User, ShoppingCart, LogOut, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: cartCount } = useQuery({
    queryKey: ['cart-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from('cart_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      return count || 0;
    },
    enabled: !!user,
  });

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Vastra Vedhika" className="h-10 w-10" />
          <span className="text-xl font-bold text-primary">Vastra Vedhika</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/" className="text-sm font-medium transition-colors hover:text-primary">
            Home
          </Link>
          <Link to="/products" className="text-sm font-medium transition-colors hover:text-primary">
            Products
          </Link>
          <Link to="/about" className="text-sm font-medium transition-colors hover:text-primary">
            About Us
          </Link>
          <Link to="/customize" className="text-sm font-medium transition-colors hover:text-primary">
            Customize
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate('/cart')}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 text-xs">
                  {cartCount}
                </Badge>
              )}
            </Button>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/my-orders')}>
                  <Package className="mr-2 h-4 w-4" />
                  My Orders
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => navigate('/signin')}>Sign In</Button>
          )}
        </div>
      </div>
    </nav>
  );
}
