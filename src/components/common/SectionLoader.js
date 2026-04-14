import React from 'react';
import './SectionLoader.css';

const SectionLoader = ({ message = "Loading..." }) => {
    return (
        <div className="section-loader-container">
            <div className="modern-spinner"></div>
            {message && <p className="section-loader-text">{message}</p>}
        </div>
    );
};

export default SectionLoader;
