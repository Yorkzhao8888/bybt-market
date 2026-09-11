// X-MARKET-EMBED-01 · 嵌入握手门（前端非阻塞组件）
// 职责：发起 hello -> 校验回票 origin -> exchange 换会话 -> 会话失效自动重握手
// 不阻塞业务：超时/失败呈游客态 + 弱提示条 + 重试
// EMBED-09：全链路 xm:embed 诊断日志（hello 多播 / 收票 origin+tag / exchange 结果）——
// 「票未送达前端」与「送达被拒/核销失败」两类断点由日志直接区分，供三端联动定向。
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../Auth';
import { detectEmbedMode, inspectEmbedMessage, postHelloToParent, EMBED_APP, EMBED_HELLO, ZIWAY_EMBED_ORIGINS } from '../lib/embed';

export function useEmbedMode(): boolean {
  const [embed] = useState<boolean>(() => detectEmbedMode());
  return embed;
}

type Phase = 'hello' | 'ready' | 'timeout';

function ticketTag(t: string): string {
  return `${t.slice(0, 10)}…len=${t.length}`;
}

export function EmbedGate() {
  const { user, applySession } = useAuth();
  const [phase, setPhase] = useState<Phase>('hello');
  const [attempt, setAttempt] = useState(0);
  const userRef = useRef<typeof user>(user);
  userRef.current = user;

  useEffect(() => {
    let dead = false;
    const hello = () => {
      // EMBED-03-M：多播白名单（生产+dev+VITE 追加域），origin 不匹配的被浏览器丢弃，命中宿主域的送达
      console.info(`[xm:embed] hello 多播 -> ${ZIWAY_EMBED_ORIGINS.join(' , ')}`);
      postHelloToParent({ type: EMBED_HELLO, app: EMBED_APP });
    };
    const onMsg = (ev: MessageEvent) => {
      const v = inspectEmbedMessage(ev);
      if (v.kind === 'noise') return;
      if (v.kind === 'reject') {
        // EMBED-09 诊断：壳侧票消息到达 iframe 但被拒（origin/形状）——证据直接回传三端联动
        console.warn(`[xm:embed] 收到票消息但被拒：${v.reason}`);
        return; // 保持等待（壳可能重发合规票），8s guard 兜底游客态
      }
      console.info(`[xm:embed] 收到票（origin=${v.origin} ticket=${ticketTag(v.ticket)}），开始 exchange`);
      const t0 = Date.now();
      api
        .embedExchange(v.ticket)
        .then((res) => {
          if (dead) return;
          console.info(`[xm:embed] exchange 成功（${Date.now() - t0}ms role=${res.embed?.role ?? '?'} jti=${res.embed?.jti ?? '?'}）`);
          applySession(res.token, res.user);
          setPhase('ready');
        })
        .catch((e: unknown) => {
          // 票无效/已消费/verify 不可达：呈游客态，可重握手
          console.warn(`[xm:embed] exchange 失败（${Date.now() - t0}ms）：${e instanceof Error ? e.message : String(e)}`);
          if (!dead) setPhase('timeout');
        });
    };
    window.addEventListener('message', onMsg);
    hello();
    const guard = window.setTimeout(() => {
      if (!dead && userRef.current === null) {
        console.warn('[xm:embed] 握手超时（8s 内未收到合规票或 exchange 未成功），呈游客浏览模式');
        setPhase('timeout');
      }
    }, 8000);
    return () => {
      dead = true;
      window.removeEventListener('message', onMsg);
      window.clearTimeout(guard);
    };
  }, [attempt, applySession]);

  // 会话失效（任意接口 401 -> clear）时自动重新走握手
  const hadUser = useRef(false);
  useEffect(() => {
    if (user) {
      hadUser.current = true;
      setPhase('ready');
    } else if (hadUser.current) {
      hadUser.current = false;
      setPhase('hello');
      setAttempt((n) => n + 1);
    }
  }, [user]);

  const retry = useCallback(() => {
    setPhase('hello');
    setAttempt((n) => n + 1);
  }, []);

  if (phase === 'ready' || user) return null;
  return (
    <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-[#e4ded2] bg-[#fdfbf6] px-4 py-1.5 text-[11px] text-[#8a8577]">
      <span>
        {phase === 'hello' ? '正在与 ZiwayOS 建立免登握手…（可先以游客身份浏览）' : '嵌入免登未完成（票未送达或核销失败），当前为游客浏览模式'}
      </span>
      {phase === 'timeout' && (
        <button type="button" onClick={retry} className="rounded border border-[#d8d2c4] px-2 py-0.5 text-[11px] text-[#17181d] hover:bg-[#f1ece1]">
          重新握手
        </button>
      )}
    </div>
  );
}
