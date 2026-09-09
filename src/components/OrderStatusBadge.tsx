import { orderStatusMeta } from '../lib/domain';
import { statusTerm } from '../lib/terminology';

/**
 * X-MARKET-UE-01 状态彩色徽标：统一圆角 pill + 前缀圆点。
 * 绿=已完成 / 灰棕=待处理 / 蓝=履约中 / 紫=待治理审批 / 红=已驳回；未知状态灰棕兜底。
 * X-MARKET-UE-02：dual=true 时启用双称呼（大号市面称呼主显 + 小号系统口径副标），
 * 默认 false 保持既有单显（UE-01 存量不返工）。
 */
export default function OrderStatusBadge({ status, note, dual }: { status: string; note?: string; dual?: boolean }) {
  const meta = orderStatusMeta(status);
  const term = statusTerm(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap"
      style={{ color: meta.color, background: meta.bg }}
      title={note ?? undefined}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      {dual && term.big !== term.sys ? (
        <span className="inline-flex items-baseline gap-1">
          <span>{term.big}</span>
          <span className="text-[9px] font-normal opacity-70">{term.sys}</span>
        </span>
      ) : (
        meta.label
      )}
    </span>
  );
}
