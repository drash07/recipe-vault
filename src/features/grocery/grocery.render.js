'use strict';

function renderGrocery() {
  const list    = document.getElementById('grocery-list');
  const checked = groceries.filter(g=>g.checked).length;
  document.getElementById('grocery-summary').textContent = checked + ' of ' + groceries.length + ' items checked';
  const titleEl = document.getElementById('grocery-title');
  if (titleEl) titleEl.textContent = weekOffset===0?"This week's list":weekOffset===1?"Next week's list":"Week "+weekOffset+" list";

  if (!groceries.length) {
    list.innerHTML='<div style="text-align:center;padding:18px;font-size:12px;color:var(--text-muted)">No items yet. Plan meals first then tap regenerate.</div>';
    return;
  }

  const CAT_ORDER  = ['produce','dairy','grains','spices','pantry','other'];
  const CAT_LABELS = { produce:'🥦 Produce',dairy:'🥛 Dairy & Eggs',grains:'🌾 Grains & Pulses',spices:'🧂 Spices & Herbs',pantry:'🫙 Pantry Staples',other:'📦 Other' };

  const byCategory = {};
  groceries.forEach((g,i)=>{
    const cat=(g.category||getCategory(g.name.toLowerCase()));
    const qty=g.qtyDisplay||sumQtys(g.qtys||[]);
    (byCategory[cat]=byCategory[cat]||[]).push({...g,i,qtyDisplay:qty});
  });

  let html='';
  for(const cat of CAT_ORDER){
    const items=byCategory[cat];
    if(!items||!items.length)continue;
    const isPantry=cat==='pantry';
    html+='<div style="font-size:11px;font-weight:600;color:var(--text-muted);padding:10px 0 4px;'+(isPantry?'opacity:.65':'')+'">' +
      CAT_LABELS[cat]+(isPantry?'<span style="font-weight:400"> — check if you have these</span>':'')+'</div>';
    html+=items.map(({name,checked,qtyDisplay,i})=>
      '<div class="grocery-item" style="align-items:center">' +
        '<div class="grocery-check '+(checked?'checked':'')+'" onclick="toggleGrocery('+i+')" style="flex-shrink:0;margin-top:1px">'+(checked?'<span style="color:#fff;font-size:12px">✓</span>':'')+' </div>' +
        '<div style="flex:1;min-width:0">' +
          '<div class="grocery-item-name '+(checked?'checked':'')+'">' + name + '</div>' +
          (qtyDisplay?'<div style="font-size:10px;color:var(--text-muted);margin-top:1px">'+qtyDisplay+'</div>':'') +
        '</div>' +
      '</div>'
    ).join('');
  }
  list.innerHTML=html;
}

async function toggleGrocery(i) {
  groceries[i].checked=!groceries[i].checked;
  const id=groceries[i].id;
  if(id){ const{error}=await db.from('groceries').update({checked:groceries[i].checked}).eq('id',id); if(error)showError('Could not update item: '+error.message); }
  const allDone=groceries.length>0&&groceries.every(g=>g.checked);
  if(allDone){
    const ids=groceries.filter(g=>g.id).map(g=>g.id);
    if(ids.length)await db.from('groceries').delete().in('id',ids);
    groceries=[];
    document.getElementById('grocery-list').innerHTML='<div style="text-align:center;padding:28px 16px"><div style="font-size:40px;margin-bottom:10px">🛍️✨</div><div style="font-size:15px;font-weight:600;margin-bottom:5px">Yay, all done!</div><div style="font-size:12px;color:var(--text-muted)">You got everything — happy cooking! 🎉</div></div>';
    document.getElementById('grocery-summary').textContent='All picked up!';
    return;
  }
  renderGrocery();
}

async function clearChecked() {
  const ids=groceries.filter(g=>g.checked&&g.id).map(g=>g.id);
  if(ids.length){ const{error}=await db.from('groceries').delete().in('id',ids); if(error){showError('Could not clear items: '+error.message);return;} }
  groceries=groceries.filter(g=>!g.checked);
  renderGrocery();
}
