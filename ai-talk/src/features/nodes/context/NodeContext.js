// src/context/NodeContext.js
import React, { createContext, useContext } from 'react';
import { useNodeOperations } from '../hooks/useNodeOperations';

export const NodeContext = createContext(null);

export const NodeProvider = ({ children }) => {
  const nodeOperations = useNodeOperations();
  
  return (
    <NodeContext.Provider value={nodeOperations}>
      {children}
    </NodeContext.Provider>
  );
};

export const useNode = () => {
  const context = useContext(NodeContext);
  if (!context) {
    throw new Error('useNode must be used within a NodeProvider');
  }
  return context;
};