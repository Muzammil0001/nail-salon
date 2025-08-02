import React from 'react';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import { formatNumberWithUnit } from '../../../../lib/formatNumberWithUnit';
import { useRouter } from "next/router";
import { t } from "../../../../lib/translationHelper";

type Props = {
  keys: { text: string; translation: string }[];
};

const FactsSection = ({ keys }: Props) => {
  const router = useRouter();
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  const facts = [
    { label: t('appointments_booked', keys), value: 150000 },
    { label: t('happy_clients', keys), value: 35000 },
    { label: t('average_rating', keys), value: 4.8, rawNumber: true },
    { label: t('year_launched', keys), value: 2025, rawNumber: true },
  ];

  return (
    <div
      ref={ref}
      className="bg-[#6E082F] rounded-2xl shadow-lg px-14 py-12 flex flex-col lg:flex-row justify-between items-start lg:items-center 
             mx-[10px] lg:mx-[60px] my-2 lg:my-28"
    >
      <div className="flex flex-col items-start  mb-4 lg:mb-0">
        <h2 className="text-2xl font-bold text-white mb-2">
          {t('your_perfect_nails_just_one_click_away', keys)}
        </h2>
        <p className="text-gray-300 text-lg mb-6 lg:w-2/3">
          {t('discover_trusted_salons_real_time_availability_and_instant_booking', keys)}
        </p>
        <button
          onClick={() =>
            router.push("/julietnails/appointments")
          }
          className="bg-white mt-4 text-black px-6 py-3 rounded-full flex items-center gap-2 hover:bg-gray-200 transition">
          {t('get_started_now', keys)} <span aria-hidden="true">↗</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-36 gap-y-10 ">
        {facts.map(({ label, value, rawNumber }) => (
          <div key={label}>
            <p className="text-3xl font-bold text-green-400">
              {rawNumber ? (
                value
              ) : (
                <CountUp
                  start={0}
                  end={inView ? value : 0}
                  duration={2.5}
                  separator=","
                  formattingFn={formatNumberWithUnit}
                />
              )}
            </p>
            <p className="text-gray-300">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FactsSection;
