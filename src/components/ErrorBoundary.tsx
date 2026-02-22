import { Component, type ReactNode } from "react";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string }) {
    console.error("Error boundary caught an error:", error, errorInfo);
    this.setState({
      errorInfo: errorInfo.componentStack || null,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
          }}
        >
          <Container maxWidth="md">
            <Box
              sx={{
                p: 4,
                borderRadius: 4,
                background: "rgba(12, 15, 30, 0.8)",
                backdropFilter: "blur(24px) saturate(180%)",
                WebkitBackdropFilter: "blur(24px) saturate(180%)",
                border: "1px solid rgba(247, 37, 133, 0.2)",
                boxShadow: `
                  0 24px 80px rgba(0, 0, 0, 0.5),
                  0 0 60px rgba(247, 37, 133, 0.08),
                  inset 0 1px 0 rgba(255, 255, 255, 0.03)
                `,
              }}
            >
              <Stack spacing={3}>
                {/* Header */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 3,
                      background:
                        "linear-gradient(135deg, rgba(247, 37, 133, 0.2) 0%, rgba(123, 44, 191, 0.2) 100%)",
                      border: "1px solid rgba(247, 37, 133, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ErrorOutlineRoundedIcon
                      sx={{ fontSize: 28, color: "#f72585" }}
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 600,
                        background:
                          "linear-gradient(135deg, #ff8a80 0%, #f72585 100%)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      Something went wrong
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      The quantum playground encountered an unexpected error
                    </Typography>
                  </Box>
                </Box>

                {/* Error message */}
                {this.state.error && (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      background: "rgba(247, 37, 133, 0.08)",
                      border: "1px solid rgba(247, 37, 133, 0.15)",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: "0.8rem",
                        color: "#ff8a80",
                        wordBreak: "break-word",
                      }}
                    >
                      {this.state.error.toString()}
                    </Typography>
                  </Box>
                )}

                {/* Stack trace */}
                {this.state.errorInfo && (
                  <Box
                    sx={{
                      maxHeight: 180,
                      overflow: "auto",
                      p: 2,
                      borderRadius: 2,
                      background: "rgba(0, 0, 0, 0.2)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    <Typography
                      variant="caption"
                      component="pre"
                      sx={{
                        fontFamily: '"JetBrains Mono", monospace',
                        color: "text.secondary",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        fontSize: "0.65rem",
                        lineHeight: 1.6,
                      }}
                    >
                      {this.state.errorInfo}
                    </Typography>
                  </Box>
                )}

                {/* Actions */}
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    onClick={this.handleReset}
                    startIcon={<RefreshRoundedIcon />}
                    sx={{ px: 3 }}
                  >
                    Reload Application
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      this.setState({
                        hasError: false,
                        error: null,
                        errorInfo: null,
                      });
                    }}
                    startIcon={<PlayArrowRoundedIcon />}
                    sx={{ px: 3 }}
                  >
                    Try to Continue
                  </Button>
                </Stack>

                {/* Tip */}
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    opacity: 0.7,
                    fontSize: "0.7rem",
                  }}
                >
                  Tip: If this persists, try clearing your browser cache or
                  loading a fresh circuit
                </Typography>
              </Stack>
            </Box>
          </Container>
        </Box>
      );
    }

    return this.props.children;
  }
}
