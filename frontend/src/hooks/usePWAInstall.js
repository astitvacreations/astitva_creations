import { useState, useEffect } from 'react';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(() => window.deferredPWAInstallPrompt || null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);

  useEffect(() => {
    // Detect standalone mode
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // Detect iOS
    const userAgent = window.navigator.userAgent || '';
    const isIOSDevice = /iPhone|iPad|iPod/.test(userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredPWAInstallPrompt = e;
      setDeferredPrompt(e);
    };

    const handlePromptReady = () => {
      if (window.deferredPWAInstallPrompt) {
        setDeferredPrompt(window.deferredPWAInstallPrompt);
      }
    };

    const handleAppInstalled = () => {
      window.deferredPWAInstallPrompt = null;
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-ready', handlePromptReady);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-ready', handlePromptReady);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    const activePrompt = deferredPrompt || window.deferredPWAInstallPrompt;
    if (activePrompt) {
      activePrompt.prompt();
      const choiceResult = await activePrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        window.deferredPWAInstallPrompt = null;
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowDesktopGuide(true);
    }
  };

  const closeIOSGuide = () => {
    setShowIOSGuide(false);
  };

  const closeDesktopGuide = () => {
    setShowDesktopGuide(false);
  };

  // Visible whenever not in standalone mode
  const canInstall = !isStandalone;

  return {
    canInstall,
    isStandalone,
    isIOS,
    showIOSGuide,
    showDesktopGuide,
    installApp,
    closeIOSGuide,
    closeDesktopGuide
  };
}
