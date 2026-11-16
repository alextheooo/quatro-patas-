import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Share2 } from 'lucide-react';
import { Story } from '../types';
import { formatDateBR } from '../lib/format';
import { ResilientImage } from '../components/ResilientImage';

export function StoryDetailPage() {
  const { id } = useParams();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentMsg, setCommentMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/stories/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setStory(d);
        if (d) document.title = `${d.title} – Quatro Patas`;
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCommentMsg(null);
    setSubmitting(true);
    try {
      const form = new FormData(e.currentTarget);
      const res = await fetch(`/api/stories/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_name: authorName,
          author_email: authorEmail,
          content,
          hp_field: form.get('hp_field') || '',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao enviar comentário.');
      setCommentMsg({ type: 'ok', text: json.message });
      setAuthorName('');
      setAuthorEmail('');
      setContent('');
    } catch (err) {
      setCommentMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Falha ao enviar.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-sm text-[#786D65]">
        Carregando história...
      </div>
    );
  }

  if (!story) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold">História não encontrada</h1>
        <Link to="/historias" className="text-sm font-semibold text-[#C2410C] underline">
          Voltar para histórias
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link
        to="/historias"
        className="inline-flex items-center gap-1.5 text-sm text-[#524942] hover:text-[#1F1B18] mb-6"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        <span>Voltar para histórias</span>
      </Link>

      <header className="mb-8">
        <p className="text-xs text-[#786D65] mb-2">
          {story.category} · {formatDateBR(story.published_at)} · Por {story.author_name}
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1F1B18] [text-wrap:balance] leading-tight">
          {story.title}
        </h1>
      </header>

      <div className="aspect-[16/10] rounded-3xl overflow-hidden bg-[#EFE8DC] mb-8 border border-[#E7DFD3]">
        <ResilientImage src={story.image_url} alt={story.title} className="w-full h-full object-cover" />
      </div>

      <div className="prose max-w-none text-base text-[#2E2823] leading-[1.8] whitespace-pre-line mb-10">
        {story.content}
      </div>

      {/* Share bar */}
      <div className="border-y border-[#E7DFD3] py-5 mb-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#1F1B18]">
          <Share2 className="w-4 h-4" aria-hidden="true" />
          <span>Compartilhar esta história</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${story.title} - ${shareUrl}`)}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-full bg-[#15803D] text-white"
          >
            WhatsApp
          </a>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(story.title)}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-full bg-[#1F1B18] text-white"
          >
            X / Twitter
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-full border border-[#D6CBB9] text-[#1F1B18] bg-white"
          >
            Facebook
          </a>
          <button
            type="button"
            onClick={copyLink}
            className="px-4 py-2 rounded-full border border-[#D6CBB9] text-[#1F1B18] bg-white"
          >
            {copied ? 'Link copiado!' : 'Copiar link'}
          </button>
        </div>
      </div>

      {/* Moderated Comments */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-[#1F1B18]">
          Comentários ({story.comments?.length || 0})
        </h2>

        {story.comments && story.comments.length > 0 ? (
          <div className="space-y-4">
            {story.comments.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-[#E7DFD3] p-5">
                <p className="text-xs text-[#786D65] mb-1.5">
                  <strong className="text-[#1F1B18]">{c.author_name}</strong> ·{' '}
                  {formatDateBR(c.created_at)}
                </p>
                <p className="text-sm text-[#524942] leading-relaxed">{c.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#786D65]">Ainda não há comentários aprovados nesta história.</p>
        )}

        <form
          onSubmit={handleComment}
          className="bg-white rounded-3xl border border-[#E7DFD3] p-6 space-y-4"
        >
          <input type="text" name="hp_field" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <h3 className="text-lg font-bold text-[#1F1B18]">Deixe uma mensagem</h3>
          <p className="text-xs text-[#786D65]">
            Todos os comentários passam por moderação da equipe antes da publicação.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Seu nome *"
              className="px-4 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm"
            />
            <input
              type="email"
              required
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
              placeholder="Seu e-mail (não publicado) *"
              className="px-4 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm"
            />
          </div>
          <textarea
            required
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva seu comentário..."
            className="w-full px-4 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm"
          />

          {commentMsg && (
            <p
              className={`text-sm flex items-center gap-1.5 ${
                commentMsg.type === 'ok' ? 'text-[#15803D]' : 'text-[#DC2626]'
              }`}
            >
              {commentMsg.type === 'ok' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span>{commentMsg.text}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {submitting ? 'Enviando...' : 'Enviar comentário para moderação'}
          </button>
        </form>
      </section>
    </article>
  );
}
