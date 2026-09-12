import React from \'react\';
export class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() { if (this.state.hasError) return <div style={{color:'red', padding:'20px'}}><h1>React Crash</h1><pre>{this.state.error.toString()}\n{this.state.error.stack}</pre></div>; return this.props.children; }
}
