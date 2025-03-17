
import { Link } from "react-router-dom";

const AccountFooter = () => {
  return (
    <footer className="mt-12 pt-6 border-t border-border">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center py-4">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Planzo AI. All rights reserved.
            </p>
          </div>
          <div className="flex gap-6">
            <Link to="/privacy-policy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AccountFooter;
