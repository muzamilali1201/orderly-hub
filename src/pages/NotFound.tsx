import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0)`,
        backgroundSize: '40px 40px',
        opacity: 0.5,
      }} />
      
      {/* Glow Effects */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-destructive/10 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />

      <div className="relative text-center space-y-6 animate-slide-up">
        <div className="space-y-2">
          <h1 className="text-8xl font-bold gradient-text">404</h1>
          <p className="text-xl text-muted-foreground">
            Oops! The page you're looking for doesn't exist.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          <Button variant="hero" asChild>
            <Link to="/">
              <Home className="w-4 h-4" />
              Return Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
