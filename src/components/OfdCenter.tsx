// X-MARKET-ROLE-01 A5：X-OFD 履约中心只读接入（模拟契约期）。
// VDM（/govern 经营治理）与 V*M 四源家族（supply 治理视图）治理面均可打开；
// 外部契约面独立部署，本组件仅做 iframe 只读嵌入 + 新窗口兜底，不代理、不转发、不落库。
import { ExternalLink, Radio } from 'lucide-react';

const OFD_BASE = 'https://2jr2ym36zz.coze.site';
const OFD_API_BASE = 'https://2jr2ym36zz.coze.site/api/ofd';

export function OfdCenter({ height = 560 }: { height?: number }) {
  return (
    <div className="rounded-xl border bg-white shadow-[4px_4px_0_rgba(23,24,29,0.12)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <p className="flex items-center gap-2 font-serif-display text-lg font-black">
          <Radio className="h-4 w-4" style={{ color: '#6D28D9' }} /> 履约中心（X-OFD）
          <span className="rounded border border-dashed border-[#B8862B] px-1.5 py-0.5 text-[10px] font-bold text-[#B8862B]">
            模拟契约期 · 只读
          </span>
        </p>
        <a
          href={OFD_BASE}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 rounded border px-2 py-1 text-xs font-semibold text-[#4A5FD5] hover:bg-[#F5F2EB]"
        >
          <ExternalLink className="h-3.5 w-3.5" /> 新窗口打开
        </a>
      </div>
      <p className="px-4 pt-2 text-xs text-[#8a8577]">
        外部履约契约面（独立部署）：{OFD_API_BASE}/*。治理面只读查看履约进度，模拟契约期数据不入本系统。
      </p>
      <div className="p-4">
        <iframe
          src={OFD_BASE}
          title="X-OFD 履约中心"
          style={{ height }}
          className="w-full rounded-lg border"
          loading="lazy"
        />
      </div>
    </div>
  );
}
