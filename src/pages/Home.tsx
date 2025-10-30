import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import heroImage from '@/assets/hero-saree.jpg';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section
        className="relative flex min-h-[80vh] items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70" />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="mb-4 text-5xl font-bold md:text-7xl">Vastra Vedhika</h1>
          <p className="mb-4 text-xl md:text-2xl max-w-2xl mx-auto">
            Discover the finest collection of handwoven powerloom sarees
          </p>
          <p className="mb-8 text-lg md:text-xl max-w-2xl mx-auto text-white/90">
            Celebrating tradition with timeless elegance and craftsmanship
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/products')}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            Shop Now
          </Button>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold">About Vastra Vedhika</h2>
          <p className="mb-8 text-lg text-muted-foreground leading-relaxed">
            Vastra Vedhika is your destination for authentic powerloom sarees that blend traditional 
            craftsmanship with modern elegance. Each saree in our collection is carefully curated to 
            bring you the finest quality fabrics, intricate designs, and vibrant colors. We take pride 
            in offering sarees that celebrate Indian heritage while meeting contemporary fashion standards.
          </p>
          <p className="mb-8 text-lg text-muted-foreground leading-relaxed">
            From festive occasions to daily wear, our diverse range ensures that every woman finds her 
            perfect saree. Experience the joy of draping tradition with Vastra Vedhika.
          </p>
          <Button variant="outline" size="lg" onClick={() => navigate('/contact')}>
            Contact Us
          </Button>
        </div>
      </section>
    </div>
  );
}
