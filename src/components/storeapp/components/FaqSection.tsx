"use client";
import { useState } from "react";
import { IconPlus, IconMinus } from "@tabler/icons-react";
import { t } from "../../../../lib/translationHelper";

type Props = {
  keys: { text: string; translation: string }[];
};

const faqData = [
  {
    question: "how_do_i_book_an_appointment",
    answer:
      "simply_visit_our_website_choose_your_preferred_service_select_a_date_and_time_and_confirm_your_booking_online",
  },
  {
    question: "can_i_choose_a_specific_nail_technician",
    answer:
      "yes_during_the_booking_process_you_can_select_your_preferred_nail_technician_based_on_availability",
  },
  {
    question: "can_i_reschedule_or_cancel_my_appointment",
    answer:
      "yes_you_can_easily_reschedule_or_cancel_your_appointment_from_your_account_dashboard_as_long_as_its_within_our_policy_window",
  },
  {
    question: "will_i_receive_a_confirmation_after_booking",
    answer:
      "absolutely_you_will_receive_a_confirmation_email_and_optionally_a_text_reminder_before_your_appointment",
  },
  {
    question: "what_if_i_arrive_late_or_miss_my_appointment",
    answer:
      "please_inform_us_as_soon_as_possible_late_arrivals_may_result_in_shortened_service_time_or_rescheduling_based_on_availability",
  },
  {
    question: "are_walk_ins_accepted_or_is_booking_required",
    answer:
      "while_walk_ins_are_welcome_we_recommend_booking_in_advance_to_ensure_your_preferred_time_and_technician_are_available",
  },
];

export default function FaqSection({ keys }: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleIndex = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div id="faqs" className="my-[60px] mx-[10px] lg:m-[60px] px-4">
      <div className="flex flex-col md:flex-row gap-4 lg:gap-16">
        <div className="md:w-1/2">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t("frequently_asked_questions", keys)}
          </h2>
          <p className="text-gray-700 text-lg mb-2">
            {t("got_questions_about_brandname", keys)}
          </p>
          <p className="text-gray-600">
            {t(
              "weve_compiled_answers_to_common_inquiries_to_help_you_get_the_most_out_of_our_platform",
              keys
            )}
          </p>
        </div>

        <div className="md:w-1/2">
          {faqData.map((faq, index) => (
            <div key={index} className="border-b border-gray-300 py-4">
              <button
                onClick={() => toggleIndex(index)}
                className="flex items-center justify-between w-full text-left"
              >
                <span className="text-base font-medium text-gray-900">
                  {t(faq.question, keys)}
                </span>
                <span className="text-xl text-gray-700 transition-transform duration-300">
                  {expandedIndex === index ? <IconMinus /> : <IconPlus />}
                </span>
              </button>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedIndex === index ? "max-h-[200px] mt-3" : "max-h-0"
                }`}
              >
                <p className="text-gray-600 text-sm">
                  {t(faq.answer, keys)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
