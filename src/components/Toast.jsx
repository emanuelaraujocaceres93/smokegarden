import React from 'react';
import { Toaster } from 'react-hot-toast'

const toastStyle = {
  background: '#1A1A1A',
  color: '#E0E0E0',
  border: '1px solid #333',
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.28)'
}

export default function Toast() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: toastStyle,
        success: {
          style: {
            ...toastStyle,
            background: '#2E7D32'
          }
        },
        error: {
          style: {
            ...toastStyle,
            background: '#C62828'
          }
        }
      }}
    />
  )
}
