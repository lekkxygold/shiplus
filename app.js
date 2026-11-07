// ==========================================
// SUPABASE CONFIGURATION
// ==========================================
const SUPABASE_URL = 'https://mhmvygubhzgmwovhzbdn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_PeRJyArsWXjzro5thtOiVA_18BvrLBZ';
let supabase = null;

try {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (err) {
  console.warn('Supabase initialization fallback to local storage mode.');
}

// ==========================================
// VIP PACKAGES DATA (WITH CHARGER IMAGES)
// ==========================================
const VIP_PACKAGES = [
  { 
    id: 1, 
    name: 'Shiplus VIP-1', 
    price: 3800, 
    daily: 800, 
    days: 40, 
    total: 32000, 
    commission: 875, 
    limit: 1, 
    doubleIncome: 800,
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=400&q=80'
  },
  { 
    id: 2, 
    name: 'Shiplus VIP-2', 
    price: 7500, 
    daily: 1350, 
    days: 40, 
    total: 54000, 
    commission: 1875, 
    limit: 1, 
    doubleIncome: 3200,
    image: 'https://images.unsplash.com/photo-1609592424089-9fa91e2b4f62?auto=format&fit=crop&w=400&q=80'
  },
  { 
    id: 3, 
    name: 'Shiplus VIP-3', 
    price: 17500, 
    daily: 3200, 
    days: 40, 
    total: 128000, 
    commission: 4375, 
    limit: 3, 
    doubleIncome: 7125,
    image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=400&q=80'
  },
  { 
    id: 4, 
    name: 'Shiplus VIP-4', 
    price: 37500, 
    daily: 7125, 
    days: 40, 
    total: 285000, 
    commission: 9375, 
    limit: 3, 
    doubleIncome: 15000,
    image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=400&q=80'
  },
  { 
    id: 5, 
    name: 'Shiplus VIP-5', 
    price: 75000, 
    daily: 15000, 
    days: 40, 
    total: 600000, 
    commission: 18750, 
    limit: 3, 
    doubleIncome: 31500,
    image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=400&q=80'
  },
  { 
    id: 6, 
    name: 'Shiplus VIP-6', 
    price: 150000, 
    daily: 31500, 
    days: 40, 
    total: 1260000, 
    commission: 37500, 
    limit: 3, 
    doubleIncome: 77000,
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=400&q=80'
  },
  { 
    id: 7, 
    name: 'Shiplus VIP-7', 
    price: 350000, 
    daily: 70000, 
    days: 40, 
    total: 2800000, 
    commission: 87500, 
    limit: 3, 
    doubleIncome: 126000,
    image: 'https://images.unsplash.com/photo-1609592424089-9fa91e2b4f62?auto=format&fit=crop&w=400&q=80'
  },
  { 
    id: 8, 
    name: 'Shiplus VIP-8', 
    price: 550000, 
    daily: 126000, 
    days: 40, 
    total: 5040000, 
    commission: 137500, 
    limit: 3, 
    doubleIncome: 180000,
    image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=400&q=80'
  },
  { 
    id: 9, 
    name: 'Shiplus VIP-9', 
    price: 750000, 
    daily: 180000, 
    days: 40, 
    total: 7200000, 
    commission: 187500, 
    limit: 3, 
    doubleIncome: 237500,
    image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=400&q=80'
  },
  { 
    id: 10, 
    name: 'Shiplus VIP-10', 
    price: 950000, 
    daily: 237500, 
    days: 40, 
    total: 9500000, 
    commission: 237500, 
    limit: 3, 
    doubleIncome: 390000,
    image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=400&q=80'
  }
];

// ==========================================
// APPLICATION STATE
// ==========================================
let state = {
  user: {
    id: 'usr_101',
    balance: 1000,
    lastCheckin: null,
    purchases: {}
  },
  transactions: [
    { id: 'tx_0', user: 'usr_101', type: 'Bonus', amount: 1000, fee: 0, status: 'Completed', date: new Date().toISOString() }
  ],
  isAdminView: false
};

function loadLocalState() {
  const saved = localStorage.getItem('shiplus_state');
  if (saved) {
    try { state = JSON.parse(saved); } catch(e) {}
  }
}

function saveLocalState() {
  localStorage.setItem('shiplus_state', JSON.stringify(state));
}

// ==========================================
// RENDER FUNCTIONS
// ==========================================
function render() {
  // Balance
  document.getElementById('userBalance').textContent = `₦${state.user.balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

  // Daily Checkin Status
  const checkinBtn = document.getElementById('checkinBtn');
  const today = new Date().toDateString();
  if (state.user.lastCheckin === today) {
    checkinBtn.disabled = true;
    checkinBtn.classList.add('opacity-50', 'cursor-not-allowed');
    checkinBtn.innerText = 'Checked In Today';
  }

  // Render VIP Grid with Charger Images
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

  // Transactions Table
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

  // Admin View Table
  const adminTxTable = document.getElementById('adminTxTable');
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

// ==========================================
// ACTIONS
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
    user: state.user.id,
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
  state.transactions.unshift({
    id: 'tx_' + Date.now(),
    user: state.user.id,
    type: `Invest: ${pkg.name}`,
    amount: pkg.price,
    fee: 0,
    status: 'Completed',
    date: new Date().toISOString()
  });

  saveLocalState();
  render();
  alert(`Congratulations! You have successfully purchased ${pkg.name}.`);
}

function submitDeposit() {
  const amount = parseFloat(document.getElementById('depositAmount').value);
  if (!amount || amount < 1000) {
    alert('Minimum deposit amount is ₦1,000.');
    return;
  }

  state.transactions.unshift({
    id: 'tx_' + Date.now(),
    user: state.user.id,
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
  alert('Deposit request submitted! Awaiting admin confirmation after payment transfer.');
}

function copyAccountDetails() {
  navigator.clipboard.writeText('5112715845');
  alert('Account number 5112715845 copied to clipboard!');
}

function submitWithdrawal() {
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

  state.transactions.unshift({
    id: 'tx_' + Date.now(),
    user: state.user.id,
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
  const tx = state.transactions.find(t => t.id === txId);
  if (!tx) return;

  if (action === 'Approve') {
    tx.status = 'Completed';
    if (tx.type === 'Deposit') {
      state.user.balance += tx.amount;
    }
  } else {
    tx.status = 'Rejected';
    if (tx.type === 'Withdrawal') {
      state.user.balance += tx.amount;
    }
  }

  saveLocalState();
  render();
}

function toggleAdminView() {
  state.isAdminView = !state.isAdminView;
  const userView = document.getElementById('userView');
  const adminView = document.getElementById('adminView');
  const toggleBtn = document.getElementById('toggleAdminBtn');

  if (state.isAdminView) {
    userView.classList.add('hidden');
    adminView.classList.remove('hidden');
    toggleBtn.textContent = 'Switch to User';
  } else {
    userView.classList.remove('hidden');
    adminView.classList.add('hidden');
    toggleBtn.textContent = 'Switch to Admin';
  }
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function copyReferralLink() {
  const linkText = document.getElementById('refLink').innerText;
  navigator.clipboard.writeText(linkText);
  alert('Referral link copied to clipboard!');
}

function handleAuthAction() {
  alert('Logged out successfully.');
}

document.addEventListener('DOMContentLoaded', () => {
  loadLocalState();
  render();
  lucide.createIcons();
});
