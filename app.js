// ==========================================
// SUPABASE CONFIGURATION
// ==========================================
const SUPABASE_URL = 'https://mhmvygubhzgmwovhzbdn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_PeRJyArsWXjzro5thtOiVA_18BvrLBZ';
let supabaseClient = null;

try {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (err) {
  console.warn('Supabase initialization fallback to local storage mode.');
}

// ==========================================
// VIP FAST CHARGER PACKAGES DATA
// ==========================================
const VIP_PACKAGES = [
  { id: 1, name: 'Shiplus VIP-1', price: 3800, daily: 800, days: 40, total: 32000, commission: 875, limit: 1, image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=400&q=80' },
  { id: 2, name: 'Shiplus VIP-2', price: 7500, daily: 1350, days: 40, total: 54000, commission: 1875, limit: 1, image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80' },
  { id: 3, name: 'Shiplus VIP-3', price: 17500, daily: 3200, days: 40, total: 128000, commission: 4375, limit: 3, image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=400&q=80' },
  { id: 4, name: 'Shiplus VIP-4', price: 37500, daily: 7125, days: 40, total: 285000, commission: 9375, limit: 3, image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80' },
  { id: 5, name: 'Shiplus VIP-5', price: 75000, daily: 15000, days: 40, total: 600000, commission: 18750, limit: 3, image: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=400&q=80' },
  { id: 6, name: 'Shiplus VIP-6', price: 150000, daily: 31500, days: 40, total: 1260000, commission: 37500, limit: 3, image: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=400&q=80' },
  { id: 7, name: 'Shiplus VIP-7', price: 350000, daily: 70000, days: 40, total: 2800000, commission: 87500, limit: 3, image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=400&q=80' },
  { id: 8, name: 'Shiplus VIP-8', price: 550000, daily: 126000, days: 40, total: 5040000, commission: 137500, limit: 3, image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80' },
  { id: 9, name: 'Shiplus VIP-9', price: 750000, daily: 180000, days: 40, total: 7200000, commission: 187500, limit: 3, image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=400&q=80' },
  { id: 10, name: 'Shiplus VIP-10', price: 950000, daily: 237500, days: 40, total: 9500000, commission: 237500, limit: 3, image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80' }
];

// ==========================================
// APPLICATION STATE
// ==========================================
let currentUser = null;
let state = {
  user: {
    id: 'usr_101',
    balance: 1000,
    lastCheckin: null,
    purchases: {},
    redeemedCodes: [],
    inviter: null,     
    bankAccount: null  
  },
  allUsersNetwork: {}, 
  transactions: [],
  activeInvestments: [],
  giftCodes: [],
  registeredUsersList: [], // Tracks all registered users for admin view
  isAdminView: false
};

const ADMIN_EMAIL = 'omoopeola1@gmail.com';

function loadLocalState() {
  const saved = localStorage.getItem('shiplus_global_state');
  if (saved) {
    try { state = JSON.parse(saved); } catch(e) {}
  }
  const savedSession = localStorage.getItem('shiplus_session');
  if (savedSession) {
    currentUser = JSON.parse(savedSession);
    // Load specific user profile if stored
    const userProfile = localStorage.getItem('shiplus_user_' + currentUser.email);
    if (userProfile) {
      try { state.user = JSON.parse(userProfile); } catch(e) {}
    }
  }
}

function saveLocalState() {
  localStorage.setItem('shiplus_global_state', JSON.stringify({
    transactions: state.transactions,
    giftCodes: state.giftCodes,
    allUsersNetwork: state.allUsersNetwork,
    registeredUsersList: state.registeredUsersList
  }));
  if (currentUser) {
    localStorage.setItem('shiplus_user_' + currentUser.email, JSON.stringify(state.user));
    localStorage.setItem('shiplus_inv_' + currentUser.email, JSON.stringify(state.activeInvestments));
  }
}

function loadUserData(email) {
  const userProfile = localStorage.getItem('shiplus_user_' + email);
  if (userProfile) {
    try { state.user = JSON.parse(userProfile); } catch(e) {}
  } else {
    state.user = {
      id: 'usr_' + Date.now(),
      balance: 1000,
      lastCheckin: null,
      purchases: {},
      redeemedCodes: [],
      inviter: null,
      bankAccount: null
    };
  }
  const userInvs = localStorage.getItem('shiplus_inv_' + email);
  if (userInvs) {
    try { state.activeInvestments = JSON.parse(userInvs); } catch(e) {}
  } else {
    state.activeInvestments = [];
  }
}

// ==========================================
// AUTOMATIC 24H INCOME DROP ENGINE
// ==========================================
function checkAndProcessAutomaticIncome() {
  const now = Date.now();
  const DAY_IN_MS = 24 * 60 * 60 * 1000;
  let totalDropped = 0;

  state.activeInvestments.forEach(inv => {
    if (inv.daysClaimed < inv.daysTotal) {
      const elapsedMs = now - inv.lastClaimTimestamp;
      const dueDays = Math.floor(elapsedMs / DAY_IN_MS);

      if (dueDays > 0) {
        const playableDays = Math.min(dueDays, inv.daysTotal - inv.daysClaimed);
        const incomeAmount = playableDays * inv.dailyIncome;
        
        inv.daysClaimed += playableDays;
        inv.lastClaimTimestamp += (playableDays * DAY_IN_MS);
        totalDropped += incomeAmount;
      }
    }
  });

  if (totalDropped > 0) {
    state.user.balance += totalDropped;
    state.transactions.unshift({
      id: 'tx_' + now,
      user: currentUser ? currentUser.email : state.user.id,
      type: 'Automatic 24H Return',
      amount: totalDropped,
      fee: 0,
      status: 'Completed',
      date: new Date(now).toISOString()
    });
    saveLocalState();
  }
}

setInterval(() => {
  if (currentUser) {
    loadLocalState();
    checkAndProcessAutomaticIncome();
    render();
  }
}, 5000);

// ==========================================
// AUTHENTICATION LOGIC
// ==========================================
function switchAuthTab(tab) {
  const regForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('loginForm');
  const tabRegBtn = document.getElementById('tabRegisterBtn');
  const tabLoginBtn = document.getElementById('tabLoginBtn');

  if (tab === 'register') {
    regForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    tabRegBtn.className = 'flex-1 py-2 text-xs font-bold rounded-lg transition bg-emerald-600 text-white';
    tabLoginBtn.className = 'flex-1 py-2 text-xs font-bold rounded-lg transition text-slate-400 hover:text-white';
  } else {
    regForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    tabRegBtn.className = 'flex-1 py-2 text-xs font-bold rounded-lg transition text-slate-400 hover:text-white';
    tabLoginBtn.className = 'flex-1 py-2 text-xs font-bold rounded-lg transition bg-emerald-600 text-white';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const fullName = document.getElementById('regFullName').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const password = document.getElementById('regPassword').value;
  
  const urlParams = new URLSearchParams(window.location.search);
  const urlRef = urlParams.get('ref');
  const inputRef = document.getElementById('regRefCode').value.trim().toLowerCase();
  const inviterRef = inputRef || (urlRef ? urlRef.toLowerCase() : null);

  if (supabaseClient) {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    if (error && !error.message.includes('already registered')) {
      alert('Sign up error: ' + error.message);
      return;
    }
  }

  currentUser = { email, fullName };
  localStorage.setItem('shiplus_session', JSON.stringify(currentUser));
  
  loadUserData(email);

  if (inviterRef) {
    state.user.inviter = inviterRef;
    if (!state.allUsersNetwork) state.allUsersNetwork = {};
    state.allUsersNetwork[email] = inviterRef;
  }

  // Add welcome bonus transaction if new
  if (!state.transactions.some(t => t.user === email && t.type === 'Welcome Bonus')) {
    state.user.balance += 1000;
    state.transactions.unshift({
      id: 'tx_bonus_' + Date.now(),
      user: email,
      type: 'Welcome Bonus',
      amount: 1000,
      fee: 0,
      status: 'Completed',
      date: new Date().toISOString()
    });
  }

  // Register user in global user list for admin monitoring
  if (!state.registeredUsersList.some(u => u.email === email)) {
    state.registeredUsersList.push({ email, fullName, joined: new Date().toISOString() });
  }

  saveLocalState();
  showMainApp(true);
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;

  if (supabaseClient) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      alert('Login error: ' + error.message);
      return;
    }
  }

  currentUser = { email, fullName: email.split('@')[0] };
  localStorage.setItem('shiplus_session', JSON.stringify(currentUser));
  
  loadUserData(email);

  if (!state.registeredUsersList.some(u => u.email === email)) {
    state.registeredUsersList.push({ email, fullName: currentUser.fullName, joined: new Date().toISOString() });
    saveLocalState();
  }

  showMainApp(false);
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem('shiplus_session');
  document.getElementById('mainApp').classList.add('hidden');
  document.getElementById('authContainer').classList.remove('hidden');
}

function showMainApp(isNewUser) {
  document.getElementById('authContainer').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');

  const adminNavContainer = document.getElementById('adminNavContainer');
  if (currentUser && currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    adminNavContainer.classList.remove('hidden');
  } else {
    adminNavContainer.classList.add('hidden');
    state.isAdminView = false;
  }

  loadLocalState();
  checkAndProcessAutomaticIncome();
  render();

  if (isNewUser) {
    openModal('welcomeModal');
  }
}

// ==========================================
// NAVIGATION TABS
// ==========================================
function switchTab(tabName) {
  ['dashboard', 'vip', 'team', 'account', 'history'].forEach(t => {
    const content = document.getElementById(`tabContent-${t}`);
    if (content) content.classList.add('hidden');
    
    const topBtn = document.getElementById(`navBtn-${t}`);
    if (topBtn) {
      topBtn.className = 'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-slate-300 hover:bg-slate-800 transition shrink-0 border border-slate-800';
    }
    const botBtn = document.getElementById(`bottomNav-${t}`);
    if (botBtn) {
      botBtn.className = 'flex flex-col items-center text-slate-400 hover:text-white py-1';
    }
  });

  if (state.isAdminView) {
    state.isAdminView = false;
    document.getElementById('adminView').classList.add('hidden');
  }

  const activeContent = document.getElementById(`tabContent-${tabName}`);
  if (activeContent) activeContent.classList.remove('hidden');

  const activeTopBtn = document.getElementById(`navBtn-${tabName}`);
  if (activeTopBtn) {
    activeTopBtn.className = 'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white transition shrink-0 shadow';
  }

  const activeBotBtn = document.getElementById(`bottomNav-${tabName}`);
  if (activeBotBtn) {
    activeBotBtn.className = 'flex flex-col items-center text-emerald-400 py-1';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// RENDER FUNCTIONS
// ==========================================
function render() {
  loadLocalState();
  if (currentUser) {
    loadUserData(currentUser.email);
  }

  document.getElementById('userBalance').textContent = `₦${state.user.balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  if (currentUser) {
    document.getElementById('userEmailDisplay').textContent = currentUser.email;
    const currentBaseUrl = window.location.origin + window.location.pathname;
    document.getElementById('refLink').textContent = `${currentBaseUrl}?ref=${currentUser.email}`;
  }

  if (state.user.bankAccount) {
    document.getElementById('bindBankName').value = state.user.bankAccount.bankName || '';
    document.getElementById('bindAccountNo').value = state.user.bankAccount.accountNo || '';
    document.getElementById('bindAccountName').value = state.user.bankAccount.accountName || '';
    document.getElementById('modalBoundBankInfo').textContent = `${state.user.bankAccount.bankName} (${state.user.bankAccount.accountNo})`;
  } else {
    document.getElementById('modalBoundBankInfo').textContent = 'Not Bound (Go to Account tab)';
  }

  const checkinBtn = document.getElementById('checkinBtn');
  const today = new Date().toDateString();
  if (state.user.lastCheckin === today) {
    checkinBtn.disabled = true;
    checkinBtn.classList.add('opacity-50', 'cursor-not-allowed');
    checkinBtn.innerText = 'Checked In Today';
  }

  const activeList = document.getElementById('activeInvestmentsList');
  if (state.activeInvestments.length === 0) {
    activeList.innerHTML = `<p class="text-slate-500 italic">No active investment plans yet. Purchase a VIP Fast Charger plan below to start receiving automatic 24-hour income drops.</p>`;
  } else {
    activeList.innerHTML = state.activeInvestments.map(inv => `
      <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
        <div>
          <div class="font-bold text-white">${inv.pkgName}</div>
          <div class="text-[10px] text-emerald-400">Daily Drop: ₦${inv.dailyIncome.toLocaleString()} | Progress: ${inv.daysClaimed}/${inv.daysTotal} Days</div>
        </div>
        <div class="text-right text-[10px] text-slate-400">
          Active & Earning
        </div>
      </div>
    `).join('');
  }

  const vipGrid = document.getElementById('vipGrid');
  vipGrid.innerHTML = VIP_PACKAGES.map(pkg => {
    const userPurchased = state.user.purchases[pkg.id] || 0;
    const isLimitReached = userPurchased >= pkg.limit;

    return `
      <div class="bg-slate-900 border border-emerald-900/40 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between">
        <div class="relative h-44 w-full bg-slate-950 overflow-hidden">
          <img src="${pkg.image}" alt="${pkg.name}" class="w-full h-full object-cover opacity-80 hover:scale-105 transition duration-500">
          <div class="absolute top-3 right-3 bg-emerald-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full shadow-md">
            ₦${pkg.price.toLocaleString()}
          </div>
          <div class="absolute bottom-2 left-3 text-xs font-bold text-emerald-400 bg-slate-950/80 px-2 py-0.5 rounded">
            Limit: ${userPurchased}/${pkg.limit} Purchased
          </div>
        </div>

        <div class="p-5 flex-1 flex flex-col justify-between">
          <h3 class="font-extrabold text-white text-lg mb-2">${pkg.name}</h3>

          <div class="grid grid-cols-2 gap-2 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl mb-4 border border-slate-800">
            <div>Daily: <strong class="text-white">₦${pkg.daily.toLocaleString()}</strong></div>
            <div>Total: <strong class="text-white">₦${pkg.total.toLocaleString()}</strong></div>
            <div>Commission: <strong class="text-emerald-400">₦${pkg.commission.toLocaleString()}</strong></div>
            <div>Duration: <strong class="text-white">${pkg.days} Days</strong></div>
          </div>

          <button 
            onclick="buyVipPackage(${pkg.id})" 
            ${isLimitReached ? 'disabled' : ''} 
            class="w-full font-bold py-3 rounded-xl transition text-xs shadow-md ${
              isLimitReached 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }">
            ${isLimitReached ? 'Limit Reached' : 'Invest Now'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  const userTxTable = document.getElementById('userTxTable');
  userTxTable.innerHTML = state.transactions.map(tx => `
    <tr class="hover:bg-slate-900/50">
      <td class="p-2.5 font-medium text-slate-200">${tx.type}</td>
      <td class="p-2.5 font-bold text-white">₦${tx.amount.toLocaleString()}</td>
      <td class="p-2.5">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
          tx.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
          tx.status === 'Pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
          'bg-rose-500/20 text-rose-400 border border-rose-500/30'
        }">${tx.status}</span>
      </td>
      <td class="p-2.5 text-slate-400 text-[10px]">${new Date(tx.date).toLocaleDateString()}</td>
    </tr>
  `).join('');

  if (state.isAdminView && currentUser && currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    const adminGiftList = document.getElementById('adminGiftCodesList');
    if (adminGiftList) {
      if (state.giftCodes.length === 0) {
        adminGiftList.innerHTML = `<p class="text-slate-500 italic">No gift codes created yet.</p>`;
      } else {
        adminGiftList.innerHTML = state.giftCodes.map(g => `
          <div class="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center text-[11px]">
            <div><strong class="text-emerald-400">${g.code}</strong> - ₦${g.amount}</div>
            <div class="text-slate-400">Remaining Qty: ${g.remainingQty}/${g.totalQty}</div>
          </div>
        `).join('');
      }
    }

    const adminUsersTable = document.getElementById('adminUsersTable');
    if (adminUsersTable) {
      if (!state.registeredUsersList || state.registeredUsersList.length === 0) {
        adminUsersTable.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-500">No registered users found.</td></tr>`;
      } else {
        adminUsersTable.innerHTML = state.registeredUsersList.map(u => {
          const uProfile = JSON.parse(localStorage.getItem('shiplus_user_' + u.email) || '{"balance": 1000}');
          const uInvs = JSON.parse(localStorage.getItem('shiplus_inv_' + u.email) || '[]');
          const totalInvested = uInvs.reduce((sum, inv) => sum + (inv.price || 3800), 0);
          return `
            <tr class="hover:bg-slate-900/50">
              <td class="p-2.5 font-medium text-white">${u.email}</td>
              <td class="p-2.5 text-emerald-400 font-bold">₦${(uProfile.balance || 0).toLocaleString()}</td>
              <td class="p-2.5 text-slate-200">₦${totalInvested.toLocaleString()} (${uInvs.length} Plans)</td>
              <td class="p-2.5 text-slate-400 text-[10px]">${new Date(u.joined || Date.now()).toLocaleDateString()}</td>
            </tr>
          `;
        }).join('');
      }
    }

    const adminTxTable = document.getElementById('adminTxTable');
    if (adminTxTable) {
      const pendingTx = state.transactions.filter(t => t.status === 'Pending');
      if (pendingTx.length === 0) {
        adminTxTable.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-500">No pending transactions found.</td></tr>`;
      } else {
        adminTxTable.innerHTML = pendingTx.map(tx => `
          <tr>
            <td class="p-2.5 font-medium text-slate-200">${tx.user}</td>
            <td class="p-2.5">${tx.type}</td>
            <td class="p-2.5 font-bold text-white">₦${tx.amount.toLocaleString()}</td>
            <td class="p-2.5 text-emerald-400 font-bold">₦${(tx.amount - (tx.fee || 0)).toLocaleString()}</td>
            <td class="p-2.5 space-x-1">
              <button onclick="processAdminTx('${tx.id}', 'Approve')" class="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded">Approve</button>
              <button onclick="processAdminTx('${tx.id}', 'Reject')" class="bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded">Reject</button>
            </td>
          </tr>
        `).join('');
      }
    }
  }
}

// ==========================================
// BANK ACCOUNT BINDING
// ==========================================
function saveBankBinding() {
  const bankName = document.getElementById('bindBankName').value.trim();
  const accountNo = document.getElementById('bindAccountNo').value.trim();
  const accountName = document.getElementById('bindAccountName').value.trim();

  if (!bankName || !accountNo || !accountName || accountNo.length < 10) {
    alert('Please enter valid bank details and a complete 10-digit account number.');
    return;
  }

  state.user.bankAccount = { bankName, accountNo, accountName };
  saveLocalState();
  render();
  alert('Withdrawal bank account saved successfully!');
}

// ==========================================
// AUTOMATED MULTI-LEVEL REFERRAL ENGINE
// ==========================================
function distributeMultiLevelReferralBonus(purchaseAmount) {
  if (!state.user.inviter) return;

  const percentages = [0.25, 0.02, 0.01, 0.01]; 
  let currentInviter = state.user.inviter;

  percentages.forEach((pct, index) => {
    if (!currentInviter) return;
    const bonus = purchaseAmount * pct;

    // Credit inviter profile storage directly so it reflects in their account
    let inviterData = JSON.parse(localStorage.getItem('shiplus_user_' + currentInviter) || 'null');
    if (inviterData) {
      inviterData.balance += bonus;
      localStorage.setItem('shiplus_user_' + currentInviter, JSON.stringify(inviterData));
    }

    state.transactions.unshift({
      id: 'tx_ref_' + Date.now() + '_' + (index + 1),
      user: currentInviter,
      type: `Referral Commission (Level ${index + 1})`,
      amount: bonus,
      fee: 0,
      status: 'Completed',
      date: new Date().toISOString()
    });

    currentInviter = state.allUsersNetwork ? state.allUsersNetwork[currentInviter.toLowerCase()] : null;
  });
}

// ==========================================
// CORE ACTIONS & MODALS
// ==========================================
function claimDailyCheckin() {
  const today = new Date().toDateString();
  if (state.user.lastCheckin === today) {
    alert('You have already claimed your daily bonus today.');
    return;
  }
  
  state.user.balance += 50;
  state.user.lastCheckin = today;
  state.transactions.unshift({
    id: 'tx_' + Date.now(),
    user: currentUser ? currentUser.email : state.user.id,
    type: 'Daily Reward',
    amount: 50,
    fee: 0,
    status: 'Completed',
    date: new Date().toISOString()
  });

  saveLocalState();
  render();
  alert('Success! ₦50 daily check-in bonus added to your balance.');
}

function adminManualCredit() {
  if (!currentUser || currentUser.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    alert('Unauthorized access.');
    return;
  }

  const targetEmail = document.getElementById('adminCreditEmail').value.trim().toLowerCase();
  const creditAmount = parseFloat(document.getElementById('adminCreditAmount').value);

  if (!targetEmail || !creditAmount || creditAmount <= 0) {
    alert('Please provide a valid user email and credit amount.');
    return;
  }

  // Update target user's balance in storage
  let targetProfile = JSON.parse(localStorage.getItem('shiplus_user_' + targetEmail) || 'null');
  if (targetProfile) {
    targetProfile.balance += creditAmount;
    localStorage.setItem('shiplus_user_' + targetEmail, JSON.stringify(targetProfile));
  } else {
    // create profile if doesn't exist
    const newProf = { balance: 1000 + creditAmount, purchases: {}, redeemedCodes: [], bankAccount: null };
    localStorage.setItem('shiplus_user_' + targetEmail, JSON.stringify(newProf));
  }

  state.transactions.unshift({
    id: 'tx_manual_' + Date.now(),
    user: targetEmail,
    type: 'Admin Manual Credit',
    amount: creditAmount,
    fee: 0,
    status: 'Completed',
    date: new Date().toISOString()
  });

  saveLocalState();
  document.getElementById('adminCreditEmail').value = '';
  document.getElementById('adminCreditAmount').value = '';
  render();
  alert(`Successfully credited ₦${creditAmount.toLocaleString()} to ${targetEmail}!`);
}

function createGiftCode() {
  if (!currentUser || currentUser.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    alert('Unauthorized access.');
    return;
  }

  const code = document.getElementById('adminCodeName').value.trim().toUpperCase();
  const amount = parseFloat(document.getElementById('adminCodeAmount').value);
  const qty = parseInt(document.getElementById('adminCodeQty').value, 10);

  if (!code || !amount || !qty || amount <= 0 || qty <= 0) {
    alert('Please enter valid Code Name, Amount, and Quantity.');
    return;
  }

  loadLocalState();
  if (state.giftCodes.find(g => g.code === code)) {
    alert('A gift code with this name already exists.');
    return;
  }

  state.giftCodes.push({
    code: code,
    amount: amount,
    totalQty: qty,
    remainingQty: qty,
    createdAt: new Date().toISOString()
  });

  saveLocalState();
  document.getElementById('adminCodeName').value = '';
  document.getElementById('adminCodeAmount').value = '';
  document.getElementById('adminCodeQty').value = '';
  render();
  alert(`Gift code ${code} for ₦${amount} (Qty: ${qty}) created successfully!`);
}

function redeemGiftCode() {
  loadLocalState();
  const inputCode = document.getElementById('giftCodeInput').value.trim().toUpperCase();
  if (!inputCode) {
    alert('Please enter a gift code.');
    return;
  }

  const giftObj = state.giftCodes.find(g => g.code === inputCode);
  if (!giftObj) {
    alert('Invalid gift code.');
    return;
  }

  if (giftObj.remainingQty <= 0) {
    alert('This gift code has reached its maximum redemptions.');
    return;
  }

  if (state.user.redeemedCodes.includes(inputCode)) {
    alert('You have already redeemed this gift code.');
    return;
  }

  giftObj.remainingQty -= 1;
  state.user.redeemedCodes.push(inputCode);
  state.user.balance += giftObj.amount;

  state.transactions.unshift({
    id: 'tx_' + Date.now(),
    user: currentUser ? currentUser.email : state.user.id,
    type: `Gift Code (${inputCode})`,
    amount: giftObj.amount,
    fee: 0,
    status: 'Completed',
    date: new Date().toISOString()
  });

  saveLocalState();
  document.getElementById('giftCodeInput').value = '';
  render();
  alert(`Success! ₦${giftObj.amount.toLocaleString()} added to your account.`);
}

function buyVipPackage(pkgId) {
  const pkg = VIP_PACKAGES.find(p => p.id === pkgId);
  const currentCount = state.user.purchases[pkgId] || 0;

  if (currentCount >= pkg.limit) {
    alert('Purchase limit reached for this package.');
    return;
  }

  if (state.user.balance < pkg.price) {
    alert(`Insufficient balance! You need ₦${pkg.price.toLocaleString()} to invest.`);
    return;
  }

  state.user.balance -= pkg.price;
  state.user.purchases[pkgId] = currentCount + 1;

  const now = Date.now();
  state.activeInvestments.push({
    id: 'inv_' + now,
    pkgId: pkg.id,
    pkgName: pkg.name,
    price: pkg.price,
    dailyIncome: pkg.daily,
    daysTotal: pkg.days,
    daysClaimed: 0,
    lastClaimTimestamp: now,
    purchasedAt: new Date(now).toISOString()
  });

  state.transactions.unshift({
    id: 'tx_' + now,
    user: currentUser ? currentUser.email : state.user.id,
    type: `Invest: ${pkg.name}`,
    amount: pkg.price,
    fee: 0,
    status: 'Completed',
    date: new Date(now).toISOString()
  });

  distributeMultiLevelReferralBonus(pkg.price);

  saveLocalState();
  render();
  alert(`Congratulations! You have successfully purchased ${pkg.name}. Daily returns will now drop automatically every 24 hours.`);
}

function submitDeposit() {
  const amount = parseFloat(document.getElementById('depositAmount').value);
  if (!amount || amount < 3800) {
    alert('Minimum deposit amount for Shiplus is ₦3,800.');
    return;
  }

  loadLocalState();
  state.transactions.unshift({
    id: 'tx_' + Date.now(),
    user: currentUser ? currentUser.email : state.user.id,
    type: 'Deposit',
    amount: amount,
    fee: 0,
    status: 'Pending',
    date: new Date().toISOString()
  });

  saveLocalState();
  closeModal('depositModal');
  document.getElementById('depositAmount').value = '';
  render();
  alert('Deposit request submitted! Awaiting admin confirmation.');
}

function copyAccountDetails() {
  navigator.clipboard.writeText('5112715845');
  alert('Account number 5112715845 copied to clipboard!');
}

function openWithdrawModal() {
  if (!state.user.bankAccount) {
    alert('Please bind your withdrawal bank account in the Account tab first.');
    switchTab('account');
    return;
  }

  if (!state.activeInvestments || state.activeInvestments.length === 0) {
    alert('Withdrawal Locked: You must purchase at least one VIP investment plan before you can make a withdrawal.');
    return;
  }
  openModal('withdrawModal');
}

function submitWithdrawal() {
  if (!state.activeInvestments || state.activeInvestments.length === 0) {
    alert('Withdrawal Denied: No active investment plans found.');
    return;
  }

  const amount = parseFloat(document.getElementById('withdrawAmount').value);
  const currentHour = new Date().getHours();

  if (currentHour < 9 || currentHour >= 17) {
    alert('Withdrawals are only open between 9:00 AM and 5:00 PM WAT.');
    return;
  }

  if (!amount || amount < 1000 || amount > 50000) {
    alert('Withdrawal amount must be between ₦1,000 and ₦50,000.');
    return;
  }

  if (state.user.balance < amount) {
    alert('Insufficient balance!');
    return;
  }

  const fee = amount * 0.15;
  state.user.balance -= amount;

  loadLocalState();
  state.transactions.unshift({
    id: 'tx_' + Date.now(),
    user: currentUser ? currentUser.email : state.user.id,
    type: 'Withdrawal',
    amount: amount,
    fee: fee,
    status: 'Pending',
    date: new Date().toISOString()
  });

  saveLocalState();
  closeModal('withdrawModal');
  document.getElementById('withdrawAmount').value = '';
  render();
  alert(`Withdrawal request submitted! 15% Fee (₦${fee.toLocaleString()}) applied.`);
}

function processAdminTx(txId, action) {
  if (!currentUser || currentUser.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return;

  loadLocalState();
  const tx = state.transactions.find(t => t.id === txId);
  if (!tx) return;

  tx.status = action === 'Approve' ? 'Completed' : 'Rejected';
  
  if (action === 'Approve') {
    let targetProfile = JSON.parse(localStorage.getItem('shiplus_user_' + tx.user) || 'null');
    if (targetProfile) {
      if (tx.type === 'Deposit') {
        targetProfile.balance += tx.amount;
      }
      localStorage.setItem('shiplus_user_' + tx.user, JSON.stringify(targetProfile));
    }
  } else {
    if (tx.type === 'Withdrawal') {
      let targetProfile = JSON.parse(localStorage.getItem('shiplus_user_' + tx.user) || 'null');
      if (targetProfile) {
        targetProfile.balance += tx.amount;
        localStorage.setItem('shiplus_user_' + tx.user, JSON.stringify(targetProfile));
      }
    }
  }

  saveLocalState();
  render();
}

function toggleAdminView() {
  if (!currentUser || currentUser.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    alert('Access Denied: Admin privileges are strictly restricted.');
    return;
  }

  state.isAdminView = !state.isAdminView;
  const adminView = document.getElementById('adminView');
  const toggleBtn = document.getElementById('toggleAdminBtn');

  ['dashboard', 'vip', 'team', 'account', 'history'].forEach(t => {
    document.getElementById(`tabContent-${t}`).classList.add('hidden');
  });

  if (state.isAdminView) {
    adminView.classList.remove('hidden');
    toggleBtn.textContent = 'Exit Admin Console';
  } else {
    adminView.classList.add('hidden');
    toggleBtn.textContent = 'Admin Console';
    switchTab('dashboard');
  }
  render();
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function copyReferralLink() {
  const linkText = document.getElementById('refLink').innerText;
  navigator.clipboard.writeText(linkText);
  alert('Referral link copied to clipboard!');
}

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  loadLocalState();
  
  const urlParams = new URLSearchParams(window.location.search);
  const refParam = urlParams.get('ref');
  if (refParam && !currentUser) {
    const refInput = document.getElementById('regRefCode');
    if (refInput) {
      refInput.value = refParam;
    }
  }

  if (currentUser) {
    loadUserData(currentUser.email);
    showMainApp(false);
  } else {
    document.getElementById('authContainer').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
  }

  lucide.createIcons();
});
