// X-MARKET-EMBED-01 · 嵌入握手门（前端非阻塞组件）
// 职责：发起 hello -> 校验回票 origin -> exchange 换会话 -> 会话失效自动重握手
// 不阻塞业务：超时/失败呈游客态 + 弱提示条 + 重试
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../Auth';
import { detectEmbedMode, isTicketMsg, postHelloToParent, EMBED_APP, EMBED_HELLO } from '../lib/embed';

export function useEmbedMode(): boolean {
  const [embed] = useState<boolean>(() => detectEmbedMode());
  return embed;
}

type Phase = 'hello' | 'ready' | 'timeout';

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
      postHelloToParent({ type: EMBED_HELLO, app: EMBED_APP });
    };
    const onMsg = (ev: MessageEvent) => {
      if (!isTicketMsg(ev)) return; // origin 白名单 + 类型/前缀校验
      const ticket = ev.data.ticket;
      api
        .embedExchange(ticket)
        .then((res) => {
          if (dead) return;
          applySession(res.token, res.user);
          setPhase('ready');
        })
        .catch(() => {
          // 票无效/已消费/verify 不可达：呈游客态，可重握手
          if (!dead) setPhase('timeout');
        });
    };
    window.addEventListener('message', onMsg);
    hello();
    const guard = window.setTimeout(() => {
      if (!dead && userRef.current === null) setPhase('timeout');
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
