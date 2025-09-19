import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MicrophoneContextType {
  activeMicrophone: 'global' | 'edit' | null;
  requestMicrophone: (type: 'global' | 'edit') => boolean;
  releaseMicrophone: (type: 'global' | 'edit') => void;
}

const MicrophoneContext = createContext<MicrophoneContextType | undefined>(undefined);

export const useMicrophoneCoordinator = () => {
  const context = useContext(MicrophoneContext);
  if (!context) {
    throw new Error('useMicrophoneCoordinator must be used within a MicrophoneProvider');
  }
  return context;
};

interface MicrophoneProviderProps {
  children: ReactNode;
}

export const MicrophoneProvider: React.FC<MicrophoneProviderProps> = ({ children }) => {
  const [activeMicrophone, setActiveMicrophone] = useState<'global' | 'edit' | null>(null);

  const requestMicrophone = (type: 'global' | 'edit'): boolean => {
    console.log(`Requesting microphone access for: ${type}, current active: ${activeMicrophone}`);
    
    if (activeMicrophone === null || activeMicrophone === type) {
      setActiveMicrophone(type);
      return true;
    }
    
    console.log(`Microphone denied - ${activeMicrophone} is currently active`);
    return false;
  };

  const releaseMicrophone = (type: 'global' | 'edit') => {
    console.log(`Releasing microphone for: ${type}, current active: ${activeMicrophone}`);
    
    if (activeMicrophone === type) {
      setActiveMicrophone(null);
    }
  };

  return (
    <MicrophoneContext.Provider
      value={{
        activeMicrophone,
        requestMicrophone,
        releaseMicrophone,
      }}
    >
      {children}
    </MicrophoneContext.Provider>
  );
};