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
  user: { id: null, email: '', balance: 1000, lastCheckin: null, purchases: {}, redeemedCodes: [], inviter: null, bankAccount: null },
  transactions: [],
  activeInvestments: [],
  allInvestments: [],
  giftCodes: [],
  allUsersList: [],
  teamLevels: { 1: [], 2: [], 3: [], 4: [] },
  platformSettings: { minDeposit: 3800, checkinBonus: 50 },
  isAdminView: false
};

const ADMIN_EMAIL = 'omoopeola1@gmail.com';

async function loadUserData(email) {
  if (!supabaseClient) return;
  const cleanEmail = email.trim().toLowerCase();
  
  let { data: profile } = await supabaseClient.from('profiles').select('*').eq('email', cleanEmail).maybeSingle();
  if (!profile) {
    const newProfile = { id: 'usr_' + Date.now(), email: cleanEmail, balance: 1000, inviter: null, bank_account: null, purchases: {}, redeemed_codes: [], last_checkin: null };
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

  state.teamLevels = { 1: level1, 2: level2, 3: level3, 4: level4 };
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

function switchAuthTab(tab) {
  const regForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('loginForm');
  const tabRegBtn = document.getElementById('tabRegisterBtn');
  const tabLoginBtn = document.getElementById('tabLoginBtn');

  if (tab === 'register') {
    regForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    tabRegBtn.className = 'flex-1 py-2.5 text-xs font-bold rounded-xl transition bg-emerald-600 text-white shadow-md';
    tabLoginBtn.className = 'flex-1 py-2.5 text-xs font-bold rounded-xl transition text-slate-500 hover:text-slate-900';
  } else {
    regForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    tabRegBtn.className = 'flex-1 py-2.5 text-xs font-bold rounded-xl transition text-slate-500 hover:text-slate-900';
    tabLoginBtn.className = 'flex-1 py-2.5 text-xs font-bold rounded-xl transition bg-emerald-600 text-white shadow-md';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const fullName = document.getElementById('regFullName').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const urlParams = new URLSearchParams(window.location.search);
  const urlRef = urlParams.get('ref');
  const inputRef = document.getElementById('regRefCode').value.trim().toLowerCase();
  const inviterRef = (inputRef || urlRef || '').trim().toLowerCase();

  if (supabaseClient) {
    let { data: existingProf } = await supabaseClient.from('profiles').select('*').eq('email', email).maybeSingle();
    if (existingProf) {
      alert('Email already registered. Please login.');
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
    await supabaseClient.from('transactions').insert([{
      user_email: email,
      type: 'Welcome Bonus',
      amount: 1000,
      fee: 0,
      status: 'Completed'
    }]);
  }
  showMainApp(true);
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
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
  if (isNewUser) openModal('welcomeModal');
}

function switchTab(tabName) {
  ['dashboard', 'income', 'team', 'share', 'my'].forEach(t => {
    const content = document.getElementById(`tabContent-${t}`);
    if (content) content.classList.add('hidden');
    const botBtn = document.getElementById(`bottomNav-${t}`);
    if (botBtn) {
      botBtn.className = 'flex flex-col items-center text-slate-400 hover:text-slate-800 py-1 transition';
    }
  });

  if (state.isAdminView) {
    state.isAdminView = false;
    document.getElementById('adminView').classList.add('hidden');
  }

  const activeContent = document.getElementById(`tabContent-${tabName}`);
  if (activeContent) activeContent.classList.remove('hidden');

  const activeBotBtn = document.getElementById(`bottomNav-${tabName}`);
  if (activeBotBtn) {
    activeBotBtn.className = 'flex flex-col items-center text-emerald-600 py-1 transition';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

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
        btnEl.className = 'flex-1 py-2 text-[11px] font-bold rounded-lg transition bg-emerald-600 text-white shadow-sm';
      } else {
        btnEl.className = 'flex-1 py-2 text-[11px] font-bold rounded-lg transition text-slate-500 hover:text-slate-900';
      }
    }
  });
}

async function render() {
  if (currentUser) {
    await fetchGlobalData();
    await loadUserData(currentUser.email);
    await computeTeamLevels(currentUser.email.toLowerCase());
  }

  document.getElementById('userBalance').textContent = `₦${(state.user.balance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  if (currentUser) {
    document.getElementById('userEmailDisplay').textContent = currentUser.email;
    document.getElementById('refLink').textContent = `${window.location.origin}${window.location.pathname}?ref=${currentUser.email}`;
  }

  const unboundView = document.getElementById('bankUnboundView');
  const boundView = document.getElementById('bankBoundView');

  if (state.user.bankAccount && state.user.bankAccount.bankName) {
    unboundView.classList.add('hidden');
    boundView.classList.remove('hidden');
    document.getElementById('boundBankDisplay').textContent = state.user.bankAccount.bankName;
    document.getElementById('boundAccNoDisplay').textContent = state.user.bankAccount.accountNo;
    document.getElementById('boundAccNameDisplay').textContent = state.user.bankAccount.accountName;
    document.getElementById('modalBoundBankInfo').textContent = `${state.user.bankAccount.bankName} (${state.user.bankAccount.accountNo})`;
  } else {
    unboundView.classList.remove('hidden');
    boundView.classList.add('hidden');
    document.getElementById('modalBoundBankInfo').textContent = 'Not Bound';
  }

  const checkinBtn = document.getElementById('checkinBtn');
  const today = new Date().toDateString();
  if (state.user.lastCheckin === today) {
    checkinBtn.disabled = true;
    checkinBtn.className = 'text-[11px] bg-slate-200 text-slate-500 font-bold px-3 py-2 rounded-xl shrink-0 cursor-not-allowed';
    checkinBtn.innerText = 'Checked In';
  } else {
    checkinBtn.disabled = false;
    checkinBtn.className = 'text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-xl shadow shrink-0';
    checkinBtn.innerText = `Check-in (+₦${state.platformSettings.checkinBonus})`;
  }

  const totalTeamCount = (state.teamLevels[1].length + state.teamLevels[2].length + state.teamLevels[3].length + state.teamLevels[4].length);
  document.getElementById('teamTotalCounter').textContent = totalTeamCount;

  [1, 2, 3, 4].forEach(lvl => {
    const container = document.getElementById(`teamLevelList-${lvl}`);
    const members = state.teamLevels[lvl] || [];
    if (container) {
      if (members.length === 0) {
        container.innerHTML = `<p class="text-slate-400 italic text-xs py-1">No downline members in Level ${lvl}.</p>`;
      } else {
        container.innerHTML = members.map(m => `
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
            <span class="font-bold text-slate-800">${m.email}</span>
            <span class="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">Level ${lvl}</span>
          </div>
        `).join('');
      }
    }
  });

  const activeList = document.getElementById('activeInvestmentsList');
  const investments = state.activeInvestments || [];
  if (investments.length === 0) {
    activeList.innerHTML = `<p class="text-slate-400 italic">No active power node plans. Invest below to start earning.</p>`;
  } else {
    activeList.innerHTML = investments.map(inv => `
      <div class="bg-slate-50 p-3 rounded-xl border border-emerald-100 flex justify-between items-center">
        <div>
          <div class="font-bold text-slate-900">${inv.pkg_name}</div>
          <div class="text-[10px] text-emerald-600 font-semibold">Daily: ₦${Number(inv.daily_income).toLocaleString()} | Progress: ${inv.days_claimed}/${inv.days_total} Days</div>
        </div>
        <span class="text-[10px] bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-lg">Active</span>
      </div>
    `).join('');
  }

  const vipGrid = document.getElementById('vipGrid');
  vipGrid.innerHTML = VIP_PACKAGES.map(pkg => {
    const userPurchased = (state.user.purchases && state.user.purchases[pkg.id]) || 0;
    const isLimitReached = userPurchased >= pkg.limit;

    return `
      <div class="bg-white border border-emerald-100 rounded-3xl p-4 shadow-sm space-y-3">
        <div class="flex justify-between items-center bg-slate-50 p-2 rounded-2xl border border-slate-100">
          <div class="flex items-center gap-2">
            <span class="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-xl">VIP ${pkg.id}</span>
            <span class="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> OPEN</span>
          </div>
          <span class="text-[11px] font-bold text-slate-500 bg-white px-3 py-1 rounded-xl border border-slate-200">Limit: ${userPurchased}/${pkg.limit}</span>
        </div>

        <div class="bg-slate-50/70 border border-emerald-50 rounded-2xl p-3 flex gap-3 items-center">
          <img src="${pkg.image}" alt="${pkg.name}" class="w-20 h-20 object-cover rounded-xl border border-slate-200 shrink-0">
          <div class="flex-1 space-y-1">
            <div class="text-[10px] font-bold text-emerald-600 uppercase">⚡ 45W ULTRA CHARGE</div>
            <h4 class="font-black text-slate-900 text-sm">${pkg.name}</h4>
            <p class="text-[10px] text-slate-400">Shiplus 45W USB Fast Charger</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-2xl border border-slate-100">
          <div>Daily Income: <strong class="text-slate-900">₦${pkg.daily.toLocaleString()}</strong></div>
          <div>Total Yield: <strong class="text-slate-900">₦${pkg.total.toLocaleString()}</strong></div>
          <div>Commission: <strong class="text-emerald-600">₦${pkg.commission.toLocaleString()}</strong></div>
          <div>Price: <strong class="text-emerald-600">₦${pkg.price.toLocaleString()}</strong></div>
        </div>

        <button onclick="buyVipPackage(${pkg.id})" ${isLimitReached ? 'disabled' : ''} class="w-full font-bold py-3 rounded-2xl text-xs shadow transition ${isLimitReached ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'}">
          ${isLimitReached ? 'Limit Reached' : `Invest ₦${pkg.price.toLocaleString()}`}
        </button>
      </div>
    `;
  }).join('');

  const userTxTable = document.getElementById('userTxTable');
  const myTxs = (state.transactions || []).filter(t => currentUser && t.user_email.toLowerCase() === currentUser.email.toLowerCase());
  userTxTable.innerHTML = myTxs.map(tx => `
    <tr>
      <td class="p-2.5 font-medium text-slate-800">${tx.type}</td>
      <td class="p-2.5 font-bold text-slate-900">₦${Number(tx.amount).toLocaleString()}</td>
      <td class="p-2.5"><span class="px-2 py-0.5 rounded text-[9px] font-bold ${tx.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">${tx.status}</span></td>
      <td class="p-2.5 text-slate-400 text-[9px]">${new Date(tx.created_at).toLocaleDateString()}</td>
    </tr>
  `).join('');

  if (state.isAdminView && currentUser && currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    const adminGiftList = document.getElementById('adminGiftCodesList');
    if (adminGiftList) {
      const giftCodes = state.giftCodes || [];
      if (giftCodes.length === 0) {
        adminGiftList.innerHTML = `<p class="text-slate-400 italic text-[11px]">No gift codes created yet.</p>`;
      } else {
        adminGiftList.innerHTML = giftCodes.map(g => `
          <div class="bg-slate-50 p-2 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
            <div><strong class="text-emerald-600">${g.code}</strong> - ₦${g.amount}</div>
            <div class="text-slate-500">Qty: ${g.remaining_qty}/${g.total_qty}</div>
          </div>
        `).join('');
      }
    }

    document.getElementById('adminUsersTable').innerHTML = state.allUsersList.map(u => {
      const userInvTxs = (state.transactions || []).filter(t => t.user_email.toLowerCase() === u.email.toLowerCase() && t.type.startsWith('Invest:') && t.status === 'Completed');
      const totalInvested = userInvTxs.reduce((sum, t) => sum + Number(t.amount), 0);
      const bankInfo = u.bank_account ? `${u.bank_account.bankName} (${u.bank_account.accountNo})` : 'Not Bound';

      return `
        <tr>
          <td class="p-2.5 text-slate-800 font-semibold">${u.email}</td>
          <td class="p-2.5 text-emerald-600 font-bold">₦${Number(u.balance || 0).toLocaleString()}</td>
          <td class="p-2.5 text-slate-900 font-black">₦${totalInvested.toLocaleString()}</td>
          <td class="p-2.5 text-slate-500 text-[10px]">${bankInfo}</td>
        </tr>
      `;
    }).join('');

    document.getElementById('adminTxTable').innerHTML = state.transactions.filter(t => t.status === 'Pending').map(tx => `
      <tr>
        <td class="p-2">${tx.user_email}</td>
        <td class="p-2">${tx.type}</td>
        <td class="p-2 font-bold">₦${Number(tx.amount).toLocaleString()}</td>
        <td class="p-2 space-x-1">
          <button onclick="processAdminTx('${tx.id}', 'Approve')" class="bg-emerald-600 text-white px-2 py-1 rounded text-[10px] font-bold">Approve</button>
          <button onclick="processAdminTx('${tx.id}', 'Reject')" class="bg-rose-600 text-white px-2 py-1 rounded text-[10px] font-bold">Reject</button>
        </td>
      </tr>
    `).join('');
  }
}

async function saveBankBinding() {
  const bankName = document.getElementById('bindBankName').value.trim();
  const accountNo = document.getElementById('bindAccountNo').value.trim();
  const accountName = document.getElementById('bindAccountName').value.trim();
  if (!bankName || accountNo.length < 10 || !accountName) { 
    alert('Please enter valid bank details and a complete 10-digit account number.'); 
    return; 
  }
  state.user.bankAccount = { bankName, accountNo, accountName };
  await saveUserProfile();
  render();
  alert('Withdrawal bank account bound successfully!');
}

function unlockBankEdit() {
  document.getElementById('bankUnboundView').classList.remove('hidden');
  document.getElementById('bankBoundView').classList.add('hidden');
  if (state.user.bankAccount) {
    document.getElementById('bindBankName').value = state.user.bankAccount.bankName || '';
    document.getElementById('bindAccountNo').value = state.user.bankAccount.accountNo || '';
    document.getElementById('bindAccountName').value = state.user.bankAccount.accountName || '';
  }
}

async function savePlatformSettings() {
  const minDep = document.getElementById('settingMinDeposit').value;
  const chkBonus = document.getElementById('settingCheckin').value;
  state.platformSettings.minDeposit = parseFloat(minDep) || 3800;
  state.platformSettings.checkinBonus = parseFloat(chkBonus) || 50;
  render();
  alert('Global platform settings saved successfully!');
}

async function claimDailyCheckin() {
  const today = new Date().toDateString();
  const bonus = state.platformSettings.checkinBonus;
  state.user.balance += bonus;
  state.user.lastCheckin = today;
  await saveUserProfile();
  await supabaseClient.from('transactions').insert([{ user_email: currentUser.email.toLowerCase(), type: 'Daily Reward', amount: bonus, fee: 0, status: 'Completed' }]);
  render();
  alert(`Success! ₦${bonus} added.`);
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
  if (state.user.balance < pkg.price) { alert('Insufficient balance.'); return; }
  state.user.balance -= pkg.price;
  if (!state.user.purchases) state.user.purchases = {};
  state.user.purchases[pkgId] = (state.user.purchases[pkgId] || 0) + 1;
  await saveUserProfile();

  await supabaseClient.from('active_investments').insert([{
    user_email: currentUser.email.toLowerCase(),
    pkg_name: pkg.name,
    price: pkg.price,
    daily_income: pkg.daily,
    days_total: pkg.days,
    days_claimed: 0,
    last_claim_timestamp: Date.now()
  }]);
  await supabaseClient.from('transactions').insert([{ user_email: currentUser.email.toLowerCase(), type: `Invest: ${pkg.name}`, amount: pkg.price, fee: 0, status: 'Completed' }]);
  await loadUserData(currentUser.email);
  render();
  alert(`Successfully invested in ${pkg.name}!`);
}

async function submitDeposit() {
  const amount = parseFloat(document.getElementById('depositAmount').value);
  const minDep = state.platformSettings.minDeposit;
  if (!amount || amount < minDep) { alert(`Minimum deposit is ₦${minDep.toLocaleString()}.`); return; }
  await supabaseClient.from('transactions').insert([{ user_email: currentUser.email.toLowerCase(), type: 'Deposit', amount, fee: 0, status: 'Pending' }]);
  closeModal('depositModal');
  render();
  alert('Deposit submitted for review.');
}

function openWithdrawModal() {
  if (!state.user.bankAccount) { alert('Bind bank account first.'); switchTab('my'); return; }
  openModal('withdrawModal');
}

async function submitWithdrawal() {
  const amount = parseFloat(document.getElementById('withdrawAmount').value);
  if (!amount || amount < 1000) { alert('Minimum withdrawal is ₦1,000.'); return; }
  state.user.balance -= amount;
  await saveUserProfile();
  await supabaseClient.from('transactions').insert([{ user_email: currentUser.email.toLowerCase(), type: 'Withdrawal', amount, fee: amount * 0.15, status: 'Pending' }]);
  closeModal('withdrawModal');
  render();
  alert('Withdrawal request submitted.');
}

async function processAdminTx(txId, action) {
  const tx = state.transactions.find(t => t.id === txId);
  if (!tx) return;
  const newStatus = action === 'Approve' ? 'Completed' : 'Rejected';
  await supabaseClient.from('transactions').update({ status: newStatus }).eq('id', txId);

  if (action === 'Approve' && tx.type === 'Deposit') {
    const { data: targetProf } = await supabaseClient.from('profiles').select('*').eq('email', tx.user_email).maybeSingle();
    if (targetProf) {
      const newBal = Number(targetProf.balance || 0) + Number(tx.amount);
      await supabaseClient.from('profiles').update({ balance: newBal }).eq('email', tx.user_email);
    }
  } else if (action === 'Reject' && tx.type === 'Withdrawal') {
    const { data: targetProf } = await supabaseClient.from('profiles').select('*').eq('email', tx.user_email).maybeSingle();
    if (targetProf) {
      const newBal = Number(targetProf.balance || 0) + Number(tx.amount);
      await supabaseClient.from('profiles').update({ balance: newBal }).eq('email', tx.user_email);
    }
  }

  await fetchGlobalData();
  render();
}

function toggleAdminView() {
  state.isAdminView = !state.isAdminView;
  document.getElementById('adminView').classList.toggle('hidden', !state.isAdminView);
  document.getElementById('tabContent-dashboard').classList.toggle('hidden', state.isAdminView);
  render();
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function copyReferralLink() { navigator.clipboard.writeText(document.getElementById('refLink').innerText); alert('Referral link copied!'); }
function copyAccountDetails() { navigator.clipboard.writeText('5112715845'); alert('Account number copied!'); }

document.addEventListener('DOMContentLoaded', async () => {
  const savedSession = localStorage.getItem('shiplus_session');
  if (savedSession) {
    currentUser = JSON.parse(savedSession);
    await loadUserData(currentUser.email);
    showMainApp(false);
  } else {
    document.getElementById('authContainer').classList.remove('hidden');
  }
  lucide.createIcons();
});
