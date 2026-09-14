import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { HomePage } from "@/pages/HomePage";
import { PageView } from "@/pages/PageView";
import { NewsListPage } from "@/pages/NewsListPage";
import { NewsDetailPage } from "@/pages/NewsDetailPage";
import { ContactPage } from "@/pages/ContactPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { DrivingRangePage } from "@/pages/golf/DrivingRangePage";
import { GolfAcademyPage } from "@/pages/golf/GolfAcademyPage";
import { TrainersPage } from "@/pages/golf/TrainersPage";
import { BodyStudioTrainersPage } from "@/pages/body-studio/BodyStudioTrainersPage";
import { HopsalkovParkPage } from "@/pages/hopsalkov/HopsalkovParkPage";
import { HopsalkovBirthdaysPage } from "@/pages/hopsalkov/HopsalkovBirthdaysPage";
import { HopsalkovPricingPage } from "@/pages/hopsalkov/HopsalkovPricingPage";
import { HopsalkovCampsPage } from "@/pages/hopsalkov/HopsalkovCampsPage";
import { HopsalkovRulesPage } from "@/pages/hopsalkov/HopsalkovRulesPage";
import { ResultsPage } from "@/pages/results/ResultsPage";
import { TvBoardPage } from "@/pages/tv/TvBoardPage";
import { AdminLoginPage } from "@/pages/admin/AdminLoginPage";
import { AdminLayout } from "@/pages/admin/AdminLayout";
import { AdminPromosPage } from "@/pages/admin/AdminPromosPage";
import { AdminRoundsPage } from "@/pages/admin/AdminRoundsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const pageRoutes = [
  "golfovy-simulator",
  "cenik",
  "golf-club-ksirovka",
  "junior-golf-academy",
  "jak-zacit",
  "tabory-a-golfove-kempy",
  "akce-a-oslavy-s-golfem",
  "fotogalerie-5",
  "fotogalerie-3",
  "body-studio-ksirovka",
  "pilates-reformer-1",
  "rozvrh",
  "power-plate",
  "solarium",
  "cenik-4",
  "masaze",
  "charakteristika-hry-1",
  "cenik-2",
  "pravidla-1",
  "fotogalerie-4",
  "charakteristika-hry",
  "cenik-1",
  "pravidla",
  "akce-a-oslavy-na-fotbalgolfu",
  "fotogalerie-1",
  "popis",
  "napojovy-listek-cenik",
  "fotogalerie-2",
  "teambuildingy-a-firemni-akce",
  "vanocni-vecirky",
  "rozlucky-se-svobodou",
  "oslavy",
  "svatby",
  "detske-oslavy",
  "fotogalerie-6",
  "foto",
  "video",
  "provozni-doba",
  "ke-stazeni",
];

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="tv" element={<TvBoardPage />} />
          <Route path="admin/login" element={<AdminLoginPage />} />
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminPromosPage />} />
            <Route path="kola" element={<AdminRoundsPage />} />
          </Route>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="novinky" element={<NewsListPage />} />
            <Route path="vysledky" element={<ResultsPage />} />
            <Route path="novinky/:slug" element={<NewsDetailPage />} />
            <Route path="kontakt" element={<ContactPage />} />
            <Route path="driving-range" element={<DrivingRangePage />} />
            <Route path="golfova-akademie" element={<GolfAcademyPage />} />
            <Route path="treneri" element={<TrainersPage />} />
            <Route path="treneri-1" element={<BodyStudioTrainersPage />} />
            <Route path="park-sportu-a-zabavy" element={<HopsalkovParkPage />} />
            <Route path="narozeninove-oslavy" element={<HopsalkovBirthdaysPage />} />
            <Route path="cenik-3" element={<HopsalkovPricingPage />} />
            <Route path="primestske-tabory" element={<HopsalkovCampsPage />} />
            <Route path="provozni-rad" element={<HopsalkovRulesPage />} />
            {pageRoutes.map((slug) => (
              <Route key={slug} path={slug} element={<PageView />} />
            ))}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
