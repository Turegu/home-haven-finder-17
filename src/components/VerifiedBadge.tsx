import { BadgeCheck } from "lucide-react";
import {
import { useTranslation } from "react-i18next";
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VerifiedBadgeProps {
  size?: "sm" | "md";
}

const VerifiedBadge = ({ size = "md" }: VerifiedBadgeProps) => {
  const { t } = useTranslation();
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <BadgeCheck className={`${iconSize} text-blue-500 shrink-0 cursor-help`} />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px] text-center">
          <p className="text-xs">{t("common.verified")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default VerifiedBadge;
