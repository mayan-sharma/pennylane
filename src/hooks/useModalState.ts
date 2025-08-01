import { useState, useCallback, useEffect } from 'react';

interface ModalState {
  isOpen: boolean;
  data: any;
}

export const useModalState = <T = any>(initialState: boolean = false) => {
  const [state, setState] = useState<ModalState>({
    isOpen: initialState,
    data: null
  });

  const openModal = useCallback((data?: T) => {
    setState({
      isOpen: true,
      data: data || null
    });
  }, []);

  const closeModal = useCallback(() => {
    setState({
      isOpen: false,
      data: null
    });
  }, []);

  const toggleModal = useCallback((data?: T) => {
    setState(prev => ({
      isOpen: !prev.isOpen,
      data: !prev.isOpen ? (data || null) : null
    }));
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && state.isOpen) {
        closeModal();
      }
    };

    if (state.isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [state.isOpen, closeModal]);

  return {
    isOpen: state.isOpen,
    data: state.data as T,
    openModal,
    closeModal,
    toggleModal
  };
};