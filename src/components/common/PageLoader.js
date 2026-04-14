import React from 'react';
import './PageLoader.css';

const PageLoader = ({ message = "Loading..." }) => {
    return (
        <div className="page-loader-overlay">
            <div className="loader-container">
                <div className="premium-spinner">
                    <div className="spinner-inner"></div>
                    <div className="spinner-glow"></div>
                </div>
                <div className="loader-text-wrapper">
                    <span className="loader-text">{message}</span>
                    <div className="loader-progress-bar">
                        <div className="progress-fill"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PageLoader;
