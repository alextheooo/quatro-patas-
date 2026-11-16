import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LogOut, Plus, Trash2, Upload } from 'lucide-react';
import { useApp } from '../context/AuthContext';
import {
  Campaign,
  Dog,
  Expense,
  FinancialReport,
  SiteSettings,
  Story,
  StoryComment,
} from '../types';
import { formatBRL, formatDateBR, statusTextStyle, translateDonationStatus } from '../lib/format';

interface DashboardData {
  dogs: Dog[];
  campaigns: Campaign[];
  donations: Array<{
    id: number;
    protocol: string;
    donor_name: string;
    donor_email: string;
    amount_cents: number;
    frequency: string;
    payment_method: string;
    status: string;
    campaign_title?: string;
    dog_name?: string;
    created_at: string;
  }>;
  inquiries: Array<{
    id: number;
    dog_id: number;
    dog_name: string;
    applicant_name: string;
    applicant_email: string;
    applicant_phone: string;
    city: string;
    housing_type: string;
    has_fence_or_screens: number;
    motivation: string;
    status: string;
    created_at: string;
  }>;
  volunteers: Array<{
    id: number;
    name: string;
    email: string;
    phone: string;
    city: string;
    modality: string;
    areas: string;
    availability: string;
    status: string;
    created_at: string;
  }>;
  stories: Story[];
  comments: StoryComment[];
  expenses: Expense[];
  reports: FinancialReport[];
  contacts: Array<{
    id: number;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: string;
    created_at: string;
  }>;
  newsletter: Array<{ id: number; email: string; name: string; created_at: string }>;
  users: Array<{
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'collaborator';
    active: number;
    created_at: string;
  }>;
  settings: SiteSettings;
  gatewayConfigured: boolean;
}

type TabKey =
  | 'overview'
  | 'dogs'
  | 'campaigns'
  | 'donations'
  | 'adoptions'
  | 'volunteers'
  | 'stories'
  | 'finance'
  | 'team';

export function AdminPage() {
  const { user, authLoading, logout, refreshSettings } = useApp();
  const [tab, setTab] = useState<TabKey>('overview');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Forms state
  const [editingDogId, setEditingDogId] = useState<number | null>(null);
  const [dogForm, setDogForm] = useState({
    name: '',
    age_category: 'Adulto',
    age_label: '',
    size: 'Médio',
    sex: 'Macho',
    personality: '',
    rescue_history: '',
    health_status: '',
    vaccination: '',
    location: '',
    status: 'Disponível',
    image_url: '/src/assets/images/dog_caramelo_portrait_1794855381606.jpg',
    sponsorship_active: false,
    sponsorship_needs: '',
    sponsorship_amount_brl: '50',
  });

  const [updateForm, setUpdateForm] = useState({ dogId: '', title: '', content: '' });

  const [editingCampaignId, setEditingCampaignId] = useState<number | null>(null);
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    category: 'Alimentação',
    summary: '',
    description: '',
    goal_brl: '3000',
    image_url: '/src/assets/images/campaign_shelter_care_1794855384779.jpg',
    status: 'Ativa',
  });

  const [storyForm, setStoryForm] = useState({
    title: '',
    category: 'Resgate',
    excerpt: '',
    content: '',
    image_url: '/src/assets/images/hero_rescued_dog_1794855382581.jpg',
  });

  const [expenseForm, setExpenseForm] = useState({
    category: 'Veterinário',
    description: '',
    amount_brl: '',
    expense_date: new Date().toISOString().slice(0, 10),
    receipt_url: '',
  });

  const [reportForm, setReportForm] = useState({
    title: '',
    period: '',
    summary: '',
    document_url: '',
    published_at: new Date().toISOString().slice(0, 10),
  });

  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'collaborator' as 'admin' | 'collaborator',
  });

  const [settingsForm, setSettingsForm] = useState<SiteSettings>({});

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const json = (await res.json()) as DashboardData;
        setData(json);
        setSettingsForm(json.settings || {});
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Painel Administrativo – Quatro Patas';
    if (user) {
      loadDashboard();
    }
  }, [user]);

  if (!authLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user?.role === 'admin';

  const notify = (type: 'ok' | 'err', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleFileUpload = async (
    file: File,
    onDone: (url: string) => void
  ) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const json = await res.json();
    if (!res.ok) {
      notify('err', json.error || 'Falha no upload.');
      return;
    }
    onDone(json.url);
    notify('ok', 'Arquivo enviado com sucesso.');
  };

  const saveDog = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...dogForm,
      sponsorship_amount_cents: Math.round(Number(dogForm.sponsorship_amount_brl || 0) * 100),
    };
    const url = editingDogId ? `/api/dogs/${editingDogId}` : '/api/dogs';
    const method = editingDogId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) return notify('err', json.error || 'Erro ao salvar cão.');
    notify('ok', editingDogId ? 'Cadastro atualizado!' : 'Novo cão cadastrado!');
    setEditingDogId(null);
    setDogForm({
      name: '',
      age_category: 'Adulto',
      age_label: '',
      size: 'Médio',
      sex: 'Macho',
      personality: '',
      rescue_history: '',
      health_status: '',
      vaccination: '',
      location: '',
      status: 'Disponível',
      image_url: '/src/assets/images/dog_caramelo_portrait_1794855381606.jpg',
      sponsorship_active: false,
      sponsorship_needs: '',
      sponsorship_amount_brl: '50',
    });
    loadDashboard();
  };

  const deleteDog = async (id: number) => {
    const res = await fetch(`/api/dogs/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const json = await res.json();
      return notify('err', json.error || 'Sem permissão.');
    }
    notify('ok', 'Cadastro removido.');
    loadDashboard();
  };

  const postDogUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateForm.dogId) return;
    const res = await fetch(`/api/dogs/${updateForm.dogId}/updates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: updateForm.title, content: updateForm.content }),
    });
    if (!res.ok) return notify('err', 'Erro ao publicar atualização.');
    notify('ok', 'Atualização de apadrinhamento publicada.');
    setUpdateForm({ dogId: '', title: '', content: '' });
    loadDashboard();
  };

  const saveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...campaignForm,
      goal_cents: Math.round(Number(campaignForm.goal_brl || 0) * 100),
    };
    const url = editingCampaignId ? `/api/campaigns/${editingCampaignId}` : '/api/campaigns';
    const method = editingCampaignId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return notify('err', 'Erro ao salvar campanha.');
    notify('ok', editingCampaignId ? 'Campanha atualizada.' : 'Campanha publicada.');
    setEditingCampaignId(null);
    setCampaignForm({
      title: '',
      category: 'Alimentação',
      summary: '',
      description: '',
      goal_brl: '3000',
      image_url: '/src/assets/images/campaign_shelter_care_1794855384779.jpg',
      status: 'Ativa',
    });
    loadDashboard();
  };

  const deleteCampaign = async (id: number) => {
    const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
    if (!res.ok) return notify('err', 'Apenas administradores podem excluir campanhas.');
    notify('ok', 'Campanha removida.');
    loadDashboard();
  };

  const saveStory = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(storyForm),
    });
    if (!res.ok) return notify('err', 'Erro ao publicar história.');
    notify('ok', 'História publicada!');
    setStoryForm({
      title: '',
      category: 'Resgate',
      excerpt: '',
      content: '',
      image_url: '/src/assets/images/hero_rescued_dog_1794855382581.jpg',
    });
    loadDashboard();
  };

  const saveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: expenseForm.category,
        description: expenseForm.description,
        amount_cents: Math.round(Number(expenseForm.amount_brl.replace(',', '.')) * 100),
        expense_date: expenseForm.expense_date,
        receipt_url: expenseForm.receipt_url,
      }),
    });
    if (!res.ok) return notify('err', 'Erro ao registrar despesa.');
    notify('ok', 'Despesa verificada registrada na transparência.');
    setExpenseForm({
      category: 'Veterinário',
      description: '',
      amount_brl: '',
      expense_date: new Date().toISOString().slice(0, 10),
      receipt_url: '',
    });
    loadDashboard();
  };

  const saveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportForm),
    });
    if (!res.ok) return notify('err', 'Erro ao publicar relatório.');
    notify('ok', 'Relatório financeiro publicado!');
    setReportForm({
      title: '',
      period: '',
      summary: '',
      document_url: '',
      published_at: new Date().toISOString().slice(0, 10),
    });
    loadDashboard();
  };

  const confirmManualDonation = async (id: number) => {
    const res = await fetch(`/api/admin/donations/${id}/confirm`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receipt_note: 'Confirmado via conferência administrativa' }),
    });
    if (!res.ok) return notify('err', 'Apenas administradores podem confirmar recebimentos.');
    notify('ok', 'Doação confirmada e contabilizada.');
    loadDashboard();
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsForm),
    });
    if (!res.ok) return notify('err', 'Erro ao atualizar configurações.');
    await refreshSettings();
    notify('ok', 'Configurações salvas.');
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUserForm),
    });
    const json = await res.json();
    if (!res.ok) return notify('err', json.error || 'Erro ao criar usuário.');
    notify('ok', 'Novo membro cadastrado!');
    setNewUserForm({ name: '', email: '', password: '', role: 'collaborator' });
    loadDashboard();
  };

  const clearDemoData = async () => {
    const res = await fetch('/api/admin/clear-demo', { method: 'POST' });
    if (!res.ok) return notify('err', 'Erro ao remover dados demonstrativos.');
    await refreshSettings();
    notify('ok', 'Todos os registros demonstrativos foram removidos.');
    loadDashboard();
  };

  const tabs: Array<{ id: TabKey; label: string; adminOnly?: boolean }> = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'dogs', label: 'Cães & Apadrinhamento' },
    { id: 'campaigns', label: 'Campanhas' },
    { id: 'donations', label: 'Doações' },
    { id: 'adoptions', label: 'Adoções' },
    { id: 'volunteers', label: 'Voluntários' },
    { id: 'stories', label: 'Histórias & Comentários' },
    { id: 'finance', label: 'Transparência', adminOnly: true },
    { id: 'team', label: 'Equipe & Config.', adminOnly: true },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7DFD3] pb-6 mb-6">
        <div>
          <p className="text-xs text-[#786D65] mb-1">
            Conectado como <strong className="text-[#1F1B18]">{user?.name}</strong> · Nível:{' '}
            <strong className="text-[#15803D]">
              {isAdmin ? 'Administrador' : 'Colaborador'}
            </strong>
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1F1B18]">Painel Administrativo</h1>
        </div>
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#D6CBB9] text-sm font-medium text-[#1F1B18] hover:bg-[#F3EDE3] self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          <span>Sair</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium border ${
            feedback.type === 'ok'
              ? 'bg-[#EAF4EC] border-[#15803D]/30 text-[#15803D]'
              : 'bg-[#FEE2E2] border-[#DC2626]/30 text-[#DC2626]'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {tabs
          .filter((t) => !t.adminOnly || isAdmin)
          .map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                tab === t.id
                  ? 'bg-[#1F1B18] text-white'
                  : 'bg-white border border-[#D6CBB9] text-[#524942] hover:text-[#1F1B18]'
              }`}
            >
              {t.label}
            </button>
          ))}
      </div>

      {loading || !data ? (
        <div className="py-16 text-center text-sm text-[#786D65]">Carregando dados do painel...</div>
      ) : (
        <>
          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-2xl border border-[#E7DFD3] p-5">
                  <p className="text-xs text-[#786D65]">Cães cadastrados</p>
                  <p className="text-2xl font-bold tabular-nums mt-1">{data.dogs.length}</p>
                </div>
                <div className="bg-white rounded-2xl border border-[#E7DFD3] p-5">
                  <p className="text-xs text-[#786D65]">Interessados adoção</p>
                  <p className="text-2xl font-bold tabular-nums mt-1">{data.inquiries.length}</p>
                </div>
                <div className="bg-white rounded-2xl border border-[#E7DFD3] p-5">
                  <p className="text-xs text-[#786D65]">Voluntários</p>
                  <p className="text-2xl font-bold tabular-nums mt-1">{data.volunteers.length}</p>
                </div>
                <div className="bg-white rounded-2xl border border-[#E7DFD3] p-5">
                  <p className="text-xs text-[#786D65]">Doações confirmadas</p>
                  <p className="text-2xl font-bold text-[#15803D] tabular-nums mt-1">
                    {formatBRL(
                      data.donations
                        .filter((d) => d.status === 'confirmed')
                        .reduce((s, d) => s + d.amount_cents, 0)
                    )}
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-[#E7DFD3] p-5">
                  <p className="text-xs text-[#786D65]">Contatos / Newsletter</p>
                  <p className="text-2xl font-bold tabular-nums mt-1">
                    {data.contacts.length} / {data.newsletter.length}
                  </p>
                </div>
              </div>

              {isAdmin && (
                <div className="bg-white rounded-2xl border border-[#E7DFD3] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-[#1F1B18]">Limpeza de dados demonstrativos</h2>
                    <p className="text-xs text-[#524942] mt-1">
                      Remove os registros iniciais marcados como “(Exemplo)” quando você estiver pronto para publicar os dados reais.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearDemoData}
                    className="px-5 py-2.5 rounded-full border border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626] hover:text-white text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    Remover dados demonstrativos
                  </button>
                </div>
              )}

              {/* Recent Contacts */}
              <div className="bg-white rounded-2xl border border-[#E7DFD3] p-6 space-y-3">
                <h2 className="text-lg font-bold text-[#1F1B18]">Mensagens de contato recentes</h2>
                {data.contacts.length === 0 ? (
                  <p className="text-sm text-[#786D65]">Nenhuma mensagem recebida.</p>
                ) : (
                  <div className="divide-y divide-[#F3EDE3]">
                    {data.contacts.map((c) => (
                      <div key={c.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                        <div>
                          <p className="font-semibold text-[#1F1B18]">
                            {c.subject} · {c.name} ({c.email})
                          </p>
                          <p className="text-xs text-[#524942] mt-0.5">{c.message}</p>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch(`/api/admin/contacts/${c.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                status: c.status === 'Novo' ? 'Respondido' : 'Novo',
                              }),
                            });
                            loadDashboard();
                          }}
                          className="text-xs font-semibold px-3 py-1 rounded-full border border-[#D6CBB9] self-start"
                        >
                          {c.status}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DOGS & SPONSORSHIP */}
          {tab === 'dogs' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 space-y-6">
                <form
                  onSubmit={saveDog}
                  className="bg-white rounded-2xl border border-[#E7DFD3] p-6 space-y-3.5 text-sm"
                >
                  <h2 className="text-lg font-bold text-[#1F1B18]">
                    {editingDogId ? 'Editar cão' : 'Cadastrar novo cão'}
                  </h2>
                  <input
                    required
                    value={dogForm.name}
                    onChange={(e) => setDogForm({ ...dogForm, name: e.target.value })}
                    placeholder="Nome do cão *"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={dogForm.age_category}
                      onChange={(e) => setDogForm({ ...dogForm, age_category: e.target.value })}
                      className="px-3 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                    >
                      <option value="Filhote">Filhote</option>
                      <option value="Adulto">Adulto</option>
                      <option value="Idoso">Idoso</option>
                    </select>
                    <input
                      required
                      value={dogForm.age_label}
                      onChange={(e) => setDogForm({ ...dogForm, age_label: e.target.value })}
                      placeholder="Idade (ex: 2 anos) *"
                      className="px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={dogForm.size}
                      onChange={(e) => setDogForm({ ...dogForm, size: e.target.value })}
                      className="px-2.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                    >
                      <option value="Pequeno">Pequeno</option>
                      <option value="Médio">Médio</option>
                      <option value="Grande">Grande</option>
                    </select>
                    <select
                      value={dogForm.sex}
                      onChange={(e) => setDogForm({ ...dogForm, sex: e.target.value })}
                      className="px-2.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                    >
                      <option value="Macho">Macho</option>
                      <option value="Fêmea">Fêmea</option>
                    </select>
                    <select
                      value={dogForm.status}
                      onChange={(e) => setDogForm({ ...dogForm, status: e.target.value })}
                      className="px-2.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                    >
                      <option value="Disponível">Disponível</option>
                      <option value="Em processo">Em processo</option>
                      <option value="Em tratamento">Em tratamento</option>
                      <option value="Adotado">Adotado</option>
                    </select>
                  </div>
                  <input
                    required
                    value={dogForm.location}
                    onChange={(e) => setDogForm({ ...dogForm, location: e.target.value })}
                    placeholder="Localização (ex: São Paulo, SP) *"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                  />
                  <input
                    value={dogForm.personality}
                    onChange={(e) => setDogForm({ ...dogForm, personality: e.target.value })}
                    placeholder="Personalidade"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                  />
                  <textarea
                    rows={2}
                    value={dogForm.rescue_history}
                    onChange={(e) => setDogForm({ ...dogForm, rescue_history: e.target.value })}
                    placeholder="Histórico de resgate"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={dogForm.health_status}
                      onChange={(e) => setDogForm({ ...dogForm, health_status: e.target.value })}
                      placeholder="Estado de saúde"
                      className="px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                    />
                    <input
                      value={dogForm.vaccination}
                      onChange={(e) => setDogForm({ ...dogForm, vaccination: e.target.value })}
                      placeholder="Vacinação"
                      className="px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      value={dogForm.image_url}
                      onChange={(e) => setDogForm({ ...dogForm, image_url: e.target.value })}
                      placeholder="URL da fotografia"
                      className="flex-1 px-3 py-2 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-xs"
                    />
                    <label className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-[#D6CBB9] cursor-pointer text-xs font-semibold hover:bg-[#F3EDE3]">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload(f, (url) => setDogForm({ ...dogForm, image_url: url }));
                        }}
                      />
                    </label>
                  </div>

                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dogForm.sponsorship_active}
                      onChange={(e) => setDogForm({ ...dogForm, sponsorship_active: e.target.checked })}
                      className="accent-[#EA580C]"
                    />
                    <span>Habilitar para apadrinhamento</span>
                  </label>
                  {dogForm.sponsorship_active && (
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        value={dogForm.sponsorship_needs}
                        onChange={(e) => setDogForm({ ...dogForm, sponsorship_needs: e.target.value })}
                        placeholder="Necessidades mensais"
                        className="col-span-2 px-3 py-2 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-xs"
                      />
                      <input
                        type="number"
                        value={dogForm.sponsorship_amount_brl}
                        onChange={(e) => setDogForm({ ...dogForm, sponsorship_amount_brl: e.target.value })}
                        placeholder="R$/mês"
                        className="px-3 py-2 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-xs"
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-full bg-[#EA580C] text-white font-semibold"
                    >
                      {editingDogId ? 'Salvar alterações' : 'Cadastrar cão'}
                    </button>
                    {editingDogId && (
                      <button
                        type="button"
                        onClick={() => setEditingDogId(null)}
                        className="px-4 py-2.5 rounded-full border border-[#D6CBB9]"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>

                {/* Sponsorship Update Form */}
                <form
                  onSubmit={postDogUpdate}
                  className="bg-white rounded-2xl border border-[#E7DFD3] p-6 space-y-3 text-sm"
                >
                  <h2 className="text-base font-bold text-[#1F1B18]">Publicar atualização de apadrinhamento</h2>
                  <select
                    required
                    value={updateForm.dogId}
                    onChange={(e) => setUpdateForm({ ...updateForm, dogId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                  >
                    <option value="">Selecione o cão...</option>
                    {data.dogs.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <input
                    required
                    value={updateForm.title}
                    onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })}
                    placeholder="Título da atualização"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                  />
                  <textarea
                    required
                    rows={2}
                    value={updateForm.content}
                    onChange={(e) => setUpdateForm({ ...updateForm, content: e.target.value })}
                    placeholder="Novidades sobre saúde, passeios ou exames..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-[#15803D] text-white text-xs font-semibold"
                  >
                    Publicar atualização
                  </button>
                </form>
              </div>

              <div className="lg:col-span-7 space-y-3">
                {data.dogs.map((dog) => (
                  <div
                    key={dog.id}
                    className="bg-white rounded-2xl border border-[#E7DFD3] p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <img
                        src={dog.image_url}
                        alt={dog.name}
                        className="w-16 h-16 rounded-xl object-cover shrink-0 bg-[#EFE8DC]"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-[#1F1B18] truncate">{dog.name}</p>
                        <p className="text-xs text-[#786D65]">
                          {dog.age_label} · {dog.size} · {dog.location}
                        </p>
                        <p className={`text-xs mt-0.5 ${statusTextStyle(dog.status)}`}>{dog.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDogId(dog.id);
                          setDogForm({
                            name: dog.name,
                            age_category: dog.age_category,
                            age_label: dog.age_label,
                            size: dog.size,
                            sex: dog.sex,
                            personality: dog.personality,
                            rescue_history: dog.rescue_history,
                            health_status: dog.health_status,
                            vaccination: dog.vaccination,
                            location: dog.location,
                            status: dog.status,
                            image_url: dog.image_url,
                            sponsorship_active: dog.sponsorship_active === 1,
                            sponsorship_needs: dog.sponsorship_needs,
                            sponsorship_amount_brl: String((dog.sponsorship_amount_cents || 5000) / 100),
                          });
                        }}
                        className="px-3 py-1.5 rounded-full border border-[#D6CBB9] text-xs font-semibold"
                      >
                        Editar
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => deleteDog(dog.id)}
                          aria-label={`Excluir ${dog.name}`}
                          className="p-2 rounded-full text-[#DC2626] hover:bg-[#FEE2E2]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CAMPAIGNS */}
          {tab === 'campaigns' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <form
                onSubmit={saveCampaign}
                className="lg:col-span-5 bg-white rounded-2xl border border-[#E7DFD3] p-6 space-y-3.5 text-sm h-fit"
              >
                <h2 className="text-lg font-bold text-[#1F1B18]">
                  {editingCampaignId ? 'Editar campanha' : 'Publicar campanha'}
                </h2>
                <input
                  required
                  value={campaignForm.title}
                  onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
                  placeholder="Título da campanha *"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={campaignForm.category}
                    onChange={(e) => setCampaignForm({ ...campaignForm, category: e.target.value })}
                    className="px-3 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                  >
                    <option value="Alimentação">Alimentação</option>
                    <option value="Tratamento Veterinário">Tratamento Veterinário</option>
                    <option value="Resgate">Resgate</option>
                    <option value="Medicamentos">Medicamentos</option>
                    <option value="Construção de Abrigo">Construção de Abrigo</option>
                  </select>
                  <select
                    value={campaignForm.status}
                    onChange={(e) => setCampaignForm({ ...campaignForm, status: e.target.value })}
                    className="px-3 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                  >
                    <option value="Ativa">Ativa</option>
                    <option value="Concluída">Concluída</option>
                    <option value="Pausada">Pausada</option>
                  </select>
                </div>
                <input
                  type="number"
                  required
                  value={campaignForm.goal_brl}
                  onChange={(e) => setCampaignForm({ ...campaignForm, goal_brl: e.target.value })}
                  placeholder="Meta financeira (R$) *"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                />
                <input
                  value={campaignForm.summary}
                  onChange={(e) => setCampaignForm({ ...campaignForm, summary: e.target.value })}
                  placeholder="Resumo curto"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                />
                <textarea
                  rows={3}
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                  placeholder="Descrição completa da campanha"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                />
                <div className="flex items-center gap-2">
                  <input
                    value={campaignForm.image_url}
                    onChange={(e) => setCampaignForm({ ...campaignForm, image_url: e.target.value })}
                    placeholder="URL da imagem"
                    className="flex-1 px-3 py-2 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-xs"
                  />
                  <label className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-[#D6CBB9] cursor-pointer text-xs font-semibold">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileUpload(f, (url) => setCampaignForm({ ...campaignForm, image_url: url }));
                      }}
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-full bg-[#EA580C] text-white font-semibold"
                >
                  {editingCampaignId ? 'Atualizar campanha' : 'Publicar campanha'}
                </button>
              </form>

              <div className="lg:col-span-7 space-y-3">
                {data.campaigns.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white rounded-2xl border border-[#E7DFD3] p-5 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-xs text-[#786D65]">
                        {c.category} · <span className={statusTextStyle(c.status)}>{c.status}</span>
                      </p>
                      <p className="font-bold text-[#1F1B18]">{c.title}</p>
                      <p className="text-xs text-[#524942] mt-1 tabular-nums">
                        {formatBRL(c.raised_cents)} de {formatBRL(c.goal_cents)} · {c.supporters_count} apoiadores
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCampaignId(c.id);
                          setCampaignForm({
                            title: c.title,
                            category: c.category,
                            summary: c.summary,
                            description: c.description,
                            goal_brl: String(c.goal_cents / 100),
                            image_url: c.image_url,
                            status: c.status,
                          });
                        }}
                        className="px-3 py-1.5 rounded-full border border-[#D6CBB9] text-xs font-semibold"
                      >
                        Editar
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => deleteCampaign(c.id)}
                          className="p-2 rounded-full text-[#DC2626] hover:bg-[#FEE2E2]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DONATIONS */}
          {tab === 'donations' && (
            <div className="bg-white rounded-2xl border border-[#E7DFD3] overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="border-b border-[#E7DFD3] text-xs text-[#786D65]">
                  <tr>
                    <th className="py-3.5 px-4">Protocolo</th>
                    <th className="py-3.5 px-4">Doador</th>
                    <th className="py-3.5 px-4">Valor</th>
                    <th className="py-3.5 px-4">Meio</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Data</th>
                    {isAdmin && <th className="py-3.5 px-4 text-right">Ação</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3EDE3]">
                  {data.donations.map((d) => (
                    <tr key={d.id}>
                      <td className="py-3 px-4 font-mono text-xs">{d.protocol}</td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-[#1F1B18]">{d.donor_name}</p>
                        <p className="text-xs text-[#786D65]">{d.donor_email}</p>
                      </td>
                      <td className="py-3 px-4 font-semibold tabular-nums">{formatBRL(d.amount_cents)}</td>
                      <td className="py-3 px-4 uppercase text-xs">{d.payment_method}</td>
                      <td className={`py-3 px-4 text-xs ${statusTextStyle(d.status)}`}>
                        {translateDonationStatus(d.status)}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#786D65]">{formatDateBR(d.created_at)}</td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          {d.status !== 'confirmed' && (
                            <button
                              type="button"
                              onClick={() => confirmManualDonation(d.id)}
                              className="px-3 py-1 rounded-full bg-[#15803D] text-white text-xs font-semibold"
                            >
                              Confirmar recebimento
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {data.donations.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#786D65]">
                        Nenhuma doação registrada ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ADOPTIONS */}
          {tab === 'adoptions' && (
            <div className="space-y-4">
              {data.inquiries.length === 0 ? (
                <p className="text-sm text-[#786D65]">Nenhuma solicitação de adoção recebida.</p>
              ) : (
                data.inquiries.map((inq) => (
                  <div key={inq.id} className="bg-white rounded-2xl border border-[#E7DFD3] p-5 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-1 text-sm">
                      <p className="text-xs text-[#786D65]">
                        Interesse em <strong className="text-[#1F1B18]">{inq.dog_name}</strong> ·{' '}
                        {formatDateBR(inq.created_at)}
                      </p>
                      <p className="font-bold text-[#1F1B18]">
                        {inq.applicant_name} · {inq.city}
                      </p>
                      <p className="text-xs text-[#524942]">
                        {inq.applicant_email} · {inq.applicant_phone} · {inq.housing_type} (
                        {inq.has_fence_or_screens ? 'Com proteção/muro' : 'Sem proteção informada'})
                      </p>
                      <p className="text-xs text-[#524942] pt-1">Motivação: {inq.motivation}</p>
                    </div>
                    <select
                      value={inq.status}
                      onChange={async (e) => {
                        await fetch(`/api/admin/adoptions/${inq.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: e.target.value }),
                        });
                        loadDashboard();
                      }}
                      className="h-10 px-3 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-xs font-semibold self-start"
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Em análise">Em análise</option>
                      <option value="Aprovado">Aprovado</option>
                      <option value="Recusado">Recusado</option>
                    </select>
                  </div>
                ))
              )}
            </div>
          )}

          {/* VOLUNTEERS */}
          {tab === 'volunteers' && (
            <div className="space-y-4">
              {data.volunteers.length === 0 ? (
                <p className="text-sm text-[#786D65]">Nenhum voluntário cadastrado.</p>
              ) : (
                data.volunteers.map((v) => (
                  <div key={v.id} className="bg-white rounded-2xl border border-[#E7DFD3] p-5 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-1 text-sm">
                      <p className="font-bold text-[#1F1B18]">
                        {v.name} · {v.city} ({v.modality})
                      </p>
                      <p className="text-xs text-[#524942]">
                        {v.email} · {v.phone} · Disponibilidade: {v.availability}
                      </p>
                      <p className="text-xs text-[#786D65]">
                        Áreas: {JSON.parse(v.areas || '[]').join(', ')}
                      </p>
                    </div>
                    <select
                      value={v.status}
                      onChange={async (e) => {
                        await fetch(`/api/admin/volunteers/${v.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: e.target.value }),
                        });
                        loadDashboard();
                      }}
                      className="h-10 px-3 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-xs font-semibold self-start"
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>
                ))
              )}
            </div>
          )}

          {/* STORIES & COMMENTS */}
          {tab === 'stories' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <form
                onSubmit={saveStory}
                className="lg:col-span-5 bg-white rounded-2xl border border-[#E7DFD3] p-6 space-y-3.5 text-sm h-fit"
              >
                <h2 className="text-lg font-bold text-[#1F1B18]">Publicar nova história</h2>
                <input
                  required
                  value={storyForm.title}
                  onChange={(e) => setStoryForm({ ...storyForm, title: e.target.value })}
                  placeholder="Título *"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                />
                <select
                  value={storyForm.category}
                  onChange={(e) => setStoryForm({ ...storyForm, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                >
                  <option value="Resgate">Resgate</option>
                  <option value="Adoção">Adoção</option>
                  <option value="Bastidores">Bastidores</option>
                </select>
                <input
                  value={storyForm.excerpt}
                  onChange={(e) => setStoryForm({ ...storyForm, excerpt: e.target.value })}
                  placeholder="Resumo curto"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                />
                <textarea
                  required
                  rows={5}
                  value={storyForm.content}
                  onChange={(e) => setStoryForm({ ...storyForm, content: e.target.value })}
                  placeholder="Texto completo da história *"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                />
                <div className="flex items-center gap-2">
                  <input
                    value={storyForm.image_url}
                    onChange={(e) => setStoryForm({ ...storyForm, image_url: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-xs"
                  />
                  <label className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-[#D6CBB9] cursor-pointer text-xs font-semibold">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileUpload(f, (url) => setStoryForm({ ...storyForm, image_url: url }));
                      }}
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-full bg-[#EA580C] text-white font-semibold"
                >
                  Publicar história
                </button>
              </form>

              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white rounded-2xl border border-[#E7DFD3] p-6 space-y-3">
                  <h2 className="text-base font-bold text-[#1F1B18]">Moderação de comentários</h2>
                  {data.comments.length === 0 ? (
                    <p className="text-xs text-[#786D65]">Nenhum comentário enviado.</p>
                  ) : (
                    data.comments.map((cm) => (
                      <div key={cm.id} className="border-t border-[#F3EDE3] pt-3 flex items-start justify-between gap-4 text-xs">
                        <div>
                          <p className="font-semibold text-[#1F1B18]">
                            {cm.author_name} em “{cm.story_title}” ·{' '}
                            <span className={statusTextStyle(cm.status || 'pending')}>{cm.status}</span>
                          </p>
                          <p className="text-[#524942] mt-1">{cm.content}</p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={async () => {
                              await fetch(`/api/admin/comments/${cm.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'approved' }),
                              });
                              loadDashboard();
                            }}
                            className="px-2.5 py-1 rounded-full bg-[#15803D] text-white font-semibold"
                          >
                            Aprovar
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await fetch(`/api/admin/comments/${cm.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'rejected' }),
                              });
                              loadDashboard();
                            }}
                            className="px-2.5 py-1 rounded-full border border-[#DC2626] text-[#DC2626] font-semibold"
                          >
                            Rejeitar
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-3">
                  {data.stories.map((st) => (
                    <div key={st.id} className="bg-white rounded-2xl border border-[#E7DFD3] p-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs text-[#786D65]">{st.category} · {formatDateBR(st.published_at)}</p>
                        <p className="font-bold text-sm text-[#1F1B18]">{st.title}</p>
                      </div>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch(`/api/stories/${st.id}`, { method: 'DELETE' });
                            loadDashboard();
                          }}
                          className="p-2 text-[#DC2626] hover:bg-[#FEE2E2] rounded-full"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* FINANCE & TRANSPARENCY (ADMIN ONLY) */}
          {tab === 'finance' && isAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <form
                  onSubmit={saveExpense}
                  className="bg-white rounded-2xl border border-[#E7DFD3] p-6 space-y-3 text-sm"
                >
                  <h2 className="text-lg font-bold text-[#1F1B18]">Lançar despesa verificada</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                      className="px-3 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                    >
                      <option value="Veterinário">Veterinário</option>
                      <option value="Alimentação">Alimentação</option>
                      <option value="Medicamentos">Medicamentos</option>
                      <option value="Resgates">Resgates</option>
                      <option value="Infraestrutura">Infraestrutura</option>
                    </select>
                    <input
                      type="date"
                      required
                      value={expenseForm.expense_date}
                      onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                      className="px-3 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                    />
                  </div>
                  <input
                    required
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    placeholder="Descrição da despesa (ex: Nota fiscal ração 150kg) *"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                  />
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={expenseForm.amount_brl}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount_brl: e.target.value })}
                    placeholder="Valor em R$ *"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      value={expenseForm.receipt_url}
                      onChange={(e) => setExpenseForm({ ...expenseForm, receipt_url: e.target.value })}
                      placeholder="URL ou arquivo do comprovante"
                      className="flex-1 px-3 py-2 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-xs"
                    />
                    <label className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-[#D6CBB9] cursor-pointer text-xs font-semibold">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Anexar</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload(f, (url) => setExpenseForm({ ...expenseForm, receipt_url: url }));
                        }}
                      />
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-[#EA580C] text-white font-semibold"
                  >
                    Registrar despesa
                  </button>
                </form>

                <div className="space-y-2">
                  {data.expenses.map((ex) => (
                    <div key={ex.id} className="bg-white rounded-xl border border-[#E7DFD3] p-4 flex justify-between items-center text-sm">
                      <div>
                        <p className="font-semibold">{ex.category} · {ex.description}</p>
                        <p className="text-xs text-[#786D65]">{formatDateBR(ex.expense_date)} · {formatBRL(ex.amount_cents)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await fetch(`/api/admin/expenses/${ex.id}`, { method: 'DELETE' });
                          loadDashboard();
                        }}
                        className="text-[#DC2626] p-1.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <form
                  onSubmit={saveReport}
                  className="bg-white rounded-2xl border border-[#E7DFD3] p-6 space-y-3 text-sm"
                >
                  <h2 className="text-lg font-bold text-[#1F1B18]">Publicar relatório financeiro</h2>
                  <input
                    required
                    value={reportForm.title}
                    onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                    placeholder="Título (ex: Prestação de Contas Outubro/2026) *"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                  />
                  <input
                    required
                    value={reportForm.period}
                    onChange={(e) => setReportForm({ ...reportForm, period: e.target.value })}
                    placeholder="Período (ex: Outubro 2026) *"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                  />
                  <textarea
                    rows={2}
                    value={reportForm.summary}
                    onChange={(e) => setReportForm({ ...reportForm, summary: e.target.value })}
                    placeholder="Resumo executivo do período"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      required
                      value={reportForm.document_url}
                      onChange={(e) => setReportForm({ ...reportForm, document_url: e.target.value })}
                      placeholder="Link ou upload do PDF *"
                      className="flex-1 px-3 py-2 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-xs"
                    />
                    <label className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-[#D6CBB9] cursor-pointer text-xs font-semibold">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload PDF</span>
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload(f, (url) => setReportForm({ ...reportForm, document_url: url }));
                        }}
                      />
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-[#15803D] text-white font-semibold"
                  >
                    Publicar relatório
                  </button>
                </form>

                <div className="space-y-2">
                  {data.reports.map((rep) => (
                    <div key={rep.id} className="bg-white rounded-xl border border-[#E7DFD3] p-4 flex justify-between items-center text-sm">
                      <div>
                        <p className="font-semibold">{rep.title}</p>
                        <p className="text-xs text-[#786D65]">{rep.period}</p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await fetch(`/api/admin/reports/${rep.id}`, { method: 'DELETE' });
                          loadDashboard();
                        }}
                        className="text-[#DC2626] p-1.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TEAM & SETTINGS (ADMIN ONLY) */}
          {tab === 'team' && isAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <form
                  onSubmit={createUser}
                  className="bg-white rounded-2xl border border-[#E7DFD3] p-6 space-y-3 text-sm"
                >
                  <h2 className="text-lg font-bold text-[#1F1B18] flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Adicionar membro da equipe</span>
                  </h2>
                  <input
                    required
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    placeholder="Nome *"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                  />
                  <input
                    type="email"
                    required
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    placeholder="E-mail *"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                      placeholder="Senha (mín. 8 caracteres) *"
                      className="px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                    />
                    <select
                      value={newUserForm.role}
                      onChange={(e) =>
                        setNewUserForm({ ...newUserForm, role: e.target.value as 'admin' | 'collaborator' })
                      }
                      className="px-3 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                    >
                      <option value="collaborator">Colaborador</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-[#EA580C] text-white font-semibold"
                  >
                    Criar acesso
                  </button>
                </form>

                <div className="bg-white rounded-2xl border border-[#E7DFD3] p-6 space-y-3">
                  <h3 className="text-base font-bold text-[#1F1B18]">Usuários e permissões</h3>
                  {data.users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between border-t border-[#F3EDE3] pt-3 text-sm">
                      <div>
                        <p className="font-semibold text-[#1F1B18]">{u.name}</p>
                        <p className="text-xs text-[#786D65]">
                          {u.email} · {u.role === 'admin' ? 'Administrador' : 'Colaborador'}
                        </p>
                      </div>
                      {u.id !== user?.id && (
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch(`/api/admin/users/${u.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ active: u.active !== 1 }),
                            });
                            loadDashboard();
                          }}
                          className="text-xs font-semibold px-3 py-1 rounded-full border border-[#D6CBB9]"
                        >
                          {u.active === 1 ? 'Ativo' : 'Desativado'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <form
                onSubmit={saveSettings}
                className="bg-white rounded-2xl border border-[#E7DFD3] p-6 space-y-3.5 text-sm h-fit"
              >
                <h2 className="text-lg font-bold text-[#1F1B18]">Configurações da plataforma</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#786D65] mb-1">WhatsApp (somente números)</label>
                    <input
                      value={settingsForm.whatsapp_number || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp_number: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#786D65] mb-1">Botão flutuante WhatsApp</label>
                    <select
                      value={settingsForm.whatsapp_enabled || '1'}
                      onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp_enabled: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                    >
                      <option value="1">Ativado</option>
                      <option value="0">Desativado</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#786D65] mb-1">Mensagem padrão do WhatsApp</label>
                  <input
                    value={settingsForm.whatsapp_message || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp_message: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#786D65] mb-1">E-mail de contato</label>
                    <input
                      value={settingsForm.contact_email || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, contact_email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#786D65] mb-1">Cidade / Região</label>
                    <input
                      value={settingsForm.city_label || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, city_label: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#786D65] mb-1">Instagram URL</label>
                  <input
                    value={settingsForm.instagram_url || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, instagram_url: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#786D65] mb-1">Missão (página Sobre Nós)</label>
                  <textarea
                    rows={2}
                    value={settingsForm.about_mission || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, about_mission: e.target.value, about_is_demo: '0' })}
                    className="w-full px-3 py-2 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#786D65] mb-1">História institucional</label>
                  <textarea
                    rows={2}
                    value={settingsForm.about_history || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, about_history: e.target.value, about_is_demo: '0' })}
                    className="w-full px-3 py-2 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#1F1B18] text-white font-semibold"
                >
                  Salvar configurações
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}
