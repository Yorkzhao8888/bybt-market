// XMK-MALL-RICH-01：生成 32 张本地 SVG 商品图（禁外链）——品类四色渐变+商品首字+品类角标
// 与 server/store.ts seed SKU 清单一一对应（sku-1.svg ~ sku-32.svg），mall-check 会断言每张可访问。
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'img', 'mall');
mkdirSync(outDir, { recursive: true });

const CAT = {
  food: { label: '食品生鲜', from: '#15803D', to: '#4ADE80' },
  grain: { label: '粮油调味', from: '#B45309', to: '#F59E0B' },
  specialty: { label: '地方特产', from: '#9F1239', to: '#FB7185' },
  daily: { label: '日用百货', from: '#334155', to: '#94A3B8' },
};

// 与 store.ts l101-l132 同序（末尾两条补存量 l15/l16）
const SKUS = [
  ['智谷鲜蔬·每日净菜组合', 'food'], ['合和牧场·鲜鸡蛋 30 枚', 'food'], ['当日鲜牛奶·家庭订奶周卡', 'food'],
  ['冷链三文鱼刺身拼', 'food'], ['有机草莓·产地直采', 'food'], ['五常稻花香·真空装 5kg', 'grain'],
  ['古法压榨花生油 2L', 'grain'], ['云南小粒咖啡豆·中度烘 250g', 'grain'], ['知味·金华火腿礼盒', 'specialty'],
  ['手工红糖块·古法熬制', 'specialty'], ['竹纤维洗碗巾·10 片装', 'daily'], ['大理石纹陶瓷餐具·四件套', 'daily'],
  ['知味·鲜笋尖腌笃鲜食材包', 'food'], ['深海鳕鱼排·免切装', 'food'], ['现磨豆浆原料·东北黄豆 1kg', 'food'],
  ['高山小番茄·串收', 'food'], ['散养土鸡·冷链整只', 'food'], ['头水紫菜·无沙免洗', 'food'],
  ['太行小米·黄澄澄新米 2kg', 'grain'], ['镇江香醋·十年陈 580ml', 'grain'], ['头道初榨橄榄油 750ml', 'grain'],
  ['血糯米·江南水乡 1kg', 'grain'], ['知味·明前龙井·特级 100g', 'specialty'], ['武夷岩茶·大红袍礼盒', 'specialty'],
  ['云南普洱·七年陈饼 357g', 'specialty'], ['苏州采芝斋·松子糖', 'specialty'], ['柳州螺蛳粉·正版袋装', 'specialty'],
  ['郫县豆瓣·红油特级 500g', 'specialty'], ['知味·帆布购物袋·加厚', 'daily'], ['蜂窝加厚厨房纸·6 卷', 'daily'],
  ['竹制保鲜盒·三件套', 'daily'], ['玻璃油壶·防漏刻度', 'daily'],
  ['门店·生活服务套餐', 'daily'], ['门店·零售精选', 'daily'],
];

if (SKUS.length !== 34) throw new Error(`SKU 清单应为 32 件，当前 ${SKUS.length}`);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const svg = (idx, title, cat) => {
  const c = CAT[cat];
  const first = title.replace(/^.*?[·•]\s*/, '').slice(0, 1); // 去「知味·」类品牌头后取首字
  const deco = Array.from({ length: 7 }, (_, i) => {
    const cx = 40 + ((idx * 53 + i * 97) % 400);
    const cy = 40 + ((idx * 29 + i * 61) % 160);
    const r = 6 + ((idx + i) % 14);
    const op = 0.06 + ((i * 7 + idx) % 10) / 100;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" opacity="${op.toFixed(2)}"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="240" viewBox="0 0 480 240">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c.from}"/><stop offset="1" stop-color="${c.to}"/>
    </linearGradient>
  </defs>
  <rect width="480" height="240" fill="url(#g)"/>
  ${deco}
  <rect x="0" y="0" width="480" height="240" fill="none"/>
  <text x="240" y="140" text-anchor="middle" font-family="'Noto Serif SC',serif" font-size="96" font-weight="900" fill="#ffffff" opacity="0.92">${esc(first)}</text>
  <rect x="176" y="188" width="128" height="28" rx="14" fill="#ffffff" opacity="0.22"/>
  <text x="240" y="207" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="700" fill="#ffffff">${esc(c.label)}</text>
  <text x="240" y="34" text-anchor="middle" font-family="'Noto Serif SC',serif" font-size="13" letter-spacing="4" fill="#ffffff" opacity="0.75">X-MALL · C-MARKET</text>
</svg>`;
};

let n = 0;
SKUS.forEach(([title, cat], i) => {
  writeFileSync(join(outDir, `sku-${i + 1}.svg`), svg(i + 1, title, cat), 'utf8');
  n += 1;
});
console.log(`[MALL-IMG] generated ${n} svgs -> ${outDir}`);
