import { orderStatusMeta } from '../lib/domain';

/**
 * X-MARKET-UE-01 状态彩色徽标：统一圆角 pill + 前缀圆点。
 * 绿=已完成 / 灰棕=待处理 / 蓝=履约中 / 紫=待治理审批 / 红=已驳回；未知状态灰棕兜底。
 */
export default function OrderStatusBadge({ status, note }: { status: string; note?: string }) {
  const meta = orderStatusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap"
      style={{ color: meta.color, background: meta.bg }}
      title={note ?? undefined}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}
