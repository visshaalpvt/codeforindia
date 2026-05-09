const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    let filepath = path.join(dir, file);
    let stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      walk(filepath, callback);
    } else {
      callback(filepath);
    }
  });
}

const replacements = [
  // Backgrounds
  { search: /bg-\[#050B14\]/g, replace: 'bg-slate-50' },
  { search: /bg-\[#0B1020\]/g, replace: 'bg-white' },
  { search: /bg-\[#111827\]/g, replace: 'bg-white' },
  { search: /bg-\[#0a0f1d\]/g, replace: 'bg-slate-50' },
  { search: /bg-white\/5/g, replace: 'bg-slate-50 hover:bg-slate-100' },
  { search: /bg-white\/10/g, replace: 'bg-slate-100' },
  { search: /bg-white\/20/g, replace: 'bg-slate-200' },
  { search: /bg-white\/\[0\.02\]/g, replace: 'bg-slate-50' },
  { search: /bg-white\/\[0\.04\]/g, replace: 'bg-slate-100' },
  { search: /bg-black\/60/g, replace: 'bg-slate-900\/40' },
  
  // Text colors - handle specific tailwind classes
  { search: /text-white/g, replace: 'text-slate-900' },
  { search: /text-gray-300/g, replace: 'text-slate-700' },
  { search: /text-gray-400/g, replace: 'text-slate-500' },
  { search: /text-gray-500/g, replace: 'text-slate-400' },
  { search: /text-gray-600/g, replace: 'text-slate-400' }, 
  
  // Accents -> Shift to Violet to match ProVeloce
  { search: /text-cyan-400/g, replace: 'text-violet-600' },
  { search: /text-cyan-300/g, replace: 'text-violet-700' },
  { search: /text-cyan-500/g, replace: 'text-violet-600' },
  { search: /text-purple-400/g, replace: 'text-violet-600' },
  { search: /text-purple-300/g, replace: 'text-violet-700' },
  { search: /text-amber-400/g, replace: 'text-amber-600' },
  { search: /text-blue-400/g, replace: 'text-blue-600' },
  { search: /text-green-400/g, replace: 'text-green-600' },
  { search: /text-red-400/g, replace: 'text-red-600' },
  
  // Hover Texts
  { search: /hover:text-white/g, replace: 'hover:text-slate-900' },
  
  // Borders
  { search: /border-cyan-500\/10/g, replace: 'border-slate-200' },
  { search: /border-cyan-500\/15/g, replace: 'border-slate-200' },
  { search: /border-cyan-500\/20/g, replace: 'border-slate-200' },
  { search: /border-cyan-500\/30/g, replace: 'border-slate-300' },
  { search: /border-cyan-500\/40/g, replace: 'border-slate-300' },
  { search: /border-cyan-500\/50/g, replace: 'border-slate-400' },
  { search: /border-white\/10/g, replace: 'border-slate-200' },
  { search: /border-white\/20/g, replace: 'border-slate-300' },
  
  // Border variants for other colors
  { search: /border-purple-500\/20/g, replace: 'border-slate-200' },
  { search: /border-purple-500\/40/g, replace: 'border-slate-300' },
  { search: /border-blue-500\/40/g, replace: 'border-slate-300' },
  { search: /border-red-500\/40/g, replace: 'border-slate-300' },
  
  // Background variants for accents (buttons, badges) -> shift to violet
  { search: /bg-cyan-500\/10/g, replace: 'bg-violet-50' },
  { search: /bg-cyan-500\/20/g, replace: 'bg-violet-100' },
  { search: /bg-cyan-500\/30/g, replace: 'bg-violet-200' },
  { search: /hover:bg-cyan-500\/30/g, replace: 'hover:bg-violet-200' },
  
  { search: /bg-purple-500\/10/g, replace: 'bg-violet-50' },
  { search: /bg-purple-500\/20/g, replace: 'bg-violet-100' },
  { search: /hover:bg-purple-500\/30/g, replace: 'hover:bg-violet-200' },
  
  { search: /bg-amber-500\/10/g, replace: 'bg-amber-50' },
  { search: /bg-amber-500\/20/g, replace: 'bg-amber-100' },
  
  { search: /bg-blue-500\/20/g, replace: 'bg-blue-100' },
  { search: /hover:bg-blue-500\/30/g, replace: 'hover:bg-blue-200' },
  
  { search: /bg-red-500\/20/g, replace: 'bg-red-100' },
  { search: /hover:bg-red-500\/30/g, replace: 'hover:bg-red-200' },
  
  { search: /bg-green-500\/20/g, replace: 'bg-green-100' }
];

let changedFiles = 0;

walk(path.join(__dirname, '..', 'src'), (filepath) => {
  if (!filepath.endsWith('.tsx') && !filepath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filepath, 'utf-8');
  let originalContent = content;

  replacements.forEach(({ search, replace }) => {
    content = content.replace(search, replace);
  });

  if (content !== originalContent) {
    fs.writeFileSync(filepath, content, 'utf-8');
    changedFiles++;
  }
});

console.log(`Successfully updated theme in ${changedFiles} files.`);
