import React from "react"

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, errorMessage: "" }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || "Something went wrong.",
    }
  }

  componentDidCatch(error, info) {
    if (typeof this.props?.onError === "function") {
      this.props.onError(error, info)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: "" })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-700 font-semibold mb-2">Unexpected Error</div>
          <div className="text-red-600 text-sm mb-4">{this.state.errorMessage}</div>
          <button
            type="button"
            onClick={this.handleRetry}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
