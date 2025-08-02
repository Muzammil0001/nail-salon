
  let initialized = false;
  
  export function initOneSignal() {
    if (typeof window === "undefined" || initialized) return;
  
    window.OneSignal = window.OneSignal || [];
  
    window.OneSignal.push(() => {
      console.log("OneSignal init started");
  
      window.OneSignal.init({
        appId: process.env.ONESIGNAL_APP_ID,
        notifyButton: { enable: true },
        allowLocalhostAsSecureOrigin: true,
      });
  
      window.OneSignal.isPushNotificationsEnabled().then((isEnabled: boolean) => {
        console.log("Push notifications enabled?", isEnabled);
  
        if (!isEnabled) {
          console.log("Prompting user for notification permission");
          window.OneSignal.showNativePrompt();
        }
      });
  
      if (typeof window.OneSignal.on === "function") {
        window.OneSignal.on("subscriptionChange", async (isSubscribed: boolean) => {
          console.log("Subscription changed:", isSubscribed);
          if (isSubscribed) {
            const playerId = await window.OneSignal.getUserId();
            console.log("Player ID on subscriptionChange:", playerId);
  
            if (playerId) {
              await fetch("/api/sendnotification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  playerId,
                  message: "Hello from OneSignal and Next.js!",
                }),
              });
            }
          }
        });
      } else {
        console.warn("OneSignal.on is not a function");
      }
    });
  
    initialized = true;
  }
  