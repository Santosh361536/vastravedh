import ProtectedRoute from '@/components/ProtectedRoute'; // fix the path if different
import Products from '@/pages/Products'; // or wherever your Products file is
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import About from "./pages/About";
import Customize from "./pages/Customize";
import Cart from "./pages/Cart";
import Payment from "./pages/Payment";
import OrderConfirmation from "./pages/OrderConfirmation";
import MyOrders from "./pages/MyOrders";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
  path="/products"
  element={
    <ProtectedRoute>
      <Products />
    </ProtectedRoute>
  }
/>
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/about" element={<About />} />
            <Route path="/customize" element={<Customize />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
