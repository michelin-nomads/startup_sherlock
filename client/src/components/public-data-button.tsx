import { Button } from "@/components/ui/button";
import { Globe, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { getApiUrl } from "@/lib/config";
import { authenticatedFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface PublicDataButtonProps {
  startupId: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
}

/**
 * Button to conduct public source due diligence and navigate to results
 * Can be added to any page that has access to a startupId
 */
export function PublicDataButton({ 
  startupId, 
  variant = "default", 
  size = "default",
  className = ""
}: PublicDataButtonProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);

      // First, try to get existing due diligence
      const getResponse = await authenticatedFetch(getApiUrl(`api/due-diligence/${startupId}`));
      
      if (getResponse.ok) {
        // Data exists, navigate directly
        navigate(`/public-data-analysis/${startupId}`);
        return;
      }

      // If no data exists (404), conduct new due diligence
      if (getResponse.status === 404) {
        toast({
          title: "Conducting Research",
          description: "Gathering data from public sources. This may take 30-60 seconds...",
        });

        const postResponse = await authenticatedFetch(getApiUrl(`api/due-diligence/${startupId}`), {
          method: 'POST',
        });

        if (!postResponse.ok) {
          throw new Error('Failed to conduct due diligence');
        }

        toast({
          title: "Research Complete",
          description: "Public source analysis is ready!",
        });

        // Navigate to results
        navigate(`/public-data-analysis/${startupId}`);
      } else {
        throw new Error('Failed to fetch due diligence data');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load public data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleClick} 
      disabled={loading}
      variant={variant}
      size={size}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Researching...
        </>
      ) : (
        <>
          <Globe className="mr-2 h-4 w-4" />
          View Public Data
        </>
      )}
    </Button>
  );
}

