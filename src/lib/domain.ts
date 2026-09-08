// 域元信息前端映射
// 口径（P0）：Market=交易平台，不经营、不持有资源；经营户=五域铺子(Booth)；帽=铺子经营者身份，不单独开店/入驻。
export const BOOTH_OPENER_ROLES: string[] = ['EU', 'HU', 'YU', 'TU', 'DU'];

// X-MARKET-04：按专业市场约束开铺铺主帽（Y/H 供应帽+加盟执业帽；E/T 仅供应帽；DE 直营/加盟）
export const MARKET_OWNER_ROLES: Record<string, string[]> = {
  Y: ['YU', 'YDU'],
  E: ['EU'],
  H: ['HU', 'HDU'],
  T: ['TU'],
  DE: ['DU'],
};
export const MARKET_TITLES: Record<string, string> = {
  Y: '智场',
  E: '通货',
  H: '人资',
  T: '技术',
  DE: '产品',
};

export const DOMAIN_COLORS: Record<string, string> = {
  E: '#C27A1B',
  H: '#E4572E',
  Y: '#17A290',
  T: '#4A5FD5',
  DE: '#D6366E',
};

export const DOMAIN_NAMES: Record<string, string> = {
  E: '物资',
  H: '人力',
  Y: '空间',
  T: '技术',
  DE: '门店产能',
};

export const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: '待付款', color: '#b8862b' },
  paid: { label: '已支付', color: '#17a290' },
  fulfilling: { label: '履约中', color: '#4a5fd5' },
  done: { label: '已完成', color: '#6b665a' },
};

// 四方角色语义（X-MARKET-03 LOCKED）
// 客户 XU / 供应商 EU·YU·HU·TU / 加盟商(平台合伙商) DU·YDU·HDU·EDU·TDU / 运营管理方 V*M；OU=组织管理语义
export const PARTY_OF_ROLE: Record<string, string> = {
  XU: '客户',
  EU: '供应商',
  HU: '供应商',
  YU: '供应商',
  TU: '供应商',
  DU: '加盟商',
  HDU: '加盟商',
  YDU: '加盟商',
  EDU: '加盟商',
  TDU: '加盟商',
  VEM: '运营管理方',
  VHM: '运营管理方',
  VYM: '运营管理方',
  VTM: '运营管理方',
  VDM: '运营管理方',
  OU: '组织管理',
};
export const PARTY_LIST = ['客户', '供应商', '加盟商', '运营管理方'];
export const partyOfRole = (r: string): string => PARTY_OF_ROLE[r] ?? '其他';
export const PARTY_COLORS: Record<string, string> = {
  客户: '#4A5FD5',
  供应商: '#C27A1B',
  加盟商: '#D6366E',
  运营管理方: '#17A290',
  组织管理: '#6b665a',
};
export const partyOf = (role: string): string => PARTY_OF_ROLE[role] ?? '组织管理';