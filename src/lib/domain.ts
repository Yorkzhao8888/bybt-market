// 域元信息前端映射
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