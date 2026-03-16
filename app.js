
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
let isPaused = true;

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
    if (user.length < 3) return alert("Enter valid Telegram username");
    
    const userRef = ref(db, 'users/' + user.replace(/[^a-zA-Z0-9]/g, '_'));
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
    setInterval(renderTasks, 1000); // Live cooldown update
}

function updateUI() {
    const u = currentUser.username.replace(/[^a-zA-Z0-9]/g, '_');
    onValue(ref(db, 'users/' + u), (snap) => {
        currentUser = snap.val();
        document.getElementById('display-username').innerText = currentUser.username;
        document.getElementById('display-balance').innerText = `₱${currentUser.balance.toFixed(3)}`;
        document.getElementById('my-ref-code').innerText = currentUser.referralCode;
        document.getElementById('total-ref').innerText = currentUser.totalReferrals;
        document.getElementById('ref-earnings').innerText = `₱${currentUser.referralEarnings.toFixed(3)}`;
    });
}

// --- TASK LOGIC (INTERNAL CARD) ---
window.renderTasks = () => {
    const container = document.getElementById('links-container');
    const now = Date.now();
    container.innerHTML = '';

    taskLinks.forEach((link, index) => {
        const lastClick = currentUser.cooldowns?.[index] || 0;
        const diff = now - lastClick;
        const isCooldown = diff < (2 * 60 * 60 * 1000);
        
        const card = document.createElement('div');
        card.className = `p-4 rounded-2xl flex justify-between items-center transition-all ${isCooldown ? 'bg-slate-100 opacity-60' : 'bg-white shadow-sm border-l-4 border-blue-600 hover:shadow-md'}`;
        
        let subText = `<span class="text-green-600 font-bold">₱0.019 • 45s</span>`;
        if (isCooldown) {
            const rem = (2 * 60 * 60 * 1000) - diff;
            const h = Math.floor(rem / 3600000);
            const m = Math.floor((rem % 3600000) / 60000);
            const s = Math.floor((rem % 60000) / 1000);
            subText = `<span class="text-red-500 font-mono text-xs">${h}h ${m}m ${s}s left</span>`;
        }

        card.innerHTML = `
            <div>
                <p class="font-black text-sm uppercase">Link Task #${index + 1}</p>
                ${subText}
            </div>
            <button onclick="openTask(${index}, '${link}')" ${isCooldown ? 'disabled' : ''} 
                class="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold ${isCooldown ? 'hidden' : ''}">
                OPEN LINK
            </button>
        `;
        container.appendChild(card);
    });
};

window.openTask = (index, link) => {
    // Show Ads (Monetag + Adsgram)
    if(window.show_10555746) window.show_10555746({ type: 'inApp' });
    const AdController = window.Adsgram?.init({ blockId: "21470" });
    AdController?.show().finally(() => {
        currentTaskIndex = index;
        document.getElementById('task-frame').src = link;
        document.getElementById('task-viewer').style.display = 'block';
        startTaskTimer();
    });
};

function startTaskTimer() {
    timerSeconds = 45;
    isPaused = true; // Start paused, user must dblclick to start
    updateTimerUI();

    timerInterval = setInterval(() => {
        if (!isPaused) {
            timerSeconds--;
            updateTimerUI();
            
            // Auto pause every 5 seconds
            if (timerSeconds % 5 === 0 && timerSeconds > 0) {
                isPaused = true;
                updateTimerUI();
            }

            if (timerSeconds <= 0) {
                clearInterval(timerInterval);
                finishTask();
            }
        }
    }, 1000);
}

document.getElementById('click-catcher').addEventListener('dblclick', () => {
    if (isPaused) {
        isPaused = false;
        updateTimerUI();
    }
});

function updateTimerUI() {
    document.getElementById('timer-display').innerText = timerSeconds + "s";
    const status = document.getElementById('pause-status');
    if (isPaused) {
        status.innerText = "● Paused (Double Click Web)";
        status.classList.add('text-red-500');
    } else {
        status.innerText = "● Timer Running";
        status.classList.remove('text-red-500');
        status.classList.add('text-green-500');
    }
}

async function finishTask() {
    const uKey = currentUser.username.replace(/[^a-zA-Z0-9]/g, '_');
    const reward = 0.019;
    const updates = {};
    
    updates[`users/${uKey}/balance`] = currentUser.balance + reward;
    updates[`users/${uKey}/cooldowns/${currentTaskIndex}`] = Date.now();

    // Referral 10% auto update
    if (currentUser.referredBy) {
        const refSnap = await get(ref(db, 'users/' + currentUser.referredBy));
        if (refSnap.exists()) {
            const rData = refSnap.val();
            updates[`users/${currentUser.referredBy}/balance`] = (rData.balance || 0) + (reward * 0.1);
            updates[`users/${currentUser.referredBy}/referralEarnings`] = (rData.referralEarnings || 0) + (reward * 0.1);
        }
    }

    await update(ref(db), updates);
    alert("Task Completed! ₱0.019 added.");
    closeTaskViewer();
}

function closeTaskViewer() {
    document.getElementById('task-viewer').style.display = 'none';
    document.getElementById('task-frame').src = "";
    clearInterval(timerInterval);
}

// --- APP FEATURES ---
window.showTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
};

window.submitReferral = async () => {
    const code = document.getElementById('input-ref-code').value.trim().toUpperCase();
    if (code === currentUser.referralCode || currentUser.referredBy) return;
    
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    let inviterKey = null;

    snapshot.forEach(child => {
        if (child.val().referralCode === code) inviterKey = child.key;
    });

    if (inviterKey) {
        const uKey = currentUser.username.replace(/[^a-zA-Z0-9]/g, '_');
        await update(ref(db, `users/${uKey}`), { referredBy: inviterKey });
        const curCount = snapshot.child(inviterKey).val().totalReferrals || 0;
        await update(ref(db, `users/${inviterKey}`), { totalReferrals: curCount + 1 });
        alert("Referral linked successfully!");
    }
};

window.sendMessage = () => {
    const text = document.getElementById('chat-input').value;
    if (text) {
        push(ref(db, 'chats'), { user: currentUser.username, text, time: Date.now() });
        document.getElementById('chat-input').value = '';
    }
};

function listenChat() {
    onValue(query(ref(db, 'chats'), limitToLast(15)), (snap) => {
        const box = document.getElementById('chat-messages');
        box.innerHTML = '';
        snap.forEach(c => {
            const m = c.val();
            box.innerHTML += `<div class="bg-blue-50 p-3 rounded-2xl w-fit max-w-[80%]">
                <p class="text-[10px] font-black text-blue-600">${m.user}</p>
                <p class="text-sm">${m.text}</p>
            </div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
}

function listenLeaderboard() {
    onValue(query(ref(db, 'users'), orderByChild('balance'), limitToLast(20)), (snap) => {
        const list = document.getElementById('leaderboard-list');
        list.innerHTML = '';
        let items = [];
        snap.forEach(c => items.push(c.val()));
        items.reverse().forEach((u, i) => {
            list.innerHTML += `<div class="flex justify-between p-4 border-b">
                <span class="text-sm font-bold">${i+1}. ${u.username}</span>
                <span class="text-blue-600 font-black italic">₱${u.balance.toFixed(2)}</span>
            </div>`;
        });
    });
}

window.requestWithdraw = async () => {
    const amount = parseFloat(document.getElementById('withdraw-amount').value);
    if (amount > currentUser.balance || amount < 1) return alert("Low balance");
    
    const uKey = currentUser.username.replace(/[^a-zA-Z0-9]/g, '_');
    const req = {
        uid: uKey, username: currentUser.username, amount,
        method: document.getElementById('withdraw-method').value,
        details: document.getElementById('withdraw-details').value,
        status: 'pending', time: Date.now()
    };
    await push(ref(db, 'withdrawals'), req);
    await update(ref(db, `users/${uKey}`), { balance: currentUser.balance - amount });
    alert("Request Sent!");
};

function listenWithdrawals() {
    onValue(ref(db, 'withdrawals'), (snap) => {
        const history = document.getElementById('withdraw-history');
        history.innerHTML = '';
        snap.forEach(c => {
            const w = c.val();
            if (w.username === currentUser.username) {
                history.innerHTML += `<div class="bg-white p-3 rounded-xl border flex justify-between items-center">
                    <span class="text-[10px] font-bold">${w.method} - ₱${w.amount}</span>
                    <span class="text-[10px] uppercase font-black ${w.status === 'pending' ? 'text-orange-500' : 'text-green-500'}">${w.status}</span>
                </div>`;
            }
        });
    });
}

window.checkAdmin = () => {
    if (prompt("Admin Password") === "Propetas12") {
        showTab('admin-panel');
        loadAdmin();
    }
};

function loadAdmin() {
    onValue(ref(db, 'withdrawals'), (snap) => {
        const adminBox = document.getElementById('admin-withdrawals');
        adminBox.innerHTML = '';
        snap.forEach(c => {
            if (c.val().status === 'pending') {
                const w = c.val();
                adminBox.innerHTML += `<div class="bg-white p-4 border-l-4 border-red-500 rounded shadow">
                    <p class="font-bold">${w.username} (₱${w.amount})</p>
                    <p class="text-xs">${w.method}: ${w.details}</p>
                    <button onclick="approve('${c.key}')" class="bg-green-600 text-white px-4 py-1 rounded-lg mt-2 text-xs">Approve</button>
                </div>`;
            }
        });
    });
}

window.approve = (key) => update(ref(db, `withdrawals/${key}`), { status: 'approved' });
