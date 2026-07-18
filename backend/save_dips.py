import os, sys, requests
sys.stdout.reconfigure(encoding='utf-8')
from dotenv import load_dotenv
load_dotenv()
URL = os.getenv('SUPABASE_URL')
KEY = os.getenv('SUPABASE_KEY')
h = {'apikey': KEY, 'Authorization': f'Bearer {KEY}', 'Content-Type': 'application/json', 'Prefer': 'return=minimal'}

r = requests.get(f'{URL}/rest/v1/recipes?select=id,name&order=id.desc&limit=300', headers=h)
data = r.json()
existing = {row['name'] for row in data}
next_id = max(row['id'] for row in data) + 1

RECIPES = [
    {
        'name': 'Baba Ganoush (Eggplant Dip)',
        'type': 'Snack', 'time': 50, 'emoji': '🍆',
        'ingredients': ['1-2 globe eggplants (about 2 lbs)', '3 tbsp extra virgin olive oil', '2-3 tbsp roasted tahini', '1-2 garlic cloves finely chopped', '1/2 tsp ground cumin', 'juice of 1 lemon (about 2.5 tbsp)', 'salt and cayenne pepper to taste', '1 tbsp chopped parsley'],
        'steps': ['Preheat oven to 400F (200C).', 'Cut eggplants in half lengthwise. Poke holes with fork, drizzle olive oil on both sides.', 'Place cut side down on foil-lined baking sheet. Roast 35-40 mins until very tender.', 'Cool 15 mins, scoop flesh into a bowl.', 'Add all remaining ingredients (reserve 1 tbsp oil for garnish). Mash with fork until smooth.', 'Serve with pita or chopped vegetables.'],
        'source': 'pinterest', 'board': 'Dips & Dressings'
    },
    {
        'name': 'Cilantro Lime Hummus',
        'type': 'Snack', 'time': 5, 'emoji': '💚',
        'ingredients': ['2 cups plain hummus (store-bought or homemade)', '1 cup fresh cilantro leaves', '1 tsp lime zest', '1 tbsp + 1 tsp fresh lime juice', '1/8 tsp dried ground coriander'],
        'steps': ['Add all ingredients into a food processor.', 'Process 1-2 minutes until well combined and smooth.', 'Taste and adjust seasoning. Refrigerate and use within 5 days.'],
        'source': 'pinterest', 'board': 'Dips & Dressings'
    },
    {
        'name': 'Cilantro Lime Dressing',
        'type': 'Snack', 'time': 5, 'emoji': '🌿',
        'ingredients': ['1 packed cup fresh cilantro leaves and thin stems', '1/4 cup extra virgin olive oil', '1/4 cup lime juice (about 2 limes)', '2 tbsp maple syrup or honey', '1 small garlic clove', '1 inch ginger peeled and grated', '1 tsp salt'],
        'steps': ['Rinse cilantro and shake off excess water.', 'Add all ingredients to a food processor or blender.', 'Blend until smooth.', 'Taste and adjust salt and sweetness.', 'Store in airtight jar in fridge for 4-5 days.'],
        'source': 'pinterest', 'board': 'Dips & Dressings'
    },
    {
        'name': 'Creamy Avocado Cilantro Lime Dressing',
        'type': 'Snack', 'time': 5, 'emoji': '🥑',
        'ingredients': ['1 large avocado', '1/2 cup fresh cilantro', '1/4 cup olive oil', '2-4 tbsp water to thin', 'juice of 1 lime or lemon', '1 large garlic clove', '1 tsp sea salt'],
        'steps': ['Add all ingredients to a blender or food processor.', 'Blend until completely smooth and creamy.', 'Add more water to thin to desired consistency.', 'Store in fridge for 5-7 days.'],
        'source': 'pinterest', 'board': 'Dips & Dressings'
    },
    {
        'name': 'Basil Garlic Aioli',
        'type': 'Snack', 'time': 10, 'emoji': '🌿',
        'ingredients': ['2 egg yolks', '1/4 cup olive oil', '1/4 cup vegetable oil', '2-3 garlic cloves minced', '1 cup fresh basil clean and dry', '2 tbsp fresh lemon juice', 'kosher salt to taste'],
        'steps': ['Add egg yolks, garlic, basil, lemon juice and salt to a blender.', 'Blend until fully combined and thick.', 'With blender running, slowly drizzle in oils in a thin steady stream.', 'Aioli will thicken as oil is added.', 'Taste and adjust salt. Use as a dip or sandwich spread.'],
        'source': 'pinterest', 'board': 'Dips & Dressings'
    },
    {
        'name': 'Green Goddess Feta Dip',
        'type': 'Snack', 'time': 10, 'emoji': '🌱',
        'ingredients': ['5 oz feta cheese', '2 garlic cloves peeled', '1 large avocado peeled and pitted', 'juice of 1 lemon (2-3 tbsp)', '1/2 cup packed fresh dill', '1/2 cup packed fresh mint', '1/2 cup packed fresh basil', '1/2 cup packed fresh chives or green onions', '1 tsp Dijon mustard', '1/4 cup olive oil', '1/4 cup water', 'sea salt and black pepper to taste'],
        'steps': ['Add feta, garlic, avocado, lemon juice, dill, mint, basil, chives and Dijon to a food processor.', 'Pulse briefly to combine.', 'With motor running, drizzle in olive oil until emulsified.', 'Add water until desired consistency.', 'Season with salt and pepper. Refrigerate up to 3 days.'],
        'source': 'pinterest', 'board': 'Dips & Dressings'
    },
    {
        'name': 'Japanese Ginger Dressing',
        'type': 'Snack', 'time': 5, 'emoji': '🥕',
        'ingredients': ['1.5 cups carrots peeled and chopped', '2 stalks celery chopped', '1/4 yellow onion chopped', '2 tbsp ginger peeled and chopped', '1/2 cup + 2 tbsp avocado oil', '1/4 cup coconut aminos or soy sauce', '3 tbsp rice vinegar', '2 tsp coconut sugar', '3/4 tsp sea salt', '1/4 tsp black pepper'],
        'steps': ['Add all ingredients to a high-speed blender.', 'Blend until fully incorporated and thick.', 'Season further to taste.', 'Store in fridge 3-4 days or freeze up to 1 month.', 'Serve over romaine or iceberg salad with shredded carrots.'],
        'source': 'pinterest', 'board': 'Dips & Dressings'
    },
    {
        'name': 'Whipped Feta Dip',
        'type': 'Snack', 'time': 10, 'emoji': '🧀',
        'ingredients': ['8 oz feta block', '2/3 cup full-fat Greek yogurt or skyr', '3 tbsp extra virgin olive oil', '1 garlic clove', '2 tbsp lemon juice', '1/2 tsp red pepper flakes', '1 tbsp honey (optional)', 'fresh parsley and olive oil for garnish'],
        'steps': ['Add feta, yogurt, olive oil, garlic, lemon juice and red pepper flakes to food processor.', 'Pulse until creamy and smooth, scraping down sides.', 'Add more lemon or red pepper as needed.', 'Drizzle in honey for a hint of sweetness if desired.', 'Garnish with parsley and olive oil. Serve with pita chips and vegetables.'],
        'source': 'pinterest', 'board': 'Dips & Dressings'
    },
]

imported = skipped = failed = 0
for recipe in RECIPES:
    if recipe['name'] in existing:
        print(f'  SKIP: {recipe["name"]}')
        skipped += 1
        continue
    payload = dict(id=next_id, **recipe)
    res = requests.post(f'{URL}/rest/v1/recipes', headers=h, json=payload)
    if res.status_code in (200, 201):
        print(f'  SAVED: {recipe["name"]}')
        imported += 1
        next_id += 1
    else:
        print(f'  FAIL: {recipe["name"]} -> {res.status_code}: {res.text[:80]}')
        failed += 1

print(f'\n{imported} imported | {skipped} skipped | {failed} failed')
