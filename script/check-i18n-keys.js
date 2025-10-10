const fs = require('fs');
const path = require('path');

// 读取 JSON 文件
const zh = JSON.parse(fs.readFileSync('./src/i18n/messages/zh.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('./src/i18n/messages/en.json', 'utf8'));
const hi = JSON.parse(fs.readFileSync('./src/i18n/messages/hi.json', 'utf8'));

// 递归获取所有键
function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (let key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key]) && obj[key] !== null) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// 获取所有键
const zhKeys = getAllKeys(zh);
const enKeys = getAllKeys(en);
const hiKeys = getAllKeys(hi);

console.log('总键数:');
console.log('  zh.json:', zhKeys.length);
console.log('  en.json:', enKeys.length);
console.log('  hi.json:', hiKeys.length);

// 找出缺失的键
const missingInEn = zhKeys.filter(k => !enKeys.includes(k));
const missingInHi = zhKeys.filter(k => !hiKeys.includes(k));

console.log('\n====================================');
console.log('在 en.json 中缺失的键:', missingInEn.length);
if (missingInEn.length > 0) {
  console.log('缺失的键列表:');
  missingInEn.forEach(key => console.log('  -', key));
}

console.log('\n====================================');
console.log('在 hi.json 中缺失的键:', missingInHi.length);
if (missingInHi.length > 0) {
  console.log('缺失的键列表:');
  missingInHi.forEach(key => console.log('  -', key));
}

// 找出只在 en 或 hi 中有但在 zh 中没有的键
const extraInEn = enKeys.filter(k => !zhKeys.includes(k));
const extraInHi = hiKeys.filter(k => !zhKeys.includes(k));

if (extraInEn.length > 0) {
  console.log('\n====================================');
  console.log('在 en.json 中多余的键:', extraInEn.length);
  extraInEn.forEach(key => console.log('  -', key));
}

if (extraInHi.length > 0) {
  console.log('\n====================================');
  console.log('在 hi.json 中多余的键:', extraInHi.length);
  extraInHi.forEach(key => console.log('  -', key));
}

// 导出缺失键的详细信息
if (missingInEn.length > 0 || missingInHi.length > 0) {
  const result = {
    missingInEn: missingInEn,
    missingInHi: missingInHi
  };
  fs.writeFileSync('missing-keys.json', JSON.stringify(result, null, 2));
  console.log('\n缺失键已导出到 missing-keys.json');
}

