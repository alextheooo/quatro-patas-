import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { DonatePage } from './pages/DonatePage';
import { DonationConfirmationPage } from './pages/DonationConfirmationPage';
import { AdoptionCatalogPage } from './pages/AdoptionCatalogPage';
import { DogDetailPage } from './pages/DogDetailPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { CampaignDetailPage } from './pages/CampaignDetailPage';
import { SponsorshipPage } from './pages/SponsorshipPage';
import { VolunteerPage } from './pages/VolunteerPage';
import { StoriesPage } from './pages/StoriesPage';
import { StoryDetailPage } from './pages/StoryDetailPage';
import { TransparencyPage } from './pages/TransparencyPage';
import { ContactPage, PrivacyPage } from './pages/ContactAndPrivacyPages';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';

function NotFoundPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
      <h1 className="text-3xl font-bold text-[#1F1B18]">Página não encontrada</h1>
      <p className="text-sm text-[#524942]">
        O endereço acessado não existe ou foi movido.
      </p>
      <Link
        to="/"
        className="inline-block px-6 py-3 rounded-full bg-[#EA580C] text-white text-sm font-semibold"
      >
        Voltar ao início
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/sobre" element={<AboutPage />} />
            <Route path="/doar" element={<DonatePage />} />
            <Route path="/doar/confirmacao" element={<DonationConfirmationPage />} />
            <Route path="/adocao" element={<AdoptionCatalogPage />} />
            <Route path="/adocao/:id" element={<DogDetailPage />} />
            <Route path="/campanhas" element={<CampaignsPage />} />
            <Route path="/campanhas/:id" element={<CampaignDetailPage />} />
            <Route path="/apadrinhar" element={<SponsorshipPage />} />
            <Route path="/voluntariado" element={<VolunteerPage />} />
            <Route path="/historias" element={<StoriesPage />} />
            <Route path="/historias/:id" element={<StoryDetailPage />} />
            <Route path="/transparencia" element={<TransparencyPage />} />
            <Route path="/contato" element={<ContactPage />} />
            <Route path="/privacidade" element={<PrivacyPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
}
