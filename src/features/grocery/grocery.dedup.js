'use strict';

// ── NORMALISATION MAPS ────────────────────────────────────────────
const PLURAL_FIX = {
  tomatoes:'tomato',potatoes:'potato',onions:'onion',shallots:'shallot',
  eggs:'egg',cloves:'clove',leaves:'leaf',seeds:'seed',mushrooms:'mushroom',
  beans:'bean',peas:'pea',nuts:'nut',avocados:'avocado',mangoes:'mango',
  berries:'berry',chickpeas:'chickpea',lentils:'lentil',carrots:'carrot',
  noodles:'noodle',olives:'olive',peppers:'pepper',almonds:'almond',
  pistachios:'pistachio',cashews:'cashew',raisins:'raisin',sprouts:'sprout',
  'curry leaves':'curry leaf'
};
const SYNONYM_MAP = {
  jeera:'cumin',haldi:'turmeric',dhaniya:'coriander',aloo:'potato',
  palak:'spinach',tamatar:'tomato',pyaaz:'onion',lehsun:'garlic',
  adrak:'ginger',besan:'gram flour',atta:'whole wheat flour',
  hing:'asafoetida',methi:'fenugreek leaf','kali mirch':'black pepper',
  'lal mirch':'red chili','shimla mirch':'bell pepper',bhindi:'okra',
  lauki:'bottle gourd',rajma:'kidney bean',chana:'chickpea',
  moong:'mung bean',masoor:'red lentil',urad:'black lentil',
  poha:'flattened rice',suji:'semolina',rava:'semolina',
  imli:'tamarind',kaju:'cashew',badam:'almond',pista:'pistachio',
  capsicum:'bell pepper',cilantro:'coriander','spring onion':'green onion',
  scallion:'green onion',aubergine:'eggplant',courgette:'zucchini',
  'chick pea':'chickpea',ladyfinger:'okra',curd:'yogurt',
  chilli:'chili',chillies:'chili',chilies:'chili',
  'green chilli':'green chili','red chilli':'red chili'
};
const PRODUCE_KEYS = new Set(['tomato','onion','garlic','ginger','spinach','bell pepper','carrot','potato','cucumber','eggplant','zucchini','mushroom','lettuce','broccoli','cauliflower','pea','bean','green bean','lemon','lime','orange','apple','banana','mango','papaya','avocado','corn','celery','radish','beetroot','kale','cabbage','okra','bottle gourd','coriander','mint','basil','parsley','green onion','cherry tomato','chili','green chili','red chili','curry leaf','shallot','capsicum','aubergine','courgette','sweet potato','yam','pumpkin','brussels sprout','asparagus','leek','fennel','artichoke','bok choy','pak choi','chive','dill','tarragon','sage','thyme leaf','rosemary sprig']);
const DAIRY_KEYS  = new Set(['milk','cream','cheese','yogurt','butter','ghee','paneer','egg','curd','sour cream','cream cheese','mozzarella','parmesan','ricotta','cheddar','condensed milk','evaporated milk','buttermilk','whipped cream','feta','cottage cheese','mascarpone','halloumi','brie','gouda']);
const GRAINS_KEYS = new Set(['rice','wheat','flour','bread','pasta','noodle','oat','quinoa','lentil','chickpea','kidney bean','black bean','mung bean','red lentil','black lentil','semolina','cornmeal','gram flour','whole wheat flour','flattened rice','couscous','barley','millet','buckwheat','bread crumb','pita','tortilla','poha','vermicelli','spaghetti','penne','rice noodle','dal','toor dal','chana dal','moong dal','urad dal','masoor dal','rava','oatmeal','polenta']);
const SPICES_KEYS = new Set(['cumin','turmeric','chili powder','cardamom','cinnamon','clove','bay leaf','mustard seed','fennel seed','fenugreek','asafoetida','star anise','garam masala','curry powder','paprika','oregano','nutmeg','saffron','black pepper','red chili powder','coriander powder','cumin powder','amchur','kasuri methi','black salt','rock salt','chaat masala','pav bhaji masala','sambar powder','biryani masala','chili flake','allspice','ajwain','carom seed','fenugreek seed','fenugreek leaf','dried chili','mixed spice','coriander seed']);
const PANTRY_KEYS = new Set(['oil','olive oil','coconut oil','sesame oil','vegetable oil','sunflower oil','mustard oil','salt','sugar','jaggery','honey','maple syrup','agave','vinegar','soy sauce','coconut milk','tomato paste','tamarind','water','baking soda','baking powder','vanilla','cocoa','stock','broth','cornstarch','arrowroot','yeast','coconut cream','hot sauce','ketchup','mayonnaise','mustard','tahini','miso','nutritional yeast','rose water','cooking spray','food colour','liquid smoke','worcestershire','fish sauce']);
const ML_UNITS = { tsp:5,teaspoon:5,tbsp:15,tablespoon:15,cup:240,ml:1,l:1000,litre:1000,liter:1000,pint:473,quart:946 };
const G_UNITS  = { g:1,gram:1,kg:1000,oz:28,lb:453,pound:453 };

// ── INGREDIENT PARSING ────────────────────────────────────────────
function splitCompound(raw) { return raw.split(/\s+and\s+|\s*[&+]\s*/i).map(s=>s.trim()).filter(Boolean); }

function ingQty(raw) {
  const m = raw.trim().match(/^\(?([\d\s¼½¾⅓⅔⅛.\/\xd7x]+(?:cups?|tbsp?|tsp?|tablespoons?|teaspoons?|g|grams?|kg|oz|ounces?|lbs?|ml|l|litres?|bunch(?:es)?|cans?|cloves?|medium|large|small|inch(?:es)?|handful|pinch(?:es)?|drizzle|sprigs?|pieces?|slices?)?)\)?\s+/i);
  return m ? m[1].trim() : '';
}

function ingKey(raw) {
  let s = raw.trim();
  s = s.replace(/^\([\d\s¼½¾⅓⅔⅛.\/\xd7x\w]+\)\s*/i,'');
  s = s.replace(/^[\d\s¼½¾⅓⅔⅛.\/\xd7x-]+(?:cups?|tbsp?|tsp?|tablespoons?|teaspoons?|g|grams?|kg|oz|ounces?|lbs?|ml|l|litres?|bunch(?:es)?|cans?|cloves?|medium|large|small|inch(?:es)?|handful|pinch(?:es)?|drizzle|sprigs?|pieces?|slices?)?\s*/gi,'');
  s = s.replace(/,.*$/,'');
  s = s.replace(/^(?:fresh|dried|frozen|canned|ripe|raw|cooked|boiled|roasted|chopped|diced|grated|sliced|minced|baby|whole|ground|organic|plain|uncooked|full.fat|low.fat|rinsed|drained)\s+/gi,'');
  s = s.replace(/\s+(?:chopped|diced|sliced|grated|minced|crushed|halved|peeled|seeded|boiled|mashed|roasted|rinsed|drained|washed|shredded|roughly|finely|thinly|softened|soaked|to\s+taste|as\s+needed|optional|for\s+\w+)\b.*/gi,'');
  s = s.trim().toLowerCase().replace(/\s+/g,' ');
  if (!s) return '';
  if (SYNONYM_MAP[s]) return SYNONYM_MAP[s];
  if (PLURAL_FIX[s])  return PLURAL_FIX[s];
  const parts = s.split(' ');
  const last  = parts[parts.length-1];
  if (PLURAL_FIX[last]) { parts[parts.length-1]=PLURAL_FIX[last]; return parts.join(' '); }
  if (s.length>4 && s.endsWith('s') && !/(?:ss|us|is|as|os|ous)$/.test(s)) s=s.slice(0,-1);
  return s;
}

function parseQtyNum(s) {
  const FRAC={'½':0.5,'¼':0.25,'¾':0.75,'⅓':1/3,'⅔':2/3,'⅛':0.125};
  s=s.trim();
  for(const[k,v]of Object.entries(FRAC))s=s.replace(k,' '+v);
  let n=0;
  for(const p of s.trim().split(/\s+/)){
    if(p.includes('/'))n+=parseFloat(p.split('/')[0])/parseFloat(p.split('/')[1])||0;
    else n+=parseFloat(p)||0;
  }
  return n;
}

function parseQtyStr(qtyStr) {
  if(!qtyStr)return null;
  const m=qtyStr.trim().match(/^([\d\s½¼¾⅓⅔⅛.\/]+)\s*([a-z]+)?$/i);
  if(!m)return null;
  const amount=parseQtyNum(m[1]);
  if(!amount)return null;
  const unitRaw=(m[2]||'').toLowerCase().replace(/s$/,'');
  if(ML_UNITS[unitRaw])return{amount,unit:unitRaw,family:'volume',base:amount*ML_UNITS[unitRaw]};
  if(G_UNITS[unitRaw])return{amount,unit:unitRaw,family:'weight',base:amount*G_UNITS[unitRaw]};
  return{amount,unit:m[2]||'',family:'count',base:amount};
}

function sumQtys(qtyArr) {
  if(!qtyArr||!qtyArr.length)return'';
  const parsed=qtyArr.map(parseQtyStr).filter(Boolean);
  if(!parsed.length)return qtyArr.join(' · ');
  const byFamily={};
  parsed.forEach(p=>{
    if(!byFamily[p.family])byFamily[p.family]={total:0,unit:p.unit,items:[]};
    byFamily[p.family].total+=p.base;byFamily[p.family].items.push(p);
  });
  const parts=[];
  for(const[fam,{total,items}]of Object.entries(byFamily)){
    if(fam==='volume'){
      if(total>=240)parts.push(+(total/240).toFixed(2).replace(/\.?0+$/,'')+'cup');
      else if(total>=15)parts.push(+(total/15).toFixed(1).replace(/\.?0+$/,'')+'tbsp');
      else parts.push(Math.round(total)+'ml');
    }else if(fam==='weight'){
      if(total>=1000)parts.push(+(total/1000).toFixed(2).replace(/\.?0+$/,'')+'kg');
      else parts.push(Math.round(total)+'g');
    }else{
      const u=items[0].unit;
      parts.push(Math.round(total)+(u?' '+u:''));
    }
  }
  return parts.filter(Boolean).join(' · ');
}

function getCategory(key) {
  if(!key)return'other';
  const tokens=key.split(' ');
  const check=set=>set.has(key)||tokens.some(t=>set.has(t));
  if(check(PANTRY_KEYS))return'pantry';
  if(check(PRODUCE_KEYS))return'produce';
  if(check(DAIRY_KEYS))return'dairy';
  if(check(GRAINS_KEYS))return'grains';
  if(check(SPICES_KEYS))return'spices';
  return'other';
}

// ── FUZZY DEDUP ───────────────────────────────────────────────────
function jaro(s1,s2){if(s1===s2)return 1;const l1=s1.length,l2=s2.length;const md=Math.max(Math.floor(Math.max(l1,l2)/2)-1,0);let matches=0,t=0;const m1=new Array(l1).fill(false),m2=new Array(l2).fill(false);for(let i=0;i<l1;i++){for(let j=Math.max(0,i-md);j<Math.min(i+md+1,l2);j++){if(m2[j]||s1[i]!==s2[j])continue;m1[i]=m2[j]=true;matches++;break;}}if(!matches)return 0;let k=0;for(let i=0;i<l1;i++){if(!m1[i])continue;while(!m2[k])k++;if(s1[i]!==s2[k])t++;k++;}return(matches/l1+matches/l2+(matches-t/2)/matches)/3;}
function tokenSetRatio(a,b){const ta=new Set(a.split(' ')),tb=new Set(b.split(' '));const inter=[...ta].filter(t=>tb.has(t)).sort().join(' ');const ra=[...ta].filter(t=>!tb.has(t)).sort().join(' ');const rb=[...tb].filter(t=>!ta.has(t)).sort().join(' ');const s1=(inter+' '+ra).trim(),s2=(inter+' '+rb).trim();return Math.max(jaro(s1,s2),inter?Math.max(jaro(inter,s1),jaro(inter,s2)):0);}

function fuzzyDedup(all) {
  const keys=Object.keys(all),dropped=new Set();
  for(let i=0;i<keys.length;i++){
    if(dropped.has(keys[i]))continue;
    for(let j=i+1;j<keys.length;j++){
      if(dropped.has(keys[j]))continue;
      if(tokenSetRatio(keys[i],keys[j])>=0.88){
        const keep=all[keys[i]].count>=all[keys[j]].count?keys[i]:keys[j];
        const drop=keep===keys[i]?keys[j]:keys[i];
        all[keep].count+=all[drop].count;all[keep].qtys.push(...all[drop].qtys);
        dropped.add(drop);delete all[drop];
      }
    }
  }
}
