import { Button } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import { useSelector } from "@/store/Store";
import { useRouter } from "next/router";
import { t } from "../../../../lib/translationHelper";
type Props = {
  keys: { text: string; translation: string }[];
};

export default function HeroSection({ keys }: Props) {
  const router = useRouter();
  const selectedLocation = useSelector((state) => state.selectedLocation).selectedLocation;

  return (
    <section
      id="home"
      className="relative snap-start overflow-hidden
        h-[60vh] md:h-[75vh] lg:h-[85vh] xl:h-screen"
    >
      <div className="absolute inset-0 -z-10 object-cover-img">
        <img
          src="/images/heroImage.jpg"
          alt="Hero background"
          loading="lazy"
          className="w-full h-full object-cover select-none"
        />
      </div>

      <div className="relative z-10 h-full flex flex-col justify-center px-8 text-white
        md:items-start md:pl-20
        items-center
        text-center md:text-left
      ">
        <h1
          className="mb-8 max-w-3xl leading-tight tracking-wide drop-shadow-lg
          text-3xl sm:text-4xl lg:text-5xl font-semibold bg-gradient-to-br from-white to-[#676767] bg-clip-text text-transparent"
        >
          {t("experience_the_art_of_elegant_nails", keys)} <span className='font-["Newsreader",serif] italic'>{t("at_juliet_nail_salon", keys)}</span>
        </h1>

        <p
          className="max-w-2xl mb-6 text-sm sm:text-base lg:text-lg text-white/85 drop-shadow-md leading-relaxed"
        >
          {t("we_invite_you_to_enjoy_personalized_nail_care", keys)}
        </p>

        <div className="flex flex-col mt-2 md:mt-8 sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0 justify-center md:justify-start w-full max-w-sm">
          <Button
            variant="outlined"
            size="medium"
            fullWidth
            onClick={() =>
              router.push("/julietnails/appointments")
            }
            sx={{
              backgroundColor: 'white',
              color: 'black',
              borderRadius: "0px",
              '&:hover': {
                borderColor: '#6E082F',
              },
            }}
          >
            {t("book_now", keys)}
          </Button>

          <Button
            variant="outlined"
            size="medium"
            fullWidth
            startIcon={<PhoneIcon />}
            sx={{
              color: 'white',
              borderColor: 'white',
              borderRadius: "0px",
              '&:hover': {
                backgroundColor: '#ffffff',
                borderColor: '#ffffff',
                color: 'black',
                '& .MuiSvgIcon-root': {
                  color: 'black',
                },
              },
              '& .MuiSvgIcon-root': {
                color: 'white',
              },
            }}
          >
            {selectedLocation?.location_phone}
          </Button>
        </div>
      </div>
    </section>
  );
}
