// monetization.js - ProfitPerPlate Freemium Model Implementation

// =============================================================================
// CONFIGURATION
// =============================================================================

const FREE_TIER_LIMITS = {
    RAW_MATERIALS: 10,
    DIRECT_LABOR: 3,
    MAIN_RECIPES: 5,
    SUB_RECIPES: 0 // Disabled for free tier
};

const PREMIUM_PLANS = {
    MONTHLY: {
        id: 'premium_monthly',
        name: 'Premium Monthly',
        price: 2.49,
        interval: 'month'
    },
    YEARLY: {
        id: 'premium_yearly',
        name: 'Premium Yearly',
        price: 24.99,
        interval: 'year',
        discount: 'Save 2 months free!'
    }
};

// Add this at the top of the file after configuration
const BUTTON_CONFIG = {
    // Standard disabled state
    DISABLED_STYLE: {
        opacity: '0.5',
        cursor: 'not-allowed',
        pointerEvents: 'none',
        filter: 'grayscale(0.6)'
    },
    
    // Standard enabled state
    ENABLED_STYLE: {
        opacity: '1',
        cursor: 'pointer',
        pointerEvents: 'auto',
        filter: 'none'
    },
    
    // Tooltip templates
    TOOLTIPS: {
        PREMIUM_ONLY: 'Premium feature: Upgrade to unlock',
        LIMIT_REACHED: 'Upgrade to Premium for unlimited access',
        REMAINING: (count, feature) => `${feature} (${count} remaining)`,
        UNLIMITED: 'Unlimited access'
    }
};

// Replace the updateCountDisplays function with this enhanced version
function updateCountDisplays() {
    if (userSubscription.isPremium) {
        // Premium users see no limits - enable all buttons
        updatePremiumDisplay();
        enableAllAddButtons();
        return;
    }
    
    const remaining = getRemainingCounts();
    
    // Standardized function to update any button
    const updateButtonState = (button, config) => {
        if (!button) return;
        
        const {
            isDisabled,
            tooltip,
            text,
            showLockIcon = false,
            showCount = false
        } = config;
        
        // Store original state if not already stored
        if (!button.hasAttribute('data-original-state')) {
            button.setAttribute('data-original-state', JSON.stringify({
                onclick: button.onclick?.toString(),
                text: button.innerHTML,
                style: button.getAttribute('style')
            }));
        }
        
        if (isDisabled) {
            // Apply disabled styles
            Object.entries(BUTTON_CONFIG.DISABLED_STYLE).forEach(([prop, value]) => {
                button.style[prop] = value;
            });
            
            button.disabled = true;
            button.title = tooltip;
            button.classList.add('feature-disabled', 'premium-lock');
            
            // Update text with lock icon
            const lockIcon = showLockIcon ? '🔒 ' : '';
            const countText = showCount ? ` (${remaining[config.featureType] || 0})` : '';
            button.innerHTML = `${lockIcon}${text}${countText}`;
            
            // Set disabled click handler
            button.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                showUpgradeModal(config.featureType);
                return false;
            };
        } else {
            // Apply enabled styles
            Object.entries(BUTTON_CONFIG.ENABLED_STYLE).forEach(([prop, value]) => {
                button.style[prop] = value;
            });
            
            button.disabled = false;
            button.title = tooltip;
            button.classList.remove('feature-disabled', 'premium-lock');
            
            // Restore original text or use provided text
            const originalState = JSON.parse(button.getAttribute('data-original-state') || '{}');
            button.innerHTML = originalState.text || text;
            
            // Restore original onclick
            if (originalState.onclick && originalState.onclick !== 'null') {
                try {
                    button.onclick = new Function('return ' + originalState.onclick)();
                } catch (e) {
                    button.onclick = null;
                }
            }
        }
    };
    
    // Update raw materials button
    const rawMaterialAddBtn = document.querySelector('[data-role="add-raw-material"]');
    updateButtonState(rawMaterialAddBtn, {
        isDisabled: remaining.rawMaterials <= 0,
        tooltip: remaining.rawMaterials <= 0 
            ? BUTTON_CONFIG.TOOLTIPS.LIMIT_REACHED
            : BUTTON_CONFIG.TOOLTIPS.REMAINING(remaining.rawMaterials, 'Raw materials'),
        text: 'Add Raw Material',
        showLockIcon: remaining.rawMaterials <= 0,
        showCount: remaining.rawMaterials > 0,
        featureType: 'raw_materials'
    });
    
    // Update direct labor button
    const directLaborAddBtn = document.querySelector('[data-role="add-direct-labor"]');
    updateButtonState(directLaborAddBtn, {
        isDisabled: remaining.directLabor <= 0,
        tooltip: remaining.directLabor <= 0 
            ? BUTTON_CONFIG.TOOLTIPS.LIMIT_REACHED
            : BUTTON_CONFIG.TOOLTIPS.REMAINING(remaining.directLabor, 'Direct labor'),
        text: 'Add Direct Labor',
        showLockIcon: remaining.directLabor <= 0,
        showCount: remaining.directLabor > 0,
        featureType: 'direct_labor'
    });
    
    // Update create recipe button
    const createRecipeBtn = document.getElementById('createNewRecipeBtn');
    updateButtonState(createRecipeBtn, {
        isDisabled: remaining.mainRecipes <= 0,
        tooltip: remaining.mainRecipes <= 0 
            ? BUTTON_CONFIG.TOOLTIPS.LIMIT_REACHED
            : BUTTON_CONFIG.TOOLTIPS.REMAINING(remaining.mainRecipes, 'Main recipes'),
        text: '🍳 Create New Recipe',
        showLockIcon: remaining.mainRecipes <= 0,
        showCount: remaining.mainRecipes > 0,
        featureType: 'main_recipes'
    });
    
    // Update count displays in headings
    updateCountHeadings(remaining);
}

// Add this helper function
function updateCountHeadings(remaining) {
    const elements = {
        'raw-materials': document.querySelector('#raw-materials-tab .section-header h2'),
        'direct-labor': document.querySelectorAll('#raw-materials-tab .section-header h2')[1],
        'main-recipes': document.querySelector('#recipes-tab .recipe-column:first-child h4'),
        'sub-recipes': document.querySelector('#recipes-tab .recipe-column:last-child h4')
    };
    
    Object.entries(elements).forEach(([type, element]) => {
        if (!element) return;
        
        const baseText = element.textContent.split('(')[0].trim();
        let suffix = '';
        
        if (userSubscription.isPremium) {
            suffix = type === 'sub-recipes' ? 'Sub-Recipes' : `${baseText}`;
            element.innerHTML = `${suffix} <span class="limit-counter" style="color: var(--success);">(Unlimited)</span>`;
        } else {
            const count = remaining[type.replace('-', '')] || 0;
            const warningClass = count <= (type === 'direct-labor' ? 1 : 2) ? 'warning' : '';
            const dangerClass = count <= 0 ? 'danger' : '';
            
            suffix = type === 'sub-recipes' ? 'Sub-Recipes (Premium Only)' : `${baseText}`;
            const countText = type !== 'sub-recipes' ? ` (${count} remaining)` : '';
            
            element.innerHTML = `${suffix}${countText ? `<span class="limit-counter ${warningClass} ${dangerClass}">${countText}</span>` : ''}`;
        }
    });
}

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

let userSubscription = {
    isPremium: false,
    planType: 'free',
    status: 'active',
    currentPeriodEnd: null,
    remainingTime: null
};

let userUsage = {
    rawMaterials: 0,
    directLabor: 0,
    mainRecipes: 0,
    subRecipes: 0
};

let isInitialized = false;

// Sub-recipe restriction tracking
let subRecipeRestrictionsApplied = false;
let originalOpenSubRecipeSaveModal = null;
let subRecipeObserver = null;

// Button state tracking
let originalButtonHandlers = new Map();

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

async function initializeMonetization() {
    if (isInitialized) return;
    
    console.log('💰 Initializing monetization system...');
    
    try {
        // FIRST: Update UI immediately with loading states
        updateCountDisplays(); // This now shows immediate state
        
        const currentUser = window.supabaseClient?.getCurrentUser();
        
        if (!currentUser) {
            console.log('👤 No user logged in, setting to free tier');
            setFreeTier();
            isInitialized = true;
            return;
        }
        
        // Load subscription and usage
        await Promise.all([
            loadUserSubscription(currentUser.id),
            loadUserUsage(currentUser.id)
        ]);
        
        // Update UI with real data
        updateCountDisplays();
        setupEventListeners();
        
        // Handle sub-recipe restrictions
        if (!userSubscription.isPremium) {
            blockAllSubRecipeAccess();
        } else {
            restorePremiumFunctionality();
        }
        
        // Setup validation hooks
        setupValidationHooks();
        
        isInitialized = true;
        console.log('✅ Monetization system initialized');
    } catch (error) {
        console.error('❌ Failed to initialize monetization:', error);
        setFreeTier();
        updateCountDisplays(); // Show error state
    }
}

async function loadUserSubscription(userId) {
    try {
        if (!window.supabaseClient?.supabase) {
            throw new Error('Supabase not available');
        }
        
        const { data, error } = await window.supabaseClient.supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', userId)
            .single();
            
        if (error) {
            if (error.code === 'PGRST116') {
                // No subscription record found, create free tier entry
                await createFreeTierEntry(userId);
                userSubscription = {
                    isPremium: false,
                    planType: 'free',
                    status: 'active',
                    currentPeriodEnd: null,
                    remainingTime: null
                };
                return;
            }
            throw error;
        }
        
        const isActive = data.status === 'active' && 
            (!data.current_period_end || new Date(data.current_period_end) > new Date());
        
        userSubscription = {
            isPremium: isActive && data.plan_type !== 'free',
            planType: data.plan_type,
            status: data.status,
            currentPeriodEnd: data.current_period_end,
            remainingTime: data.current_period_end ? 
                calculateRemainingTime(data.current_period_end) : null
        };
        
        console.log('📊 Loaded user subscription:', userSubscription);
    } catch (error) {
        console.error('❌ Error loading user subscription:', error);
        throw error;
    }
}

async function updateUserSubscriptionInDatabase(subscriptionData) {
    try {
        const currentUser = window.supabaseClient?.getCurrentUser();
        if (!currentUser) return;
        
        const { error } = await window.supabaseClient.supabase
            .from('user_subscriptions')
            .upsert({
                user_id: currentUser.id,
                plan_type: subscriptionData.planType,
                status: subscriptionData.status,
                paddle_subscription_id: subscriptionData.paddleSubscriptionId,
                paddle_customer_id: subscriptionData.paddleCustomerId,
                current_period_start: subscriptionData.currentPeriodStart,
                current_period_end: subscriptionData.currentPeriodEnd,
                cancel_at_period_end: subscriptionData.cancelAtPeriodEnd
            }, {
                onConflict: 'user_id'
            });
            
        if (error) throw error;
        
        console.log('✅ User subscription updated in database');
    } catch (error) {
        console.error('❌ Error updating subscription in database:', error);
    }
}

async function loadUserUsage(userId) {
    try {
        if (!window.supabaseClient?.supabase) {
            throw new Error('Supabase not available');
        }
        
        const { data, error } = await window.supabaseClient.supabase
            .from('user_usage')
            .select('*')
            .eq('user_id', userId)
            .single();
            
        if (error) {
            if (error.code === 'PGRST116') {
                // No usage record found, create one
                await createUserUsageEntry(userId);
                userUsage = {
                    rawMaterials: 0,
                    directLabor: 0,
                    mainRecipes: 0,
                    subRecipes: 0
                };
                return;
            }
            throw error;
        }
        
        userUsage = {
            rawMaterials: data.raw_materials_count || 0,
            directLabor: data.direct_labor_count || 0,
            mainRecipes: data.main_recipes_count || 0,
            subRecipes: 0
        };
        
        console.log('📊 Loaded user usage:', userUsage);
    } catch (error) {
        console.error('❌ Error loading user usage:', error);
        throw error;
    }
}

// =============================================================================
// TIER MANAGEMENT
// =============================================================================

function setFreeTier() {
    userSubscription = {
        isPremium: false,
        planType: 'free',
        status: 'active',
        currentPeriodEnd: null,
        remainingTime: null
    };
    
    // Apply restrictions for free tier
    blockAllSubRecipeAccess();
    updateCountDisplays();
}

function setPremiumTier(planType, periodEnd) {
    userSubscription = {
        isPremium: true,
        planType: planType,
        status: 'active',
        currentPeriodEnd: periodEnd,
        remainingTime: calculateRemainingTime(periodEnd)
    };
    
    // Restore premium functionality
    restorePremiumFunctionality();
    updateCountDisplays();
}

function calculateRemainingTime(endDate) {
    if (!endDate) return null;
    
    const end = new Date(endDate);
    const now = new Date();
    const diff = end - now;
    
    if (diff <= 0) return null;
    
    const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
    const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { months, days, hours, minutes };
}

// =============================================================================
// ENHANCED SUB-RECIPE PREMIUM RESTRICTION FIXES
// =============================================================================

function blockAllSubRecipeAccess() {
    if (subRecipeRestrictionsApplied) return;
    
    console.log('🔒 Applying comprehensive sub-recipe restrictions for free tier');
    
    // Standardized button restriction function
    const restrictButton = (button, featureName) => {
        if (!button || button.hasAttribute('data-restricted')) return;
        
        // Store original state
        button.setAttribute('data-original-state', JSON.stringify({
            onclick: button.onclick?.toString(),
            text: button.innerHTML,
            disabled: button.disabled
        }));
        button.setAttribute('data-restricted', 'true');
        
        // Apply standard disabled styles
        Object.entries(BUTTON_CONFIG.DISABLED_STYLE).forEach(([prop, value]) => {
            button.style[prop] = value;
        });
        
        button.disabled = true;
        button.title = BUTTON_CONFIG.TOOLTIPS.PREMIUM_ONLY;
        button.classList.add('feature-disabled', 'premium-lock');
        button.innerHTML = `🔒 ${button.textContent.replace('🔒 ', '')}`;
        
        // Set restricted click handler
        const newHandler = function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            showUpgradeModal('sub_recipes');
            return false;
        };
        
        button.onclick = newHandler;
        button.addEventListener('click', newHandler, true);
        
        return button;
    };
    
    // Apply to all sub-recipe buttons
    const subRecipeButtons = [
        document.getElementById('saveSubRecipeBtn'),
        document.querySelector('[data-role="open-save-subrecipe"]'),
        document.getElementById('saveSubRecipeConfirmBtn')
    ].filter(Boolean);
    
    subRecipeButtons.forEach(btn => restrictButton(btn, 'sub_recipes'));
    
    // Set up mutation observer for dynamic buttons
    if (!subRecipeObserver) {
        subRecipeObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) {
                            // Check for sub-recipe buttons
                            const buttons = node.matches && node.matches('#saveSubRecipeBtn, [data-role="open-save-subrecipe"], #saveSubRecipeConfirmBtn') 
                                ? [node]
                                : node.querySelectorAll 
                                ? node.querySelectorAll('#saveSubRecipeBtn, [data-role="open-save-subrecipe"], #saveSubRecipeConfirmBtn')
                                : [];
                            
                            buttons.forEach(btn => restrictButton(btn, 'sub_recipes'));
                        }
                    });
                }
            });
        });
        
        subRecipeObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Block sub-recipe options in dropdown
    const subRecipeOptions = document.querySelectorAll('#unifiedItemSelect optgroup[label="Sub-Recipes"] option');
    subRecipeOptions.forEach(option => {
        option.disabled = true;
        option.style.opacity = '0.5';
        option.style.cursor = 'not-allowed';
        if (!option.textContent.includes('(Premium Only)')) {
            option.textContent += ' (Premium Only)';
        }
    });
    
    // Update sub-recipe section heading
    const subRecipesHeading = document.querySelector('#recipes-tab .recipe-column:last-child h4');
    if (subRecipesHeading && !subRecipesHeading.hasAttribute('data-original-text')) {
        subRecipesHeading.setAttribute('data-original-text', subRecipesHeading.innerHTML);
        subRecipesHeading.innerHTML = 'Sub-Recipes <span class="limit-counter danger">(Premium Only)</span>';
        subRecipesHeading.style.opacity = '0.6';
    }
    
    subRecipeRestrictionsApplied = true;
}

function restorePremiumFunctionality() {
    if (!subRecipeRestrictionsApplied) return;
    
    console.log('✨ Restoring premium sub-recipe functionality');
    
    // Stop the mutation observer
    if (subRecipeObserver) {
        subRecipeObserver.disconnect();
        subRecipeObserver = null;
    }
    
    // 1. Restore "Save to Sub-Recipe" button
    const subRecipeBtn = document.getElementById('saveSubRecipeBtn');
    const subRecipeBtnOriginal = document.querySelector('[data-role="open-save-subrecipe"]');
    const subRecipeConfirmBtn = document.getElementById('saveSubRecipeConfirmBtn');
    
    const subRecipeButtons = [subRecipeBtn, subRecipeBtnOriginal, subRecipeConfirmBtn].filter(Boolean);
    
    subRecipeButtons.forEach(button => {
        if (!button) return;
        
        button.disabled = false;
        button.title = '';
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
        button.classList.remove('premium-lock');
        
        button.removeAttribute('data-restricted');
        
        // Restore original text
        const originalText = button.getAttribute('data-original-text');
        if (originalText) {
            button.innerHTML = originalText;
        } else {
            button.innerHTML = button.innerHTML.includes('Premium Only') 
                ? button.innerHTML.replace('🔒 Save to Sub-Recipe (Premium Only)', 'Save to Sub-Recipe')
                : button.innerHTML;
        }
        
        // Restore original click handler
        const originalOnclick = button.getAttribute('data-original-onclick');
        if (originalOnclick && originalOnclick !== 'null') {
            try {
                button.onclick = new Function('return ' + originalOnclick)();
            } catch (e) {
                console.warn('Could not restore onclick for button, using default');
                button.onclick = function() {
                    if (window.openSubRecipeSaveModal) {
                        window.openSubRecipeSaveModal();
                    }
                };
            }
        } else {
            button.onclick = function() {
                if (window.openSubRecipeSaveModal) {
                    window.openSubRecipeSaveModal();
                }
            };
        }
    });
    
    // 2. Restore sub-recipe options in dropdown
    const subRecipeOptions = document.querySelectorAll('#unifiedItemSelect optgroup[label="Sub-Recipes"] option');
    subRecipeOptions.forEach(option => {
        option.disabled = false;
        option.style.opacity = '1';
        option.style.cursor = 'default';
        const originalText = option.getAttribute('data-original-text');
        if (originalText) {
            option.textContent = originalText;
        } else {
            option.textContent = option.textContent.replace(' (Premium Only)', '');
        }
    });
    
    // 3. Restore original function
    if (originalOpenSubRecipeSaveModal) {
        window.openSubRecipeSaveModal = originalOpenSubRecipeSaveModal;
        originalOpenSubRecipeSaveModal = null;
    }
    
    // 4. Restore sub-recipe section heading
    const subRecipesHeading = document.querySelector('#recipes-tab .recipe-column:last-child h4');
    if (subRecipesHeading) {
        subRecipesHeading.classList.remove('premium-lock');
        const originalText = subRecipesHeading.getAttribute('data-original-text');
        if (originalText) {
            subRecipesHeading.innerHTML = originalText;
        } else {
            subRecipesHeading.innerHTML = subRecipesHeading.innerHTML.replace('(Premium Only)', '(Unlimited)');
        }
        subRecipesHeading.style.opacity = '1';
    }
    
    subRecipeRestrictionsApplied = false;
}

function addPremiumLockStyles() {
    if (document.getElementById('premium-lock-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'premium-lock-styles';
    style.textContent = `
        .premium-lock {
            position: relative;
        }
        
        .premium-lock::before {
            content: '🔒 PREMIUM';
            position: absolute;
            top: -6px;
            right: -6px;
            background: var(--danger);
            color: white;
            font-size: 9px;
            padding: 1px 4px;
            border-radius: 3px;
            font-weight: bold;
            z-index: 1000;
            pointer-events: none;
        }
        
        .feature-disabled {
            filter: grayscale(1);
            opacity: 0.6 !important;
            position: relative;
        }
        
        .feature-disabled::after {
            content: 'UPGRADE TO PREMIUM';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            background: rgba(220, 53, 69, 0.9);
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            pointer-events: none;
            z-index: 10;
        }
        
        .limit-counter.warning {
            color: #dc3545;
            font-weight: bold;
            animation: pulse 1.5s infinite;
        }
        
        .limit-counter.danger {
            color: #dc3545;
            font-weight: bold;
            background: rgba(220, 53, 69, 0.1);
            padding: 2px 6px;
            border-radius: 4px;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.6; }
            100% { opacity: 1; }
        }
        
        .button-loading {
            position: relative;
            color: transparent !important;
        }
        
        .button-loading::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        .button-disabled-limit {
            position: relative;
            background: var(--danger-light) !important;
            border-color: var(--danger) !important;
            color: var(--danger) !important;
        }
        
        @keyframes spin {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
    `;
    
    document.head.appendChild(style);
}

// =============================================================================
// VALIDATION HOOKS
// =============================================================================

function validatePremiumAccess(feature) {
    if (feature === 'sub_recipes' && !userSubscription.isPremium) {
        console.warn(`⚠️ Premium feature "${feature}" accessed by free user`);
        showUpgradeModal(feature);
        return false;
    }
    return true;
}

function validateBeforeAddingRawMaterial() {
    if (userSubscription.isPremium) return true;
    
    if (!canAddRawMaterial()) {
        showUpgradeModal('raw_materials');
        return false;
    }
    return true;
}

function validateBeforeAddingDirectLabor() {
    if (userSubscription.isPremium) return true;
    
    if (!canAddDirectLabor()) {
        showUpgradeModal('direct_labor');
        return false;
    }
    return true;
}

function validateBeforeAddingMainRecipe() {
    if (userSubscription.isPremium) return true;
    
    if (!canAddMainRecipe()) {
        showUpgradeModal('main_recipes');
        return false;
    }
    return true;
}

function validateRawMaterialBeforeSave() {
    if (userSubscription.isPremium) return true;
    
    if (userUsage.rawMaterials >= FREE_TIER_LIMITS.RAW_MATERIALS) {
        showUpgradeModal('raw_materials');
        return false;
    }
    return true;
}

function validateDirectLaborBeforeSave() {
    if (userSubscription.isPremium) return true;
    
    if (userUsage.directLabor >= FREE_TIER_LIMITS.DIRECT_LABOR) {
        showUpgradeModal('direct_labor');
        return false;
    }
    return true;
}

function validateMainRecipeBeforeSave() {
    if (userSubscription.isPremium) return true;
    
    if (userUsage.mainRecipes >= FREE_TIER_LIMITS.MAIN_RECIPES) {
        showUpgradeModal('main_recipes');
        return false;
    }
    return true;
}

function setupValidationHooks() {
    // Patch saveSubRecipeWithDuplicateCheck if it exists
    if (window.saveSubRecipeWithDuplicateCheck && !window.originalSaveSubRecipeWithDuplicateCheck) {
        window.originalSaveSubRecipeWithDuplicateCheck = window.saveSubRecipeWithDuplicateCheck;
        window.saveSubRecipeWithDuplicateCheck = function(...args) {
            if (!validatePremiumAccess('sub_recipes')) {
                return false;
            }
            return window.originalSaveSubRecipeWithDuplicateCheck(...args);
        };
    }
    
    // Override openRawMaterialModal
    if (window.openRawMaterialModal && !window.originalOpenRawMaterialModal) {
        window.originalOpenRawMaterialModal = window.openRawMaterialModal;
        window.openRawMaterialModal = function() {
            if (!validateBeforeAddingRawMaterial()) {
                return false;
            }
            return window.originalOpenRawMaterialModal.apply(this, arguments);
        };
    }
    
    // Override openDirectLaborModal
    if (window.openDirectLaborModal && !window.originalOpenDirectLaborModal) {
        window.originalOpenDirectLaborModal = window.openDirectLaborModal;
        window.openDirectLaborModal = function() {
            if (!validateBeforeAddingDirectLabor()) {
                return false;
            }
            return window.originalOpenDirectLaborModal.apply(this, arguments);
        };
    }
    
    // Override openRecipeBuilderModal
    if (window.openRecipeBuilderModal && !window.originalOpenRecipeBuilderModal) {
        window.originalOpenRecipeBuilderModal = window.openRecipeBuilderModal;
        window.openRecipeBuilderModal = function() {
            if (!validateBeforeAddingMainRecipe()) {
                return false;
            }
            return window.originalOpenRecipeBuilderModal.apply(this, arguments);
        };
    }
}

// =============================================================================
// LIMIT CHECKS
// =============================================================================

function canAddRawMaterial() {
    if (userSubscription.isPremium) return true;
    return userUsage.rawMaterials < FREE_TIER_LIMITS.RAW_MATERIALS;
}

function canAddDirectLabor() {
    if (userSubscription.isPremium) return true;
    return userUsage.directLabor < FREE_TIER_LIMITS.DIRECT_LABOR;
}

function canAddMainRecipe() {
    if (userSubscription.isPremium) return true;
    return userUsage.mainRecipes < FREE_TIER_LIMITS.MAIN_RECIPES;
}

function canAddSubRecipe() {
    return userSubscription.isPremium;
}

function canUseServingScale() {
    return userSubscription.isPremium;
}

function canExportCSV() {
    return userSubscription.isPremium;
}

function canPrint() {
    return userSubscription.isPremium;
}

function getRemainingCounts() {
    return {
        rawMaterials: Math.max(0, FREE_TIER_LIMITS.RAW_MATERIALS - userUsage.rawMaterials),
        directLabor: Math.max(0, FREE_TIER_LIMITS.DIRECT_LABOR - userUsage.directLabor),
        mainRecipes: Math.max(0, FREE_TIER_LIMITS.MAIN_RECIPES - userUsage.mainRecipes),
        subRecipes: userSubscription.isPremium ? 'Unlimited' : 0
    };
}

// =============================================================================
// USAGE TRACKING
// =============================================================================

async function incrementRawMaterialCount() {
    if (userSubscription.isPremium) return;
    
    userUsage.rawMaterials++;
    await updateUserUsage();
    updateCountDisplays(); // Immediate UI update
    
    if (userUsage.rawMaterials >= FREE_TIER_LIMITS.RAW_MATERIALS) {
        showUpgradeModal('raw_materials');
    }
}

async function incrementDirectLaborCount() {
    if (userSubscription.isPremium) return;
    
    userUsage.directLabor++;
    await updateUserUsage();
    updateCountDisplays(); // Immediate UI update
    
    if (userUsage.directLabor >= FREE_TIER_LIMITS.DIRECT_LABOR) {
        showUpgradeModal('direct_labor');
    }
}

async function incrementMainRecipeCount() {
    if (userSubscription.isPremium) return;
    
    userUsage.mainRecipes++;
    await updateUserUsage();
    updateCountDisplays(); // Immediate UI update
    
    if (userUsage.mainRecipes >= FREE_TIER_LIMITS.MAIN_RECIPES) {
        showUpgradeModal('main_recipes');
    }
}

async function updateUserUsage() {
    try {
        const currentUser = window.supabaseClient?.getCurrentUser();
        if (!currentUser) return;
        
        const { error } = await window.supabaseClient.supabase
            .from('user_usage')
            .upsert({
                user_id: currentUser.id,
                raw_materials_count: userUsage.rawMaterials,
                direct_labor_count: userUsage.directLabor,
                main_recipes_count: userUsage.mainRecipes,
                updated_at: new Date().toISOString()
            });
            
        if (error) throw error;
    } catch (error) {
        console.error('❌ Error updating user usage:', error);
    }
}

// =============================================================================
// DATABASE HELPERS
// =============================================================================

async function createFreeTierEntry(userId) {
    try {
        const { error } = await window.supabaseClient.supabase
            .from('user_subscriptions')
            .insert({
                user_id: userId,
                plan_type: 'free',
                subscription_status: 'active',
                current_period_start: new Date().toISOString()
            });
            
        if (error) throw error;
    } catch (error) {
        console.error('❌ Error creating free tier entry:', error);
    }
}

async function createUserUsageEntry(userId) {
    try {
        const { error } = await window.supabaseClient.supabase
            .from('user_usage')
            .insert({
                user_id: userId,
                raw_materials_count: 0,
                direct_labor_count: 0,
                main_recipes_count: 0,
                last_reset_date: new Date().toISOString()
            });
            
        if (error) throw error;
    } catch (error) {
        console.error('❌ Error creating user usage entry:', error);
    }
}

// =============================================================================
// UI UPDATES - ENHANCED WITH BUTTON DISABLING
// =============================================================================

function updateUIForTier() {
    // Update header/menu display
    updateMenuDisplay();
    
    // Update feature availability
    updateFeatureAvailability();
    
    // Update count displays (now includes button disabling)
    updateCountDisplays();
    
    // Update ads display
    updateAdsDisplay();
    
    // Apply or remove sub-recipe restrictions based on tier
    if (userSubscription.isPremium) {
        restorePremiumFunctionality();
    } else {
        // Force immediate blocking to ensure DOM is ready
        setTimeout(() => {
            blockAllSubRecipeAccess();
        }, 0);
    }
    
    // Setup validation hooks
    setupValidationHooks();
}

function updateCountDisplays() {
    if (userSubscription.isPremium) {
        // Premium users see no limits - enable all buttons
        updatePremiumDisplay();
        enableAllAddButtons();
        return;
    }
    
    const remaining = getRemainingCounts();
    
    // Update raw materials count display
    const rawMaterialsHeading = document.querySelector('#raw-materials-tab .section-header h2');
    if (rawMaterialsHeading) {
        rawMaterialsHeading.innerHTML = `Master Raw Material List <span class="limit-counter ${remaining.rawMaterials <= 2 ? 'warning' : ''} ${remaining.rawMaterials <= 0 ? 'danger' : ''}">(${remaining.rawMaterials} remaining)</span>`;
    }
    
    // Update raw material add button
    const rawMaterialAddBtn = document.querySelector('[data-role="add-raw-material"]');
    if (rawMaterialAddBtn) {
        if (remaining.rawMaterials <= 0) {
            // Store original onclick if not already stored
            if (!originalButtonHandlers.has('raw-material-btn')) {
                originalButtonHandlers.set('raw-material-btn', rawMaterialAddBtn.onclick);
            }
            
            // Disable button and show upgrade prompt
            rawMaterialAddBtn.disabled = true;
            rawMaterialAddBtn.classList.add('feature-disabled');
            rawMaterialAddBtn.style.opacity = '0.5';
            rawMaterialAddBtn.style.cursor = 'not-allowed';
            rawMaterialAddBtn.title = 'Upgrade to Premium for unlimited raw materials';
            
            // Replace click handler
            rawMaterialAddBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                showUpgradeModal('raw_materials');
                return false;
            };
            
            // Add visual warning to the section
            const rawMaterialSection = document.querySelector('#raw-materials-tab .column:first-child');
            if (rawMaterialSection) {
                rawMaterialSection.classList.add('limit-warning');
                if (remaining.rawMaterials <= 0) {
                    rawMaterialSection.classList.add('limit-reached');
                }
            }
        } else {
            // Enable button
            rawMaterialAddBtn.disabled = false;
            rawMaterialAddBtn.classList.remove('feature-disabled');
            rawMaterialAddBtn.style.opacity = '1';
            rawMaterialAddBtn.style.cursor = 'pointer';
            rawMaterialAddBtn.title = `Add raw material (${remaining.rawMaterials} remaining)`;
            
            // Restore original onclick if available
            const originalOnclick = originalButtonHandlers.get('raw-material-btn');
            if (originalOnclick) {
                rawMaterialAddBtn.onclick = originalOnclick;
            } else {
                rawMaterialAddBtn.onclick = function() {
                    if (window.openRawMaterialModal) {
                        window.openRawMaterialModal();
                    }
                };
            }
            
            // Remove visual warnings
            const rawMaterialSection = document.querySelector('#raw-materials-tab .column:first-child');
            if (rawMaterialSection) {
                rawMaterialSection.classList.remove('limit-warning', 'limit-reached');
            }
        }
    }
    
    // Update direct labor count display
    const directLaborHeading = document.querySelectorAll('#raw-materials-tab .section-header h2')[1];
    if (directLaborHeading) {
        directLaborHeading.innerHTML = `Direct Labor List <span class="limit-counter ${remaining.directLabor <= 1 ? 'warning' : ''} ${remaining.directLabor <= 0 ? 'danger' : ''}">(${remaining.directLabor} remaining)</span>`;
    }
    
    // Update direct labor add button
    const directLaborAddBtn = document.querySelector('[data-role="add-direct-labor"]');
    if (directLaborAddBtn) {
        if (remaining.directLabor <= 0) {
            // Store original onclick if not already stored
            if (!originalButtonHandlers.has('direct-labor-btn')) {
                originalButtonHandlers.set('direct-labor-btn', directLaborAddBtn.onclick);
            }
            
            // Disable button and show upgrade prompt
            directLaborAddBtn.disabled = true;
            directLaborAddBtn.classList.add('feature-disabled');
            directLaborAddBtn.style.opacity = '0.5';
            directLaborAddBtn.style.cursor = 'not-allowed';
            directLaborAddBtn.title = 'Upgrade to Premium for unlimited direct labor';
            
            // Replace click handler
            directLaborAddBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                showUpgradeModal('direct_labor');
                return false;
            };
            
            // Add visual warning to the section
            const directLaborSection = document.querySelector('#raw-materials-tab .column:last-child');
            if (directLaborSection) {
                directLaborSection.classList.add('limit-warning');
                if (remaining.directLabor <= 0) {
                    directLaborSection.classList.add('limit-reached');
                }
            }
        } else {
            // Enable button
            directLaborAddBtn.disabled = false;
            directLaborAddBtn.classList.remove('feature-disabled');
            directLaborAddBtn.style.opacity = '1';
            directLaborAddBtn.style.cursor = 'pointer';
            directLaborAddBtn.title = `Add direct labor (${remaining.directLabor} remaining)`;
            
            // Restore original onclick if available
            const originalOnclick = originalButtonHandlers.get('direct-labor-btn');
            if (originalOnclick) {
                directLaborAddBtn.onclick = originalOnclick;
            } else {
                directLaborAddBtn.onclick = function() {
                    if (window.openDirectLaborModal) {
                        window.openDirectLaborModal();
                    }
                };
            }
            
            // Remove visual warnings
            const directLaborSection = document.querySelector('#raw-materials-tab .column:last-child');
            if (directLaborSection) {
                directLaborSection.classList.remove('limit-warning', 'limit-reached');
            }
        }
    }
    
    // Update main recipes count display
    const mainRecipesHeading = document.querySelector('#recipes-tab .recipe-column:first-child h4');
    if (mainRecipesHeading) {
        mainRecipesHeading.innerHTML = `Main Recipes <span class="limit-counter ${remaining.mainRecipes <= 1 ? 'warning' : ''} ${remaining.mainRecipes <= 0 ? 'danger' : ''}">(${remaining.mainRecipes} remaining)</span>`;
    }
    
    // Update create recipe button
    const createRecipeBtn = document.getElementById('createNewRecipeBtn');
    if (createRecipeBtn) {
        // Remove loading state
        createRecipeBtn.classList.remove('button-loading');
        
        if (remaining.mainRecipes <= 0) {
            // Free tier limit reached
            createRecipeBtn.disabled = true;
            createRecipeBtn.classList.add('button-disabled-limit');
            createRecipeBtn.innerHTML = '🔒 Create New Recipe';
            createRecipeBtn.title = 'Upgrade to Premium for unlimited recipes';
            createRecipeBtn.style.opacity = '0.5';
            createRecipeBtn.style.cursor = 'not-allowed';
            
            // Ensure event handler blocks clicks
            createRecipeBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                showUpgradeModal('main_recipes');
                return false;
            };
        } else {
            // Free tier, but not at limit
            createRecipeBtn.disabled = false;
            createRecipeBtn.classList.remove('button-disabled-limit');
            createRecipeBtn.innerHTML = '🍳 Create New Recipe';
            createRecipeBtn.title = `Create new recipe (${remaining.mainRecipes} remaining)`;
            createRecipeBtn.style.opacity = '1';
            createRecipeBtn.style.cursor = 'pointer';
            
            // Restore original onclick if available
            const originalOnclick = originalButtonHandlers.get('create-recipe-btn');
            if (originalOnclick) {
                createRecipeBtn.onclick = originalOnclick;
            } else {
                createRecipeBtn.onclick = function() {
                    if (window.openRecipeBuilderModal) {
                        window.openRecipeBuilderModal();
                    }
                };
            }
        }
    }
}

function enableAllAddButtons() {
    // Enable all add buttons for premium users
    const buttons = [
        { selector: '[data-role="add-raw-material"]', key: 'raw-material-btn' },
        { selector: '[data-role="add-direct-labor"]', key: 'direct-labor-btn' },
        { selector: '#createNewRecipeBtn', key: 'create-recipe-btn' }
    ];
    
    buttons.forEach(({ selector, key }) => {
        const button = document.querySelector(selector);
        if (button) {
            button.disabled = false;
            button.classList.remove('feature-disabled');
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
            button.title = button.getAttribute('data-original-title') || '';
            
            // Restore original onclick if available
            const originalOnclick = originalButtonHandlers.get(key);
            if (originalOnclick) {
                button.onclick = originalOnclick;
            }
        }
    });
    
    // Remove all visual warnings
    document.querySelectorAll('.limit-warning, .limit-reached').forEach(el => {
        el.classList.remove('limit-warning', 'limit-reached');
    });
}

function updatePremiumDisplay() {
    // For premium users, show unlimited status
    const elements = [
        document.querySelector('#raw-materials-tab .section-header h2'),
        document.querySelectorAll('#raw-materials-tab .section-header h2')[1],
        document.querySelector('#recipes-tab .recipe-column:first-child h4'),
        document.querySelector('#recipes-tab .recipe-column:last-child h4')
    ];
    
    elements.forEach((element, index) => {
        if (element) {
            const baseText = element.textContent.split('(')[0].trim();
            const unlimitedText = index === 3 ? 'Sub-Recipes' : baseText;
            element.innerHTML = `${unlimitedText} <span class="limit-counter" style="color: var(--success);">(Unlimited)</span>`;
        }
    });
}

function updateMenuDisplay() {
    const menuModal = document.getElementById('menuModal');
    if (!menuModal) return;
    
    const upgradeButton = menuModal.querySelector('#upgradeToPremiumBtn');
    const premiumStatus = menuModal.querySelector('#premiumStatusDisplay');
    
    if (userSubscription.isPremium) {
        if (upgradeButton) upgradeButton.classList.add('hidden');
        if (premiumStatus) {
            premiumStatus.classList.remove('hidden');
            updatePremiumStatusDisplay();
        }
    } else {
        if (upgradeButton) upgradeButton.classList.remove('hidden');
        if (premiumStatus) premiumStatus.classList.add('hidden');
    }
}

function updatePremiumStatusDisplay() {
    const premiumStatus = document.getElementById('premiumStatusDisplay');
    if (!premiumStatus || !userSubscription.isPremium) return;
    
    let statusText = 'Premium Member';
    
    if (userSubscription.remainingTime) {
        const { months, days, hours, minutes } = userSubscription.remainingTime;
        statusText += ` • ${months}m ${days}d ${hours}h ${minutes}m remaining`;
    }
    
    premiumStatus.textContent = statusText;
    
    startCountdownTimer();
}

function startCountdownTimer() {
    if (!userSubscription.isPremium || !userSubscription.currentPeriodEnd) return;
    
    function updateTimer() {
        const now = new Date();
        const endDate = new Date(userSubscription.currentPeriodEnd);
        const diff = endDate - now;
        
        if (diff <= 0) {
            userSubscription.isPremium = false;
            updateUIForTier();
            return;
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        const premiumStatus = document.getElementById('premiumStatusDisplay');
        if (premiumStatus) {
            premiumStatus.textContent = `Premium Member • ${days}d ${hours}h ${minutes}m remaining`;
        }
    }
    
    updateTimer();
    setInterval(updateTimer, 60000);
}

// =============================================================================
// COMPLETE FEATURE AVAILABILITY MANAGEMENT
// =============================================================================

function updateFeatureAvailability() {
    // Apply sub-recipe restrictions first
    if (userSubscription.isPremium) {
        restorePremiumFunctionality();
    } else {
        blockAllSubRecipeAccess();
    }
    
    // Disable/enable serving scale
    const servingScaleInput = document.getElementById('servingScale');
    if (servingScaleInput) {
        if (!userSubscription.isPremium) {
            servingScaleInput.disabled = true;
            servingScaleInput.title = 'User must be Premium Subscriber to access this function';
            servingScaleInput.style.opacity = '0.5';
            servingScaleInput.style.cursor = 'not-allowed';
            servingScaleInput.parentElement.classList.add('feature-disabled');
            
            servingScaleInput.addEventListener('click', function(e) {
                if (this.disabled) {
                    e.preventDefault();
                    e.stopPropagation();
                    showUpgradeModal('serving_scale');
                }
            });
        } else {
            servingScaleInput.disabled = false;
            servingScaleInput.title = '';
            servingScaleInput.style.opacity = '1';
            servingScaleInput.style.cursor = 'auto';
            servingScaleInput.parentElement.classList.remove('feature-disabled');
        }
    }
    
    // Disable/enable print button
    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
        if (!userSubscription.isPremium) {
            printBtn.disabled = true;
            printBtn.setAttribute('data-tooltip', 'User must be Premium Subscriber to access this function');
            printBtn.style.opacity = '0.5';
            printBtn.style.cursor = 'not-allowed';
            printBtn.classList.add('feature-disabled');
            
            printBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                showUpgradeModal('print');
                return false;
            };
        } else {
            printBtn.disabled = false;
            printBtn.title = '';
            printBtn.style.opacity = '1';
            printBtn.style.cursor = 'pointer';
            printBtn.classList.remove('feature-disabled');
            printBtn.onclick = function() {
                generatePrintPreview();
            };
        }
    }
    
    // Disable/enable CSV export button
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    if (exportCsvBtn) {
        if (!userSubscription.isPremium) {
            exportCsvBtn.disabled = true;
            exportCsvBtn.setAttribute('data-tooltip', 'User must be Premium Subscriber to access this function');
            exportCsvBtn.style.opacity = '0.5';
            exportCsvBtn.style.cursor = 'not-allowed';
            exportCsvBtn.classList.add('feature-disabled');
            
            exportCsvBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                showUpgradeModal('csv_export');
                return false;
            };
        } else {
            exportCsvBtn.disabled = false;
            exportCsvBtn.title = '';
            exportCsvBtn.style.opacity = '1';
            exportCsvBtn.style.cursor = 'pointer';
            exportCsvBtn.classList.remove('feature-disabled');
            exportCsvBtn.onclick = function() {
                exportToCSV();
            };
        }
    }
}

function updateAdsDisplay() {
    const adSpaces = document.querySelectorAll('.ad-space, .ad-content');
    
    if (userSubscription.isPremium) {
        adSpaces.forEach(ad => {
            ad.style.display = 'none';
        });
    } else {
        adSpaces.forEach(ad => {
            ad.style.display = 'block';
        });
        
        injectAdvertisements();
    }
}

function injectAdvertisements() {
    const adContent = document.querySelector('.ad-content');
    if (!adContent) return;
    
    adContent.innerHTML = `
        <h4>Advertisement</h4>
        <div style="margin: var(--space-md) 0;">
            <p>Your ad could be here.</p>
        </div>
        <small style="color: var(--text-secondary); font-size: 12px;">
            Upgrade to Premium to remove ads.
        </small>
    `;
}

// =============================================================================
// UPGRADE MODAL
// =============================================================================

function showUpgradeModal(reason) {
    let upgradeModal = document.getElementById('upgradeModal');
    
    if (!upgradeModal) {
        createUpgradeModal();
        upgradeModal = document.getElementById('upgradeModal');
    }
    
    const reasonMessages = {
        raw_materials: `You've reached the limit of ${FREE_TIER_LIMITS.RAW_MATERIALS} raw materials.`,
        direct_labor: `You've reached the limit of ${FREE_TIER_LIMITS.DIRECT_LABOR} direct labor items.`,
        main_recipes: `You've reached the limit of ${FREE_TIER_LIMITS.MAIN_RECIPES} main recipes.`,
        sub_recipes: 'Sub-recipes are only available for Premium subscribers.',
        serving_scale: 'Serving scale adjustment is only available for Premium subscribers.',
        print: 'Print functionality is only available for Premium subscribers.',
        csv_export: 'CSV export is only available for Premium subscribers.'
    };
    
    const message = reasonMessages[reason] || 'Upgrade to Premium for unlimited access!';
    
    const modalMessage = upgradeModal.querySelector('#upgradeModalMessage');
    if (modalMessage) {
        modalMessage.textContent = message;
    }
    
    upgradeModal.classList.remove('hidden');
    upgradeModal.style.display = 'flex';
}

function createUpgradeModal() {
    const modalHTML = `
        <div id="upgradeModal" class="modal hidden">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>✨ Upgrade to Premium</h3>
                    <button class="close-btn" onclick="closeUpgradeModal()">×</button>
                </div>
                
                <div class="modal-body">
                    <div id="upgradeModalMessage" style="margin-bottom: var(--space-lg);">
                        Upgrade to Premium for unlimited access!
                    </div>
                    
                    <div class="premium-plans">
                        <div class="plan-card" onclick="selectPlan('monthly')" id="monthlyPlan">
                            <div class="plan-header">
                                <h4>Monthly</h4>
                                <div class="plan-price">
                                    <span class="price">$${PREMIUM_PLANS.MONTHLY.price}</span>
                                    <span class="interval">/month</span>
                                </div>
                            </div>
                            <ul class="plan-features">
                                <li>Unlimited Raw Materials</li>
                                <li>Unlimited Direct Labor</li>
                                <li>Unlimited Recipes</li>
                                <li>Sub-Recipe Functionality</li>
                                <li>Advanced Summary Features</li>
                                <li>Print & Export</li>
                                <li>Ad-Free Experience</li>
                            </ul>
                            <button class="btn-primary" onclick="processUpgrade('monthly')">
                                Upgrade Now
                            </button>
                        </div>
                        
                        <div class="plan-card featured" onclick="selectPlan('yearly')" id="yearlyPlan">
                            <div class="plan-badge">Best Value</div>
                            <div class="plan-header">
                                <h4>Yearly</h4>
                                <div class="plan-price">
                                    <span class="price">$${PREMIUM_PLANS.YEARLY.price}</span>
                                    <span class="interval">/year</span>
                                </div>
                                <small class="plan-savings">${PREMIUM_PLANS.YEARLY.discount}</small>
                            </div>
                            <ul class="plan-features">
                                <li>Everything in Monthly</li>
                                <li>Save 2 months free!</li>
                                <li>Priority Support</li>
                                <li>Early Access to New Features</li>
                            </ul>
                            <button class="btn-primary" onclick="processUpgrade('yearly')">
                                Upgrade Now
                            </button>
                        </div>
                    </div>
                    
                    <div style="margin-top: var(--space-lg); text-align: center;">
                        <small style="color: var(--text-secondary);">
                            Cancel anytime.
                        </small>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    addUpgradeModalStyles();
    selectPlan('yearly');
}

function addUpgradeModalStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .premium-plans {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--space-lg);
            margin-bottom: var(--space-lg);
        }
        
        @media (max-width: 600px) {
            .premium-plans {
                grid-template-columns: 1fr;
            }
        }
        
        .plan-card {
            border: 2px solid var(--border);
            border-radius: var(--radius-lg);
            padding: var(--space-xl);
            position: relative;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .plan-card:hover {
            border-color: var(--primary);
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
        }
        
        .plan-card.featured {
            border-color: var(--primary);
            background: var(--primary-light);
        }
        
        .plan-badge {
            position: absolute;
            top: -12px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--primary);
            color: white;
            padding: 4px 12px;
            border-radius: var(--radius-pill);
            font-size: 12px;
            font-weight: 600;
        }
        
        .plan-header {
            text-align: center;
            margin-bottom: var(--space-lg);
        }
        
        .plan-header h4 {
            margin: 0 0 var(--space-sm) 0;
            font-size: 1.2rem;
            color: var(--text-primary);
        }
        
        .plan-price {
            margin-bottom: var(--space-sm);
        }
        
        .plan-price .price {
            font-size: 2rem;
            font-weight: 700;
            color: var(--primary);
        }
        
        .plan-price .interval {
            color: var(--text-secondary);
            font-size: 0.9rem;
        }
        
        .plan-savings {
            color: var(--success);
            font-weight: 600;
            display: block;
        }
        
        .plan-features {
            list-style: none;
            padding: 0;
            margin: 0 0 var(--space-lg) 0;
        }
        
        .plan-features li {
            padding: var(--space-xs) 0;
            color: var(--text-secondary);
            font-size: 14px;
        }
        
        .plan-features li::before {
            content: '✓';
            color: var(--success);
            margin-right: var(--space-sm);
            font-weight: bold;
        }
        
        .plan-card button {
            width: 100%;
        }
    `;
    
    document.head.appendChild(style);
}

function selectPlan(plan) {
    const monthlyPlan = document.getElementById('monthlyPlan');
    const yearlyPlan = document.getElementById('yearlyPlan');
    
    monthlyPlan?.classList.remove('featured');
    yearlyPlan?.classList.remove('featured');
    
    if (plan === 'monthly') {
        monthlyPlan?.classList.add('featured');
    } else {
        yearlyPlan?.classList.add('featured');
    }
}

function closeUpgradeModal() {
    const upgradeModal = document.getElementById('upgradeModal');
    if (upgradeModal) {
        upgradeModal.classList.add('hidden');
    }
}

// =============================================================================
// PADDLE INTEGRATION
// =============================================================================

let paddle = null;

async function initializePaddle() {
    console.log('🛶 Paddle integration would initialize here');
}

function processUpgrade(planType) {
    const currentUser = window.supabaseClient?.getCurrentUser();
    
    if (!currentUser) {
        alert('Please login to upgrade to Premium');
        window.showAuthModal?.();
        return;
    }
    
    const button = event?.target;
    if (button) {
        const originalText = button.textContent;
        button.textContent = 'Processing...';
        button.disabled = true;
        
        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
        }, 2000);
    }
    
    window.startPaddleCheckout?.(planType);
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

function setupEventListeners() {
    // Listen for raw material additions
    document.addEventListener('rawMaterialAdded', handleRawMaterialAdded);
    
    // Listen for direct labor additions
    document.addEventListener('directLaborAdded', handleDirectLaborAdded);
    
    // Listen for recipe additions
    document.addEventListener('recipeAdded', handleRecipeAdded);
    
    // Listen for auth state changes
    document.addEventListener('authStateChanged', handleAuthStateChanged);
    
    // Listen for user tier changes
    document.addEventListener('userTierChanged', handleUserTierChanged);
    
    // Enhanced: Intercept sub-recipe button clicks globally
    document.addEventListener('click', function(e) {
        const subRecipeBtn = e.target.closest('#saveSubRecipeBtn, [data-role="open-save-subrecipe"], #saveSubRecipeConfirmBtn');
        if (subRecipeBtn && !userSubscription.isPremium) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            showUpgradeModal('sub_recipes');
            return false;
        }
        
        // Intercept add button clicks for free tier users
        if (!userSubscription.isPremium) {
            const rawMaterialBtn = e.target.closest('[data-role="add-raw-material"]');
            if (rawMaterialBtn) {
                if (!canAddRawMaterial()) {
                    e.preventDefault();
                    e.stopPropagation();
                    showUpgradeModal('raw_materials');
                    return false;
                }
            }
            
            const directLaborBtn = e.target.closest('[data-role="add-direct-labor"]');
            if (directLaborBtn) {
                if (!canAddDirectLabor()) {
                    e.preventDefault();
                    e.stopPropagation();
                    showUpgradeModal('direct_labor');
                    return false;
                }
            }
            
            const createRecipeBtn = e.target.closest('#createNewRecipeBtn');
            if (createRecipeBtn) {
                if (!canAddMainRecipe()) {
                    e.preventDefault();
                    e.stopPropagation();
                    showUpgradeModal('main_recipes');
                    return false;
                }
            }
        }
    }, true);
    
    // Listen for recipe builder modal opening
    document.addEventListener('modalOpened', function(e) {
        if (e.detail && e.detail.modalId === 'recipeBuilderModal') {
            if (!userSubscription.isPremium) {
                setTimeout(() => {
                    blockAllSubRecipeAccess();
                }, 100);
            }
        }
    });
    
    // Manually trigger modalOpened event for existing modals
    const recipeBuilderBtn = document.getElementById('createNewRecipeBtn');
    if (recipeBuilderBtn) {
        recipeBuilderBtn.addEventListener('click', function() {
            setTimeout(() => {
                document.dispatchEvent(new CustomEvent('modalOpened', {
                    detail: { modalId: 'recipeBuilderModal' }
                }));
            }, 300);
        });
    }
}

function handleRawMaterialAdded() {
    if (!userSubscription.isPremium) {
        incrementRawMaterialCount();
    }
}

function handleDirectLaborAdded() {
    if (!userSubscription.isPremium) {
        incrementDirectLaborCount();
    }
}

function handleRecipeAdded(event) {
    if (!userSubscription.isPremium && event.detail?.type === 'main') {
        incrementMainRecipeCount();
    }
}

function handleAuthStateChanged() {
    isInitialized = false;
    initializeMonetization();
}

function handleUserTierChanged() {
    updateUIForTier();
    
    if (userSubscription.isPremium) {
        restorePremiumFunctionality();
    } else {
        blockAllSubRecipeAccess();
    }
}

// =============================================================================
// PUBLIC API
// =============================================================================

window.monetization = {
    // Initialization
    initialize: initializeMonetization,
    
    // Tier checks
    isPremium: () => userSubscription.isPremium,
    getSubscription: () => ({ ...userSubscription }),
    getUsage: () => ({ ...userUsage }),
    getRemainingCounts,
    
    // Feature checks
    canAddRawMaterial,
    canAddDirectLabor,
    canAddMainRecipe,
    canAddSubRecipe,
    canUseServingScale,
    canExportCSV,
    canPrint,
    
    // UI
    updateUIForTier,
    showUpgradeModal,
    closeUpgradeModal,
    
    // Upgrade
    processUpgrade,
    selectPlan,
    
    // Events
    setupEventListeners,
    
    // NEW: Enhanced sub-recipe restriction functions
    blockAllSubRecipeAccess,
    restorePremiumFunctionality,
    
    // NEW: Validation functions
    validatePremiumAccess,
    validateBeforeAddingRawMaterial,
    validateBeforeAddingDirectLabor,
    validateBeforeAddingMainRecipe,
    validateRawMaterialBeforeSave,
    validateDirectLaborBeforeSave,
    validateMainRecipeBeforeSave,
    
    // NEW: Tier change function
    setPremiumTier: function(planType, periodEnd) {
        setPremiumTier(planType, periodEnd);
        document.dispatchEvent(new CustomEvent('userTierChanged', {
            detail: { isPremium: true }
        }));
    },
    
    setFreeTier: function() {
        setFreeTier();
        document.dispatchEvent(new CustomEvent('userTierChanged', {
            detail: { isPremium: false }
        }));
    },
    
    // NEW: Usage tracking functions
    trackRawMaterialAdded: function() {
        if (!userSubscription.isPremium) {
            userUsage.rawMaterials++;
            updateUserUsage();
            updateCountDisplays();
            
            if (userUsage.rawMaterials >= FREE_TIER_LIMITS.RAW_MATERIALS) {
                showUpgradeModal('raw_materials');
            }
        }
    },
    
    trackDirectLaborAdded: function() {
        if (!userSubscription.isPremium) {
            userUsage.directLabor++;
            updateUserUsage();
            updateCountDisplays();
            
            if (userUsage.directLabor >= FREE_TIER_LIMITS.DIRECT_LABOR) {
                showUpgradeModal('direct_labor');
            }
        }
    },
    
    trackMainRecipeAdded: function() {
        if (!userSubscription.isPremium) {
            userUsage.mainRecipes++;
            updateUserUsage();
            updateCountDisplays();
            
            if (userUsage.mainRecipes >= FREE_TIER_LIMITS.MAIN_RECIPES) {
                showUpgradeModal('main_recipes');
            }
        }
    },
    
    trackSubRecipeAdded: function() {
        if (userSubscription.isPremium) {
            userUsage.subRecipes++;
            updateUserUsage();
        }
    },
    
    updateUsageCounts: function(counts) {
        userUsage = {
            rawMaterials: counts.rawMaterials || 0,
            directLabor: counts.directLabor || 0,
            mainRecipes: counts.mainRecipes || 0,
            subRecipes: counts.subRecipes || 0
        };
        
        updateUserUsage();
        updateCountDisplays();
        
        console.log('📊 Updated usage counts:', userUsage);
    },
    
    // NEW: Force update function
    forceUpdateCountDisplays: updateCountDisplays
};

// =============================================================================
// AUTO-INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize monetization immediately
    initializeMonetization();
});

// Initialize when user logs in or auth state changes
if (window.supabaseClient) {
    const originalCheckAuthState = window.supabaseClient.checkAuthState;
    window.supabaseClient.checkAuthState = async function() {
        const result = await originalCheckAuthState.apply(this, arguments);
        initializeMonetization();
        return result;
    };
}

console.log('💰 Monetization module loaded');

// =============================================================================
// ENHANCED USAGE TRACKING FUNCTIONS
// =============================================================================

// Enhanced updateUserUsage with better error handling
async function updateUserUsage() {
    try {
        const currentUser = window.supabaseClient?.getCurrentUser();
        if (!currentUser) {
            localStorage.setItem('profitPerPlate_userUsage', JSON.stringify(userUsage));
            return;
        }
        
        if (!window.supabaseClient?.supabase) {
            console.warn('Supabase not available, storing usage locally');
            localStorage.setItem('profitPerPlate_userUsage', JSON.stringify(userUsage));
            return;
        }
        
        const { error } = await window.supabaseClient.supabase
            .from('user_usage')
            .upsert({
                user_id: currentUser.id,
                raw_materials_count: userUsage.rawMaterials,
                direct_labor_count: userUsage.directLabor,
                main_recipes_count: userUsage.mainRecipes,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });
            
        if (error) {
            console.error('❌ Error updating user usage:', error);
            localStorage.setItem('profitPerPlate_userUsage', JSON.stringify(userUsage));
        } else {
            console.log('✅ User usage updated in database');
        }
    } catch (error) {
        console.error('❌ Exception updating user usage:', error);
        localStorage.setItem('profitPerPlate_userUsage', JSON.stringify(userUsage));
    }
}

// Auto-sync local usage data when user logs in
function syncLocalUsageData() {
    const localUsage = localStorage.getItem('profitPerPlate_userUsage');
    if (localUsage) {
        try {
            const parsedUsage = JSON.parse(localUsage);
            if (window.monetization && window.monetization.updateUsageCounts) {
                window.monetization.updateUsageCounts(parsedUsage);
            }
            localStorage.removeItem('profitPerPlate_userUsage');
        } catch (e) {
            console.error('Error syncing local usage data:', e);
        }
    }
}

// Call sync when monetization initializes
const originalInitializeMonetization = initializeMonetization;
initializeMonetization = async function() {
    await originalInitializeMonetization.apply(this, arguments);
    syncLocalUsageData();
};

// Add CSS for premium lock immediately
addPremiumLockStyles();

// Add to monetization.js to ensure button appears in the menu
function addUpgradeButtonToMenu() {
    const menuBody = document.querySelector('#menuModal .menu-body');
    if (!menuBody || document.getElementById('upgradeToPremiumBtn')) return;

    const upgradeWrapper = document.createElement('div');
    upgradeWrapper.className = 'menu-install-section'; // Reuse existing border/padding styles
    
    const upgradeBtn = document.createElement('button');
    upgradeBtn.id = 'upgradeToPremiumBtn';
    upgradeBtn.className = 'btn-primary';
    upgradeBtn.innerHTML = `✨ Upgrade to Premium`;
    upgradeBtn.style.background = 'linear-gradient(45deg, #2D5A3D, #1e4620)';
    upgradeBtn.onclick = () => {
        window.monetization.showUpgradeModal();
        // Close menu
        document.getElementById('menuModal').classList.add('hidden');
    };

    const statusDisplay = document.createElement('div');
    statusDisplay.id = 'premiumStatusDisplay';
    statusDisplay.className = 'menu-premium-status hidden';
    statusDisplay.innerHTML = `<span class="premium-icon">⭐</span> Premium Member`;

    upgradeWrapper.appendChild(upgradeBtn);
    upgradeWrapper.appendChild(statusDisplay);
    
    // Insert before the logout button
    const logoutBtn = menuBody.querySelector('#logoutBtn');
    if (logoutBtn) {
        menuBody.insertBefore(upgradeWrapper, logoutBtn);
    } else {
        menuBody.appendChild(upgradeWrapper);
    }
}

// Call this inside your initialization
const originalInit = window.monetization.initialize;
window.monetization.initialize = async function() {
    await originalInit();
    addUpgradeButtonToMenu();
    updateUIForTier();
};

// Global click interceptor during initialization
(function() {
    // Global click interceptor during initialization
    document.addEventListener('click', function globalClickInterceptor(e) {
        const createRecipeBtn = e.target.closest('#createNewRecipeBtn');
        if (!createRecipeBtn) return;
        
        // If button has loading class, block clicks
        if (createRecipeBtn.classList.contains('button-loading')) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
        }
        
        // If button is disabled for free tier, show upgrade modal
        if (createRecipeBtn.classList.contains('button-disabled-limit') || 
            createRecipeBtn.disabled) {
            e.preventDefault();
            e.stopPropagation();
            showUpgradeModal('main_recipes');
            return false;
        }
    }, true); // Use capturing phase to intercept before other handlers
})();

// Add to monetization.js - Enhanced button state manager
class ButtonStateManager {
    constructor() {
        this.buttons = new Map();
        this.originalStates = new Map();
    }
    
    registerButton(button, config) {
        if (!button) return;
        
        const buttonId = button.id || button.getAttribute('data-role');
        this.buttons.set(buttonId, {
            element: button,
            config,
            originalState: {
                onclick: button.onclick,
                text: button.innerHTML,
                className: button.className,
                style: button.getAttribute('style'),
                disabled: button.disabled
            }
        });
        
        return buttonId;
    }
    
    updateButton(buttonId, state) {
        const buttonData = this.buttons.get(buttonId);
        if (!buttonData) return;
        
        const { element, config } = buttonData;
        const { isDisabled, count, isPremium } = state;
        
        if (isDisabled) {
            this.disableButton(element, config, count);
        } else {
            this.enableButton(element, config, count, isPremium);
        }
    }
    
    disableButton(button, config, count = 0) {
        // Apply standard disabled styles
        button.disabled = true;
        button.classList.add('feature-disabled');
        Object.entries(BUTTON_CONFIG.DISABLED_STYLE).forEach(([prop, value]) => {
            button.style[prop] = value;
        });
        
        // Update content
        const icon = config.icon || '';
        const text = config.text || button.textContent;
        const countDisplay = count > 0 ? ` (${count})` : '';
        
        button.innerHTML = `
            <span class="button-content">
                <span class="button-icon">${icon}</span>
                <span class="button-text">${text}</span>
                <span class="button-count">${countDisplay}</span>
            </span>
        `;
        
        // Set tooltip
        button.title = count <= 0 
            ? BUTTON_CONFIG.TOOLTIPS.LIMIT_REACHED
            : BUTTON_CONFIG.TOOLTIPS.REMAINING(count, config.featureName);
            
        // Set click handler
        button.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            showUpgradeModal(config.featureType);
            return false;
        };
    }
    
    enableButton(button, config, count, isPremium = false) {
        button.disabled = false;
        button.classList.remove('feature-disabled');
        Object.entries(BUTTON_CONFIG.ENABLED_STYLE).forEach(([prop, value]) => {
            button.style[prop] = value;
        });
        
        // Restore original content or update
        const originalState = this.originalStates.get(button);
        if (originalState && !isPremium) {
            button.innerHTML = originalState.text;
            button.onclick = originalState.onclick;
        } else {
            const icon = config.icon || '';
            const text = config.text || button.textContent;
            const countDisplay = isPremium ? '' : ` (${count})`;
            
            button.innerHTML = `
                <span class="button-content">
                    <span class="button-icon">${icon}</span>
                    <span class="button-text">${text}</span>
                    <span class="button-count">${countDisplay}</span>
                </span>
            `;
            
            button.title = isPremium 
                ? BUTTON_CONFIG.TOOLTIPS.UNLIMITED
                : BUTTON_CONFIG.TOOLTIPS.REMAINING(count, config.featureName);
        }
    }
}

// Initialize button state manager
const buttonManager = new ButtonStateManager();

// Register buttons when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Register core feature buttons
    buttonManager.registerButton(
        document.querySelector('[data-role="add-raw-material"]'),
        {
            featureType: 'raw_materials',
            featureName: 'Raw materials',
            icon: '+',
            text: 'Add Raw Material'
        }
    );
    
    buttonManager.registerButton(
        document.querySelector('[data-role="add-direct-labor"]'),
        {
            featureType: 'direct_labor',
            featureName: 'Direct labor',
            icon: '+',
            text: 'Add Direct Labor'
        }
    );
    
    buttonManager.registerButton(
        document.getElementById('createNewRecipeBtn'),
        {
            featureType: 'main_recipes',
            featureName: 'Main recipes',
            icon: '🍳',
            text: 'Create New Recipe'
        }
    );
});

// =============================================================================
// PREMIUM UI MANAGEMENT
// =============================================================================

function updatePremiumUI() {
    // Update upgrade button in menu
    const upgradeBtn = document.getElementById('upgradeToPremiumBtn');
    if (upgradeBtn) {
        if (userSubscription.isPremium) {
            upgradeBtn.style.display = 'none';
            upgradeBtn.disabled = true;
        } else {
            upgradeBtn.style.display = 'block';
            upgradeBtn.disabled = false;
        }
    }
    
    // Add or update cancel subscription button
    const menuBody = document.querySelector('#menuModal .menu-body');
    if (menuBody) {
        let cancelBtn = menuBody.querySelector('#cancelPremiumBtn');
        
        if (userSubscription.isPremium) {
            // Create cancel button if it doesn't exist
            if (!cancelBtn) {
                cancelBtn = document.createElement('button');
                cancelBtn.id = 'cancelPremiumBtn';
                cancelBtn.className = 'btn-secondary menu-btn';
                cancelBtn.style.marginTop = 'var(--space-sm)';
                cancelBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18"></path>
                        <path d="M6 6l12 12"></path>
                    </svg>
                    <span>Cancel Premium</span>
                `;
                cancelBtn.onclick = async () => {
                    if (confirm('Are you sure you want to cancel your premium subscription? You will lose access to premium features at the end of your billing period.')) {
                        try {
                            await window.paddleIntegration.cancelSubscription();
                        } catch (error) {
                            console.error('Cancel failed:', error);
                        }
                    }
                };
                
                // Insert after premium status display
                const premiumStatus = menuBody.querySelector('#premiumStatusDisplay');
                if (premiumStatus) {
                    premiumStatus.parentNode.insertBefore(cancelBtn, premiumStatus.nextSibling);
                } else {
                    menuBody.insertBefore(cancelBtn, menuBody.firstChild);
                }
            }
            cancelBtn.style.display = 'block';
        } else if (cancelBtn) {
            cancelBtn.style.display = 'none';
        }
        
        // Update premium status display
        const premiumStatus = document.getElementById('premiumStatusDisplay');
        if (premiumStatus) {
            if (userSubscription.isPremium) {
                premiumStatus.classList.remove('hidden');
                
                // Update expiry date
                const expiryElement = document.getElementById('premiumExpiryDate');
                if (expiryElement && userSubscription.currentPeriodEnd) {
                    const date = new Date(userSubscription.currentPeriodEnd);
                    expiryElement.textContent = `Expires: ${date.toLocaleDateString()}`;
                }
            } else {
                premiumStatus.classList.add('hidden');
            }
        }
    }
}

// =============================================================================
// ENHANCED TIER MANAGEMENT
// =============================================================================

function setPremiumTier(planType, periodEnd) {
    userSubscription = {
        isPremium: true,
        planType: planType,
        status: 'active',
        currentPeriodEnd: periodEnd,
        remainingTime: calculateRemainingTime(periodEnd)
    };
    
    // Restore all premium functionality
    restorePremiumFunctionality();
    updateCountDisplays();
    updateFeatureAvailability();
    updatePremiumUI();
    
    // Trigger premium activated event
    document.dispatchEvent(new CustomEvent('premiumActivated', {
        detail: { planType: planType, periodEnd: periodEnd }
    }));
    
    console.log('🎉 User upgraded to Premium:', planType);
}

function setFreeTier() {
    userSubscription = {
        isPremium: false,
        planType: 'free',
        status: 'active',
        currentPeriodEnd: null,
        remainingTime: null
    };
    
    // Apply restrictions for free tier
    blockAllSubRecipeAccess();
    updateCountDisplays();
    updateFeatureAvailability();
    updatePremiumUI();
    
    console.log('⬇️ User downgraded to Free tier');
}

// =============================================================================
// COMPLETE BUTTON STATE SYNC
// =============================================================================

function syncAllButtonStates() {
    // Update all feature buttons
    updateFeatureAvailability();
    updateCountDisplays();
    updatePremiumUI();
    
    // Enable all locked features if premium
    if (userSubscription.isPremium) {
        // Enable serving scale
        const servingScale = document.getElementById('servingScale');
        if (servingScale) {
            servingScale.disabled = false;
            servingScale.style.opacity = '1';
            servingScale.style.cursor = 'auto';
            servingScale.parentElement?.classList.remove('feature-disabled');
            servingScale.title = 'Scale servings for analysis';
        }
        
        // Enable print
        const printBtn = document.getElementById('printBtn');
        if (printBtn) {
            printBtn.disabled = false;
            printBtn.style.opacity = '1';
            printBtn.style.cursor = 'pointer';
            printBtn.classList.remove('feature-disabled');
            printBtn.onclick = function() {
                if (window.generatePrintPreview) {
                    window.generatePrintPreview();
                }
            };
        }
        
        // Enable CSV export
        const exportCsvBtn = document.getElementById('exportCsvBtn');
        if (exportCsvBtn) {
            exportCsvBtn.disabled = false;
            exportCsvBtn.style.opacity = '1';
            exportCsvBtn.style.cursor = 'pointer';
            exportCsvBtn.classList.remove('feature-disabled');
            exportCsvBtn.onclick = function() {
                if (window.exportToCSV) {
                    window.exportToCSV();
                }
            };
        }
        
        // Enable all sub-recipe functionality
        restorePremiumFunctionality();
    }
    
    console.log('🔄 All button states synced');
}

// =============================================================================
// ENHANCED EVENT LISTENERS
// =============================================================================

function setupEventListeners() {
    // Listen for premium subscription activation
    document.addEventListener('premiumActivated', function(e) {
        console.log('🎉 Premium activated! Syncing all features...');
        syncAllButtonStates();
        
        // Show success notification
        if (window.showNotification) {
            window.showNotification('Premium features unlocked!', 'success');
        }
    });
    
    // Listen for tier changes
    document.addEventListener('userTierChanged', function(e) {
        console.log('🔄 User tier changed, updating UI...');
        syncAllButtonStates();
    });
    
    // Update menu button click handler
    const menuBtn = document.getElementById('settingsMenuButton');
    if (menuBtn) {
        menuBtn.addEventListener('click', function() {
            // Ensure UI is synced before showing menu
            setTimeout(syncAllButtonStates, 100);
        });
    }
    
    // Intercept sub-recipe button clicks globally
    document.addEventListener('click', function(e) {
        const subRecipeBtn = e.target.closest('#saveSubRecipeBtn, [data-role="open-save-subrecipe"], #saveSubRecipeConfirmBtn');
        if (subRecipeBtn && !userSubscription.isPremium) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            showUpgradeModal('sub_recipes');
            return false;
        }
        
        // Intercept add button clicks for free tier users
        if (!userSubscription.isPremium) {
            const rawMaterialBtn = e.target.closest('[data-role="add-raw-material"]');
            if (rawMaterialBtn) {
                if (!canAddRawMaterial()) {
                    e.preventDefault();
                    e.stopPropagation();
                    showUpgradeModal('raw_materials');
                    return false;
                }
            }
            
            const directLaborBtn = e.target.closest('[data-role="add-direct-labor"]');
            if (directLaborBtn) {
                if (!canAddDirectLabor()) {
                    e.preventDefault();
                    e.stopPropagation();
                    showUpgradeModal('direct_labor');
                    return false;
                }
            }
            
            const createRecipeBtn = e.target.closest('#createNewRecipeBtn');
            if (createRecipeBtn) {
                if (!canAddMainRecipe()) {
                    e.preventDefault();
                    e.stopPropagation();
                    showUpgradeModal('main_recipes');
                    return false;
                }
            }
        }
    }, true);
}

// =============================================================================
// ENHANCED UPDATE FUNCTION FOR PUBLIC API
// =============================================================================

// Add to the existing window.monetization object
window.monetization = {
    ...window.monetization, // Keep existing functions
    
    // Enhanced functions
    syncAllButtonStates,
    updatePremiumUI,
    
    // Enhanced tier change functions
    setPremiumTier: function(planType, periodEnd) {
        setPremiumTier(planType, periodEnd);
        document.dispatchEvent(new CustomEvent('userTierChanged', {
            detail: { isPremium: true }
        }));
    },
    
    setFreeTier: function() {
        setFreeTier();
        document.dispatchEvent(new CustomEvent('userTierChanged', {
            detail: { isPremium: false }
        }));
    },
    
    // Initialize premium UI
    initializePremiumUI: function() {
        addUpgradeButtonToMenu();
        updatePremiumUI();
        syncAllButtonStates();
    }
};

// Call this during initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize monetization
    initializeMonetization();
    
    // Initialize premium UI after a delay
    setTimeout(() => {
        if (window.monetization && window.monetization.initializePremiumUI) {
            window.monetization.initializePremiumUI();
        }
    }, 1500);
});