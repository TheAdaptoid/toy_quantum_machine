import { useEffect } from "react";
import { Box, Button, Slider, Stack, Tooltip, Typography } from "@mui/material";

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
        p: 3,
        borderRadius: 3,
        bgcolor: "rgba(8,10,25,0.9)",
        border: "1px solid rgba(118,141,234,0.25)",
      }}
      role="region"
      aria-label="Circuit execution controls"
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={3}
        alignItems="center"
      >
        <Stack direction="row" spacing={1}>
          <Tooltip title="Previous step (← Left Arrow)">
            <span>
              <Button
                variant="outlined"
                color="secondary"
                onClick={onStepBack}
                disabled={currentStep === 0}
                aria-label="Step backward"
                sx={{ minHeight: 44 }}
              >
                Step back
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Next step (→ Right Arrow)">
            <span>
              <Button
                variant="contained"
                color="primary"
                onClick={onStepForward}
                disabled={currentStep >= totalSteps - 1}
                aria-label="Step forward"
                sx={{ minHeight: 44 }}
              >
                Step forward
              </Button>
            </span>
          </Tooltip>
        </Stack>
        <Box sx={{ flexGrow: 1, width: "100%" }}>
          <Typography
            variant="caption"
            sx={{ textTransform: "uppercase", letterSpacing: 2, mb: 0.5 }}
          >
            Execution step {currentStep} of {totalSteps - 1}
          </Typography>
          <Slider
            size="medium"
            value={currentStep}
            min={0}
            max={Math.max(0, totalSteps - 1)}
            step={1}
            onChange={(_, value) => onJump(value as number)}
            sx={{
              color: "primary.light",
              "& .MuiSlider-track": { height: 6 },
              "& .MuiSlider-rail": { height: 6 },
            }}
            valueLabelDisplay="auto"
            aria-label="Jump to execution step"
          />
        </Box>
      </Stack>
    </Box>
  );
}
