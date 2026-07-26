const fs = require("fs");
const path = require("path");

let totalFixed = 0;
let filesChanged = 0;

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let original = content;
  let changes = 0;
  const base = path.basename(filePath);
  const dir = path.dirname(filePath);
  const isInComponents = dir.includes("components");
  const isInData = dir.includes("data");

  // Add "use client" to .jsx files
  if (filePath.endsWith(".jsx") && !content.startsWith('"use client"')) {
    content = '"use client";\n' + content;
    changes++;
  }

  // === FIXES FOR FILES IN src/components/ ===
  if (isInComponents) {
    // ./components/X → ./X (already in components folder)
    content = content.replace(/from\s+['"]\.\/components\/([^'"]+)['"]/g, `from './$1'`);

    // ../firebase → @/lib/firebase
    content = content.replace(/from\s+['"]\.\.?\/firebase['"]/g, `from '@/lib/firebase'`);

    // ./firebase → @/lib/firebase
    content = content.replace(/from\s+['"]\.\/firebase['"]/g, `from '@/lib/firebase'`);

    // ../store or ./store → @/store
    content = content.replace(/from\s+['"]\.\.?\/store['"]/g, `from '@/store'`);

    // ../utils or ./utils → @/utils
    content = content.replace(/from\s+['"]\.\.?\/utils['"]/g, `from '@/utils'`);

    // ../sounds or ./sounds → @/sounds
    content = content.replace(/from\s+['"]\.\.?\/sounds['"]/g, `from '@/sounds'`);

    // ../notifications or ./notifications → @/notifications
    content = content.replace(/from\s+['"]\.\.?\/notifications['"]/g, `from '@/notifications'`);

    // ../data/X or ./data/X → @/data/X
    content = content.replace(/from\s+['"]\.\.?\/data\/([^'"]+)['"]/g, `from '@/data/$1'`);

    // ../data or ./data → @/data
    content = content.replace(/from\s+['"]\.\.?\/data['"]/g, `from '@/data'`);

    // ./styles.css → remove (handled by globals.css now)
    content = content.replace(/import\s+['"]\.\.?\/styles\.css['"];?\n?/g, '// styles moved to globals.css\n');

    // ./transitions.css → remove
    content = content.replace(/import\s+['"]\.\.?\/transitions\.css['"];?\n?/g, '// transitions moved to globals.css\n');
  }

  // === FIXES FOR FILES IN src/data/ ===
  if (isInData) {
    content = content.replace(/from\s+['"]\.\.\/utils['"]/g, `from '@/utils'`);
    content = content.replace(/from\s+['"]\.\/utils['"]/g, `from '@/utils'`);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    filesChanged++;
    console.log("  ✅ " + path.relative(".", filePath));
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) { console.log("  ⚠️  Not found: " + dir); return; }
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) { walkDir(full); continue; }
    if (file.endsWith(".jsx") || file.endsWith(".js") || file.endsWith(".tsx") || file.endsWith(".ts")) {
      fixFile(full);
    }
  }
}

console.log("\n🔥 IGNITE v3 — Import Fixer\n");

// Fix components
walkDir("src/components");

// Fix data
walkDir("src/data");

// Fix root src files
["src/utils.js", "src/store.js", "src/sounds.js", "src/notifications.js"].forEach(f => {
  if (fs.existsSync(f)) fixFile(f);
});

console.log("\n✅ " + filesChanged + " files fixed. Run: npm run dev\n");