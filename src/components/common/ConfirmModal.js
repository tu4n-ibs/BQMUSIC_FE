import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import './ConfirmModal.css';

const ConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = "Confirm", 
    cancelText = "Cancel",
    type = "danger" // 'danger' or 'primary'
}) => {
    if (!isOpen) return null;

    return (
        <div className="confirm-modal-overlay" onClick={onClose}>
            <div className="confirm-modal-content" onClick={e => e.stopPropagation()}>
                <button className="confirm-modal-close" onClick={onClose}>
                    <X size={20} />
                </button>
                
                <div className="confirm-modal-body">
                    <div className={`confirm-modal-icon ${type}`}>
                        <AlertCircle size={32} />
                    </div>
                    <h3>{title}</h3>
                    <p>{message}</p>
                </div>

                <div className="confirm-modal-footer">
                    <button className="btn-cancel" onClick={onClose}>
                        {cancelText}
                    </button>
                    <button 
                        className={`btn-confirm ${type}`} 
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
