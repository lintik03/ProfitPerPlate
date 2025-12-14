// paddle-integration.js - Paddle Payment Processing for ProfitPerPlate

// =============================================================================
// CONFIGURATION
// =============================================================================

const PADDLE_CONFIG = {
    VENDOR_ID: 43075, // Your Seller ID
    ENVIRONMENT: detectPaddleEnvironment(),
    PRICE_IDS: {
        PREMIUM_MONTHLY: 'pri_01kc6gvcaep3y5q6d5g8e6ta7h',
        PREMIUM_YEARLY: 'pri_01kc6h9766m9f0s0s50qg8rt1c'
    }
};

function detectPaddleEnvironment() {
    const hostname = window.location.hostname;
    
    if (hostname === 'profitperplate.com') {
        console.log('🚀 Paddle environment: PRODUCTION');
        return 'production';
    } else if (hostname === 'profitperplate.pages.dev' || hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
        console.log('🧪 Paddle environment: SANDBOX');
        return 'sandbox';
    } else {
        console.log('⚠️ Paddle environment: Defaulting to SANDBOX');
        return 'sandbox';
    }
}

// =============================================================================
// PADDLE INITIALIZATION
// =============================================================================

let paddleInstance = null;

async function initializePaddle() {
    if (paddleInstance) return paddleInstance;
    
    console.log('🛶 Initializing Paddle in', PADDLE_CONFIG.ENVIRONMENT, 'mode...');
    
    try {
        // Load Paddle.js SDK
        await loadPaddleSDK();
        
        // Initialize Paddle
        Paddle.Environment.set(PADDLE_CONFIG.ENVIRONMENT);
        paddleInstance = await Paddle.Initialize({
            vendor: PADDLE_CONFIG.VENDOR_ID,
            eventCallback: handlePaddleEvent,
            checkout: {
                settings: {
                    displayMode: 'overlay',
                    theme: 'light',
                    frameTarget: 'checkout-container',
                    frameInitialHeight: 450,
                    frameStyle: 'width:100%; min-width:312px; background-color: transparent; border: none;'
                }
            }
        });
        
        console.log('✅ Paddle initialized successfully in', PADDLE_CONFIG.ENVIRONMENT, 'mode');
        return paddleInstance;
    } catch (error) {
        console.error('❌ Failed to initialize Paddle:', error);
        showManualCheckoutOption();
        throw error;
    }
}

function loadPaddleSDK() {
    return new Promise((resolve, reject) => {
        if (window.Paddle) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// =============================================================================
// CHECKOUT FLOW
// =============================================================================

async function startPaddleCheckout(planType) {
    try {
        const paddle = await initializePaddle();
        const currentUser = window.supabaseClient?.getCurrentUser();
        
        if (!currentUser) {
            alert('Please login to upgrade to Premium');
            window.showAuthModal?.();
            return;
        }
        
        const priceId = planType === 'monthly' 
            ? PADDLE_CONFIG.PRICE_IDS.PREMIUM_MONTHLY
            : PADDLE_CONFIG.PRICE_IDS.PREMIUM_YEARLY;
        
        // Open Paddle checkout
        const checkout = await Paddle.Checkout.open({
            items: [{
                priceId: priceId,
                quantity: 1
            }],
            customer: {
                email: currentUser.email,
            },
            customData: {
                userId: currentUser.id,
                planType: planType
            },
            settings: {
                successUrl: `${window.location.origin}/success`,
                displayMode: 'overlay',
                theme: 'light',
                frameTarget: 'checkout-container',
                frameInitialHeight: 450,
                frameStyle: 'width:100%; min-width:312px; background-color: transparent; border: none;'
            }
        });
        
        console.log('🛒 Paddle checkout opened:', checkout);
        return checkout;
    } catch (error) {
        console.error('❌ Paddle checkout failed:', error);
        showErrorModal('Checkout failed. Please try again or use manual checkout option.');
        throw error;
    }
}

// =============================================================================
// SUBSCRIPTION MANAGEMENT
// =============================================================================

async function cancelSubscription() {
    try {
        const paddle = await initializePaddle();
        const currentUser = window.supabaseClient?.getCurrentUser();
        
        if (!currentUser) {
            throw new Error('User must be logged in');
        }
        
        // Get user's subscription ID from database
        const { data: subscription } = await window.supabaseClient.supabase
            .from('user_subscriptions')
            .select('paddle_subscription_id')
            .eq('user_id', currentUser.id)
            .single();
        
        if (!subscription?.paddle_subscription_id) {
            throw new Error('No active subscription found');
        }
        
        // Open customer portal for cancellation
        await Paddle.Settings.open({
            displayMode: 'overlay',
            frameTarget: 'checkout-container',
            frameInitialHeight: 600
        });
        
        return { success: true };
    } catch (error) {
        console.error('❌ Cancel subscription failed:', error);
        showErrorModal('Unable to cancel subscription. Please contact support.');
        throw error;
    }
}

async function openCustomerPortal() {
    try {
        const paddle = await initializePaddle();
        await Paddle.Settings.open({
            displayMode: 'overlay',
            frameTarget: 'checkout-container',
            frameInitialHeight: 600
        });
    } catch (error) {
        console.error('❌ Open customer portal failed:', error);
        showErrorModal('Unable to open customer portal. Please try again later.');
    }
}

// =============================================================================
// EVENT HANDLING
// =============================================================================

function handlePaddleEvent(event) {
    console.log('🛶 Paddle Event:', event);
    
    switch (event.name) {
        case 'checkout.completed':
            handleCheckoutCompleted(event.data);
            break;
            
        case 'checkout.loaded':
            console.log('Checkout loaded');
            break;
            
        case 'checkout.close':
            console.log('Checkout closed');
            break;
            
        case 'checkout.error':
            handleCheckoutError(event.data);
            break;
            
        case 'checkout.payment.completed':
            handlePaymentCompleted(event.data);
            break;
            
        case 'subscription.created':
            handleSubscriptionCreated(event.data);
            break;
            
        case 'subscription.updated':
            handleSubscriptionUpdated(event.data);
            break;
            
        case 'subscription.canceled':
            handleSubscriptionCanceled(event.data);
            break;
            
        case 'customer.updated':
            console.log('Customer updated:', event.data);
            break;
    }
}

async function handleCheckoutCompleted(checkoutData) {
    console.log('✅ Checkout completed:', checkoutData);
    
    try {
        const { order, customer, custom_data } = checkoutData;
        
        // Update subscription in our database
        await updateSubscriptionInDatabase({
            userId: custom_data?.userId,
            orderId: order.id,
            customerId: customer.id,
            planType: custom_data?.planType,
            status: 'active'
        });
        
        // Update local state
        if (window.monetization) {
            const periodEnd = calculatePeriodEnd(custom_data?.planType);
            window.monetization.setPremiumTier(custom_data?.planType, periodEnd);
            window.monetization.updateUIForTier();
            
            // Trigger premium activated event
            document.dispatchEvent(new CustomEvent('premiumActivated', {
                detail: { planType: custom_data?.planType, periodEnd }
            }));
        }
        
        // Show success message
        showSuccessModal('🎉 Welcome to Premium! Your subscription is now active.');
        
        // Close upgrade modal
        window.monetization?.closeUpgradeModal();
        
    } catch (error) {
        console.error('❌ Error processing checkout completion:', error);
        showErrorModal('Error processing your subscription. Please contact support.');
    }
}

async function handlePaymentCompleted(paymentData) {
    console.log('💳 Payment completed:', paymentData);
}

async function handleSubscriptionCreated(subscriptionData) {
    console.log('📝 Subscription created:', subscriptionData);
    await updateSubscriptionFromWebhook(subscriptionData);
}

async function handleSubscriptionUpdated(subscriptionData) {
    console.log('🔄 Subscription updated:', subscriptionData);
    await updateSubscriptionFromWebhook(subscriptionData);
}

async function handleSubscriptionCanceled(subscriptionData) {
    console.log('❌ Subscription canceled:', subscriptionData);
    await updateSubscriptionFromWebhook(subscriptionData);
    
    // Update UI to show free tier
    if (window.monetization) {
        window.monetization.setFreeTier();
        window.monetization.updateUIForTier();
        
        // Show cancellation confirmation
        showSuccessModal('Your subscription has been canceled. Premium features will remain active until the end of your billing period.');
    }
}

function handleCheckoutError(errorData) {
    console.error('❌ Checkout error:', errorData);
    showErrorModal('Checkout failed. Please try again or use manual checkout option.');
}

// =============================================================================
// DATABASE INTEGRATION
// =============================================================================

async function updateSubscriptionInDatabase(subscriptionData) {
    try {
        const { userId, planType, orderId, customerId, status } = subscriptionData;
        
        if (!window.supabaseClient?.supabase) {
            throw new Error('Supabase not available');
        }
        
        const periodEnd = calculatePeriodEnd(planType);
        
        const { data, error } = await window.supabaseClient.supabase
            .from('user_subscriptions')
            .upsert({
                user_id: userId,
                plan_type: planType,
                subscription_status: status,
                paddle_subscription_id: orderId,
                paddle_customer_id: customerId,
                current_period_start: new Date().toISOString(),
                current_period_end: periodEnd,
                updated_at: new Date().toISOString()
            });
            
        if (error) throw error;
        
        console.log('✅ Subscription updated in database');
        return data;
    } catch (error) {
        console.error('❌ Error updating subscription in database:', error);
        throw error;
    }
}

async function updateSubscriptionFromWebhook(webhookData) {
    try {
        const currentUser = window.supabaseClient?.getCurrentUser();
        if (!currentUser) return;
        
        const { data, error } = await window.supabaseClient.supabase
            .from('user_subscriptions')
            .update({
                subscription_status: webhookData.status,
                current_period_end: webhookData.next_billed_at,
                updated_at: new Date().toISOString()
            })
            .eq('paddle_subscription_id', webhookData.id)
            .eq('user_id', currentUser.id);
            
        if (error) throw error;
        
        console.log('✅ Subscription updated from webhook');
    } catch (error) {
        console.error('❌ Error updating subscription from webhook:', error);
    }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function calculatePeriodEnd(planType) {
    const now = new Date();
    const periodEnd = new Date(now);
    
    if (planType === 'monthly') {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else if (planType === 'yearly') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }
    
    return periodEnd.toISOString();
}

function showSuccessModal(message) {
    const modalHTML = `
        <div class="modal" style="display: flex; z-index: 100000;">
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h3>Success!</h3>
                    <button class="close-btn" onclick="this.closest('.modal').style.display='none'">×</button>
                </div>
                <div class="modal-body" style="text-align: center; padding: var(--space-xl);">
                    <div style="font-size: 48px; margin-bottom: var(--space-md);">🎉</div>
                    <p>${message}</p>
                    <button class="btn-primary" onclick="this.closest('.modal').style.display='none'" 
                            style="margin-top: var(--space-lg);">
                        Continue
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function showErrorModal(message) {
    const modalHTML = `
        <div class="modal" style="display: flex; z-index: 100000;">
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h3 style="color: var(--danger);">Error</h3>
                    <button class="close-btn" onclick="this.closest('.modal').style.display='none'">×</button>
                </div>
                <div class="modal-body" style="text-align: center; padding: var(--space-xl);">
                    <div style="font-size: 48px; margin-bottom: var(--space-md);">❌</div>
                    <p>${message}</p>
                    <button class="btn-secondary" onclick="this.closest('.modal').style.display='none'" 
                            style="margin-top: var(--space-lg);">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function showManualCheckoutOption() {
    const upgradeModal = document.getElementById('upgradeModal');
    if (!upgradeModal) return;
    
    const manualCheckoutHTML = `
        <div style="margin-top: var(--space-lg); padding: var(--space-md); background: var(--bg-secondary); border-radius: var(--radius-md);">
            <h4 style="margin-bottom: var(--space-sm);">Manual Checkout</h4>
            <p style="margin-bottom: var(--space-sm); font-size: 14px; color: var(--text-secondary);">
                If the checkout doesn't load, you can upgrade directly through Paddle:
            </p>
            <div style="display: flex; flex-direction: column; gap: var(--space-sm);">
                <a href="https://buy.paddle.com/checkout/custom/${PADDLE_CONFIG.PRICE_IDS.PREMIUM_MONTHLY}" 
                   target="_blank" 
                   class="btn-secondary" 
                   style="text-align: center; text-decoration: none;">
                    Monthly ($2.49)
                </a>
                <a href="https://buy.paddle.com/checkout/custom/${PADDLE_CONFIG.PRICE_IDS.PREMIUM_YEARLY}" 
                   target="_blank" 
                   class="btn-primary" 
                   style="text-align: center; text-decoration: none;">
                    Yearly ($24.99) - Save 2 Months
                </a>
            </div>
        </div>
    `;
    
    const modalBody = upgradeModal.querySelector('.modal-body');
    if (modalBody) {
        modalBody.insertAdjacentHTML('beforeend', manualCheckoutHTML);
    }
}

// =============================================================================
// PUBLIC API
// =============================================================================

window.paddleIntegration = {
    // Initialization
    initialize: initializePaddle,
    
    // Checkout
    startCheckout: startPaddleCheckout,
    
    // Subscription Management
    cancelSubscription,
    openCustomerPortal,
    
    // Events
    handlePaddleEvent,
    
    // Utility
    showSuccessModal,
    showErrorModal,
    showManualCheckoutOption,
    
    // Configuration
    getConfig: () => ({ ...PADDLE_CONFIG }),
    
    // Manual checkout URLs
    getCheckoutUrls: () => ({
        monthly: `https://buy.paddle.com/checkout/custom/${PADDLE_CONFIG.PRICE_IDS.PREMIUM_MONTHLY}`,
        yearly: `https://buy.paddle.com/checkout/custom/${PADDLE_CONFIG.PRICE_IDS.PREMIUM_YEARLY}`
    })
};

// Make the checkout function globally accessible
window.startPaddleCheckout = startPaddleCheckout;
window.cancelPaddleSubscription = cancelSubscription;

// =============================================================================
// AUTO-INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🛶 Paddle integration loading...');
    
    // Initialize Paddle when monetization is ready
    setTimeout(async () => {
        try {
            await initializePaddle();
            console.log('🛶 Paddle ready for checkout');
        } catch (error) {
            console.warn('⚠️ Paddle initialization failed, checkout may not work:', error);
        }
    }, 2000);
});

console.log('🛶 Paddle integration module loaded');