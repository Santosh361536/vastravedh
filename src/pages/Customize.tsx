import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function Customize() {
  const { user } = useAuth();
  const [color, setColor] = useState('');
  const [fabric, setFabric] = useState('');
  const [design, setDesign] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to customize sarees');
      return;
    }
    const { error } = await supabase.from('customizations').insert({ user_id: user.id, color, fabric, design_preference: design, notes });
    if (error) toast.error('Failed to save customization');
    else {
      toast.success('Customization saved! We will contact you soon.');
      setColor(''); setFabric(''); setDesign(''); setNotes('');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader><CardTitle>Customize Your Saree</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Color</Label>
              <Select value={color} onValueChange={setColor} required>
                <SelectTrigger><SelectValue placeholder="Select color" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="red">Red</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="pink">Pink</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fabric</Label>
              <Select value={fabric} onValueChange={setFabric} required>
                <SelectTrigger><SelectValue placeholder="Select fabric" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="silk">Silk</SelectItem>
                  <SelectItem value="cotton">Cotton</SelectItem>
                  <SelectItem value="georgette">Georgette</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Design Preference</Label>
              <Select value={design} onValueChange={setDesign} required>
                <SelectTrigger><SelectValue placeholder="Select design" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="traditional">Traditional</SelectItem>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="floral">Floral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
            </div>
            <Button type="submit" className="w-full" disabled={!user}>
              {user ? 'Submit Customization' : 'Sign In to Customize'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
