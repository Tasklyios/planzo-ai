import React from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface MobileMenuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout?: () => void;
  activeTab?: 'input' | 'ideas';
  setActiveTab?: React.Dispatch<React.SetStateAction<'input' | 'ideas'>>;
  hasIdeas?: boolean;
  children?: React.ReactNode;
}

const MobileMenuDialog = ({ 
  open, 
  onOpenChange, 
  onLogout,
  activeTab,
  setActiveTab,
  hasIdeas = false,
  children
}: MobileMenuDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-screen w-screen sm:max-w-[300px] p-0">
        <div className="flex flex-col h-full bg-white">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Menu</h2>
          </div>
          
          {children ? (
            <div className="flex-1 overflow-auto p-4">
              {children}
            </div>
          ) : (
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
                
                {/* Add tab switching if hasIdeas is true */}
                {hasIdeas && setActiveTab && (
                  <div className="mt-4 border-t pt-4">
                    <h3 className="text-sm font-medium mb-2">Idea Generator</h3>
                    <div className="flex flex-col space-y-2">
                      <Button
                        variant={activeTab === 'input' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setActiveTab('input');
                          onOpenChange(false);
                        }}
                      >
                        Input Form
                      </Button>
                      <Button
                        variant={activeTab === 'ideas' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setActiveTab('ideas');
                          onOpenChange(false);
                        }}
                      >
                        View Ideas
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {onLogout && (
            <div className="border-t p-4">
              <Button onClick={onLogout} className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MobileMenuDialog;
