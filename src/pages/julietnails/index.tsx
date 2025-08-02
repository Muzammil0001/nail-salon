import NavBar from "@/components/storeapp/components/NavBar";
import HeroSection from '@/components/storeapp/components/HeroSection';
import AboutUsSection from '@/components/storeapp/components/AboutUsSection';
import ContactSection from '@/components/storeapp/components/ContactSection';
import FindUsSection from '@/components/storeapp/components/FindUsSection';
import Footer from '@/components/storeapp/components/Footer';
import FaqSection from "@/components/storeapp/components/FaqSection";
import FactsSection from "@/components/storeapp/components/FactsStateSection";
import CategoriesSection from "@/components/storeapp/components/CategoriesSection";
import { useSelector } from "@/store/Store";
import CategoryServices from "./category-services";
import axios from "axios";
import { useState, useEffect } from "react";

const Home = () => {
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const language_id = localStorage.getItem("language_id");
        const response = await axios.post("/api/app-translation/fetchbypagename", {
          language_id,
          page_name: "landingpage",
        });
        setKeys(response.data);
      } catch (error) {
        console.error("Error fetching translations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTranslations();
  }, [languageUpdate]);

  if (loading) return null;

  return (
    <main className="overflow-y-auto scroll-smooth">
      <NavBar keys={keys} />
      <HeroSection keys={keys} />
      <CategoriesSection keys={keys} />
      <FindUsSection keys={keys} />
      <FactsSection keys={keys} />
      <FaqSection keys={keys} />
      <ContactSection keys={keys} />
      <Footer keys={keys} />
    </main>
  );
};

Home.layout = "Blank";
export default Home;
