import { useEffect } from "react";
import { initPushNotifications } from "@/utils/capacitorPlugins";
import { toast } from "sonner";

export function usePushNotifications(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    const setupNotifications = async () => {
      try {
        await initPushNotifications(userId);
        console.log("Push notifications initialized");
      } catch (error) {
        console.error("Failed to initialize push notifications:", error);
      }
    };

    setupNotifications();
  }, [userId]);
}
