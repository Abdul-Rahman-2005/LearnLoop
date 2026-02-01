import { WifiOff } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

export function OfflineBanner() {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-chart-4 text-chart-4-foreground px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
      <WifiOff className="h-4 w-4" />
      You're offline. Viewing cached content.
    </div>
  );
}
