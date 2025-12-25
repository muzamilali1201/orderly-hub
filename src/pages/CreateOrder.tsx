import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/FileUpload';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function CreateOrder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    orderName: '',
    amazonOrderNumber: '',
    buyerPaypal: '',
    comments: '',
  });
  const [screenshots, setScreenshots] = useState<File[]>([]);

  // Redirect admin users
  if (isAdmin) {
    navigate('/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: 'Order created successfully!',
      description: 'Your order has been submitted and is now being processed.',
    });

    setIsSubmitting(false);
    navigate('/orders');
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Create New Order</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Fill in the order details below
          </p>
        </div>
      </header>

      <main className="p-6 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8 animate-slide-up">
          {/* Order Information */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Order Information</h2>
                <p className="text-sm text-muted-foreground">Basic order details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="orderName">
                  Order Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="orderName"
                  name="orderName"
                  placeholder="e.g., MacBook Pro 16"
                  value={formData.orderName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amazonOrderNumber">
                  Amazon Order Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="amazonOrderNumber"
                  name="amazonOrderNumber"
                  placeholder="e.g., 114-2847391-9283746"
                  value={formData.amazonOrderNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="buyerPaypal">
                  Buyer PayPal <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="buyerPaypal"
                  name="buyerPaypal"
                  type="email"
                  placeholder="buyer@email.com"
                  value={formData.buyerPaypal}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="comments">Comments (Optional)</Label>
                <Textarea
                  id="comments"
                  name="comments"
                  placeholder="Add any additional notes or instructions..."
                  value={formData.comments}
                  onChange={handleChange}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </div>

          {/* Screenshots */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-primary"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Screenshots</h2>
                <p className="text-sm text-muted-foreground">
                  Upload order confirmation screenshots
                </p>
              </div>
            </div>

            <FileUpload
              files={screenshots}
              onFilesChange={setScreenshots}
              maxFiles={5}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="hero"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Order...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  Create Order
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
