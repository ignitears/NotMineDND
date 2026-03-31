function calculateAll() {
    // 1. Get the numbers from the boxes
    const baseVal = parseFloat(document.getElementById('base-value').value) || 0;
    const d20 = parseFloat(document.getElementById('d20-roll').value) || 0;
    
    const str = parseFloat(document.getElementById('strength').value) || 0;
    const spd = parseFloat(document.getElementById('speed').value) || 0;
    const end = parseFloat(document.getElementById('endurance').value) || 0;
    const con = parseFloat(document.getElementById('constitution').value) || 0;
    const dex = parseFloat(document.getElementById('dexterity').value) || 0;
    const forc = parseFloat(document.getElementById('forecast').value) || 0;
    const cast = parseFloat(document.getElementById('casting').value) || 0;
    const ctrl = parseFloat(document.getElementById('control').value) || 0;
    const manaSup = parseFloat(document.getElementById('mana-supply').value) || 0;

    // 2. Figure out the damage multiplier based on the dice roll
    let mult = 1;
    if (d20 <= 1) mult = 0.5;
    else if (d20 <= 9) mult = 0.75;
    else if (d20 <= 11) mult = 1;
    else if (d20 <= 15) mult = 1.5;
    else if (d20 <= 19) mult = 1.75;
    else mult = 2;

    // 3. Do the math
    const damage = baseVal * ((0.5 * str) + 1) * mult;
    const distance = 10 * ((0.2 * spd) + 1);
    const stamina = 100 * ((0.2 * end) + 1);
    const hp = 100 * ((0.5 * con) + 1);
    const magicDmg = baseVal * ((0.5 * cast) + 1);
    const manaCost = baseVal * ((100 - ctrl) / 100);
    const maxMana = 100 * ((0.2 * manaSup) + 1);
    
    const dodgeScore = (10 * ((0.1 * dex) + 1) * d20) + (10 * ((0.05 * forc) + 1) * d20);

    // 4. Print it to the screen
    document.getElementById('result-box').innerHTML = `
        <p><strong>Physical Damage:</strong> ${damage.toFixed(2)}</p>
        <p><strong>Distance:</strong> ${distance.toFixed(2)} Meters</p>
        <p><strong>Stamina:</strong> ${stamina.toFixed(2)}</p>
        <p><strong>Max HP:</strong> ${hp.toFixed(2)}</p>
        <p><strong>Magic Damage:</strong> ${magicDmg.toFixed(2)}</p>
        <p><strong>Mana Cost:</strong> ${manaCost.toFixed(2)}</p>
        <p><strong>Max Mana:</strong> ${maxMana.toFixed(2)}</p>
        <p><strong>Dodge/Hit Score:</strong> ${dodgeScore.toFixed(2)}</p>
    `;
}
