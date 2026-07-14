// ═══════════════════════════════════════
// IGNITE — Food Database (Per 100g values)
// 200+ items: Hyderabad specials, Indian dishes,
// International items, Fruits, Vegetables, Snacks
// ═══════════════════════════════════════

// All values are PER 100 GRAMS
// { id, name, emoji, cal, protein, carbs, fat, fiber, category, region }

let _id = 1;
const f = (name, emoji, cal, protein, carbs, fat, fiber, category, region = "Indian") => ({ id: _id++, name, emoji, cal, protein, carbs, fat, fiber, category, region });

export const FOOD_DB = [
  // ══ HYDERABAD SPECIALS ══
  f("Chicken Biryani", "🍗", 180, 12, 20, 6, 0.5, "Hyderabad", "Hyderabad"),
  f("Mutton Biryani", "🍖", 190, 14, 18, 8, 0.4, "Hyderabad", "Hyderabad"),
  f("Veg Biryani", "🍚", 150, 4, 22, 4, 1, "Hyderabad", "Hyderabad"),
  f("Egg Biryani", "🥚", 170, 9, 20, 6, 0.5, "Hyderabad", "Hyderabad"),
  f("Haleem", "🥘", 150, 12, 10, 7, 2, "Hyderabad", "Hyderabad"),
  f("Irani Chai", "☕", 75, 2, 10, 3, 0, "Hyderabad", "Hyderabad"),
  f("Osmania Biscuit", "🍪", 450, 6, 65, 18, 1, "Hyderabad", "Hyderabad"),
  f("Double ka Meetha", "🍮", 250, 5, 35, 10, 0.5, "Hyderabad", "Hyderabad"),
  f("Lukhmi", "🥟", 300, 8, 28, 18, 1, "Hyderabad", "Hyderabad"),
  f("Keema", "🥩", 180, 16, 4, 12, 0.5, "Hyderabad", "Hyderabad"),
  f("Nihari", "🍲", 120, 10, 4, 7, 0.5, "Hyderabad", "Hyderabad"),
  f("Paya", "🦴", 100, 12, 2, 5, 0, "Hyderabad", "Hyderabad"),
  f("Mirchi ka Salan", "🌶️", 90, 2, 8, 6, 1.5, "Hyderabad", "Hyderabad"),
  f("Bagara Baingan", "🍆", 110, 2, 8, 8, 2, "Hyderabad", "Hyderabad"),
  f("Qubani ka Meetha", "🍑", 200, 2, 40, 4, 1.5, "Hyderabad", "Hyderabad"),
  f("Sheer Khurma", "🥛", 170, 4, 22, 7, 0.5, "Hyderabad", "Hyderabad"),
  f("Hyderabadi Marag", "🍖", 80, 8, 2, 4, 0, "Hyderabad", "Hyderabad"),
  f("Pathar ka Gosht", "🥩", 200, 18, 2, 14, 0, "Hyderabad", "Hyderabad"),
  f("Kubani ka Meetha", "🍯", 190, 1, 38, 4, 1, "Hyderabad", "Hyderabad"),
  f("Biryani Rice (plain)", "🍚", 160, 3, 28, 3, 0.5, "Hyderabad", "Hyderabad"),

  // ══ SOUTH INDIAN ══
  f("Plain Dosa", "🥞", 120, 3, 18, 4, 0.5, "South Indian"),
  f("Masala Dosa", "🥞", 150, 4, 22, 5, 1, "South Indian"),
  f("Set Dosa", "🥞", 130, 3, 20, 4, 0.5, "South Indian"),
  f("Rava Dosa", "🥞", 140, 3, 20, 5, 0.5, "South Indian"),
  f("Idli", "⚪", 130, 4, 24, 1, 0.5, "South Indian"),
  f("Medu Vada", "🍩", 250, 7, 25, 14, 2, "South Indian"),
  f("Upma", "🥣", 120, 3, 18, 4, 1, "South Indian"),
  f("Pongal", "🍚", 130, 4, 20, 4, 0.5, "South Indian"),
  f("Uttapam", "🥞", 160, 5, 22, 5, 1.5, "South Indian"),
  f("Pesarattu", "🥞", 110, 7, 15, 3, 2, "South Indian"),
  f("Sambar", "🥘", 60, 3, 8, 2, 2, "South Indian"),
  f("Rasam", "🍵", 25, 1, 4, 0.5, 0.5, "South Indian"),
  f("Coconut Chutney", "🥥", 140, 2, 6, 12, 2, "South Indian"),
  f("Curd Rice", "🍚", 120, 4, 18, 3, 0.5, "South Indian"),
  f("Lemon Rice", "🍋", 140, 3, 22, 4, 0.5, "South Indian"),
  f("Tomato Rice", "🍅", 145, 3, 22, 4, 1, "South Indian"),
  f("Pulihora (Tamarind Rice)", "🍚", 150, 3, 24, 4, 1, "South Indian"),

  // ══ NORTH INDIAN ══
  f("Butter Chicken", "🍗", 150, 12, 6, 9, 0.5, "North Indian"),
  f("Paneer Butter Masala", "🧀", 200, 10, 8, 14, 1, "North Indian"),
  f("Palak Paneer", "🥬", 140, 9, 6, 9, 2, "North Indian"),
  f("Dal Makhani", "🥘", 120, 6, 12, 5, 3, "North Indian"),
  f("Rajma", "🫘", 120, 7, 18, 2, 5, "North Indian"),
  f("Chole", "🫘", 130, 7, 18, 4, 5, "North Indian"),
  f("Aloo Gobi", "🥔", 80, 2, 10, 4, 2, "North Indian"),
  f("Kadai Paneer", "🧀", 180, 10, 6, 13, 1, "North Indian"),
  f("Malai Kofta", "🧆", 200, 6, 12, 15, 1, "North Indian"),
  f("Dal Fry", "🥘", 90, 6, 12, 2, 3, "North Indian"),
  f("Dal Tadka", "🥘", 100, 7, 13, 2, 3, "North Indian"),
  f("Egg Curry", "🥚", 120, 8, 6, 7, 1, "North Indian"),
  f("Fish Curry", "🐟", 100, 14, 4, 3, 0.5, "North Indian"),
  f("Mutton Curry", "🍖", 140, 14, 4, 8, 0.5, "North Indian"),
  f("Chicken Curry", "🍗", 130, 14, 4, 6, 0.5, "North Indian"),
  f("Shahi Paneer", "🧀", 190, 9, 8, 14, 1, "North Indian"),
  f("Baingan Bharta", "🍆", 80, 2, 8, 4, 3, "North Indian"),
  f("Bhindi Fry", "🥒", 90, 2, 8, 6, 3, "North Indian"),
  f("Aloo Paratha", "🫓", 230, 5, 30, 10, 2, "North Indian"),
  f("Gobi Paratha", "🫓", 200, 5, 26, 8, 2, "North Indian"),
  f("Methi Paratha", "🫓", 210, 6, 28, 8, 3, "North Indian"),

  // ══ BREADS & RICE ══
  f("Chapati / Roti", "🫓", 240, 8, 42, 4, 3, "Breads"),
  f("Naan", "🫓", 290, 8, 48, 6, 2, "Breads"),
  f("Tandoori Roti", "🫓", 260, 8, 45, 4, 3, "Breads"),
  f("Butter Naan", "🫓", 320, 8, 46, 12, 2, "Breads"),
  f("Garlic Naan", "🫓", 300, 8, 44, 10, 2, "Breads"),
  f("Kulcha", "🫓", 300, 8, 44, 10, 2, "Breads"),
  f("Puri", "🫓", 350, 6, 40, 18, 2, "Breads"),
  f("Bhatura", "🫓", 320, 6, 38, 16, 1, "Breads"),
  f("Paratha", "🫓", 260, 6, 35, 11, 2, "Breads"),
  f("White Rice (cooked)", "🍚", 130, 2.7, 28, 0.3, 0.4, "Grains"),
  f("Brown Rice (cooked)", "🍚", 112, 2.6, 24, 0.9, 1.8, "Grains"),
  f("Jeera Rice", "🍚", 140, 3, 26, 3, 0.5, "Grains"),
  f("Pulao", "🍚", 140, 3, 22, 4, 0.5, "Grains"),
  f("Khichdi", "🍚", 100, 4, 16, 2, 1.5, "Grains"),
  f("Poha", "🥣", 110, 3, 20, 2, 1, "Grains"),
  f("Upma", "🥣", 120, 3, 18, 4, 1, "Grains"),

  // ══ PROTEIN SOURCES ══
  f("Chicken Breast", "🍗", 165, 31, 0, 3.6, 0, "Protein"),
  f("Chicken Thigh", "🍗", 209, 26, 0, 11, 0, "Protein"),
  f("Egg (boiled)", "🥚", 155, 13, 1, 11, 0, "Protein"),
  f("Egg White", "🥚", 52, 11, 0.7, 0.2, 0, "Protein"),
  f("Paneer", "🧀", 265, 18, 1, 21, 0, "Protein"),
  f("Tofu", "🥬", 76, 8, 1.9, 4.8, 0.3, "Protein"),
  f("Chicken Tikka", "🍗", 150, 25, 4, 4, 0, "Protein"),
  f("Tandoori Chicken", "🍗", 140, 24, 4, 3, 0, "Protein"),
  f("Fish (Rohu)", "🐟", 97, 17, 0, 3, 0, "Protein"),
  f("Salmon", "🐟", 208, 20, 0, 13, 0, "Protein"),
  f("Prawns", "🦐", 85, 20, 0, 0.5, 0, "Protein"),
  f("Mutton (lean)", "🍖", 150, 20, 0, 7, 0, "Protein"),
  f("Tuna (canned)", "🐟", 116, 26, 0, 1, 0, "Protein"),
  f("Soya Chunks", "🫘", 345, 52, 33, 0.5, 13, "Protein"),
  f("Whey Protein (scoop)", "🥛", 120, 24, 3, 1.5, 0, "Protein"),
  f("Moong Dal", "🫘", 105, 7, 18, 0.4, 5, "Protein"),
  f("Toor Dal", "🫘", 110, 7, 19, 0.5, 5, "Protein"),
  f("Masoor Dal", "🫘", 108, 8, 18, 0.3, 5, "Protein"),
  f("Chana Dal", "🫘", 115, 8, 20, 1, 5, "Protein"),
  f("Greek Yogurt", "🥛", 59, 10, 3.6, 0.4, 0, "Protein"),

  // ══ FRUITS ══
  f("Apple", "🍎", 52, 0.3, 14, 0.2, 2.4, "Fruits"),
  f("Banana", "🍌", 89, 1.1, 23, 0.3, 2.6, "Fruits"),
  f("Mango", "🥭", 60, 0.8, 15, 0.4, 1.6, "Fruits"),
  f("Papaya", "🍈", 43, 0.5, 11, 0.3, 1.7, "Fruits"),
  f("Watermelon", "🍉", 30, 0.6, 8, 0.2, 0.4, "Fruits"),
  f("Grapes", "🍇", 69, 0.7, 18, 0.2, 0.9, "Fruits"),
  f("Orange", "🍊", 47, 0.9, 12, 0.1, 2.4, "Fruits"),
  f("Pomegranate", "🫐", 83, 1.7, 19, 1.2, 4, "Fruits"),
  f("Guava", "🍐", 68, 2.6, 14, 1, 5.4, "Fruits"),
  f("Chikoo (Sapota)", "🥝", 83, 0.4, 20, 1.1, 5.3, "Fruits"),
  f("Pineapple", "🍍", 50, 0.5, 13, 0.1, 1.4, "Fruits"),
  f("Strawberry", "🍓", 32, 0.7, 8, 0.3, 2, "Fruits"),
  f("Dates", "🌴", 277, 1.8, 75, 0.2, 7, "Fruits"),

  // ══ VEGETABLES ══
  f("Spinach (Palak)", "🥬", 23, 2.9, 3.6, 0.4, 2.2, "Vegetables"),
  f("Tomato", "🍅", 18, 0.9, 3.9, 0.2, 1.2, "Vegetables"),
  f("Onion", "🧅", 40, 1.1, 9.3, 0.1, 1.7, "Vegetables"),
  f("Potato", "🥔", 77, 2, 17, 0.1, 2.2, "Vegetables"),
  f("Carrot", "🥕", 41, 0.9, 10, 0.2, 2.8, "Vegetables"),
  f("Cucumber", "🥒", 15, 0.7, 3.6, 0.1, 0.5, "Vegetables"),
  f("Broccoli", "🥦", 34, 2.8, 7, 0.4, 2.6, "Vegetables"),
  f("Cauliflower", "🥬", 25, 1.9, 5, 0.3, 2, "Vegetables"),
  f("Capsicum", "🫑", 20, 0.9, 4.6, 0.2, 1.7, "Vegetables"),
  f("Green Beans", "🫛", 31, 1.8, 7, 0.2, 2.7, "Vegetables"),
  f("Beetroot", "🟣", 43, 1.6, 10, 0.2, 2.8, "Vegetables"),
  f("Sweet Potato", "🍠", 86, 1.6, 20, 0.1, 3, "Vegetables"),
  f("Mushroom", "🍄", 22, 3.1, 3.3, 0.3, 1, "Vegetables"),
  f("Cabbage", "🥬", 25, 1.3, 6, 0.1, 2.5, "Vegetables"),
  f("Drumstick", "🥒", 37, 2.1, 8.5, 0.2, 2, "Vegetables"),

  // ══ DAIRY ══
  f("Milk (Full Fat)", "🥛", 62, 3.2, 5, 3.3, 0, "Dairy"),
  f("Milk (Toned)", "🥛", 46, 3.2, 5, 1.5, 0, "Dairy"),
  f("Curd / Yogurt", "🥛", 60, 3.5, 5, 3.3, 0, "Dairy"),
  f("Buttermilk", "🥛", 40, 3.3, 5, 1, 0, "Dairy"),
  f("Lassi (Sweet)", "🥛", 80, 2.5, 14, 2, 0, "Dairy"),
  f("Cheese", "🧀", 350, 25, 1.3, 28, 0, "Dairy"),
  f("Ghee", "🧈", 900, 0, 0, 100, 0, "Dairy"),
  f("Butter", "🧈", 717, 0.9, 0.1, 81, 0, "Dairy"),

  // ══ NUTS & SEEDS ══
  f("Almonds", "🥜", 579, 21, 22, 50, 12, "Nuts"),
  f("Cashews", "🥜", 553, 18, 30, 44, 3, "Nuts"),
  f("Peanuts", "🥜", 567, 26, 16, 49, 9, "Nuts"),
  f("Walnuts", "🥜", 654, 15, 14, 65, 7, "Nuts"),
  f("Pistachios", "🥜", 560, 20, 28, 45, 10, "Nuts"),
  f("Chia Seeds", "🌱", 486, 17, 42, 31, 34, "Nuts"),
  f("Flax Seeds", "🌱", 534, 18, 29, 42, 27, "Nuts"),
  f("Pumpkin Seeds", "🌱", 559, 30, 11, 49, 6, "Nuts"),
  f("Peanut Butter", "🥜", 588, 25, 20, 50, 6, "Nuts"),

  // ══ SNACKS & STREET FOOD ══
  f("Samosa", "🥟", 260, 5, 28, 14, 2, "Snacks"),
  f("Vada Pav", "🍔", 290, 6, 35, 14, 2, "Snacks"),
  f("Pav Bhaji", "🍛", 200, 5, 26, 8, 3, "Snacks"),
  f("Pani Puri", "🫕", 180, 3, 28, 6, 2, "Snacks"),
  f("Bhel Puri", "🥙", 160, 4, 26, 4, 2, "Snacks"),
  f("Aloo Tikki", "🥔", 200, 3, 24, 10, 2, "Snacks"),
  f("Pakora / Bhajji", "🧆", 250, 5, 22, 16, 2, "Snacks"),
  f("Kachori", "🥟", 350, 6, 35, 20, 2, "Snacks"),
  f("Egg Roll", "🌯", 250, 10, 28, 11, 1, "Snacks"),
  f("Chicken Roll", "🌯", 270, 14, 26, 12, 1, "Snacks"),

  // ══ SWEETS ══
  f("Gulab Jamun", "🍩", 350, 4, 50, 15, 0.5, "Sweets"),
  f("Jalebi", "🍩", 380, 3, 55, 16, 0.5, "Sweets"),
  f("Rasgulla", "🍡", 185, 4, 35, 4, 0, "Sweets"),
  f("Laddu (Besan)", "🟡", 400, 8, 45, 22, 2, "Sweets"),
  f("Barfi", "🍬", 380, 7, 50, 17, 1, "Sweets"),
  f("Kheer", "🍮", 120, 3, 18, 4, 0.5, "Sweets"),
  f("Payasam", "🍮", 130, 3, 20, 4, 0.5, "Sweets"),
  f("Halwa (Suji)", "🍮", 250, 3, 35, 12, 0.5, "Sweets"),

  // ══ BEVERAGES ══
  f("Chai (with milk)", "☕", 50, 1.5, 7, 1.5, 0, "Beverages"),
  f("Coffee (with milk)", "☕", 45, 1.5, 5, 2, 0, "Beverages"),
  f("Black Coffee", "☕", 2, 0.3, 0, 0, 0, "Beverages"),
  f("Green Tea", "🍵", 1, 0, 0.3, 0, 0, "Beverages"),
  f("Mango Lassi", "🥭", 100, 3, 18, 2, 0.5, "Beverages"),
  f("Coconut Water", "🥥", 19, 0.7, 3.7, 0.2, 1.1, "Beverages"),
  f("Fresh Orange Juice", "🍊", 45, 0.7, 10, 0.2, 0.2, "Beverages"),
  f("Nimbu Pani", "🍋", 25, 0.1, 7, 0, 0.1, "Beverages"),
  f("Badam Milk", "🥛", 90, 4, 12, 3, 1, "Beverages"),

  // ══ OATS & CEREALS ══
  f("Oats (dry)", "🥣", 389, 17, 66, 7, 11, "Grains"),
  f("Cornflakes", "🥣", 357, 7, 84, 0.4, 3.3, "Grains"),
  f("Muesli", "🥣", 340, 10, 60, 6, 8, "Grains"),
  f("Ragi (Finger Millet)", "🌾", 328, 7, 72, 1.3, 11, "Grains"),
  f("Jowar (Sorghum)", "🌾", 329, 10, 73, 1.7, 6, "Grains"),
  f("Bajra (Pearl Millet)", "🌾", 378, 12, 67, 5, 1.2, "Grains"),
  f("Wheat Flour (Atta)", "🌾", 340, 12, 72, 1.5, 11, "Grains"),

  // ══ INTERNATIONAL ══
  f("Pasta (cooked)", "🍝", 131, 5, 25, 1.1, 1.8, "International", "Global"),
  f("Pizza (1 slice ~100g)", "🍕", 266, 11, 33, 10, 2, "International", "Global"),
  f("Burger Patty", "🍔", 250, 15, 15, 15, 1, "International", "Global"),
  f("French Fries", "🍟", 312, 3.4, 41, 15, 3.8, "International", "Global"),
  f("Fried Rice", "🍚", 160, 4, 22, 6, 1, "International", "Global"),
  f("Noodles (cooked)", "🍜", 138, 5, 25, 2, 1, "International", "Global"),
  f("Sushi Roll", "🍣", 150, 6, 20, 5, 1, "International", "Global"),
  f("Sandwich (veg)", "🥪", 230, 8, 28, 10, 2, "International", "Global"),
  f("Wrap / Burrito", "🌯", 220, 10, 26, 8, 2, "International", "Global"),
  f("Salad (mixed)", "🥗", 20, 1.5, 3.5, 0.2, 2, "International", "Global"),

  // ══ COOKING OILS (per 100ml) ══
  f("Sunflower Oil", "🫒", 884, 0, 0, 100, 0, "Oils"),
  f("Olive Oil", "🫒", 884, 0, 0, 100, 0, "Oils"),
  f("Mustard Oil", "🫒", 884, 0, 0, 100, 0, "Oils"),
  f("Coconut Oil", "🥥", 862, 0, 0, 100, 0, "Oils"),

  // ══ MISCELLANEOUS ══
  f("Honey", "🍯", 304, 0.3, 82, 0, 0.2, "Other"),
  f("Sugar", "🧂", 387, 0, 100, 0, 0, "Other"),
  f("Jaggery (Gur)", "🟤", 383, 0.4, 98, 0.1, 0, "Other"),
  f("Salt", "🧂", 0, 0, 0, 0, 0, "Other"),
  f("Pickle (Achar)", "🫙", 150, 2, 10, 12, 2, "Other"),
  f("Papad (roasted)", "🫓", 310, 20, 50, 3, 7, "Other"),
  f("Raita", "🥛", 50, 2, 4, 3, 0.5, "Other"),
];

// Get all unique categories
export const FOOD_CATEGORIES = [...new Set(FOOD_DB.map(f => f.category))];

// Quick search function
export function searchFood(query) {
  if (!query || query.length < 2) return FOOD_DB;
  const q = query.toLowerCase();
  return FOOD_DB.filter(f =>
    f.name.toLowerCase().includes(q) ||
    f.category.toLowerCase().includes(q) ||
    (f.region && f.region.toLowerCase().includes(q))
  );
}