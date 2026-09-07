'use client';

import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Clock } from 'lucide-react';
import PageShell from '@/components/organisms/PageShell';
import { ARTICLES, findArticle } from '@/constants/articles';

export default function ArticleDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const article = findArticle(params?.id ?? '');

  const related = article
    ? ARTICLES.filter((a) => a.id !== article.id && a.category === article.category).slice(0, 2)
    : [];

  return (
    <PageShell>
      <div className="flex items-center px-4 py-3 bg-white/90 backdrop-blur-sm border-b border-hairline sticky top-0 z-20">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-hairline transition-colors"
        >
          <ChevronLeft size={20} className="text-content" />
        </button>
        <span className="flex-1 text-center text-[15px] font-semibold text-content truncate px-2">
          {article?.category ?? '구강 건강 정보'}
        </span>
        <div className="w-9" />
      </div>

      {article === null ? (
        <div className="px-5 pt-16 flex flex-col items-center gap-3">
          <p className="m-0 text-sm text-muted">찾을 수 없는 글이에요.</p>
          <button
            type="button"
            onClick={() => router.replace('/articles')}
            className="px-4 py-2 rounded-full bg-primary-gradient text-white text-xs font-semibold"
          >
            목록으로
          </button>
        </div>
      ) : (
        <article className="px-5 pt-5">
          <h1 className="m-0 text-[21px] font-bold text-content leading-snug text-balance">
            {article.title}
          </h1>
          <span className="flex items-center gap-1 mt-2 text-[11px] text-muted">
            <Clock size={11} />
            {article.readMinutes}분 분량
          </span>

          <div className="bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card p-5 mt-4 flex flex-col gap-4">
            {article.body.map((paragraph, i) => (
              <p key={i} className="m-0 text-[13.5px] text-content leading-[1.75]">
                {paragraph}
              </p>
            ))}
          </div>

          {related.length > 0 && (
            <>
              <h2 className="m-0 mt-6 mb-2 px-1 text-[11px] font-bold text-muted tracking-widest">
                이어서 읽기
              </h2>
              <div className="flex flex-col gap-2">
                {related.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => router.replace(`/articles/${a.id}`)}
                    className="bg-white/90 backdrop-blur-sm rounded-[18px] shadow-card p-4 text-left transition-transform active:scale-[0.99]"
                  >
                    <p className="m-0 text-[13px] font-semibold text-content">{a.title}</p>
                    <p className="m-0 mt-1 text-[11px] text-muted">{a.summary}</p>
                  </button>
                ))}
              </div>
            </>
          )}

          <p className="m-0 mt-6 px-1 text-[10px] leading-relaxed text-muted">
            일반적인 구강 관리 정보예요. 증상이 있다면 치과에서 확인해 주세요.
          </p>
        </article>
      )}
    </PageShell>
  );
}
