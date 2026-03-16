import { Link } from "react-router-dom";
import { Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BankLoanBannerProps {
  className?: string;
}

const BankLoanBanner = ({ className = "" }: BankLoanBannerProps) => {
  return (
    <div className={`bg-primary/10 border border-primary/20 rounded-xl p-6 ${className}`}>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="flex items-center justify-center shrink-0">
          <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center">
            <Landmark className="h-10 w-10 text-primary" />
          </div>
        </div>
        <div className="text-center md:text-left flex-1">
          <h3 className="text-xl font-bold text-foreground mb-1">
            Buy your dream house
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Compare mortgage rates from leading banks for housing and real estate financing
          </p>
          <Link to="/mortgage-bank-loan">
            <Button className="gap-2">
              <Landmark className="h-4 w-4" />
              Click Personal Loan Rates
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BankLoanBanner;
