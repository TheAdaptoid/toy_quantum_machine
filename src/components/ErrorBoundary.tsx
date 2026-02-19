import { Component, type ReactNode } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

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
            <Paper
              elevation={3}
              sx={{
                p: 4,
                borderRadius: 3,
                border: "1px solid rgba(236,95,103,0.3)",
              }}
            >
              <Stack spacing={3}>
                <Box>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 600, color: "error.main", mb: 1 }}
                  >
                    Oops! Something went wrong
                  </Typography>
                  <Typography variant="body1" sx={{ color: "text.secondary" }}>
                    The quantum playground encountered an unexpected error.
                    Don't worry—your browser's quantum state is still intact!
                  </Typography>
                </Box>

                {this.state.error && (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "rgba(236,95,103,0.08)",
                      border: "1px solid rgba(236,95,103,0.2)",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: '"IBM Plex Mono", monospace',
                        color: "error.light",
                        wordBreak: "break-word",
                      }}
                    >
                      {this.state.error.toString()}
                    </Typography>
                  </Box>
                )}

                {this.state.errorInfo && (
                  <Box
                    sx={{
                      maxHeight: 200,
                      overflow: "auto",
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <Typography
                      variant="caption"
                      component="pre"
                      sx={{
                        fontFamily: '"IBM Plex Mono", monospace',
                        color: "text.secondary",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        fontSize: "0.7rem",
                      }}
                    >
                      {this.state.errorInfo}
                    </Typography>
                  </Box>
                )}

                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={this.handleReset}
                    size="large"
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
                  >
                    Try to Continue
                  </Button>
                </Stack>

                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", fontStyle: "italic" }}
                >
                  Tip: If this error persists, try clearing your browser's cache
                  or loading a fresh circuit.
                </Typography>
              </Stack>
            </Paper>
          </Container>
        </Box>
      );
    }

    return this.props.children;
  }
}
