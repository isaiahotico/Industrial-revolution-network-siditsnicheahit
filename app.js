
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, update, onValue, push, query, orderByChild, limitToLast } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDMGU5X7BBp-C6tIl34Uuu5N9MXAVFTn7c",
    authDomain: "paper-house-inc.firebaseapp.com",
    databaseURL: "https://paper-house-inc-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "paper-house-inc",
    storageBucket: "paper-house-inc.firebasestorage.app",
    messagingSenderId: "658389836376",
    appId: "1:658389836376:web:2ab1e2743c593f4ca8e02d"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentUser = null;
let currentTaskIndex = null;
let timerSeconds = 45;
let timerInterval = null;
let isPaused = false;

const taskLinks = [
    "https://sentinelgroup3.blogspot.com/?m=1", "https://sentinelgroup7.blogspot.com/?m=1",
    "https://sentinelgroup6.blogspot.com/?m=1", "https://sentinelgroup5.blogspot.com/?m=1",
    "https://sentinelgroup4.blogspot.com/?m=1", "https://sentinelgroup2.blogspot.com/?m=1",
    "https://sentinelgroup1.blogspot.com/?m=1", "https://withdrawaldashboardadmin.blogspot.com/?m=1",
    "https://farfightimi.blogspot.com/?m=1", "https://lefthandedfirstofall.blogspot.com/?m=1",
    "https://kayee01.blogspot.com/?m=1", "https://paperhouse01.blogspot.com/?m=1",
    "https://funnyfaces252.blogspot.com/?m=1"
];

// --- AUTH ---
window.login = async () => {
    const user = document.getElementById('tg-username').value.trim();
    if (user.length < 3) return alert("Invalid Username");
    
    const uKey = user.replace(/[^a-zA-Z0-9]/g, '_');
    const userRef = ref(db, 'users/' + uKey);
    const snap = await get(userRef);
    
    if (snap.exists()) {
        currentUser = snap.val();
    } else {
        currentUser = {
            username: user, balance: 0, 
            referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
            referredBy: "", totalReferrals: 0, referralEarnings: 0, cooldowns: {}
        };
        await set(userRef, currentUser);
    }
    document.getElementById('auth-screen').style.display = 'none';
    initApp();
};

function initApp() {
    updateUI();
    renderTasks();
    listenChat();
    listenLeaderboard();
    listenWithdrawals();
    setInterval(renderTasks, 1000); 
}

function updateUI() {
    const uKey = currentUser.username.replace(/[^a-zA-Z0-9]/g, '_');
    onValue(ref(db, 'users/' + uKey), (snap) => {
        currentUser = snap.val();
        document.getElementById('display-username').innerText = currentUser.username;
        document.getElementById('display-balance').innerText = `₱${currentUser.balance.toFixed(3)}`;
        document.getElementById('my-ref-code').innerText = currentUser.referralCode;
        document.getElementById('total-ref').innerText = currentUser.totalReferrals;
        document.getElementById('ref-earnings').innerText = `₱${currentUser.referralEarnings.toFixed(3)}`;
    });
}

// --- TASK LOGIC ---
window.renderTasks = () => {
    const container = document.getElementById('links-container');
    const now = Date.now();
    container.innerHTML = '';

    taskLinks.forEach((link, index) => {
        const lastClick = currentUser.cooldowns?.[index] || 0;
        const diff = now - lastClick;
        const isCooldown = diff < (2 * 60 * 60 * 1000);
        
        const btn = document.createElement('div');
        btn.className = `p-4 rounded-3xl flex justify-between items-center transition-all ${isCooldown ? 'bg-gray-100 opacity-50' : 'bg-white shadow-sm border border-gray-100 hover:border-blue-300'}`;
        
        let label = `<span class="text-green-600 font-black">₱0.019 Reward</span>`;
        if (isCooldown) {
            const rem = (2 * 60 * 60 * 1000) - diff;
            const m = Math.floor((rem % 3600000) / 60000);
            const s = Math.floor((rem % 60000) / 1000);
            label = `<span class="text-red-500 font-bold text-xs">Cooldown: ${m}m ${s}s</span>`;
        }

        btn.innerHTML = `
            <div>
                <p class="font-bold text-sm uppercase italic text-gray-400">Task Link ${index+1}</p>
                ${label}
            </div>
            ${!isCooldown ? `<button onclick="openTask(${index},'${link}')" class="bg-blue-600 text-white px-5 py-2 rounded-2xl font-black text-xs">OPEN</button>` : ''}
        `;
        container.appendChild(btn);
    });
};

window.openTask = (index, link) => {
    currentTaskIndex = index;
    document.getElementById('task-frame').src = link;
    document.getElementById('task-viewer').style.display = 'block';
    
    // Initial Adsgram Ad
    const AdController = window.Adsgram?.init({ blockId: "21470" });
    AdController?.show().finally(() => startTaskTimer());
};

function startTaskTimer() {
    timerSeconds = 45;
    isPaused = false;
    updateTimerUI();

    timerInterval = setInterval(() => {
        if (!isPaused) {
            timerSeconds--;
            updateTimerUI();

            // Auto-pause every 5 seconds for "Browser Interaction Check"
            if (timerSeconds % 5 === 0 && timerSeconds > 0) {
                isPaused = true;
                document.getElementById('interaction-layer').classList.add('active');
            }

            // Random Ad Trigger every 10 seconds (sometimes Monetag, sometimes Adsgram)
            if (timerSeconds % 10 === 0 && timerSeconds > 0) {
                triggerRandomAd();
            }

            if (timerSeconds <= 0) {
                clearInterval(timerInterval);
                finishTask();
            }
        }
    }, 1000);
}

// User clicks the transparent layer to "browse/resume"
document.getElementById('interaction-layer').addEventListener('click', () => {
    isPaused = false;
    document.getElementById('interaction-layer').classList.remove('active');
    updateTimerUI();
});

function triggerRandomAd() {
    const dice = Math.random();
    if (dice > 0.5) {
        // Trigger Monetag Interstitial
        if(window.show_10555746) window.show_10555746({ type: 'inApp' });
    } else {
        // Trigger Adsgram
        const ids = ['21470', '21639', '21423'];
        const randomId = ids[Math.floor(Math.random() * ids.length)];
        window.Adsgram?.init({ blockId: randomId }).show();
    }
}

function updateTimerUI() {
    document.getElementById('timer-box').innerText = timerSeconds + "s";
}

async function finishTask() {
    const uKey = currentUser.username.replace(/[^a-zA-Z0-9]/g, '_');
    const reward = 0.019;
    const updates = {};
    
    updates[`users/${uKey}/balance`] = currentUser.balance + reward;
    updates[`users/${uKey}/cooldowns/${currentTaskIndex}`] = Date.now();

    // Referral 10% auto payout
    if (currentUser.referredBy) {
        const refKey = currentUser.referredBy.replace(/[^a-zA-Z0-9]/g, '_');
        const refSnap = await get(ref(db, 'users/' + refKey));
        if (refSnap.exists()) {
            const r = refSnap.val();
            updates[`users/${refKey}/balance`] = (r.balance || 0) + (reward * 0.1);
            updates[`users/${refKey}/referralEarnings`] = (r.referralEarnings || 0) + (reward * 0.1);
        }
    }

    await update(ref(db), updates);
    alert("Task Success! ₱0.019 Credited");
    document.getElementById('task-viewer').style.display = 'none';
}

// --- SYSTEM MODULES ---
window.showTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
};

window.submitReferral = async () => {
    const code = document.getElementById('input-ref-code').value.trim().toUpperCase();
    if (code === currentUser.referralCode || currentUser.referredBy) return alert("Invalid Action");
    
    const snapshot = await get(ref(db, 'users'));
    let foundKey = null;
    snapshot.forEach(c => { if(c.val().referralCode === code) foundKey = c.key; });

    if (foundKey) {
        const uKey = currentUser.username.replace(/[^a-zA-Z0-9]/g, '_');
        await update(ref(db, `users/${uKey}`), { referredBy: foundKey });
        await update(ref(db, `users/${foundKey}`), { totalReferrals: (snapshot.child(foundKey).val().totalReferrals || 0) + 1 });
        alert("Referral Linked!");
    }
};

window.sendMessage = () => {
    const text = document.getElementById('chat-input').value;
    if (!text) return;
    push(ref(db, 'chats'), { user: currentUser.username, text, time: Date.now() });
    document.getElementById('chat-input').value = '';
};

function listenChat() {
    onValue(query(ref(db, 'chats'), limitToLast(15)), (snap) => {
        const box = document.getElementById('chat-messages');
        box.innerHTML = '';
        snap.forEach(c => {
            const m = c.val();
            box.innerHTML += `<div class="bg-white border p-3 rounded-2xl w-fit max-w-[85%] shadow-sm">
                <p class="text-[9px] font-black text-blue-600 uppercase mb-1">${m.user}</p>
                <p class="text-sm font-medium">${m.text}</p>
            </div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
}

function listenLeaderboard() {
    onValue(query(ref(db, 'users'), orderByChild('balance'), limitToLast(10)), (snap) => {
        const list = document.getElementById('leaderboard-list');
        list.innerHTML = '';
        let users = []; snap.forEach(c => users.push(c.val()));
        users.reverse().forEach((u, i) => {
            list.innerHTML += `<div class="flex justify-between p-4 bg-white">
                <span class="text-sm font-bold text-gray-600">${i+1}. ${u.username}</span>
                <span class="text-blue-600 font-black">₱${u.balance.toFixed(3)}</span>
            </div>`;
        });
    });
}

window.requestWithdraw = async () => {
    const amount = parseFloat(document.getElementById('withdraw-amount').value);
    if (amount > currentUser.balance || amount < 1) return alert("Invalid Amount");
    
    const uKey = currentUser.username.replace(/[^a-zA-Z0-9]/g, '_');
    const req = {
        uid: uKey, username: currentUser.username, amount,
        method: document.getElementById('withdraw-method').value,
        details: document.getElementById('withdraw-details').value,
        status: 'pending', time: Date.now()
    };
    await push(ref(db, 'withdrawals'), req);
    await update(ref(db, `users/${uKey}`), { balance: currentUser.balance - amount });
    alert("Withdrawal Pending Approval");
};

function listenWithdrawals() {
    onValue(ref(db, 'withdrawals'), (snap) => {
        const history = document.getElementById('withdraw-history');
        history.innerHTML = '';
        snap.forEach(c => {
            const w = c.val();
            if (w.username === currentUser.username) {
                history.innerHTML += `<div class="bg-white p-3 rounded-2xl border flex justify-between items-center text-xs">
                    <span class="font-bold">${w.method} - ₱${w.amount}</span>
                    <span class="font-black uppercase ${w.status === 'pending' ? 'text-orange-500' : 'text-green-600'}">${w.status}</span>
                </div>`;
            }
        });
    });
}

window.checkAdmin = () => {
    if (prompt("ADMIN KEY") === "Propetas12") {
        showTab('admin-panel');
        onValue(ref(db, 'withdrawals'), (snap) => {
            const box = document.getElementById('admin-withdrawals');
            box.innerHTML = '';
            snap.forEach(c => {
                if(c.val().status === 'pending') {
                    const w = c.val();
                    box.innerHTML += `<div class="bg-white p-4 rounded-3xl border-l-4 border-blue-600 shadow-sm">
                        <p class="font-black">${w.username} - ₱${w.amount}</p>
                        <p class="text-[10px] text-gray-500">${w.method}: ${w.details}</p>
                        <button onclick="approve('${c.key}')" class="mt-3 bg-blue-600 text-white px-6 py-2 rounded-xl text-xs font-bold">APPROVE</button>
                    </div>`;
                }
            });
        });
    }
};

window.approve = (key) => update(ref(db, `withdrawals/${key}`), { status: 'approved' });
