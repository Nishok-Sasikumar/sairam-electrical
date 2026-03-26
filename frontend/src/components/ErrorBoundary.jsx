import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white p-12 text-center">
          <div className="max-w-md">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">System Malfunction.</h2>
            <p className="text-slate-500 mb-10 font-medium leading-relaxed">
              We encountered an unexpected error while processing your request. Please try refreshing the page.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-primary text-white px-10 py-4 rounded-full font-bold shadow-glow hover:shadow-primary/30 transition-all"
            >
              Refresh Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
