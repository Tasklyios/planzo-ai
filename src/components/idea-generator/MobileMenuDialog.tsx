
import React from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface MobileMenuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout: () => void;
}

const MobileMenuDialog = ({ open, onOpenChange, onLogout }: MobileMenuDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-screen w-screen sm:max-w-[300px] p-0">
        <div className="flex flex-col h-full bg-white">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Menu</h2>
          </div>
          <div className="flex-1 overflow-auto py-4">
            <div className="space-y-3 px-4">
              <Link 
                to="/dashboard" 
                className="block py-2 text-gray-600 hover:text-[#4F92FF]"
                onClick={() => onOpenChange(false)}
              >
                Dashboard
              </Link>
              <Link 
                to="/ideas" 
                className="block py-2 text-gray-600 hover:text-[#4F92FF]"
                onClick={() => onOpenChange(false)}
              >
                Ideas
              </Link>
              <Link 
                to="/calendar" 
                className="block py-2 text-gray-600 hover:text-[#4F92FF]"
                onClick={() => onOpenChange(false)}
              >
                Calendar
              </Link>
            </div>
          </div>
          <div className="border-t p-4">
            <Button onClick={onLogout} className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MobileMenuDialog;
