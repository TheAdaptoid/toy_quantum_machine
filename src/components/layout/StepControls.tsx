import { Box, Button, Slider, Stack, Typography } from '@mui/material'

interface StepControlsProps {
    currentStep: number
    totalSteps: number
    onStepBack: () => void
    onStepForward: () => void
    onJump: (step: number) => void
}

export function StepControls({ currentStep, totalSteps, onStepBack, onStepForward, onJump }: StepControlsProps) {
    return (
        <Box sx={{ p: 3, borderRadius: 3, bgcolor: 'rgba(8,10,25,0.9)', border: '1px solid rgba(118,141,234,0.25)' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" color="secondary" onClick={onStepBack} disabled={currentStep === 0}>
                        Step back
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={onStepForward}
                        disabled={currentStep >= totalSteps - 1}
                    >
                        Step forward
                    </Button>
                </Stack>
                <Box sx={{ flexGrow: 1, width: '100%' }}>
                    <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 2 }}>
                        Execution step
                    </Typography>
                    <Slider
                        size="small"
                        value={currentStep}
                        min={0}
                        max={Math.max(0, totalSteps - 1)}
                        step={1}
                        onChange={(_, value) => onJump(value as number)}
                        sx={{ color: 'primary.light' }}
                        valueLabelDisplay="auto"
                    />
                </Box>
            </Stack>
        </Box>
    )
}
