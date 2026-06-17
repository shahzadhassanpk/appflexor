import React from "react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null, errorInfo: null };
    }

    componentDidCatch(error, errorInfo) {
        // Catch errors in any components below and re-render with error message
        this.setState({
            error: error,
            errorInfo: errorInfo,
        });
        // You can also log error messages to an error reporting service here
    }

    render() {
        if (this.state.errorInfo) {
            // Error path
            return (
                <div>
                    <h2>Something went wrong.</h2>
<<<<<<< HEAD
                    <link
                        rel="stylesheet"
                        href="#"
                        onClick={() => {
                            window.location.reload();
                        }}>
                        Try refresh
                    </link>
=======
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            window.location.reload();
                        }}>
                        Try refresh
                    </a>
>>>>>>> a9f11ccabec603523e899507567e9dd5c08d8ba1
                    {/* {this.state.error && this.state.error.toString()} */}
                </div>
            );
        }
        // Normally, just render children
        return this.props.children;
    }
}
export { ErrorBoundary };
