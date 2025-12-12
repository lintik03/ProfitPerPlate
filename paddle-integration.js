// paddle-integration.js - Paddle Payment Processing for ProfitPerPlate

// =============================================================================
// CONFIGURATION
// =============================================================================

const PADDLE_CONFIG = {
    SELLER_ID: 43075, // Replace with your Paddle Seller ID
    ENVIRONMENT: 'sandbox', // 'sandbox' or 'production'
    PRICE_IDS: {
        PREMIUM_MONTHLY: 'pri_01kc6gvcaep3y5q6d5g8e6ta7h', // Replace with your price IDs
        PREMIUM_YEARLY: 'pri_01kc6h9766m9f0s0s50qg8rt1c'
    }
};

// =============================================================================
// PADDLE INITIALIZATION
// =============================================================================

let paddleInstance = null;

async function initializePaddle() {
    if (paddleInstance) return paddleInstance;
    
    console.log('🛶 Initializing Paddle...');
    
    try {
        // Load Paddle.js SDK
        await loadPaddleSDK();
        
        // Initialize Paddle
        Paddle.Environment.set(PADDLE_CONFIG.ENVIRONMENT);
        paddleInstance = await Paddle.Initialize({
            seller: PADDLE_CONFIG.SELLER_ID,
            eventCallback: handlePaddleEvent
        });
        
        console.log('✅ Paddle initialized successfully');
        return paddleInstance;
    } catch (error) {
        console.error('❌ Failed to initialize Paddle:', error);
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
            throw new Error('User must be logged in to upgrade');
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
                // You can add more customer info here
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
        showErrorModal('Checkout failed. Please try again.');
        throw error;
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
    // You might want to update UI or send notifications here
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
    }
}

function handleCheckoutError(errorData) {
    console.error('❌ Checkout error:', errorData);
    showErrorModal('Checkout failed. Please try again or contact support.');
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
        // This would be called from a webhook handler
        // For now, we'll update directly if user is logged in
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
    
    if (planType === 'premium_monthly') {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else if (planType === 'premium_yearly') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }
    
    return periodEnd.toISOString();
}

function showSuccessModal(message) {
    // Create or show success modal
    const modalHTML = `
        <div class="modal" style="display: flex;">
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
    // Create or show error modal
    const modalHTML = `
        <div class="modal" style="display: flex;">
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

// =============================================================================
// WEBHOOK HANDLING (SERVER-SIDE)
// =============================================================================

// This would typically be in a serverless function or backend endpoint
// Here's an example of what the webhook handler might look like:

/*
// Example webhook endpoint (would be in a Supabase Edge Function or similar)
app.post('/api/webhooks/paddle', async (req, res) => {
    const paddlePublicKey = 'YOUR_PADDLE_PUBLIC_KEY';
    const signature = req.headers['paddle-signature'];
    
    try {
        // Verify webhook signature
        const isValid = Paddle.Webhook.verify(signature, req.body, paddlePublicKey);
        
        if (!isValid) {
            return res.status(400).json({ error: 'Invalid signature' });
        }
        
        const event = req.body;
        
        // Handle different event types
        switch (event.alert_name) {
            case 'subscription_created':
            case 'subscription_updated':
                await handleSubscriptionWebhook(event);
                break;
                
            case 'subscription_cancelled':
                await handleSubscriptionCancellation(event);
                break;
                
            case 'payment_succeeded':
                await handlePaymentSuccess(event);
                break;
                
            case 'payment_failed':
                await handlePaymentFailure(event);
                break;
        }
        
        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
*/

// =============================================================================
// PUBLIC API
// =============================================================================

window.paddleIntegration = {
    // Initialization
    initialize: initializePaddle,
    
    // Checkout
    startCheckout: startPaddleCheckout,
    
    // Events
    handlePaddleEvent,
    
    // Utility
    showSuccessModal,
    showErrorModal
};

// Make the checkout function globally accessible
window.startPaddleCheckout = startPaddleCheckout;

// =============================================================================
// AUTO-INITIALIZATION
// =============================================================================

// Initialize Paddle when monetization is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for monetization to initialize
    setTimeout(async () => {
        try {
            await initializePaddle();
            console.log('🛶 Paddle ready for checkout');
        } catch (error) {
            console.warn('⚠️ Paddle initialization failed, checkout will not work:', error);
        }
    }, 2000);
});

console.log('🛶 Paddle integration module loaded');