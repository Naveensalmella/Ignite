// ══════════════════════════════════════════════════
// IGNITE — extra Indian & everyday dishes (per 100 g, cooked/as eaten).
// Typical home-style values; real dishes vary with oil, ghee and portion.
// Row format: name | emoji | kcal | protein | carbs | fat | fiber | category | serving | aliases
//   serving = "unit:grams" (one typical piece/katori/plate), aliases separated by ";"
// ══════════════════════════════════════════════════

const ROWS = `
Plain Paratha (Lachha)|🫓|326|6.4|45|13|3.6|Bread|piece:80|lachha paratha
Gobi Paratha|🫓|240|5.5|33|9.5|3.8|Bread|piece:120|gobi parantha
Paneer Paratha|🫓|270|9.5|30|12.5|3|Bread|piece:120|paneer parantha
Methi Paratha|🫓|250|6.5|34|10|4.5|Bread|piece:80|methi thepla
Thepla|🫓|300|7.5|40|12|5|Bread|piece:40|
Missi Roti|🫓|260|9|42|6.5|6|Bread|piece:60|
Makki di Roti|🫓|270|5.5|45|8|4.5|Bread|piece:70|makki roti;makke ki roti
Phulka|🫓|264|8.5|52|2.5|7|Bread|piece:30|fulka
Rumali Roti|🫓|280|8|52|4|2.5|Bread|piece:50|
Tandoori Roti|🫓|290|9|55|3.5|4|Bread|piece:60|
Butter Naan|🫓|330|8.5|48|11.5|2|Bread|piece:90|
Kulcha|🫓|300|8|50|7.5|2|Bread|piece:80|amritsari kulcha
Bread (White)|🍞|265|9|49|3.2|2.7|Bread|slice:25|white bread;bread slice
Bread (Brown / Whole Wheat)|🍞|247|13|41|3.4|7|Bread|slice:28|brown bread;whole wheat bread
Pav|🍞|280|8.5|52|4|2|Bread|piece:40|ladi pav;bun
Appam|🥞|170|3|33|2.5|1|South Indian|piece:60|
Neer Dosa|🥞|150|2.5|31|1.5|0.5|South Indian|piece:50|
Rava Dosa|🥞|220|4|31|9|1|South Indian|piece:100|
Onion Dosa|🥞|190|4|28|7|1.5|South Indian|piece:130|
Set Dosa|🥞|180|4|30|5|1|South Indian|piece:60|
Ghee Roast Dosa|🥞|250|4|30|12.5|1|South Indian|piece:110|
Mysore Masala Dosa|🥞|210|4.5|29|8.5|2|South Indian|piece:180|
Rava Idli|🍥|180|4.5|26|6|1|South Indian|piece:50|
Mini Idli Sambar|🍥|105|3.8|18|2|1.8|South Indian|bowl:200|
Idiyappam|🍜|150|2.5|33|0.6|0.8|South Indian|piece:40|string hoppers
Puttu|🍚|175|3|38|1|2|South Indian|piece:100|
Rava Upma|🍲|150|3.5|22|5|1.5|Breakfast|plate:200|upma
Semiya Upma|🍝|160|3.8|26|4.5|1.5|Breakfast|plate:200|vermicelli upma
Sabudana Khichdi|🍲|190|1.5|34|6|0.8|Breakfast|plate:200|
Ven Pongal|🍲|160|4.5|22|6|1.5|South Indian|bowl:200|khara pongal
Lemon Sevai|🍝|170|3|30|4.5|1|South Indian|plate:200|
Tamarind Rice|🍚|175|3|30|5|1|Rice|plate:250|puliyogare;puliyodarai
Coconut Rice|🍚|185|3|28|7|1.5|Rice|plate:250|
Tomato Rice|🍚|160|3|27|4.5|1|Rice|plate:250|
Bisi Bele Bath|🍲|150|5|22|4.5|2.5|Rice|plate:250|
Egg Fried Rice|🍳|170|5.5|24|5.5|0.8|Rice|plate:250|
Veg Fried Rice|🍚|160|3.5|26|4.5|1|Rice|plate:250|fried rice
Chicken Fried Rice|🍗|185|8.5|24|6|0.8|Rice|plate:250|
Egg Biryani|🥚|165|7|21|6|0.8|Rice|plate:300|
Prawn Biryani|🍤|175|10|21|5.5|0.6|Rice|plate:300|
Paneer Biryani|🥘|190|7|22|8|1|Rice|plate:300|
Mushroom Biryani|🥘|150|4|23|4.5|1.5|Rice|plate:300|
Dum Aloo|🥔|135|2|14|8|2|Curry|bowl:150|
Bhindi Masala|🥬|105|2|9|7|3.5|Vegetables|bowl:150|bhindi fry;okra
Baingan Bharta|🍆|95|2|8|6.5|3.5|Vegetables|bowl:150|baingan;brinjal
Aloo Matar|🥔|110|3|14|5|3|Curry|bowl:150|
Aloo Sabzi|🥔|120|2|16|6|2|Vegetables|bowl:150|potato sabzi;aloo bhaji
Jeera Aloo|🥔|140|2|18|7|2|Vegetables|bowl:150|
Kadai Paneer|🧀|210|10|8|16|1.5|Curry|bowl:150|
Paneer Tikka|🧀|250|16|6|18|1|Protein|plate:150|
Paneer Bhurji|🧀|240|14|6|18|1|Protein|bowl:150|
Shahi Paneer|🧀|230|9|9|18|1|Curry|bowl:150|
Chana Masala|🫘|150|7|19|5|6|Dal|bowl:150|
Kadhi Pakora|🍲|110|3.5|9|7|1|Dal|bowl:200|kadhi
Moong Dal Chilla|🥞|170|9|22|5|4|Breakfast|piece:80|chilla;cheela;besan chilla
Besan Chilla|🥞|200|9|22|8.5|4|Breakfast|piece:80|
Dal Fry|🍲|120|6|15|4|3.5|Dal|bowl:150|
Dal Palak|🍲|105|6|13|3.5|4|Dal|bowl:150|
Lobia Curry|🫘|125|7|17|3.5|5|Dal|bowl:150|black eyed peas
Kala Chana Curry|🫘|140|8|19|4|7|Dal|bowl:150|black chana
Sprouts Salad|🥗|90|6|14|1|4|Healthy|bowl:100|sprout salad
Mix Veg Sabzi|🥦|95|2.5|10|5|3|Vegetables|bowl:150|mixed veg;sabji;sabzi
Cabbage Poriyal|🥬|80|2|8|4.5|3|Vegetables|bowl:100|cabbage thoran;poriyal
Beans Poriyal|🫛|85|2.5|8|5|3.5|Vegetables|bowl:100|beans thoran
Avial|🥥|120|2.5|9|8.5|3.5|Vegetables|bowl:150|aviyal
Palak Sabzi|🥬|80|3|6|5.5|3|Vegetables|bowl:150|spinach sabzi
Lauki Sabzi|🥒|60|1.2|6|3.5|2|Vegetables|bowl:150|bottle gourd;dudhi
Karela Fry|🥒|120|2.5|10|8|3.5|Vegetables|bowl:100|bitter gourd
Rasam|🍲|35|1.2|5|1.2|0.8|South Indian|bowl:200|
Coconut Chutney|🥥|220|2.8|8|20|5|Sides|tbsp:30|chutney
Tomato Chutney|🍅|90|1.5|10|5|2|Sides|tbsp:30|
Mint Chutney|🌿|50|2|7|1.5|3|Sides|tbsp:20|green chutney;pudina chutney
Raita|🥣|65|3|5|3.5|0.5|Sides|bowl:100|boondi raita
Mango Pickle|🥭|190|1|8|17|2|Sides|tsp:10|achar;pickle
Papad|🫓|370|26|60|3|10|Sides|piece:12|papadum
Salad (Green)|🥗|25|1.2|4|0.3|2|Healthy|bowl:100|green salad;kachumber
Chicken Tikka|🍢|175|26|4|6|0.5|Non-Veg|plate:150|
Chicken 65|🍗|240|20|10|13|0.5|Non-Veg|plate:150|
Chicken Kebab|🍢|190|22|4|9.5|0.5|Non-Veg|piece:40|
Chicken Korma|🍗|190|14|6|12|1|Non-Veg|bowl:150|
Kadai Chicken|🍗|170|16|5|9.5|1|Non-Veg|bowl:150|
Chicken Chettinad|🍗|180|16|5|10.5|1.2|Non-Veg|bowl:150|
Chilli Chicken|🌶️|220|16|12|12|1|Non-Veg|plate:150|
Chicken Lollipop|🍗|260|18|10|16|0.5|Non-Veg|piece:50|
Mutton Rogan Josh|🍖|190|15|5|12|1|Non-Veg|bowl:150|rogan josh
Keema|🍖|210|17|5|14|1.5|Non-Veg|bowl:150|mutton keema;keema matar
Fish Fry|🐟|210|20|7|11.5|0.5|Non-Veg|piece:80|
Fish Tikka|🐟|160|22|3|6.5|0.3|Non-Veg|plate:150|
Prawn Curry|🍤|135|14|5|6.5|1|Non-Veg|bowl:150|
Egg Bhurji|🍳|190|12|3|14.5|0.5|Protein|bowl:100|anda bhurji;scrambled egg
Egg (Fried)|🍳|196|13.6|0.8|15|0|Protein|piece:46|fried egg;egg fry
Egg Whites (Boiled)|🥚|52|11|0.7|0.2|0|Protein|piece:33|egg white
Masala Omelette|🍳|180|11|3|13.5|0.6|Protein|piece:100|
Chicken Sandwich|🥪|230|13|25|8.5|2|Fast Food|piece:150|
Veg Sandwich|🥪|200|6|30|6|3|Fast Food|piece:150|sandwich
Grilled Cheese Sandwich|🥪|310|11|30|16|1.5|Fast Food|piece:130|
Veg Burger|🍔|240|7|33|9|3|Fast Food|piece:150|burger
Chicken Burger|🍔|260|14|26|11|1.5|Fast Food|piece:180|
Pizza (Margherita)|🍕|265|11|33|10|2|Fast Food|slice:100|pizza
Pizza (Chicken)|🍕|270|13|30|11|2|Fast Food|slice:110|
French Fries|🍟|312|3.4|41|15|3.8|Fast Food|plate:115|fries;chips
Veg Noodles|🍜|175|4|26|6|1.5|Fast Food|plate:250|chowmein;hakka noodles;noodles
Chicken Noodles|🍜|185|8.5|24|6.5|1.2|Fast Food|plate:250|chicken chowmein
Maggi Noodles (Cooked)|🍜|145|3.5|20|5.5|1|Fast Food|plate:200|maggi;instant noodles
Pasta (White Sauce)|🍝|190|6|24|7.5|1.2|Fast Food|plate:250|
Pasta (Red Sauce)|🍝|150|5|25|3.5|2|Fast Food|plate:250|pasta
Veg Momos (Steamed)|🥟|170|5|28|4|2|Street Food|piece:30|momos;veg momos
Chicken Momos (Steamed)|🥟|190|10|22|7|1|Street Food|piece:30|chicken momos
Spring Roll|🥢|240|5|28|12|2|Street Food|piece:60|
Kathi Roll (Paneer / Chicken)|🌯|230|9.5|26|10|2|Street Food|piece:180|kathi roll;kati roll;frankie;chicken roll;paneer roll
Pani Puri|🫓|180|3.5|27|6.5|2.5|Street Food|plate:120|golgappa;puchka
Bhel Puri|🥗|200|5|32|6|3|Street Food|plate:150|bhel
Sev Puri|🫓|290|6|36|14|3|Street Food|plate:120|
Dahi Puri|🫓|220|5|30|9|2|Street Food|plate:150|
Aloo Tikki|🥔|200|3.5|26|9|2.5|Street Food|piece:70|
Kachori|🥟|420|8|45|23|4|Street Food|piece:60|
Dhokla|🍰|160|6|24|4.5|2|Snacks|piece:40|khaman
Khandvi|🍥|170|6.5|18|8|2|Snacks|piece:20|
Bread Pakora|🍞|300|7|32|16|2.5|Snacks|piece:80|
Onion Pakoda|🧅|330|6.5|32|20|4|Snacks|piece:20|onion bhaji;pakoda
Mirchi Bajji|🌶️|260|5|26|15|3|Snacks|piece:40|bajji
Masala Vada|🍩|330|12|35|16|7|Snacks|piece:35|paruppu vada
Banana Chips|🍌|520|2.3|58|34|7.7|Snacks|handful:30|
Namkeen Mixture|🥜|520|13|45|32|6|Snacks|handful:30|mixture;namkeen;chivda
Roasted Chana|🫘|370|20|60|5|17|Snacks|handful:30|bhuna chana
Makhana (Roasted)|🍿|380|9.7|77|0.6|14|Snacks|bowl:25|fox nuts;makhana
Popcorn|🍿|390|12|78|4.5|15|Snacks|bowl:20|
Biscuits (Marie)|🍪|440|7.5|76|12|2|Snacks|piece:7|marie;biscuit
Digestive Biscuits|🍪|480|7|65|21|3.5|Snacks|piece:15|digestive
Rusk|🍞|410|11|74|7.5|3|Snacks|piece:12|toast rusk
Potato Chips|🥔|536|7|53|35|4.4|Snacks|pack:50|lays;wafers
Cornflakes|🥣|375|7.5|84|0.9|3|Breakfast|bowl:30|corn flakes
Oats (Cooked with Milk)|🥣|105|4.5|14|3.5|1.6|Breakfast|bowl:250|oats with milk
Bread Omelette|🍳|230|11|20|11|1.5|Breakfast|plate:150|
Toast with Butter|🍞|340|7.5|44|15|2.5|Breakfast|slice:30|butter toast
Masala Poha|🍲|180|3.5|30|5.5|1.5|Breakfast|plate:200|
Idli Sambar|🍥|110|4|20|1.8|2|Breakfast|plate:250|
Puri Bhaji|🫓|240|4.5|28|12.5|2.5|Breakfast|plate:200|poori bhaji
Chole Bhature|🫓|260|7.5|30|12.5|4.5|Street Food|plate:350|chole bhature
Rajma Chawal|🍛|135|5|23|2.5|3.5|Rice|plate:350|rajma rice
Dal Chawal|🍛|125|4.5|23|1.8|2|Rice|plate:350|dal rice
Curd Chawal|🍛|125|3.8|21|2.8|0.3|Rice|plate:300|
Thali (Veg)|🍱|150|4.5|21|5.5|2.5|Rice|plate:600|veg thali;meals
Thali (Non-Veg)|🍱|165|8|19|6.5|1.8|Rice|plate:650|non veg thali
Rasgulla|🍥|186|4|40|1.8|0|Sweets|piece:50|rasagola
Rasmalai|🍮|250|7|30|11|0|Sweets|piece:60|
Kaju Katli|🍬|470|9|58|23|1.5|Sweets|piece:15|kaju barfi
Besan Ladoo|🟡|500|9|52|29|3|Sweets|piece:35|ladoo;laddu
Motichoor Ladoo|🟠|430|5|60|19|1|Sweets|piece:35|boondi ladoo
Barfi|🍬|430|8|55|20|0.5|Sweets|piece:30|milk barfi
Mysore Pak|🍬|560|5|50|38|1|Sweets|piece:30|
Payasam|🍮|180|4.5|28|6|0.5|Sweets|bowl:150|semiya payasam
Gajar Halwa|🥕|260|5|32|13|2|Sweets|bowl:100|carrot halwa
Sooji Halwa|🍮|340|4|46|16|1|Sweets|bowl:100|sheera;rava kesari;kesari
Shrikhand|🍮|260|6|38|9|0|Sweets|bowl:100|
Kulfi|🍦|240|6|28|12|0|Sweets|piece:70|
Ice Cream (Vanilla)|🍨|207|3.5|24|11|0.7|Sweets|scoop:65|ice cream
Chocolate (Milk)|🍫|535|7.7|59|30|3.4|Sweets|piece:10|chocolate;dairy milk
Dark Chocolate|🍫|600|7.8|46|43|11|Sweets|piece:10|
Cake (Sponge)|🍰|350|5.5|52|13|0.8|Bakery|slice:60|cake
Muffin|🧁|390|5.5|52|18|1.5|Bakery|piece:70|cupcake
Cookies|🍪|480|5.5|66|22|2|Bakery|piece:12|cookie
Croissant|🥐|406|8|45|21|2.6|Bakery|piece:60|
Doughnut|🍩|420|5|50|23|1.5|Bakery|piece:60|donut
Masala Chai|☕|65|2.4|8.5|2.5|0|Drinks|cup:150|chai;tea
Black Coffee|☕|2|0.3|0|0|0|Drinks|cup:200|black coffee;americano
Filter Coffee|☕|70|2.4|8.5|3|0|Drinks|cup:150|south indian coffee
Cold Coffee|🧋|95|3|13|3.5|0|Drinks|glass:250|
Badam Milk|🥛|110|4|14|4.5|0.5|Drinks|glass:250|
Turmeric Milk|🥛|75|3.3|7|3.8|0.2|Drinks|glass:250|haldi doodh
Milk (Toned)|🥛|58|3.1|4.7|3|0|Dairy|glass:250|toned milk;milk
Milk (Skimmed)|🥛|35|3.4|5|0.1|0|Dairy|glass:250|skimmed milk;skim milk
Mango Lassi|🥭|110|2.8|19|2.5|0.5|Drinks|glass:250|
Salted Lassi|🥛|50|2.8|4|2.5|0|Drinks|glass:250|namkeen lassi
Fresh Lime Soda|🍋|40|0.1|10|0|0|Drinks|glass:250|nimbu soda;lime soda
Nimbu Pani|🍋|35|0.1|9|0|0|Drinks|glass:250|lemonade;shikanji
Sugarcane Juice|🥤|70|0|18|0|0|Drinks|glass:250|ganne ka ras
Orange Juice|🍊|45|0.7|10.4|0.2|0.2|Drinks|glass:250|
Mango Shake|🥭|120|3|20|3|0.8|Drinks|glass:250|
Banana Shake|🍌|105|3.2|18|2.5|1|Drinks|glass:250|banana milkshake
Soft Drink (Cola)|🥤|42|0|10.6|0|0|Drinks|can:330|coke;pepsi;cola;soda
Beer|🍺|43|0.5|3.6|0|0|Drinks|glass:330|
Chikki|🥜|480|12|60|22|4|Sweets|piece:25|peanut chikki
Jaggery|🟫|383|0.4|98|0.1|0|Healthy|tsp:10|gur
Sugar|🧂|387|0|100|0|0|Healthy|tsp:5|
Butter|🧈|717|0.9|0.1|81|0|Dairy|tsp:5|
Cooking Oil|🫒|884|0|0|100|0|Healthy|tsp:5|oil;sunflower oil;mustard oil
Coconut (Fresh)|🥥|354|3.3|15|33|9|Fruits|piece:30|coconut
Paneer (Low Fat)|🧀|200|20|4|11|0|Protein|piece:100|
Chicken Leg (Curry Cut)|🍗|215|20|0|15|0|Non-Veg|piece:90|chicken leg
Mutton (Cooked)|🍖|258|25|0|17|0|Non-Veg|piece:60|lamb;goat meat
Sardines (Mathi)|🐟|210|25|0|11.5|0|Non-Veg|piece:40|mathi;chaala
Pomfret (Fried)|🐟|220|19|6|13|0.3|Non-Veg|piece:100|pomfret
Chicken Soup|🍲|45|4|4|1.5|0.3|Non-Veg|bowl:250|
Tomato Soup|🍅|60|1.5|9|2|1.2|Vegetables|bowl:250|
Sweet Corn (Boiled)|🌽|96|3.4|21|1.5|2.4|Vegetables|cup:150|corn;bhutta
Green Peas (Boiled)|🫛|84|5.4|15.6|0.2|5.5|Vegetables|cup:150|matar;peas
Mushroom (Cooked)|🍄|28|2.2|5.3|0.5|2.2|Vegetables|cup:150|mushroom
Onion|🧅|40|1.1|9.3|0.1|1.7|Vegetables|piece:110|
Muskmelon|🍈|34|0.8|8.2|0.2|0.9|Fruits|cup:160|kharbuja
Pineapple|🍍|50|0.5|13|0.1|1.4|Fruits|cup:165|
Chikoo|🟤|83|0.4|20|1.1|5.3|Fruits|piece:100|sapota;sapodilla
Jamun|🫐|60|0.7|15.6|0.2|0.6|Fruits|cup:100|java plum
Lychee|🍒|66|0.8|16.5|0.4|1.3|Fruits|piece:10|litchi
Custard Apple|🍏|94|2.1|23.6|0.3|4.4|Fruits|piece:150|sitaphal
Pear|🍐|57|0.4|15|0.1|3.1|Fruits|piece:180|
Kiwi|🥝|61|1.1|14.7|0.5|3|Fruits|piece:75|
Strawberries|🍓|32|0.7|7.7|0.3|2|Fruits|cup:150|strawberry
Raisins|🍇|299|3.1|79|0.5|3.7|Nuts|handful:30|kishmish
Pistachios|🥜|560|20|28|45|10.6|Nuts|handful:30|pista
Flax Seeds|🌾|534|18|29|42|27|Nuts|tbsp:10|alsi;flaxseed
Pumpkin Seeds|🎃|559|30|11|49|6|Nuts|tbsp:10|
Sunflower Seeds|🌻|584|21|20|51|8.6|Nuts|tbsp:10|
Soya Milk|🥛|43|3.3|1.8|1.8|0.6|Drinks|glass:250|soy milk
`;

const SAFE_NUMBER = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

export const INDIAN_EXTRA = ROWS.trim().split("\n").map(line => {
  const [name, emoji, cal, protein, carbs, fat, fiber, category, serving, aliases] = line.split("|");
  const [unit, grams] = (serving || "").split(":");
  return {
    name, emoji, cal: SAFE_NUMBER(cal), protein: SAFE_NUMBER(protein), carbs: SAFE_NUMBER(carbs),
    fat: SAFE_NUMBER(fat), fiber: SAFE_NUMBER(fiber), category,
    ...(unit && Number(grams) ? { unit, unitG: Number(grams) } : {}),
    ...(aliases ? { aka: aliases.split(";").map(a => a.trim()).filter(Boolean) } : {}),
  };
});

// One typical serving for the original foods (name → "unit:grams"), plus their other names.
export const BASE_SERVINGS = {
  "White Rice (Cooked)": "cup:180", "Brown Rice (Cooked)": "cup:180", "Jeera Rice": "plate:200", "Lemon Rice": "plate:200",
  "Curd Rice": "bowl:200", "Chicken Biryani": "plate:300", "Mutton Biryani": "plate:300", "Veg Biryani": "plate:300",
  "Hyderabadi Biryani": "plate:300", "Khichdi": "bowl:250", "Pulao (Veg)": "plate:250",
  "Wheat Roti": "piece:40", "Paratha (Plain)": "piece:60", "Aloo Paratha": "piece:120", "Naan": "piece:90", "Garlic Naan": "piece:90",
  "Puri": "piece:25", "Bhatura": "piece:80", "Bajra Roti": "piece:50", "Jowar Roti": "piece:50", "Ragi Roti": "piece:50",
  "Toor Dal": "katori:150", "Moong Dal": "katori:150", "Chana Dal": "katori:150", "Masoor Dal": "katori:150",
  "Dal Tadka": "katori:150", "Dal Makhani": "katori:150", "Rajma": "katori:150", "Chole": "katori:150", "Sambar": "katori:150",
  "Plain Dosa": "piece:100", "Masala Dosa": "piece:180", "Idli": "piece:40", "Medu Vada": "piece:50", "Uttapam": "piece:150",
  "Upma": "plate:200", "Pesarattu": "piece:120", "Pongal": "bowl:200",
  "Palak Paneer": "bowl:150", "Paneer Butter Masala": "bowl:150", "Butter Chicken": "bowl:150", "Chicken Curry": "bowl:150",
  "Mutton Curry": "bowl:150", "Fish Curry": "bowl:150", "Egg Curry": "bowl:150", "Aloo Gobi": "bowl:150",
  "Mixed Veg Curry": "bowl:150", "Malai Kofta": "bowl:150", "Matar Paneer": "bowl:150",
  "Chicken Breast": "piece:120", "Tandoori Chicken": "piece:120", "Egg (Boiled)": "piece:50", "Egg Omelette": "piece:100",
  "Paneer": "cube:20", "Tofu": "cube:25", "Fish (Rohu)": "piece:100", "Prawns": "cup:100", "Soya Chunks": "cup:30",
  "Whey Protein": "scoop:30", "Grilled Chicken": "piece:120",
  "Spinach": "cup:30", "Broccoli": "cup:90", "Carrot": "piece:60", "Tomato": "piece:100", "Potato (Boiled)": "piece:150",
  "Sweet Potato": "piece:130", "Cucumber": "piece:200", "Beetroot": "piece:80", "Cauliflower": "cup:100", "Cabbage": "cup:90",
  "Apple": "piece:180", "Banana": "piece:120", "Mango": "piece:200", "Orange": "piece:130", "Watermelon": "cup:150",
  "Grapes": "cup:150", "Pomegranate": "cup:90", "Guava": "piece:100", "Papaya": "cup:145", "Avocado": "piece:150",
  "Dates (Khajur)": "piece:8",
  "Milk (Full Fat)": "glass:250", "Curd (Dahi)": "katori:100", "Buttermilk": "glass:250", "Lassi (Sweet)": "glass:250",
  "Ghee": "tsp:5", "Cheese": "slice:20",
  "Almonds": "piece:1.2", "Cashews": "piece:1.5", "Walnuts": "piece:4", "Peanuts": "handful:30", "Peanut Butter": "tbsp:16", "Chia Seeds": "tbsp:10",
  "Samosa": "piece:60", "Vada Pav": "piece:150", "Pav Bhaji": "plate:300", "Pakora": "piece:20", "Poha": "plate:200",
  "Tea (With Milk)": "cup:150", "Coffee (With Milk)": "cup:150", "Green Tea": "cup:200", "Coconut Water": "glass:250", "Protein Shake": "glass:300",
  "Gulab Jamun": "piece:40", "Jalebi": "piece:25", "Kheer": "bowl:150", "Halwa": "bowl:100",
  "Haleem": "bowl:250", "Irani Chai": "cup:150", "Kebab (Seekh)": "piece:50", "Shawarma": "piece:250", "Nihari": "bowl:250",
  "Oats Porridge": "bowl:250", "Quinoa": "cup:185", "Greek Yogurt": "katori:150", "Muesli": "bowl:50", "Honey": "tsp:7", "Sprouts (Moong)": "bowl:100",
};

export const BASE_ALIASES = {
  "White Rice (Cooked)": ["rice", "chawal", "plain rice", "steamed rice"], "Wheat Roti": ["roti", "chapati", "chapathi"],
  "Paratha (Plain)": ["paratha", "parantha"], "Toor Dal": ["arhar dal", "dal"], "Curd (Dahi)": ["curd", "dahi", "yogurt", "yoghurt"],
  "Egg (Boiled)": ["egg", "eggs", "boiled egg", "anda"], "Egg Omelette": ["omelette", "omelet"], "Chicken Breast": ["chicken"],
  "Tea (With Milk)": ["tea", "chai"], "Coffee (With Milk)": ["coffee"], "Milk (Full Fat)": ["milk", "doodh"],
  "Potato (Boiled)": ["potato", "aloo"], "Chole": ["chhole", "chana"], "Oats Porridge": ["oats", "oatmeal", "porridge"],
  "Plain Dosa": ["dosa", "dosai"], "Idli": ["idly"], "Medu Vada": ["vada", "uzhunnu vada"], "Pakora": ["pakoda", "bhajiya"],
  "Kebab (Seekh)": ["seekh kebab", "kebab"], "Dates (Khajur)": ["dates", "khajur"], "Sprouts (Moong)": ["sprouts"],
  "Whey Protein": ["whey", "protein powder"], "Lassi (Sweet)": ["lassi"], "Buttermilk": ["chaas", "mor", "majjiga"],
};
