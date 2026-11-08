// ==========================================
// SUPABASE CONFIGURATION
// ==========================================
const SUPABASE_URL = 'https://mhmvygubhzgmwovhzbdn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_PeRJyArsWXjzro5thtOiVA_18BvrLBZ';
let supabaseClient = null;

try {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (err) {
  console.warn('Supabase initialization failed.');
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

let currentUser = null;
let state = {
  user: {
    id: null,
    email: '',
    balance: 1000,
    lastCheckin: null,
    purchases: {},
    redeemedCodes: [],
    inviter: null,
    bankAccount: null
  },
  transactions: [],
  activeInvestments: [],
  allInvestments: [],
  giftCodes: [],
  allUsersList: [],
  teamLevels: { 1: [], 2: [], 3: [], 4: [] },
  isAdminView: false
};

const ADMIN_EMAIL = 'omoopeola1@gmail.com';

async function loadUserData(email) {
  if (!supabaseClient) return;
  const cleanEmail = email.trim().toLowerCase();
  
  let { data: profile } = await supabaseClient.from('profiles').select('*').eq('email', cleanEmail).maybeSingle();
  
  if (!profile) {
    const userId = 'usr_' + Date.now();
    const newProfile = {
      id: userId,
      email: cleanEmail,
      balance: 1000,
      inviter: null,
      bank_account: null,
      purchases: {},
      redeemed_codes: [],
      last_checkin: null
    };
    await supabaseClient.from('profiles').upsert([newProfile]);
    profile = newProfile;
  }

  state.user = {
    id: profile.id,
    email: profile.email,
    balance: parseFloat(profile.balance || 1000),
    inviter: profile.inviter ? profile.inviter.trim().toLowerCase() : null,
    bankAccount: profile.bank_account,
    purchases: profile.purchases || {},
    redeemedCodes: profile.redeemed_codes || [],
    lastCheckin: profile.last_checkin || null
  };

  const { data: invs } = await supabaseClient.from('active_investments').select('*').eq('user_email', cleanEmail);
  state.activeInvestments = invs || [];

  await fetchGlobalData();
  await computeTeamLevels(cleanEmail);
}

async function fetchGlobalData() {
  if (!supabaseClient) return;

  const { data: txs } = await supabaseClient.from('transactions').select('*').order('created_at', { ascending: false });
  state.transactions = txs || [];

  const { data: codes } = await supabaseClient.from('gift_codes').select('*');
  state.giftCodes = codes || [];

  const { data: users } = await supabaseClient.from('profiles').select('*').order('created_at', { ascending: false });
  state.allUsersList = users || [];

  const { data: allInvs } = await supabaseClient.from('active_investments').select('*');
  state.allInvestments = allInvs || [];
}

async function computeTeamLevels(userEmail) {
  if (!state.allUsersList || state.allUsersList.length === 0) return;
  
  let level1 = state.allUsersList.filter(u => u.inviter && u.inviter.toLowerCase() === userEmail);
  let level1Emails = level1.map(u => u.email.toLowerCase());

  let level2 = state.allUsersList.filter(u => u.inviter && level1Emails.includes(u.inviter.toLowerCase()));
  let level2Emails = level2.map(u => u.email.toLowerCase());

  let level3 = state.allUsersList.filter(u => u.inviter && level2Emails.includes(u.inviter.toLowerCase()));
  let level3Emails = level3.map(u => u.email.toLowerCase());

  let level4 = state.allUsersList.filter(u => u.inviter && level3Emails.includes(u.inviter.toLowerCase()));

  state.teamLevels = {
    1: level1,
    2: level2,
    3: level3,
    4: level4
  };
}

async function saveUserProfile() {
  if (!supabaseClient || !currentUser) return;
  await supabaseClient.from('profiles').update({
    balance: state.user.balance,
    inviter: state.user.inviter ? state.user.inviter.trim().toLowerCase() : null,
    bank_account: state.user.bankAccount,
    purchases: state.user.purchases,
    redeemed_codes: state.user.redeemedCodes,
    last_checkin: state.user.lastCheckin
  }).eq('email', currentUser.email.toLowerCase());
}

// ==========================================
// AUTOMATIC 24H INCOME DROP ENGINE
// ==========================================
async function checkAndProcessAutomaticIncome() {
  if (!currentUser || !state.activeInvestments) return;
  const now = Date.now();
  const DAY_IN_MS = 24 * 60 * 60 * 1000;
  let totalDropped = 0;

  for (let inv of state.activeInvestments) {
    if (inv.days_claimed < inv.days_total) {
      const elapsedMs = now - Number(inv.last_claim_timestamp);
      const dueDays = Math.floor(elapsedMs / DAY_IN_MS);

      if (dueDays > 0) {
        const playableDays = Math.min(dueDays, inv.days_total - inv.days_claimed);
        const incomeAmount = playableDays * Number(inv.daily_income);
        
        inv.days_claimed += playableDays;
        inv.last_claim_timestamp += (playableDays * DAY_IN_MS);
        totalDropped += incomeAmount;

        await supabaseClient.from('active_investments').update({
          days_claimed: inv.days_claimed,
          last_claim_timestamp: inv.last_claim_timestamp
        }).eq('id', inv.id);
      }
    }
  }

  if (totalDropped > 0) {
    state.user.balance += totalDropped;
    await saveUserProfile();
    
    await supabaseClient.from('transactions').insert([{
      user_email: currentUser.email.toLowerCase(),
      type: 'Automatic 24H Return',
      amount: totalDropped,
      fee: 0,
      status: 'Completed'
    }]);
    await fetchGlobalData();
  }
}

setInterval(() => {
  if (currentUser) {
    checkAndProcessAutomaticIncome();
    render();
  }
}, 10000);

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
    tabRegBtn.className = 'flex-1 py-2.5 text-xs font-bold rounded-xl transition bg-emerald-600 text-white shadow-md';
    tabLoginBtn.className = 'flex-1 py-2.5 text-xs font-bold rounded-lg transition text-slate-400 hover:text-white';
  } else {
    regForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    tabRegBtn.className = 'flex-1 py-2.5 text-xs font-bold rounded-lg transition text-slate-400 hover:text-white';
    tabLoginBtn.className = 'flex-1 py-2.5 text-xs font-bold rounded-xl transition bg-emerald-600 text-white shadow-md';
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
  const inviterRef = (inputRef || urlRef || '').trim().toLowerCase();

  if (supabaseClient) {
    let { data: existingProf } = await supabaseClient.from('profiles').select('*').eq('email', email).maybeSingle();
    if (existingProf) {
      alert('Email is already registered. Please login instead.');
      switchAuthTab('login');
      return;
    }

    await supabaseClient.from('profiles').insert([{
      id: 'usr_' + Date.now(),
      email: email,
      balance: 1000,
      inviter: inviterRef || null,
      bank_account: null,
      purchases: {},
      redeemed_codes: [],
      last_checkin: null
    }]);
  }

  currentUser = { email, fullName };
  localStorage.setItem('shiplus_session', JSON.stringify(currentUser));
  
  await loadUserData(email);

  if (supabaseClient) {
    const { data: existingBonus } = await supabaseClient.from('transactions').select('*').eq('user_email', email).eq('type', 'Welcome Bonus');
    if (!existingBonus || existingBonus.length === 0) {
      await supabaseClient.from('transactions').insert([{
        user_email: email,
        type: 'Welcome Bonus',
        amount: 1000,
        fee: 0,
        status: 'Completed'
      }]);
    }
  }

  showMainApp(true);
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;

  if (supabaseClient) {
    let { data: profile } = await supabaseClient.from('profiles').select('*').eq('email', email).maybeSingle();
    if (!profile) {
      alert('Account not found. Please register first.');
      switchAuthTab('register');
      return;
    }
  }

  currentUser = { email, fullName: email.split('@')[0] };
  localStorage.setItem('shiplus_session', JSON.stringify(currentUser));
  
  await loadUserData(email);
  showMainApp(false);
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem('shiplus_session');
  document.getElementById('mainApp').classList.add('hidden');
  document.getElementById('authContainer').classList.remove('hidden');
}

async function showMainApp(isNewUser) {
  document.getElementById('authContainer').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');

  const adminNavContainer = document.getElementById('adminNavContainer');
  if (currentUser && currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    adminNavContainer.classList.remove('hidden');
  } else {
    adminNavContainer.classList.add('hidden');
    state.isAdminView = false;
  }

  await fetchGlobalData();
  if (currentUser) await computeTeamLevels(currentUser.email.toLowerCase());
  await checkAndProcessAutomaticIncome();
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
      topBtn.className = 'flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-900 transition shrink-0 border border-slate-800/80';
    }
    const botBtn = document.getElementById(`bottomNav-${t}`);
    if (botBtn) {
      botBtn.className = 'flex flex-col items-center text-slate-400 hover:text-white py-1 transition transform active:scale-95';
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
    activeTopBtn.className = 'flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold bg-emerald-600 text-white transition-all shadow-lg shadow-emerald-600/20 shrink-0';
  }

  const activeBotBtn = document.getElementById(`bottomNav-${tabName}`);
  if (activeBotBtn) {
    activeBotBtn.className = 'flex flex-col items-center text-emerald-400 py-1 transition transform active:scale-95';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// TEAM SUB-TAB SWITCHING (LEVEL 1 TO 4)
// ==========================================
function switchTeamLevel(level) {
  [1, 2, 3, 4].forEach(lvl => {
    const listEl = document.getElementById(`teamLevelList-${lvl}`);
    const btnEl = document.getElementById(`teamLevelBtn-${lvl}`);
    if (listEl) {
      if (lvl === level) listEl.classList.remove('hidden');
      else listEl.classList.add('hidden');
    }
    if (btnEl) {
      if (lvl === level) {
        btnEl.className = 'flex-1 py-2.5 text-xs font-black rounded-xl transition-all bg-emerald-600 text-white shadow-md';
      } else {
        btnEl.className = 'flex-1 py-2.5 text-xs font-black rounded-xl transition-all bg-slate-950 text-slate-400 hover:text-white border border-slate-800/80';
      }
    }
  });
}

// ==========================================
// RENDER FUNCTIONS
// ==========================================
async function render() {
  if (currentUser) {
    await fetchGlobalData();
    await loadUserData(currentUser.email);
    await computeTeamLevels(currentUser.email.toLowerCase());
  }

  document.getElementById('userBalance').textContent = `₦${(state.user.balance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
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
  } else {
    checkinBtn.disabled = false;
    checkinBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    checkinBtn.innerHTML = '<i data-lucide="calendar-check" class="w-4 h-4"></i><span>Daily Check-in (+₦50)</span>';
    lucide.createIcons();
  }

  // Render Multi-Level Team Lists
  const totalTeamCount = (state.teamLevels[1].length + state.teamLevels[2].length + state.teamLevels[3].length + state.teamLevels[4].length);
  const teamTotalCounter = document.getElementById('teamTotalCounter');
  if (teamTotalCounter) teamTotalCounter.textContent = totalTeamCount;

  [1, 2, 3, 4].forEach(lvl => {
    const container = document.getElementById(`teamLevelList-${lvl}`);
    const badgeCount = document.getElementById(`teamCountBadge-${lvl}`);
    const members = state.teamLevels[lvl] || [];
    
    if (badgeCount) badgeCount.textContent = `${members.length} Members`;

    if (container) {
      if (members.length === 0) {
        container.innerHTML = `<p class="text-slate-500 italic text-xs py-2">No members in Level ${lvl} yet.</p>`;
      } else {
        container.innerHTML = members.map(member => {
          const memberInvs = (state.allInvestments || []).filter(i => i.user_email.toLowerCase() === member.email.toLowerCase());
          const hasActiveInv = memberInvs.length > 0;
          const totalMemberInv = memberInvs.reduce((sum, inv) => sum + Number(inv.price), 0);

          return `
            <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex justify-between items-center text-xs mb-2">
              <div>
                <div class="font-extrabold text-white text-sm mb-1">${member.email}</div>
                <div class="text-[11px] text-slate-400">Joined: ${new Date(member.created_at || Date.now()).toLocaleDateString()} | Active Inv: <strong class="${hasActiveInv ? 'text-emerald-400' : 'text-slate-400'}">${hasActiveInv ? '₦' + totalMemberInv.toLocaleString() : 'NO'}</strong></div>
              </div>
              <span class="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Level ${lvl}</span>
            </div>
          `;
        }).join('');
      }
    }
  });

  const activeList = document.getElementById('activeInvestmentsList');
  const investments = state.activeInvestments || [];
  if (investments.length === 0) {
    activeList.innerHTML = `<p class="text-slate-500 italic">No active investment plans yet. Purchase a VIP Fast Charger plan below to start receiving automatic 24-hour income drops.</p>`;
  } else {
    activeList.innerHTML = investments.map(inv => `
      <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex justify-between items-center">
        <div>
          <div class="font-bold text-white">${inv.pkg_name}</div>
          <div class="text-[10px] text-emerald-400 mt-0.5">Daily Drop: ₦${Number(inv.daily_income).toLocaleString()} | Progress: ${inv.days_claimed}/${inv.days_total} Days</div>
        </div>
        <div class="text-right text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
          Active & Earning
        </div>
      </div>
    `).join('');
  }

  const vipGrid = document.getElementById('vipGrid');
  vipGrid.innerHTML = VIP_PACKAGES.map(pkg => {
    const userPurchased = (state.user.purchases && state.user.purchases[pkg.id]) || 0;
    const isLimitReached = userPurchased >= pkg.limit;

    return `
      <div class="bg-slate-900/80 backdrop-blur border border-emerald-900/40 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between">
        <div class="relative h-44 w-full bg-slate-950 overflow-hidden">
          <img src="${pkg.image}" alt="${pkg.name}" class="w-full h-full object-cover opacity-80 hover:scale-105 transition duration-500">
          <div class="absolute top-3 right-3 bg-emerald-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full shadow-md">
            ₦${pkg.price.toLocaleString()}
          </div>
          <div class="absolute bottom-2 left-3 text-xs font-bold text-emerald-400 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
            Limit: ${userPurchased}/${pkg.limit} Purchased
          </div>
        </div>

        <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
          <h3 class="font-black text-white text-lg">${pkg.name}</h3>

          <div class="grid grid-cols-2 gap-2 text-xs text-slate-300 bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
            <div>Daily: <strong class="text-white">₦${pkg.daily.toLocaleString()}</strong></div>
            <div>Total: <strong class="text-white">₦${pkg.total.toLocaleString()}</strong></div>
            <div>Commission: <strong class="text-emerald-400">₦${pkg.commission.toLocaleString()}</strong></div>
            <div>Duration: <strong class="text-white">${pkg.days} Days</strong></div>
          </div>

          <button 
            onclick="buyVipPackage(${pkg.id})" 
            ${isLimitReached ? 'disabled' : ''} 
            class="w-full font-extrabold py-3.5 rounded-2xl transition text-xs shadow-md ${
              isLimitReached 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
          }">
            ${isLimitReached ? 'Limit Reached' : 'Invest Now'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  const userTxTable = document.getElementById('userTxTable');
  const txs = state.transactions || [];
  const myTxs = txs.filter(t => currentUser && t.user_email.toLowerCase() === currentUser.email.toLowerCase());
  userTxTable.innerHTML = myTxs.map(tx => `
    <tr class="hover:bg-slate-900/50">
      <td class="p-3 font-medium text-slate-200">${tx.type}</td>
      <td class="p-3 font-bold text-white">₦${Number(tx.amount).toLocaleString()}</td>
      <td class="p-3">
        <span class="px-2.5 py-1 rounded-lg text-[10px] font-black ${
          tx.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
          tx.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
          'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }">${tx.status}</span>
      </td>
      <td class="p-3 text-slate-400 text-[10px]">${new Date(tx.created_at).toLocaleDateString()}</td>
    </tr>
  `).join('');

  if (state.isAdminView && currentUser && currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    const adminGiftList = document.getElementById('adminGiftCodesList');
    if (adminGiftList) {
      const giftCodes = state.giftCodes || [];
      if (giftCodes.length === 0) {
        adminGiftList.innerHTML = `<p class="text-slate-500 italic">No gift codes created yet.</p>`;
      } else {
        adminGiftList.innerHTML = giftCodes.map(g => `
          <div class="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex justify-between items-center text-xs">
            <div><strong class="text-emerald-400">${g.code}</strong> - ₦${g.amount}</div>
            <div class="text-slate-400">Remaining Qty: ${g.remaining_qty}/${g.total_qty}</div>
          </div>
        `).join('');
      }
    }

    const adminUsersTable = document.getElementById('adminUsersTable');
    if (adminUsersTable) {
      const allUsers = state.allUsersList || [];
      if (allUsers.length === 0) {
        adminUsersTable.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-slate-500">No registered users found.</td></tr>`;
      } else {
        adminUsersTable.innerHTML = allUsers.map(u => {
          const userInvs = (state.allInvestments || []).filter(i => i.user_email.toLowerCase() === u.email.toLowerCase());
          const totalInvAmount = userInvs.reduce((sum, inv) => sum + Number(inv.price), 0);
          const invStatusDisplay = userInvs.length > 0 ? `₦${totalInvAmount.toLocaleString()}` : 'NO';

          return `
            <tr class="hover:bg-slate-900/50 border-b border-slate-800/60">
              <td class="p-3 font-medium text-white text-xs">${u.email}</td>
              <td class="p-3 text-emerald-400 font-bold text-xs">₦${Number(u.balance || 0).toLocaleString()}</td>
              <td class="p-3 text-slate-300 text-xs font-semibold">${invStatusDisplay}</td>
            </tr>
          `;
        }).join('');
      }
    }

    const adminTxTable = document.getElementById('adminTxTable');
    if (adminTxTable) {
      const pendingTx = txs.filter(t => t.status === 'Pending');
      if (pendingTx.length === 0) {
        adminTxTable.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-500">No pending transactions found.</td></tr>`;
      } else {
        adminTxTable.innerHTML = pendingTx.map(tx => `
          <tr class="border-b border-slate-800/50">
            <td class="p-3 font-medium text-slate-200">${tx.user_email}</td>
            <td class="p-3">${tx.type}</td>
            <td class="p-3 font-bold text-white">₦${Number(tx.amount).toLocaleString()}</td>
            <td class="p-3 text-emerald-400 font-bold">₦${(Number(tx.amount) - Number(tx.fee || 0)).toLocaleString()}</td>
            <td class="p-3 space-x-1.5">
              <button onclick="processAdminTx('${tx.id}', 'Approve')" class="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg">Approve</button>
              <button onclick="processAdminTx('${tx.id}', 'Reject')" class="bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg">Reject</button>
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
async function saveBankBinding() {
  const bankName = document.getElementById('bindBankName').value.trim();
  const accountNo = document.getElementById('bindAccountNo').value.trim();
  const accountName = document.getElementById('bindAccountName').value.trim();

  if (!bankName || !accountNo || !accountName || accountNo.length < 10) {
    alert('Please enter valid bank details and a complete 10-digit account number.');
    return;
  }

  state.user.bankAccount = { bankName, accountNo, accountName };
  await saveUserProfile();
  render();
  alert('Withdrawal bank account saved successfully!');
}

// ==========================================
// MULTI-LEVEL REFERRAL ENGINE
// ==========================================
async function distributeMultiLevelReferralBonus(purchaseAmount) {
  if (!state.user.inviter || !supabaseClient) return;

  const percentages = [0.25, 0.02, 0.01, 0.01];
  let currentInviter = state.user.inviter.toLowerCase();

  for (let i = 0; i < percentages.length; i++) {
    if (!currentInviter) break;
    const bonus = purchaseAmount * percentages[i];

    const { data: inviterProfile } = await supabaseClient.from('profiles').select('*').eq('email', currentInviter).maybeSingle();
    if (inviterProfile) {
      const newBal = Number(inviterProfile.balance || 0) + bonus;
      await supabaseClient.from('profiles').update({ balance: newBal }).eq('email', currentInviter);

      await supabaseClient.from('transactions').insert([{
        user_email: currentInviter,
        type: `Referral Commission (Level ${i + 1})`,
        amount: bonus,
        fee: 0,
        status: 'Completed'
      }]);

      currentInviter = inviterProfile.inviter ? inviterProfile.inviter.trim().toLowerCase() : null;
    } else {
      break;
    }
  }
}

// ==========================================
// CORE ACTIONS & MODALS
// ==========================================
async function claimDailyCheckin() {
  const today = new Date().toDateString();
  
  const { data: latestProf } = await supabaseClient.from('profiles').select('last_checkin').eq('email', currentUser.email.toLowerCase()).maybeSingle();
  if (latestProf && latestProf.last_checkin === today) {
    state.user.lastCheckin = today;
    render();
    alert('You have already claimed your daily bonus today.');
    return;
  }
  
  state.user.balance += 50;
  state.user.lastCheckin = today;
  await saveUserProfile();

  await supabaseClient.from('transactions').insert([{
    user_email: currentUser.email.toLowerCase(),
    type: 'Daily Reward',
    amount: 50,
    fee: 0,
    status: 'Completed'
  }]);

  render();
  alert('Success! ₦50 daily check-in bonus added to your balance.');
}

async function adminManualCredit() {
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

  const { data: targetProf } = await supabaseClient.from('profiles').select('*').eq('email', targetEmail).maybeSingle();
  if (targetProf) {
    const newBal = Number(targetProf.balance || 0) + creditAmount;
    await supabaseClient.from('profiles').update({ balance: newBal }).eq('email', targetEmail);
  } else {
    await supabaseClient.from('profiles').insert([{ id: 'usr_' + Date.now(), email: targetEmail, balance: 1000 + creditAmount }]);
  }

  await supabaseClient.from('transactions').insert([{
    user_email: targetEmail,
    type: 'Admin Manual Credit',
    amount: creditAmount,
    fee: 0,
    status: 'Completed'
  }]);

  document.getElementById('adminCreditEmail').value = '';
  document.getElementById('adminCreditAmount').value = '';
  await fetchGlobalData();
  render();
  alert(`Successfully credited ₦${creditAmount.toLocaleString()} to ${targetEmail}!`);
}

async function createGiftCode() {
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

  const { error } = await supabaseClient.from('gift_codes').insert([{
    code: code,
    amount: amount,
    total_qty: qty,
    remaining_qty: qty
  }]);

  if (error) {
    alert('Error creating gift code: ' + error.message);
    return;
  }

  document.getElementById('adminCodeName').value = '';
  document.getElementById('adminCodeAmount').value = '';
  document.getElementById('adminCodeQty').value = '';
  await fetchGlobalData();
  render();
  alert(`Gift code ${code} for ₦${amount} (Qty: ${qty}) created successfully!`);
}

async function redeemGiftCode() {
  const inputCode = document.getElementById('giftCodeInput').value.trim().toUpperCase();
  if (!inputCode) {
    alert('Please enter a gift code.');
    return;
  }

  if (state.user.redeemedCodes.includes(inputCode)) {
    alert('You have already redeemed this gift code.');
    return;
  }

  const { data: giftObj } = await supabaseClient.from('gift_codes').select('*').eq('code', inputCode).maybeSingle();
  if (!giftObj) {
    alert('Invalid gift code.');
    return;
  }

  if (giftObj.remaining_qty <= 0) {
    alert('This gift code has reached its maximum redemptions.');
    return;
  }

  await supabaseClient.from('gift_codes').update({ remaining_qty: giftObj.remaining_qty - 1 }).eq('code', inputCode);

  state.user.redeemedCodes.push(inputCode);
  state.user.balance += Number(giftObj.amount);
  await saveUserProfile();

  await supabaseClient.from('transactions').insert([{
    user_email: currentUser.email.toLowerCase(),
    type: `Gift Code (${inputCode})`,
    amount: giftObj.amount,
    fee: 0,
    status: 'Completed'
  }]);

  document.getElementById('giftCodeInput').value = '';
  await fetchGlobalData();
  render();
  alert(`Success! ₦${Number(giftObj.amount).toLocaleString()} added to your account.`);
}

async function buyVipPackage(pkgId) {
  const pkg = VIP_PACKAGES.find(p => p.id === pkgId);
  const userPurchased = (state.user.purchases && state.user.purchases[pkgId]) || 0;

  if (userPurchased >= pkg.limit) {
    alert('Purchase limit reached for this package.');
    return;
  }

  if (state.user.balance < pkg.price) {
    alert(`Insufficient balance! You need ₦${pkg.price.toLocaleString()} to invest.`);
    return;
  }

  state.user.balance -= pkg.price;
  if (!state.user.purchases) state.user.purchases = {};
  state.user.purchases[pkgId] = userPurchased + 1;
  await saveUserProfile();

  const now = Date.now();
  await supabaseClient.from('active_investments').insert([{
    user_email: currentUser.email.toLowerCase(),
    pkg_name: pkg.name,
    price: pkg.price,
    daily_income: pkg.daily,
    days_total: pkg.days,
    days_claimed: 0,
    last_claim_timestamp: now
  }]);

  await supabaseClient.from('transactions').insert([{
    user_email: currentUser.email.toLowerCase(),
    type: `Invest: ${pkg.name}`,
    amount: pkg.price,
    fee: 0,
    status: 'Completed'
  }]);

  await distributeMultiLevelReferralBonus(pkg.price);
  await loadUserData(currentUser.email);
  render();
  alert(`Congratulations! You have successfully purchased ${pkg.name}. Daily returns will now drop automatically every 24 hours.`);
}

async function submitDeposit() {
  const amount = parseFloat(document.getElementById('depositAmount').value);
  if (!amount || amount < 3800) {
    alert('Minimum deposit amount for Shiplus is ₦3,800.');
    return;
  }

  await supabaseClient.from('transactions').insert([{
    user_email: currentUser.email.toLowerCase(),
    type: 'Deposit',
    amount: amount,
    fee: 0,
    status: 'Pending'
  }]);

  closeModal('depositModal');
  document.getElementById('depositAmount').value = '';
  await fetchGlobalData();
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

async function submitWithdrawal() {
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
  await saveUserProfile();

  await supabaseClient.from('transactions').insert([{
    user_email: currentUser.email.toLowerCase(),
    type: 'Withdrawal',
    amount: amount,
    fee: fee,
    status: 'Pending'
  }]);

  closeModal('withdrawModal');
  document.getElementById('withdrawAmount').value = '';
  await fetchGlobalData();
  render();
  alert(`Withdrawal request submitted! 15% Fee (₦${fee.toLocaleString()}) applied.`);
}

async function processAdminTx(txId, action) {
  if (!currentUser || currentUser.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return;

  const tx = state.transactions.find(t => t.id === txId);
  if (!tx) return;

  const newStatus = action === 'Approve' ? 'Completed' : 'Rejected';
  await supabaseClient.from('transactions').update({ status: newStatus }).eq('id', txId);

  if (action === 'Approve') {
    const { data: targetProf } = await supabaseClient.from('profiles').select('*').eq('email', tx.user_email).maybeSingle();
    if (targetProf) {
      if (tx.type === 'Deposit') {
        const newBal = Number(targetProf.balance || 0) + Number(tx.amount);
        await supabaseClient.from('profiles').update({ balance: newBal }).eq('email', tx.user_email);
      }
    }
  } else {
    if (tx.type === 'Withdrawal') {
      const { data: targetProf } = await supabaseClient.from('profiles').select('*').eq('email', tx.user_email).maybeSingle();
      if (targetProf) {
        const newBal = Number(targetProf.balance || 0) + Number(tx.amount);
        await supabaseClient.from('profiles').update({ balance: newBal }).eq('email', tx.user_email);
      }
    }
  }

  await fetchGlobalData();
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
document.addEventListener('DOMContentLoaded', async () => {
  const savedSession = localStorage.getItem('shiplus_session');
  if (savedSession) {
    currentUser = JSON.parse(savedSession);
    await loadUserData(currentUser.email);
    showMainApp(false);
  } else {
    document.getElementById('authContainer').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
  }

  const urlParams = new URLSearchParams(window.location.search);
  const refParam = urlParams.get('ref');
  if (refParam) {
    const refInput = document.getElementById('regRefCode');
    if (refInput) refInput.value = refParam;
  }

  lucide.createIcons();
});
