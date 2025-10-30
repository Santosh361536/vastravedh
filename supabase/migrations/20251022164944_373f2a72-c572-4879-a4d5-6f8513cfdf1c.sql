-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT NOT NULL,
  category TEXT DEFAULT 'powerloom',
  stock INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on products (public read)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (true);

-- Create cart_items table
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS on cart_items
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cart"
  ON public.cart_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to own cart"
  ON public.cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart"
  ON public.cart_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from own cart"
  ON public.cart_items FOR DELETE
  USING (auth.uid() = user_id);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  delivery_status TEXT DEFAULT 'ordered',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Create customizations table
CREATE TABLE public.customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  color TEXT,
  fabric TEXT,
  design_preference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on customizations
ALTER TABLE public.customizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own customizations"
  ON public.customizations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create customizations"
  ON public.customizations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Insert sample products
INSERT INTO public.products (name, description, price, image_url) VALUES
  ('Royal Maroon Powerloom Saree', 'Elegant maroon saree with intricate gold border, perfect for special occasions', 2499.00, '/placeholder.svg'),
  ('Classic Red Silk Saree', 'Traditional red silk saree with beautiful gold zari work', 3299.00, '/placeholder.svg'),
  ('Ocean Blue Powerloom Saree', 'Stunning blue saree with silver embellishments', 2799.00, '/placeholder.svg'),
  ('Emerald Green Elegance', 'Rich green saree with traditional motifs', 2999.00, '/placeholder.svg'),
  ('Golden Shimmer Saree', 'Luxurious golden saree with delicate thread work', 3499.00, '/placeholder.svg'),
  ('Pink Blossom Saree', 'Soft pink saree with floral patterns', 2399.00, '/placeholder.svg'),
  ('Midnight Black Beauty', 'Sophisticated black saree with silver border', 2899.00, '/placeholder.svg'),
  ('Ivory Pearl Saree', 'Elegant ivory saree with pearl embellishments', 3199.00, '/placeholder.svg'),
  ('Sunset Orange Saree', 'Vibrant orange saree with traditional design', 2599.00, '/placeholder.svg'),
  ('Purple Majesty Saree', 'Regal purple saree with gold accents', 3099.00, '/placeholder.svg'),
  ('Turquoise Dream Saree', 'Beautiful turquoise saree with intricate work', 2699.00, '/placeholder.svg'),
  ('Crimson Rose Saree', 'Deep crimson saree with rose motifs', 2999.00, '/placeholder.svg');