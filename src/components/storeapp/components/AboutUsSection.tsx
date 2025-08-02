import { t } from "../../../../lib/translationHelper";
type Props = {
  keys: { text: string; translation: string }[];
};
export default function AboutUsSection({ keys }: Props) {
  return (
    <section
      id="about"
      className="snap-start flex justify-center p-10 bg-gray-50"
    >
      <div className="max-w-3xl bg-white rounded-xl shadow-lg p-8 text-center">
        <h2 className="text-4xl font-bold text-pink-700 mb-5 uppercase tracking-wide">
          {t("about_us", keys)}
        </h2>
        <p className="text-gray-700 text-lg leading-relaxed">
          {t(
            "juliet_nail_salon_has_been_a_sanctuary_of_beauty_and_self_care_for_over_5_years_our_expert_team_is_passionate_about_making_every_client_feel_confident_relaxed_and_radiant",
            keys
          )}
        </p>
      </div>
    </section>
  );
}
