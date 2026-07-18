import os, sys, requests
from dotenv import load_dotenv
import uuid
sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

RECIPES = [
    {
        "name": "Palak Paneer 2.0",
        "type": "Dinner", "time": "30 mins", "emoji": "🥬",
        "ingredients": ["1 tsp mustard oil", "1 large onion sliced", "1 tsp ginger garlic paste", "1/2 tsp chilli powder", "1 tsp coriander powder", "1/4 tsp turmeric", "1/2 tsp garam masala", "120g tomato purée", "salt to taste", "220g chopped palak", "200g soft paneer", "1/3 cup hot water", "fresh coriander", "1 tbsp mustard oil (tadka)", "3/4 tsp cumin seeds", "1 tsp Kashmiri chilli powder", "4-5 garlic cloves"],
        "steps": ["Heat 1 tsp mustard oil, add sliced onions and cook until golden.", "Add ginger garlic paste, sauté until aromatic.", "Add chilli powder, coriander powder, turmeric, garam masala. Cook briefly.", "Add tomato purée + salt. Cook until thick.", "Add chopped palak. Cook 2-3 mins until wilted.", "Blend paneer with hot water until smooth.", "Add paneer sauce to spinach. Simmer 1-2 mins.", "Tadka: heat 1 tbsp mustard oil, add cumin → garlic (lightly golden), switch off → add Kashmiri chilli → pour over curry.", "Finish with coriander. Serve with rice or roti."],
        "source": "instagram", "board": None
    },
    {
        "name": "Pearl Barley Upma",
        "type": "Breakfast", "time": "40 mins", "emoji": "🌾",
        "ingredients": ["3/4 cup pearl barley", "5-6 cups water", "salt to taste", "1 medium onion chopped", "1 medium carrot chopped", "10-12 beans chopped", "1/2 cup peas", "1 tsp each red chilli powder, amchoor, ginger powder, roasted cumin, black salt", "oil, 1 tsp mustard seeds, 1 tbsp urad/chana dal, 1 green chilli, 10-12 curry leaves, pinch of hing"],
        "steps": ["Soak barley 10-15 mins, then boil with salt and oil till soft. Drain and rinse.", "Steam veggies and keep aside.", "Heat oil, add tempering ingredients and onions. Sauté 2-3 mins.", "Add veggies, cooked barley, and dry spices. Mix well.", "Switch off, add lemon juice, top with roasted peanuts."],
        "source": "instagram", "board": None
    },
    {
        "name": "Sprouted Moong Rice (Kichdi)",
        "type": "Dinner", "time": "30 mins", "emoji": "🌱",
        "ingredients": ["1 cup sprouted moong", "1 cup rice (washed & soaked)", "2 tbsp ghee", "pinch of hing", "1 tsp cumin seeds", "2 tbsp desiccated coconut", "1 tsp red chilli powder", "1/2 tsp turmeric", "1 tbsp coriander powder", "salt to taste", "2.5 cups water"],
        "steps": ["Mix soaked rice and sprouts; keep aside.", "Heat ghee, add hing and cumin seeds.", "Add coconut and spices; sauté a few seconds.", "Add the rice-sprout mix, stir for a minute.", "Pour in water, cover and cook till done.", "Garnish with coconut and coriander. Serve with raita."],
        "source": "instagram", "board": None
    },
    {
        "name": "Tomato Millet Dosa",
        "type": "Breakfast", "time": "30 mins", "emoji": "🍅",
        "ingredients": ["1 cup foxtail millet (soaked 3 hrs)", "1/2 cup black split dal (soaked 3-4 hrs)", "4 medium tomatoes roughly chopped", "2 dried red Kashmiri chillies", "1/2 tsp salt", "1/4 tsp hing", "1/2 tsp cumin seeds", "1/2 tsp mustard seeds", "curry leaves", "oil for cooking"],
        "steps": ["Blend soaked millets and dal with red chillies, tomatoes and salt to a smooth batter.", "Prepare tadka: heat oil, add hing, cumin, mustard seeds, curry leaves; pour into batter.", "Make dosas on a flat pan or griddle.", "Serve hot with coconut chutney."],
        "source": "instagram", "board": None
    },
    {
        "name": "Hari Bhari Paneer",
        "type": "Dinner", "time": "35 mins", "emoji": "🟢",
        "ingredients": ["200g paneer cubed", "1 cup yogurt", "2 large onions sliced", "2 inch ginger", "3-4 garlic cloves", "2 green chillies", "handful coriander", "salt to taste", "2 tsp black pepper", "1 tsp cinnamon powder", "2-3 tbsp oil/desi ghee"],
        "steps": ["Heat 2 tbsp oil, sauté onions until golden brown.", "Add ginger, garlic, sliced green chillies. Sauté 3-4 mins.", "Let cool, then blend with coriander to a smooth paste.", "Heat oil in same pan, pour green purée, sauté 6-7 mins until oil releases.", "Whisk curd with 1/3 cup water, add to purée with black pepper, cinnamon, salt.", "Cover and cook 3-4 mins on low flame.", "Add paneer cubes, mix softly, cook 1-2 mins. Serve with paratha."],
        "source": "instagram", "board": None
    },
    {
        "name": "No-Fried Dahi Kachori",
        "type": "Snack", "time": "45 mins", "emoji": "🫙",
        "ingredients": ["1 cup sooji", "2 cups water", "1 tbsp chilli flakes", "1 tsp sesame seeds", "1/3 tsp jeera", "salt", "coriander leaves", "1 tbsp ghee", "1 cup hung curd", "1 green chilli", "5-6 cashews broken", "2 tbsp raisins", "1/2 onion chopped", "1 cube cheese/mozzarella", "1 inch ginger grated", "1/2 cup paneer crumbled", "1 tbsp chaat masala", "1 tsp cardamom powder", "1 tsp black salt", "1 tbsp sattu/roasted besan"],
        "steps": ["Heat water, add sooji and outer layer ingredients. Mix, cover and rest 20 mins.", "Knead into a soft dough.", "Mix all filling ingredients.", "Stuff filling into sooji dough balls.", "Cook in appe pan with ghee on high flame only."],
        "source": "instagram", "board": None
    },
    {
        "name": "Paneer Momos (Rice Paper)",
        "type": "Snack", "time": "25 mins", "emoji": "🥟",
        "ingredients": ["200g paneer crumbled", "1/4 cup onions chopped", "1 tsp grated ginger", "1 tbsp schezwan sauce", "2-3 tbsp chopped coriander", "1/4 tsp haldi", "1/2 tsp red chilli powder", "pinch of garam masala", "salt to taste", "soaked rice paper sheets"],
        "steps": ["Mix all filling ingredients well.", "Fill into soaked rice paper sheets and shape.", "Pan fry or steam until cooked through.", "Serve with dipping sauce."],
        "source": "instagram", "board": None
    },
    {
        "name": "Methi Corn Palak",
        "type": "Dinner", "time": "25 mins", "emoji": "🌽",
        "ingredients": ["1 cup chopped palak", "1/2 cup chopped methi", "1 cup boiled sweet corn", "1 small onion chopped", "1 tomato chopped", "1-2 green chillies", "1 tsp garlic chopped", "1/2 tsp cumin seeds", "1/4 tsp turmeric", "1/2 tsp yellow chilli + cumin powder", "1 tsp coriander powder", "salt to taste", "1 tbsp butter + oil", "1 tbsp fresh cream"],
        "steps": ["Heat butter+oil, add cumin seeds.", "Add garlic, onion, tomato, green chillies. Cook well.", "Add palak, methi. Cook until wilted.", "Add corn, turmeric, chilli powder, coriander powder, salt.", "Finish with fresh cream. Serve with naan or paratha."],
        "source": "instagram", "board": None
    },
    {
        "name": "Mung Dal Beans",
        "type": "Dinner", "time": "35 mins", "emoji": "🫘",
        "ingredients": ["1/2 cup mung dal (soaked overnight)", "300g green/French beans", "1 tsp ajwain", "1 tsp red chilli powder", "1/2 tsp turmeric", "salt to taste", "1 tsp garam masala", "1 tbsp coriander powder", "lemon juice", "2 tbsp desi ghee/oil", "pinch of hing", "1 inch ginger finely chopped", "1.5 cups water"],
        "steps": ["Boil water with salt and oil, add soaked mung dal. Cook 7-8 mins. Drain excess water.", "Heat ghee, add hing and ajwain. Let crackle, add ginger.", "Add chopped beans with salt. Cover and cook 10 mins.", "Add dry spices, mix. Cook 5 mins, then add cooked mung dal.", "Mix well, cook 1 min. Finish with lemon juice."],
        "source": "instagram", "board": None
    },
    {
        "name": "Makhana Cheela",
        "type": "Breakfast", "time": "40 mins", "emoji": "🍳",
        "ingredients": ["1 cup makhana/fox nuts", "1/2 cup suji/semolina", "1 cup cooked rice", "1/2 cup curd", "100ml water", "salt to taste", "1 tsp baking soda", "3 small boiled potatoes", "1 cup boiled chana dal", "1 small carrot grated", "1/2 small capsicum finely chopped", "1 tsp black pepper", "1 tsp roasted cumin powder", "ghee/oil to cook"],
        "steps": ["Soak makhana, suji and rice with curd, water and salt for 20 mins.", "Blend to smooth paste. Add baking soda just before making cheelas.", "Mix filling ingredients and keep aside.", "Spread batter on dosa tawa, cook thoroughly. No flip needed.", "Spread potato-dal filling, grate paneer on top. Serve with chutney."],
        "source": "instagram", "board": None
    },
    {
        "name": "High Protein Tawa Frankie",
        "type": "Dinner", "time": "30 mins", "emoji": "🌯",
        "ingredients": ["1 tbsp ghee", "10-12 curry leaves", "1 tsp mustard seeds", "3-4 green chillies", "1/2 tbsp ginger", "1.5 cups mixed veggies", "1 tsp red chilli powder", "1 tsp coriander powder", "1/8 tsp turmeric", "salt", "1 tsp cumin powder", "1/2 tbsp oregano", "1/2 tbsp chilli flakes", "1 tbsp sriracha", "1/2+1/4 cup grated paneer", "1 boiled mashed potato (optional)", "1/4 cup fresh coriander", "whole wheat rotis", "green chutney", "schezwan sauce"],
        "steps": ["Heat ghee, add mustard seeds, curry leaves, ginger, green chillies.", "Add veggies and all spices. Cook well.", "Add paneer, potato, coriander. Mix.", "Spread green chutney and schezwan sauce on roti.", "Fill with paneer veggie mix, roll tightly and serve."],
        "source": "instagram", "board": None
    },
    {
        "name": "Veggie Crepes with Paneer",
        "type": "Breakfast", "time": "30 mins", "emoji": "🥞",
        "ingredients": ["1/2 cup water", "1/2 cup milk", "1/3 cup whole wheat flour", "1/3 cup maida", "salt", "2 tbsp melted butter", "1 tbsp butter (stuffing)", "1/2 cup chopped spinach", "1 cup mixed veggies (cabbage, capsicum, bell peppers, baby corn, broccoli)", "1/4 cup paneer", "1/4 cup milk", "1/3 cup cheese", "salt, pepper, chilli flakes"],
        "steps": ["Make crepe batter by mixing flour, water, milk, butter, salt.", "Cook thin crepes on a non-stick pan.", "Sauté veggies in butter, add spinach, paneer, milk, cheese and seasoning.", "Fill crepes with veggie mixture and fold. Serve hot."],
        "source": "instagram", "board": None
    },
    {
        "name": "Sev Bhaji (Shevechi Bhaji)",
        "type": "Dinner", "time": "35 mins", "emoji": "🌶️",
        "ingredients": ["1 tbsp oil", "2 onions sliced", "1/2 cup dried coconut grated", "1/2 inch ginger", "6-8 garlic cloves", "3-4 red chillies", "2 tbsp oil", "1/4 tsp turmeric", "1 tsp garam masala", "1/2 tbsp coriander powder", "1 tsp cumin powder", "thick sev as needed", "coriander leaves", "salt to taste"],
        "steps": ["Fry onions, ginger, garlic in oil until brown.", "Add dried coconut and red chillies, roast a few mins.", "Grind to a thick paste with water.", "Heat oil, add turmeric, coriander, cumin, garam masala.", "Add onion-coconut paste, stir until oil releases from sides.", "Add hot water, mix. Add thick sev 5 mins before serving. Garnish with coriander."],
        "source": "instagram", "board": None
    },
    {
        "name": "Quinoa Carrot Dosa",
        "type": "Breakfast", "time": "20 mins", "emoji": "🥕",
        "ingredients": ["1/2 cup unpolished quinoa", "1/2 cup urad dal with skin", "1 tsp fenugreek seeds", "2 carrots", "salt to taste", "1 tsp oil"],
        "steps": ["Wash and soak quinoa and urad dal 5-6 hrs or overnight.", "Grind with chopped carrots until smooth.", "Add salt to taste.", "Pour batter on greased tawa, cover and cook till golden. Apply oil/ghee.", "Serve with chutney or sambar."],
        "source": "instagram", "board": None
    },
    {
        "name": "Tandoori Gobi Musallam",
        "type": "Dinner", "time": "45 mins", "emoji": "🥦",
        "ingredients": ["1 whole cauliflower", "1/2 cup fresh curd", "2 tbsp besan", "salt to taste", "1 tsp red chilli powder", "1/2 tsp turmeric", "1 tsp coriander powder", "1/2 tsp cumin powder", "1 tbsp tandoori masala", "1 tbsp mint leaves chopped", "1 tbsp coriander leaves chopped"],
        "steps": ["Mix all marinade ingredients (curd, besan, spices, herbs) into a paste.", "Coat whole cauliflower generously with marinade.", "Preheat oven/air fryer at 200°C for 10 mins.", "Roast for 30 mins at 200°C on broil mode. Serve hot."],
        "source": "instagram", "board": None
    },
    {
        "name": "Loaded Veggie Chilla (Moong Dal)",
        "type": "Breakfast", "time": "30 mins", "emoji": "🥬",
        "ingredients": ["1 cup split green moong dal (soaked 2 hrs)", "1 green chilli", "1 inch ginger", "2 tbsp cilantro", "1.5 tbsp besan", "1.5 tbsp rice flour", "1 tsp red chilli powder", "1/4 tsp turmeric", "1 tsp salt", "1/2 tsp garam masala", "1 tsp fennel seeds", "1/2 tsp carom seeds", "1 tbsp lemon juice", "1.5 cups shredded veggies/greens", "1 tbsp sesame seeds", "7-8 curry leaves", "2 tsp mustard seeds"],
        "steps": ["Grind moong dal with chilli, ginger, cilantro.", "Add besan, rice flour, spices, lemon juice. Mix well.", "Fold in shredded vegetables.", "Heat pan, add sesame seeds, curry leaves, mustard seeds as tadka.", "Pour batter, cook on low-medium till golden on both sides. Serve hot."],
        "source": "instagram", "board": None
    },
    {
        "name": "Paneer Do Pyaaza (Dhaba Style)",
        "type": "Dinner", "time": "40 mins", "emoji": "🧅",
        "ingredients": ["600g paneer", "2-3 tbsp oil", "1 tbsp jeera", "1 tbsp whole coriander seeds", "2 bay leaves", "2 badi elaichi", "4-5 green cardamom", "6-7 cloves", "1/2 cinnamon stick", "1 cup sliced onion", "1-2 tbsp ginger garlic paste", "1 small cup tomatoes", "salt", "1/2 cup curd", "1 tsp cumin powder", "1 tsp coriander powder", "1 tbsp saunf powder", "1 tsp haldi", "1 tbsp red chilli powder", "1 tbsp kasuri methi", "2 tbsp desi ghee (tadka)", "1 cup onion petals", "1 tbsp garam masala"],
        "steps": ["Shallow fry paneer, soak in cold water with salt. Keep aside.", "Heat oil, add whole spices and sliced onion. Cook golden.", "Add ginger garlic paste, cook well. Add tomatoes and salt.", "Whisk curd with spices. Add to masala.", "Add kasuri methi, water as needed, cook 5 mins.", "Add paneer. For tadka: heat ghee, add coriander seeds, chillies, saunf, garam masala, onion petals. Pour over.", "Serve hot."],
        "source": "instagram", "board": None
    },
    {
        "name": "Rajasthani Kadhi with Dhokla",
        "type": "Dinner", "time": "60 mins", "emoji": "🍲",
        "ingredients": ["1 cup yogurt", "3 tbsp besan", "3 cups water", "1 tsp salt", "2 tbsp ghee", "1 tsp mustard seeds", "1/2 tsp cumin seeds", "2 dried red chillies", "7 curry leaves", "1.5 cups whole wheat flour", "1/2 cup bajra flour", "2 tbsp semolina", "1/4 cup yellow moong dal (soaked)", "1/4 cup carrots grated", "1 cup mixed greens", "1/4 tsp baking soda", "2 tbsp yogurt"],
        "steps": ["For kadhi: whisk yogurt + besan + water. Add salt, chilli powder, turmeric. Heat ghee, temper mustard, cumin, cloves, fenugreek, hing, red chillies, curry leaves. Add kadhi and simmer.", "For dhokla: mix wheat flour, bajra, semolina, spices, soaked moong dal, grated veggies, greens, baking soda, yogurt and water into soft dough.", "Shape dhoklas and drop into simmering kadhi.", "Cook covered on low heat until dhoklas are done. Serve hot."],
        "source": "instagram", "board": None
    },
    {
        "name": "Spinach Bajra Dosa",
        "type": "Breakfast", "time": "25 mins", "emoji": "💚",
        "ingredients": ["1 cup unpolished bajra/pearl millet", "1/4 cup whole masoor/brown lentils", "1 tsp methi seeds", "1 bunch spinach", "salt as per taste"],
        "steps": ["Soak bajra, masoor and methi seeds for 4-5 hrs.", "Blend with spinach and salt, add water to make fine batter.", "Pour on hot tawa, cover and cook. Drizzle ghee.", "Enjoy with chutney or sambar."],
        "source": "instagram", "board": None
    },
    {
        "name": "Moong Dal Vegetable Cheela",
        "type": "Breakfast", "time": "30 mins", "emoji": "🥗",
        "ingredients": ["3 cups soaked moong dal", "1/4 cup gram flour", "4-5 garlic cloves", "2 inch ginger", "2-3 green chillies", "salt", "1/4 tsp asafoetida", "1 cup coriander leaves", "1/2 cup spring onion", "200g curd", "2-3 tbsp mayonnaise (or more curd)", "1/2 tsp red chilli powder", "1/2 tsp cumin powder", "1/4 cup each chopped cabbage, carrots, capsicum, cucumber", "black pepper and chaat masala"],
        "steps": ["Blend moong dal, gram flour, garlic, ginger, green chillies, hing, coriander, spring onion with water into batter.", "Make thin cheelas on tawa.", "Mix curd, mayo, red chilli, cumin, salt for stuffing.", "Mix chopped veggies with black pepper and chaat masala.", "Fill cheela with curd stuffing and veggies. Roll and serve."],
        "source": "instagram", "board": None
    },
    {
        "name": "Jowar Spicy Paneer Wrap",
        "type": "Dinner", "time": "30 mins", "emoji": "🌯",
        "ingredients": ["1 cup jowar flour", "1 cup whole wheat flour", "1 tbsp salt", "1 tbsp oil", "warm water as needed", "1 cup Greek yogurt", "2 tbsp sriracha sauce", "1 tbsp lemon juice", "1 tbsp garlic finely chopped", "1 tsp salt", "coriander", "1 tbsp garlic powder", "1 tbsp onion powder", "1 tbsp oregano", "1 tbsp red chilli flakes", "1 tbsp red chilli powder", "paneer pan-fried"],
        "steps": ["Make jowar roti dough with jowar flour, wheat flour, salt, oil and warm water. Roll and cook rotis.", "Mix yogurt, sriracha, lemon, garlic, salt, coriander for sauce.", "Mix garlic powder, onion powder, oregano, chilli flakes, chilli powder. Coat paneer and pan-fry.", "Assemble: roti + lettuce + paneer + sauce + onions + tomatoes. Wrap tightly."],
        "source": "instagram", "board": None
    },
    {
        "name": "Masoor Dal Chickpea Spinach Dal",
        "type": "Dinner", "time": "35 mins", "emoji": "🫘",
        "ingredients": ["1 cup red lentils (split masoor dal)", "1 can chickpeas drained", "4 cups water", "1/2 tsp turmeric", "2 tsp salt", "3 tbsp ghee", "6 cloves garlic sliced", "1 tsp ginger grated", "1/2 tsp cumin powder", "1/2 tsp coriander powder", "1 tsp red chilli powder", "2 dried red chillies", "pinch of hing", "8 curry leaves", "5 oz spinach roughly chopped", "1/4 tsp garam masala", "handful cilantro"],
        "steps": ["Combine rinsed lentils, chickpeas, water, turmeric, salt. Bring to boil then simmer 30 mins.", "Make tadka: heat ghee, add garlic, ginger, spices, dried chillies, hing, curry leaves. Cook 20 secs.", "Once dal is cooked, add spinach, garam masala, cilantro and tadka.", "Serve with rice and cucumber tomato salad."],
        "source": "instagram", "board": None
    },
    {
        "name": "Amritsari Palak Paneer Bhurji",
        "type": "Dinner", "time": "30 mins", "emoji": "🥬",
        "ingredients": ["3 tbsp roasted besan", "1 tbsp red chilli powder", "1 tsp cumin powder", "pinch of turmeric", "1/2 tsp each chole masala, pav bhaji masala, chaat masala", "1/2 tsp salt", "1/2 cup curd", "1/4 cup milk", "2 tbsp hot oil", "1 tbsp oil", "1 tsp butter", "2 green chillies", "1 tbsp garlic", "1 inch ginger", "3 onions", "3 tomatoes", "salt", "2 cups spinach (palak)", "250g grated paneer", "1 tbsp lemon juice", "1 tbsp coriander"],
        "steps": ["Mix besan with spices, curd, milk and hot oil to make besan masala.", "Heat oil+butter, sauté green chillies, garlic, ginger.", "Add onions, cook golden. Add tomatoes, salt, cook well.", "Add prepared besan masala with water. Cook until thick.", "Add palak, cook 2 mins. Add grated paneer, lemon juice, coriander. Serve with rice."],
        "source": "instagram", "board": None
    },
    {
        "name": "Broccoli Oats Jowar Chilla",
        "type": "Breakfast", "time": "25 mins", "emoji": "🥦",
        "ingredients": ["1 broccoli with stem", "1 cup oats", "1/2 cup jowar flour", "1/4 cup rice flour", "salt to taste", "1 green chilli", "handful coriander leaves", "1/2 tsp cumin", "1.5 cups water"],
        "steps": ["Clean broccoli and blanch in boiling water.", "Blend blanched broccoli into a paste.", "Mix broccoli paste with oats, jowar flour, rice flour, salt, chilli, coriander, cumin, water into batter.", "Heat greased tawa, pour batter, cook on low heat until both sides golden.", "Serve hot with chutney."],
        "source": "instagram", "board": None
    },
    {
        "name": "Kobiche Bhanole (Maharashtrian Cabbage Pancake)",
        "type": "Snack", "time": "30 mins", "emoji": "🥬",
        "ingredients": ["3 cups cabbage thinly sliced", "1 cup spring onion greens chopped", "3 green chillies + 2 garlic cloves (paste)", "1/3 cup fresh/frozen coconut grated", "1/2 tsp turmeric", "1/4 tsp red chilli powder", "3/4 tsp coriander powder", "1/4 tsp cumin powder", "1/2 tsp sugar", "pinch hing", "salt", "1/2 cup thick coconut milk", "1 tbsp rice flour", "1/4 cup besan", "1.5 tbsp oil"],
        "steps": ["Combine cabbage, spring onion, chilli-garlic paste, coconut, spices, hing, salt.", "Add coconut milk, mix well.", "Add rice flour and besan, mix everything.", "Ladle into 8 inch cast iron pan with even layer of oil.", "Cover and cook on low heat 8-10 mins.", "Flip using a large plate, cook other side 3-4 mins.", "Serve with green chutney."],
        "source": "instagram", "board": None
    },
    {
        "name": "Instant Tomato Masoor Dosa",
        "type": "Breakfast", "time": "20 mins", "emoji": "🍅",
        "ingredients": ["200g soaked masoor dal (15 mins in hot water)", "2 medium tomatoes", "2-3 tbsp rice flour (optional, for crispiness)", "1 inch ginger", "2-3 green chillies", "salt to taste", "water as needed", "oil for cooking"],
        "steps": ["Blend soaked masoor dal, tomatoes, ginger, chillies, salt into smooth batter.", "Add rice flour and water to adjust consistency.", "Heat pan, pour batter and spread thin.", "Drizzle oil, cook until crispy on low flame.", "Flip and cook other side (optional). Serve with chutney."],
        "source": "instagram", "board": None
    },
    {
        "name": "Black Pepper Paneer with Quinoa",
        "type": "Dinner", "time": "30 mins", "emoji": "🧀",
        "ingredients": ["200g paneer cubed", "100g yogurt/hung curd", "8-9 cashews", "1 medium onion", "3-4 garlic cloves", "2 inch ginger", "1 green chilli", "salt", "1 tsp black pepper", "1 tsp roasted cumin powder", "1 tbsp kasuri methi", "pinch of cardamom powder", "1-2 tbsp desi ghee/oil"],
        "steps": ["Mix yogurt with black pepper, cumin, salt. Marinate paneer in it.", "Boil onions, ginger, garlic, green chilli, cashews in water 3-4 mins. Blend into smooth paste.", "Heat ghee, sauté onion paste 5-6 mins.", "Add marinated paneer with 1/4 cup water. Cover, cook 3-4 mins.", "Sprinkle kasuri methi and cardamom. Serve with rice or quinoa."],
        "source": "instagram", "board": None
    },
    {
        "name": "Dahi Ghiya (Lauki with Curd)",
        "type": "Dinner", "time": "25 mins", "emoji": "🥒",
        "ingredients": ["1 small ghiya/lauki", "1 cup curd", "1 medium onion finely chopped", "10-12 curry leaves", "1 tsp cumin seeds", "1 tsp mustard seeds", "2 dried red chillies", "salt", "1 tsp turmeric", "1.5 tsp Kashmiri red chilli powder", "oil/desi ghee"],
        "steps": ["Peel and slice lauki into medium rounds. Rub with chilli, turmeric, salt, oil.", "Roast ghiya from both sides in oil 4-5 mins until cooked.", "Switch off flame, add curd mixed with salt over the ghiya.", "Tempering: heat oil, add cumin, mustard, dried red chillies, curry leaves, onion. Cook golden, add Kashmiri chilli powder.", "Pour tempering over ghiya-curd mix. Serve with rice or roti."],
        "source": "instagram", "board": None
    },
    {
        "name": "Masoor Dal Falafels",
        "type": "Snack", "time": "30 mins", "emoji": "🧆",
        "ingredients": ["1/2 cup masoor dal (soaked overnight)", "2-3 garlic cloves chopped", "1/2 inch ginger chopped", "2-3 green chillies chopped", "1/2 cup coriander", "3-4 springs of spring onion", "1/4 cup parsley", "salt to taste", "oil for appe pan"],
        "steps": ["Drain and blend masoor dal with garlic, ginger, chillies (coarsely, not fine paste).", "Add coriander, spring onion, parsley. Blend briefly or chop and fold in.", "Add salt just before making falafels.", "Lightly shape batter and cook in appe pan with oil on medium heat, turning until golden. Serve with hummus or dahi dip."],
        "source": "instagram", "board": None
    },
    {
        "name": "Raw Mango Rice",
        "type": "Dinner", "time": "25 mins", "emoji": "🥭",
        "ingredients": ["1 raw mango", "5-6 Kashmiri red chillies", "1 tbsp coriander seeds", "1 tbsp cumin seeds", "4-5 garlic cloves", "1 tsp rai", "1 tsp urad dal", "1 tsp chana dal", "4-5 kadi patta", "1/2 tsp hing", "salt to taste", "1 tsp coriander powder", "1/2 tsp haldi", "1 cup cooked rice", "handful coriander", "ghee for cooking"],
        "steps": ["Grate raw mango. Heat ghee with Kashmiri chillies and coriander seeds.", "Let cool, grind with garlic and salt into paste.", "Heat ghee, add rai, urad dal, chana dal, curry leaves, hing. Splutter.", "Add paste, mix, then add grated mango, salt. Mix well.", "Add tempering to rice with coriander. Serve with papad or pickle."],
        "source": "instagram", "board": None
    },
    {
        "name": "Peppy Paneer Pasta",
        "type": "Dinner", "time": "25 mins", "emoji": "🍝",
        "ingredients": ["4 small tomatoes diced", "2 small onions sliced", "1 small capsicum diced", "3-4 garlic cloves", "100g paneer", "1.5 cups pasta boiled", "salt", "1 tsp red chilli flakes", "2 tsp oregano/pizza pasta mix", "1 tbsp olive oil", "1/2 tbsp butter", "1/2 cup water"],
        "steps": ["Heat olive oil, sauté garlic and onions 2-3 mins.", "Add tomatoes, capsicum, chilli flakes, salt. Add water, cover and cook 5-6 mins.", "Cool, blend with paneer into smooth sauce.", "Heat butter in same pan, add sauce with oregano. Cook 2 mins.", "Add boiled pasta, mix well. Top with grated cheese and enjoy."],
        "source": "instagram", "board": None
    },
    {
        "name": "Pahadi Masala Bhindi",
        "type": "Dinner", "time": "25 mins", "emoji": "🌿",
        "ingredients": ["250g bhindi", "3 tbsp oil", "1.5 tsp cumin seeds", "1.5 tsp mustard seeds", "1 tsp hing", "1.5 tsp amchur powder", "handful coriander", "4-5 garlic cloves", "2-3 pieces ginger", "1 green chilli", "1 tsp turmeric", "1.5 tsp coriander powder", "1/2 tsp garam masala", "salt"],
        "steps": ["Heat 2 tbsp oil, sauté bhindi with amchur 2-3 mins then 3-4 more mins. Keep aside.", "Make paste: blend coriander, garlic, ginger, green chilli, turmeric, coriander powder, garam masala, salt with oil.", "Heat 1 tbsp oil, sauté masala paste 3-4 mins.", "Add bhindi and mix 2-3 mins. Serve with roti or paratha."],
        "source": "instagram", "board": None
    },
    {
        "name": "Cucumber Tambli (South Indian Dahi Tadka)",
        "type": "Dinner", "time": "15 mins", "emoji": "🥒",
        "ingredients": ["1 chopped cucumber", "1/4 tsp pepper", "1/2 tsp jeera", "1/2 tsp sesame seeds", "2 green chillies", "3 garlic cloves", "1/3 cup coconut", "handful coriander", "salt", "1.5 cups water", "1 cup curd", "1 tsp oil", "2-3 dry red chillies", "1/2 tsp mustard", "7-8 curry leaves"],
        "steps": ["Grind pepper, jeera, sesame, chillies, garlic, cucumber, coconut, coriander, salt with a little water.", "Transfer to bowl, add water and curd to thick buttermilk consistency.", "Tempering: heat oil, add mustard, jeera, dry red chilli, curry leaves. Pour over curd mix.", "Serve with hot rice."],
        "source": "instagram", "board": None
    },
    {
        "name": "Aloo Tamatar ki Sabzi",
        "type": "Dinner", "time": "20 mins", "emoji": "🥔",
        "ingredients": ["3 tbsp oil", "1 tbsp jeera", "1/4 tsp hing", "3 chopped green chillies", "1 tsp Kashmiri red chilli powder", "1 tsp red chilli powder", "1 tsp turmeric", "1 tbsp coriander powder", "water as required", "2-3 medium tomatoes chopped", "salt", "boiled chopped potatoes", "chopped coriander"],
        "steps": ["Heat oil, add jeera, hing, green chillies. Add all spices with a little water and cook.", "Add tomatoes and salt, cook until oil rises.", "Add boiled potatoes and coriander. Mix and serve hot."],
        "source": "instagram", "board": None
    },
    {
        "name": "Dry Masala Kala Chana",
        "type": "Dinner", "time": "45 mins", "emoji": "🫘",
        "ingredients": ["250g black chickpeas (soaked 8-9 hrs)", "2 tomatoes", "2 tbsp peanuts", "3 tbsp mustard oil", "1 tsp cumin", "2 bay leaves", "2 cloves", "2 green cardamom", "2 medium onions finely chopped", "1 tbsp ginger garlic paste", "1 tsp red chilli powder", "1 tbsp coriander powder", "1/4 tsp turmeric", "1/2 tsp black pepper", "1/2 tsp roasted cumin powder", "1/4 tsp garam masala", "salt", "1 tsp amchoor", "1 tbsp kasuri methi"],
        "steps": ["Pressure cook soaked chickpeas until soft.", "Blend tomatoes and peanuts into smooth paste.", "Heat mustard oil, add cumin and whole spices. Add onions, cook golden. Add ginger garlic paste.", "Add tomato-peanut paste with all spices, cook until oil separates.", "Add chickpeas with water, cover and cook 10-15 mins. Sprinkle kasuri methi and coriander."],
        "source": "instagram", "board": None
    },
    {
        "name": "Tawa Pulao",
        "type": "Dinner", "time": "30 mins", "emoji": "🍚",
        "ingredients": ["1 cup long grain rice (boiled with salt, turmeric, oil)", "For garlic chutney: 12-15 soaked Kashmiri red chillies + 100g garlic + 5-6 green chillies (paste)", "1 tbsp butter", "1.5 tsp jeera", "onion, tomatoes, capsicum, carrots, paneer, beans", "pav bhaji masala", "salt", "lemon juice", "2-3 tbsp kasuri methi"],
        "steps": ["Cook and cool rice. Make garlic chutney by blending soaked Kashmiri chillies, garlic, green chillies.", "Heat tawa with oil + butter and jeera.", "Add veggies, cook well. Add pav bhaji masala, salt, garlic chutney.", "Add cooked rice, lemon juice, kasuri methi, coriander. Toss well. Serve with onion and chutney."],
        "source": "instagram", "board": None
    },
    {
        "name": "Street Style Crispy Moonglet",
        "type": "Breakfast", "time": "25 mins", "emoji": "🟡",
        "ingredients": ["1 cup moong dal (soaked 1+ hr)", "2-3 tbsp water", "1 inch ginger", "1 green chilli", "1/2 tsp cumin seeds", "salt", "pinch hing", "1/4 tsp turmeric", "2.5 tbsp rice flour", "1 tsp oil", "1 tbsp butter", "2 tbsp each onion, capsicum, corn, tomato, carrot, coriander", "1 tsp eno"],
        "steps": ["Blend soaked moong with water, ginger, green chilli until smooth.", "Add cumin, hing, turmeric, rice flour, salt, vegetables. Mix well.", "Heat non-stick pan with oil/butter.", "Take 2 big ladles of batter in a bowl, add eno, mix immediately and pour onto pan.", "Cook on low-medium heat. Add ginger/beet threads on top. Flip and cook both sides golden.", "Cut into 4, serve with chutney."],
        "source": "instagram", "board": None
    },
    {
        "name": "Oats Beetroot Cheela",
        "type": "Breakfast", "time": "25 mins", "emoji": "🩷",
        "ingredients": ["1 cup rolled oats", "3/4 cup besan/chickpea flour", "2-3 green chillies", "1 inch ginger", "1 tsp cumin seeds", "1 tsp salt", "1 medium beetroot (steamed/boiled)", "water as needed"],
        "steps": ["Dry roast oats until lightly brown. Let cool.", "Blend oats with all ingredients into smooth batter. Rest 5 mins.", "Heat griddle, pour batter and tilt to spread thin.", "Drizzle oil on sides, cook on low heat from both sides.", "Serve with yogurt or chutney."],
        "source": "instagram", "board": None
    },
    {
        "name": "Chickpea Falafel Wrap with Beetroot Dressing",
        "type": "Dinner", "time": "35 mins", "emoji": "🌯",
        "ingredients": ["1 whole wheat roti", "100g boiled chickpeas", "2 tbsp onion", "handful coriander", "1 tbsp besan", "salt, amchur, coriander powder, red chilli powder, pepper, jeera powder", "3-4 garlic cloves", "1/2 lemon juice", "2 green chillies", "80g Greek yogurt", "1 tsp lemon juice", "2 tbsp boiled grated beetroot"],
        "steps": ["Grind chickpeas, coriander, spices, besan, garlic, onion, green chillies into a coarse paste.", "Spread this mixture on roti and cook on both sides until crispy.", "Mix Greek yogurt, beetroot, lemon, salt and pepper for dressing.", "Assemble wrap with beet dressing, tomato, onion, cucumber. Carry dressing separately for lunch box."],
        "source": "instagram", "board": None
    },
    {
        "name": "Smashed Mexican Tacos (Paneer Rajma)",
        "type": "Dinner", "time": "30 mins", "emoji": "🌮",
        "ingredients": ["200g paneer", "1/2 cup boiled rajma", "2 tsp fried garlic", "1 tsp coriander chopped", "1 tsp red chilli powder", "1 tsp jeera powder", "salt", "1 tsp garlic", "1 cup boiled corn", "1 cup iceberg lettuce", "1 cup hung curd", "1 tsp chilli flakes", "1 tsp jalapeños chopped", "rotis", "1 tsp oil", "sriracha sauce"],
        "steps": ["Mix paneer with boiled rajma, garlic, coriander, red chilli, jeera, salt.", "For salad: mix garlic, corn, lettuce, hung curd, chilli flakes, jalapeños.", "Place filling on roti, top with corn salad and sriracha.", "Wrap, place on tawa with oil. Press down (smash) and cook both sides until crispy."],
        "source": "instagram", "board": None
    },
    {
        "name": "Sprouts Burger Patty",
        "type": "Dinner", "time": "30 mins", "emoji": "🍔",
        "ingredients": ["400g mixed sprouts soaked", "chopped coriander", "2-3 green chillies", "2-3 tbsp ginger", "2-3 garlic cloves", "1/2 cup hung curd", "black pepper", "salt", "chopped herbs (dill/parsley)", "chilli flakes", "butter", "burger buns", "cabbage, tomato, onion, cheese"],
        "steps": ["Blend sprouts, coriander, green chilli, ginger, garlic into coarse paste.", "Mix hung curd with pepper, salt, herbs for spread.", "Combine sprout paste with chilli flakes, salt, pepper. Shape into patties.", "Toast buns with butter.", "Cook patties golden on both sides.", "Assemble: hung curd spread + cabbage + patty + tomato + onion + cheese."],
        "source": "instagram", "board": None
    },
    {
        "name": "One Pot Creamy Mushroom Rice",
        "type": "Dinner", "time": "35 mins", "emoji": "🍄",
        "ingredients": ["3-4 tbsp butter", "150-200g sliced mushrooms", "7-8 garlic cloves chopped", "1 tsp chilli flakes", "1 tsp mixed dried herbs", "1 tbsp all purpose flour", "1 cup milk", "1/2 cup water", "1/2 cup fresh cream", "1 tsp salt", "1/2 cup small grain rice (soaked 1 hr)", "2 cups water", "1/4 cup parmesan"],
        "steps": ["Heat butter, fry mushrooms until all water dries out.", "Add garlic, cook golden. Add chilli flakes, herbs.", "Add flour, mix. Add milk and water. Stir until thick.", "Add cream, salt. Add soaked rice, mix well.", "Add 2 cups water, cover and cook on low 15-20 mins. Stir occasionally.", "Top with parmesan, cover 2 mins until melted."],
        "source": "instagram", "board": None
    },
    {
        "name": "Creamy Butter Garlic Mushrooms",
        "type": "Dinner", "time": "20 mins", "emoji": "🍄",
        "ingredients": ["2 tbsp finely chopped garlic", "1 finely chopped onion", "250g button mushrooms", "2 tbsp butter", "1 tbsp Italian seasoning", "1 tbsp chilli flakes", "1 cup sliced spinach", "1 tbsp tomato paste", "2 tbsp fresh cream", "water as needed"],
        "steps": ["Heat butter, sauté garlic and onion.", "Add mushrooms, cook until golden.", "Add Italian seasoning, chilli flakes.", "Add spinach, tomato paste, fresh cream and water as needed.", "Simmer until creamy. Serve with herbed rice or naan."],
        "source": "instagram", "board": None
    },
    {
        "name": "Peri Peri Paneer Salad",
        "type": "Salad", "time": "20 mins", "emoji": "🥗",
        "ingredients": ["1 cup lettuce", "1 cucumber", "1/2 cup sweet corn", "100g paneer", "1 tsp olive oil", "salt", "1/2 tsp black pepper", "1/2 tsp red chilli powder", "1 tsp coriander powder", "1/2 tsp chilli flakes", "1/2 tsp mixed herbs", "2 tomatoes", "6-7 mint leaves", "10g coriander leaves", "1/2 cup hung curd", "black salt", "2 green chillies"],
        "steps": ["Marinate paneer with olive oil, spices and herbs. Grill/pan-fry until golden.", "Blend tomatoes, mint, coriander, hung curd, black salt, green chillies for dressing.", "Arrange lettuce, cucumber, corn in a bowl.", "Top with grilled paneer.", "Drizzle green dressing and serve immediately."],
        "source": "instagram", "board": None
    },
    {
        "name": "Crispy Sweet Potato Salad",
        "type": "Salad", "time": "30 mins", "emoji": "🍠",
        "ingredients": ["2 cups lettuce", "1 onion (rings)", "125g boiled sweet potato", "1/2 tbsp olive oil", "1 tbsp mixed herbs", "1/2 tbsp red chilli flakes", "salt", "1 red bell pepper", "2 tomatoes", "4-5 garlic cloves", "7-8 almonds blanched", "100g low fat paneer", "1 tbsp shredded cheese", "black pepper", "1/2 cup water"],
        "steps": ["Toss sweet potato with olive oil, herbs, chilli flakes, salt. Air fry at 180°C till crispy.", "Blend red bell pepper, tomatoes, garlic, almonds, paneer, cheese, salt, pepper, water for dressing.", "Arrange lettuce and onion rings in bowl.", "Top with crispy sweet potato.", "Drizzle protein dressing and serve."],
        "source": "instagram", "board": None
    },
    {
        "name": "Beetroot Roasted Chana Salad",
        "type": "Salad", "time": "15 mins", "emoji": "🩷",
        "ingredients": ["1 grated beetroot", "1 grated carrot", "1/2 pomegranate", "1 red onion", "3/4 cup roasted chana", "handful coriander", "pumpkin and melon seeds", "1 tsp olive oil", "juice of 1 lime", "1/2 tsp soy sauce", "1/2 tsp sesame seeds", "1 tsp honey"],
        "steps": ["Shake all dressing ingredients in a small jar.", "Add all salad ingredients into a big bowl.", "Pour dressing and mix well.", "Garnish with pumpkin and melon seeds. Serve fresh."],
        "source": "instagram", "board": None
    },
    {
        "name": "Grilled Peach and Paneer Salad",
        "type": "Salad", "time": "25 mins", "emoji": "🍑",
        "ingredients": ["3 peaches (1 for dressing, 2 for salad)", "3-4 tbsp olive oil", "2 tbsp honey", "1-2 tbsp ginger juice", "salt", "red chilli flakes", "1 tbsp lemon juice", "1 cup spinach finely chopped", "1 apple finely chopped", "1 cup cucumber", "1.5 cups cooked quinoa", "1/2 cup paneer (crumbled)", "walnuts for topping"],
        "steps": ["Blend 1 peach with olive oil, honey, ginger juice, salt, chilli, lemon for dressing.", "Grill peach slices from both sides.", "In a bowl, mix spinach, apple, cucumber, quinoa with dressing.", "Assemble with lettuce, quinoa mix, crumbled paneer, grilled peaches, walnuts."],
        "source": "instagram", "board": None
    },
    {
        "name": "Yogurt Chana Breakfast Bowl",
        "type": "Breakfast", "time": "10 mins", "emoji": "🫙",
        "ingredients": ["1 cup yogurt", "1 cup boiled black channa", "finely chopped beetroot", "finely chopped cucumber", "cherry tomatoes", "mint and coriander leaves", "1 tbsp chia seeds (soaked)", "salt, pepper, roasted jeera to taste", "1 tbsp pumpkin seeds"],
        "steps": ["Mix all ingredients in a bowl.", "Store in fridge overnight.", "Grab and go in the morning."],
        "source": "instagram", "board": None
    },
    {
        "name": "Chilli Butter Omelette Sandwich",
        "type": "Breakfast", "time": "15 mins", "emoji": "🥚",
        "ingredients": ["2-3 eggs", "1/2 onion chopped", "1-2 tomatoes diced", "handful coriander", "1-2 green chillies", "salt, pepper, red chilli powder", "softened butter", "chopped coriander/herbs", "chilli oil", "oregano, salt, pepper", "2 slices bread", "melty cheese"],
        "steps": ["Mix chilli butter: softened butter + herbs + chilli oil + seasonings.", "Whisk eggs with onion, tomatoes, coriander, green chillies, salt, pepper, chilli powder until frothy.", "Melt butter in pan. Pour egg mix. Place 2 bread slices on top.", "Spread chilli butter on bread. Flip once set.", "Add cheese, fold sandwich, cook on low until cheese melts."],
        "source": "instagram", "board": None
    },
    {
        "name": "Grilled Masala Corn Sandwich",
        "type": "Snack", "time": "15 mins", "emoji": "🌽",
        "ingredients": ["1/2 cup boiled sweet corn", "1 tbsp onion", "1 tbsp capsicum", "1-2 green chillies", "1/4 cup grated cheese", "1 tsp red chilli powder", "1/2 tsp jeera powder", "pinch turmeric", "salt and black pepper", "bread slices", "butter"],
        "steps": ["Mix all filling ingredients together.", "Butter bread slices.", "Fill masala between bread slices.", "Grill on pan until golden on both sides. Serve warm."],
        "source": "instagram", "board": None
    },
    {
        "name": "No Sugar No Maida Brownies (Dates-Sweetened)",
        "type": "Dessert", "time": "40 mins", "emoji": "🍫",
        "ingredients": ["25 pitted dates", "1.25 cup hot milk", "1/2 cup olive oil", "1 tsp baking soda", "1/2 tsp baking powder", "1/4 cup cocoa powder", "1 cup wholewheat flour", "chopped walnuts", "chocolate chunks"],
        "steps": ["Soak dates in hot milk, blend to fine puree.", "Add olive oil to date puree.", "Sieve in baking soda, baking powder, cocoa powder, wholewheat flour. Mix well.", "Pour into lined baking tin. Top with walnuts and chocolate chunks.", "Bake at 180°C for 25 mins. Cool, slice and enjoy."],
        "source": "instagram", "board": None
    },
    {
        "name": "Choco Dates Jowar Pancake",
        "type": "Dessert", "time": "35 mins", "emoji": "🥞",
        "ingredients": ["1 cup whole wheat flour", "1/2 cup jowar flour", "1/2 cup powdered almonds", "1 tsp baking soda", "1/2 tsp baking powder", "11-12 dates (around 200g)", "1.5 cup milk", "3 tbsp desi ghee", "2 tbsp cocoa powder"],
        "steps": ["Mix premix: wheat flour, jowar flour, almonds, baking soda, baking powder.", "Soak dates in hot milk 20-30 mins. Blend into smooth paste.", "Add ghee to date paste + half premix. Mix well.", "Split batter: one plain, one with cocoa powder.", "Heat appe pan, add one spoon plain + half spoon cocoa batter. Swirl with chopstick. Cook 3-4 mins on each side.", "Serve with honey and chopped almonds."],
        "source": "instagram", "board": None
    },
    {
        "name": "Ragi Chocolate Mug Cake",
        "type": "Dessert", "time": "10 mins", "emoji": "🍫",
        "ingredients": ["5 tbsp ragi flour", "3 tbsp jaggery", "1 tbsp cocoa powder", "1/4 tsp baking soda", "1/4 cup milk", "2 tbsp oil", "1/2 tsp vanilla extract"],
        "steps": ["In a microwave-safe mug, add ragi flour, jaggery, cocoa powder, baking soda.", "Add milk, oil, vanilla extract.", "Mix well, scraping the bottom.", "Microwave at regular heating mode for 2 minutes.", "Dig in warm."],
        "source": "instagram", "board": None
    },
    {
        "name": "Chocolate Pudding with Paneer",
        "type": "Dessert", "time": "15 mins", "emoji": "🍮",
        "ingredients": ["150g paneer crumbled", "7 tbsp milk", "1.5 tbsp cocoa powder", "1.5 tbsp honey", "60g dark chocolate melted", "cocoa powder for dusting"],
        "steps": ["Crumble paneer for smooth blending.", "Blend paneer, milk, cocoa powder, honey, melted dark chocolate until thick and smooth.", "Pour into bowls or one large dish.", "Refrigerate overnight or 6-8 hours to set.", "Dust with cocoa powder before serving."],
        "source": "instagram", "board": None
    },
    {
        "name": "Red Velvet Ragi Pancake",
        "type": "Dessert", "time": "30 mins", "emoji": "❤️",
        "ingredients": ["1/2 cup whole wheat flour", "1/2 cup ragi flour", "3/4 cup jaggery powder", "1/4 cup cocoa powder", "1 tsp baking powder", "2 tbsp beetroot powder (optional)", "1 cup yogurt/curd", "1/2 tsp baking soda", "2 tbsp ghee", "1/4 cup warm milk"],
        "steps": ["Mix premix: wheat flour, ragi, jaggery, cocoa, baking powder, beetroot powder.", "Mix curd with baking soda until it fluffs up. Add milk and ghee.", "Add premix to wet mix, stir until smooth.", "Heat pan, pour small batches of batter. Drizzle ghee, cook on low 3-4 mins each side.", "Serve with honey, nuts and white chocolate chips (optional)."],
        "source": "instagram", "board": None
    },
    {
        "name": "Beetroot Hummus",
        "type": "Snack", "time": "50 mins", "emoji": "🩷",
        "ingredients": ["2 fresh beetroots", "1 tin chickpeas", "2 garlic cloves", "1 lemon", "5 tbsp tahini", "1 tbsp cumin", "1 tsp bicarbonate of soda", "ice cubes", "salt"],
        "steps": ["Boil beets in salted water until fork tender (30-40 mins).", "Drain chickpeas (reserve liquid), boil with garlic until soft (30-40 mins).", "Peel beets and chop into chunks.", "Blitz chickpeas until coarse. Add chickpea water, garlic, beets.", "Add tahini, blend with ice cubes for creaminess.", "Add lemon juice, cumin, salt. Adjust to taste."],
        "source": "instagram", "board": None
    },
    {
        "name": "Sookhi Green Chutney (Bombay Style)",
        "type": "Snack", "time": "10 mins", "emoji": "💚",
        "ingredients": ["1/2 cup fresh coriander", "8-10 fresh mint leaves", "3-4 curry leaves", "4-5 spicy green chillies", "small piece ginger", "2 pinches hing", "1/2 tsp amchoor", "1/2 tsp jeera powder", "1/2 tsp black salt", "1 tsp salt", "1/2 nimbu juice or 1/4 tsp citric acid", "2/3 cup daalia/roasted gram", "chaat masala", "1/4 tsp turmeric"],
        "steps": ["Wash all leaves and dry on cloth before grinding.", "Blend everything together WITHOUT any water.", "Store in airtight container in fridge. Stays well at room temp 6-7 days.", "Add water to make regular green chutney when needed."],
        "source": "instagram", "board": None
    },
    {
        "name": "Butter Garlic Baby Potatoes",
        "type": "Snack", "time": "15 mins", "emoji": "🥔",
        "ingredients": ["15-20 boiled baby potatoes", "salt", "1 tsp pepper powder", "1 tsp red chilli powder", "1.5 tsp jeera powder", "1 tsp amchur powder", "2 tbsp butter", "5-6 garlic cloves chopped", "1 tsp oregano", "1 tsp chilli flakes", "coriander"],
        "steps": ["Halve boiled baby potatoes.", "Heat butter in pan, add garlic, cook 1 min.", "Add potatoes and all spices.", "Toss well for 5-7 mins until coated and lightly crispy.", "Garnish with coriander and serve."],
        "source": "instagram", "board": None
    },
    {
        "name": "Crispy Roti Chinese Bhel",
        "type": "Snack", "time": "20 mins", "emoji": "🥢",
        "ingredients": ["leftover rotis", "oil", "oil for stir fry", "finely chopped ginger", "finely chopped garlic", "onions", "carrots", "capsicum", "cabbage", "schezwan sauce", "soy sauce", "black pepper powder", "salt"],
        "steps": ["Roll rotis and cut thinly like noodles. Roast in pan with oil until crispy (or air fry).", "Heat oil in pan, sauté ginger, garlic. Add veggies, stir fry.", "Add schezwan sauce, soy sauce, black pepper, salt. Mix well.", "Switch off gas, let cool 2-3 mins.", "Add crispy roti noodles, mix and serve immediately."],
        "source": "instagram", "board": None
    },
    {
        "name": "Sprouts Appe",
        "type": "Breakfast", "time": "30 mins", "emoji": "🌱",
        "ingredients": ["2 cups green moong sprouts", "1 cup gram flour/besan", "handful bathua or any greens", "1 cup water", "1-2 inch ginger", "1 tsp red chilli powder", "2 tsp roasted cumin powder", "salt to taste", "oil/desi ghee", "1 tsp baking powder/ENO"],
        "steps": ["Blend moong sprouts, besan, ginger and water into smooth batter.", "Add red chilli, cumin, salt. Mix. Add baking soda and mix again.", "Heat appe pan, brush cavities with oil.", "Fill cavities just below the rim.", "Cover and cook on medium flame until base firms. Flip and cook other side.", "Test with skewer - should come out clean. Serve with chutney."],
        "source": "instagram", "board": None
    },
    {
        "name": "Creamy Corn Salad",
        "type": "Salad", "time": "15 mins", "emoji": "🌽",
        "ingredients": ["1 cup boiled sweet corn", "1 tbsp salted butter", "1/2 cup tomatoes chopped", "1/4 cup spring onion greens", "2-3 tbsp jalapeños chopped", "1 tsp minced garlic", "1 cup hung curd", "salt", "1 tsp chilli flakes", "handful coriander", "squeeze of lemon"],
        "steps": ["Cook corn in butter until golden brown.", "Cool slightly, then add all remaining ingredients.", "Mix well and serve immediately."],
        "source": "instagram", "board": None
    },
    {
        "name": "Paneer Tikka",
        "type": "Snack", "time": "35 mins", "emoji": "🍢",
        "ingredients": ["200g paneer cubed", "3 tbsp warm mustard oil", "2 tbsp red chilli powder", "1 tbsp chaat masala", "black salt", "1 tsp roasted cumin seeds", "1 tsp kasuri methi", "1 tbsp ginger garlic paste", "1.5 tbsp hung curd", "onion quarters", "tomato quarters", "capsicum quarters"],
        "steps": ["Mix mustard oil with all spices and kasuri methi.", "Add ginger garlic paste and hung curd. Mix.", "Add paneer cubes, onion, tomato, capsicum. Marinate 1 hour in fridge.", "Put on skewers and bake at 200°C for 15-20 mins OR grill on tawa.", "Serve with coriander chutney."],
        "source": "instagram", "board": None
    },
    {
        "name": "Chilli Paneer",
        "type": "Dinner", "time": "30 mins", "emoji": "🌶️",
        "ingredients": ["paneer cubes coated in dry cornflour", "oil", "white part of spring onion", "onion", "bell peppers", "salt", "sesame seeds 2 tsp", "1-2 tbsp sriracha/red chilli sauce", "2 tbsp soy sauce", "1 tbsp cornflour", "water", "black pepper"],
        "steps": ["Shallow fry cornflour-coated paneer until golden. Keep aside.", "Make sauce: mix sesame seeds, sriracha, soy sauce, cornflour, water, black pepper.", "In same pan, add spring onion white parts, onion, bell peppers.", "Add sauce, cook until thickened.", "Add paneer, toss well. Garnish with spring onion greens."],
        "source": "instagram", "board": None
    },
    {
        "name": "Crispy Lotus Stem with Kashmiri Walnut Dip",
        "type": "Snack", "time": "30 mins", "emoji": "🌸",
        "ingredients": ["1 lotus stem sliced", "1/2 tsp red chilli powder", "1/2 tsp onion powder", "1/2 tsp garlic powder", "salt", "1/2 tbsp oil", "1 green chilli", "handful mint", "1/2 onion", "soaked walnuts", "1/2 cup thick yogurt", "1/2 tsp roasted jeera powder"],
        "steps": ["Toss lotus stem slices with red chilli, onion powder, garlic powder, salt, oil.", "Air fry at 170°C for 15-18 mins, tossing midway. Or deep fry on medium heat.", "Crush green chilli, mint, onion, walnuts into a paste.", "Mix with yogurt and jeera powder.", "Serve crispy lotus stem with walnut dip."],
        "source": "instagram", "board": None
    },
    {
        "name": "Gujarati Khichu",
        "type": "Snack", "time": "20 mins", "emoji": "🌾",
        "ingredients": ["400ml water", "3-4 tbsp fresh coriander", "1.5 tsp salt", "1 tsp cumin seeds", "1-2 tsp ajwain", "1 tbsp ginger-garlic-chilli paste", "1 cup rice flour"],
        "steps": ["Boil water with coriander, salt, cumin, ajwain, ginger-garlic-chilli paste.", "Add rice flour, stir well continuously.", "When consistency is thick, switch to low heat, cover and cook 7-8 mins.", "Serve with drizzle of oil and chilli powder."],
        "source": "instagram", "board": None
    },
    {
        "name": "Instant Microwave Dhokla",
        "type": "Snack", "time": "15 mins", "emoji": "🟡",
        "ingredients": ["1 cup semolina (suji)", "1 cup yogurt", "1 cup water", "salt to taste", "1 tsp baking soda", "black pepper and red chilli powder", "1 tbsp oil", "1 tsp mustard seeds", "1 tsp sesame seeds", "curry leaves", "2 green chillies", "cilantro"],
        "steps": ["Mix suji, yogurt, water and salt. Rest 5 mins.", "Add baking soda, mix well. Transfer to greased microwave-safe dish.", "Sprinkle black pepper and red chilli. Microwave 5 mins.", "Make tempering: heat oil, add mustard seeds, sesame seeds, curry leaves, green chillies.", "Pour tempering over dhokla. Cut, garnish with cilantro."],
        "source": "instagram", "board": None
    },
    {
        "name": "Rajma Chawal High-Protein Jar",
        "type": "Breakfast", "time": "15 mins", "emoji": "🍱",
        "ingredients": ["100g boiled rajma", "100g cooked rice", "100g air-fried low-fat paneer", "some onions", "tomatoes", "cucumber", "100g 0% fat Greek yogurt", "coriander leaves", "1 tsp rajma masala", "cumin powder", "chilli flakes", "salt", "pepper", "squeeze of lime"],
        "steps": ["Layer rajma in a jar.", "Add cooked rice.", "Top with air-fried paneer.", "Add onions, tomatoes, cucumber.", "Spoon Greek yogurt on top.", "Sprinkle rajma masala, cumin, chilli flakes, salt, pepper. Finish with lime."],
        "source": "instagram", "board": None
    },
    {
        "name": "Hormone Balancing Chocolate Fudge (Seed Cycling)",
        "type": "Dessert", "time": "20 mins", "emoji": "🍫",
        "ingredients": ["1/4 cup raw pumpkin seeds", "1/4 cup raw flax seeds", "2 tbsp fennel seeds", "cardamom seeds from 1 pod", "5-6 dates for binding", "1/2 tsp cocoa for dusting"],
        "steps": ["Roast all seeds properly.", "Blend into fine powder.", "Add dates and blend into paste-like mixture.", "Shape into small fudge pieces.", "Dust with cocoa.", "Refrigerate up to 15 days. Have 2 pieces daily."],
        "source": "instagram", "board": None
    },
    {
        "name": "Eggless Almond Date Cookies",
        "type": "Dessert", "time": "25 mins", "emoji": "🍪",
        "ingredients": ["1 cup almond flour or roasted almonds", "1 cup pitted soft dates", "1/2 tsp cardamom powder"],
        "steps": ["Process almonds into flour if using whole almonds.", "Blend dates into a paste.", "Mix almond flour, date paste, cardamom until dough forms.", "Shape into cookies.", "Bake in preheated oven at 160°C (320°F) for 10-12 minutes.", "Cool completely before serving."],
        "source": "instagram", "board": None
    },
    {
        "name": "Jain Chili Oil",
        "type": "Snack", "time": "10 mins", "emoji": "🌶️",
        "ingredients": ["handful finely chopped cilantro", "1 tbsp sesame seeds", "1 tsp chilli flakes", "3/4 tsp dry ginger powder", "1 tsp Kashmiri red chilli powder", "1/2 tsp black pepper", "1/3 cup hot sizzling oil", "salt"],
        "steps": ["Add cilantro, sesame seeds, chilli flakes, ginger powder, Kashmiri chilli, black pepper, salt to a heatproof bowl.", "Heat oil until very hot (sizzling).", "Pour hot oil over the ingredients immediately.", "Mix well. Use as needed on dal rice, momos, wraps."],
        "source": "instagram", "board": None
    },
]

def get_existing():
    res = requests.get(
        f"{SUPABASE_URL}/rest/v1/recipes?select=id,name&order=id.desc&limit=200",
        headers=HEADERS
    )
    if res.status_code == 200:
        data = res.json()
        names = {r["name"] for r in data}
        max_id = max((r["id"] for r in data), default=0)
        return names, max_id
    return set(), 0

def save_recipes():
    existing_names, max_id = get_existing()
    next_id = max_id + 1
    print(f"Found {len(existing_names)} existing recipes. Next ID: {next_id}")

    imported, skipped, failed = 0, 0, 0

    for i, recipe in enumerate(RECIPES):
        if recipe["name"] in existing_names:
            print(f"  SKIP: {recipe['name']}")
            skipped += 1
            continue

        payload = {
            "id": next_id,
            "name": recipe["name"],
            "type": recipe["type"],
            "time": int(recipe["time"].split()[0]),
            "emoji": recipe["emoji"],
            "ingredients": recipe["ingredients"],
            "steps": recipe["steps"],
            "source": recipe["source"],
            "board": recipe["board"]
        }

        res = requests.post(
            f"{SUPABASE_URL}/rest/v1/recipes",
            headers=HEADERS,
            json=payload
        )

        if res.status_code in (200, 201):
            print(f"  SAVED: {recipe['name']}")
            imported += 1
            next_id += 1
        else:
            print(f"  FAIL: {recipe['name']} -> {res.status_code}: {res.text[:100]}")
            failed += 1

    print(f"\n{'='*40}")
    print(f"✅ {imported} imported | ⏭️ {skipped} skipped | ❌ {failed} failed")

if __name__ == "__main__":
    save_recipes()
