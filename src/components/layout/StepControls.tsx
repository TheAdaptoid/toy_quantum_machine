import { useEffect } from "react";
import {
  Box,
  IconButton,
  Slider,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import SkipPreviousRoundedIcon from "@mui/icons-material/SkipPreviousRounded";
import SkipNextRoundedIcon from "@mui/icons-material/SkipNextRounded";

interface StepControlsProps {
  currentStep: number;
  totalSteps: number;
  onStepBack: () => void;
  onStepForward: () => void;
  onJump: (step: number) => void;
}

export function StepControls({
  currentStep,
  totalSteps,
  onStepBack,
  onStepForward,
  onJump,
}: StepControlsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if no input is focused
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (event.key === "ArrowLeft" && currentStep > 0) {
        event.preventDefault();
        onStepBack();
      } else if (event.key === "ArrowRight" && currentStep < totalSteps - 1) {
        event.preventDefault();
        onStepForward();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, totalSteps, onStepBack, onStepForward]);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        px: 2,
        py: 1,
        borderRadius: 3,
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
      }}
      role="region"
      aria-label="Circuit execution controls"
    >
      {/* Step back button */}
      <Tooltip title="Previous step (← Left Arrow)">
        <span>
          <IconButton
            onClick={onStepBack}
            disabled={currentStep === 0}
            aria-label="Step backward"
            size="small"
            sx={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              color: currentStep === 0 ? "text.secondary" : "text.primary",
              transition: "all 0.2s ease",
              "&:hover:not(:disabled)": {
                background: "rgba(0, 245, 212, 0.1)",
                borderColor: "rgba(0, 245, 212, 0.3)",
                boxShadow: "0 0 12px rgba(0, 245, 212, 0.2)",
              },
              "&:disabled": {
                opacity: 0.4,
              },
            }}
          >
            <SkipPreviousRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </span>
      </Tooltip>

      {/* Step indicator and slider */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ minWidth: 160 }}
      >
        <Typography
          variant="caption"
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: "0.7rem",
            color: "text.secondary",
            whiteSpace: "nowrap",
          }}
        >
          <Box
            component="span"
            sx={{
              color: "primary.main",
              fontWeight: 600,
            }}
          >
            {currentStep}
          </Box>
          <Box component="span" sx={{ opacity: 0.5, mx: 0.5 }}>
            /
          </Box>
          {totalSteps - 1}
        </Typography>
        <Slider
          size="small"
          value={currentStep}
          min={0}
          max={Math.max(0, totalSteps - 1)}
          step={1}
          onChange={(_, value) => onJump(value as number)}
          sx={{
            width: 100,
            "& .MuiSlider-thumb": {
              width: 14,
              height: 14,
            },
          }}
          valueLabelDisplay="auto"
          aria-label="Jump to execution step"
        />
      </Stack>

      {/* Step forward button */}
      <Tooltip title="Next step (→ Right Arrow)">
        <span>
          <IconButton
            onClick={onStepForward}
            disabled={currentStep >= totalSteps - 1}
            aria-label="Step forward"
            size="small"
            sx={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, rgba(0, 245, 212, 0.15) 0%, rgba(247, 37, 133, 0.1) 100%)",
              border: "1px solid rgba(0, 245, 212, 0.2)",
              color:
                currentStep >= totalSteps - 1
                  ? "text.secondary"
                  : "primary.main",
              transition: "all 0.2s ease",
              "&:hover:not(:disabled)": {
                background:
                  "linear-gradient(135deg, rgba(0, 245, 212, 0.25) 0%, rgba(247, 37, 133, 0.15) 100%)",
                borderColor: "rgba(0, 245, 212, 0.4)",
                boxShadow: "0 0 16px rgba(0, 245, 212, 0.3)",
              },
              "&:disabled": {
                opacity: 0.4,
              },
            }}
          >
            <SkipNextRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
}
