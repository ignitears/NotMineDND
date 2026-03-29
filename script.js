let current = { hp: 100, sta: 100, mana: 100 };
const inputList = ['global-d20', 'in-str', 'in-spd', 'in-con', 'in-end', 'in-dex', 'in-for', 'in-acc', 'in-cas', 'in-ctr', 'in-msu'];

function saveData() {
    const saveState = { currentVars: current, inputs: {} };
    inputList.forEach(id => {
        saveState.inputs[id] = document.getElementById(id).value;
    });
    localStorage.setItem('skillLevelUpSave', JSON.stringify(saveState));
}

function loadData() {
    const saved = localStorage.getItem('skillLevelUpSave');
    if (saved) {
        const parsed = JSON.parse(saved);
        current = parsed.currentVars || current;
        inputList.forEach(id => {
            if (parsed.inputs[id] !== undefined) {
                document.getElementById(id).value = parsed.inputs[id];
            }
        });
    }
    runEngine(); 
}

function wipeSave() {
    if(confirm("Wipe this character profile?")) {
        localStorage.removeItem('skillLevelUpSave');
        current = { hp: 100, sta: 100, mana: 100 };
        inputList.forEach(id => document.getElementById(id).value = id === 'global-d20' ? '10' : '0');
        runEngine();
    }
}

function mod(type, val) {
    const max = parseFloat(document.getElementById(`max-${type}`).innerText);
    current[type] = Math.max(0, Math.min(max, current[type] + val));
    updateBars();
    saveData();
}

function manualEdit(type) {
    let typedVal = parseFloat(document.getElementById(`cur-${type}`).value) || 0;
    const max = parseFloat(document.getElementById(`max-${type}`).innerText);
    current[type] = Math.max(0, Math.min(max, typedVal));
    updateBars();
    saveData();
}

function runEngine() {
    const v = (id) => parseFloat(document.getElementById(id).value) || 0;
    const d20 = v('global-d20');

    const maxHP = 100 * ((0.5 * v('in-con')) + 1);
    const maxSTA = 100 * ((0.2 * v('in-end')) + 1);
    const maxMAN = 100 * ((0.2 * v('in-msu')) + 1);
    
    document.getElementById('max-hp').innerText = maxHP.toFixed(1);
    document.getElementById('max-sta').innerText = maxSTA.toFixed(1);
    document.getElementById('max-mana').innerText = maxMAN.toFixed(1);

    document.getElementById('out-melee').innerText = (-5 * ((0.5 * v('in-str')) + 1)).toFixed(1);
    document.getElementById('out-lift').innerText = (50 + (5 * v('in-str'))).toFixed(1) + "kg";
    document.getElementById('out-move').innerText = (10 * ((0.2 * v('in-spd')) + 1)).toFixed(1) + "m";

    const act = 1 + Math.floor(v('in-dex') / 20);
    const extra = 10 * ((0.05 * v('in-for')) + 1) * d20;
    const dodge = (10 * ((0.1 * v('in-dex')) + 1) * d20) + extra;
    const hit = (10 * ((0.1 * v('in-acc')) + 1) * d20) + extra;

    document.getElementById('out-act').innerText = act;
    document.getElementById('out-dodge').innerText = dodge.toFixed(1);
    document.getElementById('out-hit').innerText = hit.toFixed(1);

    document.getElementById('out-mag').innerText = (-5 * ((0.5 * v('in-cas')) + 1)).toFixed(1);
    document.getElementById('out-mcon').innerText = (100 - v('in-ctr')).toFixed(1) + "%";

    updateTiers(v('in-cas'));
    updateUnlockText(v('in-for'), v('in-dex'), v('in-cas'));
    updateBars();
    saveData();
}

function updateTiers(cas) {
    const div = document.getElementById('out-tiers');
    let data = [];
    if(cas <= 20) data = ["Mid: >5-10", "High: >10-15", "Saint: X", "Supreme: X"];
    else if(cas <= 40) data = ["Mid: >1-5", "High: >5-10", "Saint: >10-15", "Supreme: X"];
    else if(cas <= 60) data = ["Mid: >1", "High: >1-5", "Saint: >5-10", "Supreme: >10-15"];
    else if(cas <= 80) data = ["Mid: >1", "High: >1", "Saint: >1-5", "Supreme: >5-10"];
    else if(cas <= 99) data = ["Mid: Success", "High: Success", "Saint: >1", "Supreme: >1-5"];
    else data = ["ALL SUCCESS 100%"];
    div.innerHTML = data.map(t => `<span>${t}</span>`).join('');
}

function updateUnlockText(f, d, c) {
    const box = document.getElementById('out-unlocks');
    let html = "";
    if(f >= 21) html += "<div class='bg-slate-800 p-1'>- Forecast: Check 3 Stats / Env 50m</div>";
    if(f >= 61) html += "<div class='bg-slate-800 p-1'>- Forecast: Weakness / Sense Danger 20m</div>";
    if(f >= 100) html += "<div class='bg-sky-900 p-1 border border-sky-400'>- FORECAST: TRUE SIGHT 100%</div>";
    if(d >= 20) html += "<div class='bg-slate-800 p-1'>- Combat: +1 Extra Action</div>";
    if(c >= 60) html += "<div class='bg-purple-900 p-1 border border-purple-400'>- Magic: SUPREME TIER UNLOCKED</div>";
    box.innerHTML = html || "<div class='text-slate-600 italic'>No passive unlocks yet...</div>";
}

function updateBars() {
    ['hp', 'sta', 'mana'].forEach(t => {
        const max = parseFloat(document.getElementById(`max-${t}`).innerText);
        if(current[t] > max) current[t] = max;
        document.getElementById(`cur-${t}`).value = current[t].toFixed(1);
        document.getElementById(`bar-${t}`).style.width = (current[t] / max * 100) + "%";
    });
}

document.addEventListener("DOMContentLoaded", loadData);
