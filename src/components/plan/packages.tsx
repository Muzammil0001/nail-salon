import { useEffect, useState } from "react";
import { Box, Button, Dialog, DialogContent, Typography } from "@mui/material";
import { useRouter } from "next/router";
import axios from "axios";
import { toast } from "sonner";
import { IconCircleCheck, IconCircleX, IconX } from "@tabler/icons-react";
import Logo from "@/layouts/full/shared/logo/Logo";
import Loader from "../loader/Loader";
import { getClientEnv } from "../../../lib/getClientEnv";
import Checkout from "../signup/Checkout";
import Image from "next/image";
import moment from "moment";
import PurchaseHistory from "./PurchaseHistory";
import { checkAccess } from "../../../lib/clientExtras";
import { AccessRights2 } from "@/types/admin/types";
import { ToastErrorMessage } from "../common/ToastMessages";
import CustomSwitch from "../switches/CustomSwitch";
import { t } from "../../../lib/translationHelper";
import { useSelector } from "@/store/Store";

const Payment = ({ session }: { session: any }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Record<string, any>[]>([]);
  const [features, setFeatures] = useState<Record<string, any>[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [billingModel, setBillingModel] = useState("MONTHLY");
  const [vat, setVat] = useState(25);
  const [open, setOpen] = useState(false);
  const [openSucces, setOpenSuccess] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  const languageUpdate = useSelector((state) => state.language.languageUpdate);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "plans" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translations:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);
  const [openTransactions, setOpenTransactions] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post("/api/subscription/getfeatures");
        setFeatures(response.data.features);
        const response2 = await axios.post(
          "/api/subscription/getsubscriptions",
          { fetchAll: true }
        );
        setPlans(response2.data);
        const plan = response2.data.find(
          (p: any) => p.id === session.user.subscription_id
        );
        setCurrentPlan(plan);
        const vat = await getClientEnv("VAT");
        setVat(vat ? parseInt(vat) : 0);
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  const calculateTotal = () => {
    if (billingModel === "MONTHLY") {
      return (selectedPlan.price + selectedPlan.price * (vat / 100)).toFixed(2);
    }
    return (
      selectedPlan.yearly_price +
      selectedPlan.yearly_price * (vat / 100)
    ).toFixed(2);
  };
  const handleSubmit = async (cardSession: any) => {
    try {
      setLoading(true);
      await axios.post("/api/plans/updateplan", {
        cardSession,
        billingModel,
        vat,
        selectedPlan,
        price: calculateTotal(),
        base_price:
          billingModel === "MONTHLY"
            ? selectedPlan.price
            : selectedPlan.yearly_price,
        vat_amount: (selectedPlan.price * (vat / 100)).toFixed(2),
      });
      setOpen(false);
      setOpenSuccess(true);
    } catch (error) {
      ToastErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };

  const sortedPlans = [...plans].sort((a, b) => {
    const priceA = billingModel === "MONTHLY" ? a.price : a.yearly_price;
    const priceB = billingModel === "MONTHLY" ? b.price : b.yearly_price;
    return priceA - priceB;
  });

  const prices = sortedPlans.map((plan) =>
    billingModel === "MONTHLY" ? plan.price : plan.yearly_price
  );
  const allPricesEqual = prices.every((price) => price === prices[0]);

  const uniquePrices = [...new Set(prices)].sort((a, b) => b - a);
  const highestPrice = uniquePrices[0];
  const secondHighestPrice = uniquePrices[1];

  const currentPlanPrice =
    billingModel === "MONTHLY" ? currentPlan?.price : currentPlan?.yearly_price;
  let currentPlanImage = "/images/logos/basicPlanLogo.png";
  if (allPricesEqual) {
    currentPlanImage = "/images/logos/premiumPlanLogo.png";
  } else if (currentPlanPrice === highestPrice) {
    currentPlanImage = "/images/logos/premiumPlanLogo.png";
  } else if (currentPlanPrice === secondHighestPrice) {
    currentPlanImage = "/images/logos/goldPlanLogo.png";
  }

  return (
    <Box className="">
      <PurchaseHistory open={openTransactions} setOpen={setOpenTransactions} />
      {currentPlan && openDetails && (
        <Dialog
          open={openDetails}
          fullWidth
          maxWidth="xs"
          sx={{
            "& .MuiBackdrop-root": {
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(5px)",
            },
          }}
        >
          <DialogContent>
            <Box className="space-y-2 text-nowrap flex flex-col gap-4 items-center">
              <Typography className="font-bold text-[1.1rem] flex gap-1 text-primary-main">
                {currentPlan.name}
              </Typography>
              <Image
                src={currentPlanImage}
                alt="plan"
                width={100}
                height={100}
              />
              <Typography className="font-bold text-[1.1rem] flex gap-1 text-primary-main">
                {session.user.billing_model === "MONTHLY" ? (
                  <>
                    {currentPlan.price}€{" "}
                    <Typography className="text-sm font-bold">
                      /{t("monthly", keys)}
                    </Typography>
                  </>
                ) : (
                  <>
                    {currentPlan.yearly_price}€{" "}
                    <Typography className="text-sm font-bold">
                      /{t("yearly", keys)}
                    </Typography>
                  </>
                )}
              </Typography>
              <Box className="space-y-2">
                {features
                  .filter((f) =>
                    currentPlan.subscription_feature.includes(f.id)
                  )
                  .map((f) => (
                    <Box key={f.id} className="flex items-center gap-1">
                      <IconCircleCheck className="text-primary-main" />
                      <Typography>{f.name}</Typography>
                    </Box>
                  ))}
                {features
                  .filter(
                    (f) => !currentPlan.subscription_feature.includes(f.id)
                  )
                  .map((f) => (
                    <Box key={f.id} className="flex items-center gap-1">
                      <IconCircleX className="text-red-500" />
                      <Typography>{f.name}</Typography>
                    </Box>
                  ))}
              </Box>
              <Button
                onClick={() => setOpenDetails(false)}
                variant="contained"
                className="w-full mb-8"
                sx={{
                  height: "56px",
                  fontSize: "16px",
                  ":hover": { opacity: "90%" },
                }}
                color="primary"
              >
                {t("close", keys)}
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      )}
      <Loader loading={loading} />
      <Dialog
        sx={{
          "& .MuiPaper-root": {
            borderRadius: "24px",
          },
          "& .MuiBackdrop-root": {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(5px)",
          },
        }}
        open={openSucces}
        fullWidth
        maxWidth="sm"
      >
        <DialogContent className="py-12">
          <Box className="flex flex-col gap-4 justify-center items-center">
            <IconCircleCheck size={60} className="text-primary-main" />
            <Typography className="text-2xl font-bold">
              🎊Your payment has been received!
            </Typography>
            <Typography>
              Thank you for your payment. You have purchased the{" "}
              {selectedPlan?.name} plan. <br />
              Please check your email for a payment confirmation and invoice.
            </Typography>
            <Button
              onClick={() => window.location.reload()}
              variant="contained"
              className="px-8"
              sx={{
                height: "56px",
                fontSize: "16px",
                ":hover": { opacity: "90%" },
              }}
              color="primary"
            >
              OK
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
      <>
        {plans.length > 0 && currentPlan?.id && (
          <>
            <Box>
              {open && selectedPlan && (
                <Dialog
                  open={open}
                  fullWidth
                  maxWidth="md"
                  sx={{
                    "& .MuiPaper-root": {
                      padding: "8px",
                    },
                    "& .MuiBackdrop-root": {
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                      backdropFilter: "blur(5px)",
                    },
                  }}
                >
                  <DialogContent className="p-0">
                    <Box className="relative">
                      <IconX
                        size={24}
                        className=" absolute top-0 right-0 cursor-pointer z-10"
                        onClick={() => setOpen(false)}
                      />
                    </Box>
                    <Box className="mb-6">
                      <Box className="space-y-2 my-10 mx-8">
                        <Box className="flex justify-between">
                          <Typography className="font-bold text-[#686868]">
                            Sub Total
                          </Typography>
                          <Typography className="font-bold text-[#686868]">
                            {billingModel === "MONTHLY"
                              ? selectedPlan.price.toFixed(2)
                              : selectedPlan.yearly_price.toFixed(2)}
                            €
                          </Typography>
                        </Box>
                        <Box className="flex justify-between">
                          <Typography className="font-bold text-[#686868]">
                            VAT {vat}%
                          </Typography>
                          <Typography className="font-bold text-[#686868]">
                            {billingModel === "MONTHLY"
                              ? (selectedPlan.price * (vat / 100)).toFixed(2)
                              : (
                                  selectedPlan.yearly_price *
                                  (vat / 100)
                                ).toFixed(2)}
                            €
                          </Typography>
                        </Box>
                        <Box className="flex justify-between">
                          <Typography className="font-bold text-lg">
                            Total
                          </Typography>
                          <Typography className="font-bold text-lg">
                            {billingModel === "MONTHLY"
                              ? (
                                  selectedPlan.price +
                                  selectedPlan.price * (vat / 100)
                                ).toFixed(2)
                              : (
                                  selectedPlan.yearly_price +
                                  selectedPlan.yearly_price * (vat / 100)
                                ).toFixed(2)}
                            €
                          </Typography>
                        </Box>
                      </Box>
                      <Checkout
                        shopperReference={
                          session?.user?.shopper_reference as any
                        }
                        total={calculateTotal()}
                        handleSubmit={handleSubmit}
                      />
                    </Box>
                  </DialogContent>
                </Dialog>
              )}
            </Box>
            <Box>
              <Box className="flex flex-col gap-2 items-center">
                <Image
                  src={currentPlanImage}
                  alt="plan"
                  width={100}
                  height={100}
                />
                <Typography className="text-primary-main text-center">
                  {t("your_current_plan:", keys)}{" "}
                  <Typography className="text-lg font-bold">
                    {currentPlan?.name}
                  </Typography>
                </Typography>

                <Typography className="font-semibold">
                  {t("your_next_payment_will_be_on", keys)}{" "}
                  {moment(session.user.next_payment_on).format("DD/MM/YYYY")})
                </Typography>
                <Box className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => setOpenDetails(true)}
                    variant="contained"
                    className="px-2 h-[40px] rounded-xl w-[max-content] min-w-[172px]"
                  >
                    {t("view_details", keys)}
                  </Button>
                  <Button
                    onClick={() => setOpenTransactions(true)}
                    variant="contained"
                    className="px-2 h-[40px] rounded-xl w-[max-content]"
                  >
                    {t("view_purchase_history", keys)}
                  </Button>
                </Box>
              </Box>
              <Box className="mt-12">
                <Typography className="font-semibold text-xl text-center">
                  {t("flexible_plans_tailored_to_your_needs", keys)}
                </Typography>
                <Box className="flex justify-center items-center mt-4 gap-4">
                  <Typography className="font-medium">
                    {t("monthly", keys)}
                  </Typography>

                  <CustomSwitch
                    checked={billingModel === "YEARLY"}
                    onChange={(event) =>
                      setBillingModel(
                        event.target.checked ? "YEARLY" : "MONTHLY"
                      )
                    }
                    sx={{
                      "& .MuiSwitch-thumb": {
                        backgroundColor: "#FFFFFF",
                      },
                      "& .MuiSwitch-track": {
                        backgroundColor: "#2276FF",
                        opacity: 1,
                      },
                      "& .Mui-checked + .MuiSwitch-track": {
                        backgroundColor: "#2276FF",
                        opacity: 1,
                      },
                    }}
                  />

                  <Typography className="font-medium">
                    {t("yearly", keys)}
                  </Typography>
                </Box>

                <Box className="flex flex-wrap gap-8 mt-8 justify-center">
                  {sortedPlans.map((plan, idx) => {
                    const planPrice =
                      billingModel === "MONTHLY"
                        ? plan.price
                        : plan.yearly_price;

                    let imagePath = "/images/logos/basicPlanLogo.png";
                    if (allPricesEqual) {
                      imagePath = "/images/logos/premiumPlanLogo.png";
                    } else if (planPrice === highestPrice) {
                      imagePath = "/images/logos/premiumPlanLogo.png";
                    } else if (planPrice === secondHighestPrice) {
                      imagePath = "/images/logos/goldPlanLogo.png";
                    }
                    const isSelectedPlan =
                      session.user.subscription_id === plan?.id;
                    return (
                      <Box
                        key={idx}
                        className={`space-y-2 text-nowrap border-2 py-8 px-16 rounded-lg flex flex-col gap-4 items-center 
                        ${
                          isSelectedPlan
                            ? "border-[#2276FF]"
                            : "border-gray-300"
                        }`}
                      >
                        <Typography className="font-bold text-[1.1rem] flex gap-1 text-primary-main">
                          {plan.name}
                        </Typography>

                        {/* Dynamic Image Rendering */}
                        <Image
                          src={imagePath}
                          alt="plan"
                          width={100}
                          height={100}
                        />

                        <Typography className="font-bold text-[1.1rem] flex gap-1 text-primary-main">
                          {billingModel === "MONTHLY" ? (
                            <>
                              {plan.price}€{" "}
                              <Typography className="text-sm font-bold">
                                /{t("monthly", keys)}
                              </Typography>
                            </>
                          ) : (
                            <>
                              {plan.yearly_price}€{" "}
                              <Typography className="text-sm font-bold">
                                /{t("yearly", keys)}
                              </Typography>
                            </>
                          )}
                        </Typography>

                        {/* Features Section */}
                        <Box className="space-y-2">
                          {features
                            .filter((f) =>
                              plan.subscription_feature.includes(f.id)
                            )
                            .map((f) => (
                              <Box
                                key={f.id}
                                className="flex items-center gap-1"
                              >
                                <IconCircleCheck className="text-primary-main" />
                                <Typography>{f.name}</Typography>
                              </Box>
                            ))}
                          {features
                            .filter(
                              (f) => !plan.subscription_feature.includes(f.id)
                            )
                            .map((f) => (
                              <Box
                                key={f.id}
                                className="flex items-center gap-1"
                              >
                                <IconCircleX className="text-red-500" />
                                <Typography>{f.name}</Typography>
                              </Box>
                            ))}
                        </Box>

                        {/* Conditional Button */}
                        {(session?.user?.roles?.includes("Owner") ||
                          (session?.user?.roles?.includes("BackOfficeUser") &&
                            checkAccess(
                              session.user.accessrights
                                ?.controls as AccessRights2,
                              "/admin/plans",
                              "edit"
                            ))) && (
                          <Button
                            onClick={() => {
                              if (currentPlan.id === plan.id) {
                                if (session.user.billing_model === "MONTHLY") {
                                  setBillingModel("YEARLY");
                                } else {
                                  setBillingModel("MONTHLY");
                                }
                              }
                              setSelectedPlan(plan);
                              setOpen(true);
                            }}
                            variant="contained"
                            className="w-full mb-8"
                            sx={{
                              height: "56px",
                              fontSize: "16px",
                              ":hover": { opacity: "90%" },
                            }}
                            color="primary"
                          >
                            {currentPlan.id === plan.id
                              ? session.user.billing_model === "MONTHLY"
                                ? t("switch_to_yearly", keys)
                                : t("switch_to_monthly", keys)
                              : t("buy_now", keys)}
                          </Button>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          </>
        )}
      </>
    </Box>
  );
};

export default Payment;
