import { memo } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Box, Chip, Stack, Tooltip, Typography } from '@mui/material'
import { GATE_LIST } from '@/simulation/gates'

export function GatePalette() {
    return (
        <Box sx={{ p: 3, borderRadius: 3, bgcolor: 'rgba(7,11,24,0.85)', border: '1px solid rgba(128,152,231,0.25)' }}>
            <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: 2, color: 'primary.light', mb: 1 }}>
                Gate Palette
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                {GATE_LIST.map((gate) => (
                    <GateChip key={gate.name} gate={gate} />
                ))}
            </Stack>
        </Box>
    )
}

const GateChip = memo(({ gate }: { gate: (typeof GATE_LIST)[number] }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `gate-${gate.name}`,
        data: { gateName: gate.name, arity: gate.arity },
    })

    return (
        <Tooltip title={
            <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{gate.description}</Typography>
                <Typography variant="caption" component="div" sx={{ fontFamily: '"IBM Plex Mono", monospace' }}>
                    {gate.tooltipLatex}
                </Typography>
            </Box>
        }>
            <Chip
                ref={setNodeRef}
                {...listeners}
                {...attributes}
                label={`${gate.label}${gate.arity > 1 ? ' (multi)' : ''}`}
                sx={{
                    bgcolor: gate.color,
                    color: '#05060a',
                    fontWeight: 600,
                    cursor: 'grab',
                    userSelect: 'none',
                    boxShadow: isDragging ? '0 0 0 2px rgba(255,255,255,0.5)' : 'none',
                    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : 'none',
                    transition: 'box-shadow 150ms ease',
                }}
            />
        </Tooltip>
    )
})

GateChip.displayName = 'GateChip'
