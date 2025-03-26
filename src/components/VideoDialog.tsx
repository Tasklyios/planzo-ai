
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface VideoDialogProps {
  videoId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const VideoDialog = ({ videoId, isOpen, onOpenChange }: VideoDialogProps) => {
  const [mounted, setMounted] = useState(false);

  // Prevent hydration errors by only rendering on client
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-2 bg-pure-white border-2 border-gray-100 rounded-xl">
        <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-lg">
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title="Product Demo Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoDialog;
