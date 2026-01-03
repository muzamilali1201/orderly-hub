import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/FileUpload';
import { NotificationBell } from '@/components/NotificationBell';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSheets, Sheet } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CreateOrder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [formData, setFormData] = useState({
    orderName: '',
    amazonOrderNumber: '',
    buyerPaypal: '',
    buyerName: '',
    comments: '',
  });
  const [orderScreenshot, setOrderScreenshot] = useState<File | null>(null);
  const [productScreenshot, setProductScreenshot] = useState<File | null>(null);

  // Fetch sheets for dropdown
  const { data: sheetsData } = useQuery({
    queryKey: ['sheets'],
    queryFn: async () => {
      const res = await getSheets();
      return res.data.data;
    },
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // Require order screenshot
      if (!orderScreenshot) {
        toast({
          title: 'Please upload order screenshot',
          description: 'Order screenshot (OrderSS) is required.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      const form = new FormData();
      form.append('orderName', formData.orderName);
      form.append('amazonOrderNo', formData.amazonOrderNumber);
      form.append('buyerPaypal', formData.buyerPaypal);
      if (formData.buyerName) form.append('buyerName', formData.buyerName);
      if (formData.comments) form.append('comments', formData.comments);
      if (selectedSheet) form.append('sheetName', selectedSheet);

      // Attach screenshots
      form.append('OrderSS', orderScreenshot);
      if (productScreenshot) form.append('AmazonProductSS', productScreenshot);

      // Call API with upload progress
      const res = await import('@/lib/api').then((m) => m.createOrder(form, {
        onUploadProgress: (ev: ProgressEvent) => {
          if (ev.total) {
            setUploadProgress(Math.round((ev.loaded * 100) / ev.total));
          }
        }
      }));

      toast({
        title: 'Order created successfully!',
        description: 'Your order has been submitted and is now being processed.',
      });

      // refresh list
      queryClient.invalidateQueries({ queryKey: ['orders'] });

      setIsSubmitting(false);
      navigate('/orders');
    } catch (err) {
      const message = (err as any)?.response?.data?.message || (err as Error).message || 'Failed to create order';
      toast({
        title: 'Order creation failed',
        description: message,
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
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
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="-ml-2 md:ml-0 ml-8"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Back</span>
              </Button>

              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-foreground">Create New Order</h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block">
                  Fill in the order details below
                </p>
              </div>
            </div>
            <NotificationBell />
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 animate-slide-up">
          {/* Order Information */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-foreground">Order Information</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Basic order details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="orderName" className="text-sm">
                  Product Name <span className="text-destructive">*</span>
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
                <Label htmlFor="sheet" className="text-sm">Sheet (Optional)</Label>
                <Select value={selectedSheet} onValueChange={setSelectedSheet}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sheet..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sheetsData?.map((sheet: Sheet) => (
                      <SelectItem key={sheet._id} value={sheet.name}>
                        {sheet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amazonOrderNumber" className="text-sm">
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

              <div className="space-y-2">
                <Label htmlFor="buyerPaypal" className="text-sm">
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

              <div className="space-y-2">
                <Label htmlFor="buyerName" className="text-sm">Buyer Name</Label>
                <Input
                  id="buyerName"
                  name="buyerName"
                  placeholder="e.g., John Doe"
                  value={formData.buyerName}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="comments" className="text-sm">Comments (Optional)</Label>
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
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 sm:w-5 sm:h-5 text-primary"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-foreground">Screenshots</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Upload order & product screenshots
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="orderSS" className="text-sm">Order Screenshot <span className="text-destructive">*</span></Label>
                <FileUpload
                  files={orderScreenshot ? [orderScreenshot] : []}
                  onFilesChange={(files) => setOrderScreenshot(files[0] ?? null)}
                  maxFiles={1}
                />
              </div>

              <div>
                <Label htmlFor="productSS" className="text-sm">Amazon Product Screenshot (optional)</Label>
                <FileUpload
                  files={productScreenshot ? [productScreenshot] : []}
                  onFilesChange={(files) => setProductScreenshot(files[0] ?? null)}
                  maxFiles={1}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col gap-3">
            {uploadProgress > 0 && (
              <div className="w-full bg-muted/30 rounded overflow-hidden">
                <div className="h-2 bg-primary" style={{ width: `${uploadProgress}%`, transition: 'width 200ms' }} />
                <div className="text-xs text-muted-foreground mt-1">Uploading: {uploadProgress}%</div>
              </div>
            )}

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
          </div>
        </form>
      </main>
    </div>
  );
}
