import * as React from "react";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material";
import StepConnector from "@mui/material/StepConnector";
import { styled } from "@mui/material/styles";
import { StepIconProps } from "@mui/material/StepIcon";
import CheckIcon from "@mui/icons-material/Check";
import { t } from "../../../lib/translationHelper";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "@/store/Store";

interface Props {
  steps: string[];
  activeStep: number;
  onStepClick?: (step: number) => void;
  bgColor?: string;
  completedColor?: string;
  upcomingColor?: string;
  lineColor?: string;
  stepNumberStyle?: React.CSSProperties;
  comingLabelColor?: string;
  completedCheckIconColor?: string;
}

const HorizontalStepper = ({
  steps,
  activeStep,
  onStepClick,
  bgColor = "#fff",
  completedColor = "#1976d2",
  upcomingColor = "#A1AEBE",
  lineColor = "#1976d2",
  comingLabelColor = "#A1AEBE",
  completedCheckIconColor = "#fff",
  stepNumberStyle = {},
}: Props) => {
  const [loading, setLoading] = useState(false);
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  const theme = useTheme();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "stepper" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translations:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);

  const CustomConnector = styled(StepConnector)(() => ({
    "& .MuiStepConnector-line": {
      borderColor: lineColor,
      marginTop: -10,
      marginLeft: 10,
      marginRight: 10,
      borderWidth: "1px",
      left: 0,
    },
  }));

  const CustomStepIcon = (props: StepIconProps) => {
    const { active = false, completed = false, icon } = props;
    const formattedIcon =
      icon && typeof icon === "number" && icon < 10 ? `0${icon}` : icon;

    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: "50%",
          width: 40,
          height: 40,
          borderWidth: 2.5,
          borderStyle: "solid",
          borderColor: active || completed ? completedColor : upcomingColor,
          backgroundColor: completed ? completedColor : "transparent",
          color: completed
            ? "#fff"
            : active
            ? completedColor
            : theme.palette.grey[900],
          fontWeight: 700,
          fontSize: "14px",
          ...stepNumberStyle,
        }}
      >
        {completed ? (
          <CheckIcon sx={{ fontSize: 22, color: completedCheckIconColor }} />
        ) : (
          formattedIcon
        )}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        width: "100%",
        background: bgColor,
        padding: "1rem 2rem",
        borderRadius: "10px",
      }}
    >
      <Stepper
        activeStep={activeStep}
        connector={<CustomConnector />}
        sx={{
          "& .MuiStep-root": {
            "& .MuiStepLabel-root": {
              alignItems: "center",
              flexDirection: "column",
            },
            "& .MuiStepLabel-label": {
              color: comingLabelColor, 
              fontWeight: 700,
              fontSize: "12px",
              marginTop: "0.5rem",
              transition: "color 0.3s ease",
            },
            "& .MuiStepLabel-label.Mui-completed": {
              color: completedColor,
            },
            "& .MuiStepLabel-label.Mui-active": {
              color: completedColor,
            },
          },
        }}
      >
        {steps.map((label, index) => (
          <Step key={label} 
          // onClick={() => onStepClick?.(index)}
          >
            <StepLabel StepIconComponent={CustomStepIcon}>
              {t(label, keys)}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default HorizontalStepper;
