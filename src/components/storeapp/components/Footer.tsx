import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import TikTokIcon from '@mui/icons-material/MusicNote';
import { useSelector } from "@/store/Store";
import { IconPhone, IconMail, IconMapPin, IconChevronRight } from '@tabler/icons-react';
import { t } from "../../../../lib/translationHelper";

type Props = {
  keys: { text: string; translation: string }[];
};

export default function Footer({ keys }: Props) {
  const selectedLocation = useSelector((state) => state.selectedLocation).selectedLocation;

  return (
    <>
      <footer className="bg-black text-white px-6 py-10">
        <div className="mx-[10px] lg:mx-[60px] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="mb-3">
              <img
                src="/images/logos/white_logo.svg"
                alt={t("the_nail_bar_logo", keys)}
                className="w-40"
              />
            </div>
            <p className="text-sm">
              {t("a_special_place_to_feel_your_best", keys)} {t("enjoy_perfect_nails_at_the_nail_bar_by_mattie", keys)}
            </p>
          </div>

          <div>
            <h3 className="font-bold uppercase mb-3">{t("info", keys)}</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <IconMapPin className="w-5 h-5" />
                {`${selectedLocation?.street}, ${selectedLocation?.city}, ${selectedLocation?.state} ${selectedLocation?.postcode}, ${selectedLocation?.country}`}
              </li>
              <li className="flex items-start gap-2">
                <IconMail className="w-5 h-5" /> {selectedLocation?.location_email}
              </li>
              <li className="flex items-start gap-2">
                <IconPhone className="w-5 h-5" /> {selectedLocation?.location_phone}
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold uppercase mb-3">{t("links", keys)}</h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: t('our_story', keys), href: '#' },
                { label: t('services', keys), href: '#services' },
                { label: t('faqs', keys), href: '#faqs' },
                { label: t('contact_us', keys), href: '#contactus' },
                { label: t('refund_policy', keys), href: '#' },
                { label: t('terms_and_conditions', keys), href: '#' },
              ].map(({ label, href }) => (
                <li key={label} className="flex items-center gap-2 transition-all duration-300">
                  <IconChevronRight className="w-5 h-5" />
                  <a
                    href={href}
                    className="hover:translate-x-1 hover:text-pink-300 transition-all duration-300 cursor-pointer"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold uppercase mb-3">{t("get_in_touch", keys)}</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 hover:text-rose-400 transition-colors duration-300">
                <FacebookIcon className="w-5 h-5" /> {t("facebook", keys)}
              </li>
              <li className="flex items-center gap-2 hover:text-rose-400 transition-colors duration-300">
                <InstagramIcon className="w-5 h-5" /> {t("instagram", keys)}
              </li>
              <li className="flex items-center gap-2 hover:text-rose-400 transition-colors duration-300">
                <YouTubeIcon className="w-5 h-5" /> {t("youtube", keys)}
              </li>
              <li className="flex items-center gap-2 hover:text-rose-400 transition-colors duration-300">
                <TikTokIcon className="w-5 h-5" /> {t("tiktok", keys)}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white mt-10 pt-4 opacity-30" />
        <div className="text-center text-sm">
          {t("copyright_2025_the_nail_bar_by_mattie", keys)}
        </div>
      </footer>
      <div className="bg-[#6E082F] h-2 w-full" />
    </>
  );
}
