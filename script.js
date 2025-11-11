// Global State - Now using cloud storage
let userData = {
    rawMaterials: [],
    directLabor: [],
    recipes: [],
    currency: "₱",
    currentRecipeState: null
};

let editingItem = {
    type: null, // 'rawMaterial', 'directLabor', 'mainRecipe', 'subRecipe'
    id: null,
    data: null
};

// NEW: Track loaded recipe for summary
let loadedRecipeForSummary = null;

// Unit Conversion Factors (to base units)
const UNIT_CONVERSIONS = {
    // Weight (base unit: grams)
    kg: 1000,
    g: 1,
    mg: 0.001,
    lbs: 453.592,
    oz: 28.3495,

    // Volume (base unit: milliliters)
    L: 1000,
    ml: 1,
    cup: 236.588,
    tbsp: 14.7868,
    tsp: 4.92892,

    // Count (base unit: pieces)
    dozen: 12,
    pc: 1,

    // Time (base unit: minutes)
    hours: 60,
    minutes: 1
};

// Unit options by category
const categoryUnits = {
    weight: ["kg", "g", "mg", "lbs", "oz"],
    volume: ["L", "ml", "cup", "tbsp", "tsp"],
    count: ["dozen", "pc"],
    time: ["hours", "minutes"]
};

// Base units for each category
const baseUnits = {
    weight: "g",
    volume: "ml",
    count: "pc",
    time: "minutes"
};

// Field definitions for help modal with examples
const fieldDefinitions = {
    selectItem: {
        title: "Select Item",
        content: "Choose a raw material from your master list, a direct labor item, or a saved sub-recipe to add to the current recipe.",
        example: "Example: Select 'Beef Brisket' from raw materials or 'Kitchen Work' from direct labor to add to your burger recipe."
    },
    quantity: {
        title: "Quantity/Time",
        content: "The amount of the selected item needed for this recipe. For raw materials: quantity in units. For labor: time required in the selected unit.",
        example: "Example: For a burger recipe, you might use 0.15 kg of beef patty or 0.5 hours of kitchen work."
    },
    yield: {
        title: "Yield Percentage",
        content: "The usable percentage after preparation (e.g., peeling, trimming, cooking loss). 100% means all purchased quantity is usable. Not applicable to labor.",
        example: "Example: If you buy carrots but peel them, only 85% might be usable. For pre-cut vegetables, you might have 100% yield."
    },
    markup: {
        title: "Mark-up Percentage",
        content: "The profit percentage added to the cost price to determine the selling price before taxes.",
        example: "Example: If your burger costs ₱50 to make and you add 40% markup, the price before tax would be ₱70 (₱50 + 40%)."
    },
    tax: {
        title: "Regular Tax Percentage",
        content: "Local sales tax percentage applied to the selling price.",
        example: "Example: If your local sales tax is 8% and your burger sells for ₱70, the tax would be ₱5.60."
    },
    vat: {
        title: "VAT Percentage",
        content: "Value Added Tax percentage applied to the selling price.",
        example: "Example: If VAT is 12% and your burger sells for ₱70, the VAT would be ₱8.40."
    },
    servings: {
        title: "Servings",
        content: "The number of portions this recipe produces. Used to calculate cost per serving.",
        example: "Example: A large pot of soup that makes 8 bowls would have 8 servings. A cake cut into 12 slices would have 12 servings."
    },
    subRecipeName: {
        title: "Sub-Recipe Name",
        content: "A descriptive name for your sub-recipe (e.g., 'Mayonnaise', 'Tomato Sauce').",
        example: "Example: 'Secret Burger Sauce', 'House Marinade', or 'Signature Spice Blend'."
    },
    subRecipeCategory: {
        title: "Category of Measurement",
        content: "The type of output this sub-recipe produces: Weight (grams, kg), Volume (ml, L), or Count (pieces).",
        example: "Example: Sauces are usually Volume, spice blends are Weight, and pre-made items like meatballs could be Count."
    },
    subRecipeYieldQuantity: {
        title: "Total Yield per Batch",
        content: "The total amount this sub-recipe produces in one batch. Used to calculate cost per unit.",
        example: "Example: If your sauce recipe makes 500ml total, enter 500. If your spice blend makes 200g total, enter 200."
    },
    ingredientName: {
        title: "Raw Material Name",
        content: "The common name of the raw material (e.g., 'Beef Brisket', 'Olive Oil').",
        example: "Example: 'Ground Beef 80/20', 'Extra Virgin Olive Oil', 'Roma Tomatoes'."
    },
    ingredientCategory: {
        title: "Raw Material Category",
        content: "Classification: Weight (solid items), Volume (liquids), Count (individual items).",
        example: "Example: Flour = Weight, Milk = Volume, Eggs = Count."
    },
    purchasePrice: {
        title: "Purchase Price",
        content: "The total cost you paid for the purchased quantity of this raw material.",
        example: "Example: You paid ₱650 for 1kg of beef brisket, so enter 650."
    },
    purchaseQuantity: {
        title: "Purchase Quantity",
        content: "The amount you bought for the purchase price. Used to calculate cost per unit.",
        example: "Example: You bought 1kg of beef for ₱650, so enter 1. You bought 50 eggs for ₱500, so enter 50."
    },
    purchaseUnit: {
        title: "Purchase Unit",
        content: "The unit of measurement for the purchased quantity (e.g., kg, L, pieces).",
        example: "Example: For the 1kg beef package, select 'kg'. For the 50 eggs, select 'pc'. For 1L milk, select 'L'."
    },
    costPerUnit: {
        title: "Cost Per Unit",
        content: "The calculated cost for one unit of measurement. Automatically calculated from purchase details.",
        example: "Example: Total recipe cost ₱100 for 500ml yield = ₱0.20 per ml. If cost unit is L, then ₱200 per L (₱0.20/ml * 1000)."
    },
    laborName: {
        title: "Direct Labor Name",
        content: "A descriptive name for the labor task (e.g., 'Kitchen Work', 'Prep Chef', 'Line Cook').",
        example: "Example: 'Kitchen Work', 'Prep Chef', 'Line Cook', 'Dishwasher'."
    },
    shiftRate: {
        title: "Shift Rate",
        content: "The total cost for one complete shift of this labor type.",
        example: "Example: If a kitchen worker costs ₱200 per 8-hour shift, enter 200."
    },
    shiftDuration: {
        title: "Shift Duration",
        content: "The length of one shift in the selected time unit.",
        example: "Example: For an 8-hour shift, enter 8 and select 'hours'. For a 480-minute shift, enter 480 and select 'minutes'."
    },
    timeUnit: {
        title: "Time Unit",
        content: "The unit of measurement for the shift duration (hours or minutes).",
        example: "Example: Select 'hours' for shifts measured in hours, 'minutes' for shifts measured in minutes."
    },
    costUnit: {
        title: "Cost Unit",
        content: "The unit of measurement for displaying the cost per unit (hours or minutes).",
        example: "Example: Select 'hours' to see cost per hour, 'minutes' to see cost per minute."
    },
    // NEW: Batch scaling field definition
    batchScale: {
        title: "Batch Scaling Factor",
        content: "Multiply the entire recipe by this factor to calculate costs for multiple batches. Useful for production planning and bulk preparation.",
        example: "Example: Enter '4' to calculate costs for making 4 batches of this recipe. All ingredient quantities, labor time, and costs will be multiplied by 4."
    }
};

// DOM Elements
const recipeBody = document.getElementById("recipeBody");
const directLaborRecipeBody = document.getElementById("directLaborRecipeBody");
const rawMaterialsTotalEl = document.getElementById("rawMaterialsTotal");
const directLaborTotalEl = document.getElementById("directLaborTotal");
const grandTotalEl = document.getElementById("grandTotal");
const currencySelect = document.getElementById("currencySelect");
const recipeNameInput = document.getElementById("recipeName");
const resetBtn = document.getElementById("resetRecipe");
const saveMainRecipeBtn = document.getElementById("saveMainRecipeBtn");
const saveSubRecipeBtn = document.getElementById("saveSubRecipeBtn");

const summaryRawMaterialsCost = document.getElementById("summaryRawMaterialsCost");
const summaryDirectLaborCost = document.getElementById("summaryDirectLaborCost");
const summaryTotalCost = document.getElementById("summaryTotalCost");
const summaryCostServing = document.getElementById("summaryCostServing");
const summarySellingPrice = document.getElementById("summarySellingPrice");
const summaryFoodCost = document.getElementById("summaryFoodCost");
const summaryLaborCostPercent = document.getElementById("summaryLaborCostPercent");
const summaryTotalCostPercent = document.getElementById("summaryTotalCostPercent");
const summaryGrossProfit = document.getElementById("summaryGrossProfit");
const markupInput = document.getElementById("markup");
const taxInput = document.getElementById("tax");
const vatInput = document.getElementById("vat");
// MOVED: servingsInput is now in Recipe Calculator tab
const servingsInput = document.getElementById("servings");

// NEW: Batch scaling input
const batchScaleInput = document.getElementById("batchScale");

// NEW: Servings display element
const summaryServingsDisplay = document.getElementById("summaryServingsDisplay");

const helpBtn = document.getElementById("helpBtn");
const helpModal = document.getElementById("helpModal");
const helpModalTitle = document.getElementById("helpModalTitle");
const helpModalContent = document.getElementById("helpModalContent");
const closeHelpBtn = document.getElementById("closeHelp");
const printBtn = document.getElementById("printBtn");
const printPreviewModal = document.getElementById("printPreviewModal");
const printPreviewContent = document.getElementById("printPreviewContent");

// Unified Item Select Elements
const unifiedItemSelect = document.getElementById("unifiedItemSelect");
const addIngredientQty = document.getElementById("addIngredientQty");
const addIngredientYield = document.getElementById("addIngredientYield");
const addIngredientUnit = document.getElementById("addIngredientUnit");

// Direct Labor Select Elements
const directLaborSelect = document.getElementById("directLaborSelect");
const timeRequirement = document.getElementById("timeRequirement");
const timeRequirementUnit = document.getElementById("timeRequirementUnit");

// Sub-Recipe Save Modal Elements
const subRecipeSaveModal = document.getElementById("subRecipeSaveModal");
const subRecipeNameDisplay = document.getElementById("subRecipeNameDisplay");
const subRecipeCategory = document.getElementById("subRecipeCategory");
const subRecipeYieldQuantity = document.getElementById("subRecipeYieldQuantity");
const subRecipeYieldUnit = document.getElementById("subRecipeYieldUnit");
const subRecipeCostPerUnit = document.getElementById("subRecipeCostPerUnit");
const subRecipeCostUnit = document.getElementById("subRecipeCostUnit");
const currentRecipeCostDisplay = document.getElementById("currentRecipeCostDisplay");
const costPerOutputUnit = document.getElementById("costPerOutputUnit");

// Recipe list elements
const mainRecipesList = document.getElementById("mainRecipesList");
const subRecipesList = document.getElementById("subRecipesList");

// Edit prompt modal elements
const editPromptModal = document.getElementById("editPromptModal");
const editPromptTitle = document.getElementById("editPromptTitle");
const editPromptMessage = document.getElementById("editPromptMessage");

// NEW: Raw Material Edit Prompt Modal Elements
const rawMaterialEditPromptModal = document.getElementById("rawMaterialEditPromptModal");
const rawMaterialEditName = document.getElementById("rawMaterialEditName");

// NEW: Direct Labor Edit Prompt Modal Elements
const directLaborEditPromptModal = document.getElementById("directLaborEditPromptModal");
const directLaborEditName = document.getElementById("directLaborEditName");

// Auth Modal Elements
const authModal = document.getElementById("authModal");
const authModalTitle = document.getElementById("authModalTitle");
const authForm = document.getElementById("authForm");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const authError = document.getElementById("authError");
const authSwitchBtn = document.getElementById("authSwitchBtn");
const authSwitchText = document.getElementById("authSwitchText");

// NEW: Forgot Password Elements
const forgotPasswordModal = document.getElementById("forgotPasswordModal");
const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
const forgotPasswordEmail = document.getElementById("forgotPasswordEmail");
const forgotPasswordError = document.getElementById("forgotPasswordError");
const forgotPasswordSuccess = document.getElementById("forgotPasswordSuccess");
const sendResetEmailBtn = document.getElementById("sendResetEmailBtn");

// NEW: Password Toggle Element
const togglePassword = document.getElementById("togglePassword");

// Auth Button Elements
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const logoutBtn = document.getElementById("logoutBtn");

// NEW: Cost Breakdown Preview Elements
const rawMaterialsPreviewBody = document.getElementById("rawMaterialsPreviewBody");
const directLaborPreviewBody = document.getElementById("directLaborPreviewBody");
const rawMaterialsCount = document.getElementById("rawMaterialsCount");
const directLaborCount = document.getElementById("directLaborCount");
const rawMaterialsPreviewTotal = document.getElementById("rawMaterialsPreviewTotal");
const directLaborPreviewTotal = document.getElementById("directLaborPreviewTotal");
const rawMaterialsPreviewSubtotal = document.getElementById("rawMaterialsPreviewSubtotal");
const directLaborPreviewSubtotal = document.getElementById("directLaborPreviewSubtotal");

// NEW: Summary Recipe Loader Elements
const summaryRecipeSelect = document.getElementById("summaryRecipeSelect");
const loadedRecipeDisplay = document.getElementById("loadedRecipeDisplay");
const currentRecipeNameDisplay = document.getElementById("currentRecipeNameDisplay");
const loadedRecipeTotalCost = document.getElementById("loadedRecipeTotalCost");
const loadedRecipeServings = document.getElementById("loadedRecipeServings");
const loadedRecipeItemCount = document.getElementById("loadedRecipeItemCount");

// NEW: Batch Profit Analysis Elements
const summaryBatchRevenue = document.getElementById("summaryBatchRevenue");
const summaryBatchProfit = document.getElementById("summaryBatchProfit");
const summaryBatchProfitMargin = document.getElementById("summaryBatchProfitMargin");

// NEW: Sidebar Elements
const sidebarBtns = document.querySelectorAll(".sidebar-btn");
const mobileTabBtns = document.querySelectorAll(".mobile-tabs .tab-btn");

// Currency
let currency = "₱";

// Auth state
let isSignUpMode = false;

// Initialize Application
async function initApp() {
    // Load dark mode preference
    loadTheme();
    
    // Check auth state
    await window.supabaseClient.checkAuthState();
    
    setupEventListeners();
    renderAllData();
    recalc();
    populateUnifiedItemSelect();
    populateDirectLaborSelect();
    updateSubRecipeUnitOptions();
    
    // NEW: Populate summary recipe selector
    populateSummaryRecipeSelect();
    
    // Generate complete help content
    helpModalContent.innerHTML = generateCompleteHelpContent();
    
    // NEW: Clear cost breakdown preview initially
    clearCostBreakdownPreview();
}

// Render all data
function renderAllData() {
    renderRawMaterials();
    renderDirectLabor();
    renderRecipesList();
}

// Dark Mode Functions
function loadTheme() {
    const savedTheme = localStorage.getItem("profitPerPlate_theme");
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    document.body.classList.toggle('dark-mode', isDark);
    
    // Set initial dark mode icon
    const darkModeIcon = document.querySelector('#darkModeToggle svg');
    if (darkModeIcon) {
        if (isDark) {
            darkModeIcon.innerHTML = '<path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
        } else {
            darkModeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
        }
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem("profitPerPlate_theme", isDark ? 'dark' : 'light');
    
    // Update dark mode icon
    const darkModeIcon = document.querySelector('#darkModeToggle svg');
    if (isDark) {
        // Switch to sun icon for light mode
        darkModeIcon.innerHTML = '<path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
    } else {
        // Switch to moon icon for dark mode
        darkModeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
    }
}

// NEW: Password Toggle Function
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('authPassword');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Update icon
    const icon = togglePassword.querySelector('svg');
    if (type === 'text') {
        icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
    } else {
        icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
    }
}

// NEW: Forgot Password Functions
function openForgotPasswordModal() {
    closeAuthModal();
    forgotPasswordModal.classList.remove("hidden");
}

function closeForgotPasswordModal() {
    forgotPasswordModal.classList.add("hidden");
    forgotPasswordEmail.value = '';
    forgotPasswordError.classList.add("hidden");
    forgotPasswordSuccess.classList.add("hidden");
}

async function sendPasswordReset() {
    const email = forgotPasswordEmail.value.trim();
    
    if (!email) {
        showForgotPasswordError("Please enter your email address");
        return;
    }
    
    sendResetEmailBtn.disabled = true;
    sendResetEmailBtn.textContent = "Sending...";
    
    const result = await window.supabaseClient.resetPassword(email);
    
    sendResetEmailBtn.disabled = false;
    sendResetEmailBtn.textContent = "Send Reset Link";
    
    if (result.success) {
        forgotPasswordSuccess.textContent = "Password reset email sent! Check your inbox for further instructions.";
        forgotPasswordSuccess.classList.remove("hidden");
        forgotPasswordError.classList.add("hidden");
    } else {
        showForgotPasswordError(result.error);
    }
}

function showForgotPasswordError(message) {
    forgotPasswordError.textContent = message;
    forgotPasswordError.classList.remove("hidden");
    forgotPasswordSuccess.classList.add("hidden");
}

// Auth Functions
function openAuthModal() {
    authModal.classList.remove("hidden");
    updateAuthModal();
}

function closeAuthModal() {
    authModal.classList.add("hidden");
    authForm.reset();
    authError.classList.add("hidden");
}

function updateAuthModal() {
    if (isSignUpMode) {
        authModalTitle.textContent = "Sign Up for ProfitPerPlate";
        authSubmitBtn.textContent = "Sign Up";
        authSwitchText.textContent = "Already have an account? ";
        authSwitchBtn.textContent = "Login";
    } else {
        authModalTitle.textContent = "Login to ProfitPerPlate";
        authSubmitBtn.textContent = "Login";
        authSwitchText.textContent = "Don't have an account? ";
        authSwitchBtn.textContent = "Sign up";
    }
}

async function handleAuth() {
    const email = authEmail.value.trim();
    const password = authPassword.value;
    
    if (!email || !password) {
        showAuthError("Please enter both email and password");
        return;
    }
    
    if (password.length < 6) {
        showAuthError("Password must be at least 6 characters long");
        return;
    }
    
    authSubmitBtn.disabled = true;
    authSubmitBtn.textContent = isSignUpMode ? "Signing Up..." : "Logging In...";
    
    let result;
    if (isSignUpMode) {
        result = await window.supabaseClient.signUp(email, password);
    } else {
        result = await window.supabaseClient.signIn(email, password);
    }
    
    authSubmitBtn.disabled = false;
    authSubmitBtn.textContent = isSignUpMode ? "Sign Up" : "Login";
    
    if (result.success) {
        closeAuthModal();
        if (isSignUpMode) {
            alert("Account created successfully! Please check your email for verification.");
        }
    } else {
        showAuthError(result.error);
    }
}

function showAuthError(message) {
    authError.textContent = message;
    authError.classList.remove("hidden");
}

function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    updateAuthModal();
    authError.classList.add("hidden");
}

async function handleLogout() {
    const result = await window.supabaseClient.signOut();
    if (result.success) {
        alert("Logged out successfully");
    } else {
        alert("Error logging out: " + result.error);
    }
}

// Data saving and loading
async function saveUserData() {
    const result = await window.supabaseClient.saveUserData(userData);
    if (!result.success) {
        console.error("Failed to save data:", result.error);
    }
}

async function loadUserData() {
    const data = await window.supabaseClient.loadUserData();
    if (data) {
        userData = data;
        currency = userData.currency || "₱";
        currencySelect.value = currency;
        
        // Update UI
        renderAllData();
        populateUnifiedItemSelect();
        populateDirectLaborSelect();
        populateSummaryRecipeSelect();
        
        // Load current recipe state
        loadCurrentRecipeState();
        
        recalc();
        
        // NEW: Clear cost breakdown preview on load
        clearCostBreakdownPreview();
    }
}

// Auto-save current recipe state
function saveCurrentRecipeState() {
    // Get current recipe items
    const rawMaterialItems = [];
    const directLaborItems = [];
    
    recipeBody.querySelectorAll("tr").forEach(row => {
        const itemName = row.children[0].querySelector("input").value;
        const quantity = parseFloat(row.children[1].querySelector("input").value) || 0;
        const unit = row.children[1].querySelector(".quantity-unit")?.textContent || "g";
        const yieldPct = parseFloat(row.children[2].querySelector("input").value) || 100;
        const unitCost = parseFloat(row.children[3].querySelector("input").value) || 0;
        const type = row.dataset.type || 'rawMaterial';
        const subRecipeId = row.dataset.subRecipeId || null;
        
        if (type === 'rawMaterial' || type === 'sub-recipe') {
            rawMaterialItems.push({
                name: itemName,
                quantity: quantity,
                unit: unit,
                yield: yieldPct,
                unitCost: unitCost,
                type: type,
                subRecipeId: subRecipeId
            });
        }
    });
    
    directLaborRecipeBody.querySelectorAll("tr").forEach(row => {
        const laborName = row.children[0].querySelector("input").value;
        const timeRequired = parseFloat(row.children[1].querySelector("input").value) || 0;
        const timeUnit = row.children[1].querySelector(".quantity-unit")?.textContent || "hours";
        const rate = parseFloat(row.children[2].querySelector("input").value) || 0;
        
        directLaborItems.push({
            name: laborName,
            quantity: timeRequired,
            unit: timeUnit,
            rate: rate
        });
    });
    
    // Save current recipe state
    userData.currentRecipeState = {
        recipeName: recipeNameInput.value || "",
        rawMaterialItems: rawMaterialItems,
        directLaborItems: directLaborItems,
        markup: parseFloat(markupInput.value) || 40,
        tax: parseFloat(taxInput.value) || 0,
        vat: parseFloat(vatInput.value) || 0,
        servings: parseFloat(servingsInput.value) || 1
    };
    
    saveUserData();
}

// Load current recipe state
function loadCurrentRecipeState() {
    if (!userData.currentRecipeState) return;
    
    const state = userData.currentRecipeState;
    
    // Restore recipe name and summary inputs
    recipeNameInput.value = state.recipeName || "";
    markupInput.value = state.markup || 40;
    taxInput.value = state.tax || 0;
    vatInput.value = state.vat || 0;
    servingsInput.value = state.servings || 1;
    
    // Clear current recipe tables
    recipeBody.innerHTML = "";
    directLaborRecipeBody.innerHTML = "";
    
    // Restore raw material items
    if (state.rawMaterialItems) {
        state.rawMaterialItems.forEach(item => {
            addRow(
                item.name,
                item.quantity,
                item.unit,
                item.yield,
                item.unitCost,
                item.type || 'rawMaterial',
                item.subRecipeId || null
            );
        });
    }
    
    // Restore direct labor items
    if (state.directLaborItems) {
        state.directLaborItems.forEach(item => {
            const labor = userData.directLabor.find(l => l.name === item.name);
            if (labor) {
                addDirectLaborRow(
                    item.name,
                    item.quantity,
                    item.unit,
                    item.rate
                );
            }
        });
    }
}

function setupEventListeners() {
    // Dark Mode Toggle - UPDATED
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleTheme);
    }
    
    // NEW: Password Toggle
    togglePassword.addEventListener('click', togglePasswordVisibility);
    
    // NEW: Forgot Password
    forgotPasswordBtn.addEventListener('click', openForgotPasswordModal);
    sendResetEmailBtn.addEventListener('click', sendPasswordReset);
    
    // NEW: Sidebar Navigation
    sidebarBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.closest('.sidebar-btn').dataset.tab);
        });
    });
    
    // NEW: Mobile Tabs Navigation
    mobileTabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });

    // Currency Selector
    currencySelect.addEventListener("change", () => {
        currency = currencySelect.value;
        userData.currency = currency;
        document
            .querySelectorAll(".unit-currency")
            .forEach((e) => (e.textContent = currency));
        recalc();
        saveUserData();
        
        // NEW: Update cost breakdown preview if recipe is loaded
        if (loadedRecipeForSummary) {
            updateCostBreakdownPreview();
        }
    });

    // Recipe inputs
    [
        markupInput,
        taxInput,
        vatInput,
        servingsInput,
        recipeNameInput,
        // NEW: Batch scaling input
        batchScaleInput
    ].forEach((el) => {
        el.addEventListener("input", () => {
            recalc();
            saveCurrentRecipeState();
            
            // NEW: If a recipe is loaded for summary, update it too
            if (loadedRecipeForSummary) {
                updateLoadedRecipeSummary();
            }
        });
    });

    // Reset button - ENHANCED
    resetBtn.addEventListener("click", resetRecipe);

    // Save Recipe buttons
    saveMainRecipeBtn.addEventListener("click", () => {
        if (!recipeNameInput.value.trim()) {
            alert("Please enter a recipe name before saving");
            recipeNameInput.focus();
            return;
        }
        
        if (editingItem.type === 'mainRecipe' && editingItem.id) {
            showEditPrompt('mainRecipe', editingItem.id, recipeNameInput.value);
        } else {
            saveRecipe('main');
        }
    });
    saveSubRecipeBtn.addEventListener("click", openSubRecipeSaveModal);

    // Save Raw Material button
    document
        .getElementById("saveRawMaterialBtn")
        .addEventListener("click", saveRawMaterial);

    // Save Direct Labor button
    document
        .getElementById("saveDirectLaborBtn")
        .addEventListener("click", saveDirectLabor);

    // Help modal
    helpBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        helpModalTitle.textContent = "Complete Field Guide — ProfitPerPlate";
        helpModalContent.innerHTML = generateCompleteHelpContent();
        helpModal.classList.remove("hidden");
    });
    
    closeHelpBtn.addEventListener("click", closeHelpModal);
    helpModal.addEventListener("click", (e) => {
        if (e.target === helpModal) closeHelpModal();
    });

    // Print button
    printBtn.addEventListener("click", () => {
        generatePrintPreview();
        printPreviewModal.classList.remove("hidden");
    });

    // Close modal on background click
    document
        .getElementById("rawMaterialModal")
        .addEventListener("click", (e) => {
            if (e.target.id === "rawMaterialModal") {
                closeRawMaterialModal();
            }
        });

    document
        .getElementById("directLaborModal")
        .addEventListener("click", (e) => {
            if (e.target.id === "directLaborModal") {
                closeDirectLaborModal();
            }
        });

    document.getElementById("printPreviewModal").addEventListener("click", (e) => {
        if (e.target.id === "printPreviewModal") {
            closePrintPreview();
        }
    });

    document.getElementById("subRecipeSaveModal").addEventListener("click", (e) => {
        if (e.target.id === "subRecipeSaveModal") {
            closeSubRecipeSaveModal();
        }
    });
    
    document.getElementById("editPromptModal").addEventListener("click", (e) => {
        if (e.target.id === "editPromptModal") {
            closeEditPromptModal();
        }
    });
    
    // NEW: Raw Material Edit Prompt Modal
    document.getElementById("rawMaterialEditPromptModal").addEventListener("click", (e) => {
        if (e.target.id === "rawMaterialEditPromptModal") {
            closeRawMaterialEditPromptModal();
        }
    });
    
    // NEW: Direct Labor Edit Prompt Modal
    document.getElementById("directLaborEditPromptModal").addEventListener("click", (e) => {
        if (e.target.id === "directLaborEditPromptModal") {
            closeDirectLaborEditPromptModal();
        }
    });

    document.getElementById("authModal").addEventListener("click", (e) => {
        if (e.target.id === "authModal") {
            closeAuthModal();
        }
    });
    
    document.getElementById("forgotPasswordModal").addEventListener("click", (e) => {
        if (e.target.id === "forgotPasswordModal") {
            closeForgotPasswordModal();
        }
    });

    // Update unit display when item is selected in unified dropdown
    unifiedItemSelect.addEventListener("change", function () {
        const value = this.value;
        if (!value) {
            addIngredientUnit.textContent = "g";
            addIngredientYield.disabled = false;
            return;
        }

        const [type, id] = value.split('-');
        if (type === 'rawMaterial') {
            const rawMaterial = userData.rawMaterials.find(item => item.id === parseInt(id));
            if (rawMaterial) {
                addIngredientUnit.textContent = rawMaterial.costUnit;
                addIngredientYield.disabled = false;
            }
        } else if (type === 'subrecipe') {
            const subRecipe = userData.recipes.find(recipe => recipe.id === parseInt(id));
            if (subRecipe && subRecipe.type === 'sub') {
                addIngredientUnit.textContent = subRecipe.costUnit || subRecipe.outputUnit || 'batch';
                addIngredientYield.disabled = false;
            }
        }
    });

    // Update time requirement unit when direct labor item is selected
    directLaborSelect.addEventListener("change", function() {
        const value = this.value;
        if (!value) {
            timeRequirementUnit.textContent = "hours";
            return;
        }

        const labor = userData.directLabor.find(item => item.id === parseInt(value));
        if (labor) {
            timeRequirementUnit.textContent = labor.costUnit;
        }
    });

    // Update sub-recipe cost calculation when inputs change
    subRecipeYieldQuantity.addEventListener('input', updateSubRecipeCostDisplay);
    subRecipeYieldUnit.addEventListener('change', updateSubRecipeCostDisplay);
    subRecipeCostUnit.addEventListener('change', updateSubRecipeCostDisplay);
    subRecipeCategory.addEventListener('change', updateSubRecipeCostDisplay);

    // NEW: Cost breakdown collapsible sections
    document.querySelectorAll('.breakdown-header').forEach(header => {
        header.addEventListener('click', function() {
            const section = this.dataset.section;
            const content = document.getElementById(`${section}Preview`);
            const chevron = this.querySelector('span');
            
            if (content.style.display === 'none') {
                content.style.display = 'block';
                chevron.textContent = '▾';
                this.classList.remove('collapsed');
            } else {
                content.style.display = 'none';
                chevron.textContent = '▸';
                this.classList.add('collapsed');
            }
        });
    });

    // NEW: Initialize breakdown sections as expanded
    document.querySelectorAll('.breakdown-content').forEach(content => {
        content.style.display = 'block';
    });

    // Auth event listeners
    loginBtn.addEventListener("click", () => {
        openAuthModal();
    });
    signupBtn.addEventListener("click", () => {
        isSignUpMode = true;
        openAuthModal();
    });
    logoutBtn.addEventListener("click", handleLogout);
    authSubmitBtn.addEventListener("click", handleAuth);
    authSwitchBtn.addEventListener("click", toggleAuthMode);

    // Escape key handler
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (!helpModal.classList.contains("hidden")) {
                closeHelpModal();
            } else if (!document.getElementById("rawMaterialModal").classList.contains("hidden")) {
                closeRawMaterialModal();
            } else if (!document.getElementById("directLaborModal").classList.contains("hidden")) {
                closeDirectLaborModal();
            } else if (!document.getElementById("authModal").classList.contains("hidden")) {
                closeAuthModal();
            } else if (!document.getElementById("printPreviewModal").classList.contains("hidden")) {
                closePrintPreview();
            } else if (!document.getElementById("subRecipeSaveModal").classList.contains("hidden")) {
                closeSubRecipeSaveModal();
            } else if (!document.getElementById("editPromptModal").classList.contains("hidden")) {
                closeEditPromptModal();
            } else if (!document.getElementById("rawMaterialEditPromptModal").classList.contains("hidden")) {
                closeRawMaterialEditPromptModal();
            } else if (!document.getElementById("directLaborEditPromptModal").classList.contains("hidden")) {
                closeDirectLaborEditPromptModal();
            } else if (!document.getElementById("forgotPasswordModal").classList.contains("hidden")) {
                closeForgotPasswordModal();
            }
        }
    });

    // Stop propagation for all help icons to prevent modal closing
    document.querySelectorAll('.help-icon, .field-help').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
        });
    });
}

// ENHANCED: Reset Function
function resetRecipe() {
    if (!confirm("Reset entire recipe? This will clear all items and reset servings to 1.")) return;
    
    // Clear recipe tables
    recipeBody.innerHTML = "";
    directLaborRecipeBody.innerHTML = "";
    
    // Reset recipe name
    recipeNameInput.value = "";
    
    // Reset servings to 1
    servingsInput.value = "1";
    
    // Clear editing state
    editingItem = { type: null, id: null, data: null };
    
    // Recalculate
    recalc();
    
    // Clear cost breakdown preview if no recipe is loaded
    if (!loadedRecipeForSummary) {
        clearCostBreakdownPreview();
    }
    
    // Auto-save cleared state
    saveCurrentRecipeState();
    
    // Show confirmation
    showNotification("Recipe reset successfully");
}

// NEW: Auto-Reset After Save
function autoResetAfterSave() {
    setTimeout(() => {
        resetRecipe();
    }, 500);
}

// NEW: Dependency Tracking System
function updateRecipesUsingIngredient(updatedItem, itemType) {
    const recipes = getCurrentRecipes();
    let updatedRecipes = [];
    let hasUpdates = false;
    let updatedCount = 0;

    recipes.forEach(recipe => {
        let recipeUpdated = false;
        
        // Update raw material items in recipes
        if (recipe.rawMaterialItems) {
            recipe.rawMaterialItems.forEach(item => {
                if (item.type === itemType && item.name === updatedItem.name) {
                    item.unitCost = updatedItem.costPerUnit;
                    recipeUpdated = true;
                }
                
                // Also update sub-recipes that use this ingredient
                if (item.type === 'sub-recipe') {
                    const subRecipe = recipes.find(r => r.id === item.subRecipeId);
                    if (subRecipe && subRecipe.rawMaterialItems) {
                        subRecipe.rawMaterialItems.forEach(subItem => {
                            if (subItem.name === updatedItem.name) {
                                subItem.unitCost = updatedItem.costPerUnit;
                                recipeUpdated = true;
                            }
                        });
                    }
                }
            });
        }
        
        // Update direct labor items in recipes
        if (recipe.directLaborItems) {
            recipe.directLaborItems.forEach(item => {
                if (item.name === updatedItem.name) {
                    item.unitCost = updatedItem.costPerUnit;
                    recipeUpdated = true;
                }
            });
        }
        
        // Recalculate total cost if recipe was updated
        if (recipeUpdated) {
            recipe.totalCost = calculateRecipeTotalCost(recipe);
            hasUpdates = true;
            updatedCount++;
        }
        
        updatedRecipes.push(recipe);
    });

    if (hasUpdates) {
        setCurrentRecipes(updatedRecipes);
        renderRecipesList();
        populateUnifiedItemSelect();
        populateSummaryRecipeSelect();
        
        // Show notification
        showNotification(`Automatically updated ${updatedCount} recipe(s) using "${updatedItem.name}"`);
        
        // Update summary if the loaded recipe was affected
        if (loadedRecipeForSummary) {
            const loadedRecipe = updatedRecipes.find(r => r.id === loadedRecipeForSummary.id);
            if (loadedRecipe) {
                loadedRecipeForSummary = loadedRecipe;
                updateLoadedRecipeSummary();
                updateCostBreakdownPreview();
            }
        }
    }
}

// NEW: Calculate total cost for a recipe object
function calculateRecipeTotalCost(recipe) {
    let totalCost = 0;
    
    // Sum raw material costs
    if (recipe.rawMaterialItems) {
        recipe.rawMaterialItems.forEach(item => {
            totalCost += item.quantity * item.unitCost * (item.yield / 100);
        });
    }
    
    // Sum direct labor costs
    if (recipe.directLaborItems) {
        recipe.directLaborItems.forEach(item => {
            totalCost += item.quantity * item.unitCost;
        });
    }
    
    return parseFloat(totalCost.toFixed(2));
}

// NEW: Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.global-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `global-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add styles if not already added
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .global-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--surface);
                border: 1px solid var(--border);
                border-radius: var(--radius-lg);
                padding: var(--space-md);
                box-shadow: var(--shadow-xl);
                z-index: 10000;
                animation: slideInRight 0.3s ease;
                max-width: 400px;
            }
            
            .global-notification.success {
                border-left: 4px solid var(--success);
            }
            
            .global-notification.info {
                border-left: 4px solid var(--accent-blue);
            }
            
            .global-notification.warning {
                border-left: 4px solid var(--warning);
            }
            
            .global-notification.error {
                border-left: 4px solid var(--danger);
            }
            
            .notification-content {
                display: flex;
                align-items: flex-start;
                gap: var(--space-sm);
            }
            
            .notification-message {
                flex: 1;
                font-size: 14px;
                line-height: 1.4;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: var(--text-secondary);
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: var(--radius-sm);
            }
            
            .notification-close:hover {
                background: var(--primary-light);
                color: var(--text-primary);
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Helper functions to get current data
function getCurrentRawMaterials() {
    return userData.rawMaterials || [];
}

function getCurrentDirectLabor() {
    return userData.directLabor || [];
}

function getCurrentRecipes() {
    return userData.recipes || [];
}

function setCurrentRawMaterials(rawMaterials) {
    userData.rawMaterials = rawMaterials;
    saveUserData();
}

function setCurrentDirectLabor(directLabor) {
    userData.directLabor = directLabor;
    saveUserData();
}

function setCurrentRecipes(recipes) {
    userData.recipes = recipes;
    saveUserData();
}

// NEW: Raw Material Edit Prompt Functions
function showRawMaterialEditPrompt(id, name) {
    rawMaterialEditName.textContent = name;
    editingItem = { type: 'rawMaterial', id: id, data: null };
    rawMaterialEditPromptModal.classList.remove("hidden");
}

function closeRawMaterialEditPromptModal() {
    rawMaterialEditPromptModal.classList.add("hidden");
}

function handleRawMaterialEditChoice(choice) {
    closeRawMaterialEditPromptModal();
    
    if (choice === 'replace') {
        // Replace existing raw material
        updateRawMaterial();
    } else if (choice === 'new') {
        // Save as new raw material (generate new ID)
        editingItem.id = null;
        saveRawMaterial();
    }
}

// NEW: Direct Labor Edit Prompt Functions
function showDirectLaborEditPrompt(id, name) {
    directLaborEditName.textContent = name;
    editingItem = { type: 'directLabor', id: id, data: null };
    directLaborEditPromptModal.classList.remove("hidden");
}

function closeDirectLaborEditPromptModal() {
    directLaborEditPromptModal.classList.add("hidden");
}

function handleDirectLaborEditChoice(choice) {
    closeDirectLaborEditPromptModal();
    
    if (choice === 'replace') {
        // Replace existing direct labor
        updateDirectLabor();
    } else if (choice === 'new') {
        // Save as new direct labor (generate new ID)
        editingItem.id = null;
        saveDirectLabor();
    }
}

// ENHANCED: Save raw material function with dependency tracking and edit prompts
function saveRawMaterial() {
    const name = document
        .getElementById("modalRawMaterialName")
        .value.trim();
    const category = document.getElementById(
        "modalRawMaterialCategory"
    ).value;
    const price = parseFloat(
        document.getElementById("modalRawMaterialPrice").value
    );
    const quantity = parseFloat(
        document.getElementById("modalRawMaterialQuantity").value
    );
    const unit = document.getElementById("modalRawMaterialUnit").value;
    const costPerUnit = parseFloat(
        document.getElementById("modalCostPerUnit").value
    );
    const costUnit = document.getElementById("modalCostUnit").value;

    if (!name) {
        alert("Please enter a raw material name");
        return;
    }

    if (!category) {
        alert("Please select a category");
        return;
    }

    if (isNaN(price) || price <= 0) {
        alert("Please enter a valid purchase price");
        return;
    }

    if (isNaN(quantity) || quantity <= 0) {
        alert("Please enter a valid purchase quantity");
        return;
    }

    if (isNaN(costPerUnit) || costPerUnit <= 0) {
        alert("Please enter valid cost calculation details");
        return;
    }

    const rawMaterialData = {
        id: Date.now(),
        name,
        category,
        price: parseFloat(price.toFixed(2)),
        quantity: parseFloat(quantity.toFixed(2)),
        unit,
        costPerUnit: parseFloat(costPerUnit.toFixed(4)),
        costUnit
    };

    // Check if we're editing and if name already exists (excluding current item)
    if (editingItem.type === 'rawMaterial' && editingItem.id) {
        const rawMaterials = getCurrentRawMaterials();
        const existingItem = rawMaterials.find(item => 
            item.name === name && item.id !== editingItem.id
        );
        
        if (existingItem) {
            showRawMaterialEditPrompt(editingItem.id, name);
            return;
        } else {
            updateRawMaterial();
            return;
        }
    }

    const rawMaterials = getCurrentRawMaterials();
    rawMaterials.push(rawMaterialData);
    setCurrentRawMaterials(rawMaterials);

    renderRawMaterials();
    populateUnifiedItemSelect();
    closeRawMaterialModal();
    
    // NEW: Update recipes using this ingredient
    updateRecipesUsingIngredient(rawMaterialData, 'rawMaterial');

    showNotification("Raw material saved successfully!", "success");
}

// NEW: Update raw material function
function updateRawMaterial() {
    const name = document.getElementById("modalRawMaterialName").value.trim();
    const category = document.getElementById("modalRawMaterialCategory").value;
    const price = parseFloat(document.getElementById("modalRawMaterialPrice").value);
    const quantity = parseFloat(document.getElementById("modalRawMaterialQuantity").value);
    const unit = document.getElementById("modalRawMaterialUnit").value;
    const costPerUnit = parseFloat(document.getElementById("modalCostPerUnit").value);
    const costUnit = document.getElementById("modalCostUnit").value;

    const rawMaterials = getCurrentRawMaterials();
    const index = rawMaterials.findIndex(item => item.id === editingItem.id);
    
    if (index !== -1) {
        const updatedItem = {
            id: editingItem.id,
            name,
            category,
            price: parseFloat(price.toFixed(2)),
            quantity: parseFloat(quantity.toFixed(2)),
            unit,
            costPerUnit: parseFloat(costPerUnit.toFixed(4)),
            costUnit
        };
        
        rawMaterials[index] = updatedItem;
        setCurrentRawMaterials(rawMaterials);
        
        renderRawMaterials();
        populateUnifiedItemSelect();
        closeRawMaterialModal();
        
        // Update recipes using this ingredient
        updateRecipesUsingIngredient(updatedItem, 'rawMaterial');
        
        showNotification("Raw material updated successfully!", "success");
    }
}

function deleteRawMaterial(id) {
    if (confirm("Are you sure you want to delete this raw material?")) {
        const rawMaterials = getCurrentRawMaterials();
        const updatedRawMaterials = rawMaterials.filter((item) => item.id !== id);
        setCurrentRawMaterials(updatedRawMaterials);
        renderRawMaterials();
        populateUnifiedItemSelect();
        
        // NEW: Update cost breakdown preview if recipe is loaded
        if (loadedRecipeForSummary) {
            updateCostBreakdownPreview();
        }
        
        showNotification("Raw material deleted successfully!", "success");
    }
}

function renderRawMaterials() {
    const tableBody = document.getElementById("rawMaterialsTable");
    const filteredRawMaterials = filterRawMaterials();

    tableBody.innerHTML = filteredRawMaterials
        .map(
            (rawMaterial) => `
                <tr>
                    <td data-label="Raw Material">${rawMaterial.name}</td>
                    <td data-label="Category">${rawMaterial.category}</td>
                    <td data-label="Cost/Unit">${formatCurrency(
                        rawMaterial.costPerUnit
                    )}/${rawMaterial.costUnit}</td>
                    <td data-label="Actions">
                        <button class="btn-secondary small" onclick="openRawMaterialModal(${JSON.stringify(
                            rawMaterial
                        ).replace(/"/g, "&quot;")})">Edit</button>
                        <button class="btn-danger small" onclick="deleteRawMaterial(${
                            rawMaterial.id
                        })">Delete</button>
                    </td>
                </tr>
            `
        )
        .join("");
}

function filterRawMaterials() {
    const searchTerm = document
        .getElementById("rawMaterialSearch")
        .value.toLowerCase();
    const rawMaterials = getCurrentRawMaterials();
    return rawMaterials.filter(
        (rawMaterial) =>
            rawMaterial.name.toLowerCase().includes(searchTerm) ||
            rawMaterial.category.toLowerCase().includes(searchTerm)
    );
}

// Direct Labor Management
function openDirectLaborModal(directLabor = null) {
    const modal = document.getElementById("directLaborModal");
    const title = document.getElementById("directLaborModalTitle");

    if (directLabor) {
        title.textContent = "Edit Direct Labor";
        populateDirectLaborForm(directLabor);
        editingItem = { type: 'directLabor', id: directLabor.id, data: directLabor };
    } else {
        title.textContent = "Add New Direct Labor";
        document.getElementById("directLaborForm").reset();
        updateLaborCostPerUnit();
        editingItem = { type: null, id: null, data: null };
    }

    modal.classList.remove("hidden");
}

function closeDirectLaborModal() {
    document.getElementById("directLaborModal").classList.add("hidden");
    document.getElementById("directLaborForm").reset();
    editingItem = { type: null, id: null, data: null };
}

// Calculate and display cost per unit for direct labor
function updateLaborCostPerUnit() {
    const shiftRate =
        parseFloat(document.getElementById("modalShiftRate").value) || 0;
    const shiftDuration =
        parseFloat(document.getElementById("modalShiftDuration").value) || 1;
    const timeUnit = document.getElementById("modalTimeUnit").value;
    const costUnit = document.getElementById("modalCostUnitLabor").value;

    let costPerUnit = 0;
    let calculationSteps = [];

    if (shiftRate > 0 && shiftDuration > 0) {
        const costPerTimeUnit = shiftRate / shiftDuration;
        calculationSteps.push(
            `Cost per ${timeUnit}: ${shiftRate.toFixed(2)} ${currency} ÷ ${shiftDuration.toFixed(2)} = ${costPerTimeUnit.toFixed(4)} ${currency}/${timeUnit}`
        );

        if (timeUnit !== costUnit) {
            const conversionFactor = UNIT_CONVERSIONS[costUnit] / UNIT_CONVERSIONS[timeUnit];
            costPerUnit = costPerTimeUnit * conversionFactor;
            calculationSteps.push(
                `Convert to ${costUnit}: ${costPerTimeUnit.toFixed(4)} ${currency}/${timeUnit} × ${conversionFactor.toFixed(6)} = ${costPerUnit.toFixed(4)} ${currency}/${costUnit}`
            );
        } else {
            costPerUnit = costPerTimeUnit;
            calculationSteps.push(
                `No conversion needed (already in ${costUnit})`
            );
        }
    }

    document.getElementById("modalCostPerUnitLabor").value = costPerUnit.toFixed(4);

    updateLaborCalculationDisplay(calculationSteps, costPerUnit, costUnit);
}

// Update the labor calculation display with step-by-step breakdown
function updateLaborCalculationDisplay(steps, finalCost, costUnit) {
    const calculationDetails = document.getElementById(
        "laborCostCalculationDetails"
    );

    if (steps.length > 0) {
        let html = `<div><strong>Calculation Steps:</strong></div>`;
        steps.forEach((step) => {
            html += `<div style="margin: var(--space-xs) 0; padding-left: var(--space-md);">• ${step}</div>`;
        });
        html += `<div style="margin-top: var(--space-sm); font-weight: bold;">Final Cost: ${finalCost.toFixed(4)} ${currency}/${costUnit}</div>`;
        calculationDetails.innerHTML = html;
    } else {
        calculationDetails.textContent =
            "Enter shift details to see calculation";
    }
}

function populateDirectLaborForm(directLabor) {
    document.getElementById("modalLaborName").value = directLabor.name;
    document.getElementById("modalShiftRate").value = directLabor.shiftRate.toFixed(2);
    document.getElementById("modalShiftDuration").value = directLabor.shiftDuration.toFixed(2);
    document.getElementById("modalTimeUnit").value = directLabor.timeUnit;
    document.getElementById("modalCostUnitLabor").value = directLabor.costUnit;

    updateLaborCostPerUnit();
}

// ENHANCED: Save direct labor with dependency tracking and edit prompts
function saveDirectLabor() {
    const name = document
        .getElementById("modalLaborName")
        .value.trim();
    const shiftRate = parseFloat(
        document.getElementById("modalShiftRate").value
    );
    const shiftDuration = parseFloat(
        document.getElementById("modalShiftDuration").value
    );
    const timeUnit = document.getElementById("modalTimeUnit").value;
    const costUnit = document.getElementById("modalCostUnitLabor").value;

    if (!name) {
        alert("Please enter a labor name");
        return;
    }

    if (isNaN(shiftRate) || shiftRate <= 0) {
        alert("Please enter a valid shift rate");
        return;
    }

    if (isNaN(shiftDuration) || shiftDuration <= 0) {
        alert("Please enter a valid shift duration");
        return;
    }

    // Calculate cost per unit
    let costPerUnit = 0;
    if (shiftRate > 0 && shiftDuration > 0) {
        const costPerTimeUnit = shiftRate / shiftDuration;
        if (timeUnit !== costUnit) {
            const conversionFactor = UNIT_CONVERSIONS[costUnit] / UNIT_CONVERSIONS[timeUnit];
            costPerUnit = costPerTimeUnit * conversionFactor;
        } else {
            costPerUnit = costPerTimeUnit;
        }
    }

    const directLaborData = {
        id: Date.now(),
        name,
        shiftRate: parseFloat(shiftRate.toFixed(2)),
        shiftDuration: parseFloat(shiftDuration.toFixed(2)),
        timeUnit,
        costPerUnit: parseFloat(costPerUnit.toFixed(4)),
        costUnit
    };

    // Check if we're editing and if name already exists (excluding current item)
    if (editingItem.type === 'directLabor' && editingItem.id) {
        const directLabor = getCurrentDirectLabor();
        const existingItem = directLabor.find(item => 
            item.name === name && item.id !== editingItem.id
        );
        
        if (existingItem) {
            showDirectLaborEditPrompt(editingItem.id, name);
            return;
        } else {
            updateDirectLabor();
            return;
        }
    }

    const directLabor = getCurrentDirectLabor();
    directLabor.push(directLaborData);
    setCurrentDirectLabor(directLabor);

    renderDirectLabor();
    populateUnifiedItemSelect();
    populateDirectLaborSelect();
    closeDirectLaborModal();

    // NEW: Update recipes using this labor item
    updateRecipesUsingIngredient(directLaborData, 'directLabor');

    showNotification("Direct labor saved successfully!", "success");
}

// NEW: Update direct labor function
function updateDirectLabor() {
    const name = document.getElementById("modalLaborName").value.trim();
    const shiftRate = parseFloat(document.getElementById("modalShiftRate").value);
    const shiftDuration = parseFloat(document.getElementById("modalShiftDuration").value);
    const timeUnit = document.getElementById("modalTimeUnit").value;
    const costUnit = document.getElementById("modalCostUnitLabor").value;

    // Calculate cost per unit
    let costPerUnit = 0;
    if (shiftRate > 0 && shiftDuration > 0) {
        const costPerTimeUnit = shiftRate / shiftDuration;
        if (timeUnit !== costUnit) {
            const conversionFactor = UNIT_CONVERSIONS[costUnit] / UNIT_CONVERSIONS[timeUnit];
            costPerUnit = costPerTimeUnit * conversionFactor;
        } else {
            costPerUnit = costPerTimeUnit;
        }
    }

    const directLabor = getCurrentDirectLabor();
    const index = directLabor.findIndex(item => item.id === editingItem.id);
    
    if (index !== -1) {
        const updatedItem = {
            id: editingItem.id,
            name,
            shiftRate: parseFloat(shiftRate.toFixed(2)),
            shiftDuration: parseFloat(shiftDuration.toFixed(2)),
            timeUnit,
            costPerUnit: parseFloat(costPerUnit.toFixed(4)),
            costUnit
        };
        
        directLabor[index] = updatedItem;
        setCurrentDirectLabor(directLabor);
        
        renderDirectLabor();
        populateUnifiedItemSelect();
        populateDirectLaborSelect();
        closeDirectLaborModal();

        // Update recipes using this labor item
        updateRecipesUsingIngredient(updatedItem, 'directLabor');
        
        showNotification("Direct labor updated successfully!", "success");
    }
}

function deleteDirectLabor(id) {
    if (confirm("Are you sure you want to delete this direct labor item?")) {
        const directLabor = getCurrentDirectLabor();
        const updatedDirectLabor = directLabor.filter((item) => item.id !== id);
        setCurrentDirectLabor(updatedDirectLabor);
        renderDirectLabor();
        populateUnifiedItemSelect();
        populateDirectLaborSelect();
        
        showNotification("Direct labor deleted successfully!", "success");
    }
}

function renderDirectLabor() {
    const tableBody = document.getElementById("directLaborTable");
    const filteredDirectLabor = filterDirectLabor();

    tableBody.innerHTML = filteredDirectLabor
        .map(
            (labor) => `
                <tr>
                    <td data-label="Labor Name">${labor.name}</td>
                    <td data-label="Shift Rate">${formatCurrency(labor.shiftRate)}/shift</td>
                    <td data-label="Shift Duration">${labor.shiftDuration} ${labor.timeUnit}</td>
                    <td data-label="Cost/Unit">${formatCurrency(labor.costPerUnit)}/${labor.costUnit}</td>
                    <td data-label="Actions">
                        <button class="btn-secondary small" onclick="openDirectLaborModal(${JSON.stringify(
                            labor
                        ).replace(/"/g, "&quot;")})">Edit</button>
                        <button class="btn-danger small" onclick="deleteDirectLabor(${
                            labor.id
                        })">Delete</button>
                    </td>
                </tr>
            `
        )
        .join("");
}

function filterDirectLabor() {
    const searchTerm = document
        .getElementById("directLaborSearch")
        .value.toLowerCase();
    const directLabor = getCurrentDirectLabor();
    return directLabor.filter(
        (labor) => labor.name.toLowerCase().includes(searchTerm)
    );
}

// Populate unified item select dropdown
function populateUnifiedItemSelect() {
    const select = document.getElementById("unifiedItemSelect");
    const rawMaterialsGroup = select.querySelector('optgroup[label="Raw Materials"]');
    const subRecipesGroup = select.querySelector('optgroup[label="Sub-Recipes"]');
    
    rawMaterialsGroup.innerHTML = '';
    subRecipesGroup.innerHTML = '';
    
    // Add raw materials
    getCurrentRawMaterials().forEach(item => {
        const option = document.createElement('option');
        option.value = `rawMaterial-${item.id}`;
        option.textContent = `${item.name} (${formatCurrency(item.costPerUnit)}/${item.costUnit})`;
        rawMaterialsGroup.appendChild(option);
    });
    
    // Add sub-recipes
    const subRecipes = getCurrentRecipes().filter(recipe => recipe.type === 'sub');
    subRecipes.forEach(recipe => {
        const option = document.createElement('option');
        option.value = `subrecipe-${recipe.id}`;
        
        // Use costPerUnit instead of unitCost
        const unitCost = recipe.costPerUnit || 0;
        const costUnit = recipe.costUnit || recipe.outputUnit || 'batch';
        
        option.textContent = `${recipe.name} (${formatCurrency(unitCost)}/${costUnit})`;
        subRecipesGroup.appendChild(option);
    });
}

// Populate direct labor select dropdown
function populateDirectLaborSelect() {
    const select = document.getElementById("directLaborSelect");
    select.innerHTML = '<option value="">Select direct labor...</option>';
    
    getCurrentDirectLabor().forEach(labor => {
        const option = document.createElement('option');
        option.value = labor.id;
        option.textContent = `${labor.name} (${formatCurrency(labor.costPerUnit)}/${labor.costUnit})`;
        select.appendChild(option);
    });
}

// Recipe Table Management
function addRow(
    name = "",
    qtyVal = "0",
    unit = "g",
    yieldVal = "100",
    unitCostVal = "0.00",
    type = "rawMaterial",
    subRecipeId = null
) {
    const tr = document.createElement("tr");
    if (type === 'sub-recipe') {
        tr.classList.add('sub-recipe-row');
    }
    
    tr.innerHTML = `
            <td data-label="Item">
                ${type === 'sub-recipe' ? `<span class="sub-recipe-badge">SUB</span> ` : ''}
                <input type="text" value="${escapeHtml(name)}" placeholder="Item" ${type === 'sub-recipe' ? 'readonly' : ''}>
            </td>
            <td data-label="Qty/Time">
                <div class="quantity-input-group">
                    <input type="number" value="${parseFloat(qtyVal).toFixed(2)}" step="0.01" placeholder="Qty/Time">
                    <span class="quantity-unit">${unit}</span>
                </div>
            </td>
            <td data-label="Yield %">
                <div class="yield-input-group">
                    <input type="number" value="${parseFloat(yieldVal).toFixed(1)}" placeholder="Yield %" min="0" max="100" step="0.1" ${type === 'directLabor' ? 'disabled' : ''}>
                    <span class="yield-percent">%</span>
                </div>
            </td>
            <td class="unit-cost-cell" data-label="Unit Cost">
                <span class="unit-currency">${currency}</span>
                <input type="number" value="${parseFloat(unitCostVal).toFixed(2)}" step="0.01" style="width:60%" ${type === 'sub-recipe' ? 'readonly' : ''}>
                <span class="unit-display">/${unit}</span>
            </td>
            <td data-label="Total Cost">
                <span class="unit-currency">${currency}</span>
                <span class="total-value">0.00</span>
                <span class="unit-suffix">/recipe</span>
            </td>
            <td data-label="Action"><button class="delRow" style="background:var(--danger);color:var(--surface);border:none;padding:var(--space-sm) var(--space-md);border-radius:var(--radius-md);">🗑️</button></td>
        `;

    const qty = tr.children[1].querySelector("input");
    const yieldInput = tr.children[2].querySelector("input");
    const unitCostInput = tr.children[3].querySelector("input");
    const totalVal = tr.children[4].querySelector(".total-value");
    const delBtn = tr.querySelector(".delRow");

    tr.dataset.type = type;
    if (subRecipeId) {
        tr.dataset.subRecipeId = subRecipeId;
    }

    function updateRow() {
        const q = parseFloat(qty.value) || 0;
        const uc = parseFloat(unitCostInput.value) || 0;
        const y = parseFloat(yieldInput.value) || 100;
        totalVal.textContent = (q * uc * (y / 100)).toFixed(2);
        recalc();
        
        // Auto-save current recipe state
        saveCurrentRecipeState();
        
        // NEW: Update cost breakdown preview if recipe is loaded
        if (loadedRecipeForSummary) {
            updateCostBreakdownPreview();
        }
    }

    [qty, yieldInput, unitCostInput].forEach((e) =>
        e.addEventListener("input", updateRow)
    );
    delBtn.addEventListener("click", () => {
        tr.remove();
        recalc();
        
        // Auto-save current recipe state
        saveCurrentRecipeState();
        
        // NEW: Update cost breakdown preview if recipe is loaded
        if (loadedRecipeForSummary) {
            updateCostBreakdownPreview();
        }
    });

    recipeBody.appendChild(tr);
    updateRow();
    
    // Auto-save current recipe state
    saveCurrentRecipeState();
}

// Add direct labor row to recipe
function addDirectLaborToRecipe() {
    const laborId = directLaborSelect.value;
    const timeRequired = parseFloat(timeRequirement.value);

    if (!laborId || !timeRequired || timeRequired <= 0) {
        alert("Please select a direct labor item and enter a valid time requirement");
        return;
    }

    const labor = getCurrentDirectLabor().find(item => item.id === parseInt(laborId));
    if (!labor) return;

    const tr = document.createElement("tr");
    tr.classList.add('labor-row');
    
    tr.innerHTML = `
        <td data-label="Labor Item">
            <input type="text" value="${escapeHtml(labor.name)}" placeholder="Labor item" readonly>
        </td>
        <td data-label="Time Required">
            <div class="quantity-input-group">
                <input type="number" value="${parseFloat(timeRequired).toFixed(2)}" step="0.01" placeholder="Time">
                <span class="quantity-unit">${labor.costUnit}</span>
            </div>
        </td>
        <td data-label="Rate">
            <div class="input-with-unit">
                <input type="number" value="${labor.costPerUnit.toFixed(2)}" step="0.01" placeholder="Rate" readonly>
                <span class="unit-display-small">/${labor.costUnit}</span>
            </div>
        </td>
        <td data-label="Total Cost">
            <span class="unit-currency">${currency}</span>
            <span class="total-value">0.00</span>
        </td>
        <td data-label="Action"><button class="delDirectLaborRow" style="background:var(--danger);color:var(--surface);border:none;padding:var(--space-sm) var(--space-md);border-radius:var(--radius-md);">🗑️</button></td>
    `;

    const timeInput = tr.children[1].querySelector("input");
    const rateInput = tr.children[2].querySelector("input");
    const totalVal = tr.children[3].querySelector(".total-value");
    const delBtn = tr.querySelector(".delDirectLaborRow");

    tr.dataset.laborId = labor.id;

    function updateRow() {
        const time = parseFloat(timeInput.value) || 0;
        const rate = parseFloat(rateInput.value) || 0;
        totalVal.textContent = (time * rate).toFixed(2);
        recalc();
        
        // Auto-save current recipe state
        saveCurrentRecipeState();
        
        // Update cost breakdown preview if recipe is loaded
        if (loadedRecipeForSummary) {
            updateCostBreakdownPreview();
        }
    }

    timeInput.addEventListener("input", updateRow);
    delBtn.addEventListener("click", () => {
        tr.remove();
        recalc();
        
        // Auto-save current recipe state
        saveCurrentRecipeState();
        
        // Update cost breakdown preview if recipe is loaded
        if (loadedRecipeForSummary) {
            updateCostBreakdownPreview();
        }
    });

    directLaborRecipeBody.appendChild(tr);
    updateRow();
    
    // Auto-save current recipe state
    saveCurrentRecipeState();

    // Clear inputs
    directLaborSelect.value = "";
    timeRequirement.value = "";
    timeRequirementUnit.textContent = "hours";
}

// Simplified function to add items to recipe
function addItemToRecipe() {
    const selectedValue = unifiedItemSelect.value;
    const quantity = parseFloat(addIngredientQty.value);
    const yieldPercent = parseFloat(addIngredientYield.value) || 100;

    if (!selectedValue || !quantity) {
        alert("Please select an item and enter quantity/time");
        return;
    }

    const [type, id] = selectedValue.split('-');
    const itemId = parseInt(id);

    if (type === 'rawMaterial') {
        const rawMaterial = getCurrentRawMaterials().find(item => item.id === itemId);
        if (!rawMaterial) return;

        const unit = rawMaterial.costUnit;
        const unitCost = rawMaterial.costPerUnit;

        addRow(
            rawMaterial.name,
            quantity.toFixed(2),
            unit,
            yieldPercent.toFixed(1),
            unitCost.toFixed(2),
            'rawMaterial'
        );
    } else if (type === 'subrecipe') {
        const subRecipe = getCurrentRecipes().find(recipe => recipe.id === itemId);
        if (!subRecipe) return;

        // Use costPerUnit instead of unitCost
        const unitCost = subRecipe.costPerUnit || 0;
        const unit = subRecipe.costUnit || subRecipe.outputUnit || 'batch';

        addRow(
            subRecipe.name,
            quantity.toFixed(2),
            unit,
            yieldPercent.toFixed(1),
            unitCost.toFixed(2),
            'sub-recipe',
            subRecipe.id
        );
    }

    unifiedItemSelect.value = "";
    addIngredientQty.value = "";
    addIngredientYield.value = "100";
    addIngredientUnit.textContent = "g";
    addIngredientYield.disabled = false;
}

// Open sub-recipe save modal
function openSubRecipeSaveModal() {
    const recipeName = document.getElementById('recipeName').value.trim();
    if (!recipeName) {
        alert('Please enter a recipe name before saving as sub-recipe');
        document.getElementById('recipeName').focus();
        return;
    }

    // Set the sub-recipe name in the modal
    document.getElementById('subRecipeNameDisplay').value = recipeName;
    
    // Reset form to default values
    document.getElementById('subRecipeCategory').value = 'weight';
    document.getElementById('subRecipeYieldQuantity').value = '1';
    
    // Update unit options and cost display
    updateSubRecipeUnitOptions();
    updateSubRecipeCostDisplay();
    
    // Show the modal
    document.getElementById('subRecipeSaveModal').classList.remove('hidden');
}

// ENHANCED: Save sub-recipe function with auto-reset
function saveSubRecipe() {
    const name = document.getElementById('subRecipeNameDisplay').value;
    const category = document.getElementById('subRecipeCategory').value;
    const yieldQuantity = parseFloat(document.getElementById('subRecipeYieldQuantity').value);
    const yieldUnit = document.getElementById('subRecipeYieldUnit').value;
    const costPerUnit = parseFloat(document.getElementById('subRecipeCostPerUnit').value);
    const costUnit = document.getElementById('subRecipeCostUnit').value;

    if (!name) {
        alert('Please enter a sub-recipe name');
        return;
    }

    if (isNaN(yieldQuantity) || yieldQuantity <= 0) {
        alert('Please enter a valid yield quantity');
        return;
    }

    // Get current recipe items
    const rawMaterialItems = [];
    const directLaborItems = [];
    
    recipeBody.querySelectorAll("tr").forEach(row => {
        const itemName = row.children[0].querySelector("input").value;
        const quantity = parseFloat(row.children[1].querySelector("input").value) || 0;
        const unit = row.children[1].querySelector(".quantity-unit").textContent;
        const yieldPct = parseFloat(row.children[2].querySelector("input").value) || 100;
        const unitCost = parseFloat(row.children[3].querySelector("input").value) || 0;
        const type = row.dataset.type || 'rawMaterial';
        const subRecipeId = row.dataset.subRecipeId || null;
        
        if (type === 'rawMaterial' || type === 'sub-recipe') {
            rawMaterialItems.push({
                name: itemName,
                quantity: quantity,
                unit: unit,
                yield: yieldPct,
                unitCost: unitCost,
                type: type,
                subRecipeId: subRecipeId
            });
        } else if (type === 'directLabor') {
            directLaborItems.push({
                name: itemName,
                quantity: quantity,
                unit: unit,
                yield: yieldPct,
                unitCost: unitCost,
                type: 'directLabor'
            });
        }
    });

    directLaborRecipeBody.querySelectorAll("tr").forEach(row => {
        const laborName = row.children[0].querySelector("input").value;
        const timeRequired = parseFloat(row.children[1].querySelector("input").value) || 0;
        const timeUnit = row.children[1].querySelector(".quantity-unit").textContent;
        const rate = parseFloat(row.children[2].querySelector("input").value) || 0;
        
        directLaborItems.push({
            name: laborName,
            quantity: timeRequired,
            unit: timeUnit,
            yield: 100,
            unitCost: rate,
            type: 'directLabor'
        });
    });

    // Create sub-recipe object
    const subRecipe = {
        id: Date.now(),
        name: name,
        type: 'sub',
        category: category,
        yieldQuantity: yieldQuantity,
        yieldUnit: yieldUnit,
        costPerUnit: costPerUnit,
        costUnit: costUnit,
        rawMaterialItems: rawMaterialItems,
        directLaborItems: directLaborItems,
        totalCost: calculateCurrentRecipeTotalCost()
    };

    // Add to saved recipes
    const recipes = getCurrentRecipes();
    recipes.push(subRecipe);
    setCurrentRecipes(recipes);

    // Update displays
    renderRecipesList();
    populateUnifiedItemSelect();
    
    // NEW: Update summary recipe selector
    populateSummaryRecipeSelect();
    
    // Close modal
    closeSubRecipeSaveModal();
    
    // NEW: Auto-reset after save
    autoResetAfterSave();
    
    showNotification(`Sub-recipe "${name}" saved successfully!`, "success");
}

// Close sub-recipe save modal
function closeSubRecipeSaveModal() {
    document.getElementById('subRecipeSaveModal').classList.add('hidden');
}

// ENHANCED: Save main recipe function with auto-reset
function saveRecipe(type) {
    const name = recipeNameInput.value.trim();
    if (!name) {
        alert("Please enter a recipe name");
        recipeNameInput.focus();
        return;
    }

    // Get current recipe items
    const rawMaterialItems = [];
    const directLaborItems = [];
    
    recipeBody.querySelectorAll("tr").forEach(row => {
        const itemName = row.children[0].querySelector("input").value;
        const quantity = parseFloat(row.children[1].querySelector("input").value) || 0;
        const unit = row.children[1].querySelector(".quantity-unit").textContent;
        const yieldPct = parseFloat(row.children[2].querySelector("input").value) || 100;
        const unitCost = parseFloat(row.children[3].querySelector("input").value) || 0;
        const type = row.dataset.type || 'rawMaterial';
        const subRecipeId = row.dataset.subRecipeId || null;
        
        if (type === 'rawMaterial' || type === 'sub-recipe') {
            rawMaterialItems.push({
                name: itemName,
                quantity: quantity,
                unit: unit,
                yield: yieldPct,
                unitCost: unitCost,
                type: type,
                subRecipeId: subRecipeId
            });
        } else if (type === 'directLabor') {
            directLaborItems.push({
                name: itemName,
                quantity: quantity,
                unit: unit,
                yield: yieldPct,
                unitCost: unitCost,
                type: 'directLabor'
            });
        }
    });

    directLaborRecipeBody.querySelectorAll("tr").forEach(row => {
        const laborName = row.children[0].querySelector("input").value;
        const timeRequired = parseFloat(row.children[1].querySelector("input").value) || 0;
        const timeUnit = row.children[1].querySelector(".quantity-unit").textContent;
        const rate = parseFloat(row.children[2].querySelector("input").value) || 0;
        
        directLaborItems.push({
            name: laborName,
            quantity: timeRequired,
            unit: timeUnit,
            yield: 100,
            unitCost: rate,
            type: 'directLabor'
        });
    });

    // Create recipe object
    const recipe = {
        id: Date.now(),
        name: name,
        type: type,
        rawMaterialItems: rawMaterialItems,
        directLaborItems: directLaborItems,
        totalCost: calculateCurrentRecipeTotalCost(),
        servings: parseFloat(servingsInput.value) || 1,
        createdAt: new Date().toISOString()
    };

    // Add to saved recipes
    const recipes = getCurrentRecipes();
    
    // Check if we're editing an existing recipe
    if (editingItem.type === 'mainRecipe' && editingItem.id) {
        const existingIndex = recipes.findIndex(r => r.id === editingItem.id);
        if (existingIndex !== -1) {
            recipes[existingIndex] = recipe;
        }
    } else {
        recipes.push(recipe);
    }

    setCurrentRecipes(recipes);

    // Update displays
    renderRecipesList();
    
    // NEW: Update summary recipe selector
    populateSummaryRecipeSelect();
    
    // Reset editing state
    editingItem = { type: null, id: null, data: null };
    
    // NEW: Auto-reset after save
    autoResetAfterSave();
    
    showNotification(`Recipe "${name}" saved successfully!`, "success");
}

// Render recipes list
function renderRecipesList() {
    const recipes = getCurrentRecipes();
    const mainRecipes = recipes.filter(recipe => recipe.type === 'main');
    const subRecipes = recipes.filter(recipe => recipe.type === 'sub');

    // Render main recipes
    mainRecipesList.innerHTML = mainRecipes.map(recipe => `
        <div class="recipe-item" onclick="loadRecipe(${recipe.id})">
            <h4>${escapeHtml(recipe.name)}</h4>
            <p>Total Cost: ${formatCurrency(recipe.totalCost)} • ${recipe.rawMaterialItems.length + recipe.directLaborItems.length} items • ${recipe.servings || 1} servings</p>
            <div class="recipe-actions">
                <button class="btn-secondary small" onclick="editRecipe(${recipe.id}, event)">Edit</button>
                <button class="btn-danger small" onclick="deleteRecipe(${recipe.id}, event)">Delete</button>
            </div>
        </div>
    `).join('');

    // Render sub-recipes
    subRecipesList.innerHTML = subRecipes.map(recipe => `
        <div class="recipe-item" onclick="loadSubRecipe(${recipe.id})">
            <h4>${escapeHtml(recipe.name)}</h4>
            <p>Cost: ${formatCurrency(recipe.costPerUnit)}/${recipe.costUnit} • ${recipe.rawMaterialItems.length + recipe.directLaborItems.length} items</p>
            <div class="recipe-actions">
                <button class="btn-secondary small" onclick="editSubRecipe(${recipe.id}, event)">Edit</button>
                <button class="btn-danger small" onclick="deleteRecipe(${recipe.id}, event)">Delete</button>
            </div>
        </div>
    `).join('');
}

// Load recipe into current recipe
function loadRecipe(recipeId) {
    const recipes = getCurrentRecipes();
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    // Clear current recipe
    recipeBody.innerHTML = "";
    directLaborRecipeBody.innerHTML = "";

    // Set recipe name
    recipeNameInput.value = recipe.name;

    // Set servings
    servingsInput.value = recipe.servings || 1;

    // Add raw material items
    recipe.rawMaterialItems.forEach(item => {
        addRow(
            item.name,
            item.quantity,
            item.unit,
            item.yield,
            item.unitCost,
            item.type || 'rawMaterial',
            item.subRecipeId || null
        );
    });

    // Add direct labor items
    recipe.directLaborItems.forEach(item => {
        addDirectLaborRow(
            item.name,
            item.quantity,
            item.unit,
            item.unitCost
        );
    });

    // Set editing state
    editingItem = { type: 'mainRecipe', id: recipeId, data: recipe };

    // Switch to recipes tab
    switchTab('recipes');
    
    // Recalculate
    recalc();
}

// Add direct labor row helper
function addDirectLaborRow(name, timeRequired, timeUnit, rate) {
    const tr = document.createElement("tr");
    tr.classList.add('labor-row');
    
    tr.innerHTML = `
        <td data-label="Labor Item">
            <input type="text" value="${escapeHtml(name)}" placeholder="Labor item" readonly>
        </td>
        <td data-label="Time Required">
            <div class="quantity-input-group">
                <input type="number" value="${parseFloat(timeRequired).toFixed(2)}" step="0.01" placeholder="Time">
                <span class="quantity-unit">${timeUnit}</span>
            </div>
        </td>
        <td data-label="Rate">
            <div class="input-with-unit">
                <input type="number" value="${parseFloat(rate).toFixed(2)}" step="0.01" placeholder="Rate" readonly>
                <span class="unit-display-small">/${timeUnit}</span>
            </div>
        </td>
        <td data-label="Total Cost">
            <span class="unit-currency">${currency}</span>
            <span class="total-value">0.00</span>
        </td>
        <td data-label="Action"><button class="delDirectLaborRow" style="background:var(--danger);color:var(--surface);border:none;padding:var(--space-sm) var(--space-md);border-radius:var(--radius-md);">🗑️</button></td>
    `;

    const timeInput = tr.children[1].querySelector("input");
    const rateInput = tr.children[2].querySelector("input");
    const totalVal = tr.children[3].querySelector(".total-value");
    const delBtn = tr.querySelector(".delDirectLaborRow");

    function updateRow() {
        const time = parseFloat(timeInput.value) || 0;
        const rate = parseFloat(rateInput.value) || 0;
        totalVal.textContent = (time * rate).toFixed(2);
        recalc();
        
        // Auto-save current recipe state
        saveCurrentRecipeState();
        
        // NEW: Update cost breakdown preview if recipe is loaded
        if (loadedRecipeForSummary) {
            updateCostBreakdownPreview();
        }
    }

    timeInput.addEventListener("input", updateRow);
    delBtn.addEventListener("click", () => {
        tr.remove();
        recalc();
        
        // Auto-save current recipe state
        saveCurrentRecipeState();
        
        // NEW: Update cost breakdown preview if recipe is loaded
        if (loadedRecipeForSummary) {
            updateCostBreakdownPreview();
        }
    });

    directLaborRecipeBody.appendChild(tr);
    updateRow();
}

// Load sub-recipe into current recipe
function loadSubRecipe(recipeId) {
    const recipes = getCurrentRecipes();
    const recipe = recipes.find(r => r.id === recipeId && r.type === 'sub');
    if (!recipe) return;

    // Clear current recipe
    recipeBody.innerHTML = "";
    directLaborRecipeBody.innerHTML = "";

    // Set recipe name
    recipeNameInput.value = recipe.name;

    // Add raw material items from sub-recipe
    recipe.rawMaterialItems.forEach(item => {
        addRow(
            item.name,
            item.quantity,
            item.unit,
            item.yield,
            item.unitCost,
            'rawMaterial'
        );
    });

    // Add direct labor items from sub-recipe
    recipe.directLaborItems.forEach(item => {
        addDirectLaborRow(
            item.name,
            item.quantity,
            item.unit,
            item.unitCost
        );
    });

    // Set editing state
    editingItem = { type: 'subRecipe', id: recipeId, data: recipe };

    // Switch to recipes tab
    switchTab('recipes');
    
    // Recalculate
    recalc();
}

// Edit recipe
function editRecipe(recipeId, event) {
    if (event) event.stopPropagation();
    const recipes = getCurrentRecipes();
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    // Load the recipe
    loadRecipe(recipeId);
    
    // Set editing state
    editingItem = { type: 'mainRecipe', id: recipeId, data: recipe };
}

// Edit sub-recipe
function editSubRecipe(recipeId, event) {
    if (event) event.stopPropagation();
    const recipes = getCurrentRecipes();
    const recipe = recipes.find(r => r.id === recipeId && r.type === 'sub');
    if (!recipe) return;

    // Load the sub-recipe
    loadSubRecipe(recipeId);
    
    // Set editing state
    editingItem = { type: 'subRecipe', id: recipeId, data: recipe };
}

// Delete recipe
function deleteRecipe(recipeId, event) {
    if (event) event.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this recipe?")) return;

    const recipes = getCurrentRecipes();
    const updatedRecipes = recipes.filter(recipe => recipe.id !== recipeId);
    setCurrentRecipes(updatedRecipes);

    // Update displays
    renderRecipesList();
    populateUnifiedItemSelect();
    
    // NEW: Update summary recipe selector
    populateSummaryRecipeSelect();
    
    // If we're editing the deleted recipe, clear editing state
    if (editingItem.id === recipeId) {
        editingItem = { type: null, id: null, data: null };
    }
    
    // NEW: If the deleted recipe was loaded for summary, clear it
    if (loadedRecipeForSummary && loadedRecipeForSummary.id === recipeId) {
        loadedRecipeForSummary = null;
        loadedRecipeDisplay.classList.add('hidden');
        clearCostBreakdownPreview();
    }
    
    showNotification("Recipe deleted successfully!", "success");
}

// Show edit prompt
function showEditPrompt(type, id, name) {
    editPromptTitle.textContent = "Save Changes";
    editPromptMessage.innerHTML = `
        <p>A recipe named "<strong>${escapeHtml(name)}</strong>" already exists.</p>
        <p>Would you like to replace the existing recipe or save this as a new recipe?</p>
    `;
    
    editingItem = { type, id, data: null };
    editPromptModal.classList.remove("hidden");
}

// Handle edit prompt choice
function handleEditPromptChoice(choice) {
    closeEditPromptModal();
    
    if (choice === 'replace') {
        // Replace existing recipe
        saveRecipe(editingItem.type === 'mainRecipe' ? 'main' : 'sub');
    } else if (choice === 'new') {
        // Save as new recipe (generate new ID)
        editingItem.id = null;
        saveRecipe(editingItem.type === 'mainRecipe' ? 'main' : 'sub');
    }
}

// Close help modal
function closeHelpModal() {
    helpModal.classList.add("hidden");
}

// Close print preview
function closePrintPreview() {
    printPreviewModal.classList.add("hidden");
}

// Close edit prompt modal
function closeEditPromptModal() {
    editPromptModal.classList.add("hidden");
}

// Recalculate totals
function recalc() {
    const batchScale = parseFloat(batchScaleInput.value) || 1;
    const servings = parseFloat(servingsInput.value) || 1;
    const scaledServings = servings * batchScale;
    
    let rawMaterialsTotal = 0;
    let directLaborTotal = 0;

    // Calculate raw materials total
    recipeBody.querySelectorAll("tr").forEach((row) => {
        const q = parseFloat(row.children[1].querySelector("input").value) || 0;
        const uc = parseFloat(row.children[3].querySelector("input").value) || 0;
        const y = parseFloat(row.children[2].querySelector("input").value) || 100;
        rawMaterialsTotal += q * uc * (y / 100);
    });

    // Calculate direct labor total
    directLaborRecipeBody.querySelectorAll("tr").forEach((row) => {
        const time = parseFloat(row.children[1].querySelector("input").value) || 0;
        const rate = parseFloat(row.children[2].querySelector("input").value) || 0;
        directLaborTotal += time * rate;
    });

    const scaledRawMaterialsTotal = rawMaterialsTotal * batchScale;
    const scaledDirectLaborTotal = directLaborTotal * batchScale;
    const grandTotal = scaledRawMaterialsTotal + scaledDirectLaborTotal;

    // Update display
    rawMaterialsTotalEl.textContent = `${currency}${scaledRawMaterialsTotal.toFixed(2)}`;
    directLaborTotalEl.textContent = `${currency}${scaledDirectLaborTotal.toFixed(2)}`;
    grandTotalEl.textContent = `${currency}${grandTotal.toFixed(2)}`;

    // FIXED: Only update summary when no recipe is loaded for analysis
    if (!loadedRecipeForSummary) {
        updateSummary(scaledRawMaterialsTotal, scaledDirectLaborTotal, grandTotal, scaledServings);
    }
    
    // NEW: Only update cost breakdown preview if a recipe is loaded for summary
    if (loadedRecipeForSummary) {
        updateCostBreakdownPreview();
    }
}

// NEW: Separate function to update loaded recipe summary
function updateLoadedRecipeSummary() {
    if (loadedRecipeForSummary) {
        updateSummaryWithLoadedRecipe(loadedRecipeForSummary);
    }
}

// Update summary section - FIXED TAX CALCULATIONS
function updateSummary(rawMaterialsCost, directLaborCost, totalCost, scaledServings) {
    const markup = parseFloat(markupInput.value) || 0;
    const tax = parseFloat(taxInput.value) || 0;
    const vat = parseFloat(vatInput.value) || 0;

    // Prevent division by zero
    if (scaledServings <= 0) scaledServings = 1;
    
    const costPerServing = totalCost / scaledServings;
    
    // Calculate selling price BEFORE tax (for cost percentages)
    const sellingPriceBeforeTax = costPerServing * (1 + markup / 100);
    
    // Calculate selling price AFTER tax (for customer price)
    const sellingPriceAfterTax = sellingPriceBeforeTax * (1 + (tax + vat) / 100);

    // Calculate percentages based on selling price BEFORE tax (industry standard)
    const foodCostPercent = sellingPriceBeforeTax > 0 ? (rawMaterialsCost / scaledServings / sellingPriceBeforeTax) * 100 : 0;
    const laborCostPercent = sellingPriceBeforeTax > 0 ? (directLaborCost / scaledServings / sellingPriceBeforeTax) * 100 : 0;
    const totalCostPercent = sellingPriceBeforeTax > 0 ? (totalCost / scaledServings / sellingPriceBeforeTax) * 100 : 0;
    const grossProfitPercent = sellingPriceBeforeTax > 0 ? 100 - totalCostPercent : 0;

    // Calculate batch profit using selling price BEFORE tax
    const batchRevenue = sellingPriceBeforeTax * scaledServings;
    const batchProfit = batchRevenue - totalCost;
    const batchProfitMargin = batchRevenue > 0 ? (batchProfit / batchRevenue) * 100 : 0;

    // NEW: Update servings display
    summaryServingsDisplay.textContent = scaledServings;

    summaryRawMaterialsCost.textContent = `${currency}${rawMaterialsCost.toFixed(2)}`;
    summaryDirectLaborCost.textContent = `${currency}${directLaborCost.toFixed(2)}`;
    summaryTotalCost.textContent = `${currency}${totalCost.toFixed(2)}`;
    summaryCostServing.textContent = `${currency}${costPerServing.toFixed(2)}`;
    
    // Show selling price AFTER tax to customer
    summarySellingPrice.textContent = `${currency}${sellingPriceAfterTax.toFixed(2)}`;
    
    summaryFoodCost.textContent = `${foodCostPercent.toFixed(1)}%`;
    summaryLaborCostPercent.textContent = `${laborCostPercent.toFixed(1)}%`;
    summaryTotalCostPercent.textContent = `${totalCostPercent.toFixed(1)}%`;
    summaryGrossProfit.textContent = `${grossProfitPercent.toFixed(1)}%`;

    // Update batch profit analysis (using pre-tax revenue)
    summaryBatchRevenue.textContent = `${currency}${batchRevenue.toFixed(2)}`;
    summaryBatchProfit.textContent = `${currency}${batchProfit.toFixed(2)}`;
    summaryBatchProfitMargin.textContent = `${batchProfitMargin.toFixed(1)}%`;
}

// NEW: Update summary with loaded recipe data
function updateSummaryWithLoadedRecipe(recipe) {
    const batchScale = parseFloat(batchScaleInput.value) || 1;
    
    // Calculate totals from the loaded recipe
    let rawMaterialsTotal = recipe.rawMaterialItems.reduce((total, item) => {
        return total + (item.quantity * item.unitCost * (item.yield / 100));
    }, 0);

    let directLaborTotal = recipe.directLaborItems.reduce((total, item) => {
        return total + (item.quantity * item.unitCost);
    }, 0);

    // Scale the totals
    rawMaterialsTotal *= batchScale;
    directLaborTotal *= batchScale;
    const totalCost = rawMaterialsTotal + directLaborTotal;
    const servings = recipe.servings || 1;
    const scaledServings = servings * batchScale;
    
    // Calculate with corrected tax logic
    const markup = parseFloat(markupInput.value) || 0;
    const tax = parseFloat(taxInput.value) || 0;
    const vat = parseFloat(vatInput.value) || 0;
    
    const costPerServing = totalCost / scaledServings;
    const sellingPriceBeforeTax = costPerServing * (1 + markup / 100);
    const sellingPriceAfterTax = sellingPriceBeforeTax * (1 + (tax + vat) / 100);
    
    const batchRevenue = sellingPriceBeforeTax * scaledServings;
    const batchProfit = batchRevenue - totalCost;
    const batchProfitMargin = batchRevenue > 0 ? (batchProfit / batchRevenue) * 100 : 0;
    
    // Update servings display
    summaryServingsDisplay.textContent = scaledServings;
    
    // Update summary with calculated values
    summaryRawMaterialsCost.textContent = `${currency}${rawMaterialsTotal.toFixed(2)}`;
    summaryDirectLaborCost.textContent = `${currency}${directLaborTotal.toFixed(2)}`;
    summaryTotalCost.textContent = `${currency}${totalCost.toFixed(2)}`;
    summaryCostServing.textContent = `${currency}${costPerServing.toFixed(2)}`;
    summarySellingPrice.textContent = `${currency}${sellingPriceAfterTax.toFixed(2)}`;
    
    // Calculate percentages using selling price BEFORE tax
    const foodCostPercent = sellingPriceBeforeTax > 0 ? (rawMaterialsTotal / scaledServings / sellingPriceBeforeTax) * 100 : 0;
    const laborCostPercent = sellingPriceBeforeTax > 0 ? (directLaborTotal / scaledServings / sellingPriceBeforeTax) * 100 : 0;
    const totalCostPercent = sellingPriceBeforeTax > 0 ? (totalCost / scaledServings / sellingPriceBeforeTax) * 100 : 0;
    const grossProfitPercent = sellingPriceBeforeTax > 0 ? 100 - totalCostPercent : 0;
    
    summaryFoodCost.textContent = `${foodCostPercent.toFixed(1)}%`;
    summaryLaborCostPercent.textContent = `${laborCostPercent.toFixed(1)}%`;
    summaryTotalCostPercent.textContent = `${totalCostPercent.toFixed(1)}%`;
    summaryGrossProfit.textContent = `${grossProfitPercent.toFixed(1)}%`;
    
    // Update batch profit analysis
    summaryBatchRevenue.textContent = `${currency}${batchRevenue.toFixed(2)}`;
    summaryBatchProfit.textContent = `${currency}${batchProfit.toFixed(2)}`;
    summaryBatchProfitMargin.textContent = `${batchProfitMargin.toFixed(1)}%`;
}

// Generate print preview
function generatePrintPreview() {
    const recipeName = recipeNameInput.value || "Unnamed Recipe";
    const totalCost = calculateCurrentRecipeTotalCost();
    const markup = parseFloat(markupInput.value) || 0;
    const tax = parseFloat(taxInput.value) || 0;
    const vat = parseFloat(vatInput.value) || 0;
    const servings = parseFloat(servingsInput.value) || 1;
    const batchScale = parseFloat(batchScaleInput.value) || 1;
    
    const scaledServings = servings * batchScale;
    
    // Calculate raw materials and direct labor totals
    let rawMaterialsCost = 0;
    recipeBody.querySelectorAll("tr").forEach((row) => {
        const q = parseFloat(row.children[1].querySelector("input").value) || 0;
        const uc = parseFloat(row.children[3].querySelector("input").value) || 0;
        const y = parseFloat(row.children[2].querySelector("input").value) || 100;
        rawMaterialsCost += q * uc * (y / 100);
    });
    
    let directLaborCost = 0;
    directLaborRecipeBody.querySelectorAll("tr").forEach((row) => {
        const time = parseFloat(row.children[1].querySelector("input").value) || 0;
        const rate = parseFloat(row.children[2].querySelector("input").value) || 0;
        directLaborCost += time * rate;
    });
    
    const scaledRawMaterialsCost = rawMaterialsCost * batchScale;
    const scaledDirectLaborCost = directLaborCost * batchScale;
    
    const costPerServing = totalCost / scaledServings;
    
    // Calculate selling prices
    const sellingPriceBeforeTax = costPerServing * (1 + markup / 100);
    const sellingPriceAfterTax = sellingPriceBeforeTax * (1 + (tax + vat) / 100);
    
    // Calculate percentages using selling price BEFORE tax
    const foodCostPercent = sellingPriceBeforeTax > 0 ? (scaledRawMaterialsCost / scaledServings / sellingPriceBeforeTax) * 100 : 0;
    const laborCostPercent = sellingPriceBeforeTax > 0 ? (scaledDirectLaborCost / scaledServings / sellingPriceBeforeTax) * 100 : 0;
    const totalCostPercent = sellingPriceBeforeTax > 0 ? (totalCost / scaledServings / sellingPriceBeforeTax) * 100 : 0;
    const grossProfitPercent = sellingPriceBeforeTax > 0 ? 100 - totalCostPercent : 0;

    // Batch profit calculations using selling price BEFORE tax
    const batchRevenue = sellingPriceBeforeTax * scaledServings;
    const batchProfit = batchRevenue - totalCost;
    const batchProfitMargin = batchRevenue > 0 ? (batchProfit / batchRevenue) * 100 : 0;

    let printHTML = `
        <div class="print-header">
            <h1>${escapeHtml(recipeName)} - Costing Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()} • ${scaledServings} serving${scaledServings !== 1 ? 's' : ''} (${batchScale}x batch)</p>
        </div>

        <div class="print-section">
            <h3>Raw Materials</h3>
            <table class="cost-breakdown">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Yield %</th>
                        <th>Unit Cost</th>
                        <th>Total Cost</th>
                    </tr>
                </thead>
                <tbody>
    `;

    // Add raw materials rows
    recipeBody.querySelectorAll("tr").forEach(row => {
        const itemName = row.children[0].querySelector("input").value;
        const quantity = parseFloat(row.children[1].querySelector("input").value) || 0;
        const quantityUnit = row.children[1].querySelector(".quantity-unit").textContent;
        const yieldPct = parseFloat(row.children[2].querySelector("input").value) || 100;
        const unitCost = parseFloat(row.children[3].querySelector("input").value) || 0;
        const unitCostUnit = row.children[3].querySelector(".unit-display").textContent;
        const totalCost = (quantity * unitCost * (yieldPct / 100)) * batchScale;
        
        printHTML += `
            <tr>
                <td>${escapeHtml(itemName)}</td>
                <td>${(quantity * batchScale).toFixed(2)} ${quantityUnit}</td>
                <td>${parseFloat(yieldPct).toFixed(1)}%</td>
                <td>${currency}${parseFloat(unitCost).toFixed(2)}${unitCostUnit}</td>
                <td>${currency}${totalCost.toFixed(2)}</td>
            </tr>
        `;
    });

    printHTML += `
                </tbody>
                <tfoot>
                    <tr class="summary-highlight">
                        <td colspan="4">Raw Materials Subtotal</td>
                        <td>${currency}${scaledRawMaterialsCost.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>

        <div class="print-section">
            <h3>Direct Labor</h3>
            <table class="cost-breakdown">
                <thead>
                    <tr>
                        <th>Labor Item</th>
                        <th>Time Required</th>
                        <th>Rate</th>
                        <th>Total Cost</th>
                    </tr>
                </thead>
                <tbody>
    `;

    // Add direct labor rows
    directLaborRecipeBody.querySelectorAll("tr").forEach(row => {
        const laborName = row.children[0].querySelector("input").value;
        const timeRequired = parseFloat(row.children[1].querySelector("input").value) || 0;
        const timeUnit = row.children[1].querySelector(".quantity-unit").textContent;
        const rate = parseFloat(row.children[2].querySelector("input").value) || 0;
        const rateUnit = row.children[2].querySelector(".unit-display-small").textContent;
        const totalCost = (timeRequired * rate) * batchScale;
        
        printHTML += `
            <tr>
                <td>${escapeHtml(laborName)}</td>
                <td>${(timeRequired * batchScale).toFixed(2)} ${timeUnit}</td>
                <td>${currency}${parseFloat(rate).toFixed(2)}${rateUnit}</td>
                <td>${currency}${totalCost.toFixed(2)}</td>
            </tr>
        `;
    });

    printHTML += `
                </tbody>
                <tfoot>
                    <tr class="summary-highlight">
                        <td colspan="3">Direct Labor Subtotal</td>
                        <td>${currency}${scaledDirectLaborCost.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>

        <div class="print-section">
            <h3>Cost Summary</h3>
            <table class="cost-breakdown">
                <tbody>
                    <tr>
                        <td>Raw Materials Cost:</td>
                        <td>${currency}${scaledRawMaterialsCost.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Direct Labor Cost:</td>
                        <td>${currency}${scaledDirectLaborCost.toFixed(2)}</td>
                    </tr>
                    <tr class="totals-row">
                        <td><strong>Total Recipe Cost:</strong></td>
                        <td><strong>${currency}${totalCost.toFixed(2)}</strong></td>
                    </tr>
                    <tr>
                        <td>Servings:</td>
                        <td>${scaledServings}</td>
                    </tr>
                    <tr>
                        <td>Cost per Serving (Before Tax):</td>
                        <td>${currency}${costPerServing.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Selling Price (After Tax):</td>
                        <td>${currency}${sellingPriceAfterTax.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="print-section">
            <h3>Profit Analysis</h3>
            <table class="cost-breakdown">
                <tbody>
                    <tr>
                        <td>Food Cost %:</td>
                        <td>${foodCostPercent.toFixed(1)}%</td>
                    </tr>
                    <tr>
                        <td>Labor Cost %:</td>
                        <td>${laborCostPercent.toFixed(1)}%</td>
                    </tr>
                    <tr>
                        <td>Total Cost %:</td>
                        <td>${totalCostPercent.toFixed(1)}%</td>
                    </tr>
                    <tr class="summary-highlight">
                        <td><strong>Gross Profit Margin %:</strong></td>
                        <td><strong>${grossProfitPercent.toFixed(1)}%</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="print-section">
            <h3>Batch Production Analysis</h3>
            <table class="cost-breakdown">
                <tbody>
                    <tr>
                        <td>Batch Scale:</td>
                        <td>${batchScale}x</td>
                    </tr>
                    <tr>
                        <td>Total Servings:</td>
                        <td>${scaledServings}</td>
                    </tr>
                    <tr>
                        <td>Batch Revenue (Before Tax):</td>
                        <td>${currency}${batchRevenue.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Batch Cost:</td>
                        <td>${currency}${totalCost.toFixed(2)}</td>
                    </tr>
                    <tr class="summary-highlight">
                        <td><strong>Batch Profit:</strong></td>
                        <td><strong>${currency}${batchProfit.toFixed(2)}</strong></td>
                    </tr>
                    <tr class="summary-highlight">
                        <td><strong>Batch Profit Margin:</strong></td>
                        <td><strong>${batchProfitMargin.toFixed(1)}%</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="print-footer">
            <p>Generated by ProfitPerPlate - Know your profit in every plate</p>
        </div>
    `;

    printPreviewContent.innerHTML = printHTML;
}

// Print costing report
function printCostingReport() {
    // Close modal first
    closePrintPreview();
    
    // Wait a moment for modal to close, then print
    setTimeout(() => {
        // Create a new window with the print content
        const printWindow = window.open('', '_blank');
        const printContent = printPreviewContent.innerHTML;
        
        printWindow.document.write(`
            <!DOCTYPE html>
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
                    .print-footer { margin-top: 30px; font-size: 10pt; color: #666; text-align: center; border-top: 1px solid #ddd; padding-top: 10px; }
                    @media print {
                        body { margin: 0; padding: 15px; }
                        .print-section { page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                ${printContent}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        
        // Wait for content to load, then print
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }, 100);
}

// NEW: Populate summary recipe selector
function populateSummaryRecipeSelect() {
    summaryRecipeSelect.innerHTML = '<option value="">Select a recipe to analyze...</option>';
    
    const mainRecipes = getCurrentRecipes().filter(recipe => recipe.type === 'main');
    mainRecipes.forEach(recipe => {
        const option = document.createElement('option');
        option.value = recipe.id;
        option.textContent = `${recipe.name} (${formatCurrency(recipe.totalCost)})`;
        summaryRecipeSelect.appendChild(option);
    });
}

// NEW: Load recipe for summary analysis
function loadRecipeForSummary() {
    const recipeId = summaryRecipeSelect.value;
    if (!recipeId) {
        alert("Please select a recipe to load");
        return;
    }

    const recipe = getCurrentRecipes().find(r => r.id === parseInt(recipeId));
    if (!recipe) return;

    loadedRecipeForSummary = recipe;
    
    // Update display
    currentRecipeNameDisplay.textContent = recipe.name;
    loadedRecipeTotalCost.textContent = `${currency}${recipe.totalCost.toFixed(2)}`;
    loadedRecipeServings.textContent = recipe.servings || 1;
    loadedRecipeItemCount.textContent = `${recipe.rawMaterialItems.length + recipe.directLaborItems.length} items`;
    
    loadedRecipeDisplay.classList.remove('hidden');
    
    // Update summary with loaded recipe data
    updateSummaryWithLoadedRecipe(recipe);
    
    // NEW: Update cost breakdown preview with loaded recipe
    updateCostBreakdownPreview();
}

// NEW: Update cost breakdown preview with specific recipe (NO sub-recipe expansion)
function updateCostBreakdownPreviewWithRecipe(recipe) {
    const batchScale = parseFloat(batchScaleInput.value) || 1;
    
    // Use recipe items directly - NO expansion
    const rawMaterialItems = recipe.rawMaterialItems || [];
    const directLaborItems = recipe.directLaborItems || [];
    
    // Update raw materials preview
    rawMaterialsCount.textContent = `${rawMaterialItems.length} items`;
    
    let rawMaterialsSubtotal = 0;
    rawMaterialsPreviewBody.innerHTML = '';
    
    rawMaterialItems.forEach(item => {
        const scaledQuantity = item.quantity * batchScale;
        const totalCost = scaledQuantity * item.unitCost * (item.yield / 100);
        rawMaterialsSubtotal += totalCost;
        
        const rowElement = document.createElement('tr');
        rowElement.innerHTML = `
            <td>${escapeHtml(item.name)}${item.type === 'sub-recipe' ? ' <span class="sub-recipe-badge">SUB</span>' : ''}</td>
            <td>${scaledQuantity.toFixed(2)} ${item.unit}</td>
            <td>${parseFloat(item.yield).toFixed(1)}%</td>
            <td>${currency}${parseFloat(item.unitCost).toFixed(2)}/${item.unit}</td>
            <td>${currency}${totalCost.toFixed(2)}</td>
        `;
        rawMaterialsPreviewBody.appendChild(rowElement);
    });
    
    rawMaterialsPreviewTotal.textContent = `${currency}${rawMaterialsSubtotal.toFixed(2)}`;
    rawMaterialsPreviewSubtotal.textContent = `${currency}${rawMaterialsSubtotal.toFixed(2)}`;
    
    // Update direct labor preview
    directLaborCount.textContent = `${directLaborItems.length} items`;
    
    let directLaborSubtotal = 0;
    directLaborPreviewBody.innerHTML = '';
    
    directLaborItems.forEach(item => {
        const scaledTime = item.quantity * batchScale;
        const totalCost = scaledTime * item.unitCost;
        directLaborSubtotal += totalCost;
        
        const rowElement = document.createElement('tr');
        rowElement.innerHTML = `
            <td>${escapeHtml(item.name)}</td>
            <td>${scaledTime.toFixed(2)} ${item.unit}</td>
            <td>${currency}${parseFloat(item.unitCost).toFixed(2)}/${item.unit}</td>
            <td>${currency}${totalCost.toFixed(2)}</td>
        `;
        directLaborPreviewBody.appendChild(rowElement);
    });
    
    directLaborPreviewTotal.textContent = `${currency}${directLaborSubtotal.toFixed(2)}`;
    directLaborPreviewSubtotal.textContent = `${currency}${directLaborSubtotal.toFixed(2)}`;
}

// NEW: Update cost breakdown preview (only shows loaded recipe, not current recipe)
function updateCostBreakdownPreview() {
    // Only show data when a recipe is loaded for summary
    if (loadedRecipeForSummary) {
        updateCostBreakdownPreviewWithRecipe(loadedRecipeForSummary);
    } else {
        clearCostBreakdownPreview();
    }
}

// NEW: Clear cost breakdown preview
function clearCostBreakdownPreview() {
    rawMaterialsCount.textContent = "0 items";
    directLaborCount.textContent = "0 items";
    rawMaterialsPreviewTotal.textContent = `${currency}0.00`;
    directLaborPreviewTotal.textContent = `${currency}0.00`;
    rawMaterialsPreviewSubtotal.textContent = `${currency}0.00`;
    directLaborPreviewSubtotal.textContent = `${currency}0.00`;
    rawMaterialsPreviewBody.innerHTML = '';
    directLaborPreviewBody.innerHTML = '';
}

// Generate comprehensive help content
function generateCompleteHelpContent() {
    let html = `
        <div style="margin-bottom: var(--space-xl);">
            <p><strong>Welcome to ProfitPerPlate!</strong> This complete guide explains every field in simple terms with practical examples for beginners.</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-xl);">
            <div>
                <h4 style="color: var(--primary); border-bottom: 1px solid var(--border); padding-bottom: var(--space-sm);">Raw Materials & Recipe Fields</h4>
    `;

    // Add raw material and recipe fields
    const rawMaterialFields = [
        'ingredientName', 'ingredientCategory', 'purchasePrice', 'purchaseQuantity', 
        'purchaseUnit', 'costPerUnit', 'selectItem', 'quantity', 'yield', 'servings'
    ];
    
    rawMaterialFields.forEach(fieldKey => {
        const field = fieldDefinitions[fieldKey];
        if (field) {
            html += `
                <div style="margin-bottom: var(--space-lg); padding-bottom: var(--space-lg); border-bottom: 1px dashed var(--border);">
                    <strong>${field.title}</strong>
                    <p style="margin: var(--space-sm) 0; font-size: 13px;">${field.content}</p>
                    <div class="field-example">
                        <strong>Example:</strong> ${field.example}
                    </div>
                </div>
            `;
        }
    });

    html += `
            </div>
            <div>
                <h4 style="color: var(--primary); border-bottom: 1px solid var(--border); padding-bottom: var(--space-sm);">Direct Labor & Business Fields</h4>
    `;

    // Add direct labor and business fields
    const laborFields = [
        'laborName', 'shiftRate', 'shiftDuration', 'timeUnit', 'costUnit',
        'markup', 'tax', 'vat', 'batchScale', 'subRecipeName', 'subRecipeCategory',
        'subRecipeYieldQuantity'
    ];
    
    laborFields.forEach(fieldKey => {
        const field = fieldDefinitions[fieldKey];
        if (field) {
            html += `
                <div style="margin-bottom: var(--space-lg); padding-bottom: var(--space-lg); border-bottom: 1px dashed var(--border);">
                    <strong>${field.title}</strong>
                    <p style="margin: var(--space-sm) 0; font-size: 13px;">${field.content}</p>
                    <div class="field-example">
                        <strong>Example:</strong> ${field.example}
                    </div>
                </div>
            `;
        }
    });

    html += `
            </div>
        </div>

        <div style="margin-top: var(--space-xl); padding: var(--space-lg); background: var(--background); border-radius: var(--radius-lg);">
            <h4 style="color: var(--primary); margin-top: 0;">Quick Tip for Beginners</h4>
            <p>Start by adding your raw materials with their purchase details and direct labor items with shift details. Then create recipes by adding those items with the quantities or time required. Finally, set your desired markup and number of servings to see your profit per plate!</p>
            <p><strong>Remember:</strong> Accurate costs for both materials and labor lead to accurate profit calculations. Don't forget to account for yield (waste) for raw materials.</p>
        </div>
    `;

    return html;
}

// Show field-specific help with examples
function showFieldHelp(fieldKey, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    const definition = fieldDefinitions[fieldKey];
    if (definition) {
        helpModalTitle.textContent = definition.title + " - Field Definition";
        helpModalContent.innerHTML = `
            <p><strong>${definition.title}</strong> — ${definition.content}</p>
            <div class="field-example">
                <strong>Example:</strong> ${definition.example}
            </div>
            <div style="margin-top: var(--space-lg); padding: var(--space-md); background: rgba(45, 90, 61, 0.05); border-radius: var(--radius-md);">
                <strong>💡 Tip:</strong> Look for the "?" buttons next to other fields for more explanations. 
                Use the main "?" button in the header for a complete field guide.
            </div>
        `;
    } else {
        helpModalTitle.textContent = "Field Definitions";
        helpModalContent.innerHTML = `<p>Definition not found for "${fieldKey}". Please refer to the general help.</p>`;
    }
    helpModal.classList.remove("hidden");
}

// Update sub-recipe unit options based on category
function updateSubRecipeUnitOptions() {
    const category = subRecipeCategory.value;
    
    [subRecipeYieldUnit, subRecipeCostUnit].forEach(unitSelect => {
        unitSelect.innerHTML = '';
        
        categoryUnits[category].forEach((unit) => {
            const option = document.createElement("option");
            option.value = unit;
            option.textContent = unit;
            unitSelect.appendChild(option);
        });
    });
    
    updateSubRecipeCostDisplay();
}

// Update sub-recipe cost display
function updateSubRecipeCostDisplay() {
    const totalCost = calculateCurrentRecipeTotalCost();
    const yieldQty = parseFloat(subRecipeYieldQuantity.value) || 1;
    const yieldUnit = subRecipeYieldUnit.value;
    const costUnit = subRecipeCostUnit.value;
    
    let costPerUnit = 0;
    
    if (yieldQty > 0) {
        const costPerBaseUnit = totalCost / (yieldQty * UNIT_CONVERSIONS[yieldUnit]);
        costPerUnit = costPerBaseUnit * UNIT_CONVERSIONS[costUnit];
    }
    
    currentRecipeCostDisplay.textContent = `${currency}${totalCost.toFixed(2)}`;
    subRecipeCostPerUnit.value = costPerUnit.toFixed(4);
    costPerOutputUnit.textContent = `${currency}${costPerUnit.toFixed(4)} per ${costUnit}`;
}

// Calculate current recipe total cost (raw materials + direct labor)
function calculateCurrentRecipeTotalCost() {
    const batchScale = parseFloat(batchScaleInput.value) || 1;
    
    let rawMaterialsTotal = 0;
    let directLaborTotal = 0;
    
    recipeBody.querySelectorAll("tr").forEach((row) => {
        const q = parseFloat(row.children[1].querySelector("input").value) || 0;
        const uc = parseFloat(row.children[3].querySelector("input").value) || 0;
        const y = parseFloat(row.children[2].querySelector("input").value) || 100;
        rawMaterialsTotal += q * uc * (y / 100);
    });
    
    directLaborRecipeBody.querySelectorAll("tr").forEach((row) => {
        const time = parseFloat(row.children[1].querySelector("input").value) || 0;
        const rate = parseFloat(row.children[2].querySelector("input").value) || 0;
        directLaborTotal += time * rate;
    });
    
    return parseFloat(((rawMaterialsTotal + directLaborTotal) * batchScale).toFixed(2));
}

// FIXED: Tab Management with sidebar support - Prevent auto-display of current recipe in summary
function switchTab(tabName) {
    // Update desktop sidebar
    document.querySelectorAll(".sidebar-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.tab === tabName);
    });

    // Update mobile tabs
    document.querySelectorAll(".mobile-tabs .tab-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.tab === tabName);
    });

    document.querySelectorAll(".tab-content").forEach((tab) => {
        tab.classList.toggle("active", tab.id === `${tabName}-tab`);
    });

    // Only update cost breakdown preview when switching to summary tab if a recipe is loaded
    if (tabName === 'summary') {
        if (loadedRecipeForSummary) {
            updateCostBreakdownPreview();
        } else {
            clearCostBreakdownPreview();
        }
    }
}

// Raw Material Management
function openRawMaterialModal(rawMaterial = null) {
    const modal = document.getElementById("rawMaterialModal");
    const title = document.getElementById("rawMaterialModalTitle");

    updateUnitOptions();

    if (rawMaterial) {
        title.textContent = "Edit Raw Material";
        populateRawMaterialForm(rawMaterial);
        editingItem = { type: 'rawMaterial', id: rawMaterial.id, data: rawMaterial };
    } else {
        title.textContent = "Add New Raw Material";
        document.getElementById("rawMaterialForm").reset();
        updateCostPerUnit();
        editingItem = { type: null, id: null, data: null };
    }

    modal.classList.remove("hidden");
}

function closeRawMaterialModal() {
    document.getElementById("rawMaterialModal").classList.add("hidden");
    document.getElementById("rawMaterialForm").reset();
    editingItem = { type: null, id: null, data: null };
}

// Update unit options based on selected category
function updateUnitOptions() {
    const category = document.getElementById(
        "modalRawMaterialCategory"
    ).value;
    const unitSelect = document.getElementById("modalRawMaterialUnit");
    const costUnitSelect = document.getElementById("modalCostUnit");

    unitSelect.innerHTML = "";
    costUnitSelect.innerHTML = "";

    categoryUnits[category].forEach((unit) => {
        const option = document.createElement("option");
        option.value = unit;
        option.textContent = unit;
        unitSelect.appendChild(option);

        const costOption = document.createElement("option");
        costOption.value = unit;
        costOption.textContent = unit;
        costUnitSelect.appendChild(costOption);
    });

    updateCostPerUnit();
}

// Calculate and display cost per unit for raw materials
function updateCostPerUnit() {
    const price =
        parseFloat(document.getElementById("modalRawMaterialPrice").value) ||
        0;
    const quantity =
        parseFloat(
            document.getElementById("modalRawMaterialQuantity").value
        ) || 1;
    const purchaseUnit = document.getElementById(
        "modalRawMaterialUnit"
    ).value;
    const costUnit = document.getElementById("modalCostUnit").value;

    let costPerUnit = 0;
    let calculationSteps = [];

    if (price > 0 && quantity > 0) {
        const costPerPurchaseUnit = price / quantity;
        calculationSteps.push(
            `Cost per ${purchaseUnit}: ${price.toFixed(2)} ${currency} ÷ ${quantity.toFixed(2)} = ${costPerPurchaseUnit.toFixed(4)} ${currency}/${purchaseUnit}`
        );

        if (purchaseUnit !== costUnit) {
            const conversionFactor =
                UNIT_CONVERSIONS[costUnit] / UNIT_CONVERSIONS[purchaseUnit];
            costPerUnit = costPerPurchaseUnit * conversionFactor;
            calculationSteps.push(
                `Convert to ${costUnit}: ${costPerPurchaseUnit.toFixed(4)} ${currency}/${purchaseUnit} × ${conversionFactor.toFixed(6)} = ${costPerUnit.toFixed(4)} ${currency}/${costUnit}`
            );
        } else {
            costPerUnit = costPerPurchaseUnit;
            calculationSteps.push(
                `No conversion needed (already in ${costUnit})`
            );
        }
    }

    document.getElementById("modalCostPerUnit").value =
        costPerUnit.toFixed(4);

    updateCalculationDisplay(calculationSteps, costPerUnit, costUnit);
}

// Update cost per unit when user changes the cost unit
function updateCostPerUnitValue() {
    updateCostPerUnit();
}

// Update the calculation display with step-by-step breakdown
function updateCalculationDisplay(steps, finalCost, costUnit) {
    const calculationDetails = document.getElementById(
        "costCalculationDetails"
    );

    if (steps.length > 0) {
        let html = `<div><strong>Calculation Steps:</strong></div>`;
        steps.forEach((step) => {
            html += `<div style="margin: var(--space-xs) 0; padding-left: var(--space-md);">• ${step}</div>`;
        });
        html += `<div style="margin-top: var(--space-sm); font-weight: bold;">Final Cost: ${finalCost.toFixed(4)} ${currency}/${costUnit}</div>`;
        calculationDetails.innerHTML = html;
    } else {
        calculationDetails.textContent =
            "Enter purchase details to see calculation";
    }
}

function populateRawMaterialForm(rawMaterial) {
    document.getElementById("modalRawMaterialName").value = rawMaterial.name;
    document.getElementById("modalRawMaterialCategory").value =
        rawMaterial.category;

    updateUnitOptions();

    document.getElementById("modalRawMaterialPrice").value =
        rawMaterial.price.toFixed(2);
    document.getElementById("modalRawMaterialQuantity").value =
        rawMaterial.quantity.toFixed(2);
    document.getElementById("modalRawMaterialUnit").value = rawMaterial.unit;
    document.getElementById("modalCostPerUnit").value =
        rawMaterial.costPerUnit.toFixed(4);
    document.getElementById("modalCostUnit").value = rawMaterial.costUnit;

    updateCostPerUnit();
}

// Utility functions
function formatCurrency(amount) {
    return `${currency}${parseFloat(amount).toFixed(2)}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add auth state update function
function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');
    const userEmail = document.getElementById('userEmail');
    
    if (currentUser) {
        if (authButtons) authButtons.classList.add('hidden');
        if (userInfo) userInfo.classList.remove('hidden');
        if (userEmail) userEmail.textContent = currentUser.email;
        
        // Load user data
        loadUserData();
    } else {
        if (authButtons) authButtons.classList.remove('hidden');
        if (userInfo) userInfo.classList.add('hidden');
        
        // Clear data when logged out
        clearLocalData();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);