// =============================================================================
// ProfitPerPlate - Enhanced Direct Labor Editing Fix + MANUAL SAVE SYSTEM
// =============================================================================
// Fixed: Direct labor row editing now correctly preserves and selects labor items
// Added: Manual save system - saves only on Add/Edit/Delete actions
// Changes: 
// - Enhanced fn() to store laborId in dataset for stable identification
// - Rewrote wn() (editDirectLaborRow) with robust laborId-based selection
// - Centralized direct labor select handling with named event handler
// - Added backward compatibility for legacy rows without laborId
// - Implemented debug logging for testing labor editing flows
// - DISABLED auto-save system, enabled manual save on user actions
// =============================================================================

// =============================================================================
// PWA INSTALLATION FUNCTIONALITY
// =============================================================================

let deferredPrompt = null;
let isAppInstalled = false;

// Event listener for beforeinstallprompt
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('🎯 beforeinstallprompt event fired');
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  // Update UI to notify the user they can install the app
  updateInstallButtonVisibility();
});

// Event listener for appinstalled
window.addEventListener('appinstalled', () => {
  console.log('✅ App was installed');
  isAppInstalled = true;
  deferredPrompt = null;
  updateInstallButtonVisibility();
  
  // Show success notification
  if (typeof Wt === 'function') {
    Wt('App installed successfully!', 'success');
  }
});

// Check if app is already installed
function checkIfAppIsInstalled() {
  if (window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')) {
    isAppInstalled = true;
    console.log('📱 App is already installed');
  }
}

// Update install button visibility
function updateInstallButtonVisibility() {
  const installButton = document.getElementById('installAppButton');
  if (!installButton) return;
  
  if (isAppInstalled || !deferredPrompt) {
    installButton.style.display = 'none';
  } else {
    installButton.style.display = 'block';
  }
}

// Main install function
function installPWA() {
  if (!deferredPrompt) {
    console.warn('No install prompt available');
    if (typeof Wt === 'function') {
      Wt('App installation is not available or app is already installed.', 'warning');
    }
    return;
  }
  
  console.log('🚀 Triggering install prompt...');
  
  // Show the install prompt
  deferredPrompt.prompt();
  
  // Wait for the user to respond to the prompt
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('✅ User accepted the install prompt');
      if (typeof Wt === 'function') {
        Wt('Installing ProfitPerPlate app...', 'success');
      }
    } else {
      console.log('❌ User dismissed the install prompt');
      if (typeof Wt === 'function') {
        Wt('Installation cancelled. You can install later from the menu.', 'info');
      }
    }
    // Reset the deferred prompt variable
    deferredPrompt = null;
    updateInstallButtonVisibility();
  });
}

// Function to add install button to menu modal
function addInstallButtonToMenu(menuBody) {
  if (!menuBody) return;
  
  // Check if button already exists
  if (menuBody.querySelector('#installAppButton')) return;
  
  console.log('🔧 Adding Install App button to menu...');
  
  // Create install button
  const installButton = document.createElement('button');
  installButton.id = 'installAppButton';
  installButton.className = 'btn-primary'; // Same class as other buttons
  installButton.type = 'button';
  installButton.style.display = 'none'; // Hidden by default
  installButton.style.width = '100%';
  installButton.style.margin = '6px 0';
  installButton.style.boxSizing = 'border-box';
  
  // Add icon and text with same styling as other menu buttons
  installButton.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;">
      <path d="M21 10V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11"></path>
      <path d="M19 14v4"></path>
      <path d="M17 16h4"></path>
      <polyline points="12 15 9 12 12 9"></polyline>
      <line x1="9" y1="12" x2="17" y2="12"></line>
    </svg>
    Install App
  `;
  
  // Add click event
  installButton.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    installPWA();
    
    // Close menu after clicking install (optional)
    const menuModal = document.getElementById('menuModal');
    if (menuModal) {
      menuModal.classList.add('hidden');
      document.body.style.overflow = "";
      const menuButton = document.getElementById('settingsMenuButton');
      if (menuButton) {
        menuButton.setAttribute('aria-expanded', 'false');
      }
    }
  });
  
  // Add tooltip
  installButton.title = 'Install ProfitPerPlate as a standalone app for quick access';
  
  // Insert at a logical position in the menu (after currency selector)
  const currencySelect = menuBody.querySelector('#currencySelect');
  if (currencySelect && currencySelect.parentNode) {
    // Create a wrapper div for consistent styling
    const installWrapper = document.createElement('div');
    installWrapper.className = 'menu-install-section';
    installWrapper.style.padding = '12px 0';
    installWrapper.style.borderTop = '1px solid var(--border)';
    installWrapper.style.marginTop = '12px';
    
    // Add explanatory text
    const explanation = document.createElement('div');
    
    installWrapper.appendChild(explanation);
    installWrapper.appendChild(installButton);
    
    // Find a good position to insert (before the auth section)
    const authSection = menuBody.querySelector('.auth-buttons') || 
                       menuBody.querySelector('#loginBtn')?.parentNode;
    
    if (authSection && authSection.parentNode === menuBody) {
      menuBody.insertBefore(installWrapper, authSection);
    } else {
      menuBody.appendChild(installWrapper);
    }
  } else {
    // Fallback: just append to menu body
    menuBody.appendChild(installButton);
  }
  
  // Update visibility based on current state
  updateInstallButtonVisibility();
}

// =============================================================================
// ENHANCED iOS PWA DETECTION & INSTALLATION
// =============================================================================

// Enhanced iOS detection and installation handling
function detectIOS() {
    const ua = window.navigator.userAgent;
    const iOS = !!ua.match(/iPad|iPhone|iPod/);
    const webkit = !!ua.match(/WebKit/);
    const iOSSafari = iOS && webkit && !ua.match(/CriOS/);
    return {
        isIOS: iOS,
        isIOSSafari: iOSSafari,
        isIPad: ua.match(/iPad/) ? true : false,
        isIPhone: ua.match(/iPhone/) ? true : false
    };
}

// Show iOS installation instructions
function showIOSInstallInstructions() {
    const iosInfo = detectIOS();
    if (!iosInfo.isIOSSafari || isAppInstalled) return;
    
    // Create iOS installation modal
    const modal = document.createElement('div');
    modal.id = 'iosInstallModal';
    modal.className = 'modal hidden';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Install ProfitPerPlate on iOS</h3>
                <button class="close-btn" onclick="document.getElementById('iosInstallModal').classList.add('hidden')">×</button>
            </div>
            <div class="install-instructions">
                <p><strong>To install this app on your ${iosInfo.isIPad ? 'iPad' : 'iPhone'}:</strong></p>
                <ol>
                    <li>Tap the <strong>Share button</strong> <span style="font-size: 1.2em;">⎋</span> at the bottom of Safari</li>
                    <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                    <li>Tap <strong>"Add"</strong> in the top right corner</li>
                    <li>The app will appear on your home screen</li>
                </ol>
                <div class="install-tips">
                    <p><strong>💡 Tip:</strong> For best experience, use in standalone mode (after installation).</p>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn-secondary" onclick="document.getElementById('iosInstallModal').classList.add('hidden')">Close</button>
                <button class="btn-primary" onclick="showIOSShareSheet()">Show Share Button</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.classList.remove('hidden');
}

// Attempt to trigger iOS share sheet (limited functionality)
function showIOSShareSheet() {
    if (navigator.share) {
        navigator.share({
            title: 'ProfitPerPlate',
            text: 'Restaurant costing and profit calculation tool',
            url: window.location.href
        })
        .then(() => console.log('Shared successfully'))
        .catch(error => console.log('Error sharing:', error));
    } else {
        alert('Please use the Share button (⎋) in Safari\'s toolbar');
    }
}

// Enhanced iOS standalone detection
function checkIOSStandaloneMode() {
    // Check if in standalone mode on iOS
    const isStandalone = window.navigator.standalone || 
                        window.matchMedia('(display-mode: standalone)').matches;
    
    if (detectIOS().isIOS && isStandalone) {
        console.log('📱 Running in iOS standalone mode');
        // Apply iOS-specific adjustments
        document.documentElement.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top)');
        document.documentElement.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom)');
        return true;
    }
    return false;
}

// Enhanced device detection with orientation support
function detectDeviceWithOrientation() {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isAndroid = /Android/.test(ua);
    const isMobile = isIOS || isAndroid;
    
    // Check orientation
    const orientation = window.matchMedia("(orientation: portrait)");
    const isPortrait = orientation.matches;
    
    return {
        type: isIOS ? 'ios' : isAndroid ? 'android' : 'desktop',
        isMobile: isMobile,
        isIOS: isIOS,
        isAndroid: isAndroid,
        orientation: isPortrait ? 'portrait' : 'landscape',
        supportsOrientation: 'onorientationchange' in window
    };
}

// Initialize enhanced PWA functionality
function initializeEnhancedPWA() {
    console.log('🔧 Initializing enhanced PWA functionality...');
    
    // Check if app is already installed
    checkIfAppIsInstalled();
    
    // Check iOS standalone mode
    const isIOSStandalone = checkIOSStandaloneMode();
    
    // Register service worker with enhanced scope
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js', { 
                scope: '/' 
            })
            .then(registration => {
                console.log('✅ Service Worker registered with scope:', registration.scope);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('🔄 New service worker found:', newWorker.state);
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('🔄 New content available; please refresh.');
                            showUpdateNotification();
                        }
                    });
                });
            })
            .catch(error => {
                console.warn('⚠️ Service Worker registration failed:', error);
            });
        });
    }
    
    // Add CSS for iOS install modal
    if (!document.getElementById('iosInstallModalStyles')) {
        const style = document.createElement('style');
        style.id = 'iosInstallModalStyles';
        style.textContent = `
            .install-instructions {
                padding: 20px;
                max-height: 60vh;
                overflow-y: auto;
            }
            .install-instructions ol {
                padding-left: 20px;
                margin: 15px 0;
            }
            .install-instructions li {
                margin-bottom: 10px;
                line-height: 1.6;
                font-size: 16px;
            }
            .install-tips {
                background: var(--primary-light);
                padding: 15px;
                border-radius: var(--radius-md);
                margin-top: 20px;
                border-left: 4px solid var(--primary);
            }
            .install-instructions strong {
                color: var(--primary);
            }
            /* iOS-specific adjustments */
            @supports (-webkit-touch-callout: none) {
                .modal-content {
                    padding-bottom: env(safe-area-inset-bottom);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add iOS install button to menu if needed
    setTimeout(() => {
        addiOSInstallButton();
    }, 2000);
}

// Add iOS install button to menu
function addiOSInstallButton() {
    const iosInfo = detectIOS();
    const menuBody = document.querySelector('#menuModal .menu-body');
    
    if (!menuBody || !iosInfo.isIOSSafari || isAppInstalled) return;
    
    // Check if button already exists
    if (menuBody.querySelector('#iosInstallButton')) return;
    
    const iosButton = document.createElement('button');
    iosButton.id = 'iosInstallButton';
    iosButton.className = 'btn-primary';
    iosButton.type = 'button';
    iosButton.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 8px;">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        Install on iOS
    `;
    
    iosButton.style.width = '100%';
    iosButton.style.margin = '6px 0';
    iosButton.style.boxSizing = 'border-box';
    iosButton.title = 'Get installation instructions for iOS';
    
    iosButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        showIOSInstallInstructions();
        
        // Close menu
        const menuModal = document.getElementById('menuModal');
        if (menuModal) {
            menuModal.classList.add('hidden');
            document.body.style.overflow = "";
        }
    });
    
    // Insert before the existing install button or at the end
    const existingInstallBtn = menuBody.querySelector('#installAppButton');
    if (existingInstallBtn && existingInstallBtn.parentNode) {
        menuBody.insertBefore(iosButton, existingInstallBtn);
    } else {
        menuBody.appendChild(iosButton);
    }
}

// Show update notification
function showUpdateNotification() {
    if (typeof Wt === 'function') {
        Wt('🔄 New version available! Refresh the page to update.', 'info', 10000);
    }
}

// Enhanced orientation handling
function setupOrientationHandling() {
    if ('onorientationchange' in window) {
        window.addEventListener('orientationchange', function() {
            console.log('🔄 Orientation changed to:', window.orientation);
            
            // Force resize event for responsive adjustments
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 300);
        });
    }
}

// Update the main initialization to use enhanced PWA
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        initializeEnhancedPWA(); // Replace initializePWA() with this
        setupOrientationHandling();
        
        const deviceInfo = detectDeviceWithOrientation();
        console.log(`🌍 Device detected: ${deviceInfo.type}, Orientation: ${deviceInfo.orientation}`);
        
        // Show installation hint for iOS users
        if (deviceInfo.isIOS && !isAppInstalled) {
            setTimeout(() => {
                if (typeof Wt === 'function') {
                    Wt('📱 Use "Add to Home Screen" for a full-screen app experience on iOS', 'info', 15000);
                }
                // Show iOS install button in menu
                addiOSInstallButton();
            }, 3000);
        }
        
        // Android specific orientation tips
        if (deviceInfo.isAndroid) {
            console.log('📱 Android device detected - enabling full orientation support');
            // Ensure viewport allows rotation
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                viewport.content = viewport.content.replace(/user-scalable=no/, 'user-scalable=yes');
            }
        }
    }, 1000);
});

// Replace the existing initializePWA() call with initializeEnhancedPWA()
// In the existing code, find and replace:
// initializePWA(); → initializeEnhancedPWA();

// =============================================================================
// DEVICE DETECTION FUNCTION
// =============================================================================

function detectDevice() {
    const ua = navigator.userAgent;
    
    // iOS detection
    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
        return 'ios';
    }
    
    // Android detection
    if (/Android/.test(ua)) {
        return 'android';
    }
    
    // Desktop detection
    return 'desktop';
}

// Initialize PWA functionality
function initializeEnhancedPWA() {
  console.log('🔧 Initializing PWA functionality...');
  
  // Check if app is already installed
  checkIfAppIsInstalled();
  
  // Register service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('✅ Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
          console.warn('⚠️ Service Worker registration failed:', error);
        });
    });
  }
// Add CSS for instructions modal
    if (!document.getElementById('installModalStyles')) {
        const style = document.createElement('style');
        style.id = 'installModalStyles';
        style.textContent = `
            .install-instructions {
                padding: 20px;
            }
            .install-instructions ol,
            .install-instructions ul {
                padding-left: 20px;
                margin: 15px 0;
            }
            .install-instructions li {
                margin-bottom: 10px;
                line-height: 1.6;
            }
            .install-instructions img {
                display: block;
                margin: 20px auto;
                max-width: 100px;
            }
            .install-tips {
                background: var(--primary-light);
                padding: 15px;
                border-radius: var(--radius-md);
                margin-top: 20px;
                border-left: 4px solid var(--primary);
            }
        `;
        document.head.appendChild(style);
    }
}



// Add this to your initialization sequence
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        initializeEnhancedPWA();
        deviceType = detectDevice();
        console.log(`🌍 Device detected: ${deviceType}`);
        
        // Show installation hint for iOS users
        if (deviceType === 'ios' && !isAppInstalled) {
            setTimeout(() => {
                if (typeof Wt === 'function') {
                    Wt('💡 Tip: Use "Add to Home Screen" for quick access on iOS', 'info', 10000);
                }
            }, 5000);
        }
    }, 1000);
});

// Enable cascade debug logging during development
window.CASCADE_DEBUG = true;



// =============================================================================
// CONTENT GATING - BLUR UI WHEN LOGGED OUT
// =============================================================================

// Add blur CSS styles
function addBlurStyles() {
    if (!document.getElementById('blur-ui-styles')) {
        const style = document.createElement('style');
        style.id = 'blur-ui-styles';
        style.textContent = `
            .ui-blurred {
                filter: blur(10px);
                opacity: 0.4;
                pointer-events: none;
                user-select: none;
            }
            
            /* Keep menu modal fully functional */
            #menuModal {
                filter: none !important;
                opacity: 1 !important;
                pointer-events: auto !important;
                user-select: auto !important;
                z-index: 1000 !important;
            }
            
            /* When forced open, prevent any closing */
            #menuModal.force-open {
                display: block !important;
                z-index: 1000 !important;
            }
            
            #menuModal.force-open::before {
                content: '';
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: -1;
            }
            
            /* Auth modal should always be on top */
            #authModal {
                z-index: 10000 !important;
            }
            
            /* Overlay for auth modal - ensures it's above everything */
            #authModal.modal {
                z-index: 10000 !important;
            }
            
            /* Make sure auth modal content is above menu modal */
            #authModal .modal-content {
                z-index: 10001 !important;
            }
        `;
        document.head.appendChild(style);
    }
}

// Blur only the main UI content (not modals)
function blurUI() {
    console.log("🔒 Blurring UI - user logged out");
    addBlurStyles();
    
    // Blur these specific areas (main UI content)
    const areasToBlur = [
        document.querySelector('.content-area'),      // Main content
        document.querySelector('.sidebar'),           // Sidebar
        document.querySelector('.ad-space'),          // Ad space
        document.querySelector('.header .left-group') // Header left (logo area)
    ].filter(Boolean);
    
    areasToBlur.forEach(area => {
        area.classList.add('ui-blurred');
    });
    
    // Disable interactive elements in blurred areas
    areasToBlur.forEach(area => {
        area.querySelectorAll('button, input, select, textarea, a').forEach(el => {
            el.style.pointerEvents = 'none';
            el.style.cursor = 'not-allowed';
        });
    });
}

// Remove blur from UI
function unblurUI() {
    console.log("✅ Unblurring UI - user logged in");
    
    // Remove blur from all areas
    document.querySelectorAll('.ui-blurred').forEach(el => {
        el.classList.remove('ui-blurred');
    });
    
    // Re-enable interactive elements
    document.querySelectorAll('button, input, select, textarea, a').forEach(el => {
        el.style.pointerEvents = '';
        el.style.cursor = '';
    });
}

// Force menu modal to stay open until login
// Force menu modal to stay open until login
function forceMenuModalOpen() {
    console.log("🚪 Forcing menu modal open and locking it");
    
    const menuModal = document.getElementById('menuModal');
    if (!menuModal) {
        console.error("Menu modal not found");
        return;
    }
    
    // Make sure menu modal is visible
    menuModal.classList.remove('hidden');
    
    // Add a class to indicate it's forced open
    menuModal.classList.add('force-open');
    
    // Hide the close button completely
    const closeBtn = menuModal.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.style.display = 'none';
    }
    
    // Disable the menu toggle button too
    const menuToggleBtn = document.getElementById('settingsMenuButton');
    if (menuToggleBtn) {
        menuToggleBtn.style.pointerEvents = 'none';
        menuToggleBtn.style.opacity = '0.5';
    }
    
    // Add message explaining login is required
    const menuBody = menuModal.querySelector('.menu-body');
    if (menuBody && !menuBody.querySelector('.login-required-note')) {
        const note = document.createElement('div');
        note.className = 'login-required-note';
        note.innerHTML = `
            <div style="
                background: primary;
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 16px;
                border-left: 4px solid #ff9800;
            ">
                <strong>🔐 Login Required</strong>
                <p style="margin: 8px 0 0 0; font-size: 14px;">
                    Please login or sign up to access the application.
                </p>
            </div>
        `;
        menuBody.insertBefore(note, menuBody.firstChild);
    }
}

// Allow menu modal to close normally
function allowMenuModalClose() {
    const menuModal = document.getElementById('menuModal');
    if (menuModal) {
        menuModal.classList.remove('force-open');
        
        const closeBtn = menuModal.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.style.display = '';
        }
        
        // Re-enable the menu toggle button
        const menuToggleBtn = document.getElementById('settingsMenuButton');
        if (menuToggleBtn) {
            menuToggleBtn.style.pointerEvents = '';
            menuToggleBtn.style.opacity = '';
        }
        
        // Remove login required note
        const note = menuModal.querySelector('.login-required-note');
        if (note) {
            note.remove();
        }
    }
}

window.e = {  // Changed 'let e' to 'window.e'
    rawMaterials: [],
    directLabor: [],
    recipes: [],
    currency: "$",
    currentRecipeState: null
  };

var e = window.e; // Ensure e references window.e

  t = { type: null, id: null, data: null },
  n = null;
(window.currentEditingRow = null), (window.currentEditingLaborRow = null);
let o = null;

// Debug toggle for labor editing
window.DEBUG_LABOR_EDIT = false;

const a = {
    kg: 1e3, g: 1, mg: 0.001, lbs: 453.592, oz: 28.3495,
    L: 1e3, ml: 1, cup: 236.588, tbsp: 14.7868, tsp: 4.92892,
    dozen: 12, pc: 1, hours: 60, minutes: 1
  },
  i = {
    weight: ["kg", "g", "mg", "lbs", "oz"],
    volume: ["L", "ml", "cup", "tbsp", "tsp"],
    count: ["dozen", "pc"],
    time: ["hours", "minutes"]
  },
  r = "g";

// =============================================================================
// TIMED RELOAD FUNCTION - ADD THIS
// =============================================================================

function initiateTimedReload() {
    console.log("🔄 Initiating timed reload in 2000ms...");
    
    // Show loading state if available
    if (typeof Qt === 'function') {
        Qt("Reloading page...", "sync");
    }
    
    // Set the 1000ms delay
    setTimeout(() => {
        console.log("🔃 Performing page reload...");
        window.location.reload(); 
    }, 1000); 
}
  
// =============================================================================
// DATA MANAGEMENT FUNCTIONS
// =============================================================================

function l(e) {
  return e && "object" == typeof e
    ? ((e.rawMaterialItems = Array.isArray(e.rawMaterialItems)
        ? e.rawMaterialItems.map((e) => {
            const t = { ...e },
              n = Number(
                t.unitCost ?? t.costPerUnit ?? t.cost_per_unit ?? t.cost ?? 0
              );
            return (
              (t.unitCost = isFinite(n) ? n : 0),
              (t.unit = t.unit ?? t.costUnit ?? t.outputUnit ?? r),
              (t.quantity = Number(t.quantity ?? t.qty ?? 0)),
              (t.type = t.type ?? "rawMaterial"),
              t
            );
          })
        : []),
      (e.directLaborItems = Array.isArray(e.directLaborItems)
        ? e.directLaborItems.map((e) => {
            const t = { ...e },
              n = Number(t.unitCost ?? t.rate ?? t.costPerUnit ?? t.cost ?? 0);
            return (
              (t.unitCost = isFinite(n) ? n : 0),
              (t.unit = t.unit ?? t.timeUnit ?? t.costUnit ?? "hours"),
              (t.quantity = Number(t.quantity ?? t.timeRequired ?? 0)),
              t
            );
          })
        : []),
      (e.totalCost = Number(e.totalCost ?? 0)),
      (e.servings = Number(e.servings ?? 1)),
      (e.type = e.type ?? "main"),
      e)
    : e || {};
}

function s(e) {
  if (!e || "object" != typeof e)
    return {
      rawMaterials: [],
      directLabor: [],
      recipes: [],
      currency: "₱",
      currentRecipeState: null
    };
  return {
    rawMaterials: Array.isArray(e.rawMaterials)
      ? e.rawMaterials.map((e) => {
          const t = { ...e };
          return (
            (t.unitCost = Number(t.unitCost ?? t.costPerUnit ?? t.cost ?? 0)),
            (t.costUnit = t.costUnit ?? t.unit ?? "g"),
            (t.yieldPercentage = Number(t.yieldPercentage ?? t.yield ?? 100)),
            (t.name = t.name ?? "Unnamed"),
            (t.id = t.id ?? Date.now() + Math.floor(1e3 * Math.random())),
            t
          );
        })
      : [],
    directLabor: Array.isArray(e.directLabor)
      ? e.directLabor.map((e) => {
          const t = { ...e };
          return (
            (t.unitCost = Number(t.unitCost ?? t.costPerUnit ?? t.rate ?? 0)),
            (t.costUnit = t.costUnit ?? t.timeUnit ?? "hours"),
            (t.id = t.id ?? Date.now() + Math.floor(1e3 * Math.random())),
            (t.name = t.name ?? "Unnamed Labor"),
            t
          );
        })
      : [],
    recipes: Array.isArray(e.recipes) ? e.recipes.map((e) => l(e)) : [],
    currency: e.currency ?? "₱",
    currentRecipeState: e.currentRecipeState ?? null
  };
}

function c() {
  const t = s(e);
  return (t.dataVersion = 2), t;
}

// =============================================================================
// HELP SYSTEM AND FIELD DEFINITIONS
// =============================================================================

const d = {
    selectItem: {
      title: "Select Item",
      content: "Choose an ingredient from your inventory, a labor task, or a pre-made component to include in this recipe.",
      example: "Select 'Beef Brisket' from your ingredients or 'Food Preparation' from labor tasks to add to your burger recipe."
    },
    quantity: {
      title: "Quantity/Time Requirement",
      content: "Specify how much of this item is needed. For ingredients: enter the amount required. For labor: enter the time needed to complete the task.",
      example: "For one burger, you might need 0.15 kg of beef patty or require 0.5 hours of kitchen preparation time."
    },
    yieldPercentage: {
      title: "Yield Percentage",
      content: "The percentage of purchased weight that remains usable after preparation (after accounting for peeling, trimming, or cooking loss). 100% means no waste occurs.",
      example: "Carrots typically have 85% usable yield after peeling, while pre-prepared vegetables often have 100% yield with no waste."
    },
    markup: {
      title: "Mark-up Percentage",
      content: "The profit margin percentage added to your food cost to determine the menu price before taxes.",
      example: "If your burger costs $5.00 to prepare and you apply a 40% markup, the menu price becomes $7.00 before tax."
    },
    tax: {
      title: "Regular Tax Percentage",
      content: "The standard sales tax rate that applies to your menu items in your local area.",
      example: "With 8% sales tax, a $7.00 burger would include $0.56 in tax."
    },
    vat: {
      title: "VAT Percentage",
      content: "The Value Added Tax rate applied to your selling price, if applicable in your region.",
      example: "With 12% VAT, a $7.00 burger would include $0.84 in value added tax."
    },
    servings: {
      title: "Servings",
      content: "The total number of individual portions this recipe produces.",
      example: "A soup recipe that fills 8 bowls has 8 servings. A cake sliced into 12 pieces has 12 servings."
    },
    subRecipeName: {
      title: "Sub-Recipe Name",
      content: "A unique name identifying your custom preparation or component.",
      example: "'Special Burger Sauce', 'House Seasoning Blend', or 'Signature Marinade'."
    },
    subRecipeCategory: {
      title: "Category of Measurement",
      content: "How this sub-recipe is measured: by Weight (grams, kilograms), Volume (milliliters, liters), or individual Count.",
      example: "Sauces are typically measured by Volume, dry mixes by Weight, and prepared items like meatballs by Count."
    },
    subRecipeYieldQuantity: {
      title: "Total Yield per Batch",
      content: "The total amount this recipe produces in one complete preparation.",
      example: "Your sauce recipe might yield 500ml total. Your spice blend might make 200g total per batch."
    },
    ingredientName: {
      title: "Raw Material Name",
      content: "The common name of the basic ingredient or supply item.",
      example: "'Ground Beef', 'Premium Olive Oil', 'Fresh Roma Tomatoes'."
    },
    ingredientCategory: {
      title: "Raw Material Category",
      content: "How this ingredient is typically measured: Weight (solid items), Volume (liquid items), or Count (individual pieces).",
      example: "Flour and meat are measured by Weight, oils and milk by Volume, and eggs by Count."
    },
    purchasePrice: {
      title: "Purchase Price",
      content: "The total amount you paid for the entire purchased quantity of this item.",
      example: "If you paid $6.50 for one pound of beef, enter 6.50."
    },
    purchaseQuantity: {
      title: "Purchase Quantity",
      content: "The total amount you received for the purchase price, used to calculate cost per unit.",
      example: "For the $6.50 beef purchase, enter 1 pound. For $10.00 spent on 5 dozen eggs, enter 5."
    },
    purchaseUnit: {
      title: "Purchase Unit",
      content: "The unit of measurement in which you bought this item.",
      example: "Select 'pound' for meat, 'dozen' for eggs, or 'liter' for liquids."
    },
    costPerUnit: {
      title: "Cost Per Unit",
      content: "The automatically calculated cost for one unit of this item, based on your purchase details.",
      example: "A $10.00 recipe that yields 500ml costs $0.02 per ml. If measuring in liters, this becomes $20.00 per liter."
    },
    laborName: {
      title: "Direct Labor Name",
      content: "A descriptive name for the specific work task or position.",
      example: "'Sauce Chef', 'Fry Cook', 'Prep Cook', or 'Line Cook'."
    },
    shiftRate: {
      title: "Shift Rate",
      content: "The total labor cost for one complete work shift for this position.",
      example: "If a kitchen employee costs $160.00 per 8-hour shift, enter 160."
    },
    shiftDuration: {
      title: "Shift Duration",
      content: "The total length of one work shift in your chosen time unit.",
      example: "For an 8-hour shift, enter 8 with 'hours' selected. For a 480-minute shift, enter 480 with 'minutes' selected."
    },
    timeUnit: {
      title: "Time Unit",
      content: "The time measurement used for shift duration (hours or minutes).",
      example: "Choose 'hours' for shifts measured in hours, or 'minutes' for more precise minute-based calculations."
    },
    costUnit: {
      title: "Cost Unit",
      content: "How you want to view labor costs: per hour or per minute.",
      example: "Select 'hours' to see cost per hour, or 'minutes' for cost per minute calculations."
    },
    servingScale: {
      title: "Serving Scale",
      content: "Adjust this number to calculate costs for different batch sizes. The system automatically scales costs based on your desired serving quantity.",
      example: "A stew costing $20.00 for 10 servings would cost $100.00 for 50 servings. When loading recipes, this automatically matches the original serving size."
    },
    selectedLaborRate: {
      title: "Displayed Labor Rate (Read-only)",
      content: "This automatically calculated field shows the labor cost per time unit, based on the shift rate and duration you've entered.",
      example: "$160.00 shift rate divided by 8 hours equals $20.00 per hour, or $0.33 per minute if displaying by minutes."
    }
  };

// =============================================================================
// CASCADE SYNCHRONIZATION MODULE
// =============================================================================

/**
 * Cascade Synchronization Module for ProfitPerPlate
 *
 * Paste this file (or its contents) into script.js after the HELP SYSTEM section
 * or include it as a new file loaded before the app initializes.
 *
 * Purpose:
 * - Canonicalize master property access (cost, unit, yield)
 * - Correct yield math (increase cost when yield < 100%)
 * - Provide a robust unit conversion helper (using window.a)
 * - Provide safe id coercion and name-matching (case-insensitive)
 * - Iterative convergence for sub-recipe propagation with cycle detection and max iterations
 * - Defensive checks and gated UI-refresh calls to integrate with existing functions
 *
 * Public API: window.CascadeSystem with:
 * - recalculateAllRecipesOnMasterChange()
 * - synchronizeMasterItemDetails(masterList, masterType)
 * - initializeMasterIdReferences()
 * - calculateItemEffectiveCost(recipeItem, masterItem)
 *
 * Config:
 * - window.CASCADE_DEBUG = true/false to enable verbose logging
 *
 * IMPORTANT: This module does not overwrite app global state itself except to set
 * recipeItem.masterId and numeric cost fields. It expects the app's core
 * render/update functions remain available (en, un, mn, Fn, zn, Kn, vt...). Calls
 * to those functions are guarded with typeof checks.
 */

(function globalCascadeModule() {
  // Debugging toggle
  const DBG = !!window.CASCADE_DEBUG;

  function log(...args) {
    if (DBG) console.log("[Cascade]", ...args);
  }
  function warn(...args) {
    console.warn("[Cascade]", ...args);
  }
  function err(...args) {
    console.error("[Cascade]", ...args);
  }

  // Safely read unit map from existing app
  function unitMap() {
    return (window.a && typeof window.a === "object") ? window.a : {
      kg: 1e3, g: 1, mg: 0.001, lbs: 453.592, oz: 28.3495,
      L: 1e3, ml: 1, cup: 236.588, tbsp: 14.7868, tsp: 4.92892,
      dozen: 12, pc: 1, hours: 60, minutes: 1
    };
  }

  // Canonical getters with fallbacks and type normalization
  function getMasterUnitCost(master) {
    if (!master) return 0;
    // possible fields used in the app: unitCost, costPerUnit, cost_per_unit, price/unit combos
    const v = master.unitCost ?? master.costPerUnit ?? master.cost_per_unit ?? master.cost ?? master.rate ?? 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function getMasterCostUnit(master) {
    if (!master) return "unit";
    // possible fields: costUnit, cost_unit, unit, outputUnit
    return master.costUnit ?? master.cost_unit ?? master.unit ?? master.outputUnit ?? "g";
  }

  function getMasterYieldPercentage(master) {
    if (!master) return 100;
    // possible fields: yieldPercentage, yield, yield_pct
    const v = master.yieldPercentage ?? master.yield ?? master.yield_pct ?? 100;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : 100;
  }

  function getMasterYieldUnit(master) {
    if (!master) return null;
    return master.yieldUnit ?? master.outputUnit ?? null;
  }

  function isSubRecipeMaster(master) {
    return master && (master.type === "sub" || master.type === "sub-recipe");
  }

  // Safe id equality (handles numbers/strings)
  function idEq(a, b) {
    if (a == null || b == null) return false;
    return String(a) === String(b);
  }

  // Convert quantity from one unit to another using unitMap; returns numeric value
  function convertQty(amount, fromUnit, toUnit) {
    try {
      const map = unitMap();
      if (!fromUnit || !toUnit) return Number(amount) || 0;
      const f = map[fromUnit] ?? 1;
      const t = map[toUnit] ?? 1;
      if (!f || !t) {
        // avoid division by zero; fallback to identity
        return Number(amount) || 0;
      }
      // Convert amount (in fromUnit) into toUnit:
      // amount_in_base = amount * f
      // amount_in_toUnit = (amount * f) / t = amount * (f / t)
      return (Number(amount) || 0) * (f / t);
    } catch (e) {
      warn("convertQty error:", e);
      return Number(amount) || 0;
    }
  }

  // Correct yield math:
  // If an ingredient has a yield < 100%, cost per usable unit increases:
  // effectiveCost = rawCost / (yieldPercentage / 100)
  // Example: base cost 100 per kg, yield 80% => cost per usable kg = 100 / 0.8 = 125
  function applyYieldToCost(cost, yieldPct) {
    const pct = Number(yieldPct);
    if (!isFinite(pct) || pct <= 0) return cost;
    return cost / (pct / 100);
  }

  /**
   * calculateItemEffectiveCost(recipeItem, masterItem)
   *
   * - recipeItem: an item object from a recipe (has quantity, unit, type)
   * - masterItem: corresponding master record (rawMaterials entry or sub-recipe or directLabor)
   *
   * Returns: numeric total cost for the recipe line (not per-unit unless applicable).
   */
  function calculateItemEffectiveCost(recipeItem = {}, masterItem = {}) {
  try {
    // Defensive defaults
    const qty = Number(recipeItem.quantity ?? recipeItem.qty ?? 0) || 0;
    const recipeUnit = recipeItem.unit ?? recipeItem.costUnit ?? "g";

    // If master is a sub-recipe, use its costPerUnit and yieldUnit / costUnit semantics
    if (isSubRecipeMaster(masterItem)) {
      // Use masterItem.costPerUnit as cost per yield unit (already canonical)
      const unitCost = Number(masterItem.costPerUnit ?? masterItem.unitCost ?? 0) || 0;
      const targetUnit = getMasterYieldUnit(masterItem) || getMasterCostUnit(masterItem) || "unit";
      // Convert recipe quantity to the master sub-recipe's yield/cost unit
      const qtyInYieldUnit = convertQty(qty, recipeUnit, targetUnit);
      const total = qtyInYieldUnit * unitCost;
      return Number(isFinite(total) ? total : 0);
    }

    // Otherwise it's a raw material or direct labor master item
    const unitCost = getMasterUnitCost(masterItem);
    const masterCostUnit = getMasterCostUnit(masterItem);

    // Convert recipe qty into master's cost unit
    const qtyInMasterUnit = convertQty(qty, recipeUnit, masterCostUnit);
    let rawTotal = qtyInMasterUnit * unitCost;

    // IMPORTANT: Do NOT re-apply yield correction here.
    // The master.unitCost / master.costPerUnit fields are expected to already reflect yield adjustments
    // performed at the time the master item (raw material) was created/updated.
    // Applying yield here causes double-counting of yield losses.

    // Numeric safety
    return Number(isFinite(rawTotal) ? rawTotal : 0);
  } catch (error) {
    warn("calculateItemEffectiveCost failed for", recipeItem, masterItem, error);
    return 0;
  }
}

  /**
   * recalculateRecipeItem(recipeItem, masterList, isSubRecipeIngredient)
   *
   * Updates recipeItem's cost-related fields (unitCost, costUnit, totalCost, masterId)
   * Mutates recipeItem in place.
   */
  function recalculateRecipeItem(recipeItem = {}, masterList = [], isSubRecipeIngredient = false) {
    try {
      if (!recipeItem || !masterList || !Array.isArray(masterList)) return;

      // Attempt to find master item by masterId, id, or case-insensitive name match
      const master = masterList.find(m =>
        (recipeItem.masterId && idEq(m.id, recipeItem.masterId)) ||
        idEq(m.id, recipeItem.id) ||
        (typeof m.name === "string" && typeof recipeItem.name === "string" && m.name.trim().toLowerCase() === recipeItem.name.trim().toLowerCase())
      );

      if (!master) {
        // No master found: do not change masterId, but ensure numeric fields exist
        recipeItem.unitCost = Number(recipeItem.unitCost ?? recipeItem.costPerUnit ?? recipeItem.unitCost ?? 0) || 0;
        recipeItem.costUnit = recipeItem.costUnit ?? recipeItem.unit ?? "g";
        recipeItem.totalCost = Number(recipeItem.totalCost ?? 0);
        return;
      }

      // Store stable master reference
      recipeItem.masterId = master.id;

      // Update cost properties: unitCost and costUnit
      if (isSubRecipeMaster(master)) {
        // For sub-recipes, the recipe item should pick up costPerUnit and yieldUnit as costUnit
        const costPerUnit = Number(master.costPerUnit ?? master.unitCost ?? 0) || 0;
        const costUnit = master.yieldUnit ?? master.costUnit ?? master.outputUnit ?? "unit";
        recipeItem.unitCost = costPerUnit;
        recipeItem.costUnit = costUnit;
      } else {
        // raw material or labor
        const costPerUnit = getMasterUnitCost(master);
        const costUnit = getMasterCostUnit(master);
        recipeItem.unitCost = costPerUnit;
        recipeItem.costUnit = costUnit;
      }

      // Copy yield info if available
      if (master.yieldPercentage !== undefined || master.yield !== undefined) {
        recipeItem.yieldPercentage = getMasterYieldPercentage(master);
      }

      // Recalculate totalCost using canonical function
      recipeItem.totalCost = parseFloat(calculateItemEffectiveCost(recipeItem, master).toFixed(2));

    } catch (e) {
      warn("recalculateRecipeItem error:", e, recipeItem);
    }
  }

  /**
   * synchronizeMasterItemDetails(masterList, masterType)
   *
   * Non-cost details sync (names, costUnit, masterId) from masterList into all recipes.
   * Returns number of synchronizations performed.
   */
  function synchronizeMasterItemDetails(masterList = [], masterType = "rawMaterial") {
    if (!window.e || !Array.isArray(window.e.recipes)) {
      warn("synchronizeMasterItemDetails: global recipes not available");
      return 0;
    }
    if (!Array.isArray(masterList)) {
      warn("synchronizeMasterItemDetails: masterList invalid");
      return 0;
    }

    const recipes = window.e.recipes;
    let count = 0;

    recipes.forEach(recipe => {
      if (!recipe) return;

      const listName = masterType === "rawMaterial" ? "rawMaterialItems" : "directLaborItems";
      const recipeItemList = recipe[listName] || [];
      recipeItemList.forEach(item => {
        // Find master (prefer masterId)
        const master = masterList.find(m =>
          (item.masterId && idEq(m.id, item.masterId)) ||
          idEq(m.id, item.id) ||
          (typeof m.name === "string" && typeof item.name === "string" && m.name.trim().toLowerCase() === item.name.trim().toLowerCase())
        );
        if (!master) return;

        // 1) Name sync (case-insensitive, do not override if names equal when trimmed)
        if (typeof item.name === "string" && typeof master.name === "string" && item.name.trim() !== master.name.trim()) {
          log(`synchronize: rename "${item.name}" -> "${master.name}" in recipe "${recipe.name}"`);
          item.name = master.name;
          count++;
        }

        // 2) costUnit sync for non-subrecipe items
        const masterCostUnit = getMasterCostUnit(master);
        if (masterCostUnit && (item.costUnit ?? item.unit) !== masterCostUnit) {
          // do not force override for sub-recipe items here
          if (!(item.type === "sub-recipe" || item.type === "subrecipe" || isSubRecipeMaster(master))) {
            item.costUnit = masterCostUnit;
            count++;
          }
        }

        // 3) ensure masterId stored
        if (!item.masterId || !idEq(item.masterId, master.id)) {
          item.masterId = master.id;
          count++;
        }
      });
    });

    log(`synchronizeMasterItemDetails: synchronized ${count} items for masterType=${masterType}`);
    return count;
  }

  /**
   * recalculateAllRecipesOnMasterChange()
   *
   * Main entry point to propagate master changes across all recipes.
   * - Two-phase iterative approach for sub-recipe convergence
   * - Iterates until stable or maxIterations reached to handle nested sub-recipes
   * - Returns number of recipes updated
   */
 // Replace the existing function recalculateAllRecipesOnMasterChange() in the Cascade module.
// Locate: search for "function recalculateAllRecipesOnMasterChange()"
function recalculateAllRecipesOnMasterChange() {
    console.log("🔄 Starting Comprehensive Cascade: Raw/Labor -> All Sub-Recipes -> Main Recipes");
    
    if (!window.e || !Array.isArray(window.e.recipes)) return 0;

    const recipes = window.e.recipes;
    const rawMaterials = window.e.rawMaterials || [];
    const directLabor = window.e.directLabor || [];
    let updatedCount = 0;

    // Define convertQty function for unit conversions
    const convertQty = function(amount, fromUnit, toUnit) {
        try {
            const map = (window.a && typeof window.a === "object") ? window.a : {
                kg: 1e3, g: 1, mg: 0.001, lbs: 453.592, oz: 28.3495,
                L: 1e3, ml: 1, cup: 236.588, tbsp: 14.7868, tsp: 4.92892,
                dozen: 12, pc: 1, hours: 60, minutes: 1
            };
            if (!fromUnit || !toUnit) return Number(amount) || 0;
            const f = map[fromUnit] ?? 1;
            const t = map[toUnit] ?? 1;
            if (!f || !t) return Number(amount) || 0;
            return (Number(amount) || 0) * (f / t);
        } catch (e) {
            console.warn("convertQty error:", e);
            return Number(amount) || 0;
        }
    };

    // --- PHASE 1: Reset all recipe costs to force recalculation ---
    console.log("🧹 Resetting all recipe costs for fresh calculation...");
    recipes.forEach(recipe => {
        recipe.totalCost = 0;
        if (recipe.type === 'sub') {
            recipe.costPerUnit = 0;
        }
    });

    // --- PHASE 2: Sort sub-recipes by dependency depth (deepest first) ---
    function calculateDependencyDepth(recipe, visited = new Set(), depth = 0) {
        if (visited.has(recipe.id)) {
            console.warn(`⚠️ Circular dependency detected for ${recipe.name}`);
            return depth;
        }
        
        visited.add(recipe.id);
        let maxDepth = depth;
        
        if (Array.isArray(recipe.rawMaterialItems)) {
            recipe.rawMaterialItems.forEach(item => {
                if (item.type === 'sub-recipe' || item.type === 'subrecipe') {
                    const subRecipeId = item.subRecipeId || item.masterId;
                    const nestedSubRecipe = recipes.find(r => 
                        r.type === 'sub' && String(r.id) === String(subRecipeId)
                    );
                    
                    if (nestedSubRecipe) {
                        const nestedDepth = calculateDependencyDepth(nestedSubRecipe, new Set(visited), depth + 1);
                        maxDepth = Math.max(maxDepth, nestedDepth);
                    }
                }
            });
        }
        
        return maxDepth;
    }

    const subRecipes = recipes.filter(r => r.type === 'sub');
    const subRecipesWithDepth = subRecipes.map(recipe => ({
        recipe,
        depth: calculateDependencyDepth(recipe)
    })).sort((a, b) => b.depth - a.depth); // Sort deepest first

    console.log("📊 Sub-recipe dependency order (deepest first):", 
        subRecipesWithDepth.map(s => `${s.recipe.name} (depth: ${s.depth})`));

    // --- PHASE 3: Process ALL recipes (including main recipes) in dependency order ---
    let recipesChanged = true;
    let iterations = 0;
    const maxIterations = 15; // Increased for complex dependency chains

    while (recipesChanged && iterations < maxIterations) {
        recipesChanged = false;
        iterations++;
        console.log(`🔄 Comprehensive cascade iteration ${iterations}...`);

        // Process ALL recipes in dependency order (sub-recipes first, then main recipes)
        const allRecipesToProcess = [
            ...subRecipesWithDepth.map(({ recipe }) => recipe),
            ...recipes.filter(r => r.type === 'main')
        ];

        allRecipesToProcess.forEach(recipe => {
            let rawTotal = 0;
            let laborTotal = 0;
            let recipeUpdated = false;

            // 1. Process Raw Materials & Sub-Recipe Items
            if (Array.isArray(recipe.rawMaterialItems)) {
                recipe.rawMaterialItems.forEach(item => {
                    let currentMaster = null;
                    let masterCost = 0;
                    let masterUnit = "g";
                    const itemUnit = item.unit || item.costUnit || "g";
                    const qty = Number(item.quantity || 0);

                    // Find the appropriate master definition
                    if (item.type === 'sub-recipe' || item.type === 'subrecipe') {
                        // CASE: Sub-Recipe Item - Look in ALL recipes
                        const subRecipeId = item.subRecipeId || item.masterId;
                        currentMaster = recipes.find(r => 
                            String(r.id) === String(subRecipeId) || 
                            (r.name && item.name && r.name.trim().toLowerCase() === item.name.trim().toLowerCase())
                        );
                        
                        if (currentMaster) {
                            masterCost = Number(currentMaster.costPerUnit || 0);
                            masterUnit = currentMaster.costUnit || currentMaster.yieldUnit || "unit";
                        }
                    } else {
                        // CASE: Raw Material Item - Look in raw materials
                        currentMaster = rawMaterials.find(m => 
                            String(m.id) === String(item.masterId) || 
                            (typeof m.name === "string" && typeof item.name === "string" && 
                             m.name.trim().toLowerCase() === item.name.trim().toLowerCase())
                        );
                        
                        if (currentMaster) {
                            masterCost = Number(currentMaster.costPerUnit || currentMaster.unitCost || 0);
                            masterUnit = currentMaster.costUnit || currentMaster.unit || "g";
                        }
                    }

                    if (currentMaster) {
                        const qtyInMasterUnit = convertQty(qty, itemUnit, masterUnit);
                        const lineTotal = Number((qtyInMasterUnit * masterCost).toFixed(2));
                        
                        // Check if this line item changed
                        const oldTotal = Number(item.totalCost || 0);
                        if (Math.abs(lineTotal - oldTotal) > 0.001) {
                            recipeUpdated = true;
                            recipesChanged = true;
                        }
                        
                        item.unitCost = Number(masterCost || 0);
                        item.totalCost = lineTotal;
                        item.costUnit = masterUnit;
                    } else {
                        // If no master found but item has cost, reset it
                        if (Number(item.totalCost || 0) > 0) {
                            recipeUpdated = true;
                            recipesChanged = true;
                        }
                        item.unitCost = 0;
                        item.totalCost = 0;
                    }

                    rawTotal += Number(item.totalCost || 0);
                });
            }

            // 2. Process Direct Labor
            if (Array.isArray(recipe.directLaborItems)) {
                recipe.directLaborItems.forEach(item => {
                    const master = directLabor.find(l => 
                        String(l.id) === String(item.masterId) ||
                        (typeof l.name === "string" && typeof item.name === "string" && 
                         l.name.trim().toLowerCase() === item.name.trim().toLowerCase())
                    );
                    
                    if (master) {
                        const masterCost = Number(master.costPerUnit || 0);
                        const masterUnit = master.costUnit || master.timeUnit || "hours";
                        const itemUnit = item.unit || item.timeUnit || masterUnit;
                        
                        const qtyInMasterUnit = convertQty(Number(item.quantity || 0), itemUnit, masterUnit);
                        const lineTotal = Number((qtyInMasterUnit * masterCost).toFixed(2));
                        
                        // Check if this line item changed
                        const oldTotal = Number(item.totalCost || 0);
                        if (Math.abs(lineTotal - oldTotal) > 0.001) {
                            recipeUpdated = true;
                            recipesChanged = true;
                        }
                        
                        item.unitCost = Number(masterCost || 0);
                        item.totalCost = lineTotal;
                    } else {
                        // If no master found but item has cost, reset it
                        if (Number(item.totalCost || 0) > 0) {
                            recipeUpdated = true;
                            recipesChanged = true;
                        }
                        item.unitCost = 0;
                        item.totalCost = 0;
                    }
                    laborTotal += Number(item.totalCost || 0);
                });
            }

            // Update recipe total cost
            const newTotalCost = parseFloat((rawTotal + laborTotal).toFixed(2));
            const oldTotalCost = Number(recipe.totalCost || 0);
            
            if (Math.abs(newTotalCost - oldTotalCost) > 0.001) {
                recipeUpdated = true;
                recipesChanged = true;
                recipe.totalCost = newTotalCost;
                console.log(`💰 Updated ${recipe.type === 'sub' ? 'sub-recipe' : 'main recipe'} ${recipe.name} total cost: ${oldTotalCost} -> ${newTotalCost}`);
            }

            // Update sub-recipe cost per unit (only for sub-recipes)
            if (recipe.type === 'sub' && recipeUpdated) {
                const yieldQty = parseFloat(recipe.yieldQuantity) || 1;
                const yieldUnit = recipe.yieldUnit || recipe.outputUnit || null;
                const targetCostUnit = recipe.costUnit || yieldUnit || "unit";

                if (yieldQty > 0) {
                    const newCostPerYieldUnit = recipe.totalCost / yieldQty;
                    let adjusted = newCostPerYieldUnit;
                    
                    // Convert to target cost unit if different from yield unit
                    if (yieldUnit && targetCostUnit && yieldUnit !== targetCostUnit) {
                        const UM = (window.a && typeof window.a === "object") ? window.a : {
                            kg: 1e3, g: 1, mg: 0.001, lbs: 453.592, oz: 28.3495,
                            L: 1e3, ml: 1, cup: 236.588, tbsp: 14.7868, tsp: 4.92892,
                            dozen: 12, pc: 1, hours: 60, minutes: 1
                        };
                        const f = UM[yieldUnit] || 1;
                        const t = UM[targetCostUnit] || 1;
                        if (f && t) adjusted = newCostPerYieldUnit * (t / f);
                    }
                    
                    const oldCostPerUnit = Number(recipe.costPerUnit || 0);
                    const newCostPerUnit = parseFloat(Number.isFinite(adjusted) ? adjusted.toFixed(4) : 0);
                    
                    if (Math.abs(newCostPerUnit - oldCostPerUnit) > 0.001) {
                        recipe.costPerUnit = newCostPerUnit;
                        recipe.costUnit = targetCostUnit;
                        console.log(`📊 Updated ${recipe.name} cost/unit: ${oldCostPerUnit} -> ${newCostPerUnit} ${targetCostUnit}`);
                    }
                }
            }

            if (recipeUpdated) {
                updatedCount++;
            }
        });
    }

    console.log(`✅ Comprehensive cascade completed after ${iterations} iterations`);

    // --- PHASE 4: Final verification and cleanup ---
    let finalUpdatedCount = 0;
    
    recipes.forEach(recipe => {
        // Verify all recipes have valid costs
        if (isNaN(recipe.totalCost) || recipe.totalCost === null) {
            console.warn(`⚠️ Invalid total cost for ${recipe.name}, resetting to 0`);
            recipe.totalCost = 0;
            finalUpdatedCount++;
        }
        
        if (recipe.type === 'sub' && (isNaN(recipe.costPerUnit) || recipe.costPerUnit === null)) {
            console.warn(`⚠️ Invalid cost per unit for sub-recipe ${recipe.name}, resetting to 0`);
            recipe.costPerUnit = 0;
            finalUpdatedCount++;
        }
    });

    // Persist changes
    if (typeof jt === "function") {
        jt(recipes);
        console.log("💾 All recipe changes persisted");
    }

    const totalChanges = updatedCount + finalUpdatedCount;
    console.log(`✅ Comprehensive cascade complete. Total changes: ${totalChanges} (${updatedCount} cost updates + ${finalUpdatedCount} cleanups)`);
    
    return totalChanges;
}

  /**
   * initializeMasterIdReferences()
   *
   * One-time pass to link legacy recipe items by name to master raw materials or sub-recipes.
   * - Avoids ambiguous matches; if multiple matches exist, it does not auto-link and logs them.
   * - Returns count of links created.
   */
  function initializeMasterIdReferences() {
    if (!window.e || !Array.isArray(window.e.recipes)) {
      warn("initializeMasterIdReferences: global recipes missing");
      return 0;
    }
    const recipes = window.e.recipes;
    const rawMaterials = Array.isArray(window.e.rawMaterials) ? window.e.rawMaterials : [];
    const subRecipes = recipes.filter(r => r.type === "sub");

    let linkCount = 0;
    recipes.forEach(recipe => {
      (recipe.rawMaterialItems || []).forEach(item => {
        if (item.masterId) return;
        // try to find raw material by exact (case-insensitive) name
        const candidates = rawMaterials.filter(m => typeof m.name === "string" && typeof item.name === "string" && m.name.trim().toLowerCase() === item.name.trim().toLowerCase());
        // also check subRecipe names (a sub-recipe may be used as ingredient)
        const subCandidates = subRecipes.filter(m => typeof m.name === "string" && typeof item.name === "string" && m.name.trim().toLowerCase() === item.name.trim().toLowerCase());

        const totalCandidates = [...candidates, ...subCandidates];

        if (totalCandidates.length === 1) {
          item.masterId = totalCandidates[0].id;
          linkCount++;
          log(`initializeMasterIdReferences: linked "${item.name}" -> id ${item.masterId}`);
        } else if (totalCandidates.length > 1) {
          warn(`Ambiguous master match for "${item.name}" - ${totalCandidates.length} candidates. Skipping auto-link.`);
        } else {
          // no match found - skip
        }
      });

      (recipe.directLaborItems || []).forEach(item => {
        if (item.masterId) return;
        const dlCandidates = (window.e.directLabor || []).filter(m => typeof m.name === "string" && typeof item.name === "string" && m.name.trim().toLowerCase() === item.name.trim().toLowerCase());
        if (dlCandidates.length === 1) {
          item.masterId = dlCandidates[0].id;
          linkCount++;
          log(`initializeMasterIdReferences: linked labor "${item.name}" -> id ${item.masterId}`);
        } else if (dlCandidates.length > 1) {
          warn(`Ambiguous labor match for "${item.name}" - ${dlCandidates.length} candidates. Skipping auto-link.`);
        }
      });
    });

    log(`initializeMasterIdReferences: linked ${linkCount} items`);
    if (typeof Wt === "function" && linkCount > 0) {
      Wt(`Master ID references initialized: ${linkCount} item(s) linked`, "info");
    }
    return linkCount;
  }

  // Expose public API
  window.CascadeSystem = {
    calculateItemEffectiveCost,
    recalculateRecipeItem,
    synchronizeMasterItemDetails,
    recalculateAllRecipesOnMasterChange,
    initializeMasterIdReferences,
    // small helpers exported for testing
    _internal: {
      convertQty,
      getMasterUnitCost,
      getMasterCostUnit,
      getMasterYieldPercentage,
      applyYieldToCost,
      detectCycles: function() {
        // reconstruct graph and detect cycles
        if (!window.e || !Array.isArray(window.e.recipes)) return [];
        const recipes = window.e.recipes;
        const graph = new Map();
        recipes.forEach(r => {
          const subs = new Set();
          (r.rawMaterialItems || []).forEach(it => {
            if (it.type === "sub-recipe" || it.type === "subrecipe") {
              const subId = it.subRecipeId ?? it.id ?? it.masterId;
              if (subId != null) subs.add(String(subId));
            }
          });
          graph.set(String(r.id), subs);
        });
        // reuse local detection logic
        const visited = new Set();
        const stack = new Set();
        const cycles = [];
        function dfs(node) {
          if (stack.has(node)) {
            cycles.push([...stack, node]);
            return;
          }
          if (visited.has(node)) return;
          visited.add(node);
          stack.add(node);
          const neighbors = graph.get(node) || new Set();
          neighbors.forEach(n => dfs(n));
          stack.delete(node);
        }
        graph.forEach((_, node) => {
          if (!visited.has(node)) dfs(node);
        });
        return cycles;
      }
    }
  };

  log("Cascade module loaded and window.CascadeSystem exported");
})();

// =============================================================================
// MASTER CHANGE MONITORING SYSTEM
// =============================================================================

function setupMasterChangeMonitoring() {
    console.log("🔍 Setting up master change monitoring...");

    let lastRawMaterialsHash = '';
    let lastDirectLaborHash = '';

    setInterval(() => {
        try {
            const currentRawHash = JSON.stringify(window.e?.rawMaterials || []);
            const currentLaborHash = JSON.stringify(window.e?.directLabor || []);

            if (currentRawHash !== lastRawMaterialsHash) {
                console.log("🔄 Raw materials changed - triggering cascade");
                try {
                    // Defensive call: Ot now safely handles null/undefined updatedMasterItem
                    Ot(null, 'rawMaterial');
                } catch (err) {
                    console.warn("Ot() threw while handling rawMaterial change:", err);
                }
                lastRawMaterialsHash = currentRawHash;
            }

            if (currentLaborHash !== lastDirectLaborHash) {
                console.log("🔄 Direct labor changed - triggering cascade");
                try {
                    Ot(null, 'directLabor');
                } catch (err) {
                    console.warn("Ot() threw while handling directLabor change:", err);
                }
                lastDirectLaborHash = currentLaborHash;
            }
        } catch (error) {
            console.warn("Master change monitoring error:", error);
        }
    }, 2000); // Check every 2 seconds
}

// =============================================================================
// DUPLICATE HANDLING AND PROMPT MANAGEMENT
// =============================================================================

function u(e, t) {
  let n = [];

  switch (t) {
    case "rawMaterial":
      n = Yt();
      break;
    case "directLabor":
      n = Vt();
      break;
    case "mainRecipe":
      n = Gt().filter((e) => "main" === e.type);
      break;
    case "subRecipe":
      n = Gt().filter((e) => "sub" === e.type);
  }

  const existingNames = n.map(item => item.name.toLowerCase());
  
  let baseName = e;
  let newName = baseName;
  let copyNumber = 1;

  while (existingNames.includes(newName.toLowerCase())) {
    newName = `${baseName} - copy${copyNumber > 1 ? ` ${copyNumber}` : ''}`;
    copyNumber++;
  }

  return newName;
}

// Temporary debug - add this right before calling p()
console.log("🔍 SUB-RECIPE DEBUG:");
console.log("Recipe Name:", recipeName);
console.log("Editing ID:", t?.id);
console.log("All Sub-Recipes:", Gt().filter(r => r.type === "sub"));

function p(itemName, type, excludeId = null, saveCallback) {
  // Purpose: detect duplicate of itemName in the relevant master list,
  // and if found show the unified duplicate modal (unifiedEditPromptModal).
  // Returns true if a duplicate was found (and modal shown), false otherwise.
  try {
    if (!itemName || typeof itemName !== 'string') return false;
    const normalized = itemName.trim().toLowerCase();

    let list = [];
    switch (type) {
      case "rawMaterial":
        list = Yt(); // master raw materials
        break;
      case "directLabor":
        list = Vt(); // master direct labor
        break;
      case "mainRecipe":
        list = Gt().filter(r => r.type === "main");
        break;
      case "subRecipe":
        list = Gt().filter(r => r.type === "sub");
        break;
      default:
        // unknown type - do not treat as duplicate
        return false;
    }

    // find matching item by name (case-insensitive) excluding provided id
    const existing = (list || []).find(it => {
      if (!it || !it.name) return false;
      if (excludeId != null && String(it.id) === String(excludeId)) return false;
      return String(it.name).trim().toLowerCase() === normalized;
    });

    // no duplicate found -> caller can proceed
    if (!existing) return false;

    // Duplicate found -> prepare and show unified modal
    const modal = document.getElementById("unifiedEditPromptModal");
    const titleEl = document.getElementById("unifiedEditPromptTitle");
    const messageEl = document.getElementById("unifiedEditPromptMessage");

    // Defensive UI fallbacks
    if (!modal || !titleEl || !messageEl) {
      console.warn("Duplicate modal or required elements missing. Falling back to inline prompt.");
      // fallback behavior: ask confirm and call saveCallback directly
      const confirmReplace = confirm(`An item named "${existing.name}" already exists. Replace existing? (OK = Replace, Cancel = Save as New)`);
      if (confirmReplace) {
        if (typeof saveCallback === "function") saveCallback("replace");
      } else {
        // compute auto-new-name
        const proposed = u(itemName, type);
        if (typeof saveCallback === "function") saveCallback("new", proposed);
      }
      return true;
    }

    // Populate unifiedPromptContext used by modal handlers (m(), g(), etc.)
    window.unifiedPromptContext = {
      itemType: type,
      existingItem: existing,
      newName: String(itemName).trim(),
      saveCallback: typeof saveCallback === "function" ? saveCallback : null
    };

    // Build a clear message to the user
    const existingTypeLabel = (function(t) {
      switch (t) {
        case "rawMaterial": return "Raw Material";
        case "directLabor": return "Direct Labor";
        case "mainRecipe": return "Recipe";
        case "subRecipe": return "Sub-Recipe";
        default: return "Item";
      }
    })(type);

    // Compose details (try to include useful metadata where available)
    let metaLines = [];
    if (existing.createdAt) metaLines.push(`Created: ${new Date(existing.createdAt).toLocaleString()}`);
    if (existing.category) metaLines.push(`Category: ${existing.category}`);
    if (existing.costPerUnit || existing.unitCost) {
      const c = existing.costPerUnit ?? existing.unitCost ?? 0;
      const unit = existing.costUnit ?? existing.unit ?? "";
      metaLines.push(`Cost: ${uo(Number(c) || 0)} ${unit ? "/" + unit : ""}`);
    }
    // message content
    const html = `
      <div class="unified-prompt-item">
        <div class="item-name">${po(existing.name)}</div>
        <div class="item-details">
          <div><strong>Type:</strong> ${existingTypeLabel}</div>
          ${metaLines.length ? `<div style="margin-top:6px">${metaLines.join(" • ")}</div>` : ""}
          <div style="margin-top:10px">A ${existingTypeLabel.toLowerCase()} named "<strong>${po(existing.name)}</strong>" already exists. Choose below to replace it, or save this as a new item. You can also edit the proposed new name before saving as new.</div>
        </div>
      </div>
      <div style="margin-top:10px;">
        <label style="font-weight:600;display:block;margin-bottom:6px;">Proposed name when saving as new:</label>
        <input id="unifiedPromptNewNameInput" class="text-input" value="${po(window.unifiedPromptContext.newName || existing.name)}" style="width:100%; padding:8px; border:1px solid var(--border); border-radius:6px;" />
        <div style="margin-top:8px; font-size:12px; color:var(--text-secondary)">If you keep the same name, the system will auto-rename to "<em>- copy</em>" or "<em>- copy 2</em>" as needed when you choose Save as New.</div>
      </div>
    `;

    titleEl.textContent = `An item named "${existing.name}" already exists`;
    messageEl.innerHTML = html;

    // Show modal
    modal.classList.remove("hidden");

    // Attach a one-time input sync so when the user chooses "Save as New" we use the edited name
    // (the modal's handler m() will read window.unifiedPromptContext.newName before calling saveCallback)
    const newNameInput = document.getElementById("unifiedPromptNewNameInput");
    if (newNameInput) {
      newNameInput.addEventListener("input", function onInput() {
        window.unifiedPromptContext = window.unifiedPromptContext || {};
        window.unifiedPromptContext.newName = this.value.trim();
      });
      // initialize value
      window.unifiedPromptContext.newName = newNameInput.value.trim();
    }

    return true;
  } catch (err) {
    console.error("p() duplicate-check failed:", err);
    return false;
  }
}

function m(e) {
  const t = window.unifiedPromptContext;
  if (t && t.saveCallback)
    if ((g(), "replace" === e)) t.saveCallback("replace");
    else {
      let e = t.newName;
      e.toLowerCase() === t.existingItem.name.toLowerCase() &&
        (e = u(e, t.itemType)),
      t.saveCallback("new", e);
    }
  else console.error("No prompt context found");
}

function g() {
  const e = document.getElementById("unifiedEditPromptModal");
  e && e.classList.add("hidden"),
    (window.unifiedPromptContext = {
      itemType: null,
      existingItem: null,
      newName: null,
      saveCallback: null
    });
}

// =============================================================================
// DOM ELEMENT REFERENCES
// =============================================================================

let f, y, b, v, h, w, x, C, E, L, S, P, $, R, I, M, F, k, B, U, T, q, D, A, N, H, O, z, W, Q, Y, V, G, _, J, j, K, X, Z, ee, te, ne, oe, ae, ie, re, le, se, ce, de, ue, pe, me, ge, fe, ye, be, ve, he, we, xe, Ce, Ee, Le, Se, Pe, $e, Re, Ie, Me, Fe, ke, Be, Ue, Te, qe, De, Ae, Ne, He, Oe, ze, We, Qe, Ye, Ve, Ge, _e, Je, je, Ke, Xe, Ze, et;

window.unifiedPromptContext = {
  itemType: null,
  existingItem: null,
  newName: null,
  saveCallback: null
};

let tt = "₱",
  nt = !1;

// =============================================================================
// ENHANCED AUTH STATE HANDLER - WITH UI BLURRING
// =============================================================================

function setupEnhancedAuthStateHandler() {
    console.log("🔧 Setting up enhanced auth state handler...");
    
    if (!window.supabaseClient) {
        console.warn("Supabase client not available");
        return;
    }

    window.supabaseClient.setupAuthStateListener = function() {
        if (!window.supabaseClient.supabaseReady) {
            console.warn("Supabase not ready - cannot set up auth state listener");
            return;
        }

        console.log("🎧 Setting up enhanced auth state listener...");

        const { data: { subscription } } = window.supabaseClient.supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("🔄 Auth state changed:", event);

        const previousUser = window.supabaseClient.getCurrentUser();
        window.supabaseClient.currentUser = session?.user || null;

        switch (event) {
          case 'SIGNED_IN':
            console.log('✅ User signed in:', window.supabaseClient.currentUser?.email);
            // Unblur UI and allow menu to close
            unblurUI();
            allowMenuModalClose();
            window.updateAuthUI && window.updateAuthUI();
            
            setTimeout(async () => {
              console.log("🔄 Loading fresh data after login...");
              try {
                await window.supabaseClient.loadUserData();
                if (window.vt) window.vt();
                if (window.mn) window.mn();
                if (window.In) window.In();
                if (window.Kn) window.Kn();
                Wt("✅ Data loaded successfully", "success");
              } catch (error) {
                console.error("❌ Error loading data after login:", error);
                Wt("⚠️ Data load completed with issues", "warning");
              }
            }, 500);
            break;

          case 'SIGNED_OUT':
            console.log('🚪 User signed out');
            // Blur UI and force menu open
            blurUI();
            forceMenuModalOpen();
            window.updateAuthUI && window.updateAuthUI();
            
            setTimeout(() => {
              console.log("🧹 Clearing data after logout...");
              try {
                const currentRecipeState = window.mt ? window.mt() : null;
                window.e = {
                  rawMaterials: [],
                  directLabor: [],
                  recipes: [],
                  currency: window.tt || "₱",
                  currentRecipeState: currentRecipeState
                };
                
                if (window.vt) window.vt();
                if (window.mn) window.mn();
                if (window.In) window.In();
                if (window.Kn) window.Kn();
                if (window.zn) window.zn();
                
                Wt("🔒 Please login to access content", "info");
              } catch (error) {
                console.error("❌ Error clearing data after logout:", error);
                window.location.reload();
              }
            }, 100);
            break;
            
          case 'USER_UPDATED':
            console.log('👤 User updated');
            window.updateAuthUI && window.updateAuthUI();
            break;
            
          case 'TOKEN_REFRESHED':
            console.log('🔐 Token refreshed');
            break;
        }
      });

      return subscription;
    };
}

// =============================================================================
// ENHANCED DATA RECOVERY & PROTECTION FUNCTIONS
// =============================================================================

function hasMeaningfulData(data) {
    if (!data) return false;
    
    const hasRawMaterials = data.rawMaterials?.length > 0 && 
        data.rawMaterials.some(item => item.name && item.name.trim() !== '');

    const hasRecipes = data.recipes?.length > 0 && 
        data.recipes.some(recipe => recipe.name && recipe.name.trim() !== '');

    const hasDirectLabor = data.directLabor?.length > 0 && 
        data.directLabor.some(labor => labor.name && labor.name.trim() !== '');

    const hasCurrentRecipe = data.currentRecipeState && (
        (data.currentRecipeState.rawMaterialItems?.length > 0 && 
         data.currentRecipeState.rawMaterialItems.some(item => item.name && item.name.trim() !== '')) ||
        (data.currentRecipeState.directLaborItems?.length > 0 && 
         data.currentRecipeState.directLaborItems.some(item => item.name && item.name.trim() !== ''))
    );

    return hasRawMaterials || hasRecipes || hasDirectLabor || hasCurrentRecipe;
}

function attemptDataRecovery() {
    console.log("🔄 Attempting data recovery...");
    
    try {
        const backupData = localStorage.getItem('profitPerPlate_userData_backup');
        const currentData = localStorage.getItem('profitPerPlate_userData');
        
        const backupValid = backupData && backupData !== '{}' && backupData !== 'null';
        const currentEmpty = !currentData || currentData === '{}' || currentData === 'null';
        
        if (backupValid && currentEmpty) {
            console.log("✅ Restoring from backup - current data is empty");
            localStorage.setItem('profitPerPlate_userData', backupData);
            return { success: true, recovered: true };
        }
        
        if (backupValid && currentData) {
            const currentParsed = JSON.parse(currentData);
            const backupParsed = JSON.parse(backupData);
            
            const currentHasData = hasMeaningfulData(currentParsed);
            const backupHasData = hasMeaningfulData(backupParsed);
            
            if (backupHasData && !currentHasData) {
                console.log("✅ Restoring from backup - backup has meaningful data, current doesn't");
                localStorage.setItem('profitPerPlate_userData', backupData);
                return { success: true, recovered: true };
            }
        }
        
        console.log("📝 No recovery needed or backup unavailable");
        return { success: true, recovered: false };
    } catch (error) {
        console.error("❌ Data recovery failed:", error);
        return { success: false, error: error.message };
    }
}

async function initializeWithDataProtection() {
    console.log("🛡️ Initializing with enhanced data protection...");
    
    try {
        setupEnhancedAuthStateHandler();
        
        if (window.supabaseClient && window.supabaseClient.attemptDataRecovery) {
            const recoveryResult = await window.supabaseClient.attemptDataRecovery();
            if (recoveryResult.recovered) {
                console.log("✅ Data recovery completed during initialization");
                if (window.showNotification) {
                    window.showNotification("🔄 Recovered data from backup", "success");
                }
            }
        }
        
        await normalInitialization();
        
    } catch (error) {
        console.error("💥 Protected initialization failed:", error);
        await normalInitialization();
    }
}

// =============================================================================
// MANUAL SAVE SYSTEM - UPDATED FUNCTION
// =============================================================================

function setupEnhancedAutoSave() {
    console.log("🔧 Setting up MANUAL SAVE system - auto-save disabled");
    
    // KEEP ONLY the beforeunload warning for unsaved changes
    window.addEventListener("beforeunload", pt);
    
    // REMOVED: Auto-save triggers on input/change/click/blur
    // REMOVED: 15-second interval auto-save
    
    // KEEP data state monitoring for backup only (no auto-save)
    setupDataStateMonitoring();
    
    console.log("✅ Manual save system initialized - saves only on Add/Edit/Delete actions");
}

(function () {
  function buildMenuButtonIfMissing() {
    let menuButton = document.getElementById("settingsMenuButton");
    if (menuButton) return menuButton;

    const rightGroup = document.querySelector(".header .right-group") || document.querySelector(".header-top .right-group");
    const wrapper = document.createElement("div");
    wrapper.className = "header-item settings-menu";
    wrapper.style.marginLeft = "8px";

    menuButton = document.createElement("button");
    menuButton.id = "settingsMenuButton";
    menuButton.className = "header-icon-btn menu-toggle";
    menuButton.type = "button";
    menuButton.setAttribute("aria-label", "Menu");
    menuButton.title = "Menu";
    menuButton.style.display = "inline-flex";
    menuButton.style.alignItems = "center";
    menuButton.style.justifyContent = "center";

    menuButton.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';

    menuButton.style.width = "44px";
    menuButton.style.height = "44px";
    menuButton.style.borderRadius = "8px";

    wrapper.appendChild(menuButton);

    if (rightGroup) {
      rightGroup.appendChild(wrapper);
    } else {
      document.body.appendChild(wrapper);
      wrapper.style.position = "fixed";
      wrapper.style.top = "12px";
      wrapper.style.right = "12px";
      wrapper.style.zIndex = "1800";
    }

    return menuButton;
  }

  function createMenuModalIfMissing() {
    let menuModal = document.getElementById("menuModal");
    if (menuModal) {
      // ensure right-side positioning if there are legacy conflicting rules
      menuModal.style.left = "auto";
      menuModal.style.right = "0";
      menuModal.classList.add("menu-right");
      return menuModal;
    }

    menuModal = document.createElement("div");
    menuModal.id = "menuModal";
    menuModal.className = "modal hidden menu-modal menu-right";

    // Explicit inline styles to make it a right-side panel and avoid overrides
    menuModal.style.position = "fixed";
    menuModal.style.top = "0";
    menuModal.style.right = "0";
    menuModal.style.left = "auto";
    menuModal.style.height = "100vh";
    menuModal.style.width = "320px";
    menuModal.style.maxWidth = "100%";
    menuModal.style.zIndex = "1400";
    menuModal.style.boxSizing = "border-box";
    menuModal.style.overflow = "hidden";
    menuModal.style.display = "block"; // JS will toggle .hidden

    menuModal.innerHTML = `
      <div class="modal-content" role="dialog" aria-modal="true" aria-label="Menu" style="height:100%; display:flex; flex-direction:column;">
        <div class="modal-header" style="display:flex;justify-content:space-between;align-items:center;padding:12px;border-bottom:1px solid rgba(0,0,0,0.06);">
          <h3 style="margin:0;font-size:1rem;">Menu</h3>
          <button class="close-btn" aria-label="Close Menu" type="button" style="font-size:20px;line-height:1;background:transparent;border:none;cursor:pointer;">×</button>
        </div>
        <div class="menu-body" style="flex:1; overflow:auto; display:flex;flex-direction:column;gap:8px;padding:12px;"></div>
      </div>
    `;

    document.body.appendChild(menuModal);
    return menuModal;
  }

  function moveIntoMenuNode(node, menuBody) {
  if (!node || !menuBody) return null;
  // Already inside menu? No-op
  if (menuBody.contains(node)) return node;

  // Special-case: if the node is the auth-buttons container, move its button children
  // as individual full-width items so they stack and get menu spacing.
  try {
    const isAuthContainer = node.id === "authButtons" || node.classList && node.classList.contains("auth-buttons");
    if (isAuthContainer) {
      // If the container itself is already a child of menuBody (rare), just normalize child styles
      // Otherwise detach children and append them directly to menuBody so they become direct flex children.
      const buttons = Array.from(node.querySelectorAll("button"));
      if (buttons.length > 0) {
        buttons.forEach((child) => {
          // Move child into menu body
          try {
            menuBody.appendChild(child);
          } catch (e) {
            // If append fails, try a safe clone swap
            const clone = child.cloneNode(true);
            child.parentNode && child.parentNode.replaceChild(clone, child);
            menuBody.appendChild(clone);
            child = clone;
          }
          // Normalize display for menu
          child.style.display = "block";
          child.style.width = "100%";
          child.style.margin = "8px 0";
          child.style.boxSizing = "border-box";
          // Ensure button looks like a menu action
          if (!child.classList.contains("btn-primary")) child.classList.add("btn-primary");
          // Remove inline header-only margin-left to avoid odd alignment
          if (child.style.marginLeft) child.style.marginLeft = "";
        });
      }

      // Remove leftover empty container if it exists in DOM
      if (node.parentNode && node.parentNode !== menuBody) {
        try { node.parentNode.removeChild(node); } catch (e) { /* ignore */ }
      }
      return menuBody;
    }
  } catch (err) {
    console.warn("moveIntoMenuNode: auth container handling failed:", err);
  }

  // Generic node move (keeps most of original behavior)
  // If node is already inside the menuBody, return
  if (menuBody.contains(node)) return node;
  // Move the node into menu body to preserve event listeners
  try {
    menuBody.appendChild(node);
  } catch (err) {
    // fallback: clone and append
    const clone = node.cloneNode(true);
    node.parentNode && node.parentNode.replaceChild(clone, node);
    menuBody.appendChild(clone);
    node = clone;
  }

  // Normalize display and width to make buttons full-width
  if (node.tagName === "BUTTON" || node.tagName === "SELECT" || node.classList.contains("auth-buttons") || node.classList.contains("header-icon-btn") || node.id === "userInfo") {
    node.style.display = "block";
    node.style.width = "100%";
    node.style.margin = "6px 0";
    node.style.boxSizing = "border-box";
    // Make it look like a primary action if it's a button
    if (node.tagName === "BUTTON") {
      node.classList.add("btn-primary");
      node.style.padding = "10px 12px";
      node.style.borderRadius = "8px";
    }
  }
  return node;
}

  // Build menu button and modal if missing
  function safeQueryAll(selector) {
    if (!selector) return [];
    try {
      return Array.from(document.querySelectorAll(selector));
    } catch (e) {
      return [];
    }
  }

  function safeQuery(selector) {
    if (!selector) return null;
    let el = document.getElementById(selector.replace(/^#/, ""));
    if (el) return el;
    try { el = document.querySelector(selector); } catch (e) {}
    return el;
  }

  function isLoggedIn() {
    // Prefer canonical userInfo visibility or explicit email content
    const userInfo = document.getElementById("userInfo");
    const userEmail = document.getElementById("userEmail");
    if (userInfo && !userInfo.classList.contains("hidden") && userInfo.offsetParent !== null) return true;
    if (userEmail && userEmail.textContent && userEmail.textContent.trim().length > 0) return true;
    return false;
  }

  function hideHeaderDuplicates(selectors) {
    selectors.forEach((sel) => {
      safeQueryAll(sel).forEach((el) => {
        // If element is in header area and not already in the menu, hide it
        if (el.closest("header") || el.closest(".header")) {
          el.style.display = "none";
        }
      });
    });
  }

function syncAuthUI(menuBody) {
  try {
    // Safe fallback for menuBody
    menuBody = menuBody || document.querySelector('#menuModal .menu-body') || document.body;

    const loginNodes = safeQueryAll("#loginBtn, [data-role='open-login']");
    const signupNodes = safeQueryAll("#signupBtn, [data-role='open-signup']");
    const logoutNodes = safeQueryAll("#logoutBtn, [data-role='logout']");
    const userInfoNodes = safeQueryAll("#userInfo");
    const userEmailNodes = safeQueryAll("#userEmail");

    const loggedIn = isLoggedIn();
    const emailText = (userEmailNodes[0] && userEmailNodes[0].textContent.trim()) || "";

    // Ensure menuBody exists
    if (!menuBody) {
      console.warn("syncAuthUI: menuBody not found, aborting auth sync");
      return;
    }

    if (!loggedIn) {
      // Logged-out: show one login and one signup, hide logout

      // Hide logout nodes everywhere (header and menu)
      logoutNodes.forEach(n => { try { n.style.display = "none"; } catch(e){} });

      // Remove any lingering logout button inside the menu to guarantee exclusivity
      const logoutInMenu = menuBody.querySelector("#logoutBtn");
      if (logoutInMenu) {
        try { logoutInMenu.remove(); } catch(e) { logoutInMenu.style.display = "none"; }
      }

      // Ensure a single login button is present in the menu
      if (loginNodes.length > 0) {
        const primaryLogin = loginNodes[0];

        // If primaryLogin is part of the header container (auth-buttons), move its BUTTON children instead
        if (primaryLogin.id === "authButtons" || primaryLogin.classList && primaryLogin.classList.contains("auth-buttons")) {
          moveIntoMenuNode(primaryLogin, menuBody);
        } else {
          moveIntoMenuNode(primaryLogin, menuBody);
        }
        primaryLogin.style.display = "block";
      } else {
        // create fallback login button (ICON ONLY - NO TEXT)
        const fb = document.createElement("button");
        fb.id = "loginBtn";
        fb.className = "btn-primary";
        fb.type = "button";
        fb.setAttribute('data-role', 'open-login');
        fb.addEventListener("click", function () { 
          try { if (typeof Mt === "function") Mt(); } catch(e){} 
        });
        
        // Set icon only - NO TEXT
        fb.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>`;
        
        // Style for stretched icon-only button in menu
        fb.style.display = 'flex';
        fb.style.alignItems = 'center';
        fb.style.justifyContent = 'flex-start';
        fb.style.width = '100%';
        fb.style.padding = '12px 16px';
        fb.style.margin = '6px 0';
        fb.style.minHeight = '44px';
        fb.style.borderRadius = '10px';
        fb.style.background = '#34c759';
        fb.style.color = '#ffffff';
        fb.style.border = 'none';
        fb.style.cursor = 'pointer';
        fb.style.boxShadow = '0 6px 18px rgba(0,0,0,0.06)';
        fb.style.boxSizing = 'border-box';
        fb.title = 'Log in'; // Tooltip for accessibility
        
        moveIntoMenuNode(fb, menuBody);
      }

      if (!loggedIn) {
        // Make sure login/signup buttons are visible in the menu
        const menuModal = document.getElementById('menuModal');
        if (menuModal && menuModal.classList.contains('force-open')) {
            // Force auth buttons to be visible
            const loginBtn = menuBody.querySelector('#loginBtn');
            const signupBtn = menuBody.querySelector('#signupBtn');
            if (loginBtn) loginBtn.style.display = 'block';
            if (signupBtn) signupBtn.style.display = 'block';
        }
    }

      // Ensure a single signup button is present in the menu
      if (signupNodes.length > 0) {
        const primarySignup = signupNodes[0];
        moveIntoMenuNode(primarySignup, menuBody);
        primarySignup.style.display = "block";
      } else {
        const fs = document.createElement("button");
        fs.id = "signupBtn";
        fs.textContent = "Sign Up"; // Keep text for signup (different from login/logout)
        fs.className = "btn-primary";
        fs.type = "button";
        fs.addEventListener("click", function () { 
          try { nt = true; if (typeof Mt === "function") Mt(); } catch(e){} 
        });
        moveIntoMenuNode(fs, menuBody);
      }

      // Hide any login/signup duplicates in header (prevent showing them along with header auth area)
      hideHeaderDuplicates(["#loginBtn", "#signupBtn"]);

      // Ensure header userInfo (if exists) remains visible when logged out
      userInfoNodes.forEach(n => { try { n.style.display = ""; } catch(e){} });

      // Guarantee logout is not visible anywhere
      hideHeaderDuplicates(["#logoutBtn"]);
    } else {
      // Logged-in: hide login & signup everywhere, show only logout (and email)

      // Hide login & signup (all instances)
      loginNodes.forEach(n => { try { n.style.display = "none"; } catch(e){} });
      signupNodes.forEach(n => { try { n.style.display = "none"; } catch(e){} });

      // Remove any login/signup that accidentally got appended into the menu to avoid coexistence
      menuBody.querySelectorAll("#loginBtn, #signupBtn, [data-role='open-login'], [data-role='open-signup']").forEach(el => {
        try { if (el.parentNode === menuBody) el.parentNode.removeChild(el); else el.style.display = "none"; } catch(e) { try { el.style.display = "none"; } catch(_){} }
      });

      // Ensure at least one logout exists and move the first into menu
      if (logoutNodes.length > 0) {
        const primaryLogout = logoutNodes[0];
        moveIntoMenuNode(primaryLogout, menuBody);
        primaryLogout.style.display = "block";
      } else {
        // fallback logout button (ICON ONLY - NO TEXT)
        const fo = document.createElement("button");
        fo.id = "logoutBtn";
        fo.className = "btn-primary";
        fo.type = "button";
        fo.setAttribute('data-role', 'logout');
        fo.addEventListener("click", function () { 
          try { if (typeof qt === "function") qt(); } catch(e){} 
        });
        
        // Set icon only - NO TEXT
        fo.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
          <polyline points="10 7 5 12 10 17" />
          <line x1="5" y1="12" x2="17" y2="12" />
        </svg>`;
        
        // Style for stretched icon-only button in menu
        fo.style.display = 'flex';
        fo.style.alignItems = 'center';
        fo.style.justifyContent = 'flex-start';
        fo.style.width = '100%';
        fo.style.padding = '12px 16px';
        fo.style.margin = '6px 0';
        fo.style.minHeight = '44px';
        fo.style.borderRadius = '10px';
        fo.style.background = '#ff3b30';
        fo.style.color = '#ffffff';
        fo.style.border = 'none';
        fo.style.cursor = 'pointer';
        fo.style.boxShadow = '0 6px 18px rgba(0,0,0,0.06)';
        fo.style.boxSizing = 'border-box';
        fo.title = 'Log out'; // Tooltip for accessibility
        
        moveIntoMenuNode(fo, menuBody);
      }

      // Add or update menu email row (single)
      let menuEmailRow = document.getElementById("menuUserEmail");
      if (!menuEmailRow) {
        menuEmailRow = document.createElement("div");
        menuEmailRow.id = "menuUserEmail";
        menuEmailRow.style.padding = "8px 12px";
        menuEmailRow.style.borderRadius = "8px";
        menuEmailRow.style.background = "transparent";
        menuEmailRow.style.color = "var(--text-primary)";
        menuEmailRow.style.wordBreak = "break-all";
        menuEmailRow.style.fontSize = "0.95rem";
        menuEmailRow.style.textAlign = "center";
        menuEmailRow.style.margin = "8px 0";
      }
      menuEmailRow.textContent = emailText || "Signed in";
      // Insert it before the logout button if exists
      const logoutInMenu = menuBody.querySelector("#logoutBtn");
      if (logoutInMenu) {
        if (menuEmailRow.parentNode !== menuBody) menuBody.insertBefore(menuEmailRow, logoutInMenu);
      } else {
        if (menuEmailRow.parentNode !== menuBody) menuBody.insertBefore(menuEmailRow, menuBody.firstChild);
      }

      // Hide header userInfo nodes (avoid duplication)
      userInfoNodes.forEach(n => { try { n.style.display = "none"; } catch(e){} });
      userEmailNodes.forEach(n => { try { n.style.display = "none"; } catch(e){} });

      // Hide duplicates of login/signup in headers
      hideHeaderDuplicates(["#loginBtn", "#signupBtn"]);
    }

    // Final cleanup: ensure we never have both logout and (login|signup) present in menu body
    try {
      const hasLogout = !!menuBody.querySelector('#logoutBtn');
      const hasLogin = !!menuBody.querySelector('#loginBtn') || !!menuBody.querySelector("[data-role='open-login']");
      const hasSignup = !!menuBody.querySelector('#signupBtn') || !!menuBody.querySelector("[data-role='open-signup']");

      if (hasLogout && (hasLogin || hasSignup)) {
        // If somehow both exist, prefer logout (user is signed in). Remove login/signup from menu.
        menuBody.querySelectorAll('#loginBtn, #signupBtn, [data-role="open-login"], [data-role="open-signup"]').forEach(el => {
          try { if (el.parentNode === menuBody) el.parentNode.removeChild(el); else el.style.display = "none"; } catch(e) { try { el.style.display = "none"; } catch(_){} }
        });
      }
    } catch (cleanupErr) {
      console.warn("syncAuthUI cleanup check failed:", cleanupErr);
    }

    // Ensure there are no second copies visible in header for logout as well
    hideHeaderDuplicates(["#logoutBtn"]);
  } catch (err) {
    console.error("syncAuthUI failed:", err);
  }
}

  // Main function
  function setupSettingsDropdown() {
    try {
      console.log("🔧 setupSettingsDropdown(): initializing...");

      const menuButton = buildMenuButtonIfMissing();
      const menuModal = createMenuModalIfMissing();
      const menuBody = menuModal.querySelector(".menu-body");
      const closeBtn = menuModal.querySelector(".close-btn");

      // Canonical controls to move (if present)
      const toMove = [
        "#authButtons",
        "#loginBtn",
        "#signupBtn",
        "#logoutBtn",
        "#darkModeToggle",
        "#currencySelect",
        "#helpBtn",
        ".settings-menu .dropdown-menu",
        "#settingsDropdown",
        "#userInfo",
        "#userEmail"
      ];

      // Move the first instances we find (moveIntoMenuNode ignores nodes already in menu)
      toMove.forEach((sel) => {
        try {
          const nodes = safeQueryAll(sel);
          if (nodes.length > 0) moveIntoMenuNode(nodes[0], menuBody);
        } catch (e) { /* ignore individual failures */ }
      });

      // Run initial sync
      syncAuthUI(menuBody);

      // ADD THIS LINE: Add install app button to menu
addInstallButtonToMenu(menuBody);

      // Observe auth-related changes to resync UI
      (function observeAuthChanges() {
        const watchTargets = [];
        const userInfo = document.getElementById("userInfo");
        const userEmail = document.getElementById("userEmail");
        if (userInfo) watchTargets.push(userInfo);
        if (userEmail) watchTargets.push(userEmail);
        // fallback to body if none exist
        const target = watchTargets.length ? watchTargets[0] : document.body;

        const observer = new MutationObserver(() => {
          try { syncAuthUI(menuBody); } catch (e) { console.warn("syncAuthUI error:", e); }
        });

        observer.observe(target, { attributes: true, childList: true, subtree: true, characterData: true });
        window.__menuAuthObserver = observer;
      })();

      // Toggle handler: show/hide menu modal
      function toggleMenu(e) {
        if (e) { 
          e.preventDefault(); 
          e.stopPropagation(); 
        }
        
        const menuModal = document.getElementById('menuModal');
        const authModal = document.getElementById('authModal');
        
        if (!menuModal) return;
        
        // If auth modal is open, don't toggle menu
        if (authModal && !authModal.classList.contains('hidden')) {
            console.log("🔒 Auth modal is open - menu toggle blocked");
            return;
        }
        
        // Check if modal is forced open (user logged out)
        if (menuModal.classList.contains('force-open')) {
            console.log("🔒 Menu is forced open - cannot be closed");
            // Ensure it stays open
            menuModal.classList.remove('hidden');
            document.body.style.overflow = "hidden";
            freshMenuButton.setAttribute("aria-expanded", "true");
            return;
        }
        
        // Normal toggle behavior for logged-in users
        menuModal.classList.toggle("hidden");
        if (!menuModal.classList.contains("hidden")) {
          document.body.style.overflow = "hidden";
          freshMenuButton.setAttribute("aria-expanded", "true");
        } else {
          document.body.style.overflow = "";
          freshMenuButton.setAttribute("aria-expanded", "false");
        }
      }

      // Replace previous handlers safely
      menuButton.replaceWith(menuButton.cloneNode(true));
      const freshMenuButton = document.getElementById("settingsMenuButton");
      if (freshMenuButton) {
        freshMenuButton.addEventListener("click", toggleMenu);
        freshMenuButton.setAttribute("aria-expanded", "false");
        // update aria-expanded when menu toggles (no transition used)
        const observer = new MutationObserver(() => {
          freshMenuButton.setAttribute("aria-expanded", !menuModal.classList.contains("hidden"));
        });
        observer.observe(menuModal, { attributes: true, attributeFilter: ["class"] });
      }

      // Close button inside modal
      if (closeBtn) {
        closeBtn.addEventListener("click", function (ev) {
          const menuModal = document.getElementById('menuModal');
          // Don't close if menu is forced open
          if (menuModal && menuModal.classList.contains('force-open')) {
            ev.preventDefault();
            ev.stopPropagation();
            console.log("🔒 Menu is forced open - cannot be closed");
            return;
          }
          ev.preventDefault();
          menuModal.classList.add("hidden");
          document.body.style.overflow = "";
          freshMenuButton.setAttribute("aria-expanded", "false");
        });
      }

      // Hide menu when clicking outside
      document.addEventListener("click", function (ev) {
        const menuModal = document.getElementById('menuModal');
        const authModal = document.getElementById('authModal');
        
        if (!menuModal) return;
        
        // If auth modal is open, don't handle menu clicks
        if (authModal && !authModal.classList.contains('hidden')) {
            // Let auth modal handle its own clicks
            if (!ev.target.closest("#authModal")) {
                return;
            }
        }
        
        // If menu is forced open, prevent ALL closing attempts
        if (menuModal.classList.contains('force-open')) {
            ev.preventDefault();
            ev.stopPropagation();
            return;
        }
        
        // Normal behavior for logged-in users
        if (menuModal.classList.contains("hidden")) return;
        if (ev.target.closest("#menuModal")) return;
        if (ev.target.closest("#settingsMenuButton")) return;
        
        menuModal.classList.add("hidden");
        document.body.style.overflow = "";
        if (freshMenuButton) {
          freshMenuButton.setAttribute("aria-expanded", "false");
        }
      });

      // Ensure Help/Auth open above the menu by hiding the menu before opening them
      const helpEls = safeQueryAll("#helpBtn, [data-role='open-help']");
      helpEls.forEach(h => h.addEventListener("click", function () { 
        const menuModal = document.getElementById('menuModal');
        if (menuModal && !menuModal.classList.contains('force-open')) {
          menuModal.classList.add("hidden"); 
        }
        document.body.style.overflow = ""; 
      }));

      // Update login button handler
      const loginEls = safeQueryAll("#loginBtn, [data-role='open-login']");
      loginEls.forEach(l => l.addEventListener("click", function (e) {
          if (e) {
              e.preventDefault();
              e.stopPropagation();
          }
          
          console.log("🔑 Login button clicked - opening auth modal");
          const menuModal = document.getElementById('menuModal');
          const authModal = document.getElementById('authModal');
          
          // Don't hide menu modal if it's forced open (logged out state)
          if (menuModal && menuModal.classList.contains('force-open')) {
              console.log("📊 Menu is forced open - setting z-index for auth modal");
              // Set menu modal z-index lower so auth modal appears on top
              menuModal.style.zIndex = '1000';
              // Ensure menu modal stays visible but behind
              menuModal.classList.remove('hidden');
              document.body.style.overflow = "hidden";
          } else {
              // Normal behavior for logged-in users
              menuModal.classList.add("hidden");
              document.body.style.overflow = "";
          }
          
          // Open auth modal
          if (typeof Mt === "function") {
              nt = false;
              Mt(); // This will open the auth modal with higher z-index
          }
      }));

      // Update signup button handler
      const signupEls = safeQueryAll("#signupBtn, [data-role='open-signup']");
      signupEls.forEach(s => s.addEventListener("click", function (e) {
          if (e) {
              e.preventDefault();
              e.stopPropagation();
          }
          
          console.log("📝 Signup button clicked - opening auth modal");
          const menuModal = document.getElementById('menuModal');
          const authModal = document.getElementById('authModal');
          
          // Don't hide menu modal if it's forced open (logged out state)
          if (menuModal && menuModal.classList.contains('force-open')) {
              console.log("📊 Menu is forced open - setting z-index for auth modal");
              // Set menu modal z-index lower so auth modal appears on top
              menuModal.style.zIndex = '1000';
              // Ensure menu modal stays visible but behind
              menuModal.classList.remove('hidden');
              document.body.style.overflow = "hidden";
          } else {
              // Normal behavior for logged-in users
              menuModal.classList.add("hidden");
              document.body.style.overflow = "";
          }
          
          // Open auth modal
          if (typeof Mt === "function") {
              nt = true;
              Mt(); // This will open the auth modal with higher z-index
          }
      }));

      const logoutEls = safeQueryAll("#logoutBtn, [data-role='logout']");
      logoutEls.forEach(o => o.addEventListener("click", function () { 
        const menuModal = document.getElementById('menuModal');
        if (menuModal && !menuModal.classList.contains('force-open')) {
          menuModal.classList.add("hidden"); 
        }
        document.body.style.overflow = ""; 
        try { if (typeof qt === "function") qt(); } catch(e){} 
      }));

      // Expose for debugging
      window.__menuModal = menuModal;
      console.log("✅ setupSettingsDropdown(): menu initialized (right-side panel).");
      return menuModal;
    } catch (err) {
      console.error("❌ setupSettingsDropdown() failed:", err);
    }
  }

  // Auth modal close button handler - ensures proper modal stacking
function setupAuthModalCloseHandler() {
    const authCloseBtn = document.querySelector('#authModal .close-btn');
    if (authCloseBtn) {
        console.log("🔧 Setting up auth modal close handler");
        
        // Remove any existing event listeners by cloning
        const newAuthCloseBtn = authCloseBtn.cloneNode(true);
        authCloseBtn.parentNode.replaceChild(newAuthCloseBtn, authCloseBtn);
        
        // Add new event listener
        newAuthCloseBtn.addEventListener('click', function(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            console.log("❌ Auth modal close clicked");
            const menuModal = document.getElementById('menuModal');
            const authModal = document.getElementById('authModal');
            
            // Close auth modal
            if (authModal) {
                authModal.classList.add('hidden');
                authModal.style.zIndex = '';
            }
            
            // Restore menu modal z-index and visibility if forced open
            if (menuModal && menuModal.classList.contains('force-open')) {
                console.log("🔁 Restoring menu modal to top after auth close");
                menuModal.style.zIndex = '1000';
                menuModal.classList.remove('hidden');
                document.body.style.overflow = "hidden";
            } else if (menuModal) {
                // For logged-in users, close menu modal too
                menuModal.classList.add('hidden');
                document.body.style.overflow = "";
            }
            
            // Also call the original kt() function if it exists
            if (typeof kt === "function") {
                kt();
            }
        });
    } else {
        console.warn("⚠️ Auth modal close button not found");
    }
}

// Initialize auth modal close handler when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(setupAuthModalCloseHandler, 1000);
});

// Also initialize after any auth modal is shown
const authModalObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.attributeName === 'class') {
            const authModal = document.getElementById('authModal');
            if (authModal && !authModal.classList.contains('hidden')) {
                setTimeout(setupAuthModalCloseHandler, 100);
            }
        }
    });
});

const authModal = document.getElementById('authModal');
if (authModal) {
    authModalObserver.observe(authModal, { attributes: true });
}

  // Expose the function so typeof returns 'function'
  window.setupSettingsDropdown = setupSettingsDropdown;

  // Helper to keep the button pinned nicely on resize/scroll
  window.ensureMenuButtonPosition = function ensureMenuButtonPosition() {
    try {
      const adjust = function () {
        const btn = document.getElementById("settingsMenuButton");
        if (!btn) return;
        btn.style.position = "fixed";
        btn.style.top = window.innerWidth <= 480 ? "8px" : "12px";
        btn.style.right = window.innerWidth <= 480 ? "8px" : "12px";
        btn.style.zIndex = "1800";
      };
      adjust();
      window.addEventListener("resize", adjust);
      window.addEventListener("orientationchange", adjust);
      window.addEventListener("scroll", adjust, { passive: true });
    } catch (e) {
      console.warn("ensureMenuButtonPosition error:", e);
    }
  };

  // No auto-run here — caller must call setupSettingsDropdown() during init.
})();

function ensureMenuButtonPosition() {
  // Insert this function immediately AFTER the setupSettingsDropdown() replacement above.
  // Purpose: on resize/scroll ensure menu stays pinned to top-right corner appropriately.
  try {
    const pin = function () {
      const menuButton = document.querySelector(".header .settings-menu button") || document.getElementById("settingsMenuButton") || document.querySelector(".settings-menu button");
      if (!menuButton) return;
      // On large screens we keep fixed top-right; on very small screens make sure it doesn't overlap UI
      if (window.innerWidth <= 480) {
        menuButton.style.top = "8px";
        menuButton.style.right = "8px";
        menuButton.style.width = "40px";
        menuButton.style.height = "40px";
      } else {
        menuButton.style.top = "12px";
        menuButton.style.right = "12px";
        menuButton.style.width = "44px";
        menuButton.style.height = "44px";
      }
      // Keep the button above header (but below modal z-index)
      try { menuButton.style.zIndex = "1800"; } catch (e) {}
    };

    // Run once and on resize/scroll
    pin();
    window.addEventListener("resize", pin);
    window.addEventListener("orientationchange", pin);
    window.addEventListener("scroll", function () {
      // ensure still pinned
      pin();
    }, { passive: true });
  } catch (err) {
    console.warn("ensureMenuButtonPosition() failed:", err);
  }
}

function setupDataStateMonitoring() {
    let lastDataState = null;
    
    setInterval(() => {
        const currentData = localStorage.getItem('profitPerPlate_userData');
        if (lastDataState !== currentData) {
            console.log("🔍 Data state changed - creating monitoring backup");
            lastDataState = currentData;
            
            try {
                if (currentData) {
                    localStorage.setItem('profitPerPlate_userData_monitoring', currentData);
                }
            } catch (e) {
                console.warn("⚠️ Monitoring backup failed:", e);
            }
        }
    }, 30000);
}

function showDataOperationNotification(message, type = "info") {
    console.log(`📊 Data Operation: ${message}`);
    Wt(message, type);
}

// =============================================================================
// UI CONSISTENCY FIX: ADDED verifyUIElements FUNCTION
// =============================================================================

function verifyUIElements() {
  const requiredElements = {
    savedRecipesHeading: '.saved-recipes-heading',
    tipMessage: '.tip-message',
    currentRecipeNameDisplay: '#currentRecipeNameDisplay',
    laborSectionHeading: '.labor-section h4'
  };
  
  Object.entries(requiredElements).forEach(([key, selector]) => {
    const element = document.querySelector(selector);
    if (!element) {
      console.warn(`⚠️ UI element not found: ${key} (${selector})`);
    } else {
      console.log(`✅ UI element found: ${key}`);
    }
  });
}

// =============================================================================
// NAVIGATION SYSTEM
// =============================================================================

// =============================================================================
// ENHANCED CASCADE TRIGGER FUNCTION - REPLACES Ot()
// =============================================================================

function Ot(updatedMasterItem, masterType) {
  try {
    console.log(`🚀 Enhanced Cascade Trigger for: ${updatedMasterItem?.name} (${masterType})`);

    // 1. Sync details (names, basic units)
    if (window.CascadeSystem && window.CascadeSystem.synchronizeMasterItemDetails) {
       window.CascadeSystem.synchronizeMasterItemDetails(
         masterType === 'rawMaterial' ? window.e.rawMaterials : window.e.directLabor, 
         masterType
       );
    }

    // 2. RUN THE BULLETPROOF CASCADE
    let updatedCount = 0;
    if (window.CascadeSystem && window.CascadeSystem.recalculateAllRecipesOnMasterChange) {
        updatedCount = window.CascadeSystem.recalculateAllRecipesOnMasterChange();
    }

    // 3. PERSISTENCE
    if (typeof ct === "function") {
        console.log("💾 Auto-saving updated calculations...");
        ct(); 
    }

    // 4. COMPREHENSIVE UI REFRESH
    console.log("🎨 Refreshing all UI components...");
    setTimeout(() => {
        if (typeof Fn === "function") Fn(); // Refreshes Recipe List (Cards)
        if (typeof mn === "function") mn(); // Refreshes Dropdowns
        if (typeof Kn === "function") Kn(); // Refreshes Summary Selects
        if (typeof zn === "function") zn(); // Refreshes Current Recipe Totals
        
        // Refresh any loaded recipe in summary
        if (n && typeof Gn === "function") Gn();
    }, 100);

    if (typeof Wt === "function" && updatedCount > 0) {
      Wt(`Automatically updated costs across ${updatedCount} recipes/sub-recipes`, "success");
    }

    return updatedCount;

  } catch (err) {
    console.error("❌ Error in Ot (Enhanced Cascade Trigger):", err);
    return 0;
  }
}

function at() {
  Ze &&
    Ze.length > 0 &&
    (Ze.forEach((e) => {
      const t = e.cloneNode(!0);
      e.parentNode.replaceChild(t, e);
      t.addEventListener("click", function (e) {
        e.preventDefault(),
          e.stopPropagation(),
          console.log("💻 Direct sidebar click:", this.dataset.tab),
          it(this.dataset.tab);
      });
    }),
    (Ze = document.querySelectorAll(".sidebar-btn"))),
    et &&
      et.length > 0 &&
      (et.forEach((e) => {
        const t = e.cloneNode(!0);
        e.parentNode.replaceChild(t, e);
        t.addEventListener("click", function (e) {
          e.preventDefault(),
            e.stopPropagation(),
            console.log("📱 Direct mobile tab click:", this.dataset.tab),
            it(this.dataset.tab);
        });
      }),
      (et = document.querySelectorAll(".mobile-tabs .tab-btn")));
}

function it(e) {
  console.log("🔄 Switching to tab:", e);
  if (["raw-materials", "direct-labor", "recipes", "summary"].includes(e)) {
    if (
      (document.querySelectorAll(".sidebar-btn").forEach((t) => {
        t.classList.toggle("active", t.dataset.tab === e);
      }),
      document.querySelectorAll(".mobile-tabs .tab-btn").forEach((t) => {
        t.classList.toggle("active", t.dataset.tab === e);
      }),
      document.querySelectorAll(".tab-content").forEach((t) => {
        t.classList.toggle("active", t.id === `${e}-tab`);
      }),
      "summary" !== e && A)
    ) {
      const e = parseFloat(A.value) || 1;
      1 !== e &&
        (console.log(
          `INFO: Auto-resetting Serving Scale from ${e} to 1 when leaving Summary tab`
        ),
        (A.value = 1),
        n && (Yn(), Gn()));
    }
    "summary" === e && (n ? Gn() : _n()),
      dt(),
      console.log("✅ Successfully switched to tab:", e);
  } else console.error("❌ Invalid tab name:", e);
}

// =============================================================================
// DATA STORAGE AND MANUAL SAVE FUNCTIONS
// =============================================================================

function rt() {
  try {
    console.log("📥 Attempting to load data from local storage...");
    const t = localStorage.getItem("profitPerPlate_userData");
    if (t) {
      const n = JSON.parse(t);
      console.log("✅ Loaded user data from local storage");
      const o = s(n);
      // Preserve existing shape but overwrite e
      e = {
        rawMaterials: [],
        directLabor: [],
        recipes: [],
        currency: "₱",
        currentRecipeState: null,
        ...o
      };

      // adopt currency into global shorthand
      tt = e.currency || "₱";

      // set select and visually update UI to use current currency
      if (w) {
        try {
          w.value = tt;
        } catch (err) {
          console.warn("rt(): failed to set currency select value", err);
        }
      }

      // Ensure currency is applied across any static placeholders or text nodes
      if (typeof updateCurrencySymbol === "function") {
        try {
          updateCurrencySymbol(tt);
        } catch (err) {
          console.warn("rt(): updateCurrencySymbol failed during load", err);
        }
      }

      // Run existing refreshers to rebuild UI with loaded data
      vt();
      mn();
      In();
      Kn();
      At();
      zn();

      return e;
    }
    console.log("📝 No existing local data found");
    return null;
  } catch (e) {
    console.error("❌ Error loading from local storage:", e);
    return null;
  }
}

function lt() {
  console.log("🧹 Performing safe local data clearance...");
  const t = mt();
  ["profitPerPlate_userData"].forEach((e) => {
    localStorage.removeItem(e);
  }),
    (e = {
      rawMaterials: [],
      directLabor: [],
      recipes: [],
      currency: tt,
      currentRecipeState: t
    }),
    vt(),
    mn(),
    In(),
    Kn(),
    console.log("✅ Safe data clearance completed - current work preserved");
}

function st() {
  console.log("🔧 Setting up enhanced manual save system...");
  
  try {
    const currentData = localStorage.getItem('profitPerPlate_userData');
    if (currentData) {
      localStorage.setItem('profitPerPlate_userData_initial_backup', currentData);
      console.log("💾 Initial backup created");
    }
  } catch (e) {
    console.warn("⚠️ Initial backup failed:", e);
  }
  
  // REMOVED: Auto-save event listeners for input/change/click/blur
  
  window.addEventListener("beforeunload", pt),
    
  setupDataStateMonitoring(),
    
  console.log("✅ Enhanced manual save system initialized");
}

function ct() {
  const t = mt();
  (e.currentRecipeState = t),
    localStorage.setItem(
      "profitPerPlate_recipeState",
      JSON.stringify({
        ...t,
        lastSaved: new Date().toISOString(),
        savedSync: !0
      })
    );
  const n = c();
  window.supabaseClient &&
    window.supabaseClient.isAuthenticated() &&
    setTimeout(() => {
      (async function (e, t = 3) {
        for (let n = 1; n <= t; n++)
          try {
            console.log(`🔄 Manual cloud save attempt ${n}/${t}...`),
              Qt("Saving…", "sync");
            const o = await window.supabaseClient.saveUserData(e);
            if (o && !0 === o.cloud)
              return (
                console.log(`✅ Manual cloud save successful on attempt ${n}`),
                Qt("Synced", "success"),
                o.queuedCount &&
                  Wt(
                    `Saved to cloud. ${o.queuedCount} queued item(s) remain.`,
                    "info"
                  ),
                o
              );
            if (o && !0 === o.queued)
              return (
                console.warn(
                  "⚠️ Manual cloud save failed, payload queued for retry:",
                  o
                ),
                Qt("Saved locally (queued for sync)", "warning"),
                o
              );
            if (o && !0 === o.local && !o.queued)
              return (
                console.warn("⚠️ Saved locally only (cloud unavailable)"),
                Qt("Saved locally (cloud unavailable)", "warning"),
                o
              );
            if (!(n < t))
              throw (
                (console.error(`❌ Manual cloud save failed after ${t} attempts`),
                new Error("Manual cloud save failed after retries"))
              );
            {
              const e = 1e3 * Math.pow(2, n);
              console.log(`⏳ Manual cloud save failed, retrying in ${e}ms...`),
                await new Promise((t) => setTimeout(t, e));
            }
          } catch (o) {
            if (
              (console.error(`💥 Manual cloud save error on attempt ${n}:`, o),
              n === t)
            ) {
              console.log("💾 Falling back to local storage");
              try {
                localStorage.setItem(
                  "profitPerPlate_userData",
                  JSON.stringify({
                    ...e,
                    savedLocally: !0,
                    cloudSaveFailed: !0,
                    lastSaved: new Date().toISOString()
                  })
                ),
                  Qt(
                    "Saved locally (cloud sync failed). Retry will be attempted automatically.",
                    "warning"
                  );
              } catch (e) {
                console.error("Failed to write local fallback:", e),
                  Qt("Local save failed (see console)", "error");
              }
              return { success: !0, local: !0, cloudFailed: !0 };
            }
          }
      })(n).then((e) => {
        e.cloudFailed
          ? Wt("⚠️ Saved locally (cloud sync failed)", "warning")
          : console.log("✅ Manual cloud save completed successfully");
      });
    }, 100);
}

function dt() {
  // REMOVED: Auto-save timeout functionality
  // Manual save system - no automatic saves on input changes
}

function ut() {
  const e = mt(),
    t = JSON.parse(localStorage.getItem("profitPerPlate_recipeState") || "{}");
  return JSON.stringify(e) !== JSON.stringify(t);
}

function pt(e) {
  ut() &&
    (function () {
      const e = mt();
      localStorage.setItem(
        "profitPerPlate_recipeState",
        JSON.stringify({
          ...e,
          lastSaved: new Date().toISOString(),
          savedSync: !0
        })
      );
      const t = c();
      window.supabaseClient &&
        window.supabaseClient.isAuthenticated() &&
        setTimeout(() => window.supabaseClient.saveUserData(t), 100);
    })();
}

function mt() {
  const e = [],
    t = [];
  return (
    f &&
      f.querySelectorAll("tr").forEach((t) => {
        const n = t.children[0].querySelector("input").value,
          o = parseFloat(t.children[1].querySelector("input").value) || 0,
          a = t.children[1].querySelector(".quantity-unit")?.textContent || "g",
          i = parseFloat(t.children[2].querySelector("input").value) || 0,
          r = t.dataset.type || "rawMaterial",
          l = t.dataset.subRecipeId || null;
        ("rawMaterial" !== r && "sub-recipe" !== r) ||
          e.push({
            name: n,
            quantity: o,
            unit: a,
            unitCost: i,
            type: r,
            subRecipeId: l
          });
      }),
    y &&
      y.querySelectorAll("tr").forEach((e) => {
        const n = e.children[0].querySelector("input").value,
          o = parseFloat(e.children[1].querySelector("input").value) || 0,
          a =
            e.children[1].querySelector(".quantity-unit")?.textContent ||
            "hours",
          i = parseFloat(e.children[2].querySelector("input").value) || 0;
        t.push({ name: n, quantity: o, unit: a, unitCost: i });
      }),
    {
      recipeName: x ? x.value : "",
      rawMaterialItems: e,
      directLaborItems: t,
      markup: parseFloat(U ? U.value : 40) || 40,
      tax: parseFloat(T ? T.value : 0) || 0,
      vat: parseFloat(q ? q.value : 0) || 0,
      servings: parseFloat(D ? D.value : 1) || 1,
      servingScale: parseFloat(A ? A.value : 1) || 1,
      currentTab: bt(),
      lastSaved: new Date().toISOString(),
      version: "2.0"
    }
  );
}

function gt() {
  if (
    (console.log("📥 Loading recipe state with fallback..."),
    window.supabaseClient && window.supabaseClient.isAuthenticated())
  )
    Dt();
  else {
    const e = localStorage.getItem("profitPerPlate_recipeState");
    if (e)
      try {
        !(function (e) {
          if (!e) return;
          x && (x.value = e.recipeName || "");
          U && (U.value = e.markup || 40);
          T && (T.value = e.tax || 0);
          q && (q.value = e.vat || 0);
          D && (D.value = e.servings || 1);
          A && (A.value = e.servingScale || 1);
          f && (f.innerHTML = "");
          y && (y.innerHTML = "");
          e.rawMaterialItems &&
            e.rawMaterialItems.forEach((e) => {
              gn(
                e.name,
                e.quantity,
                e.unit,
                e.unitCost,
                e.type || "rawMaterial",
                e.subRecipeId || null
              );
            });
          e.directLaborItems &&
            e.directLaborItems.forEach((e) => {
              const t = e.unitCost ?? e.rate ?? 0,
                n = e.unit ?? e.timeUnit ?? "hours";
              fn(e.name, e.quantity, n, t);
            });
          zn();
        })(JSON.parse(e)),
          console.log("✅ Loaded recipe state from local storage");
      } catch (e) {
        console.error("❌ Error loading from local storage:", e), ft();
      }
    else ft();
  }
}

function ft() {
  console.log("📝 Loading default recipe state"),
    x && (x.value = ""),
    D && (D.value = "1"),
    A && (A.value = "1"),
    U && (U.value = "40"),
    T && (T.value = "0"),
    q && (q.value = "0"),
    f && (f.innerHTML = ""),
    y && (y.innerHTML = ""),
    zn();
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function yt(e) {
  const t = document.getElementById(e);
  return t || console.warn(`⚠️ DOM element not found: ${e}`), t;
}

function bt() {
  const e = document.querySelector(".tab-content.active");
  return e ? e.id.replace("-tab", "") : "raw-materials";
}

function vt() {
  en(), un(), Fn();
}

function ht() {
  const e = document.body.classList.toggle("dark-mode");
  localStorage.setItem("profitPerPlate_theme", e ? "dark" : "light");
  const t = document.querySelector("#darkModeToggle svg");
  t.innerHTML = e
    ? '<path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="23"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'
    : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
}

// =============================================================================
// AUTHENTICATION FUNCTIONS
// =============================================================================

function wt() {
  kt(), $e.classList.remove("hidden");
}

function xt() {
  $e.classList.add("hidden"),
    (Ie.value = ""),
    Me.classList.add("hidden"),
    Fe.classList.add("hidden");
}

async function Ct() {
  const e = Ie.value.trim();
  if (!e) return void Et("Please enter your email address");
  (ke.disabled = !0), (ke.textContent = "Sending...");
  const t = await window.supabaseClient.resetPassword(e);
  (ke.disabled = !1),
    (ke.textContent = "Send Reset Link"),
    t.success
      ? ((Fe.textContent =
          "Password reset email sent! Check your inbox for further instructions."),
        Fe.classList.remove("hidden"),
        Me.classList.add("hidden"),
        // START: Fix Insertion
        initiateTimedReload()
        // END: Fix Insertion
        )
      : Et(t.error);
}

function Et(e) {
  (Me.textContent = e),
    Me.classList.remove("hidden"),
    Fe.classList.add("hidden");
}

function Lt() {
  Rt(),
    document.getElementById("resetPasswordModal").classList.remove("hidden");
}

function St() {
  document.getElementById("resetPasswordModal").classList.add("hidden"),
    document.getElementById("resetPasswordForm").reset(),
    document.getElementById("resetPasswordError").classList.add("hidden"),
    document.getElementById("resetPasswordSuccess").classList.add("hidden");
}

async function Pt() {
  const e = document.getElementById("newPassword").value,
    t = document.getElementById("confirmPassword").value;
  if (!e || !t) return void $t("Please enter both fields");
  if (e.length < 6)
    return void $t("Password must be at least 6 characters long");
  if (e !== t) return void $t("Passwords do not match");
  const n = document.getElementById("submitResetPasswordBtn");
  (n.disabled = !0), (n.textContent = "Resetting...");
  const { data: o, error: a } =
    await window.supabaseClient.supabase.auth.updateUser({ password: e });
  (n.disabled = !1),
    (n.textContent = "Reset Password"),
    a
      ? $t(a.message)
      : (document.getElementById("resetPasswordError").classList.add("hidden"),
        (document.getElementById("resetPasswordSuccess").textContent =
          "Password reset successfully! You can now log in with your new password."),
        document
          .getElementById("resetPasswordSuccess")
          .classList.remove("hidden"),
        setTimeout(() => {
          St(), Mt();
        }, 2e3));
}

function $t(e) {
  const t = document.getElementById("resetPasswordError");
  (t.textContent = e),
    t.classList.remove("hidden"),
    document.getElementById("resetPasswordSuccess").classList.add("hidden");
}

function Rt() {
  document.querySelectorAll(".modal").forEach((e) => {
    e.classList.add("hidden");
  });
}

function It() {
  console.log("🚀 Initializing authentication system..."),
    Ue
      ? (console.log("🔧 Setting up login button..."),
        Ue.replaceWith(Ue.cloneNode(!0)),
        (Ue = document.getElementById("loginBtn")),
        Ue.addEventListener("click", function (e) {
          e.preventDefault(),
            e.stopPropagation(),
            console.log("🔑 Login button clicked"),
            (nt = !1),
            Mt();
        }),
        console.log("✅ Login button listener attached successfully"))
      : console.warn("⚠️ Login button not found during auth initialization"),
    qe
      ? (console.log("🔧 Setting up signup button..."),
        qe.replaceWith(qe.cloneNode(!0)),
        (qe = document.getElementById("signupBtn")),
        qe.addEventListener("click", function (e) {
          e.preventDefault(),
            e.stopPropagation(),
            console.log("📝 Signup button clicked"),
            (nt = !0),
            Mt();
        }),
        console.log("✅ Signup button listener attached successfully"))
      : console.warn("⚠️ Signup button not found during auth initialization"),
    we &&
      (console.log("🔧 Setting up auth form..."),
      we.removeEventListener("submit", Ft),
      we.addEventListener("submit", function (e) {
        e.preventDefault(),
          e.stopPropagation(),
          console.log("📨 Auth form submitted"),
          Ft();
      }),
      console.log("✅ Auth form listener attached successfully")),
    Ee &&
      (console.log("🔧 Setting up auth submit button..."),
      Ee.removeEventListener("click", Ft),
      Ee.addEventListener("click", function (e) {
        e.preventDefault(),
          e.stopPropagation(),
          console.log("🔄 Auth submit button clicked"),
          Ft();
      }),
      console.log("✅ Auth submit button listener attached successfully")),
    Se &&
      Se.addEventListener("click", function (e) {
        e.preventDefault(),
          e.stopPropagation(),
          console.log("🔄 Toggling auth mode"),
          Tt();
      }),
    Re &&
      Re.addEventListener("click", function (e) {
        e.preventDefault(),
          e.stopPropagation(),
          console.log("🔓 Forgot password clicked"),
          wt();
      }),
    ke &&
      ke.addEventListener("click", function (e) {
        e.preventDefault(),
          e.stopPropagation(),
          console.log("📧 Send reset email clicked"),
          Ct();
      });
  const e = document.getElementById("submitResetPasswordBtn");
  e &&
    e.addEventListener("click", function (e) {
      e.preventDefault(),
        e.stopPropagation(),
        console.log("🔄 Reset password submission"),
        Pt();
    }),
    Te &&
      Te.addEventListener("click", function (e) {
        e.preventDefault(),
          e.stopPropagation(),
          console.log("🚪 Logout clicked"),
          qt();
      }),
    console.log("🎉 Auth initialization completed successfully");
}

function Mt() {
    console.log("Opening auth modal in mode:", nt ? "SIGN UP" : "LOGIN");
    
    const authModal = document.getElementById('authModal');
    const menuModal = document.getElementById('menuModal');
    
    if (authModal) {
        // Set auth modal to highest z-index
        authModal.style.zIndex = '10000';
        authModal.classList.remove("hidden");
        
        // Ensure menu modal is below auth modal
        if (menuModal) {
            menuModal.style.zIndex = '1000';
            // Keep menu modal visible but behind
            menuModal.classList.remove('hidden');
        }
    }
    
    Bt();
    setTimeout(() => {
        xe && xe.focus();
    }, 100);
    
    console.log("✅ Auth modal opened on top");
}

async function Ft() {
  const e = xe.value.trim(),
    t = Ce.value;
  if (
    (console.log("🔐 Auth attempt for:", e, "Mode:", nt ? "Sign Up" : "Login"),
    !e)
  )
    return void Ut("Please enter your email address"), void xe.focus();
  if (!t) return void Ut("Please enter your password"), void Ce.focus();
  if (t.length < 6)
    return void Ut("Password must be at least 6 characters long"), void Ce.focus();
  Ee.disabled = !0;
  const n = Ee.textContent;
  Ee.textContent = nt ? "Creating Account..." : "Logging In...";
  try {
    let n;
    nt
      ? (console.log("📝 Attempting sign up..."),
        (n = await window.supabaseClient.signUp(e, t)))
      : (console.log("🔑 Attempting sign in..."),
        (n = await window.supabaseClient.signIn(e, t))),
      n.success
        ? (console.log("✅ Auth successful for:", e),
          kt(),
          nt
            ? (Wt(
                "🎉 Account created successfully! Please check your email for verification.",
                "success"
              ),
              (nt = !1),
              Bt())
            : Wt("✅ Login successful! Welcome back!", "success"),
          // START: Fix Insertion
          initiateTimedReload()
          // END: Fix Insertion
          )
        : (console.error("❌ Auth failed:", n.error),
          Ut(n.error || "Authentication failed. Please try again."));
  } catch (e) {
    console.error("💥 Auth error:", e),
      Ut("An unexpected error occurred. Please try again.");
  } finally {
    (Ee.disabled = !1), (Ee.textContent = n);
  }
}

function kt() {
    console.log("❌ Closing auth modal with enhanced handler");
    
    const menuModal = document.getElementById('menuModal');
    const authModal = document.getElementById('authModal');
    
    // Close auth modal
    if (authModal) {
        authModal.classList.add('hidden');
        authModal.style.zIndex = '';
    }
    
    // Restore menu modal if forced open (logged out state)
    if (menuModal && menuModal.classList.contains('force-open')) {
        console.log("🔁 Restoring menu modal after auth close");
        menuModal.style.zIndex = '1000';
        menuModal.classList.remove('hidden');
        document.body.style.overflow = "hidden";
    } else if (menuModal) {
        // Normal behavior for logged-in users
        menuModal.classList.add('hidden');
        document.body.style.overflow = "";
    }
    
    // Reset auth form
    if (we) we.reset();
    if (Le) Le.classList.add("hidden");
    
    console.log("✅ Auth modal closed");
}

function Bt() {
  nt
    ? ((he.textContent = "Sign Up for ProfitPerPlate"),
      (Ee.textContent = "Sign Up"),
      (Pe.textContent = "Already have an account? "),
      (Se.textContent = "Login"))
    : ((he.textContent = "Login to ProfitPerPlate"),
      (Ee.textContent = "Login"),
      (Pe.textContent = "Don't have an account? "),
      (Se.textContent = "Sign up"));
}

function Ut(e) {
  (Le.textContent = e), Le.classList.remove("hidden");
}

function Tt() {
  (nt = !nt), Bt(), Le.classList.add("hidden");
}

async function qt() {
  const e = await window.supabaseClient.signOut();
  // START: Fix Insertion
  if (e.success) {
    console.log("✅ Logout successful");
    initiateTimedReload();
  } else {
    alert("Error logging out: " + e.error);
  }
  // END: Fix Insertion
}

async function Dt() {
  const t = await window.supabaseClient.loadUserData();
  if (t) {
    const n = s(t);
    (e = {
      ...n,
      currency: n.currency || "₱",
      currentRecipeState: n.currentRecipeState || null
    }),
      (tt = e.currency || "₱"),
      (w.value = tt),
      vt(),
      mn(),
      In(),
      Kn(),
      At(),
      zn(),
      _n();
  }
}

function At() {
  if (!e.currentRecipeState) return;
  const t = e.currentRecipeState;
  x && (x.value = t.recipeName || ""),
    U && (U.value = t.markup || 40),
    T && (T.value = t.tax || 0),
    q && (q.value = t.vat || 0),
    D && (D.value = t.servings || 1),
    A && (A.value = t.servingScale || 1),
    f && (f.innerHTML = ""),
    y && (y.innerHTML = ""),
    t.rawMaterialItems &&
      t.rawMaterialItems.forEach((e) => {
        gn(
          e.name,
          e.quantity,
          e.unit,
          e.unitCost,
          e.type || "rawMaterial",
          e.subRecipeId || null
        );
      }),
    t.directLaborItems &&
      t.directLaborItems.forEach((t) => {
        const n = t.unitCost ?? t.rate ?? 0,
          o = t.unit ?? t.timeUnit ?? "hours";
        e.directLabor.find((e) => e.name === t.name) &&
          fn(t.name, t.quantity, o, n);
      }),
    t.currentTab &&
      setTimeout(() => {
        it(t.currentTab);
      }, 100),
    zn();
}

// =============================================================================
// RECIPE MANAGEMENT FUNCTIONS
// =============================================================================

function Nt() {
  try {
    if (!confirm("Reset entire recipe? This will clear all items and reset servings to 1."))
      return;
    // If confirmed, delegate to the silent reset to avoid code duplication
    NtSilent();
  } catch (err) {
    console.error("Nt (reset) error:", err);
  }
}

function Ht() {
  setTimeout(() => {
    Nt();
  }, 500);
}

function Ot(e, t) {
  // Enhanced, defensive Ot: safely handles null/undefined 'e' and avoids reading e.name when absent.
  try {
    const recipes = Gt() || [];
    let updatedRecipes = [];
    let anyUpdated = false;
    let updatedCount = 0;

    // Helper to safely compare names (case-sensitive as original, but guarded)
    function nameMatches(a, b) {
      return a != null && b != null && String(a) === String(b);
    }

    recipes.forEach((recipe) => {
      let recipeChanged = false;

      // Defensive checks for arrays
      if (Array.isArray(recipe.rawMaterialItems)) {
        recipe.rawMaterialItems.forEach((line) => {
          // Only attempt to compare to e.name when e is provided and has a name
          if (e && e.name && line.type === t && nameMatches(line.name, e.name)) {
            line.unitCost = e.costPerUnit;
            recipeChanged = true;
          }

          // If this line references a sub-recipe, inspect the sub-recipe's raw items
          if (line.type === "sub-recipe") {
            const subDef = recipes.find((r) => r.id === line.subRecipeId);
            if (subDef && Array.isArray(subDef.rawMaterialItems)) {
              subDef.rawMaterialItems.forEach((subLine) => {
                if (e && e.name && nameMatches(subLine.name, e.name)) {
                  subLine.unitCost = e.costPerUnit;
                  recipeChanged = true;
                }
              });
            }
          }
        });
      }

      if (Array.isArray(recipe.directLaborItems)) {
        recipe.directLaborItems.forEach((laborLine) => {
          if (e && e.name && nameMatches(laborLine.name, e.name)) {
            laborLine.unitCost = e.costPerUnit;
            recipeChanged = true;
          }
        });
      }

      if (recipeChanged) {
        // Recalculate recipe total defensively
        try {
          recipe.totalCost = (function (r) {
            let total = 0;
            if (Array.isArray(r.rawMaterialItems)) {
              r.rawMaterialItems.forEach((mi) => {
                const qty = Number(mi.quantity) || 0;
                const cost = Number(mi.unitCost) || 0;
                total += qty * cost;
              });
            }
            if (Array.isArray(r.directLaborItems)) {
              r.directLaborItems.forEach((li) => {
                const qty = Number(li.quantity) || 0;
                const cost = Number(li.unitCost) || 0;
                total += qty * cost;
              });
            }
            return parseFloat(total.toFixed(2));
          })(recipe);
        } catch (calcErr) {
          console.warn("Error recalculating recipe.totalCost in Ot():", calcErr);
        }

        anyUpdated = true;
        updatedCount++;
      }

      updatedRecipes.push(recipe);
    });

    if (anyUpdated) {
      try {
        // Persist changes to recipes list
        jt(updatedRecipes);
      } catch (pErr) {
        console.warn("jt() persistence failed in Ot():", pErr);
      }

      try {
        // Refresh UI components that depend on recipes
        Fn && typeof Fn === "function" && Fn();
        mn && typeof mn === "function" && mn();
        Kn && typeof Kn === "function" && Kn();

        // Notification: when e is null, phrase message accordingly
        const itemName = e && e.name ? e.name : "master data";
        Wt && typeof Wt === "function" && Wt(`Automatically updated ${updatedCount} recipe(s) using "${itemName}"`);
      } catch (uiErr) {
        console.warn("UI refresh after Ot() updates failed:", uiErr);
      }

      // If there is a currently loaded recipe (n), try to refresh it to reflect updates
      if (typeof n !== "undefined" && n) {
        const refreshed = updatedRecipes.find((r) => r.id === n.id);
        if (refreshed) {
          n = refreshed;
          Yn && typeof Yn === "function" && Yn();
          Gn && typeof Gn === "function" && Gn();
        }
      }
    }

    return updatedCount;
  } catch (err) {
    console.error("❌ Error in Ot (fallback):", err);
    return 0;
  }
}

function zt(e, t) {
  let n = 100;
  if ("rawMaterial" === t) {
    const t = Yt().find((t) => t.name === e);
    t && t.yieldPercentage && (n = t.yieldPercentage);
  }
  return n;
}

// =============================================================================
// NOTIFICATION AND STATUS FUNCTIONS
// =============================================================================

function Wt(e, t = "info") {
  document.querySelectorAll(".global-notification").forEach((e) => e.remove());
  const n = document.createElement("div");
  if (
    ((n.className = `global-notification ${t}`),
    (n.innerHTML = `\n        <div class="notification-content">\n            <span class="notification-message">${e}</span>\n            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>\n        </div>\n    `),
    !document.getElementById("notification-styles"))
  ) {
    const e = document.createElement("style");
    (e.id = "notification-styles"),
      (e.textContent =
        "\n            .global-notification {\n                position: fixed;\n                top: 20px;\n                right: 20px;\n                background: var(--surface);\n                border: 1px solid var(--border);\n                border-radius: var(--radius-lg);\n                padding: var(--space-md);\n                box-shadow: var(--shadow-xl);\n                z-index: 10000;\n                animation: slideInRight 0.3s ease;\n                max-width: 400px;\n            }\n            \n            .global-notification.success {\n                border-left: 4px solid var(--success);\n            }\n            \n            .global-notification.info {\n                border-left: 4px solid var(--accent-blue);\n            }\n            \n            .global-notification.warning {\n                border-left: 4px solid var(--warning);\n            }\n            \n            .global-notification.error {\n                border-left: 4px solid var(--danger);\n            }\n            \n            .notification-content {\n                display: flex;\n                align-items: flex-start;\n                gap: var(--space-sm);\n            }\n            \n            .notification-message {\n                flex: 1;\n                font-size: 14px;\n                line-height: 1.4;\n            }\n            \n            .notification-close {\n                background: none;\n                border: none;\n                font-size: 18px;\n                cursor: pointer;\n                color: var(--text-secondary);\n                padding: 0;\n                width: 24px;\n                height: 24px;\n                display: flex;\n                align-items: center;\n                justify-content: center;\n                border-radius: var(--radius-sm);\n            }\n            \n            .notification-close:hover {\n                background: var(--primary-light);\n                color: var(--text-primary);\n            }\n            \n            @keyframes slideInRight {\n                from {\n                    transform: translateX(100%);\n                    opacity: 0;\n                }\n                to {\n                    transform: translateX(0);\n                    opacity: 1;\n                }\n            }\n            \n            @keyframes slideOutRight {\n                from {\n                    transform: translateX(0);\n                    opacity: 1;\n                }\n                to {\n                    transform: translateX(100%);\n                    opacity: 0;\n                }\n            }\n        "),
      document.head.appendChild(e);
  }
  document.body.appendChild(n),
    setTimeout(() => {
      n.parentElement &&
        ((n.style.animation = "slideOutRight 0.3s ease"),
        setTimeout(() => n.remove(), 300));
    }, 5e3);
}

function Qt(e, t = "info") {
  try {
    const n = document.getElementById("cloudSyncStatus");
    if (!n) return;
    (n.textContent = e),
      n.classList.remove(
        "warning",
        "error",
        "sync-updating",
        "success",
        "info"
      ),
      ("warning" !== t && "error" !== t && "success" !== t && "info" !== t) ||
        n.classList.add(t),
      "sync" === t && n.classList.add("sync-updating");
  } catch (e) {
    console.warn("updateCloudSyncStatus failed:", e);
  }
}

// =============================================================================
// DATA GETTER FUNCTIONS
// =============================================================================

function Yt() {
  return e.rawMaterials || [];
}

function Vt() {
  return e.directLabor || [];
}

function Gt() {
  return e.recipes || [];
}

function _t(t) {
  (e.rawMaterials = t), dt();
}

function Jt(t) {
  (e.directLabor = t), dt();
}

function jt(t) {
  (e.recipes = t), dt();
}

// =============================================================================
// ENHANCED RAW MATERIALS DISPLAY - PROGRAMMATIC CARD LAYOUT WITH DELEGATED EVENTS
// =============================================================================

/**
 * Render raw materials as cards and attach delegated event handlers.
 * Uses the Yt() getter to access the master raw materials list.
 */
function en() {
  const container = document.getElementById('rawMaterialsCards');
  if (!container) {
    console.error('Raw materials cards container not found');
    return;
  }

  const materials = tn(); // filtered list based on search
  const sortedMaterials = mo(materials);

  if (sortedMaterials.length === 0) {
    container.innerHTML = `
      <div class="empty-state" role="status" aria-live="polite">
        <p>No raw materials found. Add your first raw material to get started.</p>
      </div>
    `;
    return;
  }

  // Render cards without inline onclick attributes
  container.innerHTML = sortedMaterials
  .map((material) => {
    const nameHtml = po(material.name || 'Unnamed');
    const cost = uo(Number(material.costPerUnit || material.unitCost || 0));
    const unit = material.costUnit || material.unit || 'unit';
    return `
      <div class="recipe-item material-card" data-id="${material.id}" role="listitem" tabindex="0" aria-label="${material.name}">
        <div class="card-content-grid">
          <div class="card-left-col">
            <div class="card-title-row">
              <h4>${nameHtml}</h4>
            </div>
            <div class="card-details-row">
              <p class="cost-display">Cost: ${cost}/${unit}</p>
            </div>
          </div>
          
          <div class="card-right-col">
            <div class="action-row-1">
              <button class="btn-secondary small edit-raw" data-id="${material.id}">Edit</button>
            </div>
            <div class="action-row-2">
              <button class="btn-danger small delete-raw" data-id="${material.id}">Delete</button>
            </div>
          </div>
        </div>
      </div>
    `;
  })
  .join('');

  // Delegated event handling: attach one listener per container instance
  if (!container._clickHandlerAttached) {
    container.addEventListener('click', function (ev) {
      const target = ev.target;
      const editBtn = target.closest('.edit-raw');
      if (editBtn) {
        ev.stopPropagation();
        const id = editBtn.dataset.id;
        const item = Yt().find((m) => String(m.id) === String(id));
        if (item) {
          no(item);
        } else {
          console.warn('Attempted to edit raw material not found:', id);
        }
        return;
      }

      const deleteBtn = target.closest('.delete-raw');
      if (deleteBtn) {
        ev.stopPropagation();
        const id = deleteBtn.dataset.id;
        if (!id) return;
        Zt(parseInt(id));
        return;
      }

      // Card click fallback: open editor for clicked card
      const card = target.closest('.recipe-item[data-id]');
      if (card) {
        const id = card.dataset.id;
        const item = Yt().find((m) => String(m.id) === String(id));
        if (item) {
          no(item);
        } else {
          console.warn('Card clicked for raw material not found:', id);
        }
      }
    });

    // keyboard support: Enter/Space on focused card opens edit
    container.addEventListener('keydown', function (ev) {
      if ((ev.key === 'Enter' || ev.key === ' ') && ev.target && ev.target.matches('.recipe-item')) {
        ev.preventDefault();
        const id = ev.target.dataset.id;
        const item = Yt().find((m) => String(m.id) === String(id));
        if (item) {
          no(item);
        }
      }
    });

    container._clickHandlerAttached = true;
  }
}

// =============================================================================
// MANUAL SAVE: UPDATED RAW MATERIALS FUNCTIONS
// =============================================================================
// ======= Enhanced Kt() - Save Raw Material =======
function Kt() {
  const name = document.getElementById("modalRawMaterialName").value.trim(),
    category = document.getElementById("modalRawMaterialCategory").value,
    purchasePrice = parseFloat(document.getElementById("modalRawMaterialPrice").value),
    purchaseQuantity = parseFloat(document.getElementById("modalRawMaterialQuantity").value),
    purchaseUnit = document.getElementById("modalRawMaterialUnit").value,
    costPerUnitVal = parseFloat(document.getElementById("modalCostPerUnit").value),
    costUnit = document.getElementById("modalCostUnit").value,
    yieldPct = parseFloat(document.getElementById("modalRawMaterialYield").value) || 100;

  if (!name) { alert("Please enter a raw material name"); return; }
  if (!category) { alert("Please select a category"); return; }
  if (isNaN(purchasePrice) || purchasePrice <= 0) { alert("Please enter a valid purchase price"); return; }
  if (isNaN(purchaseQuantity) || purchaseQuantity <= 0) { alert("Please enter a valid purchase quantity"); return; }
  if (isNaN(costPerUnitVal) || costPerUnitVal <= 0) { alert("Please enter valid cost calculation details"); return; }

  const finalize = (mode, newName = null) => {
    const finalName = newName || name;
    const rawObj = {
      id: mode === "replace" ? t.id : Date.now(),
      name: finalName,
      category: category,
      price: parseFloat(purchasePrice.toFixed(2)),
      quantity: parseFloat(purchaseQuantity.toFixed(2)),
      unit: purchaseUnit,
      costPerUnit: parseFloat(costPerUnitVal.toFixed(4)),
      costUnit: costUnit || purchaseUnit,
      yieldPercentage: parseFloat(yieldPct.toFixed(1)),
      createdAt: new Date().toISOString()
    };

    const masters = Yt();
    if (mode === "replace") {
      const idx = masters.findIndex(m => m.id === t.id);
      if (idx !== -1) { masters[idx] = rawObj; Wt("Raw material updated successfully!", "success"); }
    } else {
      masters.push(rawObj);
      Wt(`Raw material "${finalName}" saved successfully!`, "success");
    }

    _t(masters); // update global rawMaterials
    en(); // re-render cards
    mn(); // rebuild unified select (raw materials optgroup)
    oo(); // close modal
    mn(); Fn(); Kn(); In(); // ensure all dropdowns and lists refreshed

    // START: Fix Insertion
    initiateTimedReload();
    // END: Fix Insertion

    // Trigger cascade and manual save (with short delay)
    setTimeout(() => {
      try {
        if (window.CascadeSystem && typeof window.CascadeSystem.recalculateAllRecipesOnMasterChange === 'function') {
          const updated = window.CascadeSystem.recalculateAllRecipesOnMasterChange();
          // Dispatch event for master update
          try {
            document.dispatchEvent(new CustomEvent('pp:masterUpdated', { 
              detail: { type: 'rawMaterial', item: rawObj } 
            }));
          } catch(e) {
            console.warn('Event dispatch failed:', e);
          }
          if (typeof Wt === 'function') Wt(`Automatically updated ${updated} recipes after raw material save`, 'success');
        } else if (typeof Ot === 'function') {
          Ot(rawObj, 'rawMaterial');
        }
      } catch (err) {
        console.error("Raw material cascade error:", err);
      } finally {
        try { 
          if (typeof ct === 'function') ct(); 
        } catch (err) { 
          console.warn("ct() failed:", err); 
        }
      }
    }, 50);
  }; 

  // Use duplicate-check/prompt flow (p) to handle collisions
  // If p returns true it showed the modal and will invoke finalize via the modal handlers.
  // If p returns false, continue to finalize immediately.
  if (!p(name, "rawMaterial", t?.id, finalize)) {
    finalize(t?.id ? "replace" : "new");
  }
}

function Xt() {
  Kt();
}

// ======= Enhanced Zt() - Delete Raw Material =======
function Zt(id) {
  if (!confirm("Are you sure you want to delete this raw material?")) return;
  const deleted = Yt().find(item => String(item.id) === String(id));
  _t(Yt().filter(item => String(item.id) !== String(id))); // update global rawMaterials
  en(); // re-render raw material cards
  mn(); Fn(); Kn(); // rebuild selects and recipe lists
  if (n) Gn();

  // Trigger cascade updates and manual save
  setTimeout(() => {
    try {
      if (deleted && (window.CascadeSystem && typeof window.CascadeSystem.recalculateAllRecipesOnMasterChange === 'function')) {
        const updated = window.CascadeSystem.recalculateAllRecipesOnMasterChange();
        Wt(`Automatically updated ${updated} recipes after raw material deletion`, 'success');
      } else if (typeof Ot === 'function') {
        Ot(deleted, 'rawMaterial');
      }
    } catch (err) {
      console.error("Raw deletion cascade error:", err);
    } finally {
      try { if (typeof ct === 'function') ct(); } catch (err) { console.warn("ct() failed:", err); }
    }
  }, 50);

  Wt("Raw material deleted successfully!", "success");
}

/**
 * UPDATED: Filter raw materials for search functionality
 */
function tn() {
  const searchTerm = document.getElementById("rawMaterialSearch").value.toLowerCase();
  return Yt().filter(
    material =>
      material.name.toLowerCase().includes(searchTerm) || 
      material.category.toLowerCase().includes(searchTerm)
  );
}

function nn() {
  const e =
      parseFloat(document.getElementById("modalRawMaterialPrice").value) || 0,
    t =
      parseFloat(document.getElementById("modalRawMaterialQuantity").value) ||
      1,
    n = document.getElementById("modalRawMaterialUnit").value,
    o = document.getElementById("modalCostUnit").value,
    i =
      parseFloat(document.getElementById("modalRawMaterialYield").value) || 100;
  let r = 0,
    l = [];
  if (e > 0 && t > 0) {
    const s = e / t;
    l.push(
      `Base cost per ${n}: ${e.toFixed(2)} ${tt} ÷ ${t.toFixed(
        2
      )} = ${s.toFixed(4)} ${tt}/${n}`
    );
    const c = s / (i / 100);
    if (
      (l.push(
        `Adjust for ${i}% yield: ${s.toFixed(
          4
        )} ${tt}/${n} ÷ (${i}/100) = ${c.toFixed(4)} ${tt}/${n}`
      ),
      n !== o)
    ) {
      const e = a[o] / a[n];
      (r = c * e),
        l.push(
          `Convert to ${o}: ${c.toFixed(4)} ${tt}/${n} × ${e.toFixed(
            6
          )} = ${r.toFixed(4)} ${tt}/${o}`
        );
    } else (r = c), l.push(`No conversion needed (already in ${o})`);
    l.push(
      `<strong>Final yield-adjusted cost: ${r.toFixed(4)} ${tt}/${o}</strong>`
    );
  }
  (document.getElementById("modalCostPerUnit").value = r.toFixed(4)),
    (function (e, t, n) {
      const o = document.getElementById("costCalculationDetails");
      if (e.length > 0) {
        let a = "<div><strong>Calculation Steps:</strong></div>";
        e.forEach((e) => {
          a += `<div style="margin: var(--space-xs) 0; padding-left: var(--space-md);">• ${e}</div>`;
        }),
          (a += `<div style="margin-top: var(--space-sm); font-weight: bold;">Final Cost: ${t.toFixed(
            4
          )} ${tt}/${n}</div>`),
          (o.innerHTML = a);
      } else o.textContent = "Enter purchase details to see calculation";
    })(l, r, o);
}

function on() {
  nn();
}

// =============================================================================
// ENHANCED DIRECT LABOR DISPLAY - PROGRAMMATIC CARD LAYOUT WITH DELEGATED EVENTS
// =============================================================================

// Direct labor cost calculation function - THIS IS MISSING
function ln() {
  const e = parseFloat(document.getElementById("modalShiftRate").value) || 0,
    t = parseFloat(document.getElementById("modalShiftDuration").value) || 1,
    n = document.getElementById("modalTimeUnit").value,
    o = document.getElementById("modalCostUnitLabor").value;
  let i = 0,
    r = [];
  if (e > 0 && t > 0) {
    const l = e / t;
    if (
      (r.push(
        `Cost per ${n}: ${e.toFixed(2)} ${tt} ÷ ${t.toFixed(2)} = ${l.toFixed(
          4
        )} ${tt}/${n}`
      ),
      n !== o)
    ) {
      const e = a[o] / a[n];
      (i = l * e),
        r.push(
          `Convert to ${o}: ${l.toFixed(4)} ${tt}/${n} × ${e.toFixed(
            6
          )} = ${i.toFixed(4)} ${tt}/${o}`
        );
    } else (i = l), r.push(`No conversion needed (already in ${o})`);
  }
  (document.getElementById("modalCostPerUnitLabor").value = i.toFixed(4)),
    (function (e, t, n) {
      const o = document.getElementById("laborCostCalculationDetails");
      if (e.length > 0) {
        let a = "<div><strong>Calculation Steps:</strong></div>";
        e.forEach((e) => {
          a += `<div style="margin: var(--space-xs) 0; padding-left: var(--space-md);">• ${e}</div>`;
        }),
          (a += `<div style="margin-top: var(--space-sm); font-weight: bold;">Final Cost: ${t.toFixed(
            4
          )} ${tt}/${n}</div>`),
          (o.innerHTML = a);
      } else o.textContent = "Enter shift details to see calculation";
    })(r, i, o);
}

// Direct labor modal open function - might also be missing
function an(e = null) {
  const n = document.getElementById("directLaborModal"),
    o = document.getElementById("directLaborModalTitle");
  e
    ? ((o.textContent = "Edit Direct Labor"),
      (function (e) {
        (document.getElementById("modalLaborName").value = e.name),
          (document.getElementById("modalShiftRate").value =
            e.shiftRate.toFixed(2)),
          (document.getElementById("modalShiftDuration").value =
            e.shiftDuration.toFixed(2)),
          (document.getElementById("modalTimeUnit").value = e.timeUnit),
          (document.getElementById("modalCostUnitLabor").value = e.costUnit),
          ln();

        // Disable critical fields when editing existing direct labor
        const nameField = document.getElementById("modalLaborName");
        const timeUnitField = document.getElementById("modalTimeUnit");
        const costUnitField = document.getElementById("modalCostUnitLabor");
        
        if (nameField) {
          nameField.disabled = true;
          nameField.title = "Cannot change Labor Name for existing labor items.";
        }
        if (timeUnitField) {
          timeUnitField.disabled = true;
          timeUnitField.title = "Cannot change Time Unit for existing labor items.";
        }
        if (costUnitField) {
          costUnitField.disabled = true;
          costUnitField.title = "Cannot change Cost Unit for existing labor items.";
        }
      })(e),
      (t = { type: "directLabor", id: e.id, data: e }))
    : ((o.textContent = "Add New Direct Labor"),
      document.getElementById("directLaborForm").reset(),
      ln(),
      (t = { type: null, id: null, data: null }),
      // Ensure fields are enabled when adding new labor
      (function() {
        const nameField = document.getElementById("modalLaborName");
        const timeUnitField = document.getElementById("modalTimeUnit");
        const costUnitField = document.getElementById("modalCostUnitLabor");
        
        if (nameField) {
          nameField.disabled = false;
          nameField.title = "";
        }
        if (timeUnitField) {
          timeUnitField.disabled = false;
          timeUnitField.title = "";
        }
        if (costUnitField) {
          costUnitField.disabled = false;
          costUnitField.title = "";
        }
      })()),
    n.classList.remove("hidden");
}

// Direct labor modal close function
function rn() {
  document.getElementById("directLaborModal").classList.add("hidden"),
    document.getElementById("directLaborForm").reset(),
    (t = { type: null, id: null, data: null });
}

/**
 * Render direct labor as cards and attach delegated event handlers.
 * Uses the Vt() getter to access the master direct labor list.
 */
function un() {
  const container = document.getElementById('directLaborCards');
  if (!container) {
    console.error('Direct labor cards container not found');
    return;
  }

  const laborItems = pn(); // filtered list based on search
  const sortedLabor = go(laborItems);

  if (sortedLabor.length === 0) {
    container.innerHTML = `
      <div class="empty-state" role="status" aria-live="polite">
        <p>No direct labor items found. Add your first labor item to get started.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = sortedLabor
  .map((labor) => {
    const nameHtml = po(labor.name || 'Unnamed Labor');
    const cost = uo(Number(labor.costPerUnit || labor.unitCost || 0));
    const unit = labor.costUnit || labor.unit || 'hours';
    return `
      <div class="recipe-item labor-card" data-id="${labor.id}" role="listitem" tabindex="0" aria-label="${labor.name}">
        <div class="card-content-grid">
          <div class="card-left-col">
            <div class="card-title-row">
              <h4>${nameHtml}</h4>
            </div>
            <div class="card-details-row">
              <p class="cost-display">Cost: ${cost}/${unit}</p>
            </div>
          </div>
          
          <div class="card-right-col">
            <div class="action-row-1">
              <button class="btn-secondary small edit-labor" data-id="${labor.id}">Edit</button>
            </div>
            <div class="action-row-2">
              <button class="btn-danger small delete-labor" data-id="${labor.id}">Delete</button>
            </div>
          </div>
        </div>
      </div>
    `;
  })
  .join('');

  // Delegated event handling: attach one listener per container instance
  if (!container._clickHandlerAttached) {
    container.addEventListener('click', function (ev) {
      const target = ev.target;
      const editBtn = target.closest('.edit-labor');
      if (editBtn) {
        ev.stopPropagation();
        const id = editBtn.dataset.id;
        const item = Vt().find((l) => String(l.id) === String(id));
        if (item) {
          an(item);
        } else {
          console.warn('Attempted to edit direct labor not found:', id);
        }
        return;
      }

      const deleteBtn = target.closest('.delete-labor');
      if (deleteBtn) {
        ev.stopPropagation();
        const id = deleteBtn.dataset.id;
        if (!id) return;
        dn(parseInt(id));
        return;
      }

      const card = target.closest('.recipe-item[data-id]');
      if (card) {
        const id = card.dataset.id;
        const item = Vt().find((l) => String(l.id) === String(id));
        if (item) {
          an(item);
        } else {
          console.warn('Card clicked for labor not found:', id);
        }
      }
    });

    container.addEventListener('keydown', function (ev) {
      if ((ev.key === 'Enter' || ev.key === ' ') && ev.target && ev.target.matches('.recipe-item')) {
        ev.preventDefault();
        const id = ev.target.dataset.id;
        const item = Vt().find((l) => String(l.id) === String(id));
        if (item) {
          an(item);
        }
      }
    });

    container._clickHandlerAttached = true;
  }
}

function an(e = null) {
  const n = document.getElementById("directLaborModal"),
    o = document.getElementById("directLaborModalTitle");
  e
    ? ((o.textContent = "Edit Direct Labor"),
      (function (e) {
        (document.getElementById("modalLaborName").value = e.name),
          (document.getElementById("modalShiftRate").value =
            e.shiftRate.toFixed(2)),
          (document.getElementById("modalShiftDuration").value =
            e.shiftDuration.toFixed(2)),
          (document.getElementById("modalTimeUnit").value = e.timeUnit),
          (document.getElementById("modalCostUnitLabor").value = e.costUnit),
          (document.getElementById("modalCostUnitLabor").value = e.costUnit),
          window.calculateCostPerUnitLabor(); // FIXED: Uses the global alias
          // --- CHANGE 2: Disable critical fields when editing existing direct labor ---

        // --- CHANGE 2: Disable critical fields when editing existing direct labor ---
        const nameField = document.getElementById("modalLaborName");
        const timeUnitField = document.getElementById("modalTimeUnit");
        const costUnitField = document.getElementById("modalCostUnitLabor");
        
        if (nameField) {
          nameField.disabled = true;
          nameField.title = "Cannot change Labor Name for existing labor items.";
        }
        if (timeUnitField) {
          timeUnitField.disabled = true;
          timeUnitField.title = "Cannot change Time Unit for existing labor items.";
        }
        if (costUnitField) {
          costUnitField.disabled = true;
          costUnitField.title = "Cannot change Cost Unit for existing labor items.";
        }
      })(e),
      (t = { type: "directLabor", id: e.id, data: e }))
    : ((o.textContent = "Add New Direct Labor"),
      document.getElementById("directLaborForm").reset(),
      window.calculateCostPerUnitLabor(),
      (t = { type: null, id: null, data: null }),
      // --- CHANGE 2: Ensure fields are enabled when adding new labor ---
      (function() {
        const nameField = document.getElementById("modalLaborName");
        const timeUnitField = document.getElementById("modalTimeUnit");
        const costUnitField = document.getElementById("modalCostUnitLabor");
        
        if (nameField) {
          nameField.disabled = false;
          nameField.title = "";
        }
        if (timeUnitField) {
          timeUnitField.disabled = false;
          timeUnitField.title = "";
        }
        if (costUnitField) {
          costUnitField.disabled = false;
          costUnitField.title = "";
        }
      })()),
    n.classList.remove("hidden");
}

function rn() {
  document.getElementById("directLaborModal").classList.add("hidden"),
    document.getElementById("directLaborForm").reset(),
    (t = { type: null, id: null, data: null });
}

// =============================================================================
// MANUAL SAVE: UPDATED DIRECT LABOR FUNCTIONS WITH CASCADING SYNCHRONIZATION
// =============================================================================

// ======= Enhanced sn() - Save Direct Labor =======
// REPLACE the existing function sn() (save direct labor) with this block.
// Location hint: search for "function sn()" and replace that block with the code below.

function sn() {
  const name = document.getElementById("modalLaborName").value.trim(),
    shiftRate = parseFloat(document.getElementById("modalShiftRate").value),
    shiftDuration = parseFloat(document.getElementById("modalShiftDuration").value),
    timeUnit = document.getElementById("modalTimeUnit").value,
    costUnit = document.getElementById("modalCostUnitLabor").value;

  if (!name) { alert("Please enter a labor name"); return; }
  if (isNaN(shiftRate) || shiftRate <= 0) { alert("Please enter a valid shift rate"); return; }
  if (isNaN(shiftDuration) || shiftDuration <= 0) { alert("Please enter a valid shift duration"); return; }

  let costPerUnit = 0;
  if (shiftRate > 0 && shiftDuration > 0) {
    const base = shiftRate / shiftDuration;
    if (timeUnit !== costUnit) {
      costPerUnit = base * (a[costUnit] / a[timeUnit]);
    } else {
      costPerUnit = base;
    }
  }

  const finalize = (mode, providedName = null) => {
    const finalName = providedName ? providedName : name;
    const laborObj = {
      id: mode === "replace" ? t.id : Date.now(),
      name: finalName,
      shiftRate: parseFloat(shiftRate.toFixed(2)),
      shiftDuration: parseFloat(shiftDuration.toFixed(2)),
      timeUnit: timeUnit,
      costPerUnit: parseFloat(costPerUnit.toFixed(4)),
      costUnit: costUnit || timeUnit,
      createdAt: new Date().toISOString()
    };

    const all = Vt();
    if (mode === "replace") {
      const idx = all.findIndex(l => l.id === t.id);
      if (idx !== -1) { all[idx] = laborObj; Wt("Direct labor updated successfully!", "success"); }
    } else {
      all.push(laborObj);
      Wt(`Direct labor "${finalName}" saved successfully!`, "success");
    }

    Jt(all);
    un(); mn(); In(); // refresh displays and selects
    rn(); // close modal

    // START: Fix Insertion
    initiateTimedReload();
    // END: Fix Insertion

    // Trigger cascade and manual save
    setTimeout(() => {
      try {
        if (window.CascadeSystem && typeof window.CascadeSystem.recalculateAllRecipesOnMasterChange === 'function') {
          const updated = window.CascadeSystem.recalculateAllRecipesOnMasterChange();
          // Dispatch event for master update
          try {
            document.dispatchEvent(new CustomEvent('pp:masterUpdated', { 
              detail: { type: 'directLabor', item: laborObj } 
            }));
          } catch(e) {
            console.warn('Event dispatch failed:', e);
          }
          Wt(`Automatically updated ${updated} recipes after direct labor save`, 'success');
        } else if (typeof Ot === 'function') {
          Ot(laborObj, 'directLabor');
        }
      } catch (err) {
        console.error("Direct labor cascade error:", err);
      } finally {
        try { if (typeof ct === 'function') ct(); } catch (err) { console.warn("ct() failed:", err); }
      }
    }, 50);
  }; 

  // Use duplicate-check/prompt flow (p) to handle collisions
  // If p returns true it showed the modal and will invoke finalize via the modal handlers.
  // If p returns false, continue to finalize immediately.
  if (!p(name, "directLabor", t?.id, finalize)) {
    finalize(t?.id ? "replace" : "new");
  }
}

function cn() {
  sn();
}

function dn(id) {
  if (!confirm("Are you sure you want to delete this direct labor item?")) return;
  const deleted = Vt().find(l => String(l.id) === String(id));
  Jt(Vt().filter(item => String(item.id) !== String(id)));
  un(); mn(); In(); // refresh labor cards and selects
  Rn(); // re-attach direct labor select handler if necessary

  // Trigger cascade update and manual save
  setTimeout(() => {
    try {
      if (window.CascadeSystem && typeof window.CascadeSystem.recalculateAllRecipesOnMasterChange === 'function') {
        const updated = window.CascadeSystem.recalculateAllRecipesOnMasterChange();
        Wt(`Automatically updated ${updated} recipes after direct labor deletion`, 'success');
      } else if (typeof Ot === 'function') {
        Ot(deleted, 'directLabor');
      }
    } catch (err) {
      console.error("Direct labor deletion cascade error:", err);
    } finally {
      try { if (typeof ct === 'function') ct(); } catch (err) { console.warn("ct() failed:", err); }
    }
  }, 50);

  Wt("Direct labor deleted successfully!", "success");
}

/**
 * UPDATED: Filter direct labor for search functionality
 */
function pn() {
  const searchTerm = document.getElementById("directLaborSearch").value.toLowerCase();
  return Vt().filter(labor => 
    labor.name.toLowerCase().includes(searchTerm)
  );
}

// =============================================================================
// ENHANCED SEARCH AND FILTER FUNCTIONS
// =============================================================================

/**
 * NEW: Unified search handler for raw materials
 */
function filterRawMaterials() {
  en();
}

/**
 * NEW: Unified search handler for direct labor
 */
function filterDirectLabor() {
  un();
}

// =============================================================================
// ENHANCED EVENT HANDLER INTEGRATION
// =============================================================================

/**
 * UPDATED: Initialize enhanced display systems
 */
function vt() {
  en(); // Render raw materials with simplified layout
  un(); // Render direct labor with simplified layout
  Fn(); // Update recipes display
}

/**
 * UPDATED: Setup enhanced event listeners for new card layout
 */
function setupEnhancedCardInteractions() {
  // Add search input event listeners
  const rawMaterialSearch = document.getElementById('rawMaterialSearch');
  const directLaborSearch = document.getElementById('directLaborSearch');
  
  if (rawMaterialSearch) {
    rawMaterialSearch.addEventListener('input', filterRawMaterials);
  }
  
  if (directLaborSearch) {
    directLaborSearch.addEventListener('input', filterDirectLabor);
  }
  
  console.log('✅ Enhanced card interactions setup completed');
}

// =============================================================================
// RECIPE ITEM MANAGEMENT - FIXED DIRECT LABOR FUNCTIONS
// =============================================================================

// REPLACE the existing function mn() (unified item select population) with this block.
// Location hint: search for "function mn()" and replace that block with the code below.

function mn(preserveValue = null) {
  const sel = document.getElementById("unifiedItemSelect");
  if (!sel) {
    console.warn("mn(): unified select not found");
    return false;
  }

  // Unit map fallback
  const UM = (window.a && typeof window.a === "object") ? window.a : {
    kg: 1e3, g: 1, mg: 0.001, lbs: 453.592, oz: 28.3495,
    L: 1e3, ml: 1, cup: 236.588, tbsp: 14.7868, tsp: 4.92892,
    dozen: 12, pc: 1, hours: 60, minutes: 1
  };

  // Correct conversion for cost-per-unit: cost_per_to = cost_per_from * (UM[to] / UM[from])
  function convertCost(costPerFromUnit, fromUnit, toUnit) {
    if (!fromUnit || !toUnit) return Number(costPerFromUnit) || 0;
    const f = UM[fromUnit] || 1;
    const t = UM[toUnit] || 1;
    if (!f || !t) return Number(costPerFromUnit) || 0;
    return Number(costPerFromUnit) * (t / f);
  }

  // Find optgroups (create if missing)
  let rawGroup = sel.querySelector('optgroup[label="Raw Materials"]');
  let subGroup = sel.querySelector('optgroup[label="Sub-Recipes"]');

  if (!rawGroup) {
    rawGroup = document.createElement("optgroup");
    rawGroup.label = "Raw Materials";
    sel.appendChild(rawGroup);
  }
  if (!subGroup) {
    subGroup = document.createElement("optgroup");
    subGroup.label = "Sub-Recipes";
    sel.appendChild(subGroup);
  }

  // Clear existing options within groups
  rawGroup.innerHTML = "";
  subGroup.innerHTML = "";

  // Populate Raw Materials
  mo(Yt() || []).forEach((rm) => {
    const opt = document.createElement("option");
    opt.value = `rawMaterial-${rm.id}`;
    const cost = Number(rm.costPerUnit || rm.unitCost || 0);
    const displayUnit = rm.costUnit || rm.unit || "unit";
    const costText = Number.isFinite(cost) ? uo(cost) : "";
    opt.textContent = costText ? `${rm.name} (${costText}/${displayUnit})` : `${rm.name} (no cost)`;
    opt.dataset.yield = rm.yieldPercentage || 100;
    opt.dataset.unit = displayUnit;
    opt.dataset.rate = String(cost || "");
    opt.dataset.masterId = String(rm.id);
    rawGroup.appendChild(opt);
  });

  // Populate Sub-Recipes - ensure costPerUnit and costUnit are canonical and converted properly
  fo(Gt().filter((r) => r.type === "sub") || []).forEach((sr) => {
    const opt = document.createElement("option");
    opt.value = `subrecipe-${sr.id}`;

    // Determine canonical cost per displayed unit
    let canonicalCostPerUnit = Number(sr.costPerUnit ?? 0);
    // Determine canonical units: yieldUnit describes what yieldQuantity refers to; costUnit is intended display unit
    const yieldUnit = sr.yieldUnit || sr.outputUnit || null;
    const storedCostUnit = sr.costUnit || yieldUnit || "unit";

    // If costPerUnit is zero-ish, compute fallback using totalCost / yieldQuantity then convert into storedCostUnit
    if ((!canonicalCostPerUnit || canonicalCostPerUnit === 0) && Number(sr.totalCost) > 0 && Number(sr.yieldQuantity) > 0) {
      const base = Number(sr.totalCost) / Number(sr.yieldQuantity || 1); // base per yieldUnit
      if (yieldUnit && storedCostUnit && yieldUnit !== storedCostUnit) {
        canonicalCostPerUnit = convertCost(base, yieldUnit, storedCostUnit);
      } else {
        canonicalCostPerUnit = base;
      }
    }

    // Defensive numeric
    canonicalCostPerUnit = Number.isFinite(Number(canonicalCostPerUnit)) ? Number(canonicalCostPerUnit) : 0;

    // Text and dataset
    const costText = canonicalCostPerUnit ? uo(canonicalCostPerUnit) : "";
    const unit = storedCostUnit || "unit";
    opt.textContent = costText ? `${sr.name} (${costText}/${unit})` : `${sr.name} (no cost)`;
    opt.dataset.unit = unit;
    opt.dataset.rate = String(canonicalCostPerUnit || "");
    opt.dataset.subRecipeId = String(sr.id);
    opt.dataset.masterId = String(sr.id);

    subGroup.appendChild(opt);
  });

  // Optionally preserve and preselect a requested value
  if (preserveValue) {
    try {
      const want = String(preserveValue);
      const found = Array.from(sel.options).find(o => String(o.value) === want);
      if (found) {
        sel.value = found.value;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
    } catch (err) {
      console.warn("mn(): preserveValue handling failed:", err);
    }
  }

  return false;
}

function gn(e = "", t = "0", o = "g", a = "0.00", i = "rawMaterial", r = null) {
  if (!f) return;
  const l = document.createElement("tr"),
    s = "row-" + Date.now();
  
  // CRITICAL: This must be set BEFORE innerHTML for SUB badge to work
  l.dataset.type = i;
  if (r) {
    l.dataset.subRecipeId = r;
  }
  
  // CRITICAL: The SUB badge HTML must be included
  l.innerHTML = `\n            <td data-label="Item">\n                ${
      "sub-recipe" === i ? '<span class="sub-recipe-badge">SUB</span> ' : ""
    }\n                <input type="text" value="${e}" placeholder="Item" readonly>\n            </td>\n            <td data-label="Qty">\n                <div class="quantity-input-group">\n                    <input type="number" value="${parseFloat(
      t
    ).toFixed(
      2
    )}" step="0.01" placeholder="Qty" readonly>\n                    <span class="quantity-unit">${o}</span>\n                </div>\n            </td>\n            <td class="unit-cost-cell" data-label="Unit Cost">\n                <span class="unit-currency">${tt}</span>\n                <input type="number" value="${parseFloat(
      a
    ).toFixed(
      2
    )}" step="0.01" style="width:60%" readonly>\n                <span class="unit-display">/${o}</span>\n            </td>\n            <td data-label="Total Cost">\n                <span class="unit-currency">${tt}</span>\n                <span class="total-value">0.00</span>\n                <span class="unit-suffix">/recipe</span>\n            </td>\n            <td data-label="Actions">\n                <button class="btn-secondary small edit-recipe-btn" onclick="bn('${s}')">Edit</button>\n                <button class="btn-danger small delRow">🗑️</button>\n            </td>\n        `;
    
  l.id = s;
  
  // CRITICAL: Add sub-recipe class for styling
  if ("sub-recipe" === i) {
    l.classList.add("sub-recipe-row");
    console.log(`✅ Created sub-recipe row with SUB badge: ${e}`);
  }
  
  const c = l.children[1].querySelector("input"),
    d = l.children[2].querySelector("input"),
    u = l.children[3].querySelector(".total-value"),
    p = l.querySelector(".delRow");
  
  function m() {
    const e = parseFloat(c.value) || 0,
      t = parseFloat(d.value) || 0;
    (u.textContent = (e * t).toFixed(2)), zn(), dt(), n && Gn();
  }
  
  [c, d].forEach((e) => e.addEventListener("input", m)),
  p.addEventListener("click", () => {
    l.remove(), zn(), dt(), n && Gn();
  }),
  
  f.appendChild(l),
  m(),
  dt();
}

// FIXED: Enhanced fn function to properly store labor ID with robust string conversion
// === Replace your direct-labor row-creation function with this ===
function fn(displayName, timeRequired, unit, rate, laborId = null) {
  if (!y) return;
  const row = document.createElement("tr");
  const id = "labor-row-" + Date.now() + "-" + Math.floor(Math.random()*1000);
  row.classList.add("labor-row");
  row.id = id;

  row.innerHTML = `
    <td data-label="Labor Item">
      <input type="text" value="${po(displayName)}" placeholder="Labor item" readonly>
    </td>
    <td data-label="Time Required">
      <div class="quantity-input-group">
        <input type="number" value="${parseFloat(timeRequired || 0).toFixed(2)}" step="0.01" readonly>
        <span class="quantity-unit">${unit || "hours"}</span>
      </div>
    </td>
    <td data-label="Rate">
      <div class="input-with-unit">
        <input type="number" value="${parseFloat(rate || 0).toFixed(2)}" step="0.01" readonly>
        <span class="unit-display-small">/${unit || "hours"}</span>
      </div>
    </td>
    <td data-label="Total Cost">
      <span class="unit-currency">${tt}</span>
      <span class="total-value">0.00</span>
    </td>
    <td data-label="Actions">
      <button class="btn-secondary small edit-labor-btn" onclick="editDirectLaborRow('${id}')">Edit</button>
      <button class="btn-danger small delDirectLaborRow">🗑️</button>
    </td>
  `;

  // metadata: set name and optional id
  row.dataset.laborName = String(displayName || "");
  if (laborId != null && laborId !== "") row.dataset.laborId = String(laborId);
  else row.removeAttribute("data-labor-id");

  // attach listeners for recalc and delete
  const qtyInput = row.children[1].querySelector("input");
  const rateInput = row.children[2].querySelector("input");
  const totalEl = row.children[3].querySelector(".total-value");
  const delBtn = row.querySelector(".delDirectLaborRow");

  function recalc() {
    const q = parseFloat(qtyInput.value) || 0;
    const r = parseFloat(rateInput.value) || 0;
    totalEl.textContent = (q * r).toFixed(2);
    zn(); dt();
  }
  qtyInput.addEventListener("input", recalc);
  rateInput.addEventListener("input", recalc);

  delBtn.addEventListener("click", () => { row.remove(); zn(); dt(); });

  y.appendChild(row);
  recalc();
  dt();
}

// FIXED: Enhanced yn function with robust labor ID handling
// === Replace addDirectLaborToRecipe (yn) with this ===
function yn() {
  const sel = document.getElementById("directLaborSelect");
  const timeInput = document.getElementById("timeRequirement");
  if (!sel) { alert("Direct labor select missing"); return; }
  const selVal = sel.value;
  const time = parseFloat(timeInput ? timeInput.value : NaN);
  if (!selVal) { alert("Please select a direct labor item"); sel && sel.focus(); return; }
  if (isNaN(time) || time <= 0) { alert("Please enter a valid time requirement (greater than 0)"); timeInput && timeInput.focus(); return; }

  const opt = sel.options[sel.selectedIndex];
  let laborId = null, displayName = "", unit = (opt && opt.dataset.unit) || "hours", rate = parseFloat((opt && opt.dataset.rate) || 0) || 0;

  if (selVal.startsWith("manual-")) {
    laborId = null;
    displayName = opt.dataset.laborName || opt.text || "Manual Labor";
  } else if (selVal.startsWith("directLabor-")) {
    laborId = selVal.split("-").slice(1).join("-");
    const master = Vt().find(m => String(m.id) === String(laborId));
    if (!master) { alert("Selected labor not found; reload list"); In(); return; }
    displayName = master.name; unit = master.costUnit || unit; rate = Number(master.costPerUnit || rate);
  } else {
    // defensive fallback
    displayName = opt.dataset.laborName || opt.text || "Manual Labor";
    laborId = opt.dataset.laborId || null;
  }

  if (window.currentEditingLaborRow) {
    const ctx = window.currentEditingLaborRow;
    fn(displayName, time.toFixed(2), unit, rate, laborId);
    // move appended row to original index
    const appended = y.lastElementChild;
    if (ctx.rowIndex != null && ctx.rowIndex >= 0 && y.children.length > ctx.rowIndex) {
      y.removeChild(appended);
      if (ctx.rowIndex >= y.children.length) y.appendChild(appended);
      else y.insertBefore(appended, y.children[ctx.rowIndex]);
    }
    window.currentEditingLaborRow = null;
    const addBtn = document.querySelector(".add-labor-section .btn-primary");
    if (addBtn) { addBtn.textContent = "Add Direct Labor"; addBtn.onclick = yn; addBtn.classList.remove("update-mode"); }
    Wt(`Updated ${displayName} in recipe`, "success");
  } else {
    fn(displayName, time.toFixed(2), unit, rate, laborId);
    Wt(`Added ${displayName} to recipe`, "success");
  }

  if (sel) sel.value = "";
  if (timeInput) timeInput.value = "";
  const rateDisplay = document.getElementById("selectedLaborRate");
  const rateUnit = document.getElementById("selectedLaborRateUnit");
  if (rateDisplay) rateDisplay.value = "";
  if (rateUnit) rateUnit.textContent = "/hour";
  zn(); dt(); In();
}

function xn() {
  try {
    // Delegate to yn which handles add/update flows (yn checks currentEditingLaborRow)
    return yn();
  } catch (err) {
    console.error("xn (updateDirectLaborRow) error:", err);
  }
}

function bn(e) {
  console.log(`🔄 Starting edit for row: ${e}`);
  
  const row = document.getElementById(e);
  if (!row) {
    console.error(`❌ Row not found: ${e}`);
    return;
  }
  
  // Get all row data
  const itemName = row.children[0].querySelector("input").value;
  const quantity = parseFloat(row.children[1].querySelector("input").value) || 0;
  const unit = row.children[1].querySelector(".quantity-unit").textContent;
  const itemType = row.dataset.type || "rawMaterial";
  const subRecipeId = row.dataset.subRecipeId || null;
  
  console.log(`📝 Editing: "${itemName}", type: ${itemType}, quantity: ${quantity}, unit: ${unit}, subRecipeId: ${subRecipeId}`);
  
  // Store editing context
  window.currentEditingRow = { 
    rowId: e, 
    type: itemType, 
    subRecipeId: subRecipeId,
    itemName: itemName
  };
  
  // Remove row from table (will be re-added after update)
  row.remove();
  
  // Populate form based on item type
  let foundItem = false;
  
  if (itemType === "rawMaterial") {
    // Find raw material master
    const masterItem = Yt().find(item => item.name === itemName);
    if (masterItem && _) {
      _.value = `rawMaterial-${masterItem.id}`;
      hn(); // Update unit display
      foundItem = true;
      console.log(`✅ Found raw material master: ${masterItem.name}`);
    }
  } else if (itemType === "sub-recipe") {
    // CRITICAL FIX: Find sub-recipe master using multiple strategies
    let masterItem = null;
    
    // Strategy 1: Find by subRecipeId (most reliable)
    if (subRecipeId) {
      masterItem = Gt().find(item => 
        item.type === 'sub' && String(item.id) === String(subRecipeId)
      );
      console.log(`🔍 Strategy 1 (by subRecipeId: ${subRecipeId}):`, masterItem ? `Found ${masterItem.name}` : 'Not found');
    }
    
    // Strategy 2: Find by exact name match
    if (!masterItem) {
      masterItem = Gt().find(item => 
        item.type === 'sub' && item.name === itemName
      );
      console.log(`🔍 Strategy 2 (by exact name: ${itemName}):`, masterItem ? `Found ${masterItem.name}` : 'Not found');
    }
    
    // Strategy 3: Find by case-insensitive name match
    if (!masterItem) {
      masterItem = Gt().find(item => 
        item.type === 'sub' && item.name.toLowerCase() === itemName.toLowerCase()
      );
      console.log(`🔍 Strategy 3 (by case-insensitive name):`, masterItem ? `Found ${masterItem.name}` : 'Not found');
    }
    
    // Strategy 4: Find by name contains
    if (!masterItem) {
      masterItem = Gt().find(item => 
        item.type === 'sub' && item.name.toLowerCase().includes(itemName.toLowerCase())
      );
      console.log(`🔍 Strategy 4 (by name contains):`, masterItem ? `Found ${masterItem.name}` : 'Not found');
    }
    
    if (masterItem && _) {
      _.value = `subrecipe-${masterItem.id}`;
      hn(); // Update unit display
      foundItem = true;
      console.log(`✅ FINALLY Found sub-recipe master: ${masterItem.name} - Dropdown should be pre-selected now`);
      
      // CRITICAL: Force the dropdown to show the selected value
      setTimeout(() => {
        if (_.value === `subrecipe-${masterItem.id}`) {
          console.log(`✅ CONFIRMED: Dropdown successfully set to: ${masterItem.name}`);
        } else {
          console.error(`❌ DROPDOWN SET FAILED: Expected subrecipe-${masterItem.id}, got ${_.value}`);
        }
      }, 100);
    }
  }
  
  // Populate quantity field
  if (J) {
    J.value = quantity;
    console.log(`📏 Set quantity field: ${quantity}`);
  }
  
  // Update button to "Update Item" 
  const addButton = document.querySelector(".add-ingredient-section .btn-primary");
  if (addButton) {
    addButton.textContent = "Update Item";
    addButton.onclick = vn;
    addButton.classList.add("update-mode");
    console.log(`🔄 Button changed to "Update Item"`);
  }
  
  if (!foundItem && itemType === "sub-recipe") {
    console.error(`❌ CRITICAL: Could not find sub-recipe master for: ${itemName}`);
    console.log(`📋 Available sub-recipes:`, Gt().filter(r => r.type === 'sub').map(r => r.name));
  }
  
  zn(); // Update totals
  console.log(`✅ Edit mode activated for: ${itemName}`);
}

// Add this function to debug dropdown issues
function debugDropdown() {
  const select = document.getElementById("unifiedItemSelect");
  if (!select) {
    console.error("❌ unifiedItemSelect not found");
    return;
  }
  
  console.log("🔍 DROPDOWN DEBUG:");
  console.log("Current value:", select.value);
  console.log("All options:");
  Array.from(select.options).forEach(opt => {
    console.log(`  - ${opt.value}: ${opt.text} ${opt.value === select.value ? '(SELECTED)' : ''}`);
  });
}

// Call this after populating the form in bn() function
// Add this line at the end of the bn() function:
setTimeout(debugDropdown, 150);

function vn() {
  if (!window.currentEditingRow) {
    console.warn("❌ No current editing row found");
    return void Cn();
  }
  
  console.log(`🔄 Updating item in recipe...`);
  Cn(); // This will add the updated item
  
  // Reset the form and button
  const addButton = document.querySelector(".add-ingredient-section .btn-primary");
  if (addButton) {
    addButton.textContent = "Add to Recipe";
    addButton.onclick = Cn;
    addButton.classList.remove("update-mode");
    console.log(`🔄 Reset button to Add mode`);
  }
  
  // Clear the form
  if (_) _.value = "";
  if (J) J.value = "";
  if (j) j.textContent = "g";
  
  (window.currentEditingRow = null);
  console.log(`✅ Item update completed`);
}

function hn() {
  const selectedValue = _.value;
  if (!selectedValue) {
    if (j) j.textContent = "g";
    return;
  }

  const [itemType, itemId] = selectedValue.split("-");
  const id = parseInt(itemId);

  if ("rawMaterial" === itemType) {
    const masterItem = Yt().find((item) => item.id === id);
    if (masterItem && j) {
      j.textContent = masterItem.costUnit || masterItem.unit || "g";
      console.log(`📏 Set unit for raw material: ${masterItem.costUnit}`);
    }
  } else if ("subrecipe" === itemType) {
    const masterItem = Gt().find((item) => item.id === id && item.type === 'sub');
    if (masterItem && j) {
      const displayUnit = masterItem.costUnit || masterItem.yieldUnit || masterItem.outputUnit || "batch";
      j.textContent = displayUnit;
      console.log(`📏 Set unit for sub-recipe: ${displayUnit} (${masterItem.name})`);
      
      // Also update the quantity field placeholder if it exists
      const quantityInput = document.getElementById("ingredientQuantity");
      if (quantityInput) {
        quantityInput.placeholder = `Quantity in ${displayUnit}`;
      }
    }
  }
}

// FIXED: Named change handler for direct labor select
// === Add or replace this named handler (used by In) ===
function handleDirectLaborSelectChange() {
  try {
    const sel = window.directLaborSelect || document.getElementById("directLaborSelect");
    if (!sel) return;
    const opt = sel.options[sel.selectedIndex];
    const rateDisplay = document.getElementById("selectedLaborRate");
    const rateUnit = document.getElementById("selectedLaborRateUnit");
    const timeUnitEl = document.getElementById("timeRequirementUnit");
    const timeInput = document.getElementById("timeRequirement");

    if (!opt || !opt.value) {
      if (rateDisplay) { rateDisplay.value = ""; rateDisplay.classList.remove("success","error"); }
      if (rateUnit) rateUnit.textContent = "/hour";
      if (timeUnitEl) timeUnitEl.textContent = "hours";
      return;
    }

    const dsRate = opt.dataset.rate;
    const dsUnit = opt.dataset.unit || "hours";

    if (rateDisplay) {
      if (dsRate && !isNaN(parseFloat(dsRate))) {
        rateDisplay.value = parseFloat(dsRate).toFixed(2);
        rateDisplay.classList.add("success");
        rateDisplay.classList.remove("error");
      } else {
        rateDisplay.value = "";
        rateDisplay.classList.remove("success");
        rateDisplay.classList.add("error");
      }
    }
    if (rateUnit) rateUnit.textContent = "/" + dsUnit;
    if (timeUnitEl) timeUnitEl.textContent = dsUnit;
    if (timeInput) setTimeout(() => timeInput.focus(), 100);
  } catch (err) {
    console.error("handleDirectLaborSelectChange error", err);
  }
}

// === REPLACE the direct labor select population function with this ===
function In(preserveValue = null) {
  const sel = document.getElementById("directLaborSelect");
  if (!sel) {
    console.error("In(): Direct labor select element not found");
    return false;
  }

  sel.innerHTML = '<option value="">Select direct labor...</option>';

  const items = Vt() || [];
  if (items.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No direct labor items available";
    opt.disabled = true;
    sel.appendChild(opt);
    window.directLaborSelect = sel;
    K = sel;
    return false;
  }

  go(items).forEach(item => {
    const opt = document.createElement("option");
    opt.value = `directLabor-${item.id}`;
    opt.textContent = `${item.name} (${uo(Number(item.costPerUnit) || 0)}/${item.costUnit})`;
    opt.dataset.unit = item.costUnit || "hours";
    opt.dataset.rate = String(item.costPerUnit ?? "");
    opt.dataset.laborName = item.name;
    opt.dataset.laborId = String(item.id);
    sel.appendChild(opt);
  });

  window.directLaborSelect = sel;
  K = sel;
  try {
    if (sel._labHandlerAttached) sel.removeEventListener("change", handleDirectLaborSelectChange);
    sel.addEventListener("change", handleDirectLaborSelectChange);
    sel._labHandlerAttached = true;
  } catch (err) {
    console.warn("In(): failed to attach handler", err);
  }

  if (preserveValue != null && String(preserveValue) !== "") {
    const want = String(preserveValue);
    const found = Array.from(sel.options).find(o => o.value === want);
    if (found) {
      sel.value = want;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }
    return false;
  }

  return false;
}

// FIXED: Completely rewritten wn function with robust laborId-based selection
// === Replace editDirectLaborRow with this ===
function wn(rowId) {
  const row = document.getElementById(rowId);
  if (!row) return;

  const laborName = row.children[0].querySelector("input").value || "";
  const timeValue = parseFloat(row.children[1].querySelector("input").value) || 0;
  const laborId = row.dataset.laborId ?? null;

  // store index for reinsertion
  const parent = y;
  const idx = parent ? Array.prototype.indexOf.call(parent.children, row) : -1;
  window.currentEditingLaborRow = { rowId, laborName, laborId, rowIndex: idx };

  // remove row while editing
  row.remove();

  // Try to preselect by prefixed id
  const sel = document.getElementById("directLaborSelect");
  let applied = false;
  if (laborId) applied = In(`directLabor-${laborId}`);
  else In(null); // ensure select populated

  // strict name fallback (case-insensitive)
  if (!applied && sel && laborName) {
    const byName = Array.from(sel.options).find(o => (o.dataset.laborName || "").trim().toLowerCase() === laborName.trim().toLowerCase());
    if (byName) { sel.value = byName.value; sel.dispatchEvent(new Event("change", { bubbles: true })); applied = true; }
  }

  // if still not applied, add a temporary manual option and select it (no change dispatch)
  if (!applied && sel) {
    const tmp = `manual-${Date.now()}`;
    const opt = document.createElement("option");
    opt.value = tmp;
    opt.textContent = `${laborName || "Manual Labor"} (not in master list)`;
    opt.dataset.laborName = laborName || "";
    // copy old rate/unit into dataset for UI
    const oldRate = row.children[2].querySelector("input").value || "";
    const oldUnit = row.children[1].querySelector(".quantity-unit").textContent || "hours";
    opt.dataset.rate = oldRate;
    opt.dataset.unit = oldUnit;
    sel.appendChild(opt);
    sel.value = tmp;
  }

  // populate edit form controls
  const timeInput = document.getElementById("timeRequirement");
  if (timeInput) timeInput.value = parseFloat(timeValue).toFixed(2);
  const selectedOption = sel ? sel.options[sel.selectedIndex] : null;
  const rateDisplay = document.getElementById("selectedLaborRate");
  const rateUnit = document.getElementById("selectedLaborRateUnit");
  if (selectedOption && rateDisplay) {
    if (selectedOption.dataset.rate && !isNaN(parseFloat(selectedOption.dataset.rate))) {
      rateDisplay.value = parseFloat(selectedOption.dataset.rate).toFixed(2);
      rateDisplay.classList.add("success");
    } else rateDisplay.value = "";
    if (rateUnit) rateUnit.textContent = "/" + (selectedOption.dataset.unit || "hours");
  } else if (rateDisplay) {
    rateDisplay.value = "";
    if (rateUnit) rateUnit.textContent = "/hour";
  }

  // switch add button to Update mode
  const addBtn = document.querySelector(".add-labor-section .btn-primary");
  if (addBtn) { addBtn.textContent = "Update Labor"; addBtn.onclick = xn; addBtn.classList.add("update-mode"); }

  zn(); dt();
}

function Xn() {
  let e = `
        <div style="margin-bottom: var(--space-xl);">
            <p><strong>Welcome to ProfitPerPlate!</strong> This complete guide explains every field in simple terms with practical examples for beginners.</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-xl);">
            <div>
                <h4 style="color: var(--primary); border-bottom: 1px solid var(--border); padding-bottom: var(--space-sm);">Raw Materials & Recipe Fields</h4>
    `;
  [
    "ingredientName",
    "ingredientCategory",
    "purchasePrice",
    "purchaseQuantity",
    "purchaseUnit",
    "costPerUnit",
    "selectItem",
    "quantity",
    "servings"
  ].forEach((t) => {
    const n = d[t];
    if (n) {
      e += `
                <div style="margin-bottom: var(--space-lg); padding-bottom: var(--space-lg); border-bottom: 1px dashed var(--border);">
                    <strong>${n.title}</strong>
                    <p style="margin: var(--space-sm) 0; font-size: 13px;">${n.content}</p>
                    <div class="field-example">
                        <strong>Example:</strong> ${n.example}
                    </div>
                </div>
            `;
    }
  });

  e += `
            </div>
            <div>
                <h4 style="color: var(--primary); border-bottom: 1px solid var(--border); padding-bottom: var(--space-sm);">Direct Labor & Business Fields</h4>
    `;

  [
    "laborName",
    "shiftRate",
    "shiftDuration",
    "timeUnit",
    "costUnit",
    "markup",
    "tax",
    "vat",
    "servingScale",
    "subRecipeName",
    "subRecipeCategory",
    "subRecipeYieldQuantity",
    "yieldPercentage",
    "selectedLaborRate"
  ].forEach((t) => {
    const n = d[t];
    if (n) {
      e += `
                <div style="margin-bottom: var(--space-lg); padding-bottom: var(--space-lg); border-bottom: 1px dashed var(--border);">
                    <strong>${n.title}</strong>
                    <p style="margin: var(--space-sm) 0; font-size: 13px;">${n.content}</p>
                    <div class="field-example">
                        <strong>Example:</strong> ${n.example}
                    </div>
                </div>
            `;
    }
  });

  e += `
            </div>
        </div>

        <div style="margin-top: var(--space-xl); padding: var(--space-lg); background: var(--background); border-radius: var(--radius-lg);">
            <h4 style="color: var(--primary); margin-top: 0;">Quick Tip for Beginners</h4>
            <p>Start by adding your raw materials with their purchase details and direct labor items with shift details. Then create recipes by adding those items with the quantities or time required. Finally, set your desired markup and number of servings to see your profit per plate!</p>
            <p><strong>Remember:</strong> Accurate costs for both materials and labor lead to accurate profit calculations. Don't forget to account for yield (waste) for raw materials.</p>
        </div>
    `;

  return e;
}

function Cn() {
  const e = _.value;
  const t = parseFloat(J.value);
  
  if (!e || !t) {
    alert("Please select an item and enter quantity/time");
    return;
  }
  
  const [n, o] = e.split("-");
  const a = parseInt(o);
  
  if ("rawMaterial" === n) {
    const e = Yt().find((e) => e.id === a);
    if (!e) return;
    const n = e.costUnit;
    const o = e.costPerUnit;
    
    if (window.currentEditingRow) {
      gn(e.name, t.toFixed(2), n, o.toFixed(2), "rawMaterial");
      window.currentEditingRow = null;
      const addButton = document.querySelector(".add-ingredient-section .btn-primary");
      if (addButton) {
        addButton.textContent = "Add to Recipe";
        addButton.onclick = Cn;
        addButton.classList.remove("update-mode");
      }
    } else {
      gn(e.name, t.toFixed(2), n, o.toFixed(2), "rawMaterial");
    }
  } else if ("subrecipe" === n) {
    const e = Gt().find((e) => e.id === a);
    if (!e) return;
    const n = e.costPerUnit || 0;
    const o = e.costUnit || e.outputUnit || "batch";
    
    // CRITICAL: Pass the subRecipeId to ensure SUB badge displays
    if (window.currentEditingRow) {
      gn(e.name, t.toFixed(2), o, n.toFixed(2), "sub-recipe", e.id);
      window.currentEditingRow = null;
      const addButton = document.querySelector(".add-ingredient-section .btn-primary");
      if (addButton) {
        addButton.textContent = "Add to Recipe";
        addButton.onclick = Cn;
        addButton.classList.remove("update-mode");
      }
      console.log(`✅ Updated sub-recipe item with SUB badge: ${e.name}`);
    } else {
      gn(e.name, t.toFixed(2), o, n.toFixed(2), "sub-recipe", e.id);
      console.log(`✅ Added new sub-recipe item with SUB badge: ${e.name}`);
    }
  }
  
  // Clear form
  if (_) _.value = "";
  if (J) J.value = "";
  if (j) j.textContent = "g";
}

function En() {
  let e = 0,
    t = 0;
  return (
    f &&
      f.querySelectorAll("tr").forEach((t) => {
        const n = parseFloat(t.children[1].querySelector("input").value) || 0,
          o = parseFloat(t.children[2].querySelector("input").value) || 0;
        e += n * o;
      }),
    y &&
      y.querySelectorAll("tr").forEach((e) => {
        const n = parseFloat(e.children[1].querySelector("input").value) || 0,
          o = parseFloat(e.children[2].querySelector("input").value) || 0;
        t += n * o;
      }),
    parseFloat((e + t).toFixed(2))
  );
}

// Sub-recipe save wrapper function - THIS IS MISSING
function Sn() {
  Ln();
}

// ======= Enhanced Ln() - Save Sub-Recipe =======
// Replace the sub-recipe save function Ln().
// Locate: search for "function Ln()" (Enhanced Ln() - Save Sub-Recipe) and replace the entire block.
function Ln() {
  console.log("🚀 SUB-RECIPE SAVE (Ln) - Starting save flow...");

  try {
    const nameEl = document.getElementById("subRecipeNameDisplay");
    const categoryEl = document.getElementById("subRecipeCategory");
    const yieldQtyEl = document.getElementById("subRecipeYieldQuantity");
    const yieldUnitEl = document.getElementById("subRecipeYieldUnit");
    const costPerUnitEl = document.getElementById("subRecipeCostPerUnit");
    const costUnitEl = document.getElementById("subRecipeCostUnit");
    const totalCost = parseFloat(En()) || 0; // En() returns total cost from current recipe table
    const yieldQty = parseFloat(yieldQtyEl ? yieldQtyEl.value : 1) || 1;
    const category = categoryEl ? categoryEl.value : "weight";
    const yieldUnit = yieldUnitEl ? yieldUnitEl.value : "g";
    const chosenCostUnit = (costUnitEl && costUnitEl.value) ? costUnitEl.value : (yieldUnit || "unit");

    const UM = (window.a && typeof window.a === "object") ? window.a : {
      kg: 1e3, g: 1, mg: 0.001, lbs: 453.592, oz: 28.3495,
      L: 1e3, ml: 1, cup: 236.588, tbsp: 14.7868, tsp: 4.92892,
      dozen: 12, pc: 1, hours: 60, minutes: 1
    };

    function convertCost(costPerFromUnit, fromUnit, toUnit) {
      if (!fromUnit || !toUnit) return Number(costPerFromUnit) || 0;
      const f = UM[fromUnit] || 1;
      const t = UM[toUnit] || 1;
      if (!f || !t) return Number(costPerFromUnit) || 0;
      return Number(costPerFromUnit) * (t / f);
    }

    if (!nameEl || !nameEl.value.trim()) {
      alert("Please enter a sub-recipe name.");
      nameEl && nameEl.focus();
      return;
    }
    if (yieldQty <= 0 || !Number.isFinite(totalCost)) {
      alert("Cannot save sub-recipe. Ensure total cost > 0 and yield quantity > 0.");
      return;
    }

    const recipeName = nameEl.value.trim();
    const rawItems = ro(); // gather rawMaterial rows from UI
    const laborItems = lo(); // gather direct labor rows from UI
    const isEditing = window.t && window.t.type === "subRecipe" && window.t.id;
    const originalId = isEditing ? window.t.id : null;

    function computeCanonicalCostPerUnit() {
      const entered = parseFloat(costPerUnitEl ? costPerUnitEl.value : NaN);
      if (Number.isFinite(entered) && entered > 0) return entered;
      const base = totalCost / (yieldQty || 1);
      const from = yieldUnit || chosenCostUnit || "unit";
      const to = chosenCostUnit || yieldUnit || from;
      try {
        return convertCost(base, from, to);
      } catch (err) {
        console.warn("Ln(): unit conversion fallback due to error:", err);
        return base;
      }
    }

    function performSave(action, providedName = null) {
      try {
        const finalName = (providedName && String(providedName).trim()) ? String(providedName).trim() : recipeName;
        const newId = action === "replace" && originalId ? originalId : Date.now();

        const canonicalCostPerUnit = computeCanonicalCostPerUnit();
        const finalCostUnit = chosenCostUnit || yieldUnit || "unit";

        const subRecipeData = {
          id: newId,
          name: finalName,
          type: "sub",
          category: category,
          yieldQuantity: yieldQty,
          yieldUnit: yieldUnit,
          costPerUnit: Number.isFinite(canonicalCostPerUnit) ? parseFloat(canonicalCostPerUnit.toFixed(4)) : 0,
          costUnit: finalCostUnit,
          rawMaterialItems: rawItems,
          directLaborItems: laborItems,
          totalCost: parseFloat(totalCost.toFixed(2)),
          createdAt: new Date().toISOString()
        };

        const allRecipes = Gt() || [];
        if (action === "replace" && originalId) {
          const idx = allRecipes.findIndex(r => String(r.id) === String(originalId) && r.type === "sub");
          if (idx !== -1) {
            allRecipes[idx] = subRecipeData;
            Wt(`Sub-recipe "${finalName}" updated successfully!`, "success");
          } else {
            allRecipes.push(subRecipeData);
            Wt(`Sub-recipe "${finalName}" saved (fallback new).`, "warning");
          }
        } else {
          allRecipes.push(subRecipeData);
          Wt(`Sub-recipe "${finalName}" saved successfully!`, "success");
        }

        jt(allRecipes); // write recipes into global state (calls dt())
        Fn(); // re-render recipe cards
        Kn(); // update summary recipe select

        try {
          mn(`subrecipe-${subRecipeData.id}`);
        } catch (err) {
          console.warn("mn() preselect failed:", err);
        }

        try { In(); } catch (err) { /* ignore */ }

        initiateTimedReload();

        setTimeout(() => {
          try {
            let updatedCount = 0;
            if (window.CascadeSystem && typeof window.CascadeSystem.recalculateAllRecipesOnMasterChange === "function") {
              updatedCount = window.CascadeSystem.recalculateAllRecipesOnMasterChange();
            } else if (typeof Ot === "function") {
              Ot(subRecipeData, 'rawMaterial');
            }
            if (updatedCount > 0 && typeof Wt === "function") {
              Wt(`Automatically updated costs across ${updatedCount} recipes/sub-recipes`, "success");
            }
          } catch (err) {
            console.error("Sub-recipe cascade error:", err);
          } finally {
            try { if (typeof ct === "function") ct(); } catch (err) { console.warn("ct() failed:", err); }
          }
        }, 50);

        Mn && typeof Mn === "function" && Mn(); // close sub-recipe modal
        t = { type: null, id: null, data: null };

      } catch (err) {
        console.error("performSave error:", err);
        Wt("Error while saving sub-recipe. See console for details.", "error");
      }
    }

    // Duplicate-check with modal
    if (!p(recipeName, "subRecipe", originalId, performSave)) {
      performSave(isEditing ? "replace" : "new");
    }
  } catch (err) {
    console.error("Ln() failed:", err);
    Wt("Failed to save sub-recipe. See console for details.", "error");
  }
}

// Sub-recipe modal close function - might also be missing
function Mn() { 
  document.getElementById("subRecipeSaveModal").classList.add("hidden");
  if (ne) {
    ne.disabled = false;
    ne.title = "";
  }
  if (ae) {
    ae.disabled = false;
    ae.title = "";
  }
  if (re) {
    re.disabled = false;
    re.title = "";
  }
}

// Sub-recipe cost display update function - might also be missing
function eo() {
  if (!le) return;
  const e = parseFloat(En()) || 0,
    t = parseFloat(oe ? oe.value : 1) || 1,
    n = ae ? ae.value : r || "g",
    o = re ? re.value : n || "g";
  let i = 0;
  try {
    if (t > 0 && a[n] && a[o]) {
      i = (e / (t * a[n])) * a[o];
    } else i = t > 0 ? e / t : 0;
  } catch (e) {
    console.error("Error computing sub-recipe cost per unit:", e), (i = 0);
  }
  if (
    ((le.textContent = `${tt}${e.toFixed(2)}`),
    ie &&
      (isFinite(i)
        ? (ie.value = parseFloat(i).toFixed(4))
        : (ie.value = "0.0000")),
    se)
  ) {
    const e = isFinite(i) ? parseFloat(i).toFixed(4) : "0.0000";
    se.textContent = `${tt}${e} per ${o}`;
  }
  try {
    const e = document.getElementById("subRecipeCostPerUnitField"),
      t = document.getElementById("subRecipeCostUnitField");
    e && (e.value = isFinite(i) ? parseFloat(i).toFixed(4) : "0.0000"),
      t && (t.value = o || n || "unit");
  } catch (e) {
    console.warn("Could not update canonical sub-recipe hidden fields:", e);
  }
}

// Sub-recipe unit options update function - might also be missing
function to() {
  if (!ne) return;
  const e = ne.value;
  [ae, re].forEach((t) => {
    t &&
      ((t.innerHTML = ""),
      i[e].forEach((e) => {
        const n = document.createElement("option");
        (n.value = e), (n.textContent = e), t.appendChild(n);
      }));
  }),
    eo();
}

function saveSubRecipeWithDuplicateCheck() {
  Ln();
}

// =============================================================================
// MANUAL SAVE: UPDATED MAIN RECIPES FUNCTIONS
// =============================================================================

function Pn(e, t) {
  const n = x.value.trim();
  if (!n) return alert("Please enter a recipe name"), void x.focus();
  const o = ro(),
    a = lo(),
    i = (i, r = null) => {
      const l = r || n,
        s = {
          id: "replace" === i ? t.id : Date.now(),
          name: l,
          type: e,
          rawMaterialItems: o,
          directLaborItems: a,
          totalCost: En(),
          servings: parseFloat(D ? D.value : 1) || 1,
          createdAt: new Date().toISOString()
        },
        c = Gt();
      if ("replace" === i) {
        const e = c.findIndex((e) => e.id === t.id);
        -1 !== e &&
          ((c[e] = s), Wt(`Recipe "${l}" updated successfully!`, "success"));
      } else c.push(s), Wt(`Recipe "${l}" saved successfully!`, "success");
      jt(c), Fn(), Kn(), (t = { type: null, id: null, data: null }), Ht();

      // ➤ MANUAL SAVE TRIGGER: Main Recipe added/updated
      console.log("💾 Manual save triggered: Main Recipe " + ("replace" === i ? "updated" : "added"));
      ct(); // Trigger cloud save
    
      initiateTimedReload();
    
    };
  p(n, "main" === e ? "mainRecipe" : "subRecipe", t?.id, i) ||
    i(t?.id ? "replace" : "new");
}

function $n(e) {
  if (!x.value.trim())
    return alert("Please enter a recipe name"), void x.focus();
  Pn(e, t);
}

// FIXED: Enhanced labor select handler with K reference updates
function Rn() {
  const selectEl = document.getElementById("directLaborSelect");
  if (!selectEl) {
    console.error("❌ Direct labor select element not found");
    return;
  }
  
  console.log("🔧 Setting up direct labor select handler...");
  
  // Remove any existing change handler to prevent duplicates
  selectEl.removeEventListener("change", handleDirectLaborSelectChange);
  
  // Set global references
  window.directLaborSelect = selectEl;
  K = selectEl;
  
  // Attach the named change handler
  selectEl.addEventListener("change", handleDirectLaborSelectChange);
  
  console.log("✅ Direct labor select handler attached successfully");
}

function Fn() {
  const e = Gt(); // Get all recipes
  const t = fo(e.filter((e) => "main" === e.type));
  const n = fo(e.filter((e) => "sub" === e.type));

  // 1. Render Main Recipes
  if (ce) {
    ce.innerHTML = t.map((e) => `
      <div class="recipe-item" onclick="loadRecipe(${e.id})">
        <div class="card-content-grid">
          <div class="card-left-col">
            <div class="card-title-row">
              <h4>${po(e.name)}</h4>
            </div>
            <div class="card-details-row">
              <p>Total: ${uo(Number(e.totalCost) || 0)} • ${e.servings || 1} serv</p>
            </div>
          </div>
          
          <div class="card-right-col">
            <div class="action-row-1">
              <button class="btn-secondary small" onclick="editRecipe(${e.id}, event)">Edit</button>
            </div>
            <div class="action-row-2">
              <button class="btn-danger small" onclick="deleteRecipe(${e.id}, event)">Delete</button>
            </div>
          </div>
        </div>
      </div>
    `).join("");
  }

  // 2. Render Sub-Recipes
  if (de) {
    de.innerHTML = n.map((e) => {
      const costPerUnit = Number(e.costPerUnit);
      const displayCost = Number.isFinite(costPerUnit) ? uo(costPerUnit) : uo(0);
      const unit = e.costUnit || e.outputUnit || "unit";
      
      return `
      <div class="recipe-item" onclick="loadSubRecipe(${e.id})">
        <div class="card-content-grid">
          <div class="card-left-col">
            <div class="card-title-row">
              <h4>${po(e.name)}</h4>
            </div>
            <div class="card-details-row">
              <div class="card-content">
                <strong>${displayCost} / ${unit}</strong>
                <span style="display:block; font-size:11px; color:#888;">Batch: ${uo(Number(e.totalCost)||0)}</span>
              </div>
            </div>
          </div>
          
          <div class="card-right-col">
            <div class="action-row-1">
              <button class="btn-secondary small" onclick="editSubRecipe(${e.id}, event)">Edit</button>
            </div>
            <div class="action-row-2">
              <button class="btn-danger small" onclick="deleteRecipe(${e.id}, event)">Delete</button>
            </div>
          </div>
        </div>
      </div>
      `;
    }).join("");
  }
}

// ENHANCED: Updated recipe edit function to ensure modal opens correctly
function kn(e) {
  const n = Gt().find((t) => t.id === e);
  if (!n) return;
  const o = l(n);
  f && (f.innerHTML = ""),
    y && (y.innerHTML = ""),
    x && (x.value = o.name),
    D && (D.value = o.servings || 1),
    o.rawMaterialItems.forEach((e) => {
      gn(
        e.name,
        e.quantity,
        e.unit,
        e.unitCost,
        e.type || "rawMaterial",
        e.subRecipeId || null
      );
    }),
    o.directLaborItems.forEach((e) => {
      const t = e.unitCost ?? e.rate ?? e.costPerUnit ?? 0,
        n = e.unit ?? e.timeUnit ?? "hours";
      fn(e.name, e.quantity, n, t);
    }),
    (t = { type: "mainRecipe", id: e, data: n }),
    it("recipes"),
    zn();
}

// ENHANCED: Updated sub-recipe edit function to ensure modal opens correctly
function Bn(e) {
  const n = Gt().find((t) => t.id === e && "sub" === t.type);
  if (!n) return;
  const o = l(n);
  f && (f.innerHTML = ""),
    y && (y.innerHTML = ""),
    x && (x.value = o.name),
    o.rawMaterialItems.forEach((e) => {
      gn(e.name, e.quantity, e.unit, e.unitCost, "rawMaterial");
    }),
    o.directLaborItems.forEach((e) => {
      const t = e.unitCost ?? e.rate ?? e.costPerUnit ?? 0,
        n = e.unit ?? e.timeUnit ?? "hours";
      fn(e.name, e.quantity, n, t);
    }),
    (t = { type: "subRecipe", id: e, data: n }),
    it("recipes"),
    zn();
}

// ENHANCED: Updated recipe edit function to ensure modal opens correctly
function Un(e, n) {
  n && n.stopPropagation();
  const o = Gt().find((t) => t.id === e);
  if (o) {
    console.log("🔄 Loading main recipe for editing:", o.name);
    kn(e); // Load recipe into builder
    t = { type: "mainRecipe", id: e, data: o };
    
    // Ensure recipe builder modal opens
    setTimeout(() => {
      openRecipeBuilderModal(false); // false prevents reset
      Wt(`Editing recipe: ${o.name}`, "info");
    }, 100);
  }
}

// ENHANCED: Updated sub-recipe edit function to ensure modal opens correctly
function Tn(e, n) {
  n && n.stopPropagation();
  const o = Gt().find((t) => t.id === e && "sub" === t.type);
  if (o) {
    console.log("🔄 Loading sub-recipe for editing:", o.name);
    Bn(e); // Load sub-recipe into builder
    t = { type: "subRecipe", id: e, data: o };
    
    // Ensure recipe builder modal opens
    setTimeout(() => {
      openRecipeBuilderModal(false); // false prevents reset
      Wt(`Editing sub-recipe: ${o.name}`, "info");
    }, 100);
  }
}

// =============================================================================
// MANUAL SAVE: UPDATED RECIPE DELETE FUNCTION
// =============================================================================

function qn(e, o) {
  if (
    (o && o.stopPropagation(),
    !confirm("Are you sure you want to delete this recipe?"))
  )
    return;
    
  jt(Gt().filter((t) => t.id !== e));
  Fn();
  mn();
  Kn();
  if (t.id === e) t = { type: null, id: null, data: null };
  if (n && n.id === e) { n = null; Ve && Ve.classList.add("hidden"); _n(); }

  // ➤ MANUAL SAVE TRIGGER: Recipe deleted
  console.log("💾 Manual save triggered: Recipe deleted");
  ct(); // Trigger cloud save
    
  Wt("Recipe deleted successfully!", "success");
}

function Dn(e) {
  Hn(),
    t && "subRecipe" === t.type
      ? "replace" === e
        ? Ln()
        : "new" === e && ((t.id = null), Ln())
      : "replace" === e
      ? Pn("mainRecipe" === t.type ? "main" : "sub", t)
      : "new" === e &&
        ((t.id = null), Pn("mainRecipe" === t.type ? "main" : "sub", t));
}

function An() {
  O && O.classList.add("hidden");
}

function Nn() {
  V && V.classList.add("hidden");
}

function Hn() {
  ue && ue.classList.add("hidden");
}

function On(e, n, o) {
  if (!pe || !me || !ue) return;
  const a = "main" === e ? "Main Recipe" : "Sub-Recipe";
  (pe.textContent = `Save ${a}`),
    (me.innerHTML = `\n        <p>A ${a.toLowerCase()} named "<strong>${po(
      o
    )}</strong>" already exists.</p>\n        <p>Would you like to replace the existing recipe or save this as a new recipe?</p>\n    `),
    (t = {
      type: "main" === e ? "mainRecipe" : "subRecipe",
      id: n,
      data: null
    }),
    ue.classList.remove("hidden");
}

// =============================================================================
// COST CALCULATION AND SUMMARY FUNCTIONS
// =============================================================================

function zn() {
  const e = parseFloat(D ? D.value : 1) || 1;
  let t = 0,
    o = 0;
  f &&
    f.querySelectorAll("tr").forEach((e) => {
      const n = parseFloat(e.children[1].querySelector("input").value) || 0,
        o = parseFloat(e.children[2].querySelector("input").value) || 0;
      t += n * o;
    }),
    y &&
      y.querySelectorAll("tr").forEach((e) => {
        const t = parseFloat(e.children[1].querySelector("input").value) || 0,
          n = parseFloat(e.children[2].querySelector("input").value) || 0;
        o += t * n;
      });
  const a = t + o;
  b && (b.textContent = `${tt}${t.toFixed(2)}`),
    v && (v.textContent = `${tt}${o.toFixed(2)}`),
    h && (h.textContent = `${tt}${a.toFixed(2)}`),
    n || Wn(t, o, a, e),
    n && Gn();

  // --- START FIX: Disable Save Sub-Recipe button if sub-recipe exists ---
  // L references 'saveSubRecipeBtn', f references 'recipeBody'
  if (f && L) {
    const hasSubRecipe = Array.from(f.querySelectorAll("tr")).some(
      (row) => row.dataset.type === "sub-recipe" || row.dataset.type === "subRecipe"
    );
    
    L.disabled = hasSubRecipe;
    
    // Apply visual feedback and tooltip
    if (hasSubRecipe) {
        L.style.opacity = "0.5";
        L.style.cursor = "not-allowed";
        
        // Enhanced tooltip system
        if (!L.hasAttribute('data-tooltip')) {
            L.setAttribute('data-tooltip', 'Cannot save as sub-recipe: Nested sub-recipes are not allowed.');
        }
        
        // Add tooltip hover events
        L.addEventListener('mouseenter', showTooltip);
        L.addEventListener('mouseleave', hideTooltip);
        
    } else {
        L.style.opacity = "1";
        L.style.cursor = "pointer";
        
        // Remove tooltip attributes and events
        L.removeAttribute('data-tooltip');
        L.removeEventListener('mouseenter', showTooltip);
        L.removeEventListener('mouseleave', hideTooltip);
    }
  }
  // --- END FIX ---
}

// --- START: Tooltip Functions ---
function showTooltip(e) {
    if (this.disabled) {
        // Create tooltip element if it doesn't exist
        let tooltip = document.getElementById('subRecipeTooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'subRecipeTooltip';
            tooltip.className = 'custom-tooltip';
            document.body.appendChild(tooltip);
        }
        
        // Set tooltip content and position
        tooltip.textContent = this.getAttribute('data-tooltip');
        tooltip.style.display = 'block';
        
        const rect = this.getBoundingClientRect();
        tooltip.style.left = (rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)) + 'px';
        tooltip.style.top = (rect.top - tooltip.offsetHeight - 8) + 'px';
    }
}

function hideTooltip() {
    const tooltip = document.getElementById('subRecipeTooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

// Add CSS for tooltip (inject if not exists)
if (!document.getElementById('tooltipStyles')) {
    const style = document.createElement('style');
    style.id = 'tooltipStyles';
    style.textContent = `
        .custom-tooltip {
            position: fixed;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            z-index: 10000;
            max-width: 250px;
            text-align: center;
            pointer-events: none;
            display: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .custom-tooltip::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            margin-left: -5px;
            border-width: 5px;
            border-style: solid;
            border-color: rgba(0, 0, 0, 0.8) transparent transparent transparent;
        }
    `;
    document.head.appendChild(style);
}
// --- END: Tooltip Functions ---

function Wn(e, t, n, o) {
  parseFloat(A ? A.value : 1);
  const a = parseFloat(U ? U.value : 0) || 0,
    i = parseFloat(T ? T.value : 0) || 0,
    r = parseFloat(q ? q.value : 0) || 0,
    l = (function (e, t, n) {
      const o = parseFloat(A ? A.value : 1) || 1,
        a = n > 0 ? (e / n) * o : 0,
        i = n > 0 ? (t / n) * o : 0;
      return {
        scaledRawMaterialsCost: a,
        scaledDirectLaborCost: i,
        scaledTotalCost: a + i,
        targetServings: o
      };
    })(e, t, o),
    s = l.scaledRawMaterialsCost,
    c = l.scaledDirectLaborCost,
    d = l.scaledTotalCost,
    u = l.targetServings,
    p = u > 0 ? d / u : 0,
    m = p * (1 + a / 100),
    g = m * (1 + (i + r) / 100),
    f = m > 0 ? (s / u / m) * 100 : 0,
    y = m > 0 ? (c / u / m) * 100 : 0,
    b = m > 0 ? (d / u / m) * 100 : 0,
    v = m > 0 ? 100 - b : 0,
    h = m * u,
    w = h - d;
  N && (N.textContent = u),
    S && (S.textContent = `${tt}${s.toFixed(2)}`),
    P && (P.textContent = `${tt}${c.toFixed(2)}`),
    $ && ($.textContent = `${tt}${d.toFixed(2)}`),
    R && (R.textContent = `${tt}${p.toFixed(2)}`),
    I && (I.textContent = `${tt}${g.toFixed(2)}`),
    M && (M.textContent = `${f.toFixed(1)}%`),
    F && (F.textContent = `${y.toFixed(1)}%`),
    k && (k.textContent = `${b.toFixed(1)}%`),
    B && (B.textContent = `${v.toFixed(1)}%`),
    Ke && (Ke.textContent = `${tt}${h.toFixed(2)}`),
    Xe && (Xe.textContent = `${tt}${w.toFixed(2)}`);
}

function Qn(e) {
  parseFloat(A ? A.value : 1);
  let t = e.rawMaterialItems.reduce((e, t) => e + t.quantity * t.unitCost, 0),
    n = e.directLaborItems.reduce((e, t) => e + t.quantity * t.unitCost, 0);
  Wn(t, n, 0, e.servings || 1);
}

function Yn() {
  n && Qn(n);
}

function Vn() {
  const e = Ye ? Ye.value : null;
  if (!e) return void alert("Please select a recipe to load");
  const t = Gt().find((t) => t.id === parseInt(e));
  if (!t) return;
  n = t;
  const o = t.servings || 1;
  A && (A.value = o),
    Ge && (Ge.textContent = t.name),
    _e && (_e.textContent = `${tt}${t.totalCost.toFixed(2)}`),
    Je && (Je.textContent = o),
    je &&
      (je.textContent = `${
        t.rawMaterialItems.length + t.directLaborItems.length
      } items`),
    Ve && Ve.classList.remove("hidden"),
    Qn(t),
    Gn(),
    Wt(
      `Automatically set Serving Scale to ${o} to match loaded recipe`,
      "info"
    );
}

function Gn() {
  n
    ? (function (e) {
        const t = parseFloat(A ? A.value : 1) || 1,
          n = e.servings || 1,
          o = n > 0 ? t / n : 0,
          a = e.rawMaterialItems || [],
          i = e.directLaborItems || [],
          r = yo([...a]),
          l = yo([...i]);
        Ne && (Ne.textContent = `${r.length} items`);
        let s = 0;
        De && (De.innerHTML = ""),
          r.forEach((e) => {
            const t = e.quantity * o,
              n = t * e.unitCost;
            if (((s += n), De)) {
              const o = document.createElement("tr");
              (o.innerHTML = `\n                <td>${po(e.name)}${
                "sub-recipe" === e.type
                  ? ' <span class="sub-recipe-badge">SUB</span>'
                  : ""
              }</td>\n <td>                    </td>                <td>${t.toFixed(2)} ${
                e.unit
              }</td>\n                \n                <td>${tt}${parseFloat(
                e.unitCost
              ).toFixed(2)}/${
                e.unit
              }</td>\n                <td>${tt}${n.toFixed(
                2
              )}</td>\n            `),
                De.appendChild(o);
            }
          }),
          Oe && (Oe.textContent = `${tt}${s.toFixed(2)}`),
          We && (We.textContent = `${tt}${s.toFixed(2)}`),
          He && (He.textContent = `${l.length} items`);
        let c = 0;
        Ae && (Ae.innerHTML = ""),
          l.forEach((e) => {
            const t = e.quantity * o,
              n = t * e.unitCost;
            if (((c += n), Ae)) {
              const o = document.createElement("tr");
              (o.innerHTML = `\n                <td>${po(
                e.name
              )}</td>\n                <td>${t.toFixed(2)} ${
                e.unit
              }</td>\n                <td>${tt}${parseFloat(
                e.unitCost
              ).toFixed(2)}/${
                e.unit
              }</td>\n                <td>${tt}${n.toFixed(
                2
              )}</td>\n            `),
                Ae.appendChild(o);
            }
          }),
          ze && (ze.textContent = `${tt}${c.toFixed(2)}`),
          Qe && (Qe.textContent = `${tt}${c.toFixed(2)}`);
      })(n)
    : _n();
}

function _n() {
  Ne &&
    ((Ne.textContent = "0 items"),
    He && (He.textContent = "0 items"),
    Oe && (Oe.textContent = `${tt}0.00`),
    ze && (ze.textContent = `${tt}0.00`),
    We && (We.textContent = `${tt}0.00`),
    Qe && (Qe.textContent = `${tt}0.00`),
    De && (De.innerHTML = ""),
    Ae && (Ae.innerHTML = ""));
}

// =============================================================================
// FIXED PRINT PREVIEW FUNCTION - ENHANCED DATA DISPLAY
// =============================================================================

function Jn() {
    try {
        if ((console.log("Generating enhanced print preview..."), !G))
            throw new Error("Print preview content element not found");

        let e, t, o;
        n ? ((e = n), (t = e.name || "Unnamed Recipe"), (o = e.servings || 1), console.log("Printing loaded recipe:", t)) : ((t = x ? x.value.trim() : "Unnamed Recipe"), (o = (D && parseFloat(D.value)) || 1), console.log("Printing current recipe:", t));

        const a = (A && parseFloat(A.value)) || 1,
            i = (U && parseFloat(U.value)) || 0,
            r = (T && parseFloat(T.value)) || 0,
            l = (q && parseFloat(q.value)) || 0,
            s = document.body.classList.contains("dark-mode");

        console.log("Enhanced print parameters:", { recipeName: t, baseServings: o, servingScale: a, markup: i, tax: r, vat: l, isDark: s, hasLoadedRecipe: !!n });

        let c = (function (e, t, n, o, a, i, r) {
            function l(e, t = 2) {
                try {
                    const n = parseFloat(e);
                    return isNaN(n) ? "0.00" : n.toFixed(t);
                } catch (t) {
                    return console.error("Error in safeToFixed:", t, e), "0.00";
                }
            }

            function s(e) {
                return `${tt}${l(e)}`;
            }

            const c = n > 0 ? o / n : 0,
                d = o;
            let u = 0,
                p = [],
                m = 0,
                g = [];

            if (e) {
                p = (e.rawMaterialItems || []).map(item => {
                    const scaledQty = (item.quantity || 0) * c;
                    const totalCost = scaledQty * (item.unitCost || 0);
                    return {
                        name: item.name || "Unnamed",
                        quantity: scaledQty,
                        unit: item.unit || "g",
                        yield: item.yieldPercentage || 100,
                        unitCost: item.unitCost || 0,
                        totalCost: totalCost,
                        type: item.type || "rawMaterial"
                    };
                });
                
                g = (e.directLaborItems || []).map(item => {
                    const scaledTime = (item.quantity || 0) * c;
                    const totalCost = scaledTime * (item.unitCost || 0);
                    return {
                        name: item.name || "Unnamed Labor",
                        timeRequired: scaledTime,
                        timeUnit: item.unit || "hours",
                        rate: item.unitCost || 0,
                        totalCost: totalCost
                    };
                });
                
                u = p.reduce((sum, item) => sum + (item.totalCost || 0), 0);
                m = g.reduce((sum, item) => sum + (item.totalCost || 0), 0);
            } else {
                f && f.querySelectorAll("tr").forEach((e) => {
                    try {
                        const itemName = e.children[0].querySelector("input").value;
                        const baseQty = parseFloat(e.children[1].querySelector("input").value) || 0;
                        const unitCost = parseFloat(e.children[2].querySelector("input").value) || 0;
                        const itemType = e.dataset.type || "rawMaterial";
                        
                        const yieldPct = (function(name, type) {
                            if (type === "rawMaterial") {
                                const rawMat = Yt().find(rm => rm.name === name);
                                return rawMat ? (rawMat.yieldPercentage || 100) : 100;
                            }
                            return 100;
                        })(itemName, itemType);
                        
                        const scaledQty = baseQty * c;
                        const totalCost = scaledQty * unitCost;

                        u += totalCost;
                        p.push({
                            name: itemName,
                            quantity: scaledQty,
                            unit: e.children[1].querySelector(".quantity-unit")?.textContent || "g",
                            yield: yieldPct,
                            unitCost: unitCost,
                            totalCost: totalCost,
                            type: itemType
                        });
                    } catch (e) {
                        console.error("Error processing raw material row:", e);
                    }
                });

                y && y.querySelectorAll("tr").forEach((e) => {
                    try {
                        const laborName = e.children[0].querySelector("input").value;
                        const baseTime = parseFloat(e.children[1].querySelector("input").value) || 0;
                        const rate = parseFloat(e.children[2].querySelector("input").value) || 0;
                        const timeUnit = e.children[1].querySelector(".quantity-unit")?.textContent || "hours";
                        
                        const scaledTime = baseTime * c;
                        const totalCost = scaledTime * rate;

                        m += totalCost;
                        g.push({
                            name: laborName,
                            timeRequired: scaledTime,
                            timeUnit: timeUnit,
                            rate: rate,
                            totalCost: totalCost
                        });
                    } catch (e) {
                        console.error("Error processing labor row:", e);
                    }
                });
            }

            const b = u + m;
            if (d <= 0) return '\n            <div class="print-header">\n                <h2>Invalid Servings Configuration</h2>\n                <p>Target servings cannot be zero. Please check your serving scale settings.</p>\n            </div>\n        ';

            const v = b / d,
                h = v * (1 + (a || 0) / 100),
                w = h * (1 + ((i || 0) + (r || 0)) / 100),
                x = h > 0 ? (u / d / h) * 100 : 0,
                C = h > 0 ? (m / d / h) * 100 : 0,
                E = h > 0 ? (b / d / h) * 100 : 0,
                L = h > 0 ? 100 - E : 0,
                S = h * d,
                P = S - b;
            let $ = `\n        <div class="print-header">\n            <h1>${po(
                t
            )} - Costing Report</h1>\n            <p>Generated on ${new Date().toLocaleDateString()}</p>\n            <div class="scaling-info">\n                <strong>Scaling Information:</strong><br>\n                • Base Servings: ${n}<br>\n                • Serving Scale: ${o}x<br>\n                • Total Servings: ${d}<br>\n                • <em>All costs below are SCALED for analysis</em>\n            </div>\n            ${
                e
                ? '<p style="color: #666; font-style: italic;">Printed from Saved Recipe Analysis</p>'
                : ""
            }\n        </div>\n\n        <div class="print-section">\n            <h3>Serving Scale Analysis</h3>\n            <table class="cost-breakdown">\n                <tbody>\n                    <tr>\n                        <td>Base Servings:</td>\n                        <td>${n}</td>\n                    </tr>\n                    <tr>\n                        <td>Target Servings:</td>\n                        <td>${d}</td>\n                    </tr>\n                    <tr>\n                        <td>Scaling Factor:</td>\n                        <td>${l(
                c,
                2
            )}x</td>\n                    </tr>\n                </tbody>\n            </table>\n        </div>\n    `;
            p.length > 0 &&
                (($ +=
                '\n            <div class="print-section">\n                <h3>Raw Materials (Scaled)</h3>\n                <table class="cost-breakdown">\n                    <thead>\n                        <tr>\n                            <th>Item</th>\n                            <th>Quantity</th>\n                            <th>Yield %</th>\n                            <th>Unit Cost</th>\n                            <th>Total Cost</th>\n                        </tr>\n                    </thead>\n                    <tbody>\n        '),
                p.forEach((e) => {
                    $ += `\n                <tr>\n                    <td>${po(e.name)}${
                        "sub-recipe" === e.type
                        ? ' <span class="sub-recipe-badge">SUB</span>'
                        : ""
                    }</td>\n                    <td>${l(e.quantity)} ${
                        e.unit
                    }</td>\n                    <td>${l(
                        e.yield,
                        1
                    )}%</td>\n                    <td>${s(e.unitCost)}/${
                        e.unit
                    }</td>\n                    <td>${s(
                        e.totalCost
                    )}</td>\n                </tr>\n            `;
                }),
                ($ += `\n                    </tbody>\n                    <tfoot>\n                        <tr class="summary-highlight">\n                            <td colspan="4">Raw Materials Subtotal</td>\n                            <td>${s(
                    u
                )}</td>\n                        </tr>\n                    </tfoot>\n                </table>\n            </div>\n        `));
            g.length > 0 &&
                (($ +=
                '\n            <div class="print-section">\n                <h3>Direct Labor (Scaled)</h3>\n                <table class="cost-breakdown">\n                    <thead>\n                        <tr>\n                            <th>Labor Item</th>\n                            <th>Time Required</th>\n                            <th>Rate</th>\n                            <th>Total Cost</th>\n                        </tr>\n                    </thead>\n                    <tbody>\n        '),
                g.forEach((e) => {
                    $ += `\n                <tr>\n                    <td>${po(
                        e.name
                    )}</td>\n                    <td>${l(e.timeRequired)} ${
                        e.timeUnit
                    }</td>\n                    <td>${s(e.rate)}/${
                        e.timeUnit
                    }</td>\n                    <td>${s(
                        e.totalCost
                    )}</td>\n                </tr>\n            `;
                }),
                ($ += `\n                    </tbody>\n                    <tfoot>\n                        <tr class="summary-highlight">\n                            <td colspan="3">Direct Labor Subtotal</td>\n                            <td>${s(
                    m
                )}</td>\n                        </tr>\n                    </tfoot>\n                </table>\n            </div>\n        `));
            return (
                ($ += `\n        <div class="print-section">\n            <h3>Cost Summary</h3>\n            <table class="cost-breakdown">\n                <tbody>\n                    <tr>\n                        <td>Raw Materials Cost:</td>\n                        <td>${s(
                    u
                )}</td>\n                    </tr>\n                    <tr>\n                        <td>Direct Labor Cost:</td>\n                        <td>${s(
                    m
                )}</td>\n                    </tr>\n                    <tr class="totals-row">\n                        <td><strong>Total Recipe Cost:</strong></td>\n                        <td><strong>${s(
                    b
                )}</strong></td>\n                    </tr>\n                    <tr>\n                        <td>Target Servings:</td>\n                        <td>${d}</td>\n                    </tr>\n                    <tr>\n                        <td>Cost per Serving (Before Tax):</td>\n                        <td>${s(
                    v
                )}</td>\n                    </tr>\n                    <tr>\n                        <td>Selling Price (After Tax):</td>\n                        <td>${s(
                    w
                )}</td>\n                    </tr>\n                </tbody>\n            </table>\n        </div>\n\n        <div class="print-section">\n            <h3>Profit Analysis</h3>\n            <table class="cost-breakdown">\n                <tbody>\n                    <tr>\n                        <td>Food Cost %:</td>\n                        <td>${l(
                    x,
                    1
                )}%</td>\n                    </tr>\n                    <tr>\n                        <td>Labor Cost %:</td>\n                        <td>${l(
                    C,
                    1
                )}%</td>\n                    </tr>\n                    <tr>\n                        <td>Total Cost %:</td>\n                        <td>${l(
                    E,
                    1
                )}%</td>\n                    </tr>\n                    <tr class="summary-highlight">\n                        <td><strong>Gross Profit Margin %:</strong></td>\n                        <td><strong>${l(
                    L,
                    1
                )}%</strong></td>\n                    </tr>\n                </tbody>\n            </table>\n        </div>\n\n        <div class="print-section">\n            <h3>Production Analysis</h3>\n            <table class="cost-breakdown">\n                <tbody>\n                    <tr>\n                        <td>Serving Scale:</td>\n                        <td>${o}x</td>\n                    </tr>\n                    <tr>\n                        <td>Total Servings:</td>\n                        <td>${d}</td>\n                    </tr>\n                    <tr>\n                        <td>Total Revenue (Before Tax):</td>\n                        <td>${s(
                    S
                )}</td>\n                    </tr>\n                    <tr>\n                        <td>Total Cost:</td>\n                        <td>${s(
                    b
                )}</td>\n                    </tr>\n                    <tr class="summary-highlight">\n                        <td><strong>Total Profit:</strong></td>\n                        <td><strong>${s(
                    P
                )}</strong></td>\n                    </tr>\n                </tbody>\n            </table>\n        </div>\n\n        <div class="print-footer">\n            <p>Generated by ProfitPerPlate - Know your profit in every plate</p>\n        </div>\n    `),
                $
            );
        })(e, t, o, a, i, r, l, s);

        (G.innerHTML = c),
        s ? G.classList.add("theme-dark") : G.classList.remove("theme-dark"),
        console.log("✅ Enhanced print preview generated successfully");
    } catch (e) {
        console.error("Error in enhanced generatePrintPreview:", e);
        const t = G ? `<div class="print-header">\n                <h2>Error Generating Print Preview</h2>\n                <p>There was an error generating the print preview. Please try again.</p>\n                <p style="color: #666; font-size: 12px;">Error: ${e.message}</p>\n            </div>` : "Print preview content element not available";
        G && (G.innerHTML = t);
    }
}

function jn() {
  Nn();
  setTimeout(() => {
    const e = window.open("", "_blank");
    const t = G ? G.innerHTML : "";

    e.document.write(
      `<!DOCTYPE html>
            <html>
            <head>
                <title>Recipe Costing Report</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .print-header { text-align: center; border-bottom: 2px solid #2D5A3D; padding-bottom: 10px; margin-bottom: 20px; }
                    .print-section { margin-bottom: 20px; page-break-inside: avoid; }
                    .print-section h3 { background: #f5f7fa; padding: 8px; margin: 0 0 10px 0; border-left: 4px solid #2D5A3D; }
                    .cost-breakdown { width: 100%; border-collapse: collapse; margin: 10px 0; }
                    .cost-breakdown th { background: #f5f7fa; font-weight: bold; padding: 8px; border: 1px solid #ddd; }
                    .cost-breakdown td { padding: 8px; border: 1px solid #ddd; }
                    .summary-highlight { background: #f5f7fa !important; font-weight: bold; }
                    .totals-row { border-top: 2px solid #000 !important; font-weight: bold; }
                    .scaling-info { background: #f0f8f0; padding: 10px; border-radius: 5px; margin: 10px 0; }
                    .print-footer { margin-top: 30px; font-size: 10pt; color: #666; text-align: center; border-top: 1px solid #ddd; padding-top: 10px; }
                    @media print {\n                        body { margin: 0; padding: 15px; }\n                        .print-section { page-break-inside: avoid; }\n                    }
                </style>
            </head>
            <body>
                ${t}
            </body>
            </html>`
    );
    e.document.close();

    setTimeout(() => {
      e.print();
      e.close();
    }, 250);
  }, 100);
}

function Kn() {
  if (!Ye) return;
  Ye.innerHTML = '<option value="">Select a recipe to analyze...</option>';
  Gt()
    .filter((e) => "main" === e.type)
    .forEach((e) => {
      const t = document.createElement("option");
      (t.value = e.id),
        (t.textContent = `${e.name} (${uo(Number(e.totalCost) || 0)})`),
        Ye.appendChild(t);
    });
}

// =============================================================================
// HELP SYSTEM FUNCTIONS
// =============================================================================

function Xn() {
  let e = `
        <div style="margin-bottom: var(--space-xl);">
            <p><strong>Welcome to ProfitPerPlate!</strong> This complete guide explains every field in simple terms with practical examples for beginners.</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-xl);">
            <div>
                <h4 style="color: var(--primary); border-bottom: 1px solid var(--border); padding-bottom: var(--space-sm);">Raw Materials & Recipe Fields</h4>
    `;
  [
    "ingredientName",
    "ingredientCategory",
    "purchasePrice",
    "purchaseQuantity",
    "purchaseUnit",
    "costPerUnit",
    "selectItem",
    "quantity",
    "servings"
  ].forEach((t) => {
    const n = d[t];
    if (n) {
      e += `
                <div style="margin-bottom: var(--space-lg); padding-bottom: var(--space-lg); border-bottom: 1px dashed var(--border);">
                    <strong>${n.title}</strong>
                    <p style="margin: var(--space-sm) 0; font-size: 13px;">${n.content}</p>
                    <div class="field-example">
                        <strong>Example:</strong> ${n.example}
                    </div>
                </div>
            `;
    }
  });

  e += `
            </div>
            <div>
                <h4 style="color: var(--primary); border-bottom: 1px solid var(--border); padding-bottom: var(--space-sm);">Direct Labor & Business Fields</h4>
    `;

  [
    "laborName",
    "shiftRate",
    "shiftDuration",
    "timeUnit",
    "costUnit",
    "markup",
    "tax",
    "vat",
    "servingScale",
    "subRecipeName",
    "subRecipeCategory",
    "subRecipeYieldQuantity",
    "yieldPercentage",
    "selectedLaborRate"
  ].forEach((t) => {
    const n = d[t];
    if (n) {
      e += `
                <div style="margin-bottom: var(--space-lg); padding-bottom: var(--space-lg); border-bottom: 1px dashed var(--border);">
                    <strong>${n.title}</strong>
                    <p style="margin: var(--space-sm) 0; font-size: 13px;">${n.content}</p>
                    <div class="field-example">
                        <strong>Example:</strong> ${n.example}
                    </div>
                </div>
            `;
    }
  });

  e += `
            </div>
        </div>

        <div style="margin-top: var(--space-xl); padding: var(--space-lg); background: var(--background); border-radius: var(--radius-lg);">
            <h4 style="color: var(--primary); margin-top: 0;">Quick Tip for Beginners</h4>
            <p>Start by adding your raw materials with their purchase details and direct labor items with shift details. Then create recipes by adding those items with the quantities or time required. Finally, set your desired markup and number of servings to see your profit per plate!</p>
            <p><strong>Remember:</strong> Accurate costs for both materials and labor lead to accurate profit calculations. Don't forget to account for yield (waste) for raw materials.</p>
        </div>
    `;

  return e;
}

function Zn(e, t) {
  t && (t.stopPropagation(), t.preventDefault());
  const n = d[e];
  n
    ? (z && (z.textContent = n.title + " - Field Definition"),
      W &&
        (W.innerHTML = `\n                <p><strong>${n.title}</strong> — ${n.content}</p>\n                <div class="field-example">\n                    <strong>Example:</strong> ${n.example}\n                </div>\n                <div style="margin-top: var(--space-lg); padding: var(--space-md); background: rgba(45, 90, 61, 0.05); border-radius: var(--radius-md);">\n                    <strong>💡 Tip:</strong> Look for the "?" buttons next to other fields for more explanations. \n                    Use the main "?" button in the header for a complete field guide.\n                </div>\n            `))
    : (z && (z.textContent = "Field Definitions"),
      W &&
        (W.innerHTML = `<p>Definition not found for "${e}". Please refer to the general help.</p>`)),
    O && O.classList.remove("hidden");
}

// =============================================================================
// SUB-RECIPE MANAGEMENT FUNCTIONS
// =============================================================================

function eo() {
  if (!le) return;
  const e = parseFloat(En()) || 0,
    t = parseFloat(oe ? oe.value : 1) || 1,
    n = ae ? ae.value : r || "g",
    o = re ? re.value : n || "g";
  let i = 0;
  try {
    if (t > 0 && a[n] && a[o]) {
      i = (e / (t * a[n])) * a[o];
    } else i = t > 0 ? e / t : 0;
  } catch (e) {
    console.error("Error computing sub-recipe cost per unit:", e), (i = 0);
  }
  if (
    ((le.textContent = `${tt}${e.toFixed(2)}`),
    ie &&
      (isFinite(i)
        ? (ie.value = parseFloat(i).toFixed(4))
        : (ie.value = "0.0000")),
    se)
  ) {
    const e = isFinite(i) ? parseFloat(i).toFixed(4) : "0.0000";
    se.textContent = `${tt}${e} per ${o}`;
  }
  try {
    const e = document.getElementById("subRecipeCostPerUnitField"),
      t = document.getElementById("subRecipeCostUnitField");
    e && (e.value = isFinite(i) ? parseFloat(i).toFixed(4) : "0.0000"),
      t && (t.value = o || n || "unit");
  } catch (e) {
    console.warn("Could not update canonical sub-recipe hidden fields:", e);
  }
}

function to() {
  if (!ne) return;
  const e = ne.value;
  [ae, re].forEach((t) => {
    t &&
      ((t.innerHTML = ""),
      i[e].forEach((e) => {
        const n = document.createElement("option");
        (n.value = e), (n.textContent = e), t.appendChild(n);
      }));
  }),
    eo();
}

// =============================================================================
// FIXED: Enhanced raw material modal with field immutability
// =============================================================================

function no(e = null) {
  const n = document.getElementById("rawMaterialModal"),
    o = document.getElementById("rawMaterialModalTitle");
  ao(),
    e
      ? ((o.textContent = "Edit Raw Material"),
        (function (e) {
          (document.getElementById("modalRawMaterialName").value = e.name),
            (document.getElementById("modalRawMaterialCategory").value =
              e.category),
            ao(),
            (document.getElementById("modalRawMaterialPrice").value =
              e.price.toFixed(2)),
            (document.getElementById("modalRawMaterialQuantity").value =
              e.quantity.toFixed(2)),
            (document.getElementById("modalRawMaterialUnit").value = e.unit),
            (document.getElementById("modalCostPerUnit").value =
              e.costPerUnit.toFixed(4)),
            (document.getElementById("modalCostUnit").value = e.costUnit),
            (document.getElementById("modalRawMaterialYield").value =
              e.yieldPercentage || 100),
            nn();

          // --- FIXED: Disable ALL critical fields including name when editing existing raw material ---
          const nameField = document.getElementById("modalRawMaterialName");
          const categoryField = document.getElementById("modalRawMaterialCategory");
          const purchaseUnitField = document.getElementById("modalRawMaterialUnit");
          const costUnitField = document.getElementById("modalCostUnit");
          
          if (nameField) {
            nameField.disabled = true;
            nameField.title = "Cannot change Raw Material Name for existing items used in recipes.";
          }
          if (categoryField) {
            categoryField.disabled = true;
            categoryField.title = "Cannot change Measurement Category for existing materials.";
          }
          if (purchaseUnitField) {
            purchaseUnitField.disabled = true;
            purchaseUnitField.title = "Cannot change Purchase Unit for existing materials.";
          }
          if (costUnitField) {
            costUnitField.disabled = true;
            costUnitField.title = "Cannot change Cost Unit for existing materials.";
          }
        })(e),
        (t = { type: "rawMaterial", id: e.id, data: e }))
      : ((o.textContent = "Add New Raw Material"),
        document.getElementById("rawMaterialForm").reset(),
        nn(),
        (t = { type: null, id: null, data: null }),
        // --- FIXED: Ensure ALL fields are enabled when adding new material ---
        (function() {
          const nameField = document.getElementById("modalRawMaterialName");
          const categoryField = document.getElementById("modalRawMaterialCategory");
          const purchaseUnitField = document.getElementById("modalRawMaterialUnit");
          const costUnitField = document.getElementById("modalCostUnit");
          
          if (nameField) {
            nameField.disabled = false;
            nameField.title = "";
          }
          if (categoryField) {
            categoryField.disabled = false;
            categoryField.title = "";
          }
          if (purchaseUnitField) {
            purchaseUnitField.disabled = false;
            purchaseUnitField.title = "";
          }
          if (costUnitField) {
            costUnitField.disabled = false;
            costUnitField.title = "";
          }
        })()),
    n.classList.remove("hidden");
}

function oo() {
  document.getElementById("rawMaterialModal").classList.add("hidden"),
    document.getElementById("rawMaterialForm").reset(),
    (t = { type: null, id: null, data: null });
}

function ao() {
  const e = document.getElementById("modalRawMaterialCategory").value,
    t = document.getElementById("modalRawMaterialUnit"),
    n = document.getElementById("modalCostUnit");
  t &&
    n &&
    ((t.innerHTML = ""),
    (n.innerHTML = ""),
    i[e].forEach((e) => {
      const o = document.createElement("option");
      (o.value = e), (o.textContent = e), t.appendChild(o);
      const a = document.createElement("option");
      (a.value = e), (a.textContent = e), n.appendChild(a);
    }),
    nn());
}

// Sub-recipe modal open function
function io() {
  console.log("🔧 Opening sub-recipe save modal...");
  const e = document.getElementById("recipeName"),
    n_val = e ? e.value.trim() : "";
    
  if ((console.log("📝 Current recipe name:", n_val), !n_val)) {
    const msg = "Please enter a recipe name in the 'Current Recipe' field before saving as sub-recipe";
    return (
      console.error("❌ Sub-recipe validation failed:", msg),
      alert(msg),
      void (
        e &&
        (e.focus(),
        e.classList.add("error"),
        setTimeout(() => e.classList.remove("error"), 2e3))
      )
    );
  }

  // Check if items exist
  if (
    !(function () {
      let count = 0;
      f && (count += f.querySelectorAll("tr").length);
      y && (count += y.querySelectorAll("tr").length);
      return count > 0;
    })()
  )
    return void alert(
      "Please add some items to the recipe before saving as sub-recipe"
    );

  const displayEl = document.getElementById("subRecipeNameDisplay");
  if (!displayEl)
    return (
      console.error("❌ Sub-recipe name display element not found"),
      void alert(
        "Error: Could not initialize sub-recipe modal. Please refresh and try again."
      )
    );

  // Set the name
  displayEl.value = n_val;
  console.log("✅ Set sub-recipe name in modal:", n_val);

  let settings = {
      category: "weight",
      yieldQuantity: "1",
      yieldUnit: "g",
      costUnit: "g"
  };

  // Check if we are editing an existing sub-recipe
  if (window.t && window.t.type === 'subRecipe' && window.t.data) {
      console.log("🔄 Detected existing sub-recipe data, loading...", window.t.data);
      settings.category = window.t.data.category || "weight";
      settings.yieldQuantity = window.t.data.yieldQuantity || "1";
      settings.yieldUnit = window.t.data.yieldUnit || "g";
      settings.costUnit = window.t.data.costUnit || "g";
  }

  // 1. Set Category first
  if (ne) ne.value = settings.category;

  // 2. FORCE UPDATE of unit options based on category (Critical step!)
  to(); 

  // 3. Set values into the inputs
  if (oe) oe.value = settings.yieldQuantity;
  if (ae) ae.value = settings.yieldUnit;
  if (re) re.value = settings.costUnit;
  
  // === NEW CODE START: Field state management for edit mode ===
  // Check if we are in EDIT MODE
  const isEditMode = window.t && window.t.type === 'subRecipe' && window.t.data;
  
  if (isEditMode) {
    console.log("🔄 Sub-recipe modal opening in EDIT MODE - disabling critical fields");
    // DISABLE the three critical fields in edit mode
    if (ne) {
      ne.disabled = true;
      ne.title = "Cannot change Category in edit mode. Create a new sub-recipe for different categories.";
    }
    if (ae) {
      ae.disabled = true;
      ae.title = "Cannot change Yield Unit in edit mode. Create a new sub-recipe for different units.";
    }
    if (re) {
      re.disabled = true;
      re.title = "Cannot change Cost Unit in edit mode. Create a new sub-recipe for different units.";
    }
    Wt(`Editing sub-recipe "${window.t.data.name}" - Category and Units are locked for consistency`, "info");
  } else {
    console.log("🆕 Sub-recipe modal opening in CREATE MODE - all fields enabled");
    // ENABLE all fields in create mode
    if (ne) {
      ne.disabled = false;
      ne.title = "";
    }
    if (ae) {
      ae.disabled = false;
      ae.title = "";
    }
    if (re) {
      re.disabled = false;
      re.title = "";
    }
    Wt(`Creating new sub-recipe - All fields are editable`, "success");
  }
  // === NEW CODE END ===
  
  // Trigger cost calculation update based on loaded values
  eo();

  // Clear validation messages
  const o = document.getElementById("subRecipeValidationMessage");
  o && (o.classList.add("hidden"), (o.textContent = ""));

  // Update hidden canonical fields
  try {
    const hiddenCost = document.getElementById("subRecipeCostPerUnitField"),
      hiddenUnit = document.getElementById("subRecipeCostUnitField");
      
    if (hiddenCost && (!hiddenCost.value || "" === hiddenCost.value)) {
        hiddenCost.value = (parseFloat(En() / (parseFloat(oe.value) || 1)) || 0).toFixed(4);
    }
    
    if (hiddenUnit && (!hiddenUnit.value || "" === hiddenUnit.value)) {
        hiddenUnit.value = re ? re.value : (ae.value || "unit");
    }
  } catch (err) {
    console.warn("While initializing sub-recipe hidden canonical fields:", err);
  }

  // Show Modal
  const modal = document.getElementById("subRecipeSaveModal");
  if (modal) {
      modal.classList.remove("hidden");
      console.log("✅ Sub-recipe modal opened successfully");
  } else {
      console.error("❌ Sub-recipe modal element not found");
  }
}

function ro() {
  const e = [];
  return (
    f &&
      f.querySelectorAll("tr").forEach((t) => {
        const n = t.children[0].querySelector("input").value,
          o = parseFloat(t.children[1].querySelector("input").value) || 0,
          a = t.children[1].querySelector(".quantity-unit").textContent,
          i = parseFloat(t.children[2].querySelector("input").value) || 0,
          r = t.dataset.type || "rawMaterial",
          l = t.dataset.subRecipeId || null;
        ("rawMaterial" !== r && "sub-recipe" !== r) ||
          e.push({
            name: n,
            quantity: o,
            unit: a,
            unitCost: i,
            type: r,
            subRecipeId: l
          });
      }),
    e
  );
}

function lo() {
  const e = [];
  return (
    y &&
      y.querySelectorAll("tr").forEach((t) => {
        const n = t.children[0].querySelector("input").value,
          o = parseFloat(t.children[1].querySelector("input").value) || 0,
          a = t.children[1].querySelector(".quantity-unit").textContent,
          i = parseFloat(t.children[2].querySelector("input").value) || 0;
        e.push({ name: n, quantity: o, unit: a, unitCost: i });
      }),
    e
  );
}

// =============================================================================
// RECIPE BUILDER MODAL FUNCTIONS - ENHANCED WITH EDIT SUPPORT
// =============================================================================

function hasCurrentRecipeContent() {
  return (f && f.children.length > 0) || 
         (y && y.children.length > 0) || 
         (x && x.value.trim() !== "") ||
         (D && D.value !== "1");
}

function openRecipeBuilderModal(reset = true) {
  const modal = document.getElementById('recipeBuilderModal');
  if (!modal) {
    console.error("❌ Recipe builder modal element not found");
    return;
  }

  modal.classList.remove('hidden');

  // --- CHANGE 2: Dynamic Save Buttons based on editing state ---
  const saveMainBtn = document.getElementById('saveMainRecipeBtn');
  const saveSubBtn = document.getElementById('saveSubRecipeBtn');

  if (saveMainBtn && saveSubBtn) {
    // Check the global editing state (window.t)
    if (window.t && window.t.type) {
      if (window.t.type === 'mainRecipe') {
        // Editing an existing Main Recipe
        saveMainBtn.style.display = 'block';
        saveSubBtn.style.display = 'none';
        console.log("🔧 Recipe Builder: Showing Main Recipe save button only");
      } else if (window.t.type === 'subRecipe') {
        // Editing an existing Sub-Recipe
        saveMainBtn.style.display = 'none';
        saveSubBtn.style.display = 'block';
        console.log("🔧 Recipe Builder: Showing Sub-Recipe save button only");
      } else {
        // Default state - show both for new recipe creation
        saveMainBtn.style.display = 'block';
        saveSubBtn.style.display = 'block';
        console.log("🔧 Recipe Builder: Showing both save buttons for new recipe");
      }
    } else {
      // No editing state - show both for new recipe creation
      saveMainBtn.style.display = 'block';
      saveSubBtn.style.display = 'block';
      console.log("🔧 Recipe Builder: Showing both save buttons (no editing state)");
    }
  } else {
    console.warn("⚠️ Save buttons not found in recipe builder modal");
  }

  if (reset) {
    if (hasCurrentRecipeContent()) {
      console.log("✳️ Existing recipe data detected — asking user to confirm reset");
      Nt(); // this will prompt
    } else {
      console.log("🆕 No existing content — performing silent reset");
      NtSilent(); // no prompt
    }
  } else {
    console.log("✏️ Opening recipe builder for editing (no reset)");
  }

  console.log("✅ Recipe builder modal opened with dynamic save buttons");
}

// --- New: silent reset used when there is nothing to lose (no confirm) ---
function NtSilent() {
  try {
    // Clear UI rows and fields without asking the user
    if (f) f.innerHTML = "";
    if (y) y.innerHTML = "";
    if (x) x.value = "";
    if (D) D.value = "1";
    if (A) A.value = "1";

    t = { type: null, id: null, data: null };
    window.currentEditingRow = null;
    window.currentEditingLaborRow = null;

    const addIngredientBtn = document.querySelector(".add-ingredient-section .btn-primary");
    if (addIngredientBtn) {
      addIngredientBtn.textContent = "Add to Recipe";
      addIngredientBtn.onclick = Cn;
      addIngredientBtn.classList.remove("update-mode");
    }
    const addLaborBtn = document.querySelector(".add-labor-section .btn-primary");
    if (addLaborBtn) {
      addLaborBtn.textContent = "Add Direct Labor";
      addLaborBtn.onclick = yn;
      addLaborBtn.classList.remove("update-mode");
    }

    zn();
    n || _n();
    ct();
    Wt("Recipe reset (silent) completed");
  } catch (err) {
    console.error("NtSilent error:", err);
  }
}

function closeRecipeBuilderModal() {
  const modal = document.getElementById('recipeBuilderModal');
  if (modal) {
    modal.classList.add('hidden');
    // Clear editing state when closing
    t = { type: null, id: null, data: null };
    console.log("✅ Recipe builder modal closed");
  }
}

function initializeRecipeBuilderModal() {
  const createBtn = document.getElementById('createNewRecipeBtn');
  if (createBtn) {
    createBtn.addEventListener('click', function() {
      openRecipeBuilderModal(true); // true = reset for new recipe
    });
    console.log("✅ Create recipe button listener attached");
  } else {
    console.warn("⚠️ Create recipe button not found");
  }
  
  // Close modal when clicking outside
  const modal = document.getElementById('recipeBuilderModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeRecipeBuilderModal();
      }
    });
    console.log("✅ Recipe builder modal click-outside listener attached");
  }
}

// =============================================================================
// UTILITY AND HELPER FUNCTIONS
// =============================================================================

function so(e, t) {
  const n = e.querySelector("svg");
  n &&
    (n.innerHTML = t
      ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>'
      : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>');
}

function co(e, t) {
  const n = document.getElementById(e);
  if (!n)
    return void console.error("❌ Password input not found for field:", e);
  const o = "password" === n.type;
  (n.type = o ? "text" : "password"),
    t && so(t, !o),
    console.log("✅ Password visibility toggled for field:", e);
}

function uo(e) {
  return `${tt}${parseFloat(e).toFixed(2)}`;
}

function updateCurrencySymbol(newSymbol, options = { syncToCloud: false }) {
  try {
    if (!newSymbol || typeof newSymbol !== "string") return;
    const previous = tt;
    const symbol = newSymbol.trim();

    // Update global shorthand and app state
    tt = symbol;
    if (window.e && typeof window.e === "object") window.e.currency = tt;

    // Persist a lightweight user preference quickly (local-only).
    try {
      const saved = localStorage.getItem("profitPerPlate_userData") || "{}";
      let parsed = {};
      try {
        parsed = JSON.parse(saved);
      } catch (err) {
        parsed = {};
      }
      parsed.currency = tt;
      localStorage.setItem("profitPerPlate_userData", JSON.stringify(parsed));
    } catch (err) {
      console.warn("updateCurrencySymbol: failed to persist currency preference locally", err);
    }

    // Update explicit currency placeholders (elements intentionally marked for currency)
    try {
      document.querySelectorAll(".unit-currency").forEach((el) => {
        try {
          el.textContent = tt;
        } catch (e) {}
      });
    } catch (err) {
      console.warn("updateCurrencySymbol: failed to update .unit-currency elements", err);
    }

    // Conservative walk: update leaf text nodes and common attribute/value locations containing currency glyphs
    try {
      // Match a wide set of currency glyphs including common hard-coded ones like "₱"
      const symbolRegex = /(?:R\$|₱|₽|¥|₩|€|£|₹|₴|₮|₵|₫|\$)\s*/g;

      // Update leaf text nodes
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
      const textNodes = [];
      while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
      }
      textNodes.forEach((textNode) => {
        try {
          const txt = textNode.nodeValue;
          if (!txt) return;
          // Only operate on nodes that contain digits (common for price displays) and a currency glyph
          if (/\d/.test(txt) && symbolRegex.test(txt)) {
            textNode.nodeValue = txt.replace(symbolRegex, tt + " ");
          }
        } catch (err) {}
      });

      // Update attributes and input values conservatively
      const attrSelectors = ["input", "textarea", "select", "[title]", "[aria-label]"];
      document.querySelectorAll(attrSelectors.join(",")).forEach((el) => {
        try {
          if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
            const v = el.value;
            if (v && /\d/.test(v) && symbolRegex.test(v)) {
              el.value = v.replace(symbolRegex, tt + " ");
            }
          } else {
            ["title", "aria-label"].forEach((attr) => {
              const val = el.getAttribute && el.getAttribute(attr);
              if (val && /\d/.test(val) && symbolRegex.test(val)) {
                el.setAttribute(attr, val.replace(symbolRegex, tt + " "));
              }
            });
          }
        } catch (err) {
          // ignore
        }
      });
    } catch (err) {
      console.warn("updateCurrencySymbol: leaf text/attribute update failed", err);
    }

    // Trigger re-renders for any view that formats numbers using uo() or reads tt
    try {
      if (typeof vt === "function") vt(); // raw materials & labor & recipes render
      if (typeof Fn === "function") Fn(); // recipes list
      if (typeof zn === "function") zn(); // current recipe totals
      if (typeof Kn === "function") Kn(); // summary recipe select
      if (typeof en === "function") en(); // raw materials cards
      if (typeof un === "function") un(); // direct labor cards
      if (typeof mn === "function") mn(); // other renders
      if (typeof In === "function") In();
    } catch (err) {
      console.warn("updateCurrencySymbol: refresh helpers failed", err);
    }

    // Optional cloud sync: controlled call to ct()
    if (options && options.syncToCloud) {
      try {
        // Call ct() only if available. ct is expected to handle preparing payload from local state (c()).
        if (typeof ct === "function") {
          // ct may expect no args or payload; call and catch errors.
          ct()
            .then && ct().catch && ct().catch((err) => {
              console.warn("updateCurrencySymbol: cloud sync (ct) failed:", err);
            });
        } else {
          console.warn("updateCurrencySymbol: ct() not available; skipping cloud sync");
        }
      } catch (err) {
        console.warn("updateCurrencySymbol: cloud sync attempt failed:", err);
      }
    }

    // Defensive: notify user of the change (non-blocking)
    try {
      if (typeof Wt === "function") Wt(`Currency changed: ${previous} → ${tt}`, "info");
    } catch (err) {}

    console.log(`Currency symbol updated: "${previous}" -> "${tt}"`);
  } catch (err) {
    console.error("updateCurrencySymbol failed:", err);
  }
}

function po(e) {
  const t = document.createElement("div");
  return (t.textContent = e), t.innerHTML;
}

function mo(e) {
  return [...e].sort((e, t) => e.name.localeCompare(t.name));
}

function go(e) {
  return [...e].sort((e, t) => e.name.localeCompare(t.name));
}

function fo(e) {
  return [...e].sort((e, t) => e.name.localeCompare(t.name));
}

function yo(e) {
  return [...e].sort((e, t) => e.name.localeCompare(t.name));
}

// =============================================================================
// ENHANCED INITIALIZATION WITH DATA PROTECTION
// =============================================================================

async function normalInitialization() {
  console.log("🚀 Initializing ProfitPerPlate with comprehensive fixes...");
  try {

    initializeEnhancedPWA();

    !(function () {
      console.log(
        "🔧 Initializing DOM elements with enhanced error handling..."
      );
      try {
        (f = yt("recipeBody")),
          (y = yt("directLaborRecipeBody")),
          (b = yt("rawMaterialsTotal")),
          (v = yt("directLaborTotal")),
          (h = yt("grandTotal")),
          (w = yt("currencySelect")),
          (x = yt("recipeName")),
          (C = yt("resetRecipe")),
          (E = yt("saveMainRecipeBtn")),
          (L = yt("saveSubRecipeBtn")),
          (S = yt("summaryRawMaterialsCost")),
          (P = yt("summaryDirectLaborCost")),
          ($ = yt("summaryTotalCost")),
          (R = yt("summaryCostServing")),
          (I = yt("summarySellingPrice")),
          (M = yt("summaryFoodCost")),
          (F = yt("summaryLaborCostPercent")),
          (k = yt("summaryTotalCostPercent")),
          (B = yt("summaryGrossProfit")),
          (U = yt("markup")),
          (T = yt("tax")),
          (q = yt("vat")),
          (D = yt("servings")),
          (A = yt("servingScale")),
          (N = yt("summaryServingsDisplay")),
          (H = yt("helpBtn")),
          (O = yt("helpModal")),
          (z = yt("helpModalTitle")),
          (W = yt("helpModalContent")),
          (Q = yt("closeHelp")),
          (Y = yt("printBtn")),
          (V = yt("printPreviewModal")),
          (G = yt("printPreviewContent")),
          (_ = yt("unifiedItemSelect")),
          (J = yt("addIngredientQty")),
          (j = yt("addIngredientUnit")),
          (K = yt("directLaborSelect")),
          (X = yt("timeRequirement")),
          (Z = yt("timeRequirementUnit")),
          (ee = yt("subRecipeSaveModal")),
          (te = yt("subRecipeNameDisplay")),
          (ne = yt("subRecipeCategory")),
          (oe = yt("subRecipeYieldQuantity")),
          (ae = yt("subRecipeYieldUnit")),
          (ie = yt("subRecipeCostPerUnit")),
          (re = yt("subRecipeCostUnit")),
          (le = yt("currentRecipeCostDisplay")),
          (se = yt("costPerOutputUnit")),
          (ce = yt("mainRecipesList")),
          (de = yt("subRecipesList")),
          (ue = yt("editPromptModal")),
          (pe = yt("editPromptTitle")),
          (me = yt("editPromptMessage")),
          (ve = yt("authModal")),
          (he = yt("authModalTitle")),
          (we = yt("authForm")),
          (xe = yt("authEmail")),
          (Ce = yt("authPassword")),
          (Ee = yt("authSubmitBtn")),
          (Le = yt("authError")),
          (Se = yt("authSwitchBtn")),
          (Pe = yt("authSwitchText")),
          ($e = yt("forgotPasswordModal")),
          (Re = yt("forgotPasswordBtn")),
          (Ie = yt("forgotPasswordEmail")),
          (Me = yt("forgotPasswordError")),
          (Fe = yt("forgotPasswordSuccess")),
          (ke = yt("sendResetEmailBtn")),
          (Be = yt("togglePassword")),
          (Ue = yt("loginBtn")),
          (Te = yt("logoutBtn")),
          (qe = yt("signupBtn")),
          (De = yt("rawMaterialsPreviewBody")),
          (Ae = yt("directLaborPreviewBody")),
          (Ne = yt("rawMaterialsCount")),
          (He = yt("directLaborCount")),
          (Oe = yt("rawMaterialsPreviewTotal")),
          (ze = yt("directLaborPreviewTotal")),
          (We = yt("rawMaterialsPreviewSubtotal")),
          (Qe = yt("directLaborPreviewSubtotal")),
          (Ye = yt("summaryRecipeSelect")),
          (Ve = yt("loadedRecipeDisplay")),
          (Ge = yt("currentRecipeNameDisplay")),
          (_e = yt("loadedRecipeTotalCost")),
          (Je = yt("loadedRecipeServings")),
          (je = yt("loadedRecipeItemCount")),
          (Ke = yt("summaryBatchRevenue")),
          (Xe = yt("summaryBatchProfit")),
          (Ze = document.querySelectorAll(".sidebar-btn")),
          (et = document.querySelectorAll(".mobile-tabs .tab-btn")),
          console.log(
            `✅ DOM elements initialized - Sidebar: ${Ze.length}, Mobile: ${et.length}`
          );
      } catch (e) {
        console.error("💥 DOM element initialization failed:", e),
          setTimeout(() => {
            (Ze = document.querySelectorAll(".sidebar-btn")),
              (et = document.querySelectorAll(".mobile-tabs .tab-btn")),
              console.log(
                `🔄 Recovered navigation - Sidebar: ${Ze.length}, Mobile: ${et.length}`
              );
          }, 100);
      }
    })(),
      (function () {
        const e = localStorage.getItem("profitPerPlate_theme"),
          t =
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches,
          n = "dark" === e || (!e && t);
        document.body.classList.toggle("dark-mode", n);
        const o = document.querySelector("#darkModeToggle svg");
        o &&
          (o.innerHTML = n
            ? '<path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="23"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'
            : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>');
      })(),
      (function () {
        console.log("🔧 Setting up universal password toggles..."),
          document.addEventListener("click", function (e) {
            const t = e.target.closest(".password-toggle");
            t &&
              (e.preventDefault(),
              e.stopPropagation(),
              console.log("👁️ Password toggle clicked"),
              (function (e) {
                const t = e.closest(".password-input-group");
                if (!t)
                  return void console.error(
                    "❌ Password input group not found for toggle"
                  );
                const n = t.querySelector(
                  'input[type="password"], input[type="text"]'
                );
                if (!n)
                  return void console.error(
                    "❌ Password input not found in group"
                  );
                const o = "password" === n.type;
                (n.type = o ? "text" : "password"),
                  so(e, !o),
                  console.log("✅ Password visibility toggled to:", n.type);
              })(t));
          });
        const e = document.getElementById("togglePassword");
        e &&
          e.addEventListener("click", function (e) {
            e.preventDefault(),
              e.stopPropagation(),
              console.log("👁️ Auth password toggle clicked"),
              (function () {
                const e = document.getElementById("authPassword");
                if (!e)
                  return void console.error("❌ Auth password input not found");
                const t = "password" === e.type;
                e.type = t ? "text" : "password";
                const n = document.getElementById("togglePassword");
                n && so(n, !t);
                console.log("✅ Auth password visibility toggled");
              })();
          });
        console.log("✅ Universal password toggles setup completed");
      })(),
      (function () {
        const e = document.getElementById("unifiedEditPromptModal");
        e &&
          e.addEventListener("click", function (t) {
            t.target === e && g();
          }),
          document.addEventListener("keydown", function (t) {
            "Escape" === t.key && e && !e.classList.contains("hidden") && g();
          });
      })()
    Ot();
      await window.supabaseClient.checkAuthState();
      setupEnhancedAutoSave();
      (function () {
        console.log("🔧 Setting up enhanced event listeners..."), It();
        at();
        const t = document.getElementById("darkModeToggle");
        t && t.addEventListener("click", ht);
        Rn(),
          // ---- FIX INSERTION: Use the centralized updater here for currency select changes ----
          w &&
            w &&
    (function attachCurrencyHandler(sel) {
      try {
        // Initialize select to current currency if available
        if (sel && tt) {
          try {
            sel.value = tt;
          } catch (e) {}
        }
        // Remove previous handler if any
        if (sel && sel._currencyHandlerAttached) {
          sel.removeEventListener("change", sel._currencyHandler);
          sel._currencyHandlerAttached = false;
        }
        const handler = function () {
          try {
            const newSym = sel.value || tt;
            // Call centralized update and request a controlled cloud sync
            if (typeof updateCurrencySymbol === "function") {
              // We request syncToCloud: true here so that users who are signed in have their preference saved.
              // updateCurrencySymbol will only call ct() if ct() exists and handles errors internally.
              updateCurrencySymbol(newSym, { syncToCloud: true });
            } else {
              // Fallback: minimal inline behavior
              tt = newSym;
              if (window.e && typeof window.e === "object") window.e.currency = tt;
              document.querySelectorAll(".unit-currency").forEach((el) => {
                try {
                  el.textContent = tt;
                } catch (e) {}
              });
              try {
                vt();
                Fn();
                zn();
                Kn();
                en();
                un();
              } catch (err) {}
            }
            // Keep manual-save semantics: write preference locally but do not force cloud sync if cloud wasn't available
            try {
              const payload = c();
              payload.currency = tt;
              localStorage.setItem("profitPerPlate_userData", JSON.stringify(payload));
            } catch (e) {
              console.warn("Currency handler: local persist failed", e);
            }
            dt();
          } catch (err) {
            console.warn("Currency change handler failed:", err);
          }
        };
        sel.addEventListener("change", handler);
        sel._currencyHandler = handler;
        sel._currencyHandlerAttached = true;
      } catch (err) {
        console.warn("attachCurrencyHandler failed:", err);
      }
    })(w);
        [U, T, q, D, x, A].forEach((e) => {
          e &&
            e.addEventListener("input", () => {
              zn(), dt(), n && Yn();
            });
        }),
          C && C.addEventListener("click", Nt);
        E &&
          E.addEventListener("click", function () {
            if (!x.value.trim())
              return (
                alert("Please enter a recipe name before saving"),
                void x.focus()
              );
            $n("main");
          });
        L &&
          L.addEventListener("click", function () {
            io();
          });
        const o = document.getElementById("saveRawMaterialBtn");
        o && o.addEventListener("click", Xt);
        const a = document.getElementById("saveDirectLaborBtn");
        a && a.addEventListener("click", cn);
        H &&
          H.addEventListener("click", (e) => {
            e.stopPropagation(),
              (z.textContent = "Complete Field Guide — ProfitPerPlate"),
              (W.innerHTML = Xn()),
              O.classList.remove("hidden");
          });
        Q && Q.addEventListener("click", An);
        O &&
          O.addEventListener("click", (e) => {
            e.target === O && An();
          });
        void (
          Y &&
          (Y.replaceWith(Y.cloneNode(!0)),
          (Y = document.getElementById("printBtn")),
          Y.addEventListener("click", function () {
            console.log("Print button clicked");
            const e = null !== n,
              t = (f && f.children.length > 0) || (y && y.children.length > 0);
            if (e || t)
              try {
                Jn(),
                  V
                    ? V.classList.remove("hidden")
                    : (console.error("Print preview modal not found"),
                      alert("Error: Print preview modal not available"));
              } catch (e) {
                console.error("Error generating print preview:", e),
                  alert(
                    "Error generating print preview. Please check the console for details."
                  );
              }
            else
              alert(
                "No recipe data available to print. Please either:\n\n1. Add items to your current recipe, OR\n2. Load a saved recipe in the Summary tab for analysis"
              );
          }),
          console.log("Print button setup completed"))
        ),
          void [
            { id: "rawMaterialModal", closeFn: oo },
            { id: "directLaborModal", closeFn: rn },
            { id: "printPreviewModal", closeFn: Nn },
            { id: "subRecipeSaveModal", closeFn: Mn },
            { id: "editPromptModal", closeFn: Hn },
            { id: "authModal", closeFn: kt },
            { id: "forgotPasswordModal", closeFn: xt },
            { id: "resetPasswordModal", closeFn: St },
            { id: "helpModal", closeFn: An },
            { id: "unifiedEditPromptModal", closeFn: g },
            { id: "recipeBuilderModal", closeFn: closeRecipeBuilderModal }
          ].forEach((e) => {
            const t = document.getElementById(e.id);
            t &&
              t.addEventListener("click", (t) => {
                t.target.id === e.id && e.closeFn();
              });
          }),
          _ && _.addEventListener("change", hn);
        A &&
          A.addEventListener("input", function () {
            parseFloat(this.value);
            zn(), dt(), n && Yn();
          });
        document.addEventListener("keydown", (e) => {
          "Escape" === e.key && Rt();
        }),
          console.log("✅ Enhanced event listeners setup completed");
      })();
      
      // Initialize new recipe builder modal
      initializeRecipeBuilderModal();
      
      // Initialize enhanced card interactions
      setupEnhancedCardInteractions();
      
      verifyUIElements();
      await gt();
      // ➤ CASCADE INITIALIZATION: Initialize master ID references after data is loaded and normalized
      try {
      if (window.CascadeSystem && typeof window.CascadeSystem.initializeMasterIdReferences === "function") {
       window.CascadeSystem.initializeMasterIdReferences();
  }
} catch (e) {
  console.warn("Master ID initialization failed:", e);
}
vt();
zn();
mn();
In();
to();
Kn();

setTimeout(() => {
    console.log("🔄 Initializing enhanced cascade system...");
    
    // Force initial cascade to sync everything
    if (window.CascadeSystem && typeof window.CascadeSystem.recalculateAllRecipesOnMasterChange === "function") {
        const initialUpdateCount = window.CascadeSystem.recalculateAllRecipesOnMasterChange();
        console.log(`✅ Initial cascade completed: Updated ${initialUpdateCount} recipes`);
    }
    
    // Set up monitoring for future changes
    setupMasterChangeMonitoring();
}, 3000);

      W && (W.innerHTML = Xn());
      _n();
      await window.supabaseClient.handlePasswordReset();
      At();
      (function () {
        const e = document.querySelectorAll(".batch-profit-analysis label");
        e.length >= 2 &&
          ((e[0].textContent = "Total Revenue:"),
          (e[1].textContent = "Total Profit:"));
        const t = document.querySelector(".batch-profit-analysis:nth-child(3)");
        t && t.remove();
      })(),
      console.log("🔗 Exporting all global functions..."),
      (window.switchTab = it),
      (window.setupNavigationSystem = Ot),
      (window.setupDirectNavigationListeners = at),
      (window.openAuthModal = Mt),
      (window.closeAuthModal = kt),
      (window.handleAuth = Ft),
      (window.handleLogout = qt),
      (window.toggleAuthMode = Tt),
      (window.openForgotPasswordModal = wt),
      (window.closeForgotPasswordModal = xt),
      (window.sendPasswordReset = Ct),
      (window.showResetPassword = Pt),
      (window.closeResetPasswordModal = St),
      (window.togglePasswordVisibilityGeneric = co),
      (window.handlePasswordReset = Pt),
      (window.showResetPasswordError = $t),
      (window.closeAllModals = Rt),
      (window.openRawMaterialModal = no),
      (window.closeRawMaterialModal = oo),
      (window.saveRawMaterial = Kt),
      (window.deleteRawMaterial = Zt),
      (window.updateCostPerUnit = nn),
      (window.updateCostPerUnitValue = on),
      (window.updateUnitOptions = ao),
      (window.openDirectLaborModal = an),
      (window.closeDirectLaborModal = rn),
      (window.saveDirectLabor = sn),
      (window.deleteDirectLabor = dn),
      (window.updateLaborCostPerUnit = ln),
      (window.addItemToRecipe = Cn),
      (window.addDirectLaborToRecipe = yn),
      (window.editRecipeRow = bn),
      (window.editDirectLaborRow = wn),
      (window.updateRecipeRow = vn),
      (window.updateDirectLaborRow = xn),
      (window.saveRecipe = Pn),
      (window.deleteRecipe = qn),
      (window.editRecipe = Un),
      (window.editSubRecipe = Tn),
      (window.loadRecipe = kn),
      (window.loadSubRecipe = Bn),
      (window.openSubRecipeSaveModal = io),
      (window.calculateCostPerUnitLabor = ln),
      (window.saveSubRecipe = Ln),
      (window.updateSubRecipeUnitOptions = to),
      (window.updateSubRecipeCostDisplay = eo),
      (window.loadRecipeForSummary = Vn),
      (window.recalc = zn),
      (window.printCostingReport = jn),
      (window.closePrintPreview = Nn),
      (window.generatePrintPreview = Jn),
      (window.showFieldHelp = Zn),
      (window.closeHelpModal = An),
      (window.handleEditPromptChoice = Dn),
      (window.renderRawMaterials = en),
      (window.renderDirectLabor = un),
      (window.filterRawMaterials = filterRawMaterials),
      (window.filterDirectLabor = filterDirectLabor),
      (window.saveRecipeWithDuplicateCheck = $n),
      (window.saveRawMaterialWithDuplicateCheck = Xt),
      (window.saveDirectLaborWithDuplicateCheck = cn),
      (window.saveSubRecipeWithDuplicateCheck = saveSubRecipeWithDuplicateCheck),
      (window.Sn = Sn), // For backward compatibility
      (window.sn = sn), // For internal use
      (window.cn = cn), // For internal use
      (window.initializeAuth = It),
      (window.setupEnhancedAutoSave = setupEnhancedAutoSave),
      (window.loadRecipeStateWithFallback = gt),
      (window.loadUserDataFromLocalStorage = rt),
      (window.safeClearLocalData = lt),
      (window.normalizeRecipeData = l),
      (window.normalizeUserData = s),
      (window.prepareUserDataForSave = c),
      (window.handleUnifiedEditPromptChoice = m),
      (window.closeUnifiedEditPromptModal = g),
      (window.closeSubRecipeSaveModal = Mn),
      // NEW: Recipe builder modal functions
      (window.openRecipeBuilderModal = openRecipeBuilderModal),
      (window.closeRecipeBuilderModal = closeRecipeBuilderModal),
      (window.initializeRecipeBuilderModal = initializeRecipeBuilderModal),
      
      // NEW: Enhanced card interaction functions
      (window.filterRawMaterials = filterRawMaterials),
      (window.filterDirectLabor = filterDirectLabor),
      (window.setupEnhancedCardInteractions = setupEnhancedCardInteractions),
      
      // NEW: Cascade system functions
      (window.CascadeSystem = window.CascadeSystem || {}),
      
      (window.hasMeaningfulData = hasMeaningfulData),
      (window.attemptDataRecovery = attemptDataRecovery),
      (window.initializeWithDataProtection = initializeWithDataProtection),
      (window.setupEnhancedAutoSave = setupEnhancedAutoSave),
      (window.showDataOperationNotification = showDataOperationNotification),
      (window.setupEnhancedAuthStateHandler = setupEnhancedAuthStateHandler),
      (window.verifyUIElements = verifyUIElements);
      (window.setupSettingsDropdown = setupSettingsDropdown),
      
      console.log("✅ All global functions exported successfully"),
      console.log("🎉 ProfitPerPlate initialization completed successfully"),
      Wt(
        "Welcome to ProfitPerPlate! Manual save mode enabled - data saves on Add/Edit/Delete actions.",
        "success"
      );
  } catch (e) {
    console.error("💥 Initialization failed:", e),
      Wt(
        "Initialization completed with minor issues. Some features may be limited.",
        "warning"
      );
  }
}

// Replace the existing DOMContentLoaded initialization with this exact block
document.addEventListener('DOMContentLoaded', async function() {
  console.log("🚀 DOMContentLoaded: Starting protected initialization...");

  try {
    // Primary initialization path (with data protection)
    await initializeWithDataProtection();

    // CRITICAL: Initialize header/menu (build the runtime MENU modal and move header controls)
    // If setupSettingsDropdown is not called, the menu button stays inert and header items remain where they are.
    if (typeof setupSettingsDropdown === 'function') {
      try {
        console.log("🔧 Calling setupSettingsDropdown() from DOMContentLoaded");
        setupSettingsDropdown();
        // ensure the helper to pin position is also initialized if present
        if (typeof ensureMenuButtonPosition === 'function') {
          ensureMenuButtonPosition();
        }
      } catch (err) {
        console.error("❌ Error while calling setupSettingsDropdown():", err);
      }
    } else {
      console.warn("⚠️ setupSettingsDropdown() not found on window - ensure script.js contains it.");
    }

    // Re-run existing lightweight cascade/calc/calls normally expected by app
    try { nn(); } catch (e) { /* safe fallback */ }

    console.log("✅ Protected initialization completed");
    Wt("Welcome to ProfitPerPlate! Your data is protected with enhanced backup.", "success");

  } catch (e) {
    console.error("💥 Protected initialization failed:", e);

    // Fallback to normal initialization
    try {
      await normalInitialization();
    } catch (err) {
      console.error("💥 normalInitialization() fallback failed:", err);
    }

    // Ensure menu is still initialized in fallback path
    if (typeof setupSettingsDropdown === 'function') {
      try {
        console.log("🔧 Calling setupSettingsDropdown() (fallback path)");
        setupSettingsDropdown();
        if (typeof ensureMenuButtonPosition === 'function') ensureMenuButtonPosition();
      } catch (err) {
        console.error("❌ Error calling setupSettingsDropdown() in fallback path:", err);
      }
    }

    // The old cascade fix call the codebase previously expected
    try { nn(); } catch (err) { /* ignore */ }

    Wt("Initialization completed with enhanced data protection (fallback).", "info");
  }

  // Small runtime check that helps debugging in the browser console
  try {
    console.log("🧭 Debug: settingsMenuButton element:", document.getElementById("settingsMenuButton"));
    console.log("🧭 Debug: menuModal element:", document.getElementById("menuModal"));
  } catch (err) {
    console.warn("Debug introspection failed:", err);
  }
});

(function AuthButtonsModule() {
  // Minimalist SVG icons:
  const ICONS = {
    login: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <path d="M15 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
      </svg>`,
    logout: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <path d="M15 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
      <polyline points="10 7 5 12 10 17" />
      <line x1="5" y1="12" x2="17" y2="12" />
      </svg>`
  };

  // Shared inline style for header buttons (fixed size)
  const HEADER_STYLE = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0',
    padding: '8px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    width: '40px',
    height: '40px',
    boxSizing: 'border-box',
    boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
    lineHeight: '1',
    flexShrink: '0'
  };

  // Menu button style (stretches to full width with icon on LEFT - NO TEXT)
  const MENU_STYLE = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '0',
    padding: '12px 16px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    width: '100%',
    minHeight: '44px',
    boxSizing: 'border-box',
    boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
    lineHeight: '1',
    margin: '6px 0'
  };

  // Utility to apply inline styles to an element
  function applyStyles(el, styles) {
    if (!el || !styles) return;
    Object.keys(styles).forEach((k) => {
      try { el.style[k] = styles[k]; } catch (e) { /* ignore */ }
    });
  }

  // Check if button is in menu modal
  function isInMenuModal(btn) {
    return btn.closest('#menuModal') !== null;
  }

  // Decorate an element to be the Login button (green, arrow INTO door)
  function decorateLoginButton(btn) {
    if (!btn) return;
    try {
      btn.setAttribute('aria-label', 'Log in');
      btn.setAttribute('type', 'button');
      btn.setAttribute('data-role', 'open-login');
      btn.classList.remove('btn-danger', 'btn-secondary');
      btn.classList.add('btn-login');

      const inMenu = isInMenuModal(btn);
      
      if (inMenu) {
        // Menu button with icon on LEFT - NO TEXT
        applyStyles(btn, MENU_STYLE);
        btn.style.background = '#34c759'; // green
        btn.style.color = '#ffffff';
        btn.style.border = '1px solid rgba(0,0,0,0.06)';
        
        // ICON ONLY - positioned on left
        btn.innerHTML = ICONS.login;
        btn.title = 'Log in';
      } else {
        // Header button (centered icon only)
        applyStyles(btn, HEADER_STYLE);
        btn.style.background = '#34c759'; // green
        btn.style.color = '#ffffff';
        btn.style.border = '1px solid rgba(0,0,0,0.06)';
        btn.innerHTML = ICONS.login;
        btn.title = 'Log in';
      }

      // Focus/blur visual polish for keyboard users
      const focusIn = () => {
        btn.style.boxShadow = '0 8px 24px rgba(52,199,89,0.18), 0 2px 6px rgba(0,0,0,0.08)';
        btn.style.border = '1px solid rgba(0,0,0,0.08)';
      };
      const focusOut = () => {
        btn.style.boxShadow = inMenu ? MENU_STYLE.boxShadow : HEADER_STYLE.boxShadow;
        btn.style.border = '1px solid rgba(0,0,0,0.06)';
      };
      btn.addEventListener('focus', focusIn);
      btn.addEventListener('blur', focusOut);
    } catch (err) {
      console.warn('decorateLoginButton failed:', err);
    }
  }

  // Decorate an element to be the Logout button (red, arrow OUT of door)
  function decorateLogoutButton(btn) {
    if (!btn) return;
    try {
      btn.setAttribute('aria-label', 'Log out');
      btn.setAttribute('type', 'button');
      btn.setAttribute('data-role', 'logout');
      btn.classList.remove('btn-primary', 'btn-secondary');
      btn.classList.add('btn-logout');

      const inMenu = isInMenuModal(btn);
      
      if (inMenu) {
        // Menu button with icon on LEFT - NO TEXT
        applyStyles(btn, MENU_STYLE);
        btn.style.background = '#ff3b30'; // red
        btn.style.color = '#ffffff';
        btn.style.border = '1px solid rgba(0,0,0,0.06)';
        
        // ICON ONLY - positioned on left
        btn.innerHTML = ICONS.logout;
        btn.title = 'Log out';
      } else {
        // Header button (centered icon only)
        applyStyles(btn, HEADER_STYLE);
        btn.style.background = '#ff3b30'; // red
        btn.style.color = '#ffffff';
        btn.style.border = '1px solid rgba(0,0,0,0.06)';
        btn.innerHTML = ICONS.logout;
        btn.title = 'Log out';
      }

      // Focus/blur polish
      const focusIn = () => {
        btn.style.boxShadow = '0 8px 24px rgba(255,59,48,0.18), 0 2px 6px rgba(0,0,0,0.08)';
        btn.style.border = '1px solid rgba(0,0,0,0.08)';
      };
      const focusOut = () => {
        btn.style.boxShadow = inMenu ? MENU_STYLE.boxShadow : HEADER_STYLE.boxShadow;
        btn.style.border = '1px solid rgba(0,0,0,0.06)';
      };
      btn.addEventListener('focus', focusIn);
      btn.addEventListener('blur', focusOut);
    } catch (err) {
      console.warn('decorateLogoutButton failed:', err);
    }
  }

  // Find and normalize auth buttons in various locations (header, auth container, menu)
  function normalizeAuthButtons() {
    try {
      // Prefer explicit ID selectors, but also support data-role and containers
      const authContainer = document.querySelector('.auth-buttons');
      if (authContainer) {
        Array.from(authContainer.querySelectorAll('button')).forEach((btn) => {
          const role = (btn.getAttribute('data-role') || '').toLowerCase();
          const aria = (btn.getAttribute('aria-label') || '').toLowerCase();
          const txt = (btn.textContent || '').toLowerCase();
          if (role.includes('login') || aria.includes('login') || /log ?in/i.test(txt)) {
            decorateLoginButton(btn);
          } else if (role.includes('logout') || aria.includes('logout') || /log ?out/i.test(txt)) {
            decorateLogoutButton(btn);
          } else {
            // keep neutral but visually cohesive for other auth-area buttons
            const inMenu = isInMenuModal(btn);
            applyStyles(btn, inMenu ? MENU_STYLE : HEADER_STYLE);
            btn.style.background = 'transparent';
            btn.style.color = 'var(--text-primary)';
            btn.style.border = '1px solid rgba(0,0,0,0.06)';
          }
        });
      }

      // Explicit ID-based decorations (keeps event listeners intact)
      const loginEl = document.querySelector('#loginBtn') || document.querySelector('[data-role="open-login"]');
      const logoutEl = document.querySelector('#logoutBtn') || document.querySelector('[data-role="logout"]');

      if (loginEl) decorateLoginButton(loginEl);
      if (logoutEl) decorateLogoutButton(logoutEl);

      // Also handle menu modal instances
      const menu = document.getElementById('menuModal');
      if (menu) {
        const mLogin = menu.querySelector('#loginBtn, [data-role="open-login"]');
        const mLogout = menu.querySelector('#logoutBtn, [data-role="logout"]');
        if (mLogin) decorateLoginButton(mLogin);
        if (mLogout) decorateLogoutButton(mLogout);
      }
    } catch (e) {
      console.warn('normalizeAuthButtons failed:', e);
    }
  }

  // Observe DOM changes so when the app moves or replaces header/menu elements we re-apply styles
  function observeAuthButtonChanges() {
    try {
      const observer = new MutationObserver((mutations) => {
        let shouldNormalize = false;
        for (const m of mutations) {
          if (m.type === 'childList' && m.addedNodes && m.addedNodes.length) {
            shouldNormalize = true;
            break;
          }
          if (m.type === 'attributes' && ['id', 'class', 'data-role', 'aria-label'].includes(m.attributeName)) {
            shouldNormalize = true;
            break;
          }
        }
        if (shouldNormalize) {
          // slight delay to allow other scripts that move nodes to settle
          setTimeout(normalizeAuthButtons, 40);
        }
      });

      // Watch header and menu modal if present, fallback to document.body
      const header = document.querySelector('header') || document.body;
      const menu = document.getElementById('menuModal') || document.body;
      const targets = [header, menu];

      targets.forEach((t) => {
        if (t && t.nodeType === 1) observer.observe(t, { childList: true, subtree: true, attributes: true, attributeFilter: ['id', 'class', 'data-role', 'aria-label'] });
      });

      // store reference for potential teardown
      AuthButtons._observer = observer;
    } catch (err) {
      console.warn('observeAuthButtonChanges failed:', err);
    }
  }

  // Public init entrypoint
  function init() {
    try {
      normalizeAuthButtons();
      // re-run a couple times shortly after load to cope with other runtime scripts
      setTimeout(normalizeAuthButtons, 120);
      setTimeout(normalizeAuthButtons, 700);
      observeAuthButtonChanges();
    } catch (err) {
      console.warn('AuthButtons.init failed:', err);
    }
  }

  // Expose API
  const AuthButtons = {
    init,
    decorateLoginButton,
    decorateLogoutButton,
    normalizeAuthButtons
  };

  window.AuthButtons = AuthButtons;

  // Auto-initialize if DOM is ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => { try { AuthButtons.init(); } catch (e) { /* ignore */ } }, 20);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      try { AuthButtons.init(); } catch (e) { /* ignore */ }
    });
  }
})();

// ------- Global wrappers for inline handlers (prevent ReferenceError) -------
(function () {
  const implMap = {
    deleteRecipe: ['qn', 'deleteRecipe', 'deleteRecipeInternal'],
    editRecipe: ['Un', 'editRecipe', 'editRecipeInternal'],
    loadRecipe: ['kn', 'loadRecipe', 'loadRecipeForSummary', 'loadRecipeInternal'],
    editSubRecipe: ['Tn', 'editSubRecipe'],
    loadSubRecipe: ['Bn', 'loadSubRecipe']
  };

  function findFn(names) {
    for (const n of names) {
      if (typeof window[n] === 'function') return window[n];
      if (typeof globalThis[n] === 'function') return globalThis[n];
    }
    return null;
  }

  for (const globalName of Object.keys(implMap)) {
    // Only create wrapper if not already defined
    if (typeof window[globalName] !== 'function') {
      window[globalName] = function (id, event) {
        try {
          const fn = findFn(implMap[globalName]);
          if (fn) return fn.call(null, id, event);
          console.warn(`Global "${globalName}" called but no implementation found (tried: ${implMap[globalName].join(', ')})`);
        } catch (err) {
          console.error(`Error when calling global wrapper "${globalName}":`, err);
        }
      };
    }
  }
})();

// ------- Delegated handlers for recipe lists (recommended) -------
(function attachRecipeListDelegation() {
  function handleClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    e.preventDefault();
    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id') || btn.dataset.id;
    if (!action || !id) return console.warn('Action or id missing on clicked element', btn);

    const actionMap = {
      edit: window.editRecipe || window.Un,
      delete: window.deleteRecipe || window.qn,
      load: window.loadRecipe || window.kn || window.loadRecipeForSummary,
      editSub: window.editSubRecipe || window.Tn,
      loadSub: window.loadSubRecipe || window.Bn
    };

    const fn = actionMap[action];
    if (typeof fn === 'function') {
      try { fn(id, e); } catch (err) { console.error('Action handler failed:', err); }
    } else {
      console.warn('No handler for action', action);
    }
  }

  const mainList = document.getElementById('mainRecipesList');
  const subList = document.getElementById('subRecipesList');
  if (mainList) mainList.addEventListener('click', handleClick);
  if (subList) subList.addEventListener('click', handleClick);
  // fallback: listen at document level if lists are created later
  if (!mainList && !subList) document.addEventListener('click', handleClick);
})();

// =============================================================================
// FIX: Define missing sub-recipe save handler
// =============================================================================

/**
 * Global function to handle saving a sub-recipe from the modal.
 * This replaces the undefined 'saveSubRecipeWithDuplicateCheck' function.
 */
function saveSubRecipeWithDuplicateCheck() {
  // Thin wrapper: calls Ln(), which has robust duplicate handling and cascade logic.
  try {
    Ln();
  } catch (err) {
    console.error("saveSubRecipeWithDuplicateCheck failed:", err);
    Wt("Error: could not save sub-recipe. See console.", "error");
  }
}

// =============================================================================
// FIX: Define missing window.showNotification function
// =============================================================================

/**
 * Displays a temporary notification message on the screen.
 * @param {string} message The text to display in the notification.
 * @param {'success'|'error'|'warning'} type The type of notification (influences styling).
 */
window.showNotification = function(message, type = 'info') {
    // 1. Create the notification container
    const notification = document.createElement('div');
    notification.className = 'notification-toast';
    notification.textContent = message;

    // 2. Apply styling based on type
    if (type === 'success') {
        notification.style.backgroundColor = 'var(--success)';
    } else if (type === 'error') {
        notification.style.backgroundColor = 'var(--danger)';
    } else if (type === 'warning') {
        notification.style.backgroundColor = 'var(--warning)';
    } else {
        notification.style.backgroundColor = 'var(--accent-blue)';
    }
    
    // Basic text styling
    notification.style.color = '#ffffff';
    notification.style.padding = '12px 20px';
    notification.style.borderRadius = 'var(--radius-md)';
    notification.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '1000';
    notification.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(20px)';
    
    // 3. Append to body and show it
    document.body.appendChild(notification);
    
    // Use a slight delay to trigger the transition
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);

    // 4. Hide and remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(20px)';
        
        // Remove element after transition finishes
        setTimeout(() => {
            notification.remove();
        }, 300); 
    }, 3000);
};

// =============================================================================
// INITIALIZE BLUR SYSTEM ON PAGE LOAD
// =============================================================================

// Check initial auth state
function checkInitialAuthState() {
    console.log("🔍 Checking initial auth state for blur system...");
    
    // Wait a bit for everything to load
    setTimeout(() => {
        if (window.supabaseClient && window.supabaseClient.getCurrentUser) {
            const user = window.supabaseClient.getCurrentUser();
            if (!user) {
                console.log("👤 No user logged in - blurring UI");
                blurUI();
                forceMenuModalOpen();
            } else {
                console.log("👤 User already logged in:", user.email);
                unblurUI();
            }
        } else {
            console.warn("⚠️ Supabase not ready yet - will check again");
            // Check again in 2 seconds
            setTimeout(checkInitialAuthState, 2000);
        }
    }, 1000);
}

// Mobile navigation toggle functionality
function setupMobileNavToggle() {
  const mobileNavToggle = document.getElementById('mobileNavToggle');
  const mobileTabs = document.querySelector('.mobile-tabs');

  if (!mobileNavToggle || !mobileTabs) return;

  // Set initial state: visible by default on mobile
  const isInitiallyVisible = window.innerWidth <= 768;
  mobileTabs.classList.add(isInitiallyVisible ? 'visible' : 'hidden');
  mobileNavToggle.setAttribute('aria-expanded', isInitiallyVisible.toString());

  // Toggle function
  function toggleNav(e) {
    e && e.preventDefault && e.preventDefault();
    const isExpanded = mobileNavToggle.getAttribute('aria-expanded') === 'true';
    if (isExpanded) {
      mobileTabs.classList.remove('visible');
      mobileTabs.classList.add('hidden');
      mobileNavToggle.setAttribute('aria-expanded', 'false');
    } else {
      mobileTabs.classList.remove('hidden');
      mobileTabs.classList.add('visible');
      mobileNavToggle.setAttribute('aria-expanded', 'true');
    }
  }

  mobileNavToggle.addEventListener('click', toggleNav);

  // Keyboard accessibility: Enter or Space toggles
  mobileNavToggle.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
      ev.preventDefault();
      toggleNav(ev);
    }
  });

  // Handle window resize: reset on desktop
  window.addEventListener('resize', function () {
    if (window.innerWidth > 768) {
      // On desktop, ensure mobile classes are removed so desktop CSS takes over
      mobileTabs.classList.remove('visible', 'hidden');
      mobileNavToggle.setAttribute('aria-expanded', 'false');
    } else {
      // When returning to mobile, keep state as hidden by default
      // (do not force visible to avoid surprising the user)
      if (!mobileTabs.classList.contains('visible') && !mobileTabs.classList.contains('hidden')) {
        mobileTabs.classList.add('visible');
        mobileNavToggle.setAttribute('aria-expanded', 'true');
      }
    }
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log("🏁 DOM loaded - initializing blur system and mobile nav toggle");
  addBlurStyles();
  checkInitialAuthState();
  try { setupMobileNavToggle(); } catch (err) { console.warn('Mobile nav toggle init failed:', err); }
});

// Also check on window load
window.addEventListener('load', function() {
    console.log("📦 Window loaded - checking auth state");
    setTimeout(checkInitialAuthState, 500);
});

/**
 * CSV Export Integration
 * (Add to existing script.js file)
 */

// Initialize CSV exporter on page load
function initializeCSVExport() {
  // The csvExport.js handles its own initialization
  console.log('CSV export module loaded');
}

// Add to existing initialization function
function initializeApp() {
  // ... existing initialization code ...
  
  // Initialize CSV export
  initializeCSVExport();
  
}