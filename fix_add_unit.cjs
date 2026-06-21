const fs = require("fs");
let content = fs.readFileSync("src/legacy/aimeasy-fixes.js", "utf8");

const addUnitModalCode = `
  window.v10SAAddUnit = async function(subjId) {
    document.querySelectorAll('.v10-add-unit-modal').forEach(m => m.remove());
    
    if (!window.aimeasyFetchUnits || !window.aimeasyCreateUnit) {
      showToast('Supabase not ready', 'red');
      return;
    }
    const { data: existingUnits } = await window.aimeasyFetchUnits(subjId);
    const currentCount = (existingUnits || []).length;
    const newSortOrder = currentCount + 1;

    const modalHtml = \`
      <div class="v10-popup v10-add-unit-modal" style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:var(--surface); padding:2rem; border-radius:8px; box-shadow:0 10px 30px rgba(0,0,0,0.5); z-index:9999; min-width:300px;">
        <h3 style="margin-bottom:1rem;">Add New Unit</h3>
        <div class="input-group">
          <label>Unit Number / Sort Order</label>
          <input type="number" id="v10-add-unit-order" class="input" value="\${newSortOrder}" />
        </div>
        <div class="input-group">
          <label>Unit Title</label>
          <input type="text" id="v10-add-unit-title" class="input" placeholder="e.g. Introduction to Machine Learning" />
        </div>
        <div style="display:flex; gap:10px; margin-top:1.5rem;">
          <button class="btn btn-primary" onclick="window.submitSAAddUnit('\${subjId}')" style="flex:1;">Save Unit</button>
          <button class="btn btn-ghost" onclick="this.closest('.v10-add-unit-modal').remove()">Cancel</button>
        </div>
      </div>
      <div class="v10-add-unit-overlay" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:9998;" onclick="this.previousElementSibling.remove(); this.remove();"></div>
    \`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  };

  window.submitSAAddUnit = async function(subjId) {
    const orderInput = document.getElementById('v10-add-unit-order');
    const titleInput = document.getElementById('v10-add-unit-title');
    if (!orderInput || !titleInput) return;
    
    const sort_order = parseInt(orderInput.value) || 1;
    const name = titleInput.value.trim();
    if (!name) {
      showToast('Unit title is required', 'red');
      return;
    }

    const btn = event.target;
    btn.disabled = true;
    btn.textContent = 'Saving...';

    showToast('Creating unit...', 'blue');
    const { data, error } = await window.aimeasyCreateUnit(subjId, {
      name: name,
      title: name,
      sort_order: sort_order
    });
    
    if (error) { 
      showToast('Failed to create unit: ' + error.message, 'red'); 
      btn.disabled = false;
      btn.textContent = 'Save Unit';
      return; 
    }
    
    showToast('✅ Unit added successfully!', 'green');
    document.querySelectorAll('.v10-add-unit-modal, .v10-add-unit-overlay').forEach(el => el.remove());
    await window.v10SAUnitsPage(window._v10SASubj);
  };
`;

content = content.replace(/window\.v10SAAddUnit\s*=\s*async function\(subjId\)\s*\{[\s\S]*?await window\.v10SAUnitsPage\(window\._v10SASubj\);\s*\};/, addUnitModalCode);

fs.writeFileSync("src/legacy/aimeasy-fixes.js", content, "utf8");
console.log("Injected Add Unit Modal");
