"use client";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { usePathname } from "next/navigation";
import toast from "react-hot-toast";

const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    const playBeep = (freq, startTime, duration) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(1, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const now = audioCtx.currentTime;
    // Energetic rapid triple-beep for delivery boy
    playBeep(1200, now, 0.2);
    playBeep(1200, now + 0.15, 0.2);
    playBeep(1500, now + 0.3, 0.4);
  } catch (err) {
    console.error("Audio playback failed", err);
  }
};

export default function NotificationListener() {
  const [permission, setPermission] = useState("default");
  const pathname = usePathname();

  useEffect(() => {
    // 1. Request Browser Notification Permission
    if ("Notification" in window) {
      Notification.requestPermission().then((status) => {
        setPermission(status);
      });
    }
  }, []);

  useEffect(() => {
    // Only connect if we are logged in
    if (pathname === "/login") return;
    
    const storedUser = localStorage.getItem("delivery_user");
    if (!storedUser) return;
    
    const user = JSON.parse(storedUser);
    const myDeliveryBoyId = user.id || user._id;

    // --- Web Push Subscription Logic ---
    const urlB64ToUint8Array = (base64String) => {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    };

    const subscribeToPush = async (registration) => {
      try {
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlB64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
          });
        }
        if (subscription) {
          const subObj = JSON.parse(JSON.stringify(subscription));
          subObj.role = 'delivery';
          subObj.userId = myDeliveryBoyId;
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.lalbaugrotihouse.com"}/api/v1/push/subscribe`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(subObj),
          });
          console.log("Push subscription sent to backend for Delivery Boy.");
        }
      } catch (error) {
        console.error("Failed to subscribe to push", error);
      }
    };

    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.register("/sw.js").then((registration) => {
        if (Notification.permission === "granted") {
          subscribeToPush(registration);
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission().then((status) => {
            if (status === "granted") subscribeToPush(registration);
          });
        }
      });
    }
    // -----------------------------------

    // 2. Connect to Socket.io backend
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.lalbaugrotihouse.com";
    const socket = io(socketUrl);

    socket.on("connect", () => {
      console.log("Connected to Real-Time Notifications Server!");
    });

    socket.on("new_assignment", (data) => {
      // ONLY trigger if this order was assigned to ME!
      if (data.deliveryBoyId !== myDeliveryBoyId) return;

      console.log("New order assigned to me:", data);
      
      // 1. Play Loud Bell Sound
      playNotificationSound();

      // 2. Show Beautiful In-App Toast
      toast((t) => (
        <div className="flex items-center gap-4 min-w-[280px]">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-orange-100">
            <span className="text-2xl">🛵</span>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-wide text-white">New Order Assigned!</span>
            <span className="text-[#FFECC9] font-medium text-sm">Order #{data.orderNumber} • ₹{data.amount}</span>
          </div>
        </div>
      ), { duration: 10000 });

      // Trigger automatic data refresh on the active page
      window.dispatchEvent(new CustomEvent("refresh_orders", { detail: data }));

      // 3. Native OS Notification
      if (Notification.permission === "granted") {
        const notification = new Notification("🛵 New Order Assigned!", {
          body: `Order ${data.orderNumber} for ₹${data.amount} has been assigned to you.`,
        });

        // Click to open app
        notification.onclick = () => {
          window.focus();
          window.location.href = "/";
        };
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [pathname]);

  return null;
}
