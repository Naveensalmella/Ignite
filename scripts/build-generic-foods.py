"""Pick plain, generic foods from USDA SR Legacy and give them short, friendly names.

Source: the `tempo-food-db` npm package (TempoLife, CC-BY-4.0), whose `usda_sr_legacy` rows are
USDA FoodData Central SR Legacy data (public domain). Only those USDA rows are used.

Usage:
  npm pack tempo-food-db@1.0.0 && tar xzf tempo-food-db-1.0.0.tgz
  python3 scripts/build-generic-foods.py package/data/tempolife-foods.json src/data/foodsGeneric.json

Output: [[name, emoji, kcal, protein, carbs, fat, fiber, category], ...] — values per 100 g."""
import json, re, sys

SRC = sys.argv[1]
OUT = sys.argv[2]
rows = [x for x in json.load(open(SRC)) if x.get('source') == 'usda_sr_legacy']
BRAND = re.compile(r"[A-Z]{3,}|'s\b")
SKIP = re.compile(r"babyfood|infant|fast food|restaurant|school|formulated|imitation|substitute|dehydrated|powder|frozen|canned|"
                  r"concentrate|with salt\b|salted|sulfured|mix\b|dry mix|unprepared|industrial|commercial|pickled|"
                  r"hydrogenated|lowfat|low fat|reduced|nonfat|fat free|light\b|low sodium|enriched|unenriched|"
                  r"australian|new zealand|imported|wagyu|select\b|choice\b|composite|trimmed to|separable fat|"
                  r"giblets|liver|kidney|heart|brain|tongue|skin only|neck|back\b|wing tip|by-product|mechanically|"
                  r"alaska native|northern plains|shoshone|apache|hopi|navajo|yellowstone|ojibwe|chinook", re.I)

def sing(w):
    w = w.strip()
    for a, b in (("ies", "y"), ("oes", "o"), ("ches", "ch"), ("shes", "sh")):
        if w.lower().endswith(a) and len(w) > 4: return w[:-len(a)] + b
    if w.endswith("s") and not w.endswith(("ss", "us", "is")) and len(w) > 3: return w[:-1]
    return w

RENAME = {"Leave": "Leaves", "Litchis": "Lychee", "Hazelnuts Or Filberts": "Hazelnuts", "Pumpkin And Squash Seeds": "Pumpkin Seeds",
          "Java-plum": "Jamun (Java Plum)", "Sapodilla": "Chikoo (Sapodilla)", "Sugar-apple": "Sitaphal (Custard Apple)", "Pummelo": "Pomelo",
          "Drumstick Pod": "Drumstick (Moringa Pod)", "Drumstick Leave": "Moringa Leaves", "Water Convolvulus": "Water Spinach", "Okra": "Okra (Bhindi)",
          "Eggplant": "Brinjal / Eggplant", "Amaranth Leave": "Amaranth Leaves (Chaulai)", "Cashew Nuts": "Cashews", "Pistachio Nuts": "Pistachios"}
def title(s):
    t = " ".join(p[:1].upper() + p[1:] for p in s.split())
    for a, b in RENAME.items():
        if t == a or t.startswith(a + " "): t = b + t[len(a):]
    return t.replace("Leave ", "Leaves ").replace("Leave (", "Leaves (")

PICK = []   # (name, emoji, category, row)
seen = set()
def add(name, emoji, cat, r):
    key = name.lower()
    if key in seen: return
    seen.add(key)
    PICK.append((name, emoji, cat, r))

def by(pattern, cat_hint=None):
    rx = re.compile(pattern, re.I)
    return [r for r in rows if rx.search(r['name']) and (cat_hint is None or r['category'] == cat_hint) and not BRAND.search(r['name'])]

FRUIT_EMOJI = {"apple": "🍎", "apricot": "🍑", "banana": "🍌", "blueberr": "🫐", "cherr": "🍒", "grape": "🍇", "lemon": "🍋", "lime": "🍋",
               "mango": "🥭", "melon": "🍈", "orange": "🍊", "peach": "🍑", "pear": "🍐", "pineapple": "🍍", "strawberr": "🍓", "kiwi": "🥝",
               "coconut": "🥥", "tangerine": "🍊", "watermelon": "🍉", "plum": "🍑", "avocado": "🥑"}
def fruit_emoji(n):
    for k, e in FRUIT_EMOJI.items():
        if k in n.lower(): return e
    return "🍏"

# Fruits: "Xs, raw" (first word group before ", raw")
for r in rows:
    if r['category'] != 'Puuviljad ja marjad' or BRAND.search(r['name']) or SKIP.search(r['name']): continue
    m = re.match(r"^([A-Za-z\- ]+?)(?:, \(([^)]+)\))?, raw\b", r['name'])
    if m and 'juice' not in r['name'].lower():
        add(title(sing(m.group(1))), fruit_emoji(m.group(1)), "Fruits", r)
for pat, nm in [(r"^Raisins, dark, seedless", "Raisins (Dark)"), (r"^Dates, deglet noor", "Dates (Deglet Noor)"), (r"^Figs, dried, uncooked", "Figs (Dried)"),
                (r"^Apricots, dried, sulfured, uncooked", None), (r"^Prunes, dried, uncooked", "Prunes"), (r"^Cranberries, dried, sweetened", "Cranberries (Dried)")]:
    for r in by(pat):
        if nm: add(nm, "🍇", "Fruits", r); break
for pat, nm in [(r"^Orange juice, raw", "Orange Juice (Fresh)"), (r"^Apple juice, canned or bottled, unsweetened, without", "Apple Juice"),
                (r"^Grape juice, canned or bottled, unsweetened, without", "Grape Juice"), (r"^Pineapple juice, canned or bottled, unsweetened, without", "Pineapple Juice"),
                (r"^Pomegranate juice", "Pomegranate Juice"), (r"^Carrot juice, canned", "Carrot Juice"), (r"^Tomato juice, canned, without salt", "Tomato Juice")]:
    for r in by(pat): add(nm, "🧃", "Drinks", r); break

# Vegetables: raw and boiled
for r in rows:
    if r['category'] not in ('Köögivili', 'Kartulid ja mugulad') or BRAND.search(r['name']): continue
    n = r['name']
    m = re.match(r"^([A-Za-z\- ]+?)(?:, ([a-z ]+))?, (raw|cooked, boiled, drained, without salt)$", n)
    if not m or SKIP.search(n.replace("without salt", "")): continue
    base = title(sing(m.group(1)))
    variety = m.group(2)
    if variety and len(variety) < 18 and variety not in ("mature seeds", "immature seeds", "green", "red", "yellow", "white"): continue
    if variety in ("green", "red", "yellow", "white"): base = f"{base} ({title(variety)})"
    how = "Raw" if m.group(3) == "raw" else "Boiled"
    add(f"{base} ({how})" if "(" not in base else f"{base[:-1]}, {how})", "🥦", "Vegetables", r)

# Nuts & seeds
for r in rows:
    if r['category'] != 'Pähklid ja seemned' or BRAND.search(r['name']) or SKIP.search(r['name']): continue
    m = re.match(r"^(?:Nuts|Seeds), ([a-z ]+?)(?:, (raw|dried|dry roasted, without salt added|whole, dried))?$", r['name'])
    if m: add(title(m.group(1).replace(" kernels", "").replace("seed", "seeds").replace("seedss", "seeds")), "🥜", "Nuts", r)
for pat, nm in [(r"^Nuts, almond butter, plain, without salt", "Almond Butter"), (r"^Peanut butter, smooth style, without salt", "Peanut Butter (Smooth)"),
                (r"^Peanuts, all types, dry-roasted, without salt", "Peanuts (Roasted)"), (r"^Tahini|^Seeds, sesame butter, tahini", "Tahini")]:
    for r in by(pat): add(nm, "🥜", "Nuts", r); break

# Legumes (boiled), soy
for r in rows:
    n = r['name']
    if BRAND.search(n): continue
    m = re.match(r"^(Beans|Chickpeas \(garbanzo beans, bengal gram\)|Lentils|Peas|Cowpeas|Mung beans|Soybeans|Pigeon peas \(red gram\)|Broadbeans \(fava beans\)|Hyacinth beans|Lima beans)(?:, ([a-z ()]+?))?, mature seeds?, cooked, boiled, without salt$", n)
    if m:
        kind = m.group(2) or ""
        base = {"Chickpeas (garbanzo beans, bengal gram)": "Chickpeas (Kabuli Chana)", "Pigeon peas (red gram)": "Pigeon Peas (Toor)",
                "Broadbeans (fava beans)": "Fava Beans", "Mung beans": "Moong Beans", "Cowpeas": "Cowpeas (Lobia)"}.get(m.group(1), m.group(1))
        name = f"{title(kind)} {base}".strip() if kind and m.group(1) == "Beans" else (f"{base} ({title(kind)})" if kind else base)
        add(f"{name} (Boiled)", "🫘", "Legumes", r)
for pat, nm in [(r"^Tofu, raw, firm, prepared with calcium sulfate$", "Tofu (Firm)"), (r"^Tempeh$", "Tempeh"), (r"^Edamame, frozen, prepared", "Edamame"),
                (r"^Hummus, home prepared", "Hummus"), (r"^Soymilk, original and vanilla, unfortified", "Soy Milk (Unsweetened)")]:
    for r in by(pat): add(nm, "🫘", "Legumes", r); break

# Grains & cereals (cooked)
for pat, nm, e in [(r"^Rice, white, long-grain, regular, cooked", "Rice, White Long-Grain (Cooked)", "🍚"), (r"^Rice, brown, long-grain, cooked", "Rice, Brown (Cooked)", "🍚"),
                   (r"^Rice, white, glutinous, cooked", "Sticky Rice (Cooked)", "🍚"), (r"^Wild rice, cooked", "Wild Rice (Cooked)", "🍚"),
                   (r"^Quinoa, cooked", "Quinoa (Cooked)", "🌾"), (r"^Couscous, cooked", "Couscous (Cooked)", "🌾"), (r"^Bulgur, cooked", "Bulgur (Cooked)", "🌾"),
                   (r"^Barley, pearled, cooked", "Barley (Cooked)", "🌾"), (r"^Millet, cooked", "Millet (Cooked)", "🌾"), (r"^Buckwheat groats, roasted, cooked", "Buckwheat (Cooked)", "🌾"),
                   (r"^Amaranth grain, cooked", "Amaranth (Cooked)", "🌾"), (r"^Pasta, cooked, enriched, without added salt", "Pasta (Cooked)", "🍝"),
                   (r"^Pasta, whole-wheat, cooked", "Whole Wheat Pasta (Cooked)", "🍝"), (r"^Noodles, egg, cooked, enriched, without", "Egg Noodles (Cooked)", "🍜"),
                   (r"^Rice noodles, cooked", "Rice Noodles (Cooked)", "🍜"), (r"^Cereals, oats, regular and quick, cooked with water, without salt", "Oatmeal (Cooked with Water)", "🥣"),
                   (r"^Oats$|^Cereals, oats, regular and quick, not fortified, dry", "Oats (Dry)", "🥣"), (r"^Wheat flour, whole-grain", "Whole Wheat Flour (Atta)", "🌾"),
                   (r"^Wheat flour, white, all-purpose, enriched, bleached", "All-Purpose Flour (Maida)", "🌾"), (r"^Chickpea flour \(besan\)", "Chickpea Flour (Besan)", "🌾"),
                   (r"^Semolina, enriched", "Semolina (Sooji, Dry)", "🌾"), (r"^Rice flour, white", "Rice Flour", "🌾"), (r"^Cornmeal, whole-grain, yellow", "Cornmeal", "🌽"),
                   (r"^Tortillas, ready-to-bake or -fry, flour", "Flour Tortilla", "🫓"), (r"^Bagels, plain, enriched", "Bagel (Plain)", "🥯"),
                   (r"^Bread, multi-grain \(includes whole-grain\)$", "Multigrain Bread", "🍞"), (r"^Bread, pita, white, enriched", "Pita Bread", "🫓"),
                   (r"^Granola, homemade|^Cereals ready-to-eat, granola, homemade", "Granola", "🥣"), (r"^Crackers, saltines", "Saltine Crackers", "🍘"),
                   (r"^Rice cake, cracker", "Rice Cakes", "🍘"), (r"^Pancakes, plain, prepared from recipe", "Pancake", "🥞"), (r"^Waffles, plain, prepared from recipe", "Waffle", "🧇")]:
    for r in by(pat): add(nm, e, "Grains", r); break

# Eggs
for pat, nm in [(r"^Egg, whole, raw, fresh", "Egg (Raw)"), (r"^Egg, whole, cooked, poached", "Egg (Poached)"), (r"^Egg, whole, cooked, scrambled", "Egg (Scrambled)"),
                (r"^Egg, white, raw, fresh", "Egg White (Raw)"), (r"^Egg, yolk, raw, fresh", "Egg Yolk"), (r"^Egg, duck, whole, fresh, raw", "Duck Egg"), (r"^Egg, quail, whole, fresh, raw", "Quail Egg")]:
    for r in by(pat): add(nm, "🥚", "Protein", r); break

# Meat & poultry (cooked)
for pat, nm, e in [(r"^Chicken, broilers or fryers, breast, meat only, cooked, roasted", "Chicken Breast (Roasted)", "🍗"),
                   (r"^Chicken, broilers or fryers, thigh, meat only, cooked, roasted", "Chicken Thigh (Roasted)", "🍗"),
                   (r"^Chicken, broilers or fryers, drumstick, meat only, cooked, roasted", "Chicken Drumstick (Roasted)", "🍗"),
                   (r"^Chicken, broilers or fryers, wing, meat and skin, cooked, roasted", "Chicken Wing (Roasted)", "🍗"),
                   (r"^Chicken, ground, crumbles, cooked, pan-browned", "Chicken Mince (Cooked)", "🍗"),
                   (r"^Turkey, whole, breast, meat only, cooked, roasted", "Turkey Breast (Roasted)", "🦃"),
                   (r"^Beef, ground, 85% lean meat / 15% fat, patty, cooked, broiled", "Beef Mince 85% Lean (Cooked)", "🥩"),
                   (r"^Beef, ground, 95% lean meat / 5% fat, patty, cooked, broiled", "Beef Mince 95% Lean (Cooked)", "🥩"),
                   (r"^Beef, top sirloin, steak, separable lean only, trimmed to 1/8\" fat, all grades, cooked, broiled", "Beef Sirloin Steak (Cooked)", "🥩"),
                   (r"^Pork, fresh, loin, tenderloin, separable lean only, cooked, roasted", "Pork Tenderloin (Roasted)", "🥓"),
                   (r"^Lamb, ground, cooked, broiled", "Lamb Mince (Cooked)", "🍖"), (r"^Lamb, domestic, leg, whole \(shank and sirloin\), separable lean only, trimmed to 1/4\" fat, choice, cooked, roasted", "Lamb Leg (Roasted)", "🍖"),
                   (r"^Goat, cooked, roasted", "Goat Meat (Roasted)", "🍖"), (r"^Ham, sliced, regular", "Ham (Sliced)", "🥓"),
                   (r"^Pork, cured, bacon, cooked, pan-fried|^Pork, cured, bacon, unprepared", "Bacon", "🥓"), (r"^Sausage, pork, cooked|^Pork sausage, fresh, cooked", "Pork Sausage (Cooked)", "🌭"),
                   (r"^Frankfurter, chicken", "Chicken Sausage / Hot Dog", "🌭")]:
    for r in by(pat): add(nm, e, "Non-Veg", r); break

# Fish & seafood (cooked)
for r in rows:
    n = r['name']
    m = re.match(r"^Fish, ([a-z ]+?)(?:, ([a-z ]+?))?, cooked, dry heat$", n)
    if m and not BRAND.search(n) and not SKIP.search(n):
        kind = m.group(1) + (f" ({m.group(2)})" if m.group(2) and m.group(2) not in ("mixed species",) else "")
        add(f"{title(kind)} (Cooked)", "🐟", "Fish & Seafood", r)
for pat, nm in [(r"^Fish, tuna, light, canned in water, drained solids$", "Tuna (Canned in Water)"), (r"^Fish, salmon, pink, canned, drained solids$", "Salmon (Canned)"),
                (r"^Fish, sardine, Atlantic, canned in oil, drained solids with bone", "Sardines (Canned in Oil)"), (r"^Crustaceans, shrimp, cooked$", "Shrimp (Cooked)"),
                (r"^Crustaceans, crab, blue, cooked, moist heat", "Crab (Cooked)"), (r"^Crustaceans, lobster, northern, cooked, moist heat", "Lobster (Cooked)"),
                (r"^Mollusks, squid, mixed species, cooked, fried", "Squid (Fried)"), (r"^Mollusks, mussel, blue, cooked, moist heat", "Mussels (Cooked)"),
                (r"^Mollusks, oyster, eastern, cooked, breaded and fried", "Oysters (Fried)")]:
    for r in by(pat): add(nm, "🦐", "Fish & Seafood", r); break

# Dairy
for r in rows:
    n = r['name']
    if r['category'] != 'Piimatooted' or BRAND.search(n) or SKIP.search(n): continue
    m = re.match(r"^Cheese, ([a-z ]+)$", n)
    if m: add(f"Cheese ({title(m.group(1))})", "🧀", "Dairy", r)
for pat, nm, e in [(r"^Milk, whole, 3.25% milkfat, with added vitamin D", "Milk, Whole 3.25%", "🥛"), (r"^Milk, reduced fat, fluid, 2% milkfat, with added vitamin A and vitamin D", "Milk, 2% Fat", "🥛"),
                   (r"^Milk, nonfat, fluid, with added vitamin A and vitamin D", "Milk, Skim", "🥛"), (r"^Milk, buttermilk, fluid, cultured, lowfat", "Buttermilk (Cultured)", "🥛"),
                   (r"^Yogurt, plain, whole milk", "Yogurt (Plain, Whole Milk)", "🥣"), (r"^Yogurt, Greek, plain, nonfat", "Greek Yogurt (Nonfat)", "🥣"),
                   (r"^Yogurt, Greek, plain, whole milk", "Greek Yogurt (Whole Milk)", "🥣"), (r"^Cheese, cottage, creamed, large or small curd", "Cottage Cheese", "🧀"),
                   (r"^Cheese, mozzarella, whole milk$", "Mozzarella", "🧀"), (r"^Cheese, parmesan, grated$", "Parmesan (Grated)", "🧀"), (r"^Cheese, cream$", "Cream Cheese", "🧀"),
                   (r"^Cream, fluid, heavy whipping", "Heavy Cream", "🥛"), (r"^Cream, sour, cultured", "Sour Cream", "🥛"), (r"^Butter, without salt", "Butter (Unsalted)", "🧈"),
                   (r"^Butter, Clarified butter \(ghee\)", "Ghee (Clarified Butter)", "🧈"), (r"^Milk, canned, condensed, sweetened", "Condensed Milk", "🥛"),
                   (r"^Milk, dry, whole", "Milk Powder (Whole)", "🥛"), (r"^Ice creams, vanilla$", "Vanilla Ice Cream", "🍨"), (r"^Ice creams, chocolate$", "Chocolate Ice Cream", "🍨"),
                   (r"^Frozen yogurts, vanilla", "Frozen Yogurt", "🍦"), (r"^Whey protein powder isolate|^Beverages, Whey protein powder isolate", "Whey Isolate", "🥤")]:
    for r in by(pat): add(nm, e, "Dairy", r); break

# Oils, sweeteners, condiments
for pat, nm, e in [(r"^Oil, olive, salad or cooking", "Olive Oil", "🫒"), (r"^Oil, coconut$", "Coconut Oil", "🥥"), (r"^Oil, sunflower, linoleic \(less than 60%\)", "Sunflower Oil", "🌻"),
                   (r"^Oil, mustard", "Mustard Oil", "🫒"), (r"^Oil, peanut, salad or cooking", "Groundnut Oil", "🥜"), (r"^Oil, sesame, salad or cooking", "Sesame Oil", "🫒"),
                   (r"^Mayonnaise, regular|^Salad dressing, mayonnaise, regular", "Mayonnaise", "🥫"), (r"^Catsup$", "Ketchup", "🍅"), (r"^Sauce, pasta, spaghetti/marinara, ready-to-serve$", "Marinara Sauce", "🍅"),
                   (r"^Soy sauce made from soy \(tamari\)|^Soy sauce", "Soy Sauce", "🥢"), (r"^Jams and preserves$", "Jam", "🍓"), (r"^Syrups, maple", "Maple Syrup", "🍁"),
                   (r"^Sugars, brown$", "Brown Sugar", "🟫"), (r"^Cocoa, dry powder, unsweetened$", "Cocoa Powder", "🍫"), (r"^Chocolate, dark, 70-85% cacao solids", "Dark Chocolate 70-85%", "🍫"),
                   (r"^Candies, milk chocolate$", "Milk Chocolate", "🍫"), (r"^Puddings, chocolate, ready-to-eat", "Chocolate Pudding", "🍮"), (r"^Gelatin desserts, dry mix, prepared with water", "Jelly Dessert", "🍮")]:
    for r in by(pat): add(nm, e, "Fats, Sweets & Sauces", r); break

# Drinks
for pat, nm, e in [(r"^Beverages, coffee, brewed, prepared with tap water$", "Coffee (Brewed, Black)", "☕"), (r"^Beverages, coffee, brewed, espresso, restaurant-prepared", "Espresso", "☕"),
                   (r"^Beverages, tea, black, brewed, prepared with tap water$", "Tea (Black, Brewed)", "🍵"), (r"^Beverages, tea, green, brewed, regular", "Green Tea (Brewed)", "🍵"),
                   (r"^Beverages, coconut water, ready-to-drink, unsweetened", "Coconut Water (Packaged)", "🥥"), (r"^Beverages, carbonated, cola, regular|^Carbonated beverage, cola", "Cola", "🥤"),
                   (r"^Beverages, Energy drink|^Beverages, energy drink", "Energy Drink", "⚡"), (r"^Beverages, almond milk, unsweetened", "Almond Milk (Unsweetened)", "🥛"),
                   (r"^Beverages, chocolate malted drink mix|^Beverages, chocolate drink, milk and ice cream", "Chocolate Milkshake", "🥤"),
                   (r"^Alcoholic beverage, wine, table, red", "Red Wine", "🍷"), (r"^Alcoholic beverage, wine, table, white", "White Wine", "🥂"),
                   (r"^Alcoholic beverage, distilled, all \(gin, rum, vodka, whiskey\) 80 proof", "Spirits (Whisky / Vodka / Rum)", "🥃"), (r"^Alcoholic beverage, beer, light$", "Light Beer", "🍺")]:
    for r in by(pat): add(nm, e, "Drinks", r); break

# Bakery & snacks
for pat, nm, e in [(r"^Cookies, chocolate chip, commercially prepared, regular|^Cookies, chocolate chip, prepared from recipe", "Chocolate Chip Cookie", "🍪"),
                   (r"^Cake, chocolate, prepared from recipe without frosting", "Chocolate Cake", "🍰"), (r"^Cheesecake prepared from mix|^Cheesecake commercially prepared", "Cheesecake", "🍰"),
                   (r"^Pie, apple, prepared from recipe", "Apple Pie", "🥧"), (r"^Brownies, prepared from recipe", "Brownie", "🍫"), (r"^Popcorn, air-popped$", "Popcorn (Air-Popped)", "🍿"),
                   (r"^Pretzels, hard, plain, salted", "Pretzels", "🥨"), (r"^Snacks, tortilla chips, plain", "Tortilla Chips", "🌮"), (r"^Snacks, trail mix, regular$", "Trail Mix", "🥜")]:
    for r in by(pat): add(nm, e, "Bakery & Snacks", r); break

# Everyday basics the rules above miss (exact USDA names)
for pat, nm, e, cat in [
    (r"^Chicken, breast, meat only, cooked, roasted$", "Chicken Breast (Roasted, USDA)", "🍗", "Non-Veg"),
    (r"^Chicken, dark meat, thigh, meat only, cooked$", "Chicken Thigh (Cooked)", "🍗", "Non-Veg"),
    (r"^Chicken, dark meat, drumstick, meat only, cooked$", "Chicken Drumstick (Cooked)", "🍗", "Non-Veg"),
    (r"^Chicken, drumstick, meat and skin, cooked, fried", "Fried Chicken (Drumstick)", "🍗", "Non-Veg"),
    (r"^Beef, ground, 80% lean meat / 20% fat, patty, cooked", "Beef Burger Patty (Cooked)", "🥩", "Non-Veg"),
    (r"^Beans, kidney, all types, mature seeds, cooked", "Kidney Beans (Boiled)", "🫘", "Legumes"),
    (r"^Chickpeas \(garbanzo beans, bengal gram\), mature seeds, cooked, boiled", "Chickpeas (Boiled)", "🫘", "Legumes"),
    (r"^Beans, black, mature seeds, cooked, boiled", "Black Beans (Boiled)", "🫘", "Legumes"),
    (r"^Peas, split, mature seeds, cooked, boiled", "Split Peas (Boiled)", "🫘", "Legumes"),
    (r"^Lentils, pink or red, raw", "Masoor / Red Lentils (Raw)", "🫘", "Legumes"),
    (r"^Rice, white, long-grain, cooked without salt", "Rice, White Long-Grain (Cooked)", "🍚", "Grains"),
    (r"^Potatoes, boiled, cooked without skin, flesh, without salt", "Potato (Boiled, USDA)", "🥔", "Vegetables"),
    (r"^Potatoes, baked, flesh and skin, without salt", "Potato (Baked)", "🥔", "Vegetables"),
    (r"^Sweet potato, cooked, boiled, without skin$", "Sweet Potato (Boiled)", "🍠", "Vegetables"),
    (r"^Tomatoes, red, ripe, raw", "Tomato (Red, Raw)", "🍅", "Vegetables"),
    (r"^Cucumber, with peel, raw", "Cucumber (Raw)", "🥒", "Vegetables"),
    (r"^Peppers, sweet, green, raw", "Capsicum / Bell Pepper (Green)", "🫑", "Vegetables"),
    (r"^Peppers, sweet, red, raw", "Bell Pepper (Red)", "🫑", "Vegetables"),
    (r"^Lettuce, iceberg, raw", "Lettuce (Iceberg)", "🥬", "Vegetables"),
    (r"^Lettuce, cos or romaine, raw", "Lettuce (Romaine)", "🥬", "Vegetables"),
    (r"^Beans, snap, green, cooked, boiled", "Green Beans (Boiled)", "🫛", "Vegetables"),
    (r"^Beans, snap, green, raw", "Green Beans (Raw)", "🫛", "Vegetables"),
    (r"^Corn, sweet, yellow, cooked, boiled", "Sweet Corn (Boiled, USDA)", "🌽", "Vegetables"),
    (r"^Squash, summer, zucchini, cooked, boiled", "Zucchini (Boiled)", "🥒", "Vegetables"),
    (r"^Mushrooms, white, cooked, boiled, drained", "Mushrooms (Boiled)", "🍄", "Vegetables"),
    (r"^Gourd, white-flowered \(calabash\), cooked, boiled", "Bottle Gourd / Lauki (Boiled)", "🥒", "Vegetables"),
    (r"^Gourd, dishcloth \(towelgourd\), cooked, boiled", "Ridge Gourd / Turai (Boiled)", "🥒", "Vegetables"),
    (r"^Guavas, common, raw", "Guava (Raw)", "🍈", "Fruits"),
    (r"^Grapes, red or green|^Grapes, american type", "Grapes (Raw)", "🍇", "Fruits"),
    (r"^Cherries, sweet, raw", "Cherries", "🍒", "Fruits"),
    (r"^Peaches, yellow, raw", "Peach", "🍑", "Fruits"),
    (r"^Melons, cantaloupe, raw", "Cantaloupe / Muskmelon", "🍈", "Fruits"),
    (r"^Melons, honeydew, raw", "Honeydew Melon", "🍈", "Fruits"),
    (r"^Fish, cod, Atlantic, cooked, dry heat", "Cod (Cooked)", "🐟", "Fish & Seafood"),
    (r"^Fish, tuna, fresh, bluefin, cooked", "Tuna (Fresh, Cooked)", "🐟", "Fish & Seafood"),
    (r"^Fish, salmon, Atlantic, farmed, cooked", "Salmon, Atlantic Farmed (Cooked)", "🐟", "Fish & Seafood"),
]:
    for r in by(pat): add(nm, e, cat, r); break

out = []
for name, emoji, cat, r in PICK:
    vals = [r['kcal_per_100g'], r['protein_g'], r['carbs_g'], r['fat_g'], r['fiber_g'] or 0]
    if any(v is None for v in vals[:4]): continue
    name = re.sub(r"\bLeave\b", "Leaves", name)
    out.append([name, emoji, round(vals[0]), round(vals[1], 1), round(vals[2], 1), round(vals[3], 1), round(vals[4], 1), cat])
json.dump(out, open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
from collections import Counter
print(len(out), Counter(o[7] for o in out))
