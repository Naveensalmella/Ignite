const fs = require("fs");
const path = require("path");

let filesChanged = 0;

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let original = content;
  const isInComponents = filePath.includes("components");

  // Add "use client" to .jsx files
  if (filePath.endsWith(".jsx") && !content.startsWith('"use client"')) {
    content = '"use client";\n' + content;
  }

  // FIX: @/data → @/data/index (Next.js doesn't auto-resolve directory imports)
  content = content.replace(/from\s+['"]@\/data['"]/g, `from '@/data/index'`);
  
  // FIX: ./data → @/data/index (for files in src/)
  content = content.replace(/from\s+['"]\.\/data['"]/g, `from '@/data/index'`);
  content = content.replace(/from\s+['"]\.\.\/data['"]/g, `from '@/data/index'`);

  // FIX: ../historyFormatters → @/historyFormatters
  content = content.replace(/from\s+['"]\.\.\/historyFormatters['"]/g, `from '@/historyFormatters'`);
  content = content.replace(/from\s+['"]\.\/historyFormatters['"]/g, `from '@/historyFormatters'`);

  // FIX: ./data/X → @/data/X
  content = content.replace(/from\s+['"]\.\.?\/data\/([^'"]+)['"]/g, `from '@/data/$1'`);

  // FIX: ../firebase or ./firebase → @/lib/firebase
  content = content.replace(/from\s+['"]\.\.?\/firebase['"]/g, `from '@/lib/firebase'`);

  // FIX: ../store or ./store → @/store
  content = content.replace(/from\s+['"]\.\.?\/store['"]/g, `from '@/store'`);

  // FIX: ../utils or ./utils → @/utils
  content = content.replace(/from\s+['"]\.\.?\/utils['"]/g, `from '@/utils'`);

  // FIX: ../sounds or ./sounds → @/sounds
  content = content.replace(/from\s+['"]\.\.?\/sounds['"]/g, `from '@/sounds'`);

  // FIX: ../notifications or ./notifications → @/notifications
  content = content.replace(/from\s+['"]\.\.?\/notifications['"]/g, `from '@/notifications'`);

  // FIX: ./components/X → ./X (if file is already in components/)
  if (isInComponents) {
    content = content.replace(/from\s+['"]\.\/components\/([^'"]+)['"]/g, `from './$1'`);
    content = content.replace(/from\s+['"]\.\.\/components\/([^'"]+)['"]/g, `from './$1'`);
  }

  // FIX: import './styles.css' → remove
  content = content.replace(/import\s+['"]\.\.?\/styles\.css['"];?\n?/g, '');
  
  // FIX: import './transitions.css' → remove
  content = content.replace(/import\s+['"]\.\.?\/transitions\.css['"];?\n?/g, '');

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    filesChanged++;
    console.log("  ✅ " + path.relative(".", filePath));
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) walkDir(full);
    else if (/\.(jsx|js|tsx|ts)$/.test(file)) fixFile(full);
  });
}

console.log("\n🔥 IGNITE v3 — Import Fixer v2\n");
walkDir("src/components");
walkDir("src/data");
["src/utils.js","src/store.js","src/sounds.js","src/notifications.js","src/historyFormatters.js"].forEach(f => {
  if (fs.existsSync(f)) fixFile(f);
});
console.log("\n✅ " + filesChanged + " files fixed.\n");

// Check if historyFormatters exists
if (!fs.existsSync("src/historyFormatters.js") && !fs.existsSync("src/historyFormatters.jsx")) {
  console.log("⚠️  historyFormatters.js is missing! Creating empty stub...");
  fs.writeFileSync("src/historyFormatters.js", `export const formatQuestHistory = (data) => data;\nexport const formatNutritionHistory = (data) => data;\nexport const formatFocusHistory = (data) => data;\n`);
  console.log("  ✅ Created src/historyFormatters.js (stub)\n");
}

console.log("Now run: npm run dev\n");
