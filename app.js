
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

// --- AUTH LOGIC ---
window.login = async () => {
    const user = document.getElementById('tg-username').value.trim();
    if (user.length < 3) return alert("Valid username required");
    
    const userRef = ref(db, 'users/' + user.replace('.', '_'));
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
        currentUser = snapshot.val();
    } else {
        currentUser = {
            username: user,
            balance: 0,
            referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
            referredBy: "",
            totalReferrals: 0,
            referralEarnings: 0,
            cooldowns: {}
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

    // Show Interstitial Ad on Init
    if(window.show_10555746) {
        window.show_10555746({
            type: 'inApp',
            inAppSettings: { frequency: 2, capping: 0.1, interval: 30, timeout: 5, everyPage: false }
        });
    }
}

// --- UI UPDATES ---
function updateUI() {
    const u = currentUser.username.replace('.', '_');
    onValue(ref(db, 'users/' + u), (snapshot) => {
        currentUser = snapshot.val();
        document.getElementById('display-username').innerText = currentUser.username;
        document.getElementById('display-balance').innerText = `₱${currentUser.balance.toFixed(3)}`;
        document.getElementById('my-ref-code').innerText = currentUser.referralCode;
        document.getElementById('total-ref').innerText = currentUser.totalReferrals;
        document.getElementById('ref-earnings').innerText = `₱${currentUser.referralEarnings.toFixed(3)}`;
    });
}

window.showTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelectorAll('nav button').forEach(el => el.classList.replace('text-blue-600', 'text-gray-400'));
};

// --- TASK LOGIC ---
function renderTasks() {
    const container = document.getElementById('links-container');
    container.innerHTML = '';
    taskLinks.forEach((link, index) => {
        const lastClick = currentUser.cooldowns?.[index] || 0;
        const now = Date.now();
        const isCooldown = (now - lastClick) < (2 * 60 * 60 * 1000);
        
        const btn = document.createElement('button');
        btn.className = `p-4 rounded-xl flex justify-between items-center ${isCooldown ? 'bg-gray-200 opacity-50' : 'bg-white shadow-sm hover:shadow-md'}`;
        btn.disabled = isCooldown;
        btn.onclick = () => startTask(index, link);
        btn.innerHTML = `
            <span class="font-medium text-sm">Ad Link #${index + 1}</span>
            <span class="text-xs ${isCooldown ? 'text-red-500' : 'text-green-500'}">
                ${isCooldown ? 'Cooldown Active' : '₱0.019 • 45s'}
            </span>
        `;
        container.appendChild(btn);
    });
}

function startTask(index, link) {
    // Show AdsGram Ad first
    const AdController = window.Adsgram?.init({ blockId: "21470" }); // Using one of your IDs
    AdController?.show().finally(() => {
        currentTaskIndex = index;
        window.open(link, '_blank');
        document.getElementById('timerOverlay').style.display = 'block';
        startTimerLogic();
    });
}

function startTimerLogic() {
    timerSeconds = 45;
    isPaused = false;
    document.getElementById('seconds').innerText = timerSeconds + "s";
    
    timerInterval = setInterval(() => {
        if (!isPaused) {
            timerSeconds--;
            document.getElementById('seconds').innerText = timerSeconds + "s";
            
            if (timerSeconds % 5 === 0 && timerSeconds !== 0) {
                isPaused = true;
                document.getElementById('timerMessage').innerText = "PAUSED - DOUBLE CLICK TO RESUME";
                document.getElementById('timerMessage').classList.add('text-red-500');
            }
            
            if (timerSeconds <= 0) {
                clearInterval(timerInterval);
                completeTask();
            }
        }
    }, 1000);
}

// Resume Timer on Double Click
document.getElementById('timerOverlay').addEventListener('dblclick', () => {
    if (isPaused) {
        isPaused = false;
        document.getElementById('timerMessage').innerText = "Timer Running...";
        document.getElementById('timerMessage').classList.replace('text-red-500', 'text-yellow-400');
    }
});

async function completeTask() {
    const uKey = currentUser.username.replace('.', '_');
    const reward = 0.019;
    
    // Update balance and cooldown
    const updates = {};
    updates[`users/${uKey}/balance`] = currentUser.balance + reward;
    updates[`users/${uKey}/cooldowns/${currentTaskIndex}`] = Date.now();
    
    // Referral Logic (10%)
    if (currentUser.referredBy) {
        const refKey = currentUser.referredBy.replace('.', '_');
        const refSnap = await get(ref(db, 'users/' + refKey));
        if (refSnap.exists()) {
            const refData = refSnap.val();
            updates[`users/${refKey}/balance`] = (refData.balance || 0) + (reward * 0.1);
            updates[`users/${refKey}/referralEarnings`] = (refData.referralEarnings || 0) + (reward * 0.1);
        }
    }
    
    await update(ref(db), updates);
    document.getElementById('timerOverlay').style.display = 'none';
    alert("Reward ₱0.019 added!");
    renderTasks();
}

// --- REFERRAL SYSTEM ---
window.submitReferral = async () => {
    const code = document.getElementById('input-ref-code').value.trim().toUpperCase();
    if (code === currentUser.referralCode) return alert("Can't refer yourself");
    if (currentUser.referredBy) return alert("Already referred");

    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    let inviterKey = null;

    snapshot.forEach(child => {
        if (child.val().referralCode === code) inviterKey = child.key;
    });

    if (inviterKey) {
        const updates = {};
        updates[`users/${currentUser.username.replace('.', '_')}/referredBy`] = inviterKey;
        updates[`users/${inviterKey}/totalReferrals`] = (snapshot.child(inviterKey).val().totalReferrals || 0) + 1;
        await update(ref(db), updates);
        alert("Referral Applied!");
    } else {
        alert("Invalid Code");
    }
};

// --- CHAT & LEADERBOARD & WITHDRAW ---
function listenChat() {
    onValue(query(ref(db, 'chats'), limitToLast(20)), (snap) => {
        const box = document.getElementById('chat-messages');
        box.innerHTML = '';
        snap.forEach(child => {
            const m = child.val();
            box.innerHTML += `<div class="text-sm"><strong>${m.user}:</strong> ${m.text}</div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
}

window.sendMessage = () => {
    const text = document.getElementById('chat-input').value;
    if (!text) return;
    push(ref(db, 'chats'), { user: currentUser.username, text: text });
    document.getElementById('chat-input').value = '';
};

function listenLeaderboard() {
    onValue(query(ref(db, 'users'), orderByChild('balance'), limitToLast(10)), (snap) => {
        const list = document.getElementById('leaderboard-list');
        list.innerHTML = '';
        let items = [];
        snap.forEach(child => items.push(child.val()));
        items.reverse().forEach((u, i) => {
            list.innerHTML += `
                <div class="flex justify-between p-3">
                    <span>${i+1}. ${u.username}</span>
                    <span class="font-bold text-blue-600">₱${u.balance.toFixed(2)}</span>
                </div>`;
        });
    });
}

window.requestWithdraw = async () => {
    const amount = parseFloat(document.getElementById('withdraw-amount').value);
    const method = document.getElementById('withdraw-method').value;
    const details = document.getElementById('withdraw-details').value;

    if (amount > currentUser.balance || amount < 1) return alert("Invalid amount");

    const request = {
        uid: currentUser.username.replace('.', '_'),
        username: currentUser.username,
        amount, method, details, status: 'pending', timestamp: Date.now()
    };
    
    await push(ref(db, 'withdrawals'), request);
    await update(ref(db, `users/${request.uid}`), { balance: currentUser.balance - amount });
    alert("Withdrawal Requested!");
};

function listenWithdrawals() {
    onValue(ref(db, 'withdrawals'), (snap) => {
        const history = document.getElementById('withdraw-history');
        history.innerHTML = '';
        snap.forEach(child => {
            const w = child.val();
            if (w.username === currentUser.username) {
                history.innerHTML += `
                    <div class="bg-gray-50 p-2 rounded flex justify-between">
                        <span>${w.amount} PHP via ${w.method}</span>
                        <span class="uppercase font-bold ${w.status === 'pending' ? 'text-orange-500' : 'text-green-500'}">${w.status}</span>
                    </div>`;
            }
        });
    });
}

// --- ADMIN LOGIC ---
window.checkAdmin = () => {
    const pass = prompt("Enter Admin Password:");
    if (pass === "Propetas12") {
        showTab('admin-panel');
        loadAdminData();
    } else {
        alert("Wrong Password");
    }
};

function loadAdminData() {
    onValue(ref(db, 'withdrawals'), (snap) => {
        const container = document.getElementById('admin-withdrawals');
        container.innerHTML = '';
        snap.forEach(child => {
            const w = child.val();
            if (w.status === 'pending') {
                const div = document.createElement('div');
                div.className = "bg-white p-4 rounded-xl shadow border-l-4 border-orange-500";
                div.innerHTML = `
                    <p><strong>User:</strong> ${w.username}</p>
                    <p><strong>Amount:</strong> ₱${w.amount} | <strong>Via:</strong> ${w.method}</p>
                    <p class="text-xs mb-3"><strong>Details:</strong> ${w.details}</p>
                    <button onclick="approveWithdraw('${child.key}')" class="bg-green-600 text-white px-4 py-1 rounded">Approve</button>
                `;
                container.appendChild(div);
            }
        });
    });
}

window.approveWithdraw = (key) => {
    update(ref(db, `withdrawals/${key}`), { status: 'approved' });
};
